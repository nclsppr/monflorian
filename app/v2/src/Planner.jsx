import { useEffect, useRef, useState } from "react";
import {
  comfortOptions,
  DEFAULT_PLANNER_DRAFT,
  normalizePlannerDraft,
  paceOptions,
  parsePlannerDraft,
  plannerErrors,
  plannerText,
  PLANNER_STORAGE_KEY,
  serializePlannerDraft,
} from "./planner-state.mjs";
import "./planner.css";

const steps = ["Ton envie", "Ton rythme", "Ton confort"];

function ChoiceGroup({ name, label, options, value, onChange }) {
  return (
    <fieldset className="planner-choices">
      <legend>{label}</legend>
      {options.map((option) => (
        <label className="planner-choice" key={option.value}>
          <input checked={value === option.value} name={name} onChange={() => onChange(option.value)} type="radio" value={option.value} />
          <span><strong>{option.label}</strong><small>{option.detail}</small></span>
        </label>
      ))}
    </fieldset>
  );
}

export default function TripPlanner() {
  const [draft, setDraft] = useState({ ...DEFAULT_PLANNER_DRAFT });
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState("");
  const [hasSavedCopy, setHasSavedCopy] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState("");
  const [copyFallback, setCopyFallback] = useState(false);
  const stepTitle = useRef(null);
  const pendingFocus = useRef(false);
  const fallbackText = useRef(null);
  const normalized = normalizePlannerDraft(draft);
  const isSaved = Boolean(normalized && savedSnapshot === serializePlannerDraft(normalized));

  useEffect(() => {
    try {
      const serialized = window.localStorage.getItem(PLANNER_STORAGE_KEY);
      if (!serialized) return;
      setHasSavedCopy(true);
      const restored = parsePlannerDraft(serialized);
      if (!restored) {
        setFeedback("La copie enregistrée ne peut pas être relue. Tu peux la supprimer et préparer un nouveau pense-bête.");
        return;
      }
      setDraft(restored);
      setSavedSnapshot(serializePlannerDraft(restored));
      setFeedback("Ton pense-bête enregistré sur cet appareil est ouvert.");
    } catch {
      setFeedback("L’enregistrement sur cet appareil est indisponible. Tu peux quand même copier ou télécharger ton pense-bête.");
    }
  }, []);

  useEffect(() => {
    if (!pendingFocus.current) return;
    pendingFocus.current = false;
    stepTitle.current?.focus();
  }, [step]);

  useEffect(() => {
    if (copyFallback) {
      fallbackText.current?.focus();
      fallbackText.current?.select();
    }
  }, [copyFallback]);

  function update(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFeedback("");
    setCopyFallback(false);
  }

  function validate() {
    const nextErrors = plannerErrors(draft);
    setErrors(nextErrors);
    const first = Object.keys(nextErrors)[0];
    if (!first) return true;
    const errorStep = first === "brief" ? 0 : first === "comfort" ? 2 : 1;
    if (errorStep !== step) {
      pendingFocus.current = true;
      setStep(errorStep);
    } else {
      document.getElementById(`planner-${first}`)?.focus();
    }
    setFeedback("Vérifie les champs indiqués avant de continuer.");
    return false;
  }

  function goTo(nextStep) {
    if (nextStep > step && !validate()) return;
    pendingFocus.current = true;
    setStep(nextStep);
    setFeedback("");
  }

  async function copyBrief() {
    if (!validate()) return;
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(plannerText(draft));
      setFeedback("Pense-bête copié. Tu peux le coller dans tes notes ou l’envoyer à tes compagnons de voyage.");
      setCopyFallback(false);
    } catch {
      setCopyFallback(true);
      setFeedback("La copie automatique est indisponible. Le texte est sélectionné ci-dessous pour le copier toi-même.");
    }
  }

  function downloadBrief() {
    if (!validate()) return;
    let url;
    let link;
    try {
      url = URL.createObjectURL(new Blob([plannerText(draft)], { type: "text/plain;charset=utf-8" }));
      link = document.createElement("a");
      link.href = url;
      link.download = "mon-florian-brief-voyage.txt";
      document.body.append(link);
      link.click();
      setFeedback("Téléchargement du pense-bête demandé.");
    } catch {
      setFeedback("Le téléchargement est indisponible. Utilise « Copier mon pense-bête » pour le conserver.");
    } finally {
      link?.remove();
      if (url) window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }

  function saveBrief() {
    if (!validate()) return;
    try {
      const serialized = serializePlannerDraft(draft);
      window.localStorage.setItem(PLANNER_STORAGE_KEY, serialized);
      setSavedSnapshot(serialized);
      setHasSavedCopy(true);
      setFeedback("Pense-bête enregistré dans ce navigateur. Tu pourras le retrouver ici sur cet appareil.");
    } catch {
      setFeedback("L’enregistrement a échoué. Copie ou télécharge ton pense-bête pour le conserver.");
    }
  }

  function removeSavedBrief() {
    try {
      window.localStorage.removeItem(PLANNER_STORAGE_KEY);
      setHasSavedCopy(false);
      setSavedSnapshot("");
      setFeedback("La copie enregistrée est effacée. Ton pense-bête reste affiché jusqu’à ce que tu quittes la page.");
    } catch {
      setFeedback("La copie n’a pas pu être effacée. Tu peux supprimer les données de monflorian.com dans les réglages du navigateur.");
    }
  }

  return (
    <section aria-labelledby="questionnaire-title" className="planner-section" id="create">
      <div className="planner-heading">
        <h2 id="questionnaire-title">Prépare ton pense-bête de voyage.</h2>
        <p>Rassemble tes envies, puis garde une fiche à compléter ou à partager. Aucune réponse n’est envoyée et aucun itinéraire n’est généré.</p>
      </div>
      <noscript><p>Active JavaScript pour remplir ton pense-bête. Tu peux aussi suivre <a href="/guides/preparer-itineraire-voyage">la méthode de préparation</a> dans tes propres notes.</p></noscript>
      <div className="planner-layout">
        <form className="planner-form" noValidate onSubmit={(event) => { event.preventDefault(); if (step < 2) goTo(step + 1); else void copyBrief(); }}>
          <ol aria-label="Étapes du pense-bête" className="planner-steps">
            {steps.map((label, index) => (
              <li key={label}><button aria-current={step === index ? "step" : undefined} onClick={() => goTo(index)} type="button"><span>{index + 1}</span>{label}</button></li>
            ))}
          </ol>
          <h3 className="planner-step-title" ref={stepTitle} tabIndex="-1">{step + 1} sur 3 · {steps[step]}</h3>
          {step === 0 ? (
            <div className="planner-field">
              <label htmlFor="planner-brief">Le voyage que tu imagines <span>facultatif</span></label>
              <textarea aria-describedby="planner-brief-help planner-brief-error" aria-invalid={Boolean(errors.brief)} id="planner-brief" maxLength={2000} onChange={(event) => update("brief", event.target.value)} placeholder="Dix jours au Japon à deux, des quartiers à explorer à pied et une nuit dans un ryokan…" rows={6} value={draft.brief} />
              <p className="planner-help" id="planner-brief-help">Destination, saison, ville de départ, budget ou envies. Évite les noms, documents et autres informations personnelles.</p>
              <p className="planner-error" id="planner-brief-error">{errors.brief || ""}</p>
            </div>
          ) : null}
          {step === 1 ? (
            <>
              <div className="planner-number-fields">
                {[{ field: "days", label: "Nombre de jours", min: 2, max: 14 }, { field: "travelers", label: "Voyageurs", min: 1, max: 8 }].map(({ field, label, min, max }) => (
                  <div className="planner-field" key={field}>
                    <label htmlFor={`planner-${field}`}>{label}</label>
                    <input aria-describedby={`planner-${field}-help planner-${field}-error`} aria-invalid={Boolean(errors[field])} id={`planner-${field}`} inputMode="numeric" max={max} min={min} onChange={(event) => update(field, event.target.value)} step={1} type="number" value={draft[field]} />
                    <p className="planner-help" id={`planner-${field}-help`}>De {min} à {max}.</p>
                    <p className="planner-error" id={`planner-${field}-error`}>{errors[field] || ""}</p>
                  </div>
                ))}
              </div>
              <ChoiceGroup label="Quel rythme te ressemble ?" name="planner-pace" onChange={(value) => update("pace", value)} options={paceOptions} value={draft.pace} />
            </>
          ) : null}
          {step === 2 ? (
            <>
              <ChoiceGroup label="Quelle ambiance d’hébergement ?" name="planner-comfort" onChange={(value) => update("comfort", value)} options={comfortOptions} value={draft.comfort} />
              <p className="planner-help">Il restera à préciser tes dates et à vérifier les trajets, les prix et les réservations. Le carnet Japon reste un exemple indépendant de ce brief.</p>
            </>
          ) : null}
          <div className="planner-step-actions">
            {step > 0 ? <button className="planner-button planner-button-quiet" onClick={() => goTo(step - 1)} type="button">Retour</button> : <span />}
            <button className="planner-button planner-button-primary" type="submit">{step < 2 ? "Continuer" : "Copier mon pense-bête"}</button>
          </div>
        </form>
        <aside aria-labelledby="planner-summary-title" className="planner-summary">
          <h3 id="planner-summary-title">Ta fiche de départ</h3>
          <p className="planner-summary-brief">{draft.brief.trim() || "Tes envies apparaîtront ici. Tu peux aussi commencer par la durée et le rythme."}</p>
          <dl>
            <div><dt>Durée</dt><dd>{normalized ? `${normalized.days} jours` : "À préciser"}</dd></div>
            <div><dt>Voyageurs</dt><dd>{normalized ? normalized.travelers : "À préciser"}</dd></div>
            <div><dt>Rythme</dt><dd>{paceOptions.find((option) => option.value === draft.pace)?.label}</dd></div>
            <div><dt>Hébergement</dt><dd>{comfortOptions.find((option) => option.value === draft.comfort)?.label}</dd></div>
          </dl>
          <button className="planner-button planner-button-secondary" onClick={downloadBrief} type="button">Télécharger la fiche .txt</button>
          <div className="planner-storage">
            <p>Le pense-bête reste dans cette page. Pour le retrouver après l’avoir fermée, enregistre une copie dans ce navigateur. Elle n’est jamais envoyée et reste ici jusqu’à sa suppression.</p>
            <button className="planner-button planner-button-secondary" onClick={saveBrief} type="button">{hasSavedCopy && !isSaved ? "Mettre à jour la copie" : "Garder sur cet appareil"}</button>
            {hasSavedCopy ? <p className="planner-save-state">{isSaved ? "La copie enregistrée est à jour." : "Les modifications affichées ne sont pas enregistrées."}</p> : null}
            {hasSavedCopy ? <button className="planner-remove" onClick={removeSavedBrief} type="button">Effacer de cet appareil</button> : null}
          </div>
        </aside>
      </div>
      <p aria-live="polite" className="planner-feedback" role="status">{feedback}</p>
      {copyFallback && normalized ? <div className="planner-manual-copy"><label htmlFor="planner-copy-text">Ton pense-bête à copier</label><textarea id="planner-copy-text" readOnly ref={fallbackText} rows={12} value={plannerText(normalized)} /></div> : null}
    </section>
  );
}
