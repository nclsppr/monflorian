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
import { FileInput } from "@astryxdesign/core/FileInput";
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
  hotels,
  japanDays,
  practicalChecks,
} from "./data.js";
import "./v2.css";

const PRIVATE_DEFAULT_PASSWORD = "MOMIJI26";

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
    return (
      <svg {...common}>
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    );
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
  return (
    <svg {...common}>
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
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

function BrandHeader({ isTrip, onHome, onShare }) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <button className="brand-button" onClick={onHome} type="button">
          <img
            alt="Mon Florian"
            height="181"
            src="/assets/monflorian-wordmark-web.webp"
            width="338"
          />
        </button>
        <nav aria-label="Navigation principale" className="desktop-nav">
          <button onClick={() => (onHome(), setTimeout(() => scrollToId("create"), 0))} type="button">
            Créer un voyage
          </button>
          <button onClick={() => (onHome(), setTimeout(() => scrollToId("examples"), 0))} type="button">
            Voir des exemples
          </button>
          <button onClick={() => (onHome(), setTimeout(() => scrollToId("how"), 0))} type="button">
            Comment ça marche
          </button>
        </nav>
        {isTrip ? (
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
            label="Mon voyage"
            onClick={() => scrollToId("create")}
            size="lg"
            variant="secondary"
          />
        )}
      </div>
    </header>
  );
}

function PhotoChapter({ alt, city, eager = false, src, note }) {
  return (
    <figure className="photo-chapter">
      <img
        alt={alt}
        decoding="async"
        fetchPriority={eager ? "high" : "auto"}
        height="960"
        loading={eager ? "eager" : "lazy"}
        src={src}
        width="1440"
      />
      <div aria-hidden="true" className="photo-wash" />
      <strong className="photo-city">{city}</strong>
      {note ? <figcaption>{note}</figcaption> : null}
    </figure>
  );
}

