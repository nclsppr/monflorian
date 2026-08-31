import { StrictMode, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";

import "@fontsource-variable/outfit";
import "@astryxdesign/core/astryx.css";
import "@astryxdesign/theme-matcha/theme.css";

import { Badge } from "@astryxdesign/core/Badge";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { ClickableCard } from "@astryxdesign/core/ClickableCard";
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import { Layout, LayoutContent, LayoutFooter } from "@astryxdesign/core/Layout";
import { NumberInput } from "@astryxdesign/core/NumberInput";
import { ProgressBar } from "@astryxdesign/core/ProgressBar";
import {
  SegmentedControl,
  SegmentedControlItem,
} from "@astryxdesign/core/SegmentedControl";
import { SelectableCard } from "@astryxdesign/core/SelectableCard";
import { Step, Stepper } from "@astryxdesign/core/Stepper";
import { TextArea } from "@astryxdesign/core/TextArea";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Theme } from "@astryxdesign/core/theme";
import { InternationalizationProvider } from "@astryxdesign/core/i18n";
import frMessages from "@astryxdesign/core/locales/fr-FR.json";
import { matchaTheme } from "@astryxdesign/theme-matcha/built";

import {
  exampleTrips,
  generationStatuses,
  japanTrip,
  travelGuideLabels,
} from "./data.js";
import "./v2.css";

const PRIVATE_DEFAULT_PASSWORD = "MOMIJI26";

const priorityVariants = {
  comfort: "neutral",
  essential: "blue",
  optional: "neutral",
  recommended: "green",
};

function Icon({ name, size = 20 }) {
  const common = {
    "aria-hidden": "true",
    fill: "none",
    height: size,
    stroke: "currentColor",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    strokeWidth: 1.8,
    viewBox: "0 0 24 24",
    width: size,
  };

  if (name === "arrow") {
    return <svg {...common}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
  }
  if (name === "share") {
    return (
      <svg {...common}>
        <circle cx="18" cy="5" r="2.4" />
        <circle cx="6" cy="12" r="2.4" />
        <circle cx="18" cy="19" r="2.4" />
        <path d="m8.1 10.8 7.8-4.5M8.1 13.2l7.8 4.5" />
      </svg>
    );
  }
  if (name === "lock") {
    return (
      <svg {...common}>
        <rect height="10" rx="2" width="14" x="5" y="10" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </svg>
    );
  }
  if (name === "calendar") {
    return (
      <svg {...common}>
        <rect height="16" rx="2" width="18" x="3" y="5" />
        <path d="M8 3v4M16 3v4M3 10h18" />
      </svg>
    );
  }
  if (name === "people") {
    return (
      <svg {...common}>
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 5.5a3 3 0 0 1 0 5.5M16.5 14a4.5 4.5 0 0 1 4 4.5" />
      </svg>
    );
  }
  return <svg {...common}><path d="m5 12 4 4L19 6" /></svg>;
}

function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function routeFromLocation() {
  const params = new URLSearchParams(window.location.search);
  return {
    access: params.get("acces"),
    example: params.get("exemple"),
    proof: params.get("preuve"),
    trip: params.get("voyage"),
  };
}

function formatMinutes(minutes) {
  if (!minutes) return "Sur place";
  if (minutes < 60) return String(minutes) + " min";
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? hours + " h " + remainder : hours + " h";
}

function formatDayRange(start, end) {
  return start === end ? "Jour " + start : "Jours " + start + "–" + end;
}

function LinkedVerifications({ items }) {
  if (!items?.length) return null;
  return (
    <p className="linked-verifications">
      <strong>À revérifier :</strong>{" "}
      {items.map((item) => `${item.topic} (${item.timingLabel.toLowerCase()})`).join(" · ")}{" "}
      <a href="#verify">Voir les sources</a>
    </p>
  );
}

async function hashPassword(value) {
  const bytes = new TextEncoder().encode(value.normalize("NFKC"));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const area = document.createElement("textarea");
  area.value = value;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.append(area);
  area.select();
  document.execCommand("copy");
  area.remove();
}

function BrandHeader({ isGate, isTrip, onHome, onOpenTrip, onShare }) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <button
          aria-label="Mon Florian, revenir au début"
          className="brand-button brand"
          onClick={onHome}
          type="button"
        >
          <span aria-hidden="true" className="brand-character">
            <img alt="" height="384" src="/assets/florian-v2-original-web.webp" width="384" />
          </span>
          <img
            alt=""
            className="brand-wordmark"
            height="181"
            src="/assets/monflorian-wordmark-web.webp"
            width="338"
          />
        </button>
        <nav aria-label="Navigation principale" className="desktop-nav">
          <button onClick={() => (onHome(), setTimeout(() => scrollToId("how"), 0))} type="button">
            Comment ça marche
          </button>
          <button onClick={() => (onHome(), setTimeout(() => scrollToId("create"), 0))} type="button">
            Préparer le mien
          </button>
          <button onClick={() => (onHome(), setTimeout(() => scrollToId("examples"), 0))} type="button">
            Inspirations
          </button>
        </nav>
        {isGate ? (
          <span className="header-gate-state"><Icon name="lock" size={16} /> Accès privé</span>
        ) : isTrip ? (
          <Button
            className="header-action"
            icon={<Icon name="share" size={17} />}
            label="Partager"
            onClick={onShare}
            size="lg"
            variant="primary"
          />
        ) : (
          <Button
            className="header-action"
            label="Voir le carnet"
            onClick={onOpenTrip}
            size="lg"
            variant="secondary"
          />
        )}
      </div>
    </header>
  );
}

