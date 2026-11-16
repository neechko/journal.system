export interface DoiRegistration {
  doi: string;
  prefix: string;
  suffix: string;
  title: string;
  authors: DoiAuthor[];
  publicationDate: Date;
  journalTitle: string;
  journalIssn: string | null;
  journalIssnElectronic: string | null;
  volume: string | null;
  issue: string | null;
  pageStart: string | null;
  pageEnd: string | null;
  articleType: string;
  url: string;
  license: string | null;
  resourceType: "journal-article" | "book-chapter" | "conference-paper" | "report";
}

export interface DoiAuthor {
  givenName: string;
  familyName: string;
  orcid: string | null;
  affiliation: string | null;
  sequence: "first" | "additional";
}

export function generateDoiSuffix(articleId: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}${random}`.toLowerCase();
}

export function buildFullDoi(prefix: string, suffix: string): string {
  return `10.${prefix}/${suffix}`;
}

export function parseDoi(doi: string): { prefix: string; suffix: string } | null {
  const match = doi.match(/^10\.([^/]+)\/(.+)$/);
  if (!match) return null;
  return { prefix: match[1], suffix: match[2] };
}

export function validateDoiFormat(doi: string): boolean {
  return /^10\.\d{4,9}\/[-._;()/:A-Z0-9]+$/i.test(doi);
}

export function createDoiRegistration(
  article: {
    id: string;
    title: string;
    authors: { name: string; orcid: string | null; affiliation: string | null; isCorresponding: boolean; order: number }[];
    publishedAt: Date;
    journal: { title: string; issnPrint: string | null; issnElectronic: string | null };
    volume: { number: number; year: number } | null;
    issue: { number: number; year: number } | null;
    pageStart: number | null;
    pageEnd: number | null;
    articleType: string;
    url: string;
    license: string | null;
  },
  prefix: string
): DoiRegistration {
  const suffix = generateDoiSuffix(article.id);
  const doi = buildFullDoi(prefix, suffix);

  return {
    doi,
    prefix,
    suffix,
    title: article.title,
    authors: article.authors
      .sort((a, b) => a.order - b.order)
      .map((a, index) => ({
        givenName: a.name.split(" ").slice(0, -1).join(" "),
        familyName: a.name.split(" ").slice(-1)[0] || a.name,
        orcid: a.orcid,
        affiliation: a.affiliation,
        sequence: index === 0 ? "first" : "additional",
      })),
    publicationDate: article.publishedAt,
    journalTitle: article.journal.title,
    journalIssn: article.journal.issnPrint,
    journalIssnElectronic: article.journal.issnElectronic,
    volume: article.volume ? String(article.volume.number) : null,
    issue: article.issue ? String(article.issue.number) : null,
    pageStart: article.pageStart ? String(article.pageStart) : null,
    pageEnd: article.pageEnd ? String(article.pageEnd) : null,
    articleType: article.articleType,
    url: article.url,
    license: article.license,
    resourceType: "journal-article",
  };
}

export function buildCrossrefXml(registration: DoiRegistration): string {
  const authorsXml = registration.authors
    .map(
      (a) => `
    <person_name sequence="${a.sequence}" contributor_role="author">
      <given_name>${escapeXml(a.givenName)}</given_name>
      <surname>${escapeXml(a.familyName)}</surname>
      ${a.orcid ? `<ORCID>${a.orcid}</ORCID>` : ""}
      ${a.affiliation ? `<affiliation>${escapeXml(a.affiliation)}</affiliation>` : ""}
    </person_name>`
    )
    .join("");

  const dateParts = [
    registration.publicationDate.getUTCFullYear(),
    String(registration.publicationDate.getUTCMonth() + 1).padStart(2, "0"),
    String(registration.publicationDate.getUTCDate()).padStart(2, "0"),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<doi_batch version="4.4.2" xmlns="http://www.crossref.org/schema/4.4.2" 
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.crossref.org/schema/4.4.2 
http://www.crossref.org/schema/deposit/crossref4.4.2.xsd">
  <head>
    <doi_batch_id>${registration.doi.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}</doi_batch_id>
    <timestamp>${Date.now()}</timestamp>
    <depositor>
      <depositor_name>Journal System</depositor_name>
      <email_address>noreply@journalsystem.example</email_address>
    </depositor>
    <registrant>Journal System</registrant>
  </head>
  <body>
    <journal>
      <journal_metadata>
        <full_title>${escapeXml(registration.journalTitle)}</full_title>
        ${registration.journalIssn ? `<issn media_type="print">${registration.journalIssn}</issn>` : ""}
        ${registration.journalIssnElectronic ? `<issn 
media_type="electronic">${registration.journalIssnElectronic}</issn>` : ""}
      </journal_metadata>
      <journal_issue>
        <publication_date media_type="print">
          <year>${dateParts[0]}</year>
          <month>${dateParts[1]}</month>
          <day>${dateParts[2]}</day>
        </publication_date>
        ${registration.volume ? `<journal_volume><volume>${escapeXml(registration.volume)}</volume></journal_volume>` 
: ""}
        ${registration.issue ? `<issue>${escapeXml(registration.issue)}</issue>` : ""}
      </journal_issue>
      <journal_article publication_type="full_text">
        <titles>
          <title>${escapeXml(registration.title)}</title>
        </titles>
        <contributors>${authorsXml}</contributors>
        <publication_date media_type="print">
          <year>${dateParts[0]}</year>
          <month>${dateParts[1]}</month>
          <day>${dateParts[2]}</day>
        </publication_date>
        ${registration.pageStart ? 
`<pages><first_page>${escapeXml(registration.pageStart)}</first_page>${registration.pageEnd ? 
`<last_page>${escapeXml(registration.pageEnd)}</last_page>` : ""}</pages>` : ""}
        <doi_data>
          <doi>${registration.doi}</doi>
          <resource>${escapeXml(registration.url)}</resource>
        </doi_data>
        ${registration.license ? `<license_ref>${escapeXml(registration.license)}</license_ref>` : ""}
      </journal_article>
    </journal>
  </body>
</doi_batch>`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, "\x22")
    .replace(/'/g, "&apos;");
}