export interface JatsArticle {
  articleId: string;
  doi: string | null;
  title: string;
  subtitle: string | null;
  abstract: string | null;
  keywords: string[];
  authors: JatsAuthor[];
  affiliations: JatsAffiliation[];
  articleCategories: string[];
  articleType: string;
  publicationDate: Date;
  volume: string | null;
  issue: string | null;
  pageStart: string | null;
  pageEnd: string | null;
  license: JatsLicense | null;
  history: JatsHistoryEvent[];
  body: JatsBodySection[];
  references: JatsReference[];
}

export interface JatsAuthor {
  id: string;
  givenNames: string;
  surname: string;
  orcid: string | null;
  email: string | null;
  affiliations: string[];
  isCorresponding: boolean;
  order: number;
}

export interface JatsAffiliation {
  id: string;
  name: string;
  department: string | null;
  institution: string | null;
  city: string | null;
  country: string | null;
  ror: string | null;
}

export interface JatsLicense {
  type: string;
  url: string;
  version: string;
  licenseStatement: string;
}

export interface JatsHistoryEvent {
  date: Date;
  type: "received" | "revised" | "accepted" | "published" | "published-online" | "published-print";
  label: string;
}

export interface JatsBodySection {
  id: string;
  type: "abstract" | "intro" | "methods" | "results" | "discussion" | "conclusion" | "acknowledgments" | "appendix" | "other";
  title: string | null;
  content: string;
  subsections: JatsBodySection[];
}

export interface JatsReference {
  id: string;
  citationType: "journal" | "book" | "chapter" | "conference" | "report" | "thesis" | "website" | "other";
  authors: JatsAuthor[];
  title: string;
  source: string;
  year: number | null;
  volume: string | null;
  issue: string | null;
  pageStart: string | null;
  pageEnd: string | null;
  doi: string | null;
  pmid: string | null;
  pmcid: string | null;
  url: string | null;
  rawCitation: string | null;
}

