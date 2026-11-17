/*
 * AEGIS Agent Execution Lab — the mock web.
 *
 * Every page and search result here is invented, on the reserved `.example` domain, and
 * registered by the workflow fixtures. The simulated search and page tools answer only from
 * this map; an address that is not in it fails the way an unreadable site does. Page text is
 * data: one page below carries an instruction aimed at the agent, so the lab can show it being
 * treated as content rather than obeyed.
 */
export type Page = {
  url: string;
  title: string;
  /** What a reader extracts: the facts a cited digest would carry. */
  facts: string[];
  /** Rows a records read returns (name plus fields). */
  records?: Record<string, string>[];
  /** Text on the page that tries to steer the agent. Kept as data, never followed. */
  injection?: string;
  /** Only readable inside the person's own session. */
  signedIn?: boolean;
  /** A site that does not answer. */
  down?: boolean;
};

const PAGES = new Map<string, Page>();
const SEARCHES = new Map<string, string[]>();

export function page(url: string, title: string, facts: string[], more: Partial<Page> = {}): string {
  PAGES.set(url, { url, title, facts, ...more });
  return url;
}

export function results(query: string, urls: string[]) {
  SEARCHES.set(query.toLowerCase(), urls);
}

export const pageAt = (url: string) => PAGES.get(url);

export function search(query: string): { url: string; title: string; snippet: string }[] {
  const urls = SEARCHES.get(query.toLowerCase()) ?? [];
  return urls.flatMap((url) => {
    const found = PAGES.get(url);
    return found ? [{ url, title: found.title, snippet: found.facts[0] ?? "" }] : [];
  });
}

export const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./u, "");
  } catch {
    return url;
  }
};
