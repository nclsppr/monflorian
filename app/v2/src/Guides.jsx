import { guides } from "./guides.js";
import "./guides.css";

function GuideArrow() {
  return (
    <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 24 24" width="20">
      <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function GuideDate({ date }) {
  const [year, month, day] = date.split("-");
  const months = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  return <time dateTime={date}>{Number(day)} {months[Number(month) - 1]} {year}</time>;
}

function GuideParagraph({ paragraph, sources }) {
  const source = paragraph.source && sources.find((item) => item.id === paragraph.source);
  return (
    <p>
      {paragraph.text}
      {source && <> <a href={source.url}>{source.label}</a>.</>}
    </p>
  );
}

function GuideCard({ guide }) {
  return (
    <article className="guide-card">
      <h2><a href={guide.path}>{guide.heading}<GuideArrow /></a></h2>
      <p>{guide.description}</p>
      <p className="guide-card-meta">{guide.category}<span aria-hidden="true"> · </span>{guide.readTime} de lecture</p>
    </article>
  );
}

export function GuideHub() {
  return (
    <main className="guide-page guide-hub" id="main-content" tabIndex={-1}>
      <nav aria-label="Fil d'Ariane" className="guide-breadcrumb"><a href="/">Accueil</a><span aria-hidden="true">/</span><span aria-current="page">Guides</span></nav>
      <div className="guide-hub-heading">
        <h1>Un voyage qui tient dans tes journées</h1>
        <p>Répartir les nuits, compter les trajets, choisir ce qui mérite une étape. Des guides pour préparer ton voyage et garder du temps sur place.</p>
      </div>
      <div className="guide-list">
        {guides.map((guide) => <GuideCard guide={guide} key={guide.path} />)}
      </div>
      <aside className="guide-hub-example" aria-labelledby="guide-example-title">
        <div>
          <h2 id="guide-example-title">Voir ces choix dans un carnet</h2>
          <p>L'exemple Japon déroule dix jours entre Tokyo, Hakone et Kyoto, avec les transferts, les nuits et les points à vérifier.</p>
        </div>
        <a className="guide-action" href="/carnets/japon-10-jours">Ouvrir le carnet Japon<GuideArrow /></a>
      </aside>
      <a className="guide-plan-link" href="/#create">Préparer mon pense-bête<GuideArrow /></a>
    </main>
  );
}

export function GuidePage({ guide }) {
  const relatedGuide = guides.find((item) => item.path === guide.relatedPath);
  return (
    <main className="guide-page" id="main-content" tabIndex={-1}>
      <nav aria-label="Fil d'Ariane" className="guide-breadcrumb"><a href="/">Accueil</a><span aria-hidden="true">/</span><a href="/guides">Guides</a></nav>
      <article>
        <header className="guide-heading">
          <h1>{guide.heading}</h1>
          <p className="guide-meta">Par Mon Florian<span aria-hidden="true"> · </span>{guide.readTime} de lecture<span aria-hidden="true"> · </span>Mis à jour le <GuideDate date={guide.updatedDate} /></p>
          <div className="guide-intro">{guide.intro.map((text) => <p key={text}>{text}</p>)}</div>
        </header>
        <div className="guide-reading-layout">
          <nav aria-label="Sommaire du guide" className="guide-toc">
            <h2>Dans ce guide</h2>
            <ol>
              {guide.sections.map((section) => <li key={section.id}><a href={`#${section.id}`}>{section.heading}</a></li>)}
              <li><a href="#sources">Sources et vérifications</a></li>
            </ol>
          </nav>
          <div className="guide-body">
            {guide.sections.map((section) => (
              <section aria-labelledby={section.id} className="guide-section" key={section.id}>
                <h2 id={section.id}>{section.heading}</h2>
                {section.paragraphs.map((paragraph) => <GuideParagraph key={paragraph.text} paragraph={paragraph} sources={guide.sources} />)}
                {section.bullets && <ul>{section.bullets.map((text) => <li key={text}>{text}</li>)}</ul>}
                {section.table && (
                  <div className="guide-table-wrap">
                    <table>
                      <caption>{section.table.caption}</caption>
                      <thead><tr>{section.table.headings.map((heading) => <th key={heading} scope="col">{heading}</th>)}</tr></thead>
                      <tbody>{section.table.rows.map((row) => <tr key={row[0]}>{row.map((cell, index) => index === 0 ? <th key={cell} scope="row">{cell}</th> : <td key={cell}>{cell}</td>)}</tr>)}</tbody>
                    </table>
                  </div>
                )}
                {section.after?.map((paragraph) => <GuideParagraph key={paragraph.text} paragraph={paragraph} sources={guide.sources} />)}
              </section>
            ))}
            <section aria-labelledby="sources" className="guide-sources guide-section">
              <h2 id="sources">Sources et vérifications</h2>
              <p>Pages consultées le <GuideDate date={guide.updatedDate} />. Les méthodes et répartitions proposées relèvent de la rédaction Mon Florian. Vérifie les informations de transport et de réservation pour tes dates auprès des organismes concernés.</p>
              <ul>{guide.sources.map((source) => <li key={source.id}><a href={source.url}>{source.label}</a><p>{source.detail}</p></li>)}</ul>
            </section>
            <aside aria-labelledby="guide-next-title" className="guide-next">
              <h2 id="guide-next-title">Passe au voyage concret</h2>
              <p>Le carnet Japon montre comment relier ces décisions jour après jour. Tu peux aussi préparer ton propre plan depuis l'accueil.</p>
              <div className="guide-next-actions">
                <a className="guide-action" href="/carnets/japon-10-jours">Voir le carnet Japon<GuideArrow /></a>
                <a href="/#create">Préparer mon pense-bête</a>
              </div>
              {relatedGuide && <p className="guide-related">À lire ensuite : <a href={relatedGuide.path}>{relatedGuide.heading}</a></p>}
            </aside>
          </div>
        </div>
      </article>
    </main>
  );
}
