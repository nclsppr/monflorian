import { createContext, useContext, useEffect, useState } from "react";

import "@astryxdesign/core/astryx.css";
import "@astryxdesign/theme-matcha/theme.css";

import { Badge } from "@astryxdesign/core/Badge";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import { Layout, LayoutContent, LayoutFooter } from "@astryxdesign/core/Layout";
import { Theme } from "@astryxdesign/core/theme";
import { InternationalizationProvider } from "@astryxdesign/core/i18n";
import frMessages from "@astryxdesign/core/locales/fr-FR.json";
import { matchaTheme } from "@astryxdesign/theme-matcha/built";

import {
  exampleTrips,
  japanTrip,
  travelGuideLabels,
} from "./data.js";
import TripPlanner from "./Planner.jsx";
import { GuideHub, GuidePage } from "./Guides.jsx";
import { guides } from "./guides.js";
import { sourceLinks } from "./sources.js";
import "./v2.css";
import "./site.css";

export const TRIP_PATH = "/carnets/japon-10-jours";
const AvatarContext = createContext("original");

function Portrait({ intro = false, ...props }) {
  const variant = useContext(AvatarContext);
  return <img {...props} src={"/assets/florian-v2-" + variant + (intro ? "-intro.webp" : "-web.webp")} />;
}

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
  document.getElementById(id)?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
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
      {items.map((item) => <a aria-label={"Vérifier : " + item.topic} className="verification-jump" href={"#" + item.id} key={item.id}>{item.topic}<small>{item.timingLabel}</small></a>)}
    </p>
  );
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
  const copied = document.execCommand("copy");
  area.remove();
  if (!copied) throw new Error("Copy unavailable");
}

function BrandHeader({ isTrip, onShare }) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <a aria-label="Mon Florian, accueil" className="brand-button brand" href="/">
          <span aria-hidden="true" className="brand-character"><Portrait alt="" height="384" width="384" /></span>
          <img alt="" className="brand-wordmark" height="181" src="/assets/monflorian-wordmark-web.webp" width="338" />
        </a>
        <nav aria-label="Navigation principale" className="desktop-nav">
          <a href={TRIP_PATH}>Le carnet Japon</a>
          <a href="/#create">Mon pense-bête</a>
          <a href="/guides">Les guides</a>
        </nav>
        <details className="mobile-menu">
          <summary>Menu</summary>
          <nav aria-label="Navigation mobile" onClick={(event) => { if (event.target.closest("a")) event.currentTarget.closest("details").open = false; }}><a href={TRIP_PATH}>Le carnet Japon</a><a href="/#create">Mon pense-bête</a><a href="/guides">Les guides</a><a href="/#examples">Inspirations</a></nav>
        </details>
        {isTrip ? <Button className="header-action js-only" icon={<Icon name="share" size={17} />} label="Partager" onClick={onShare} size="lg" variant="primary" /> : <Button className="header-action" href={TRIP_PATH} label="Voir le carnet" size="lg" variant="secondary" />}
      </div>
    </header>
  );
}

function BrandIntro({ onPastChange }) {
  const [isCompact, setIsCompact] = useState(false);

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
            <Portrait alt="" height="1024" intro loading="lazy" width="1024" />
          </span>
          <img
            alt=""
            className="brand-wordmark"
            height="724"
            loading="lazy"
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
            <Portrait alt="" height="384" width="384" />
            <p><strong>Le choix de Florian</strong> Trois bases seulement, pour voir beaucoup sans refaire les valises chaque matin.</p>
          </div>
        </div>
      </article>
      <span className="phone-caption">Ton itinéraire, tes hôtels et les réservations à prévoir, au même endroit.</span>
    </div>
  );
}

