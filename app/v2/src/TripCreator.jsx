import { useCallback, useEffect, useRef, useState } from "react";
import { accommodationStyles, buildTripPayload, DEFAULT_TRIP_DRAFT, prepareTripPhoto, privateTripUrl, requiresDepartureCity, transportModes, TRIP_IDEAS, tripDraftErrors, tripPaces } from "./trip-draft.mjs";
import "./error-state.css";

const stepLabels = ["Ton voyage", "Tes préférences", "Créer le carnet"];
const firstStepFields = new Set(["destination", "departureCity", "brief"]);
const serviceErrors = {
  configuration: { image: "lost", title: "Impossible de vérifier la disponibilité", description: "La connexion au service n’a pas abouti. Tu peux continuer à préparer ton voyage, puis vérifier à nouveau sans quitter cette page." },
  unavailable: { image: "waiting", title: "La création fait une pause", description: "Le service est momentanément indisponible. Tes réponses restent dans cette page. Tu peux les sauvegarder et vérifier la disponibilité plus tard." },
  quota: { image: "limit", title: "La limite gratuite du jour est atteinte", description: "Réessaie demain. Tu peux sauvegarder tes envies pour les retrouver ; les photos restent uniquement dans cette page tant qu’elle est ouverte." },
  request: { image: "repair", title: "La demande n’a pas pu aboutir", description: "Le service a rencontré un problème. Tes réponses et photos restent dans cette page. Confirme à nouveau la vérification, puis réessaie sans modifier le formulaire pour reprendre la même demande." },
  network: { image: "lost", title: "La connexion a été interrompue", description: "Nous ne savons pas encore si ta demande a été enregistrée. Vérifie ta connexion, puis réessaie sans modifier le formulaire : la même demande sera reprise." },
  response: { image: "lost", title: "Le lien du carnet n’a pas pu être récupéré", description: "Ta demande a peut-être été enregistrée. Confirme à nouveau la vérification, puis réessaie sans modifier le formulaire pour retrouver la même demande." },
  input: { image: "repair", title: "La demande doit être vérifiée", description: "Le service n’a pas accepté ces informations. Revois tes envies et les options choisies avant de réessayer. Tes réponses restent dans cette page." },
  photos: { image: "waiting", title: "Les portraits ne sont pas disponibles", description: "Tu peux revenir à tes envies et retirer les photos pour créer un carnet sans portrait, ou garder le formulaire ouvert et réessayer plus tard." },
  email: { image: "waiting", title: "L’envoi par courriel est indisponible", description: "Tu peux retirer ton adresse de courriel et continuer. Le lien privé du carnet s’ouvrira dans cette page après l’enregistrement de ta demande." },
};

export function tripRequestFailure(code, status) {
  if (code === "QUOTA_EXCEEDED") return { kind: "quota", terminal: true };
  if (["TRIP_CREATION_UNAVAILABLE", "SERVICE_NOT_CONFIGURED"].includes(code)) return { kind: "unavailable" };
  if (code === "ILLUSTRATION_UNAVAILABLE") return { kind: "photos" };
  if (code === "EMAIL_UNAVAILABLE") return { kind: "email" };
  const fields = {
    ACCESS_REQUIRED: ["accessCode", "Le code d’accès est absent ou incorrect. Vérifie-le avant de réessayer."],
    INVALID_ACCESS_CODE: ["accessCode", "Le code d’accès est incorrect. Vérifie-le avant de réessayer."],
    INVALID_EMAIL: ["email", "Vérifie ton adresse de courriel, ou retire-la pour continuer sans courriel."],
    PAST_TRIP: ["startDate", "Choisis une date de départ à venir."],
    TRIP_TOO_FAR: ["endDate", "Choisis un retour dans les 173 prochains jours, ou laisse les deux dates vides et précise la période dans tes envies."],
    DESTINATION_REQUIRED: ["destination", "Indique la destination du voyage."],
    CONSENT_REQUIRED: ["photoConsent", "Confirme les droits et l’accord des personnes, ou retire les photos."],
  };
  if (typeof code === "string" && Object.hasOwn(fields, code)) return { field: fields[code][0], message: fields[code][1] };
  if (["TURNSTILE_REQUIRED", "TURNSTILE_REJECTED", "TURNSTILE_UNAVAILABLE"].includes(code)) return { verification: true, message: "La vérification n’a pas abouti. Relance-la avant de réessayer." };
  if (status >= 400 && status < 500) return { kind: "input" };
  return { kind: "request" };
}

