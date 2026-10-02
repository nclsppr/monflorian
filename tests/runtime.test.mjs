import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import test, { after } from 'node:test';
import { build } from 'esbuild';
import { itineraryOutput, pngDataUrl } from './helpers.mjs';
import { encryptJson, tripExpiresAt } from '../app/trips.mjs';
import { researchedRequest, researchedItinerary, researchResponse } from './researched-fixtures.mjs';

const directory = await mkdtemp(join(tmpdir(), 'monflorian-runtime-'));
const bundle = join(directory, 'worker.mjs');
await build({ entryPoints: ['src/worker.ts'], outfile: bundle, bundle: true, platform: 'node', format: 'esm',
  plugins: [{ name: 'workflow-test-runtime', setup(api) {
    api.onResolve({ filter: /^cloudflare:workers$/ }, () => ({ path: 'workers', namespace: 'test' }));
    api.onLoad({ filter: /.*/, namespace: 'test' }, () => ({ contents: 'export class WorkflowEntrypoint { constructor(ctx, env) { this.env = env; } }' }));
  } }],
});
const { default: worker, TripWorkflow } = await import(pathToFileURL(bundle));
after(() => rm(directory, { recursive: true, force: true }));

async function environment(overrides = {}) {
  const sql = new DatabaseSync(':memory:');
  for (const name of (await readdir('migrations')).filter((name) => name.endsWith('.sql')).sort()) sql.exec(await readFile(`migrations/${name}`, 'utf8'));
  const statement = (query, values = []) => ({
    bind: (...bindings) => statement(query, bindings),
    run: async () => ({ meta: { changes: sql.prepare(query).run(...values).changes } }),
    first: async () => sql.prepare(query).get(...values) ?? null,
    all: async () => ({ results: sql.prepare(query).all(...values) }),
  });
  const objects = new Map();
  const jobs = [];
  const env = {
    DB: { prepare: statement, batch: async (statements) => {
      sql.exec('BEGIN');
      try { const results = []; for (const item of statements) results.push(await item.run()); sql.exec('COMMIT'); return results; }
      catch (error) { sql.exec('ROLLBACK'); throw error; }
    } },
    MEDIA: {
      put: async (key, value) => objects.set(key, new Uint8Array(value)),
      get: async (key) => objects.has(key) ? { body: objects.get(key), arrayBuffer: async () => objects.get(key).buffer } : null,
      delete: async (keys) => { for (const key of Array.isArray(keys) ? keys : [keys]) objects.delete(key); },
    },
    TRIP_WORKFLOW: { create: async (job) => { jobs.push(job); return { id: job.id }; } },
    ASSETS: { fetch: async () => new Response('asset') },
    TRIP_DATA_KEY: Buffer.alloc(32, 5).toString('base64'), TRIP_QUOTA_HASH_KEY: Buffer.alloc(32, 6).toString('base64'),
    OPENAI_API_KEY: 'synthetic-test-key', TURNSTILE_SECRET_KEY: 'synthetic-secret', TURNSTILE_SITE_KEY: 'synthetic-site',
    MONFLORIAN_ACCESS_MODE: 'public', MONFLORIAN_GENERATION_ENABLED: 'true', MONFLORIAN_TRIP_CREATION_ENABLED: 'true',
    MONFLORIAN_RESEARCH_ENABLED: 'true', MONFLORIAN_ILLUSTRATION_ENABLED: 'true', MONFLORIAN_EMAIL_ENABLED: 'false',
    MONFLORIAN_ALLOWED_ORIGINS: 'https://monflorian.com', MONFLORIAN_PUBLIC_ORIGIN: 'https://monflorian.com',
    MONFLORIAN_RELEASE: 'test', MONFLORIAN_DAILY_GLOBAL_LIMIT: '10', MONFLORIAN_DAILY_CLIENT_LIMIT: '2', BOOKING_MODE: 'external',
    OPENAI_TEXT_MODEL: 'test-model', OPENAI_IMAGE_MODEL: 'test-image', ...overrides,
  };
  return { env, sql, objects, jobs };
}

function request(path, body, id = crypto.randomUUID()) {
  return new Request(`https://monflorian.com${path}`, { method: 'POST', headers: {
    Origin: 'https://monflorian.com', 'Content-Type': 'application/json', 'Idempotency-Key': id, 'CF-Connecting-IP': '192.0.2.3',
  }, body: JSON.stringify(body) });
}
const brief = { brief: 'Une journée à Porto pour marcher et prendre le temps.', destination: 'Porto', durationDays: 1,
  travelers: 2, pace: 'calm', transportMode: 'none', photos: [], photoConsent: false, turnstileToken: 'synthetic-turnstile-token' };
