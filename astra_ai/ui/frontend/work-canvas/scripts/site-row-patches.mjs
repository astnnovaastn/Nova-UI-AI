// MPL-2.0. AEGIS: one row per website for the pages a run read itself. Reference checkout untouched.
// In a run with helper parts, Zephium puts all the lead's own reads in one row (all sites stacked).
// AEGIS runs always have helpers, so different websites were stacked together. Here the lead's reads
// stand as one row per registrable website, exactly as Zephium shows a run without parts; several
// pages of one website still share one stack.
const SPLIT = `    if (lead) {
      const bySite = new Map<string, typeof lead.pages>();
      for (const page of lead.pages) {
        const site = registrableSite(hostOf(page.url)) || page.url;
        bySite.set(site, [...(bySite.get(site) ?? []), page]);
      }
      const follows = opened ? { follows: searched.id } : {};
      if (bySite.size <= 1) parts.push({ ...lead, order: parts.length, ...follows });
      else
        for (const [site, pages] of bySite)
          parts.push({
            ...lead,
            id: \`\${lead.id}:\${site}\`,
            key: \`\${lead.key}:\${site}\`,
            title: siteName(site, pages.flatMap((page) => [
              ...page.steps.flatMap((step) => (step.local?.page_title ? [step.local.page_title] : [])),
              ...(page.page?.title ? [page.page.title] : []),
            ])),
            host: site,
            pages,
            unread: lead.unread.filter((page) => registrableSite(hostOf(page.url)) === site),
            state: pages.some((page) => page.steps.some((step) => step.status === "running")) ? "running" : "done",
            order: parts.length,
            ...follows,
          });
    }`;
export const siteRowPatches = [
  {
    file: "features/work/lib/run/parts.ts",
    find: "    if (lead)\n      parts.push({ ...lead, order: parts.length, ...(opened ? { follows: searched.id } : {}) });",
    replace: SPLIT,
    why: "The pages a run read itself stand one row per website; only pages of one website stack.",
  },
  {
    file: "features/work/lib/project-environment-board.ts",
    find: `  if (part.helper === "research" && !part.pages.length) {
    const search = searchPart(part);`,
    replace: `  // AEGIS: a helper that read nothing and searched nothing is its name and one line, drawn as a
  // label, so its box (and the strings that meet it) ends where its words end.
  if (part.helper === "research" && !part.pages.length && !part.sources.length && !searchPart(part))
    return { kind: "label" };
  if (part.helper === "research" && !part.pages.length) {
    const search = searchPart(part);`,
    why: "A helper with no pages, sources or search is a compact label, not an empty 488 px box.",
  },
];
