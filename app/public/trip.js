const OFFLINE_TRIP_STYLE = `
:root { color-scheme: light; font-family: "Avenir Next", "Segoe UI", system-ui, -apple-system, sans-serif; color: #061a3b; background: #f4f7ff; line-height: 1.65; }
* { box-sizing: border-box; } body { margin: 0; } main { max-width: 880px; margin: 24px auto; padding: clamp(20px, 5vw, 52px); background: #fffefb; }
h1, h2, h3 { line-height: 1.2; text-wrap: balance; } h1 { font-size: clamp(2rem, 7vw, 3.5rem); letter-spacing: -.035em; } h2 { margin-top: 0; }
p, li, a { overflow-wrap: anywhere; } a { color: #0b4fd8; text-underline-offset: .2em; } a:focus-visible, summary:focus-visible { outline: 3px solid #0b4fd8; outline-offset: 4px; }
nav { display: flex; flex-wrap: wrap; gap: 12px 24px; margin: 28px 0; } nav a, summary { padding-block: 8px; } section, aside, footer { margin-top: 36px; }
.private-trip-note, .offline-copy { padding: 18px 22px; background: #fff8eb; } .offline-brand, .result-kicker { color: #5e6c80; font-size: .9rem; }
.private-trip-day, .private-trip-option, .private-trip-links > li { padding: 24px 0; border-top: 1px solid rgba(6,26,59,.12); } .private-trip-links { padding-left: 22px; }
li { margin-block: 12px; } li p { margin-block: 8px; } figure { margin: 24px 0; } img { display: block; max-width: 100%; height: auto; border-radius: 18px; }
figcaption { display: grid; gap: 4px; margin-top: 10px; font-size: .85rem; } summary { cursor: pointer; } details { margin-top: 12px; } footer { border-top: 1px solid rgba(6,26,59,.12); padding-top: 20px; font-size: .9rem; }
@media (max-width: 600px) { main { margin: 0; } }
@media print { :root, main { background: white; color: black; } main { max-width: none; margin: 0; padding: 0; } nav { display: none; } h2, h3 { break-after: avoid; } figure, .private-trip-option { break-inside: avoid; } }
`;

function offlineTripLink(value, token) {
  if (/^#[a-zA-Z][a-zA-Z0-9_-]*$/.test(value)) return value;
  try {
    if (/[\u0000-\u0020\u007f\\]/u.test(value) || value.length > 2048) return null;
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (url.protocol !== 'https:' || url.username || url.password || url.port ||
      !/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,63}$/u.test(host) ||
      /(?:^|\.)(?:localhost|local|internal|test|invalid|example|onion)$/u.test(host) ||
      /\/(?:voyages|api\/(?:v1\/)?trips)(?:\/|$)/iu.test(decodeURIComponent(url.pathname)) ||
      (token && url.toString().includes(token))) return null;
    return url.toString();
  } catch { return null; }
}