const step = { do: async (_name, _options, fn) => fn() };
function mockProvider(t, onGenerate) {
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    if (String(url).includes('turnstile')) return Response.json({ success: true, action: 'create-trip', hostname: 'monflorian.com' });
    if (String(url).endsWith('/responses')) {
      const body = JSON.parse(options.body);
      if (body.tools) return Response.json(researchResponse());
      await onGenerate?.();
      const result = researchedItinerary(researchedRequest({ destination: 'Porto', departureCity: null, budgetTotalEur: null,
        requestedDays: 1, startDate: null, endDate: null, transportMode: 'none' }));
      return Response.json({ status: 'completed', output_text: JSON.stringify(result), usage: { input_tokens: 100, output_tokens: 100 } });
    }
    if (String(url).endsWith('/images/edits')) return Response.json({ error: { code: 'unavailable' } }, { status: 503 });
    throw new Error(`Unexpected external call: ${new URL(url).origin}`);
  });
}

test('création sans paiement ni email, génération, lecture privée et suppression réelle', async (t) => {
  const { env, sql, jobs, objects } = await environment(); t.after(() => sql.close()); mockProvider(t);
  const id = crypto.randomUUID();
  const created = await worker.fetch(request('/api/v1/trips', brief, id), env);
  assert.equal(created.status, 202);
  const accepted = await created.json();
  const replay = await worker.fetch(request('/api/trips', brief, id), env);
  assert.equal((await replay.json()).privateUrl, accepted.privateUrl);
  assert.equal(jobs.length, 1);
  assert.equal(sql.prepare('SELECT sum(used) AS used FROM daily_quotas').get().used, 2);
  assert.equal(sql.prepare('SELECT email_ciphertext FROM trips').get().email_ciphertext, null);
  const run = await new TripWorkflow({}, env).run({ payload: jobs[0].params }, step);
  assert.equal(run.status, 'ready'); assert.equal(run.notificationStatus, 'skipped');
  const page = await worker.fetch(new Request(accepted.privateUrl), env);
  assert.match(await page.text(), /Porto à hauteur de carnet/);
  assert.match(page.headers.get('Cache-Control'), /no-store/);
  assert.match(page.headers.get('X-Robots-Tag'), /noindex/);
  const deleted = await worker.fetch(new Request(`${accepted.privateUrl}/supprimer`, { method: 'POST', headers: { Origin: 'https://monflorian.com' } }), env);
  assert.equal(deleted.status, 303);
  const stored = sql.prepare('SELECT * FROM trips').get();
  assert.equal(stored.status, 'deleted'); assert.equal(stored.request_ciphertext, null); assert.equal(stored.result_ciphertext, null);
  assert.equal(objects.size, 0);
});