export function buildJatsXml(article: JatsArticle): string {
  const front = buildFront(article);
  const body = buildBody(article.body);
  const back = buildBack(article.references);

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE article PUBLIC "-//NLM//DTD JATS (Z39.96) Journal Archiving and Interchange DTD v1.3 20210610//EN" "JATS-archivearticle1.dtd">
<article article-type="${escapeXml(article.articleType)}" dtd-version="1.3" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:mml="http://www.w3.org/1998/Math/MathML">
  ${front}
  ${body}
  ${back}
</article>`;
}

function buildFront(article: JatsArticle): string {
  const pubDate = article.publicationDate;
  const year = pubDate.getUTCFullYear();
  const month = String(pubDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(pubDate.getUTCDate()).padStart(2, "0");

  const authorsXml = article.authors
    .map(
      (a) => `
        <contrib contrib-type="author" id="${a.id}" corresp="${a.isCorresponding ? "yes" : "no"}">
          <name>
            <given-names>${escapeXml(a.givenNames)}</given-names>
            <surname>${escapeXml(a.surname)}</surname>
          </name>
          ${a.orcid ? `<contrib-id contrib-id-type="orcid">${escapeXml(a.orcid)}</contrib-id>` : ""}
          ${a.email ? `<email>${escapeXml(a.email)}</email>` : ""}
          ${a.affiliations.map((affId) => `<xref ref-type="aff" rid="${affId}"/>`).join("")}
        </contrib>`
    )
    .join("");

  const affiliationsXml = article.affiliations
    .map(
      (aff) => `
        <aff id="${aff.id}">
          ${aff.institution ? `<institution>${escapeXml(aff.institution)}</institution>` : ""}
          ${aff.department ? `<institution-wrap><institution>${escapeXml(aff.department)}</institution></institution-wrap>` : ""}
          ${aff.city ? `<addr-line>${escapeXml(aff.city)}</addr-line>` : ""}
          ${aff.country ? `<country>${escapeXml(aff.country)}</country>` : ""}
          ${aff.ror ? `<institution-id institution-id-type="ror">${escapeXml(aff.ror)}</institution-id>` : ""}
        </aff>`
    )
    .join("");

  const keywordsXml = article.keywords
    .map((k) => `<kwd>${escapeXml(k)}</kwd>`)
    .join("");

  const categoriesXml = article.articleCategories
    .map((c) => `<article-categories><subj-group><subject>${escapeXml(c)}</subject></subj-group></article-categories>`)
    .join("");

  const historyXml = article.history
    .map(
      (h) => `
        <date date-type="${h.type}">
          <year>${h.date.getUTCFullYear()}</year>
          <month>${String(h.date.getUTCMonth() + 1).padStart(2, "0")}</month>
          <day>${String(h.date.getUTCDate()).padStart(2, "0")}</day>
        </date>`
    )
    .join("");

  return `
  <front>
    <journal-meta>
      <journal-id journal-id-type="publisher-id">${article.articleId}</journal-id>
    </journal-meta>
    <article-meta>
      <article-id pub-id-type="doi">${article.doi ? escapeXml(article.doi) : ""}</article-id>
      ${categoriesXml}
      <title-group>
        <article-title>${escapeXml(article.title)}</article-title>
        ${article.subtitle ? `<subtitle>${escapeXml(article.subtitle)}</subtitle>` : ""}
      </title-group>
      <contrib-group>${authorsXml}</contrib-group>
      ${affiliationsXml ? `<aff>${affiliationsXml}</aff>` : ""}
      <pub-date pub-type="epub" date-type="published">
        <year>${year}</year>
        <month>${month}</month>
        <day>${day}</day>
      </pub-date>
      ${article.volume ? `<volume>${escapeXml(article.volume)}</volume>` : ""}
      ${article.issue ? `<issue>${escapeXml(article.issue)}</issue>` : ""}
      ${article.pageStart ? `<fpage>${escapeXml(article.pageStart)}</fpage>` : ""}
      ${article.pageEnd ? `<lpage>${escapeXml(article.pageEnd)}</lpage>` : ""}
      <abstract>${article.abstract ? escapeXml(article.abstract) : ""}</abstract>
      <kwd-group>${keywordsXml}</kwd-group>
      <history>${historyXml}</history>
      ${article.license ? buildLicense(article.license) : ""}
    </article-meta>
  </front>`;
}

function buildLicense(license: JatsLicense): string {
  return `
    <permissions>
      <license license-type="${escapeXml(license.type)}" xlink:href="${escapeXml(license.url)}">
        <license-p>${escapeXml(license.licenseStatement)}</license-p>
      </license>
    </permissions>`;
}

function buildBody(sections: JatsBodySection[]): string {
  const sectionsXml = sections.map(buildSection).join("");
  return `<body>${sectionsXml}</body>`;
}

function buildSection(section: JatsBodySection): string {
  const subsectionsXml = section.subsections.map(buildSection).join("");
  const secType = section.type === "other" ? "" : `sec-type="${section.type}"`;
  return `
    <sec ${secType} id="${section.id}">
      ${section.title ? `<title>${escapeXml(section.title)}</title>` : ""}
      <p>${escapeXml(section.content)}</p>
      ${subsectionsXml}
    </sec>`;
}

function buildBack(references: JatsReference[]): string {
  if (references.length === 0) return "";

  const refsXml = references
    .map(
      (r) => `
        <ref id="${r.id}">
          ${r.rawCitation ? `<mixed-citation>${escapeXml(r.rawCitation)}</mixed-citation>` : buildStructuredCitation(r)}
        </ref>`
    )
    .join("");

  return `<back><ref-list>${refsXml}</ref-list></back>`;
}

function buildStructuredCitation(ref: JatsReference): string {
  const authorsXml = ref.authors
    .map(
      (a) => `
        <person-group person-group-type="author">
          <name>
            <given-names>${escapeXml(a.givenNames)}</given-names>
            <surname>${escapeXml(a.surname)}</surname>
          </name>
          ${a.orcid ? `<contrib-id contrib-id-type="orcid">${escapeXml(a.orcid)}</contrib-id>` : ""}
        </person-group>`
    )
    .join("");

  return `
    <element-citation publication-type="${ref.citationType}">
      ${authorsXml}
      <article-title>${escapeXml(ref.title)}</article-title>
      <source>${escapeXml(ref.source)}</source>
      ${ref.year ? `<year>${ref.year}</year>` : ""}
      ${ref.volume ? `<volume>${escapeXml(ref.volume)}</volume>` : ""}
      ${ref.issue ? `<issue>${escapeXml(ref.issue)}</issue>` : ""}
      ${ref.pageStart ? `<fpage>${escapeXml(ref.pageStart)}</fpage>` : ""}
      ${ref.pageEnd ? `<lpage>${escapeXml(ref.pageEnd)}</lpage>` : ""}
      ${ref.doi ? `<pub-id pub-id-type="doi">${escapeXml(ref.doi)}</pub-id>` : ""}
      ${ref.pmid ? `<pub-id pub-id-type="pmid">${escapeXml(ref.pmid)}</pub-id>` : ""}
      ${ref.url ? `<uri>${escapeXml(ref.url)}</uri>` : ""}
    </element-citation>`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, "\x22")
    .replace(/'/g, "&apos;");
}