function offlineTripDocument(source, token) {
  const saved = document.implementation.createHTMLDocument('Mon Florian · Carnet hors connexion');
  saved.documentElement.lang = 'fr';
  const metadata = [
    ['charset', 'utf-8'], ['viewport', 'width=device-width, initial-scale=1'],
    ['referrer', 'no-referrer'], ['robots', 'noindex,nofollow,noarchive'],
  ];
  for (const [name, content] of metadata) {
    const meta = saved.createElement('meta');
    if (name === 'charset') meta.setAttribute('charset', content);
    else { meta.name = name; meta.content = content; }
    saved.head.append(meta);
  }
  const policy = saved.createElement('meta');
  policy.httpEquiv = 'Content-Security-Policy';
  policy.content = "default-src 'none'; img-src data:; style-src 'unsafe-inline'; form-action 'none'; base-uri 'none'";
  saved.head.append(policy);
  const style = saved.createElement('style');
  style.textContent = OFFLINE_TRIP_STYLE;
  saved.head.append(style);
  const main = saved.createElement('main');
  saved.body.append(main);
  const brand = saved.createElement('p');
  brand.className = 'offline-brand';
  brand.textContent = 'Mon Florian · Carnet hors connexion';
  main.append(brand);
  const allowed = new Set(['HEADER', 'NAV', 'SECTION', 'ARTICLE', 'ASIDE', 'DIV', 'P', 'H1', 'H2', 'H3', 'H4', 'STRONG', 'EM', 'UL', 'OL', 'LI', 'DETAILS', 'SUMMARY', 'FIGURE', 'FIGCAPTION', 'IMG', 'A', 'BR', 'SPAN']);
  let includedImages = 0;
  let omittedImages = 0;
  function copy(node) {
    if (node.nodeType === Node.TEXT_NODE) return saved.createTextNode(node.textContent);
    if (node.nodeType !== Node.ELEMENT_NODE || !allowed.has(node.tagName) ||
      node.matches('[data-trip-actions], [data-trip-feedback]')) return null;
    if (node.tagName === 'IMG') {
      try {
        const url = new URL(node.currentSrc || node.src, location.href);
        if (url.origin !== location.origin || url.pathname !== `/api/trips/${token}/media/${url.pathname.split('/').at(-1)}` ||
          !/^\d{1,2}$/.test(url.pathname.split('/').at(-1)) || !node.complete || !node.naturalWidth ||
          node.naturalWidth > 4096 || node.naturalHeight > 4096) throw new Error('image unavailable');
        const canvas = document.createElement('canvas');
        canvas.width = node.naturalWidth; canvas.height = node.naturalHeight;
        canvas.getContext('2d').drawImage(node, 0, 0);
        const dataUrl = canvas.toDataURL('image/webp', .9);
        if (!/^data:image\/(?:webp|png);base64,/.test(dataUrl)) throw new Error('image unavailable');
        const image = saved.createElement('img');
        image.src = dataUrl; image.alt = node.alt || 'Illustration générée du voyage';
        includedImages += 1;
        return image;
      } catch {
        omittedImages += 1;
        const placeholder = saved.createElement('p');
        placeholder.textContent = 'Illustration non incluse dans cette copie. Le carnet reste lisible sans elle.';
        return placeholder;
      }
    }
    const element = saved.createElement(node.tagName.toLowerCase());
    for (const attribute of ['class', 'id']) {
      const value = node.getAttribute(attribute);
      if (value && /^[a-zA-Z0-9 _-]{1,160}$/.test(value)) element.setAttribute(attribute, value);
    }
    if (node.tagName === 'A') {
      const href = offlineTripLink(node.getAttribute('href') || '', token);
      if (href) { element.href = href; element.rel = 'noopener noreferrer'; }
    }
    if (node.tagName === 'DETAILS') element.open = true;
    for (const child of node.childNodes) {
      const result = copy(child);
      if (result) element.append(result);
    }
    return element;
  }
  for (const child of source.childNodes) {
    const result = copy(child);
    if (result) main.append(result);
  }
  for (const link of main.querySelectorAll('a[href^="#"]')) {
    if (!saved.getElementById(link.getAttribute('href').slice(1))) link.remove();
  }
  saved.title = `${main.querySelector('h1')?.textContent || 'Ton carnet'} · Mon Florian`;
  const footer = saved.createElement('footer');
  const copyNote = saved.createElement('p');
  copyNote.textContent = `Copie enregistrée le ${new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date())}. Elle reste sur ton appareil jusqu’à ce que tu la supprimes, indépendamment de l’expiration du lien privé. Elle ne se met pas à jour.`;
  footer.append(copyNote);
  const imageNote = saved.createElement('p');
  imageNote.textContent = source.dataset.tripExportState === 'generating_images'
    ? 'Copie enregistrée avant la fin de l’illustration. Ton itinéraire est disponible ci-dessus.'
    : includedImages ? `${includedImages} illustration${includedImages > 1 ? 's' : ''} incluse${includedImages > 1 ? 's' : ''} dans cette copie.${omittedImages ? ' Certaines images n’étaient pas disponibles.' : ''}`
      : 'Cette copie contient ton carnet sans illustration.';
  footer.append(imageNote);
  const bookingNote = saved.createElement('p');
  bookingNote.textContent = 'Vérifie prix, horaires, formalités et disponibilités avant de réserver. Les liens vers les hôtels et les sources s’ouvrent avec une connexion Internet.';
  footer.append(bookingNote);
  main.append(footer);
  const html = `<!doctype html>\n${saved.documentElement.outerHTML}`;
  if (token && html.includes(token)) throw new Error('private link in export');
  return { html, includedImages, omittedImages };
}

const actions = document.querySelector('[data-trip-actions]');
if (actions) {
  actions.hidden = false;
  document.querySelector('[data-print-trip]')?.addEventListener('click', () => window.print());
  document.querySelector('[data-save-trip]')?.addEventListener('click', () => {
    const feedback = document.querySelector('[data-trip-feedback]');
    try {
      const source = document.querySelector('[data-trip-export]');
      if (!source?.querySelector('.private-trip-itinerary')) throw new Error('not ready');
      const token = location.pathname.split('/')[2];
      if (!/^[A-Za-z0-9_-]{43}$/.test(token)) throw new Error('invalid link');
      const { html, includedImages, omittedImages } = offlineTripDocument(source, token);
      const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'monflorian-carnet.html';
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      feedback.textContent = `Ton carnet est prêt pour le téléchargement. Ouvre le fichier pour le lire hors connexion, ${includedImages ? `avec ${includedImages} illustration${includedImages > 1 ? 's' : ''}` : 'sans illustration'}.${omittedImages ? ' Une image indisponible n’a pas été incluse.' : ''}`;
    } catch {
      feedback.textContent = 'Le téléchargement n’a pas abouti. Réessaie ou utilise « Imprimer le carnet ».';
    }
  });
}