function BrandIntro({ onPastChange }) {
  const [isCompact, setIsCompact] = useState(() => window.matchMedia("(max-width: 760px)").matches);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 760px)");
    const update = () => setIsCompact(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    let observer;
    let frame;

    function observeIntro() {
      observer?.disconnect();
      if (isCompact) {
        onPastChange(true);
        return;
      }
      const header = document.querySelector(".site-header");
      const trigger = document.querySelector(".brand-intro-trigger");
      if (!header || !trigger || typeof IntersectionObserver !== "function") {
        onPastChange(true);
        return;
      }
      onPastChange(false);
      const headerHeight = Math.ceil(header.getBoundingClientRect().height);
      observer = new IntersectionObserver(([entry]) => {
        const introIsPast = !entry.isIntersecting && entry.boundingClientRect.top <= headerHeight;
        onPastChange(introIsPast);
      }, {
        rootMargin: "-" + headerHeight + "px 0px 0px 0px",
        threshold: 0,
      });
      observer.observe(trigger);
    }

    frame = window.requestAnimationFrame(observeIntro);
    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [isCompact, onPastChange]);

  if (isCompact) return null;

  return (
    <div aria-hidden="true" className="brand-intro">
      <span className="brand-intro-content">
        <span className="brand-intro-lockup">
          <span className="brand-character">
            <img alt="" height="1024" src="/assets/florian-v2-original-intro.webp" width="1024" />
          </span>
          <img
            alt=""
            className="brand-wordmark"
            height="724"
            src="/assets/monflorian-wordmark-intro.webp"
            width="1352"
          />
        </span>
        <span className="brand-intro-tagline">
          <svg
            aria-hidden="true"
            className="brand-intro-tagline-paper"
            focusable="false"
            preserveAspectRatio="none"
            viewBox="0 0 440 88"
          >
            <path d="M22 20 C104 11 179 24 266 17 S388 16 422 25" />
            <path d="M11 43 C96 33 183 49 276 39 S390 38 429 46" />
            <path d="M25 67 C105 58 194 72 284 62 S386 62 414 69" />
          </svg>
          <span>Alors, on part où&nbsp;?</span>
        </span>
      </span>
      <span className="brand-intro-trigger" />
    </div>
  );
}

function PhotoChapter({ alt, city, eager = false, mobileSrc, src, note }) {
  return (
    <figure className="photo-chapter">
      <img
        alt={alt}
        decoding="async"
        fetchPriority={eager ? "high" : "auto"}
        height="960"
        loading={eager ? "eager" : "lazy"}
        sizes="(max-width: 760px) 100vw, (max-width: 1200px) 80vw, 1120px"
        src={src}
        srcSet={mobileSrc ? mobileSrc + " 720w, " + src + " 1440w" : undefined}
        width="1440"
      />
      <div aria-hidden="true" className="photo-wash" />
      <strong className="photo-city">{city}</strong>
      {note ? <figcaption>{note}</figcaption> : null}
    </figure>
  );
}

function PromisePhone() {
  const image = japanTrip.featuredImage.asset;
  return (
    <div className="promise-phone-stage">
      <article aria-label="Aperçu du carnet Japon dans un téléphone" className="promise-phone">
        <div aria-hidden="true" className="phone-island" />
        <div className="phone-screen">
          <div className="phone-app-bar"><span>Mon Florian</span><span>•••</span></div>
          <figure className="phone-cover">
            <img
              alt="Le couple du carnet découvre Tokyo à la tombée du jour"
              decoding="async"
              fetchPriority="high"
              height={image.height}
              sizes="(max-width: 760px) 82vw, 360px"
              src={image.src}
              srcSet={image.mobileSrc + " 720w, " + image.src + " 1440w"}
              width={image.width}
            />
            <div className="phone-cover-copy">
              <span>10 jours · 2 voyageurs</span>
              <strong>Le Japon à deux</strong>
              <small>Tokyo → Hakone → Kyoto</small>
            </div>
          </figure>
          <div className="phone-route" aria-label="Trois étapes">
            {japanTrip.accommodations.map((stay) => (
              <span key={stay.id}><i />{stay.destination}<small>{stay.nightsLabel}</small></span>
            ))}
          </div>
          <div className="phone-preview-days">
            {japanTrip.days.slice(0, 3).map((day) => (
              <div className="phone-preview-day" key={day.day}>
                <span>J{day.day}</span>
                <div><strong>{day.title}</strong><small>{day.moments[0].title}</small></div>
              </div>
            ))}
          </div>
          <div className="phone-florian-note">
            <img alt="" height="384" src="/assets/florian-v2-original-web.webp" width="384" />
            <p><strong>Le choix de Florian</strong> Trois bases seulement, pour voir beaucoup sans refaire les valises chaque matin.</p>
          </div>
        </div>
      </article>
      <span className="phone-caption">Ton itinéraire, tes hôtels et les réservations à prévoir, au même endroit.</span>
    </div>
  );
}

function Hero({ onOpenTrip }) {
  return (
    <section className="home-hero" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="eyebrow">FLORIAN, TON COPILOTE DE VOYAGE</p>
        <h1 id="hero-title">Tu donnes l’envie.<br />Je construis le chemin.</h1>
        <p className="hero-intro">
          Décris le voyage que tu imagines. Florian organise les étapes, les trajets,
          les quartiers où dormir et les journées qui respirent, puis réunit tout
          dans un carnet facile à consulter et à partager.
        </p>
        <div className="hero-actions">
          <Button
            endContent={<Icon name="arrow" />}
            label="Ouvrir le carnet Japon"
            onClick={onOpenTrip}
            size="lg"
            variant="primary"
          />
          <button className="text-link" onClick={() => scrollToId("create")} type="button">
            Préparer le mien
          </button>
        </div>
        <p className="hero-demo-note">
          <strong>Exemple interactif.</strong> Découvre le format avec dix jours au Japon.
          Tes réponses restent dans cette page et ouvrent ce même carnet.
        </p>
        <ul className="hero-trust" aria-label="Cadre de la démonstration">
          <li>Aucune réservation automatique</li>
          <li>Aucune donnée personnelle demandée</li>
          <li>Partage simulé</li>
        </ul>
      </div>
      <PromisePhone />
    </section>
  );
}