test('une panne image conserve le carnet et supprime les photos sources', async (t) => {
  const { env, sql, jobs, objects } = await environment(); t.after(() => sql.close()); mockProvider(t);
  const created = await worker.fetch(request('/api/trips', { ...brief, photos: [pngDataUrl()], photoConsent: true }), env);
  assert.equal(created.status, 202); assert.equal(objects.size, 1);
  const accepted = await created.json();
  const run = await new TripWorkflow({}, env).run({ payload: jobs[0].params }, step);
  assert.equal(run.status, 'ready'); assert.equal(objects.size, 0);
  sql.prepare("UPDATE trips SET notification_status = 'failed'").run();
  const page = await worker.fetch(new Request(accepted.privateUrl), env);
  const html = await page.text();
  assert.match(html, /L’illustration n’a pas pu être créée/);
  assert.match(html, /L’email n’a pas pu être envoyé/);
  assert.match(html, /L’illustration n’a pas pu être créée[\s\S]*?mailto:support@monflorian.com[^<]*<\/a>[\s\S]*?<\/p>/);
  assert.match(html, /L’email n’a pas pu être envoyé[\s\S]*?mailto:support@monflorian.com[^<]*<\/a>[\s\S]*?<\/p>/);
  assert.doesNotMatch(html, /mailto:[^"]*\?/);
});

test('la suppression pendant un appel ne ressuscite pas les données', async (t) => {
  const { env, sql, jobs, objects } = await environment(); t.after(() => sql.close());
  let privateUrl;
  mockProvider(t, async () => {
    const response = await worker.fetch(new Request(`${privateUrl}/supprimer`, { method: 'POST', headers: { Origin: 'https://monflorian.com' } }), env);
    assert.equal(response.status, 303);
  });
  const response = await worker.fetch(request('/api/trips', { ...brief, photos: [pngDataUrl()], photoConsent: true }), env);
  privateUrl = (await response.json()).privateUrl;
  await new TripWorkflow({}, env).run({ payload: jobs[0].params }, step);
  const stored = sql.prepare('SELECT * FROM trips').get();
  assert.equal(stored.status, 'deleted'); assert.equal(stored.result_ciphertext, null); assert.equal(objects.size, 0);
});

test('quotas persistants, consentement et erreurs fournisseur restent bloquants', async (t) => {
  const { env, sql, jobs } = await environment(); t.after(() => sql.close()); mockProvider(t);
  const withoutConsent = await worker.fetch(request('/api/trips', { ...brief, photos: [pngDataUrl()] }), env);
  assert.equal(withoutConsent.status, 400); assert.equal(jobs.length, 0);
  for (const path of ['/api/trips', '/api/v1/trips']) {
    const withoutDeparture = await worker.fetch(request(path, { ...brief, transportMode: 'flight' }), env);
    assert.equal(withoutDeparture.status, 400);
    assert.equal((await withoutDeparture.json()).error.code, 'DEPARTURE_REQUIRED');
  }
  assert.equal(jobs.length, 0);
  assert.equal(sql.prepare('SELECT count(*) AS count FROM daily_quotas').get().count, 0);
  for (let i = 0; i < 2; i++) assert.equal((await worker.fetch(request('/api/trips', brief), env)).status, 202);
  const refusedId = crypto.randomUUID();
  assert.equal((await worker.fetch(request('/api/trips', brief, refusedId), env)).status, 429);
  assert.equal((await worker.fetch(request('/api/trips', brief, refusedId), env)).status, 429);
  assert.equal(sql.prepare("SELECT request_ciphertext FROM trips WHERE error_code = 'QUOTA_EXCEEDED'").get().request_ciphertext, null);
  assert.equal(jobs.length, 2);
  assert.equal(sql.prepare("SELECT used FROM daily_quotas ORDER BY used DESC").get().used, 2);
});

test('supprimer via une reprise pendant le téléversement ne recrée pas les photos', async (t) => {
  const { env, sql, objects, jobs } = await environment(); t.after(() => sql.close()); mockProvider(t);
  const id = crypto.randomUUID();
  const body = { ...brief, photos: [pngDataUrl()], photoConsent: true };
  const originalPut = env.MEDIA.put;
  env.MEDIA.put = async (key, value) => {
    const replay = await worker.fetch(request('/api/trips', body, id), env);
    const { privateUrl } = await replay.json();
    await worker.fetch(new Request(`${privateUrl}/supprimer`, { method: 'POST', headers: { Origin: 'https://monflorian.com' } }), env);
    await originalPut(key, value);
  };
  const result = await worker.fetch(request('/api/trips', body, id), env);
  assert.equal(result.status, 409); assert.equal(objects.size, 0); assert.equal(jobs.length, 0);
  assert.equal(sql.prepare('SELECT status FROM trips').get().status, 'deleted');
  assert.equal(sql.prepare('SELECT count(*) AS count FROM trip_assets WHERE deleted_at IS NULL').get().count, 0);
});

test('un retrait interrompu par R2 efface le texte et reprend au prochain nettoyage', async (t) => {
  const { env, sql, objects } = await environment(); t.after(() => sql.close()); mockProvider(t);
  const response = await worker.fetch(request('/api/trips', { ...brief, photos: [pngDataUrl()], photoConsent: true }), env);
  const { privateUrl } = await response.json();
  const originalDelete = env.MEDIA.delete;
  env.MEDIA.delete = async () => { throw new Error('storage temporarily unavailable'); };
  const removal = await worker.fetch(new Request(`${privateUrl}/supprimer`, { method: 'POST', headers: { Origin: 'https://monflorian.com' } }), env);
  assert.equal(removal.status, 500);
  const incomplete = sql.prepare('SELECT * FROM trips').get();
  assert.equal(incomplete.status, 'deleting'); assert.equal(incomplete.request_ciphertext, null);
  assert.equal(incomplete.research_ciphertext, null); assert.equal(objects.size, 1);
  env.MEDIA.delete = originalDelete;
  let cleanup;
  worker.scheduled({}, env, { waitUntil: (promise) => { cleanup = promise; } });
  await cleanup;
  assert.equal(sql.prepare('SELECT status FROM trips').get().status, 'deleted');
  assert.equal(objects.size, 0);
});

test('la rétention couvre le retour et reste bornée', () => {
  const now = Date.parse('2026-10-02T12:00:00Z');
  assert.equal(tripExpiresAt({}, now), now + 30 * 86400000);
  assert.ok(tripExpiresAt({ startDate: '2026-11-01', endDate: '2026-11-10' }, now) > Date.parse('2026-11-17'));
  assert.throws(() => tripExpiresAt({ startDate: '2026-09-30', endDate: '2026-10-01' }, now), { code: 'PAST_TRIP' });
  assert.throws(() => tripExpiresAt({ startDate: '2027-12-01', endDate: '2027-12-10' }, now), { code: 'TRIP_TOO_FAR' });
});

test('les routes privées malformées ne journalisent jamais le jeton', async (t) => {
  const { env, sql } = await environment(); t.after(() => sql.close());
  const entries = [];
  t.mock.method(console, 'log', (line) => entries.push(line));
  const token = 'sensitive-sentinel-'.repeat(3);
  for (const path of [`/voyages/${token}/`, `/voyages/${token}/inconnu`, `/api/trips/${token}/media/999`, `/api/v1/trips/${token}/inconnu`]) {
    await worker.fetch(new Request(`https://monflorian.com${path}`), env);
  }
  assert.equal(entries.length, 4);
  assert.ok(entries.every((line) => !line.includes(token)));
});

function assertPrivateErrorPage(response, html) {
  assert.match(response.headers.get('Content-Type'), /text\/html/);
  assert.match(response.headers.get('Cache-Control'), /no-store/);
  assert.equal(response.headers.get('Referrer-Policy'), 'no-referrer');
  assert.match(response.headers.get('X-Robots-Tag'), /noindex/);
  assert.match(response.headers.get('Content-Security-Policy'), /frame-ancestors 'none'/);
  assert.match(html, /href="\/error.css"/);
  assert.match(html, /href="mailto:support@monflorian.com"/);
  assert.doesNotMatch(html, /mailto:[^"]*\?/);
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
}

test('les pages privées distinguent les causes sans transmettre le lien au support', async (t) => {
  const { env, sql } = await environment(); t.after(() => sql.close()); mockProvider(t);
  const created = await worker.fetch(request('/api/trips', brief), env);
  const { privateUrl } = await created.json();
  const cases = [
    { status: 'failed', code: 'CONTENT_BLOCKED', title: 'Ce brief n’a pas pu être traité', art: 'repair', copy: /Reformuler ma demande/ },
    { status: 'failed', code: 'PROVIDER_CONFIGURATION', title: 'La création est indisponible', art: 'repair', copy: /service de composition doit être rétabli/ },
    { status: 'failed', code: 'PROVIDER_RATE_LIMIT', title: 'Le service est très sollicité', art: 'waiting', copy: /dans quelques minutes/ },
    { status: 'failed', code: 'QUOTA_EXCEEDED', title: 'La limite du jour est atteinte', art: 'limit', copy: /Reviens un autre jour/ },
    { status: 'failed', code: 'PROVIDER_TIMEOUT', title: 'Ton carnet n’a pas pu être préparé', art: 'repair', copy: /ne reprendra pas automatiquement/ },
    { status: 'failed', code: '<script>sentinel-secret</script>', title: 'Ton carnet n’a pas pu être préparé', art: 'repair', copy: /Tes envies ne sont pas en cause/ },
    { status: 'expired', title: 'Ce carnet a expiré', art: 'expired', http: 410, copy: /copie hors connexion/ },
    { status: 'deleted', title: 'Ce carnet a été supprimé', art: 'deleted', http: 410, copy: /copie téléchargée/ },
    { status: 'deleting', title: 'La suppression est en cours', art: 'waiting', copy: /nettoyage des images doit encore se terminer/ },
  ];
  for (const scenario of cases) {
    sql.prepare('UPDATE trips SET status = ?, error_code = ?').run(scenario.status, scenario.code || null);
    const response = await worker.fetch(new Request(privateUrl), env);
    const html = await response.text();
    assert.equal(response.status, scenario.http || 200);
    assertPrivateErrorPage(response, html);
    assert.ok(html.includes(`<h1 id="trip-state-title">${scenario.title}</h1>`));
    assert.ok(html.includes(`/assets/errors/florian-${scenario.art}.webp`));
    assert.match(html, scenario.copy);
    assert.doesNotMatch(html, /sentinel-secret/);
    if (scenario.code !== 'CONTENT_BLOCKED') assert.doesNotMatch(html, /Reformuler ma demande|corriger ta demande/);
    if (scenario.code === 'PROVIDER_CONFIGURATION') assert.doesNotMatch(html, /quelques minutes|Réessaie|réessayer/);
    if (['expired', 'deleted', 'deleting'].includes(scenario.status)) assert.doesNotMatch(html, /<form|Conservée jusqu’au/);
    assert.equal(html.includes('http-equiv="refresh"'), scenario.status === 'deleting');
  }
});

test('un lien inconnu ou malformé reçoit une page privée404 sans reflet du jeton', async (t) => {
  const { env, sql } = await environment(); t.after(() => sql.close());
  const token = 'a'.repeat(43);
  for (const suffix of [token, `${token}/inconnu`, 'incomplet']) {
    const response = await worker.fetch(new Request(`https://monflorian.com/voyages/${suffix}`), env);
    const html = await response.text();
    assert.equal(response.status, 404);
    assertPrivateErrorPage(response, html);
    assert.match(html, /Ce carnet est introuvable/);
    assert.match(html, /florian-lost.webp/);
    assert.ok(!html.includes(token));
    assert.doesNotMatch(html, /<form/);
  }
});

test('un résultat illisible ne présente pas un carnet vide comme prêt', async (t) => {
  const { env, sql } = await environment(); t.after(() => sql.close()); mockProvider(t);
  const created = await worker.fetch(request('/api/trips', brief), env);
  const { privateUrl } = await created.json();
  const { id } = sql.prepare('SELECT id FROM trips').get();
  for (const invalid of [{ itinerary: null }, 'sentinel-invalid-result', true, {}]) {
    const encrypted = await encryptJson(env.TRIP_DATA_KEY, invalid, `${id}:result`);
    sql.prepare("UPDATE trips SET status = 'ready', result_ciphertext = ?, result_nonce = ?").run(encrypted.ciphertext, encrypted.nonce);
    const response = await worker.fetch(new Request(privateUrl), env);
    const html = await response.text();
    assertPrivateErrorPage(response, html);
    assert.match(html, /Ton carnet ne peut pas être affiché/);
    assert.doesNotMatch(html, /data-save-trip|data-trip-export|http-equiv="refresh"|sentinel-invalid-result/);
  }
});

test('le titre personnel reste dans le carnet et jamais dans les métadonnées privées', async (t) => {
  const { env, sql } = await environment(); t.after(() => sql.close()); mockProvider(t);
  const created = await worker.fetch(request('/api/trips', brief), env);
  const { privateUrl } = await created.json();
  const token = new URL(privateUrl).pathname.split('/').at(-1);
  const rawTitle = 'SENTINEL_PERSONAL_TITLE_東京';
  const { id } = sql.prepare('SELECT id FROM trips').get();
  const encrypted = await encryptJson(env.TRIP_DATA_KEY, { itinerary: itineraryOutput({ title: rawTitle }) }, `${id}:result`);
  sql.prepare('UPDATE trips SET result_ciphertext = ?, result_nonce = ?').run(encrypted.ciphertext, encrypted.nonce);
  for (const status of ['ready', 'generating_images', 'failed', 'expired', 'deleted']) {
    sql.prepare('UPDATE trips SET status = ?').run(status);
    const response = await worker.fetch(new Request(privateUrl), env);
    const html = await response.text();
    const head = /<head>([\s\S]*?)<\/head>/u.exec(html)?.[1];
    assert.ok(head);
    assert.match(head, /<title>Voyage privé · Mon Florian<\/title>/u);
    assert.match(head, /<meta property="og:title" content="Voyage privé · Mon Florian">/u);
    assert.match(head, /<meta name="twitter:title" content="Voyage privé · Mon Florian">/u);
    assert.ok(!head.includes(rawTitle));
    assert.ok(!head.includes(token));
    if (['ready', 'generating_images'].includes(status)) assert.ok(html.includes(`<h1>${rawTitle}</h1>`));
    else assert.ok(!html.includes(rawTitle));
  }
});

test('les pannes serveur ont un repliHTML mais lesAPI restent enJSON', async (t) => {
  const { env, sql } = await environment(); t.after(() => sql.close());
  env.DB.prepare = () => { throw new Error('sentinel-internal-detail'); };
  const token = 'b'.repeat(43);
  const page = await worker.fetch(new Request(`https://monflorian.com/voyages/${token}`), env);
  const html = await page.text();
  assert.equal(page.status, 500);
  assertPrivateErrorPage(page, html);
  assert.match(html, /Cette page ne peut pas être affichée/);
  assert.ok(!html.includes(token));
  assert.doesNotMatch(html, /sentinel-internal-detail/);
  for (const prefix of ['/api/trips/', '/api/v1/trips/']) {
    const response = await worker.fetch(new Request(`https://monflorian.com${prefix}${token}`, { headers: { Accept: 'text/html' } }), env);
    assert.equal(response.status, 500);
    assert.match(response.headers.get('Content-Type'), /application\/json/);
    assert.equal((await response.json()).error.code, 'INTERNAL_ERROR');
  }
  env.ASSETS.fetch = async () => new Response('sentinel-asset-outage', { status: 503 });
  const assetPage = await worker.fetch(new Request('https://monflorian.com/guides', { headers: { Accept: 'text/html' } }), env);
  const assetHtml = await assetPage.text();
  assert.equal(assetPage.status, 503);
  assertPrivateErrorPage(assetPage, assetHtml);
  assert.doesNotMatch(assetHtml, /sentinel-asset-outage/);
  const css = await worker.fetch(new Request('https://monflorian.com/trip.css', { headers: { Accept: 'text/css' } }), env);
  assert.equal(css.status, 503);
  assert.equal(await css.text(), 'sentinel-asset-outage');
});

for (const scenario of [{ destination: 'Tokyo', departureCity: 'Paris', transportMode: 'flight', durationDays: 10 },
  { destination: 'Luxembourg', departureCity: 'Metz', transportMode: 'none', durationDays: 2 }]) {
  test(`parcours complet sourcé ${scenario.destination}, sans fournisseur réel`, async (t) => {
    const { env, sql, jobs } = await environment({ MONFLORIAN_RESEARCH_ENABLED: 'true' }); t.after(() => sql.close());
    const requestData = researchedRequest({ ...scenario, startDate: null, endDate: null, requestedDays: scenario.durationDays });
    const calls = [];
    t.mock.method(globalThis, 'fetch', async (url, options) => {
      if (String(url).includes('turnstile')) return Response.json({ success: true, action: 'create-trip', hostname: 'monflorian.com' });
      const body = JSON.parse(options.body); calls.push(body);
      if (body.tools) return Response.json(researchResponse());
      return Response.json({ status: 'completed', output_text: JSON.stringify(researchedItinerary(requestData)) });
    });
    const response = await worker.fetch(request('/api/trips', { ...brief, ...requestData }), env);
    assert.equal(response.status, 202);
    const accepted = await response.json();
    const stepOutputs = [];
    const run = await new TripWorkflow({}, env).run({ payload: jobs[0].params }, { do: async (name, options, fn) => {
      const result = await fn(); stepOutputs.push({ name, result }); return result;
    } });
    assert.equal(run.status, 'ready'); assert.equal(calls.length, 2);
    assert.equal(calls[0].tools[0].type, 'web_search'); assert.equal(calls[1].text.format.strict, true);
    assert.ok(sql.prepare('SELECT research_ciphertext FROM trips').get().research_ciphertext);
    assert.ok(!JSON.stringify(stepOutputs).includes('Deux hôtels adaptés'));
    const page = await worker.fetch(new Request(accepted.privateUrl), env);
    const html = await page.text();
    assert.match(html, /Hôtel synthétique A/); assert.match(html, /Les sources consultées/);
    assert.match(html, new RegExp(`Jour ${scenario.durationDays}`));
    assert.equal(html.includes('google.com/travel/flights'), scenario.transportMode === 'flight');
    assert.match(html, /S’il pleut/); assert.match(html, /Si tu es fatigué/);
  });
}
