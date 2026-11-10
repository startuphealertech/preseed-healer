import { Marked } from "marked";
import sanitizeHtml from "sanitize-html";
import { slugify } from "@preseedhealer/types";
import { siteConfig } from "@/config/site";

export type TocItem = { id: string; text: string; level: 2 | 3 };

const decode = (s: string) =>
  s
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

const SANITIZE: sanitizeHtml.IOptions = {
  allowedTags: [
    ...sanitizeHtml.defaults.allowedTags.filter((t) => t !== "h1"),
    "img",
    "del",
    "ins",
    "sup",
    "sub",
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "title", "width", "height", "loading", "decoding"],
    h2: ["id"],
    h3: ["id"],
    h4: ["id"],
    th: ["align"],
    td: ["align"],
    code: ["class"],
    div: ["class"],
    ol: ["start"],
  },
  allowedClasses: { div: ["table-wrap"], code: [/^language-[\w-]+$/] },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: { img: ["http", "https"] },
  allowProtocolRelative: false,
  transformTags: {
    a: (tagName, attribs) => {
      const href = attribs.href ?? "";
      const external = /^https?:\/\//.test(href) && !href.includes(siteConfig.domain);
      return {
        tagName,
        attribs: external ? { ...attribs, target: "_blank", rel: "noopener noreferrer" } : attribs,
      };
    },
    img: (tagName, attribs) => ({ tagName, attribs: { ...attribs, loading: "lazy", decoding: "async" } }),
  },
};

/**
 * Markdown (GFM) → sanitised HTML + table of contents.
 * H1s are demoted to H2 because the page template owns the single <h1>.
 */
export function renderMarkdown(markdown: string): { html: string; toc: TocItem[] } {
  const toc: TocItem[] = [];
  const used = new Map<string, number>();

  const md = new Marked({ gfm: true });
  md.use({
    renderer: {
      heading({ tokens, depth }) {
        const inner = this.parser.parseInline(tokens);
        const text = decode(inner);
        let id = slugify(text) || "section";
        const seen = used.get(id) ?? 0;
        used.set(id, seen + 1);
        if (seen) id = `${id}-${seen + 1}`;
        const level = Math.min(Math.max(depth, 2), 4);
        if (level === 2 || level === 3) toc.push({ id, text, level });
        return `<h${level} id="${id}">${inner}</h${level}>\n`;
      },
    },
  });

  const raw = md.parse(markdown ?? "", { async: false });
  const wrapped = raw.replace(/<table>/g, '<div class="table-wrap"><table>').replace(/<\/table>/g, "</table></div>");
  return { html: sanitizeHtml(wrapped, SANITIZE), toc };
}