function WhatYouReceive() {
  const items = [
    ["01", "Un parcours cohérent", "Les étapes, les nuits et les transferts suivent une logique simple à comprendre."],
    ["02", "Dix journées détaillées", "Matin, après-midi, soir, temps de trajet et solution en cas de pluie ou de fatigue."],
    ["03", "Des choix à réserver", "Hôtels, trains et activités sont classés par priorité, avec les points à vérifier."],
    ["04", "Un carnet commun", "Une seule page à garder sous la main et à envoyer aux personnes qui voyagent avec toi."],
  ];
  return (
    <section className="deliverables-section" aria-labelledby="deliverables-title">
      <div className="section-heading compact-heading">
        <div>
          <p className="eyebrow">CE QUE TU REÇOIS</p>
          <h2 id="deliverables-title">Pas une liste d’idées. Un voyage que tu peux décider.</h2>
        </div>
        <p>Chaque recommandation a une place, une raison et un niveau de priorité.</p>
      </div>
      <div className="deliverable-grid">
        {items.map(([number, title, copy]) => (
          <article className="deliverable-item" key={number}>
            <span>{number}</span><h3>{title}</h3><p>{copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function JapanProof({ onOpenTrip }) {
  const garden = japanTrip.chapters[1].image.asset;
  return (
    <section className="guide-proof-section" aria-labelledby="proof-title">
      <div className="guide-proof-visual">
        <PhotoChapter
          alt="Le couple se promène dans le jardin Hama-rikyu à Tokyo"
          city={garden.overlayLabel}
          mobileSrc={garden.mobileSrc}
          src={garden.src}
        />
      </div>
      <div className="guide-proof-copy">
        <p className="eyebrow">UN CARNET COMPLET, AVANT LE FORMULAIRE</p>
        <h2 id="proof-title">Le Japon à deux, prêt à être exploré.</h2>
        <p>{japanTrip.trip.summary}</p>
        <ol className="proof-route" aria-label="Itinéraire du carnet Japon">
          {japanTrip.accommodations.map((stay, index) => (
            <li key={stay.id}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div><strong>{stay.destination}</strong><small>{stay.nightsLabel} · {stay.recommendedAreasLabel}</small></div>
            </li>
          ))}
        </ol>
        <ul className="proof-facts">
          <li><strong>10</strong> journées détaillées</li>
          <li><strong>5</strong> grands chapitres illustrés</li>
          <li><strong>{japanTrip.reservationPlan.length}</strong> décisions à anticiper</li>
        </ul>
        <Button
          endContent={<Icon name="arrow" />}
          label="Voir le carnet complet"
          onClick={onOpenTrip}
          size="lg"
          variant="primary"
        />
      </div>
    </section>
  );
}

const paceOptions = [
  { key: "calme", title: "Calme", note: "Une grande idée par jour" },
  { key: "equilibre", title: "Équilibré", note: "Des temps forts et du temps libre" },
  { key: "intense", title: "Intense", note: "Profiter de chaque créneau" },
];

const comfortOptions = [
  { key: "charme", title: "Hôtels de charme", note: "Adresses singulières et bien placées" },
  { key: "confort", title: "Confort essentiel", note: "Pratique, calme et sans détour" },
  { key: "mixte", title: "Un mélange", note: "Une belle nuit, puis des bases simples" },
];

function TripQuestionnaire({ onGenerate }) {
  const [step, setStep] = useState(0);
  const [brief, setBrief] = useState("");
  const [days, setDays] = useState(10);
  const [travelers, setTravelers] = useState(2);
  const [pace, setPace] = useState("equilibre");
  const [comfort, setComfort] = useState("charme");

  function goTo(nextStep) {
    setStep(nextStep);
    document.getElementById("questionnaire-title")?.focus({ preventScroll: true });
  }

  return (
    <section className="composer-section" id="create" aria-labelledby="questionnaire-title">
      <div className="section-heading composer-heading">
        <div>
          <p className="eyebrow">ESSAIE LE PARCOURS</p>
          <h2 id="questionnaire-title" tabIndex="-1">À quoi ressemble ton prochain voyage ?</h2>
        </div>
        <p>
          Trois étapes courtes pour tester la préparation. Cet exemple ouvre toujours
          le même carnet Japon et n’envoie aucune réponse.
        </p>
      </div>
      <div className="composer-layout">
        <Card className="composer-card" elevation="low" padding={6}>
          <Stepper
            activeStep={step}
            density="compact"
            indicatorPosition="on-track"
            label="Préparation du voyage"
            onStepClick={goTo}
          >
            <Step label="L’envie" step={0} />
            <Step label="Le rythme" step={1} />
            <Step label="Le confort" step={2} />
          </Stepper>
          <form
            className="questionnaire-form"
            onSubmit={(event) => {
              event.preventDefault();
              onGenerate({ brief, comfort, days, pace, travelers });
            }}
          >
            <div className="step-panel" key={step}>
              {step === 0 ? (
                <div className="field-stack">
                  <div className="step-kicker">01 · RACONTE-MOI</div>
                  <div className="brief-field">
                    <TextArea
                      description="Une destination, une saison, une sensation ou simplement une envie de partir."
                      isOptional
                      label="Le voyage que tu imagines"
                      maxLength={2000}
                      onChange={setBrief}
                      placeholder="Dix jours au Japon à deux, entre quartiers vivants, sources chaudes et temples. On veut voir beaucoup sans courir…"
                      rows={7}
                      size="lg"
                      value={brief}
                      width="100%"
                    />
                  </div>
                  <p className="field-hint">Évite ici les noms, documents ou autres informations personnelles.</p>
                </div>
              ) : null}
              {step === 1 ? (
                <div className="field-stack">
                  <div className="step-kicker">02 · DONNE LE TEMPO</div>
                  <div className="number-grid">
                    <NumberInput isIntegerOnly label="Nombre de jours" max={14} min={2} onChange={setDays} units="jours" value={days} width="100%" />
                    <NumberInput isIntegerOnly label="Voyageurs" max={8} min={1} onChange={setTravelers} units="personnes" value={travelers} width="100%" />
                  </div>
                  <fieldset className="selection-fieldset">
                    <legend>Quel rythme te ressemble ?</legend>
                    <div className="selection-grid">
                      {paceOptions.map((option) => (
                        <SelectableCard
                          isSelected={pace === option.key}
                          key={option.key}
                          label={option.title}
                          onChange={() => setPace(option.key)}
                          padding={4}
                          variant={pace === option.key ? "blue" : "default"}
                        >
                          <strong>{option.title}</strong><span>{option.note}</span>
                        </SelectableCard>
                      ))}
                    </div>
                  </fieldset>
                </div>
              ) : null}
              {step === 2 ? (
                <div className="field-stack">
                  <div className="step-kicker">03 · CHOISIS TA BASE</div>
                  <fieldset className="selection-fieldset">
                    <legend>Quelle ambiance d’hôtel ?</legend>
                    <div className="selection-grid">
                      {comfortOptions.map((option) => (
                        <SelectableCard
                          isSelected={comfort === option.key}
                          key={option.key}
                          label={option.title}
                          onChange={() => setComfort(option.key)}
                          padding={4}
                          variant={comfort === option.key ? "green" : "default"}
                        >
                          <strong>{option.title}</strong><span>{option.note}</span>
                        </SelectableCard>
                      ))}
                    </div>
                  </fieldset>
                  <div className="demo-disclosure">
                    <strong>Ce que fait cet exemple</strong>
                    <p>
                      Il montre le parcours et le niveau de détail du carnet. Les réponses
                      restent dans ton navigateur, ne sont pas enregistrées et n’influencent
                      pas la proposition Japon dans cette démonstration.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
            <div className="form-actions">
              {step > 0 ? <Button label="Retour" onClick={() => goTo(step - 1)} size="lg" variant="ghost" /> : <span />}
              {step < 2 ? (
                <Button endContent={<Icon name="arrow" />} label="Continuer" onClick={() => goTo(step + 1)} size="lg" variant="primary" />
              ) : (
                <Button endContent={<Icon name="arrow" />} label="Voir la proposition Japon" size="lg" type="submit" variant="primary" />
              )}
            </div>
          </form>
        </Card>
        <aside className="composer-aside">
          <div className="composer-aside-signature">
            <img alt="" height="384" src="/assets/florian-v2-original-web.webp" width="384" />
            <p className="aside-label">CE QUE FLORIAN ORGANISE</p>
          </div>
          <div className="route-line" aria-hidden="true">
            <span>Départ</span><i /><span>Respirer</span><i /><span>S’émerveiller</span>
          </div>
          <blockquote>
            “Je garde les journées que tu attends, mais aussi les heures où rien
            n’est prévu. C’est souvent là que le voyage commence vraiment.”
          </blockquote>
          <ul>
            <li><Icon name="check" /> Un ordre qui limite les détours</li>
            <li><Icon name="check" /> Des hôtels à comparer sur Booking.com</li>
            <li><Icon name="check" /> Les réservations classées par priorité</li>
          </ul>
        </aside>
      </div>
    </section>
  );
}

function Examples({ onOpen }) {
  return (
    <section className="examples-section" id="examples">
      <div className="section-heading">
        <div><p className="eyebrow">TROIS AUTRES FAÇONS DE PARTIR</p><h2>Le même cadre, jamais le même voyage.</h2></div>
        <p>Chaque parcours relie les étapes, les respirations et les bonnes bases où dormir.</p>
      </div>
      <div className="example-grid">
        {exampleTrips.map((trip) => (
          <ClickableCard className="example-card" elevation="low" key={trip.slug} label={"Découvrir " + trip.title} onClick={() => onOpen(trip)} padding={0}>
            <div className="example-image">
              <img alt={trip.subtitle} decoding="async" height="960" loading="lazy" src={trip.image} width="1440" />
              <strong>{trip.coverLabel}</strong>
            </div>
            <div className="example-copy">
              <p className="card-eyebrow">{trip.eyebrow}</p>
              <h3>{trip.title}</h3><p className="example-subtitle">{trip.subtitle}</p>
              <p className="example-route">{trip.route}</p>
              <span className="card-link">Voir le parcours <Icon name="arrow" size={18} /></span>
            </div>
          </ClickableCard>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="how-section" id="how">
      <div className="how-intro">
        <p className="eyebrow">SIMPLEMENT BIEN PRÉPARÉ</p>
        <h2>Moins de comparaisons.<br />Plus de décisions claires.</h2>
      </div>
      <ol className="how-list">
        <li><span>01</span><div><h3>Tu racontes</h3><p>Une phrase suffit. Ajoute le rythme, le nombre de jours et ce qui compte pour toi.</p></div></li>
        <li><span>02</span><div><h3>Florian relie</h3><p>Les étapes s’enchaînent sans zigzag, avec des journées qui respirent et des hôtels bien placés.</p></div></li>
        <li><span>03</span><div><h3>Tu décides</h3><p>Le carnet distingue l’essentiel du facultatif et rassemble les points à vérifier avant de réserver.</p></div></li>
      </ol>
    </section>
  );
}

function Questions() {
  const questions = [
    ["Les prix sont-ils en temps réel ?", "Non. Les liens ouvrent une recherche Booking.com et les prix, disponibilités et conditions doivent être vérifiés au moment de réserver."],
    ["Est-ce que Mon Florian réserve à ma place ?", "Non. Le carnet organise les décisions et te conduit vers les services concernés, sans acheter ni confirmer quoi que ce soit."],
    ["Que deviennent mes réponses ?", "Dans cet exemple, elles restent dans ton navigateur, ne sont pas envoyées et ouvrent toujours le même carnet Japon."],
    ["Dois-je ajouter des photos ?", "Non. Ce parcours de démonstration ne demande aucun portrait. Les cinq images du carnet utilisent un couple fictif créé pour cet exemple."],
  ];
  return (
    <section className="questions-section" aria-labelledby="questions-title">
      <div>
        <p className="eyebrow">AVANT DE COMMENCER</p>
        <h2 id="questions-title">Ce que fait le carnet. Et ce qu’il ne fait pas.</h2>
      </div>
      <div className="questions-list">
        {questions.map(([question, answer], index) => (
          <details key={question} open={index === 0}>
            <summary>{question}</summary>
            <p>{answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function MobileCta() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const composer = document.getElementById("create");
    if (!composer || typeof IntersectionObserver !== "function") return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible(!entry.isIntersecting && entry.boundingClientRect.top > 0);
    }, { rootMargin: "0px 0px -20% 0px" });
    observer.observe(composer);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={"mobile-cta" + (isVisible ? "" : " is-hidden")}>
      <Button
        endContent={<Icon name="arrow" size={18} />}
        label="Préparer mon voyage"
        onClick={() => scrollToId("create")}
        size="lg"
        variant="primary"
      />
    </div>
  );
}

function HomePage({ onGenerate, onOpenExample, onOpenTrip }) {
  return (
    <main id="main-content">
      <Hero onOpenTrip={onOpenTrip} />
      <WhatYouReceive />
      <JapanProof onOpenTrip={onOpenTrip} />
      <TripQuestionnaire onGenerate={onGenerate} />
      <Examples onOpen={onOpenExample} />
      <HowItWorks />
      <Questions />
      <MobileCta />
    </main>
  );
}

function GeneratingPage({ onDone }) {
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    const statusTimer = window.setInterval(() => {
      setStatusIndex((current) => Math.min(current + 1, generationStatuses.length - 1));
    }, 360);
    const doneTimer = window.setTimeout(onDone, 1200);
    return () => {
      window.clearInterval(statusTimer);
      window.clearTimeout(doneTimer);
    };
  }, [onDone]);

  const complete = statusIndex === generationStatuses.length - 1;
  const progress = ((statusIndex + 1) / generationStatuses.length) * 100;

  return (
    <main className="generating-page" id="main-content">
      <div className="generation-card">
        <span className="generation-count">EXEMPLE JAPON · 10 JOURS · 3 BASES</span>
        <div className="generation-mark" aria-hidden="true">
          {complete ? (
            <span className="t-success-check" data-state="in">
              <svg fill="none" height="72" viewBox="0 0 48 48" width="72">
                <path d="m8 25 10 10 22-24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
              </svg>
            </span>
          ) : <span className="paper-plane">↗</span>}
        </div>
        <p className="eyebrow">OUVERTURE DE L’EXEMPLE</p>
        <h1>{generationStatuses[statusIndex]}</h1>
        <p className="generation-note">Aucune réponse n’est envoyée : ce passage ouvre le carnet Japon déjà préparé.</p>
        <ProgressBar
          hasValueLabel
          label="Préparation du carnet"
          value={progress}
          variant={complete ? "success" : "accent"}
        />
        <div aria-live="polite" className="sr-only">{generationStatuses[statusIndex]}</div>
      </div>
    </main>
  );
}

function TripHero({ onShare }) {
  const { trip, featuredImage } = japanTrip;
  return (
    <section className="trip-hero" aria-labelledby="trip-title">
      <div className="trip-hero-image">
        <PhotoChapter
          alt="Le couple du carnet marche dans Tokyo à la tombée du jour"
          city={featuredImage.asset.overlayLabel}
          eager
          mobileSrc={featuredImage.asset.mobileSrc}
          src={featuredImage.asset.src}
        />
      </div>
      <div className="trip-hero-copy">
        <p className="eyebrow">{trip.destination.toUpperCase()} · {trip.durationDays} JOURS</p>
        <h1 id="trip-title">{trip.title}</h1>
        <p className="trip-subtitle">{trip.subtitle}</p>
        <p className="trip-route">{trip.routeLabel}</p>
        <div className="trip-meta">
          <span><Icon name="calendar" /> {trip.durationDays} jours</span>
          <span><Icon name="people" /> {trip.travelerCount} voyageurs</span>
          <Badge label={"Rythme " + trip.paceLabel.toLowerCase()} variant="success" />
        </div>
        <p className="trip-summary">{trip.summary}</p>
        <Button icon={<Icon name="share" />} label="Partager ce voyage" onClick={onShare} size="lg" variant="primary" />
        <p className="trip-demo-label">Exemple sans donnée personnelle · Prix et disponibilités à vérifier</p>
      </div>
    </section>
  );
}

function RouteOverview() {
  return (
    <section className="route-overview-section" id="overview" aria-labelledby="route-title">
      <div className="section-heading compact-heading">
        <div><p className="eyebrow">LE FIL DU VOYAGE</p><h2 id="route-title">Trois bases, deux transferts entre étapes.</h2></div>
        <p>Les grandes valises ne changent d’hôtel que deux fois en dix jours.</p>
      </div>
      <ol className="route-overview">
        {japanTrip.accommodations.map((stay, index) => {
          const transfer = index < japanTrip.accommodations.length - 1
            ? japanTrip.days.find((day) => day.day === stay.checkOutDay && day.transfer.needed)
            : null;
          return (
            <li className="route-overview-stop" key={stay.id}>
              <article>
                <span className="route-stop-index">0{index + 1}</span>
                <p>{stay.propertyTypeLabel} · {stay.nightsLabel}</p>
                <h3>{stay.destination}</h3>
                <strong>{stay.recommendedAreasLabel}</strong>
                <small>Arrivée J{stay.checkInDay} · départ J{stay.checkOutDay}</small>
              </article>
              {transfer ? (
                <div className="route-connection">
                  <span>{formatMinutes(transfer.transfer.durationMinutes)}</span>
                  <i aria-hidden="true" />
                  <small>{transfer.transfer.modeLabels.join(" + ")}</small>
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function FlorianRationale() {
  return (
    <section className="florian-note" aria-label="Pourquoi cet itinéraire">
      <div className="florian-mini">
        <img alt="Florian" height="384" src="/assets/florian-v2-original-web.webp" width="384" />
      </div>
      <div>
        <p className="eyebrow">POURQUOI CET ORDRE</p>
        <blockquote>{japanTrip.trip.florianRationale}</blockquote>
      </div>
    </section>
  );
}

function MomentCard({ moment }) {
  const reservationVariant = moment.reservation === "required"
    ? "blue"
    : moment.reservation === "recommended" ? "green" : "neutral";
  return (
    <article className="moment-card">
      <div className="moment-heading">
        <span>{moment.periodLabel}</span>
        <Badge label={moment.reservationLabel} variant={reservationVariant} />
      </div>
      <h4>{moment.title}</h4>
      <p>{moment.description}</p>
      <dl className="moment-meta">
        <div><dt>Durée</dt><dd>{formatMinutes(moment.durationMinutes)}</dd></div>
        <div><dt>Trajet local</dt><dd>{formatMinutes(moment.travelMinutes)}</dd></div>
        <div><dt>Budget</dt><dd>{moment.costLevelLabel}</dd></div>
      </dl>
      <p className="moment-fit"><strong>Pourquoi ici :</strong> {moment.whyThisFits}</p>
      <p className="moment-tip"><strong>À savoir :</strong> {moment.practicalTip}</p>
      <LinkedVerifications items={moment.verificationItems} />
      <details className="moment-alternatives">
        <summary>Plan pluie ou fatigue</summary>
        <div><strong>S’il pleut</strong><p>{moment.rainAlternative}</p></div>
        <div><strong>Si la fatigue arrive</strong><p>{moment.fatigueAlternative}</p></div>
      </details>
    </article>
  );
}

function TransferCard({ transfer }) {
  return (
    <aside className="transfer-card">
      <div><span>TRANSFERT DU JOUR</span><strong>{formatMinutes(transfer.durationMinutes)}</strong></div>
      <p>{transfer.description}</p>
      <dl>
        <div><dt>Modes à prévoir</dt><dd>{transfer.modeLabels.join(" · ")}</dd></div>
        <div><dt>Réservation</dt><dd>{transfer.reservationLabel}</dd></div>
        <div><dt>Bagages</dt><dd>{transfer.luggageAdvice}</dd></div>
      </dl>
      <LinkedVerifications items={transfer.verificationItems} />
    </aside>
  );
}

function Day({ item }) {
  const timeline = [];
  if (item.transfer.needed && item.transfer.placement === "before_morning") {
    timeline.push(<TransferCard key={String(item.day) + "-transfer"} transfer={item.transfer} />);
  }
  item.moments.forEach((moment) => {
    timeline.push(<MomentCard key={String(item.day) + "-" + moment.period} moment={moment} />);
    if (item.transfer.needed && item.transfer.placement === "after_" + moment.period) {
      timeline.push(<TransferCard key={String(item.day) + "-transfer"} transfer={item.transfer} />);
    }
  });

  return (
    <li className="day-item">
      <div className="day-number"><span>JOUR</span><strong>{String(item.day).padStart(2, "0")}</strong></div>
      <div className="day-copy">
        <div className="day-heading">
          <div><p>{item.cityLabel}</p><h3>{item.title}</h3></div>
          <Badge label={item.energyLabel} variant={item.energy === "light" ? "green" : "neutral"} />
        </div>
        <p className="day-summary">{item.summary}</p>
        <div className="moment-grid">{timeline}</div>
      </div>
    </li>
  );
}

function Chapter({ chapter, index }) {
  return (
    <section className="chapter-block" aria-labelledby={"chapter-" + String(index + 1)}>
      {index > 0 ? (
        <PhotoChapter
          alt={chapter.image.altText}
          city={chapter.image.asset.overlayLabel}
          mobileSrc={chapter.image.asset.mobileSrc}
          note={formatDayRange(chapter.dayStart, chapter.dayEnd).toUpperCase()}
          src={chapter.image.asset.src}
        />
      ) : null}
      <div className="chapter-heading">
        <p className="eyebrow">ÉTAPE {String(index + 1).padStart(2, "0")} · {formatDayRange(chapter.dayStart, chapter.dayEnd).toUpperCase()}</p>
        <h2 id={"chapter-" + String(index + 1)}>{chapter.title}</h2>
        <p>{chapter.summary}</p>
        <blockquote>{chapter.whyItWorks}</blockquote>
      </div>
      <ol className="day-list" start={chapter.dayStart}>
        {chapter.days.map((day) => <Day item={day} key={day.day} />)}
      </ol>
    </section>
  );
}

function HotelsSection() {
  return (
    <section className="hotels-section" id="hotels" aria-labelledby="hotels-title">
      <div className="section-heading">
        <div><p className="eyebrow">OÙ POSER LES VALISES</p><h2 id="hotels-title">Trois recherches, avec les bons critères.</h2></div>
        <p>Les liens ouvrent Booking.com par ville. Les prix, disponibilités et conditions restent à vérifier avant toute réservation.</p>
      </div>
      <div className="hotel-grid">
        {japanTrip.accommodations.map((stay) => (
          <Card className="hotel-card" elevation="low" key={stay.id} padding={5}>
            <div className="hotel-top"><span>{stay.nightsLabel}</span><Badge label={stay.destination} variant="blue" /></div>
            <p className="hotel-type">{stay.propertyTypeLabel} · {stay.priorityLabel}</p>
            <h3>{stay.recommendedAreasLabel}</h3>
            <p>{stay.rationale}</p>
            <div className="hotel-criteria">
              <strong>À rechercher</strong>
              <ul>{stay.selectionCriteria.map((criterion) => <li key={criterion}>{criterion}</li>)}</ul>
            </div>
            <details>
              <summary>Points de vigilance</summary>
              <ul>{stay.watchFor.map((warning) => <li key={warning}>{warning}</li>)}</ul>
            </details>
            <LinkedVerifications items={stay.verificationItems} />
            <Button
              endContent={<Icon name="arrow" size={18} />}
              href={stay.href}
              label={"Comparer à " + stay.destination}
              referrerPolicy="no-referrer"
              rel="noopener noreferrer"
              size="lg"
              target="_blank"
              variant="secondary"
            />
          </Card>
        ))}
      </div>
    </section>
  );
}

function BudgetSection() {
  const budget = japanTrip.budgetGuide;
  return (
    <section className="budget-section" id="budget" aria-labelledby="budget-title">
      <div>
        <p className="eyebrow">BUDGET · APPROCHE {budget.approachLabel.toUpperCase()}</p>
        <h2 id="budget-title">Ce qui fera vraiment varier le total.</h2>
        <p>{budget.summary}</p>
        <LinkedVerifications items={budget.verificationItems} />
      </div>
      <ol>
        {budget.mainVariables.map((variable, index) => (
          <li key={variable}><span>{String(index + 1).padStart(2, "0")}</span>{variable}</li>
        ))}
      </ol>
    </section>
  );
}

function ReservationsSection() {
  const groups = ["essential", "recommended", "optional"];
  return (
    <section className="reservations-section" id="reservations" aria-labelledby="reservations-title">
      <div className="section-heading">
        <div><p className="eyebrow">PLAN DE RÉSERVATION</p><h2 id="reservations-title">À faire dans le bon ordre.</h2></div>
        <p>Commence par ce qui structure l’itinéraire. Le reste peut rester souple plus longtemps.</p>
      </div>
      <div className="reservation-groups">
        {groups.map((priority) => {
          const items = japanTrip.reservationPlan.filter((item) => item.priority === priority);
          if (!items.length) return null;
          return (
            <section className="reservation-group" key={priority}>
              <div className="reservation-group-title">
                <Badge label={travelGuideLabels.priority[priority]} variant={priorityVariants[priority]} />
                <span>{items.length} décision{items.length > 1 ? "s" : ""}</span>
              </div>
              <ol>
                {items.map((item) => (
                  <li key={item.id}>
                    <div><span>{item.categoryLabel}</span><strong>{item.title}</strong></div>
                    <p>{item.reason}</p>
                    <small>
                      {item.day ? `Jour ${item.day} · ` : ""}
                      {item.accommodations.length ? `${item.accommodations.map((stay) => stay.destination).join(" · ")} · ` : ""}
                      {item.whenToBook}
                    </small>
                    <LinkedVerifications items={item.verificationItems} />
                  </li>
                ))}
              </ol>
            </section>
          );
        })}
      </div>
    </section>
  );
}

function PracticalGuideSection() {
  return (
    <section className="practical-guide-section" id="practical" aria-labelledby="practical-title">
      <div className="section-heading">
        <div><p className="eyebrow">AVANT DE PARTIR</p><h2 id="practical-title">Les détails qui évitent les grands détours.</h2></div>
        <p>Ouvre chaque rubrique, puis garde seulement les conseils qui concernent ta situation.</p>
      </div>
      <div className="practical-grid">
        {japanTrip.practicalSections.map((section, index) => (
          <details key={section.id} open={index === 0}>
            <summary><span>{section.label}</span><small>{section.items.length} points</small></summary>
            <ul>
              {section.items.map((item) => (
                <li key={item.title}>
                  <div>
                    <strong>{item.title}</strong>
                    <Badge label={item.priorityLabel} variant={priorityVariants[item.priority]} />
                  </div>
                  <p>{item.detail}</p>
                  {item.mustVerify ? <small>À vérifier pour tes dates</small> : null}
                  <LinkedVerifications items={item.verificationItems} />
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </section>
  );
}

function VerificationSection() {
  return (
    <section className="verification-section" id="verify" aria-labelledby="verification-title">
      <div className="section-heading compact-heading">
        <div><p className="eyebrow">INFORMATIONS À REVÉRIFIER</p><h2 id="verification-title">Le carnet sait ce qui peut changer.</h2></div>
        <p>Horaires, règles, tarifs et conditions doivent être confirmés auprès de la source indiquée au bon moment.</p>
      </div>
      <div className="verification-list">
        {japanTrip.verificationItems.map((item) => (
          <details key={item.id}>
            <summary><span>{item.topic}</span><small>{item.timingLabel}</small></summary>
            <div>
              <p>{item.reason}</p>
              <dl>
                <div><dt>Source à consulter</dt><dd>{item.sourceHint}</dd></div>
                <div><dt>Type</dt><dd>{item.sourceTypeLabel}</dd></div>
              </dl>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

function TripPage({ onShare }) {
  return (
    <main className="trip-page" id="main-content">
      <TripHero onShare={onShare} />
      <nav aria-label="Sommaire du voyage" className="trip-tabs">
        <a href="#overview">Parcours</a>
        <a href="#itinerary">Jour après jour</a>
        <a href="#hotels">Hôtels</a>
        <a href="#reservations">Réservations</a>
        <a href="#practical">À prévoir</a>
      </nav>
      <RouteOverview />
      <FlorianRationale />
      <section className="itinerary-section" id="itinerary" aria-labelledby="itinerary-title">
        <div className="section-heading itinerary-heading">
          <div><p className="eyebrow">JOUR APRÈS JOUR</p><h2 id="itinerary-title">Dix jours, sans course contre la montre.</h2></div>
          <p>Les durées restent des repères. Les pauses, les plans pluie et les soirées libres font partie du parcours.</p>
        </div>
        {japanTrip.chapters.map((chapter, index) => <Chapter chapter={chapter} index={index} key={chapter.id} />)}
      </section>
      <HotelsSection />
      <BudgetSection />
      <ReservationsSection />
      <PracticalGuideSection />
      <VerificationSection />
      <section className="trip-share-cta">
        <p className="eyebrow">UN CARNET COMMUN</p>
        <h2>Garde le même voyage sous la main.</h2>
        <p>Teste un lien public ou un accès privé avec le mot de passe de démonstration.</p>
        <Button icon={<Icon name="share" />} label="Choisir le partage" onClick={onShare} size="lg" variant="primary" />
      </section>
    </main>
  );
}

function PasswordGate({ proof, onUnlock, onHome }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    if (!proof || (await hashPassword(password)) !== proof) {
      setError("Ce mot de passe ne correspond pas à ce voyage.");
      return;
    }
    setError("");
    onUnlock();
  }

  return (
    <main className="gate-page" id="main-content">
      <Card className="gate-card" elevation="med" padding={8}>
        <span className="gate-icon"><Icon name="lock" size={26} /></span>
        <p className="eyebrow">VOYAGE PRIVÉ · DÉMONSTRATION</p>
        <h1>{japanTrip.trip.title}</h1>
        <p>Entre le mot de passe reçu séparément pour ouvrir ce carnet d’exemple.</p>
        <form onSubmit={submit}>
          <TextInput
            description="Le mot de passe respecte les majuscules et les chiffres."
            label="Mot de passe"
            onChange={setPassword}
            maxLength={64}
            placeholder="Ton mot de passe"
            status={error ? { message: error, type: "error" } : undefined}
            type="password"
            value={password}
            width="100%"
          />
          <Button label="Ouvrir le voyage" size="lg" type="submit" variant="primary" width="100%" />
        </form>
        <p className="gate-demo-note">Ce contrôle illustre le parcours. Le carnet ne contient aucune donnée personnelle.</p>
        <button className="text-link" onClick={onHome} type="button">Retour à Mon Florian</button>
      </Card>
    </main>
  );
}

function ShareDialog({ isOpen, onClose }) {
  const [access, setAccess] = useState("private");
  const [password, setPassword] = useState(PRIVATE_DEFAULT_PASSWORD);
  const [feedback, setFeedback] = useState("");
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    let isCurrent = true;
    if (!isOpen || (access === "private" && password.length < 4)) {
      setShareUrl("");
      if (!isOpen) setFeedback("");
      return () => { isCurrent = false; };
    }
    setShareUrl("");
    void buildLink().then((url) => {
      if (isCurrent) setShareUrl(url);
    });
    return () => { isCurrent = false; };
  }, [access, isOpen, password]);

  async function buildLink() {
    const url = new URL("/v2", window.location.origin);
    url.searchParams.set("voyage", japanTrip.slug);
    url.searchParams.set("acces", access === "private" ? "prive" : "public");
    if (access === "private") {
      url.searchParams.set("preuve", await hashPassword(password));
    }
    return url.toString();
  }

  async function copyLink() {
    if (access === "private" && password.length < 4) {
      setFeedback("Choisis au moins quatre caractères.");
      return;
    }
    await copyText(shareUrl || await buildLink());
    setFeedback("Lien copié.");
  }

  async function shareLink() {
    if (!shareUrl) {
      setFeedback("Le lien est presque prêt. Réessaie dans un instant.");
      return;
    }
    if (navigator.share) {
      try {
        await navigator.share({
          title: japanTrip.trip.title + " · Mon Florian",
          text: "Voici notre voyage au Japon.",
          url: shareUrl,
        });
        setFeedback("Partage ouvert.");
      } catch (error) {
        setFeedback(error?.name === "AbortError" ? "Partage annulé." : "Copie le lien pour le partager.");
      }
      return;
    }
    await copyText(shareUrl);
    setFeedback("Lien copié.");
  }

  return (
    <Dialog
      isOpen={isOpen}
      maxHeight="calc(100dvh - 24px)"
      onOpenChange={onClose}
      purpose="form"
      width={560}
    >
      <Layout
        height="fill"
        header={<DialogHeader hasDivider onOpenChange={onClose} subtitle="Famille, amis ou compagnon de voyage" title={"Partager " + japanTrip.trip.title} />}
        content={
          <LayoutContent isScrollable>
            <div className="share-dialog-content">
              <SegmentedControl label="Visibilité du voyage" onChange={setAccess} value={access}>
                <SegmentedControlItem label="Privé" value="private" />
                <SegmentedControlItem label="Public" value="public" />
              </SegmentedControl>
              {access === "private" ? (
                <div className="private-share-fields">
                  <TextInput
                    description="Envoie-le séparément du lien."
                    label="Mot de passe de démonstration"
                    maxLength={64}
                    onChange={setPassword}
                    type="text"
                    value={password}
                    width="100%"
                  />
                  <button
                    className="copy-password"
                    onClick={async () => {
                      await copyText(password);
                      setFeedback("Mot de passe copié.");
                    }}
                    type="button"
                  >
                    Copier le mot de passe
                  </button>
                </div>
              ) : (
                <p className="share-explanation">Toute personne qui reçoit le lien peut ouvrir ce carnet d’exemple.</p>
              )}
              <p className="share-demo-note">
                Cette simulation ne contient aucune donnée personnelle. Un vrai accès privé doit être contrôlé côté serveur ; le lien seul ne constitue pas une protection.
              </p>
              <div aria-live="polite" className="share-feedback">{feedback || "Choisis l’accès puis partage le lien."}</div>
            </div>
          </LayoutContent>
        }
        footer={
          <LayoutFooter hasDivider>
            <div className="dialog-actions">
              <Button label="Copier le lien" onClick={copyLink} size="lg" variant="secondary" />
              <Button icon={<Icon name="share" />} label="Partager" onClick={shareLink} size="lg" variant="primary" />
            </div>
          </LayoutFooter>
        }
      />
    </Dialog>
  );
}

function ExampleDialog({ trip, onClose }) {
  const [feedback, setFeedback] = useState("");
  if (!trip) return null;
  const exampleUrl = window.location.origin + "/v2?exemple=" + trip.slug;

  return (
    <Dialog isOpen={Boolean(trip)} maxHeight="88dvh" onOpenChange={onClose} purpose="info" width={680}>
      <Layout
        height="fill"
        header={<DialogHeader hasDivider onOpenChange={onClose} subtitle={trip.route} title={trip.title} />}
        content={
          <LayoutContent padding={0}>
            <div className="example-dialog-image">
              <img alt={trip.subtitle} height="960" src={trip.image} width="1440" />
              <strong>{trip.coverLabel}</strong>
            </div>
            <div className="example-dialog-copy">
              <p className="card-eyebrow">{trip.eyebrow}</p>
              <h3>{trip.subtitle}</h3><p>{trip.summary}</p>
              <ul>{trip.stops.map((stop) => <li key={stop}>{stop}</li>)}</ul>
              <p aria-live="polite" className="share-feedback">{feedback}</p>
            </div>
          </LayoutContent>
        }
        footer={
          <LayoutFooter hasDivider>
            <div className="dialog-actions">
              <Button
                icon={<Icon name="share" />}
                label="Copier le lien"
                onClick={async () => {
                  await copyText(exampleUrl);
                  setFeedback("Lien copié.");
                }}
                size="lg"
                variant="primary"
              />
            </div>
          </LayoutFooter>
        }
      />
    </Dialog>
  );
}

function Footer({ onHome }) {
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <button className="brand-button" onClick={onHome} type="button">
          <img alt="Mon Florian" height="181" src="/assets/monflorian-wordmark-web.webp" width="338" />
        </button>
        <p>Des voyages qui te ressemblent, sans remplir chaque minute.</p>
      </div>
      <div className="footer-links">
        <a href="/confidentialite">Confidentialité</a>
      </div>
      <p className="footer-mark">MON FLORIAN · 2026</p>
    </footer>
  );
}

function App() {
  const [route, setRoute] = useState(routeFromLocation);
  const [screen, setScreen] = useState(() => (routeFromLocation().trip ? "trip" : "home"));
  const [unlocked, setUnlocked] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [introPast, setIntroPast] = useState(false);
  const initialExample = useMemo(
    () => exampleTrips.find((trip) => trip.slug === route.example) || null,
    [],
  );
  const [example, setExample] = useState(initialExample);

  useEffect(() => {
    function onPopState() {
      const next = routeFromLocation();
      setRoute(next);
      setUnlocked(false);
      setScreen(next.trip ? "trip" : "home");
      setExample(exampleTrips.find((trip) => trip.slug === next.example) || null);
      window.scrollTo({ top: 0 });
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  function goHome() {
    window.history.pushState({}, "", "/v2");
    setRoute({ access: null, example: null, proof: null, trip: null });
    setScreen("home");
    setUnlocked(false);
    setExample(null);
    setIntroPast(false);
    window.scrollTo({ behavior: "smooth", top: 0 });
  }

  function openTrip() {
    window.history.pushState({}, "", "/v2?voyage=" + japanTrip.slug);
    setRoute({ access: null, example: null, proof: null, trip: japanTrip.slug });
    setScreen("trip");
    setUnlocked(false);
    window.scrollTo({ top: 0 });
  }

  const isPrivateRoute = route.trip && route.access === "prive" && !unlocked;
  const isTrip = screen === "trip" && !isPrivateRoute;
  const hasIntroSwap = screen === "home" && !isPrivateRoute;
  const shellClassName = [
    "v2-shell",
    hasIntroSwap ? "has-intro-swap" : "",
    hasIntroSwap && introPast ? "is-intro-past" : "",
  ].filter(Boolean).join(" ");

  return (
    <InternationalizationProvider
      locale="fr-FR"
      messages={{ "fr-FR": frMessages }}
      overrides={{
        "fr-FR": {
          "@astryx.numberInput.decrementLabel": "Diminuer {label}",
          "@astryx.numberInput.incrementLabel": "Augmenter {label}",
        },
      }}
    >
      <Theme mode="light" theme={matchaTheme}>
        <div className={shellClassName}>
          <BrandHeader isGate={Boolean(isPrivateRoute)} isTrip={isTrip} onHome={goHome} onOpenTrip={openTrip} onShare={() => setShareOpen(true)} />
          {hasIntroSwap ? <BrandIntro onPastChange={setIntroPast} /> : null}
          {isPrivateRoute ? (
            <PasswordGate onHome={goHome} onUnlock={() => setUnlocked(true)} proof={route.proof} />
          ) : screen === "generating" ? (
            <GeneratingPage onDone={openTrip} />
          ) : isTrip ? (
            <TripPage onShare={() => setShareOpen(true)} />
          ) : (
            <HomePage
              onGenerate={() => { setScreen("generating"); window.scrollTo({ top: 0 }); }}
              onOpenExample={setExample}
              onOpenTrip={openTrip}
            />
          )}
          <Footer onHome={goHome} />
          <ShareDialog isOpen={shareOpen} onClose={setShareOpen} />
          <ExampleDialog onClose={(open) => { if (!open) setExample(null); }} trip={example} />
        </div>
      </Theme>
    </InternationalizationProvider>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