function TripErrorState({ kind, headingRef, children }) {
  const error = serviceErrors[kind];
  return <div aria-labelledby="trip-service-error-title" className={`trip-error-state trip-error-${kind}`}>
    <div className="error-state-art"><img src={`/assets/errors/florian-${error.image}.webp`} alt="" height="160" width="160" onError={(event) => { event.currentTarget.hidden = true; }} /></div>
    <div className="error-state-copy"><h4 id="trip-service-error-title" ref={headingRef} tabIndex="-1">{error.title}</h4><p>{error.description}</p><div className="error-state-actions">{children}</div><p className="error-state-support">Besoin d’aide ? <a href="mailto:support@monflorian.com">support@monflorian.com</a></p></div>
  </div>;
}

function Field({ name, label, optional, help, errors, children }) {
  return <div className="planner-field"><label htmlFor={`trip-${name}`}>{label}{optional ? <span> facultatif</span> : null}</label>{children}<p className="planner-help" id={`trip-${name}-help`}>{help}</p><p className="planner-error" id={`trip-${name}-error`}>{errors[name] || ""}</p></div>;
}

function Turnstile({ siteKey, onToken, onError }) {
  const container = useRef(null);
  useEffect(() => {
    let disposed = false;
    let widget;
    function render() {
      if (disposed || !window.turnstile || !container.current || widget !== undefined) return;
      widget = window.turnstile.render(container.current, {
        sitekey: siteKey, action: "create-trip", theme: "light", size: "flexible",
        callback: onToken,
        "expired-callback": () => { onToken(""); onError("La vérification a expiré. Confirme-la à nouveau."); },
        "error-callback": () => { onToken(""); onError("La vérification n’a pas chargé. Relance-la avant de réessayer."); },
      });
    }
    let script = document.querySelector("script[data-monflorian-turnstile]");
    if (script?.dataset.failed === "true") { script.remove(); script = null; }
    if (window.turnstile) render();
    else {
      if (!script) {
        script = document.createElement("script");
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.dataset.monflorianTurnstile = "true";
        document.head.append(script);
      }
      script.addEventListener("load", render);
      script.addEventListener("error", failed);
    }
    function failed() { if (!disposed) { script.dataset.failed = "true"; onError("La vérification n’a pas chargé. Relance-la avant de réessayer."); } }
    return () => { disposed = true; script?.removeEventListener("load", render); script?.removeEventListener("error", failed); if (widget !== undefined) window.turnstile?.remove(widget); onToken(""); };
  }, [siteKey, onToken, onError]);
  return <div aria-label="Vérification de la demande" className="trip-turnstile" ref={container} />;
}