function Hero() {
  return (
    <section className="home-hero" aria-labelledby="hero-title">
      <div className="hero-copy">
        <h1 id="hero-title">Ton voyage,<br />à ton rythme.</h1>
        <p className="hero-intro">
          Un itinéraire pour te projeter, les trajets pour relier les étapes et du temps pour improviser.
          Explore dix jours au Japon, puis pose les idées de ton propre voyage.
        </p>
        <div className="hero-actions">
          <Button
            endContent={<Icon name="arrow" />}
            label="Ouvrir le carnet Japon"
            href={TRIP_PATH}
            size="lg"
            variant="primary"
          />
          <a className="text-link" href="#create">Préparer mon pense-bête</a>
        </div>
        <p className="hero-demo-note">
          <strong>Un carnet d’exemple, accessible à tous.</strong> Le voyage Japon est déjà écrit.
          La création d’un itinéraire sur mesure n’est pas encore ouverte.
        </p>
        <ul className="hero-trust" aria-label="Ce que tu peux faire ici">
          <li>Aucune réservation automatique</li>
          <li>Sans compte</li>
          <li>Pense-bête sur ton appareil</li>
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
          <h2 id="deliverables-title">Tout ce qu’il faut pour se projeter.</h2>
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

function JapanProof() {
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
          href={TRIP_PATH}
          size="lg"
          variant="primary"
        />
      </div>
    </section>
  );
}

function Examples() {
  return (
    <section className="examples-section" id="examples">
      <div className="section-heading">
        <div><h2>D’autres envies de départ.</h2></div>
        <p>Trois pistes pour choisir une ambiance. Le carnet Japon reste l’exemple détaillé.</p>
      </div>
      <div className="example-grid">
        {exampleTrips.map((trip) => (
          <article className="example-card" key={trip.slug}>
            <div className="example-image">
              <img alt={trip.subtitle} decoding="async" height="960" loading="lazy" src={trip.image} width="1440" />
              <strong>{trip.coverLabel}</strong>
            </div>
            <div className="example-copy">
              <p className="card-eyebrow">{trip.eyebrow}</p>
              <h3>{trip.title}</h3><p className="example-subtitle">{trip.subtitle}</p>
              <p className="example-route">{trip.route}</p>
              <details className="inspiration-detail" id={"inspiration-" + trip.slug}><summary>Voir les étapes</summary><p>{trip.summary}</p><ul>{trip.stops.map((stop) => <li key={stop}>{stop}</li>)}</ul><a href={"/#inspiration-" + trip.slug}>Lien vers cette inspiration</a></details>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="how-section" id="how">
      <div className="how-intro">
        <h2>De l’envie aux premières décisions.</h2>
      </div>
      <ol className="how-list">
        <li><span>01</span><div><h3>Explore le carnet</h3><p>Regarde comment les nuits, les trajets et les journées s’articulent dans l’exemple Japon.</p></div></li>
        <li><span>02</span><div><h3>Pose tes envies</h3><p>Ton pense-bête rassemble destination, rythme et confort. Garde-le sur ton appareil ou télécharge-le.</p></div></li>
        <li><span>03</span><div><h3>Tu décides</h3><p>Le carnet distingue l’essentiel du facultatif et rassemble les points à vérifier avant de réserver.</p></div></li>
      </ol>
    </section>
  );
}

function Questions() {
  const questions = [
    ["Puis-je créer un voyage sur mesure ?", "Pas encore. Tu peux explorer le carnet Japon, lire les guides et préparer ton propre pense-bête. Aucun paiement, envoi de courriel ou génération ne se déclenche."],
    ["Les prix sont-ils en temps réel ?", "Non. Les liens ouvrent une recherche Booking.com et les prix, disponibilités et conditions doivent être vérifiés au moment de réserver."],
    ["Est-ce que Mon Florian réserve à ma place ?", "Non. Le carnet organise les décisions et te conduit vers les services concernés, sans acheter ni confirmer quoi que ce soit."],
    ["Que deviennent mes réponses ?", "Ton pense-bête reste dans cette page. Tu peux choisir de le conserver sur cet appareil, le télécharger ou le copier. Il n’est jamais envoyé à Mon Florian et ne personnalise pas le carnet Japon."],
    ["Dois-je ajouter des photos ?", "Non. Aucune photo n’est demandée. Les illustrations sont synthétiques et les personnages du carnet Japon sont fictifs."],
  ];
  return (
    <section id="questions" className="questions-section" aria-labelledby="questions-title">
      <div>
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

function HomePage() {
  return (
    <main id="main-content">
      <Hero />
      <WhatYouReceive />
      <JapanProof />
      <TripPlanner />
      <Examples />
      <section className="home-guides" aria-labelledby="home-guides-title">
        <div><h2 id="home-guides-title">Avant de remplir les valises.</h2><p>Deux guides pour passer d’une envie à un parcours réaliste.</p></div>
        <div>{guides.map((guide) => <a href={guide.path} key={guide.path}><h3>{guide.heading}</h3><p>{guide.description}</p><span>Lire le guide <Icon name="arrow" /></span></a>)}</div>
        <a className="text-link" href="/guides">Tous les guides</a>
      </section>
      <HowItWorks />
      <Questions />
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
        <Button icon={<Icon name="share" />} className="js-only" label="Partager ce carnet" onClick={onShare} size="lg" variant="primary" />
        <p className="trip-demo-label">Carnet éditorial d’exemple · Illustrations synthétiques, personnages fictifs · Informations à vérifier pour tes dates</p>
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
        <Portrait alt="Florian" height="384" width="384" />
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
    <li className="day-item" id={"jour-" + item.day}>
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
  const storageKey = "monflorian:japan-checklist:v1";
  const [checked, setChecked] = useState([]);
  const [feedback, setFeedback] = useState("");
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
      if (Array.isArray(saved)) setChecked([...new Set(saved.filter((id) => japanTrip.reservationPlan.some((item) => item.id === id)))]);
    } catch { setFeedback("La sauvegarde est indisponible. Tu peux utiliser la checklist pendant cette visite."); }
  }, []);
  function toggle(id) {
    const next = checked.includes(id) ? checked.filter((value) => value !== id) : [...checked, id];
    setChecked(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); setFeedback("Checklist enregistrée sur cet appareil."); }
    catch { setFeedback("Ce changement restera seulement pendant cette visite."); }
  }
  function reset() {
    try { localStorage.removeItem(storageKey); setChecked([]); setFeedback("Les cases sont décochées et la copie locale est effacée."); }
    catch { setFeedback("La copie locale n’a pas pu être effacée. Réessaie depuis les réglages du navigateur."); }
  }
  const groups = ["essential", "recommended", "optional"];
  return (
    <section className="reservations-section" id="reservations" aria-labelledby="reservations-title">
      <div className="section-heading">
        <div><p className="eyebrow">PLAN DE RÉSERVATION</p><h2 id="reservations-title">À faire dans le bon ordre.</h2></div>
        <p>Commence par ce qui structure l’itinéraire. Le reste peut rester souple plus longtemps.</p>
      </div>
      <div className="checklist-summary js-only"><p><strong>{checked.length} sur {japanTrip.reservationPlan.length} vérifications cochées.</strong> Les cases restent dans ce navigateur. Cocher une case signifie que tu as vérifié ce point ; cela ne réserve rien.</p>{checked.length ? <button className="text-link" onClick={reset} type="button">Tout décocher</button> : null}<p aria-live="polite">{feedback}</p></div>
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
                    <div><span>{item.categoryLabel}</span><label className="reservation-check"><input className="js-only" type="checkbox" checked={checked.includes(item.id)} onChange={() => toggle(item.id)} /><strong>{item.title}</strong></label></div>
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
        <div><p className="eyebrow">INFORMATIONS À REVÉRIFIER</p><h2 id="verification-title">Les sources pour revérifier.</h2></div>
        <p>Horaires, règles, tarifs et conditions doivent être confirmés auprès de la source indiquée au bon moment. Liens sélectionnés le 7 septembre 2026 ; ce relevé ne valide pas les informations pour tes dates.</p>
      </div>
      <div className="verification-list">
        {japanTrip.verificationItems.map((item) => (
          <details id={item.id} key={item.id}>
            <summary><span>{item.topic}</span><small>{item.timingLabel}</small></summary>
            <div>
              <p>{item.reason}</p>
              <dl>
                <div><dt>Source à consulter</dt><dd>{item.sourceHint}{sourceLinks[item.id]?.map((source) => <a className="official-source" href={source.url} key={source.url} rel="noopener noreferrer" target="_blank">{source.label} <span className="sr-only">, nouvel onglet</span></a>)}</dd></div>
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
        <a href="#reservations">Ma checklist</a>
        <a href="#budget">Budget</a>
        <a href="#practical">À prévoir</a>
        <a href="#verify">Sources</a>
      </nav>
      <RouteOverview />
      <FlorianRationale />
      <section className="itinerary-section" id="itinerary" aria-labelledby="itinerary-title">
        <div className="section-heading itinerary-heading">
          <div><p className="eyebrow">JOUR APRÈS JOUR</p><h2 id="itinerary-title">Dix jours, sans course contre la montre.</h2></div>
          <p>Les durées restent des repères. Les pauses, les plans pluie et les soirées libres font partie du parcours.</p>
        </div>
        <nav className="day-navigation" aria-label="Aller à une journée">{japanTrip.days.map((day) => <a href={"#jour-" + day.day} key={day.day} title={day.title}><strong>J{day.day}</strong><span>{day.cityLabel}</span></a>)}</nav>
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
        <p>Partage l’exemple avec tes proches. Tes cases cochées et ton pense-bête restent sur ton appareil.</p>
        <div className="trip-tools js-only"><Button icon={<Icon name="share" />} label="Copier ou partager le lien" onClick={onShare} size="lg" variant="primary" /><Button label="Imprimer le carnet" onClick={() => window.print()} size="lg" variant="secondary" /></div>
        <p><a href="/guides/japon-10-jours-preparer-voyage">Comment adapter ces dix jours à ton voyage</a></p>
      </section>
    </main>
  );
}

function ShareDialog({ isOpen, onClose }) {
  const [feedback, setFeedback] = useState("");
  const shareUrl = "https://monflorian.com" + TRIP_PATH;
  async function copyLink() {
    try { await copyText(shareUrl); setFeedback("Lien copié. Tes cases cochées restent sur cet appareil."); }
    catch { setFeedback("La copie n’est pas disponible. Sélectionne le lien ci-dessous pour le copier."); }
  }
  async function shareLink() {
    if (!navigator.share) return copyLink();
    try { await navigator.share({ title: "Dix jours au Japon · Mon Florian", text: "Un carnet d’exemple pour préparer dix jours au Japon.", url: shareUrl }); setFeedback("Partage ouvert."); }
    catch (error) { setFeedback(error?.name === "AbortError" ? "Partage annulé." : "Le partage n’est pas disponible. Tu peux copier le lien."); }
  }
  return (
    <Dialog isOpen={isOpen} maxHeight="calc(100dvh - 24px)" onOpenChange={onClose} purpose="info" width={560}>
      <Layout height="fill" header={<DialogHeader hasDivider onOpenChange={onClose} title="Partager le carnet Japon" />} content={<LayoutContent isScrollable><div className="share-dialog-content"><p>Ce carnet est public. Le lien ouvre le même exemple pour tout le monde, sans transmettre ton pense-bête ni ta checklist.</p><label className="share-link-label" htmlFor="public-share-link">Lien du carnet</label><input id="public-share-link" readOnly value={shareUrl} onFocus={(event) => event.target.select()} /><p aria-live="polite" className="share-feedback">{feedback}</p></div></LayoutContent>} footer={<LayoutFooter hasDivider><div className="dialog-actions"><Button label="Copier le lien" onClick={copyLink} size="lg" variant="secondary" /><Button icon={<Icon name="share" />} label="Partager" onClick={shareLink} size="lg" variant="primary" /></div></LayoutFooter>} />
    </Dialog>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-brand"><a href="/"><img alt="Mon Florian, accueil" height="181" src="/assets/monflorian-wordmark-web.webp" width="338" /></a><p>Un voyage se prépare. Il se laisse aussi un peu ouvert.</p></div>
      <nav className="footer-links" aria-label="Navigation de pied de page"><a href={TRIP_PATH}>Carnet Japon</a><a href="/guides">Guides de voyage</a><a href="/#create">Mon pense-bête</a><a href="/#questions">Questions fréquentes</a><a href="/confidentialite">Confidentialité</a></nav>
      <p className="footer-mark">MON FLORIAN · 2026 · Aucune réservation ni paiement sur ce site.</p>
    </footer>
  );
}

export function App({ pathname = "/" }) {
  const [shareOpen, setShareOpen] = useState(false);
  const [introPast, setIntroPast] = useState(false);
  const [avatar, setAvatar] = useState("original");
  const isTrip = pathname === TRIP_PATH;
  const isHome = pathname === "/";
  const guide = guides.find((item) => item.path === pathname);

  useEffect(() => {
    document.documentElement.classList.add("is-interactive");
    const params = new URLSearchParams(window.location.search);
    const variants = ["original", "wind", "beanie", "summer", "flower"];
    const requested = params.get("avatar");
    const selected = variants.includes(requested) ? requested : variants[Math.floor(Math.random() * variants.length)];
    const image = new Image();
    image.src = "/assets/florian-v2-" + selected + "-web.webp";
    let active = true;
    image.decode().then(() => { if (active) setAvatar(selected); }).catch(() => {});
    function openHashTarget() {
      const target = document.getElementById(window.location.hash.slice(1));
      if (target?.tagName === "DETAILS") target.open = true;
    }
    openHashTarget();
    let openBeforePrint = [];
    function preparePrint() { openBeforePrint = [...document.querySelectorAll(".trip-page details")].filter((item) => !item.open); openBeforePrint.forEach((item) => { item.open = true; }); }
    function finishPrint() { openBeforePrint.forEach((item) => { item.open = false; }); }
    window.addEventListener("beforeprint", preparePrint);
    window.addEventListener("afterprint", finishPrint);
    window.addEventListener("hashchange", openHashTarget);
    return () => { active = false; window.removeEventListener("hashchange", openHashTarget); window.removeEventListener("beforeprint", preparePrint); window.removeEventListener("afterprint", finishPrint); };
  }, [isHome]);

  const shellClassName = "v2-shell" + (isHome ? " has-intro-swap" : "") + (introPast ? " is-intro-past" : "");
  return (
    <InternationalizationProvider locale="fr-FR" messages={{ "fr-FR": frMessages }} overrides={{ "fr-FR": { "@astryx.numberInput.decrementLabel": "Diminuer {label}", "@astryx.numberInput.incrementLabel": "Augmenter {label}" } }}>
      <Theme mode="light" theme={matchaTheme}>
        <AvatarContext.Provider value={avatar}>
          <div className={shellClassName}>
            <BrandHeader isTrip={isTrip} onShare={() => setShareOpen(true)} />
            {isHome ? <BrandIntro onPastChange={setIntroPast} /> : null}
            {isTrip ? <TripPage onShare={() => setShareOpen(true)} /> : pathname === "/guides" ? <GuideHub /> : guide ? <GuidePage guide={guide} /> : <HomePage />}
            <Footer />
            {shareOpen ? <ShareDialog isOpen onClose={setShareOpen} /> : null}
          </div>
        </AvatarContext.Provider>
      </Theme>
    </InternationalizationProvider>
  );
}
