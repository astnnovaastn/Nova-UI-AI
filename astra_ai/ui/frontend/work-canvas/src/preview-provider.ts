/**
 * What a website card shows. For now that is saved research data: the source's excerpt,
 * favicon and any image the research saved. Real page screenshots can be added later
 * by installing another provider, with no change to the cards.
 */
export type SitePreview = {
  title: string;
  excerpt?: string;
  favicon?: string;
  /** A picture for the card, when there is a genuine one. */
  image?: string;
};

export type PreviewProvider = {
  name: string;
  previewFor(url: string): SitePreview | null;
};

export function savedDataProvider(previews: ReadonlyMap<string, SitePreview>): PreviewProvider {
  return { name: "saved-data", previewFor: (url) => previews.get(url) ?? null };
}

let provider: PreviewProvider = savedDataProvider(new Map());

export function installPreviewProvider(next: PreviewProvider) {
  provider = next;
}

export function previewFor(url: string): SitePreview | null {
  return provider.previewFor(url);
}