function Hero() {
  return (
    <section className="home-hero">
      <div className="hero-copy">
        <p className="eyebrow">TON VOYAGE, À TON RYTHME</p>
        <h1>Tu donnes l’envie.<br />Je construis le chemin.</h1>
        <p className="hero-intro">
          Décris ce que tu veux vivre, le temps dont tu disposes et ton rythme.
          Florian relie les étapes, ménage les respirations et prépare une page
          de voyage facile à consulter et à partager.
        </p>
        <div className="hero-actions">
          <Button
            endContent={<Icon name="arrow" />}
            label="Créer mon voyage"
            onClick={() => scrollToId("create")}
            size="lg"
            variant="primary"
          />
          <button className="text-link" onClick={() => scrollToId("examples")} type="button">
            Voir trois inspirations
          </button>
        </div>
        <dl className="hero-facts">
          <div><dt>01</dt><dd>Une envie libre</dd></div>
          <div><dt>02</dt><dd>Un rythme choisi</dd></div>
          <div><dt>03</dt><dd>Un carnet partageable</dd></div>
        </dl>
      </div>
      <div className="hero-visual">
        <PhotoChapter
          alt="Un couple découvre Tokyo le soir, sous les enseignes lumineuses"
          city="TOKYO"
          eager
          src="/v2/media/japan-tokyo-couple.webp"
        />
        <div className="route-stamp" aria-label="Itinéraire présenté">
          <span>10 jours</span>
          <strong>Tokyo → Hakone → Kyoto</strong>
        </div>
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
  const [photos, setPhotos] = useState([]);

  function goTo(nextStep) {
    setStep(nextStep);
    document.getElementById("questionnaire-title")?.focus({ preventScroll: true });
  }

  return (
    <section className="composer-section" id="create">
      <div className="section-heading composer-heading">
        <div>
          <p className="eyebrow">COMMENÇONS PAR TON ENVIE</p>
          <h2 id="questionnaire-title" tabIndex="-1">Où veux-tu que je t’emmène ?</h2>
        </div>
        <p>
          Trois étapes courtes. Tu peux rester précis ou me laisser de la liberté.
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
            <Step label="Les détails" step={2} />
          </Stepper>

          <form
            className="questionnaire-form"
            onSubmit={(event) => {
              event.preventDefault();
              onGenerate({ brief, comfort, days, pace, photos, travelers });
            }}
          >
            <div className="step-panel" key={step}>
              {step === 0 ? (
                <div className="field-stack">
                  <div className="step-kicker">01 · RACONTE-MOI</div>
                  <TextArea
                    description="Une destination, une saison, une sensation ou simplement une envie de partir."
                    isOptional
                    label="À quoi ressemble le voyage que tu imagines ?"
                    maxLength={2000}
                    onChange={setBrief}
                    placeholder="Dix jours au Japon à deux, entre quartiers vivants, sources chaudes et temples. On veut voir beaucoup sans courir…"
                    rows={7}
                    size="lg"
                    value={brief}
                    width="100%"
                  />
                  <p className="field-hint">Tu pourras ajuster le détail après avoir vu la première proposition.</p>
                </div>
              ) : null}

              {step === 1 ? (
                <div className="field-stack">
                  <div className="step-kicker">02 · DONNE LE TEMPO</div>
                  <div className="number-grid">
                    <NumberInput
                      hasNumberSteppers
                      isIntegerOnly
                      label="Nombre de jours"
                      max={30}
                      min={2}
                      onChange={setDays}
                      units="jours"
                      value={days}
                      width="100%"
                    />
                    <NumberInput
                      hasNumberSteppers
                      isIntegerOnly
                      label="Voyageurs"
                      max={8}
                      min={1}
                      onChange={setTravelers}
                      units="personnes"
                      value={travelers}
                      width="100%"
                    />
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
                          <strong>{option.title}</strong>
                          <span>{option.note}</span>
                        </SelectableCard>
                      ))}
                    </div>
                  </fieldset>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="field-stack">
                  <div className="step-kicker">03 · AJOUTE TA TOUCHE</div>
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
                          <strong>{option.title}</strong>
                          <span>{option.note}</span>
                        </SelectableCard>
                      ))}
                    </div>
                  </fieldset>
                  <FileInput
                    accept="image/jpeg,image/png,image/webp"
                    description="Ajoute jusqu’à quatre portraits pour retrouver votre duo dans le carnet."
                    isMultiple
                    isOptional
                    label="Vos photos"
                    maxFiles={4}
                    maxSize={8_000_000}
                    mode="dropzone"
                    onChange={(files) => setPhotos(Array.isArray(files) ? files : files ? [files] : [])}
                    placeholder="Choisir ou déposer des photos"
                    value={photos}
                    width="100%"
                  />
                </div>
              ) : null}
            </div>

            <div className="form-actions">
              {step > 0 ? (
                <Button label="Retour" onClick={() => goTo(step - 1)} size="lg" variant="ghost" />
              ) : <span />}
              {step < 2 ? (
                <Button
                  endContent={<Icon name="arrow" />}
                  label="Continuer"
                  onClick={() => goTo(step + 1)}
                  size="lg"
                  variant="primary"
                />
              ) : (
                <Button
                  endContent={<Icon name="arrow" />}
                  label="Générer mon voyage"
                  size="lg"
                  type="submit"
                  variant="primary"
                />
              )}
            </div>
          </form>
        </Card>

        <aside className="composer-aside">
          <p className="aside-label">CE QUE FLORIAN PRÉPARE</p>
          <div className="route-line" aria-hidden="true">
            <span>Départ</span><i /><span>Respirer</span><i /><span>S’émerveiller</span>
          </div>
          <blockquote>
            “Je garde les journées que tu attends, mais aussi les heures où rien
            n’est prévu. C’est souvent là que le voyage commence vraiment.”
          </blockquote>
          <ul>
            <li><Icon name="check" /> Un parcours jour par jour</li>
            <li><Icon name="check" /> Des hôtels à comparer sur Booking.com</li>
            <li><Icon name="check" /> Une page à partager avec tes proches</li>
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
        <div>
          <p className="eyebrow">TROIS FAÇONS DE PARTIR</p>
          <h2>Des voyages qui laissent de la place au voyage.</h2>
        </div>
        <p>Chaque parcours relie les étapes, les respirations et les bonnes bases où dormir.</p>
      </div>
      <div className="example-grid">
        {exampleTrips.map((trip) => (
          <ClickableCard
            className="example-card"
            elevation="low"
            key={trip.slug}
            label={`Découvrir ${trip.title}`}
            onClick={() => onOpen(trip)}
            padding={0}
          >
            <div className="example-image">
              <img
                alt={trip.subtitle}
                decoding="async"
                height="960"
                loading="lazy"
                src={trip.image}
                width="1440"
              />
              <strong>{trip.coverLabel}</strong>
            </div>
            <div className="example-copy">
              <p className="card-eyebrow">{trip.eyebrow}</p>
              <h3>{trip.title}</h3>
              <p className="example-subtitle">{trip.subtitle}</p>
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
        <li>
          <span>01</span>
          <div><h3>Tu racontes</h3><p>Une phrase suffit. Ajoute le rythme, le nombre de jours et ce qui compte pour vous.</p></div>
        </li>
        <li>
          <span>02</span>
          <div><h3>Florian relie</h3><p>Les étapes s’enchaînent sans zigzag, avec des journées qui respirent et des hôtels bien placés.</p></div>
        </li>
        <li>
          <span>03</span>
          <div><h3>Vous partagez</h3><p>Le carnet devient votre point de repère commun, en accès public ou privé avec mot de passe.</p></div>
        </li>
      </ol>
    </section>
  );
}

function HomePage({ onGenerate, onOpenExample }) {
  return (
    <main>
      <Hero />
      <TripQuestionnaire onGenerate={onGenerate} />
      <Examples onOpen={onOpenExample} />
      <HowItWorks />
    </main>
  );
}

function GeneratingPage({ onDone }) {
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    const statusTimer = window.setInterval(() => {
      setStatusIndex((current) => Math.min(current + 1, generationStatuses.length - 1));
    }, 650);
    const doneTimer = window.setTimeout(onDone, 3500);
    return () => {
      window.clearInterval(statusTimer);
      window.clearTimeout(doneTimer);
    };
  }, [onDone]);

  const complete = statusIndex === generationStatuses.length - 1;
  const progress = ((statusIndex + 1) / generationStatuses.length) * 100;

  return (
    <main className="generating-page">
      <div className="generation-card">
        <span className="generation-count">10 JOURS · 3 ÉTAPES · 2 VOYAGEURS</span>
        <div className="generation-mark" aria-hidden="true">
          {complete ? (
            <span className="t-success-check" data-state="in">
              <svg fill="none" height="72" viewBox="0 0 48 48" width="72">
                <path d="m8 25 10 10 22-24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
              </svg>
            </span>
          ) : (
            <span className="paper-plane">↗</span>
          )}
        </div>
        <p className="eyebrow">TON VOYAGE PREND FORME</p>
        <h1>{generationStatuses[statusIndex]}</h1>
        <p className="generation-note">
          Je vérifie que chaque déplacement mérite sa place et que vos journées gardent de l’air.
        </p>
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
  return (
    <section className="trip-hero">
      <div className="trip-hero-image">
        <PhotoChapter
          alt="Un couple marche dans Tokyo de nuit"
          city="TOKYO"
          eager
          src="/v2/media/japan-tokyo-couple.webp"
        />
      </div>
      <div className="trip-hero-copy">
        <p className="eyebrow">JAPON · 10 JOURS</p>
        <h1>Le Japon à deux</h1>
        <p className="trip-route">Tokyo → Hakone → Kyoto</p>
        <div className="trip-meta">
          <span><Icon name="calendar" /> 10 jours</span>
          <span><Icon name="people" /> 2 voyageurs</span>
          <Badge label="Rythme équilibré" variant="success" />
        </div>
        <p className="trip-summary">
          Une première traversée du Japon qui alterne énergie urbaine, nuit en
          ryokan et journées de temple. Peu de changements d’hôtel, des départs
          matinaux choisis et de vraies plages libres.
        </p>
        <Button
          icon={<Icon name="share" />}
          label="Partager ce voyage"
          onClick={onShare}
          size="lg"
          variant="primary"
        />
      </div>
    </section>
  );
}