export default function TripCreator() {
  const [hydrated, setHydrated] = useState(false);
  const [draft, setDraft] = useState({ ...DEFAULT_TRIP_DRAFT });
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [config, setConfig] = useState(null);
  const [configurationError, setConfigurationError] = useState(false);
  const [configurationLoading, setConfigurationLoading] = useState(true);
  const [configurationAttempt, setConfigurationAttempt] = useState(0);
  const [photos, setPhotos] = useState([]);
  const [preparingPhotos, setPreparingPhotos] = useState(false);
  const [photoConsent, setPhotoConsent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileError, setTurnstileError] = useState("");
  const [verificationAttempt, setVerificationAttempt] = useState(0);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [requestError, setRequestError] = useState(null);
  const [acceptedUrl, setAcceptedUrl] = useState("");
  const title = useRef(null);
  const errorTitle = useRef(null);
  const photoInput = useRef(null);
  const photoRefs = useRef([]);
  const idempotencyKey = useRef(null);
  const pendingFocus = useRef(false);
  const pendingFieldFocus = useRef("");
  const ready = !configurationLoading && !configurationError && config?.serviceReady === true && Boolean(config?.turnstileSiteKey);
  const serviceError = requestError || (!configurationLoading && (configurationError ? "configuration" : config && !ready ? "unavailable" : null));
  const retryInPanel = step === 2 && ["network", "request", "response"].includes(serviceError);
  const illustrations = config?.illustrationEnabled === true;
  const departureRequired = requiresDepartureCity(draft.transportMode);
  const handleToken = useCallback((value) => { setTurnstileToken(value); if (value) setTurnstileError(""); }, []);

  useEffect(() => {
    const controller = new AbortController();
    let disposed = false;
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    setHydrated(true);
    setConfigurationLoading(true);
    setConfigurationError(false);
    fetch("/api/config", { signal: controller.signal, headers: { Accept: "application/json" } })
      .then(async (response) => { if (!response.ok) throw new Error("Configuration unavailable"); const value = await response.json(); if (typeof value.serviceReady !== "boolean") throw new Error("Invalid configuration"); setConfig(value); })
      .catch(() => { if (!disposed) setConfigurationError(true); })
      .finally(() => { window.clearTimeout(timeout); if (!disposed) setConfigurationLoading(false); });
    return () => { disposed = true; window.clearTimeout(timeout); controller.abort(); };
  }, [configurationAttempt]);
  useEffect(() => { if (requestError) errorTitle.current?.focus(); }, [requestError]);
  useEffect(() => {
    if (!pendingFocus.current || pending) return;
    pendingFocus.current = false;
    const field = pendingFieldFocus.current;
    pendingFieldFocus.current = "";
    if (field) document.getElementById(`trip-${field}`)?.focus();
    else title.current?.focus();
  }, [step, pending]);
  useEffect(() => { photoRefs.current = photos; }, [photos]);
  useEffect(() => () => { photoRefs.current.forEach((photo) => URL.revokeObjectURL(photo.previewUrl)); }, []);

  function update(name, value) {
    setDraft((current) => {
      const next = { ...current, [name]: value };
      if ((name === "startDate" || name === "endDate") && next.startDate && next.endDate) {
        const days = (Date.parse(next.endDate) - Date.parse(next.startDate)) / 86400000 + 1;
        if (Number.isInteger(days) && days >= 1 && days <= 14) next.durationDays = days;
      }
      return next;
    });
    idempotencyKey.current = null;
    setErrors((current) => ({ ...current, [name]: undefined }));
    setFeedback("");
    setRequestError(null);
  }

  function useIdea(idea) {
    setDraft((current) => ({ ...current, ...idea.draft, startDate: "", endDate: "" }));
    idempotencyKey.current = null;
    setErrors({});
    setRequestError(null);
    setFeedback("Cette idée est ajoutée. Ajuste les envies, la durée et ta ville de départ.");
    document.getElementById("trip-destination")?.focus();
  }

  function validate(upToStep = 2) {
    const all = tripDraftErrors({ ...draft, email: config?.emailEnabled ? draft.email : "" });
    const relevant = Object.fromEntries(Object.entries(all).filter(([name]) => upToStep > 0 || firstStepFields.has(name)));
    if (upToStep === 2 && photos.length && !photoConsent) relevant.photoConsent = "Confirme les droits et l’accord des personnes, ou retire les photos.";
    if (upToStep === 2 && config?.accessMode === "private" && !draft.accessCode.trim()) relevant.accessCode = "Indique le code d’accès à cette bêta privée.";
    setErrors(relevant);
    const first = Object.keys(relevant)[0];
    if (!first) return true;
    const destinationStep = firstStepFields.has(first) ? 0 : ["email", "accessCode", "photoConsent"].includes(first) ? 2 : 1;
    if (step !== destinationStep) { pendingFocus.current = true; pendingFieldFocus.current = first; setStep(destinationStep); }
    else document.getElementById(`trip-${first}`)?.focus();
    setFeedback("Vérifie les champs indiqués avant de continuer.");
    return false;
  }

  function goTo(next) {
    if (pending || preparingPhotos) return;
    if (next > step && !validate(next - 1)) return;
    pendingFocus.current = true;
    setStep(next);
    setFeedback("");
  }

  function retryAvailability() {
    setRequestError(null);
    setConfigurationLoading(true);
    setConfigurationAttempt((value) => value + 1);
  }

  function reviewDraft() {
    setRequestError(null);
    goTo(0);
  }

  function saveWishes() {
    const text = ["Mes envies de voyage · Mon Florian", "", `Destination : ${draft.destination || "À préciser"}`, `Départ : ${draft.departureCity || "À préciser"}`, `Dates : ${draft.startDate || "Flexibles"}${draft.endDate ? ` au ${draft.endDate}` : ""}`, `Durée : ${draft.durationDays} jours`, `Voyageurs : ${draft.travelers}`, `Transport : ${transportModes.find(({ value }) => value === draft.transportMode)?.label}`, `Hébergement : ${accommodationStyles.find(({ value }) => value === draft.accommodationStyle)?.label}`, `Rythme : ${tripPaces.find(({ value }) => value === draft.pace)?.label}`, `Budget total : ${draft.budgetTotalEur ? `${draft.budgetTotalEur} €` : "À préciser"}`, "", draft.brief, "", "Les photos, le code d’accès et l’adresse de courriel ne sont pas inclus."].join("\n");
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "mes-envies-monflorian.txt";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setFeedback("Tes envies ont été téléchargées, sans photos, code d’accès ni adresse de courriel.");
  }

  async function addPhotos(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!illustrations || !files.length) return;
    const maximum = Math.min(4, config?.limits?.maxPhotos || 4);
    if (files.length + photos.length > maximum) { setFeedback(`Ajoute au maximum ${maximum} photos. Retire une photo avant d’en ajouter une autre.`); return; }
    setPreparingPhotos(true);
    setFeedback("Préparation des photos sur ton appareil…");
    const prepared = [];
    try {
      for (const file of files) prepared.push(await prepareTripPhoto(file, Math.min(1500000, config?.limits?.maxPhotoBytes || 1500000)));
      setPhotos((current) => [...current, ...prepared]);
      idempotencyKey.current = null;
      setPhotoConsent(false);
      setFeedback("Photos préparées. Elles restent dans cette page jusqu’à la création du voyage.");
    } catch (error) { prepared.forEach((photo) => URL.revokeObjectURL(photo.previewUrl)); setFeedback(error.message); }
    finally { setPreparingPhotos(false); }
  }

  async function submit(event) {
    event.preventDefault();
    if (step < 2) { goTo(step + 1); return; }
    if (pending || preparingPhotos || !ready || acceptedUrl || !validate()) return;
    if (!turnstileToken) { setTurnstileError("Termine la vérification avant de créer ton voyage."); return; }
    setPending(true);
    setRequestError(null);
    setFeedback("Enregistrement de ta demande et création du lien privé…");
    idempotencyKey.current ||= crypto.randomUUID();
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 45000);
    let accepted = false;
    try {
      const response = await fetch("/api/trips", {
        signal: controller.signal,
        method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json", "Idempotency-Key": idempotencyKey.current, ...(config.accessMode === "private" ? { "X-Monflorian-Access-Code": draft.accessCode.trim() } : {}) },
        body: JSON.stringify(buildTripPayload(draft, { photos: illustrations ? photos : [], photoConsent, turnstileToken, emailEnabled: config.emailEnabled === true })),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        const code = result?.error?.code || result?.code;
        const failure = tripRequestFailure(code, response.status);
        if (failure.terminal) idempotencyKey.current = null;
        if (failure.field) {
          setErrors((current) => ({ ...current, [failure.field]: failure.message }));
          const destinationStep = firstStepFields.has(failure.field) ? 0 : ["startDate", "endDate"].includes(failure.field) ? 1 : 2;
          pendingFocus.current = true;
          pendingFieldFocus.current = failure.field;
          if (step !== destinationStep) setStep(destinationStep);
          setFeedback("Vérifie le champ indiqué avant de réessayer.");
        } else if (failure.verification) { setTurnstileError(failure.message); setFeedback(""); }
        else { setRequestError(failure.kind); setFeedback(""); }
        return;
      }
      const url = privateTripUrl(result?.privateUrl || response.headers.get("Location"), window.location.origin);
      if (!url) { setRequestError("response"); setFeedback(""); return; }
      accepted = true;
      setAcceptedUrl(url);
      setFeedback("Ta demande est enregistrée. Ouvre ton carnet privé pour suivre sa préparation.");
      photos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
      setPhotos([]);
      window.location.assign(url);
    } catch {
      setRequestError("network");
      setFeedback("");
    } finally {
      window.clearTimeout(timeout);
      if (!accepted) { setTurnstileToken(""); setVerificationAttempt((value) => value + 1); }
      setPending(false);
    }
  }

  function input(name, type = "text", extra = {}) {
    return <input aria-describedby={`trip-${name}-help trip-${name}-error`} aria-invalid={Boolean(errors[name])} id={`trip-${name}`} name={name} onChange={(event) => update(name, event.target.value)} type={type} value={draft[name]} {...extra} />;
  }
  function select(name, options) {
    return <select aria-describedby={`trip-${name}-help trip-${name}-error`} aria-invalid={Boolean(errors[name])} id={`trip-${name}`} name={name} onChange={(event) => update(name, event.target.value)} value={draft[name]}>{options.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}</select>;
  }

  return <section aria-labelledby="trip-creator-title" className="planner-section trip-creator" id="create">
    <div className="planner-heading"><h2 id="trip-creator-title">On part où ?</h2><p>Décris ton voyage. Ton carnet réunira un itinéraire, des pistes d’hôtels et les trajets utiles, avec les points à vérifier avant de réserver.</p><p className="trip-beta-note">Gratuit pendant la bêta, sans carte bancaire. Le paiement sera ajouté à la sortie de bêta ; tu seras informé avant toute nouvelle création payante.</p></div>
    <noscript><p>Active JavaScript pour préparer et envoyer ta demande. Tu peux déjà <a href="/carnets/japon-10-jours">lire le carnet Japon d’exemple</a>.</p></noscript>
    <div className="planner-layout">
      <form aria-busy={pending || preparingPhotos} className="planner-form trip-form" noValidate onSubmit={submit}>
        <ol aria-label="Étapes de création du voyage" className="planner-steps">{stepLabels.map((label, index) => <li key={label}><button aria-current={step === index ? "step" : undefined} disabled={!hydrated || pending || preparingPhotos} onClick={() => goTo(index)} type="button"><span>{index + 1}</span>{label}</button></li>)}</ol>
        <h3 className="planner-step-title" ref={title} tabIndex="-1">{step + 1} sur 3 · {stepLabels[step]}</h3>
        <fieldset className="trip-fields" disabled={!hydrated || pending || Boolean(acceptedUrl)}>
        {step === 0 ? <>
          <div className="trip-ideas"><p>Une idée pour commencer :</p>{TRIP_IDEAS.map((idea) => <button key={idea.name} onClick={() => useIdea(idea)} type="button"><strong>{idea.name}</strong><span>{idea.detail}</span></button>)}</div>
          <div className="planner-number-fields">
            <Field errors={errors} label="Destination" name="destination">{input("destination", "text", { maxLength: 120, placeholder: "Tokyo, Luxembourg…", autoComplete: "off", required: true })}</Field>
            <Field errors={errors} help={departureRequired ? "Nécessaire pour proposer ton trajet en avion, train ou voiture." : "Sans ville de départ, le carnet ne proposera ni vol ni trajet longue distance."} label="Ville de départ" name="departureCity" optional={!departureRequired}>{input("departureCity", "text", { maxLength: 120, placeholder: "Paris, Metz…", autoComplete: "off", required: departureRequired })}</Field>
          </div>
          <Field errors={errors} help="Tes envies, ta période si les dates sont flexibles, ce que tu aimes et ce que tu veux éviter. De 20 à 2 000 caractères ; aucun document d’identité." label="Le voyage que tu imagines" name="brief"><textarea aria-describedby="trip-brief-help trip-brief-error" aria-invalid={Boolean(errors.brief)} id="trip-brief" maxLength={2000} minLength={20} onChange={(event) => update("brief", event.target.value)} placeholder="Nous partons à deux début novembre. Des quartiers à pied, de bonnes tables, des hôtels bien placés et du temps libre…" required rows={5} value={draft.brief} /></Field>
          {illustrations ? <div className="trip-photo-field"><h4>Vous dans le carnet <span>facultatif</span></h4><p className="planner-help">Ajoute de 1 à 4 photos des voyageurs pour les illustrations. JPEG, PNG ou WebP, 30 Mo maximum par fichier. Elles sont préparées sur ton appareil et envoyées seulement quand tu crées le voyage.</p><input accept="image/jpeg,image/png,image/webp" aria-label="Ajouter des photos des voyageurs" disabled={preparingPhotos || photos.length >= 4} multiple onChange={addPhotos} ref={photoInput} type="file" /><div className="trip-photos">{photos.map((photo, index) => <figure key={photo.previewUrl}><img alt={`Photo sélectionnée ${index + 1}`} src={photo.previewUrl} /><button aria-label={`Retirer la photo ${index + 1}`} className="planner-remove" onClick={() => { URL.revokeObjectURL(photo.previewUrl); setPhotos((current) => current.filter((_, position) => position !== index)); idempotencyKey.current = null; }} type="button">Retirer</button></figure>)}</div><p className="planner-help">Les images du carnet seront des projections générées. Elles ne prouvent pas une visite et leur ressemblance peut varier.</p></div> : <p className="planner-help">Le carnet peut être créé sans photo. L’ajout de portraits apparaît ici quand la personnalisation des images est disponible.</p>}
        </> : null}
        {step === 1 ? <>
          <div className="planner-number-fields">
            <Field errors={errors} help="Dates flexibles ? Laisse les dates vides et indique la durée souhaitée." label="Départ" name="startDate" optional>{input("startDate", "date")}</Field>
            <Field errors={errors} label="Retour" name="endDate" optional>{input("endDate", "date", { min: draft.startDate || undefined })}</Field>
            <Field errors={errors} help="De 1 à 14 jours. Une nuit correspond en général à 2 jours." label="Nombre de jours" name="durationDays">{input("durationDays", "number", { min: 1, max: 14, step: 1, inputMode: "numeric", required: true })}</Field>
            <Field errors={errors} help="De 1 à 8 personnes." label="Voyageurs" name="travelers">{input("travelers", "number", { min: 1, max: 8, step: 1, inputMode: "numeric", required: true })}</Field>
            <Field errors={errors} label="Pour rejoindre la destination" name="transportMode">{select("transportMode", transportModes)}</Field>
            <Field errors={errors} label="Ton rythme" name="pace">{select("pace", tripPaces)}</Field>
            <Field errors={errors} label="Hébergement" name="accommodationStyle">{select("accommodationStyle", accommodationStyles)}</Field>
            <Field errors={errors} help="Pour tous les voyageurs et tout le séjour, transport compris. Montant entier en euros." label="Budget total en euros" name="budgetTotalEur" optional>{input("budgetTotalEur", "text", { inputMode: "numeric", maxLength: 6, placeholder: "À préciser" })}</Field>
          </div>
        </> : null}
        {step === 2 ? <>
          <div className="trip-review-summary"><strong>{draft.destination}</strong><p>{draft.durationDays} jour{Number(draft.durationDays) > 1 ? "s" : ""} · {draft.travelers} voyageur{Number(draft.travelers) > 1 ? "s" : ""} · {transportModes.find(({ value }) => value === draft.transportMode)?.label}<br />Hébergement : {accommodationStyles.find(({ value }) => value === draft.accommodationStyle)?.label}{draft.budgetTotalEur ? ` · Budget total : ${draft.budgetTotalEur} €` : ""}</p></div><p>Vérifie le récapitulatif, puis crée ton carnet. Le lien privé s’ouvre dès que ta demande est enregistrée ; tu pourras y suivre la préparation.</p>
          {config?.emailEnabled === true ? <Field errors={errors} help="Pour recevoir aussi le lien quand le carnet sera prêt. Tu peux continuer sans courriel." label="Adresse de courriel" name="email" optional>{input("email", "email", { autoComplete: "email", maxLength: 254 })}</Field> : null}
          {config?.accessMode === "private" && ready ? <Field errors={errors} label="Code d’accès à la bêta" name="accessCode">{input("accessCode", "password", { autoComplete: "off", maxLength: 200 })}</Field> : null}
          {photos.length ? <div className="trip-consent"><label><input aria-describedby="trip-photoConsent-error" aria-invalid={Boolean(errors.photoConsent)} checked={photoConsent} id="trip-photoConsent" onChange={(event) => { setPhotoConsent(event.target.checked); setErrors((current) => ({ ...current, photoConsent: undefined })); }} type="checkbox" /><span>Je possède les droits sur ces photos et l’accord de toutes les personnes représentées pour leur envoi à Mon Florian et à OpenAI afin de générer les illustrations du voyage.</span></label><p className="planner-error" id="trip-photoConsent-error">{errors.photoConsent}</p></div> : null}
          <p className="planner-help">Le brief et le carnet sont conservés sur une page privée pendant au moins 30 jours, jusqu’à 7 jours après le retour connu, avec un maximum de 180 jours. Les photos sources sont effacées après traitement, au plus tard sous 24 heures. Tu peux supprimer le voyage depuis son lien. <a href="/confidentialite" target="_blank" rel="noopener noreferrer">Lire la notice de confidentialité</a>.</p>
          {ready ? <><Turnstile key={verificationAttempt} onError={setTurnstileError} onToken={handleToken} siteKey={config.turnstileSiteKey} /><p aria-live="polite" className="planner-error">{turnstileError}</p>{turnstileError ? <button className="planner-remove" onClick={() => { setTurnstileError(""); setVerificationAttempt((value) => value + 1); }} type="button">Relancer la vérification</button> : null}</> : null}
        </> : null}
        </fieldset>
        {serviceError ? <TripErrorState headingRef={errorTitle} kind={serviceError}>
          {["configuration", "unavailable"].includes(serviceError) ? <button className="planner-button planner-button-primary" disabled={configurationLoading || pending} onClick={retryAvailability} type="button">Vérifier la disponibilité</button> : retryInPanel ? <button className="planner-button planner-button-primary" disabled={pending || !ready || !turnstileToken} type="submit">Réessayer la création</button> : ["input", "photos"].includes(serviceError) ? <button className="planner-button planner-button-primary" onClick={reviewDraft} type="button">Revoir mes envies</button> : serviceError === "email" ? <button className="planner-button planner-button-primary" onClick={() => document.getElementById("trip-email")?.focus()} type="button">Modifier mon courriel</button> : null}
          <button className="planner-remove" disabled={pending} onClick={saveWishes} type="button">Sauvegarder mes envies</button>
        </TripErrorState> : <div className="trip-service-status" role="status"><p>{configurationLoading ? "Vérification de la disponibilité…" : "La création gratuite est disponible, dans la limite quotidienne de la bêta."}</p></div>}
        <div className="planner-step-actions">{step > 0 ? <button className="planner-button planner-button-quiet" disabled={!hydrated || pending || preparingPhotos} onClick={() => goTo(step - 1)} type="button">Retour</button> : <span />}{!retryInPanel ? <button className="planner-button planner-button-primary" disabled={!hydrated || pending || preparingPhotos || Boolean(acceptedUrl) || (step === 2 && (!ready || !turnstileToken))} type="submit">{pending ? "Création du lien privé…" : step < 2 ? "Continuer" : "Créer mon voyage gratuitement"}</button> : null}</div>
        <p aria-live="polite" className="planner-feedback" role="status">{feedback}</p>
        {acceptedUrl ? <a className="planner-button planner-button-primary" href={acceptedUrl}>Ouvrir mon carnet privé</a> : null}
      </form>
      <aside aria-labelledby="trip-summary-title" className="planner-summary trip-summary"><h3 id="trip-summary-title">Ton voyage prend forme</h3><p className="trip-summary-destination">{draft.destination.trim() || "Une destination à choisir"}</p><p className="planner-summary-brief">{draft.brief.trim() || "Un long séjour ou une seule nuit : commence par ce qui te ferait plaisir."}</p><dl><div><dt>Départ</dt><dd>{draft.departureCity.trim() || "À préciser"}</dd></div><div><dt>Période</dt><dd>{draft.startDate ? new Date(`${draft.startDate}T12:00:00`).toLocaleDateString("fr-FR") : "Dates flexibles"}{draft.endDate ? ` au ${new Date(`${draft.endDate}T12:00:00`).toLocaleDateString("fr-FR")}` : ""}</dd></div><div><dt>Durée</dt><dd>{draft.durationDays || "…"} jour{Number(draft.durationDays) > 1 ? "s" : ""}</dd></div><div><dt>Voyageurs</dt><dd>{draft.travelers || "…"}</dd></div><div><dt>Transport</dt><dd>{transportModes.find(({ value }) => value === draft.transportMode)?.label}</dd></div><div><dt>Hébergement</dt><dd>{accommodationStyles.find(({ value }) => value === draft.accommodationStyle)?.label}</dd></div><div><dt>Budget total</dt><dd>{draft.budgetTotalEur ? `${draft.budgetTotalEur} €` : "À préciser"}</dd></div><div><dt>Photos</dt><dd>{photos.length ? `${photos.length} ajoutée${photos.length > 1 ? "s" : ""}` : "Sans portrait"}</dd></div></dl><p className="planner-help">Mon Florian prépare les choix. Les prix, disponibilités et conditions sont à confirmer auprès des hôtels et transporteurs ; aucune réservation n’est effectuée.</p><a className="planner-remove" href="/carnets/japon-10-jours">Voir le carnet Japon d’exemple</a></aside>
    </div>
  </section>;
}
