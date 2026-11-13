/**
 * Source stacks. The canvas already groups the pages a run opened on one site into one card (a
 * "part"), its windows layered with a count. AEGIS lets the person open that stack into one card
 * per page, side by side in the layout, and stack it again.
 *
 * Presentation only: an opened stack's cards carry the very pages the stack held, with their
 * own ids, URLs and citations, so strings can reach each page and nothing is duplicated or lost.
 */
export type StackPage = { id: string; url: string };
export type StackPart = { pages: readonly StackPage[]; title: string; shape?: string; stack?: StackInfo };
export type StackInfo = { id: string; count: number; open: boolean; index?: number };
export type Stackable = { id: string; type?: string; part?: StackPart };

const SEP = "::p";

export const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

/** Whether a card is a stack of several pages that can be opened. */
export const isStack = (item: Stackable) => item.type === "part" && item.part?.shape === "pages" && (item.part.pages.length ?? 0) > 1;

/** The stack an opened page card belongs to, or the card itself. */
export const stackOf = (id: string) => (id.includes(SEP) ? id.slice(0, id.indexOf(SEP)) : id);

/**
 * The cards to draw: every stack marked as one, and every open stack as one card per page, in
 * the order the run opened them. Other cards pass through untouched.
 */
export function expandStacks<T extends Stackable>(items: readonly T[], open: ReadonlySet<string>): T[] {
  return items.flatMap((item) => {
    if (!isStack(item)) return [item];
    const part = item.part!;
    const count = part.pages.length;
    if (!open.has(item.id)) return [{ ...item, part: { ...part, stack: { id: item.id, count, open: false } } }];
    return part.pages.map((page, index) => {
      return {
        ...item,
        // Short and stable: the page's place in the stack. Page ids can be long, and the canvas
        // drops any card whose id passes 128 characters.
        id: index ? `${item.id}${SEP}${index + 1}` : item.id,
        title: hostOf(page.url) || part.title,
        part: { ...part, title: index ? hostOf(page.url) || part.title : part.title, pages: [page], stack: { id: item.id, count, open: true, index } },
      };
    });
  });
}