function TripPage({ onShare }) {
  return (
    <main className="trip-page">
      <TripHero onShare={onShare} />
      <nav aria-label="Sommaire du voyage" className="trip-tabs">
        <a href="#overview">En bref</a>
        <a href="#itinerary">Itinéraire</a>
        <a href="#hotels">Hôtels</a>
        <a href="#practical">À prévoir</a>
      </nav>

      <section className="florian-note" id="overview">
        <div className="florian-mini">
          <img alt="Florian" height="384" src="/assets/florian-v2-original-web.webp" width="384" />
        </div>
        <div>
          <p className="eyebrow">LE CHOIX DE FLORIAN</p>
          <blockquote>
            J’ai placé Hakone entre Tokyo et Kyoto pour passer des néons aux
            sources chaudes avant de retrouver les temples. Une nuit suffit à
            ralentir sans multiplier les valises.
          </blockquote>
        </div>
      </section>

      <section className="itinerary-section" id="itinerary">
        <div className="section-heading itinerary-heading">
          <div><p className="eyebrow">JOUR APRÈS JOUR</p><h2>Dix jours, sans course contre la montre.</h2></div>
          <p>Les horaires restent des repères. Les pauses et les soirées libres font partie du parcours.</p>
        </div>
        <ol className="day-list">
          {japanDays.slice(0, 5).map((item) => <Day key={item.day} item={item} />)}
        </ol>
        <PhotoChapter
          alt="Le couple profite d’un bain thermal extérieur à Hakone"
          city="HAKONE"
          note="JOUR 5 · UNE NUIT POUR RALENTIR"
          src="/v2/media/japan-hakone-couple.webp"
        />
        <ol className="day-list" start="6">
          {japanDays.slice(5).map((item) => <Day key={item.day} item={item} />)}
        </ol>
        <PhotoChapter
          alt="Le couple marche dans un quartier traditionnel de Kyoto"
          city="KYOTO"
          note="JOURS 6–10 · TEMPLES, RUELLES ET TEMPS LIBRE"
          src="/v2/media/japan-kyoto-couple.webp"
        />
      </section>

      <section className="hotels-section" id="hotels">
        <div className="section-heading">
          <div><p className="eyebrow">OÙ POSER LES VALISES</p><h2>Trois bases, pas une de plus.</h2></div>
          <p>Ces liens ouvrent une recherche par ville. Tu gardes le choix de l’adresse et des conditions.</p>
        </div>
        <div className="hotel-grid">
          {hotels.map((hotel) => (
            <Card className="hotel-card" elevation="low" key={hotel.city} padding={5}>
              <div className="hotel-top"><span>{hotel.nights}</span><Badge label={hotel.city} variant="blue" /></div>
              <h3>{hotel.neighborhood}</h3>
              <p>{hotel.note}</p>
              <Button
                endContent={<Icon name="arrow" size={18} />}
                href={hotel.href}
                label={`Voir les hôtels à ${hotel.city}`}
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

      <section className="practical-section" id="practical">
        <div>
          <p className="eyebrow">AVANT DE PARTIR</p>
          <h2>La petite liste qui évite les grands détours.</h2>
          <p>À cocher ensemble avant de fermer les valises.</p>
        </div>
        <ul>
          {practicalChecks.map((check) => <li key={check}><Icon name="check" />{check}</li>)}
        </ul>
      </section>

      <section className="trip-share-cta">
        <p className="eyebrow">LE VOYAGE COMMENCE ICI</p>
        <h2>Gardez le même itinéraire sous la main.</h2>
        <p>Choisis qui peut voir le carnet, puis envoie le lien à la famille et aux amis.</p>
        <Button icon={<Icon name="share" />} label="Choisir le partage" onClick={onShare} size="lg" variant="primary" />
      </section>
    </main>
  );
}

function Day({ item }) {
  return (
    <li className="day-item">
      <div className="day-number"><span>JOUR</span><strong>{String(item.day).padStart(2, "0")}</strong></div>
      <div className="day-copy">
        <div className="day-heading">
          <div><p>{item.city}</p><h3>{item.title}</h3></div>
          <Badge label={item.pace} variant={item.pace === "Lent" ? "green" : "neutral"} />
        </div>
        <ul>{item.moments.map((moment) => <li key={moment}>{moment}</li>)}</ul>
      </div>
    </li>
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
    <main className="gate-page">
      <Card className="gate-card" elevation="med" padding={8}>
        <span className="gate-icon"><Icon name="lock" size={26} /></span>
        <p className="eyebrow">VOYAGE PRIVÉ</p>
        <h1>Le Japon à deux</h1>
        <p>Entre le mot de passe reçu séparément pour ouvrir ce carnet.</p>
        <form onSubmit={submit}>
          <TextInput
            description={error || "Le mot de passe respecte les majuscules et les chiffres."}
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
    url.searchParams.set("voyage", "japon-a-deux");
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
          title: "Le Japon à deux · Mon Florian",
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
    <Dialog isOpen={isOpen} onOpenChange={onClose} purpose="form" width={560}>
      <Layout
        height="auto"
        header={<DialogHeader hasDivider onOpenChange={onClose} subtitle="Famille, amis ou compagnon de voyage" title="Partager le Japon à deux" />}
        content={
          <LayoutContent isScrollable={false}>
            <div className="share-dialog-content">
              <SegmentedControl label="Visibilité du voyage" onChange={setAccess} value={access}>
                <SegmentedControlItem label="Privé" value="private" />
                <SegmentedControlItem label="Public" value="public" />
              </SegmentedControl>
              {access === "private" ? (
                <div className="private-share-fields">
                  <TextInput
                    description="Envoie-le séparément du lien."
                    label="Mot de passe"
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
                <p className="share-explanation">Toute personne qui reçoit le lien peut ouvrir le carnet.</p>
              )}
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
  const exampleUrl = `${window.location.origin}/v2?exemple=${trip.slug}`;

  return (
    <Dialog
      isOpen={Boolean(trip)}
      maxHeight="88dvh"
      onOpenChange={onClose}
      purpose="info"
      width={680}
    >
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
              <h3>{trip.subtitle}</h3>
              <p>{trip.summary}</p>
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
        <a href="mailto:voyage@monflorian.com">voyage@monflorian.com</a>
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
    window.scrollTo({ behavior: "smooth", top: 0 });
  }

  function finishGeneration() {
    window.history.pushState({}, "", "/v2?voyage=japon-a-deux");
    setRoute({ access: null, example: null, proof: null, trip: "japon-a-deux" });
    setScreen("trip");
    window.scrollTo({ top: 0 });
  }

  const isPrivateRoute = route.trip && route.access === "prive" && !unlocked;
  const isTrip = screen === "trip" && !isPrivateRoute;

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
        <div className="v2-shell">
        <BrandHeader isTrip={isTrip} onHome={goHome} onShare={() => setShareOpen(true)} />
        {isPrivateRoute ? (
          <PasswordGate onHome={goHome} onUnlock={() => setUnlocked(true)} proof={route.proof} />
        ) : screen === "generating" ? (
          <GeneratingPage onDone={finishGeneration} />
        ) : isTrip ? (
          <TripPage onShare={() => setShareOpen(true)} />
        ) : (
          <HomePage onGenerate={() => { setScreen("generating"); window.scrollTo({ top: 0 }); }} onOpenExample={setExample} />
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
