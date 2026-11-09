/**
 * Finished research as a paper on the canvas. The words are the report's own. The HTML comes
 * from the Reader's sanitizer in the React app; this file only arranges it for the sheet.
 */
export type PaperSource = { id?: string; title: string; url: string };
export type PaperImage = {
  id: string;
  caption?: string;
  source_id?: string;
  publication?: string;
  placement_text?: string;
  content_hash?: string;
};
export type PaperData = {
  id: string;
  /** The run this paper is the result of. */
  run: string;
  researchId: string;
  title: string;
  markdown: string;
  /** What the sheet says it is: a report, a partial result, a follow-up. */
  label: string;
  note?: string;
  sources: PaperSource[];
  images: PaperImage[];
};

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};
const MARKER = /\[(S\d+(?:\s*[,;]\s*S\d+)*)\]/g;

/** Text with citation markers, split into words and the sources they name. An unknown marker stays as text. */
export function splitCitations(text: string, sources: readonly PaperSource[]): (string | PaperSource[])[] {
  const parts: (string | PaperSource[])[] = [];
  let at = 0;
  for (const match of text.matchAll(MARKER)) {
    const named = match[1]!
      .split(/\s*[,;]\s*/)
      .flatMap((id) => sources.filter((source) => source.id === id && /^https?:\/\//i.test(source.url)));
    if (!named.length) continue;
    if (match.index > at) parts.push(text.slice(at, match.index));
    parts.push(named);
    at = match.index + match[0].length;
  }
  if (at < text.length) parts.push(text.slice(at));
  return parts;
}

/** Follow-up blocks in saved order, one entry per section, as the Reader groups them. */
export function followupSections(
  blocks: readonly { id: string; text: string; section_id?: string; section_title?: string }[],
): { id: string; title: string; text: string }[] {
  const sections: { id: string; title: string; text: string }[] = [];
  const byKey = new Map<string, { id: string; title: string; text: string }>();
  for (const block of blocks) {
    if (!block.text?.trim()) continue;
    const key = block.section_id || block.id;
    const found = byKey.get(key);
    if (found) {
      found.text += `\n\n${block.text}`;
      continue;
    }
    const section = { id: key, title: block.section_title || "Follow-up research", text: block.text };
    byKey.set(key, section);
    sections.push(section);
  }
  return sections;
}

const anchor = (value: string) => value.toLocaleLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

/** Same placement rule as the Reader: where the saved anchor text falls, or where the source is cited. */
export function imagesFor(text: string, images: readonly PaperImage[], placed: Set<string>): PaperImage[] {
  const words = anchor(text.replace(MARKER, ""));
  return images.filter((image) => {
    if (placed.has(image.id)) return false;
    const fits = image.placement_text
      ? words.includes(anchor(image.placement_text).slice(0, 55))
      : !!image.source_id && text.includes(`[${image.source_id}]`);
    if (fits) placed.add(image.id);
    return fits;
  });
}

/** Sets sanitized report HTML as a paper: lead paragraph, inline figures, source chips, scrolling tables. */
export function dressPaper(html: string, paper: PaperData): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const body = doc.body;
  // The sheet shows the title itself. Pictures come only from the report's own validated images.
  const first = body.firstElementChild;
  if (first?.tagName === "H1") first.remove();
  for (const image of Array.from(body.querySelectorAll("img"))) image.remove();

  const placed = new Set<string>();
  const unique = paper.images
    .filter((image, index, all) => all.findIndex((other) => other.id === image.id || (!!image.content_hash && other.content_hash === image.content_hash)) === index)
    .slice(0, 6);
  for (const element of Array.from(body.querySelectorAll("p, li"))) {
    for (const image of imagesFor(element.textContent ?? "", unique, placed)) {
      const figure = doc.createElement("figure");
      figure.dataset.image = image.id;
      const caption = [image.caption, image.publication].filter(Boolean).join(" · ");
      if (caption) {
        const words = doc.createElement("figcaption");
        words.textContent = caption;
        figure.append(words);
      }
      (element.closest("ul, ol") ?? element).after(figure);
    }
  }

  const walker = doc.createTreeWalker(body, NodeFilter.SHOW_TEXT);
  const texts: Text[] = [];
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    if (!node.parentElement?.closest("pre, code, a") && /\[S\d/.test(node.data)) texts.push(node);
  }
  for (const node of texts) {
    const fragment = doc.createDocumentFragment();
    for (const part of splitCitations(node.data, paper.sources)) {
      if (typeof part === "string") {
        fragment.append(part);
        continue;
      }
      const seen = new Set<string>();
      for (const source of part) {
        if (seen.has(source.url)) continue;
        seen.add(source.url);
        const chip = doc.createElement("button");
        chip.type = "button";
        chip.className = "cite nodrag nopan";
        chip.dataset.url = source.url;
        chip.title = source.title;
        chip.textContent = hostOf(source.url) || "Source";
        fragment.append(chip);
      }
    }
    node.replaceWith(fragment);
  }

  for (const table of Array.from(body.querySelectorAll("table"))) {
    const wrap = doc.createElement("div");
    wrap.className = "table-wrap";
    table.replaceWith(wrap);
    wrap.append(table);
  }
  const lead = body.firstElementChild;
  if (lead?.tagName === "P") lead.classList.add("lead");
  return body.innerHTML;
}

/** The sources a paper names, by website, for its footer. */
export function paperSites(sources: readonly PaperSource[]): { host: string; source: PaperSource }[] {
  const sites = new Map<string, PaperSource>();
  for (const source of sources) {
    const host = /^https?:\/\//i.test(source.url) ? hostOf(source.url) : "";
    if (host && !sites.has(host)) sites.set(host, source);
  }
  return [...sites].map(([host, source]) => ({ host, source }));
}
