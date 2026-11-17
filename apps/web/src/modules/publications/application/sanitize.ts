/**
 * HTML sanitisation for public article content.
 *
 * Article bodies are structured HTML that may originate from an import (JATS)
 * or an editor's paste buffer, so they are untrusted. We render them with
 * `dangerouslySetInnerHTML`, which means every value MUST pass through this
 * allowlist first. See docs/05-security/SECURITY_BASELINE.md and the sanitizer
 * ADR for the rationale behind this profile.
 */
import sanitizeHtml from "sanitize-html";

const allowedTags = [
  "a",
  "abbr",
  "b",
  "blockquote",
  "br",
  "caption",
  "cite",
  "code",
  "col",
  "colgroup",
  "dd",
  "dfn",
  "div",
  "dl",
  "dt",
  "em",
  "figcaption",
  "figure",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "i",
  "img",
  "li",
  "mark",
  "ol",
  "p",
  "pre",
  "s",
  "small",
  "span",
  "strong",
  "sub",
  "sup",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "tr",
  "u",
  "ul",
];

const allowedAttributes: sanitizeHtml.IOptions["allowedAttributes"] = {
  a: ["href", "title", "name"],
  abbr: ["title"],
  img: ["src", "alt", "title", "width", "height"],
  td: ["colspan", "rowspan", "headers"],
  th: ["colspan", "rowspan", "headers", "scope"],
  col: ["span"],
  colgroup: ["span"],
  ol: ["start", "type"],
  "*": ["id"],
};

const sanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags,
  allowedAttributes,
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: {
    // Never allow data: or javascript: image sources.
    img: ["http", "https"],
  },
  // Drop the contents of these elements entirely instead of leaking text.
  nonTextTags: ["script", "style", "textarea", "option", "noscript"],
  transformTags: {
    // A publication page must not open new browsing contexts implicitly, and
    // external links must not be able to reach window.opener.
    a: (tagName, attribs) => {
      const href = attribs.href ?? "";
      const isExternal = /^https?:\/\//i.test(href);
      return {
        tagName,
        attribs: isExternal
          ? { ...attribs, rel: "noopener noreferrer" }
          : attribs,
      };
    },
  },
  exclusiveFilter: (frame) =>
    frame.tag === "img" && !frame.attribs.src,
};

export function sanitizeArticleHtml(html: string): string {
  return sanitizeHtml(html, sanitizeOptions);
}

/**
 * Sanitises a small inline string (title, label) by stripping every tag.
 */
export function sanitizePlainText(value: string): string {
  return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} });
}
