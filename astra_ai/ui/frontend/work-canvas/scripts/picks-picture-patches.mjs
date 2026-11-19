// MPL-2.0. AEGIS V29: pictures on picks from the web addresses the agent found. The reference checkout
// stays untouched.
//
// Why: Zephium shows a pick's picture only once its host has fetched and admitted a candidate into the
// profile's media store (`fetched`, keyed by address). AEGIS has no such store, so every pick was drawn
// text-only. Here a pick with no admitted picture carries up to three of its plain http(s) candidates
// (`remote`), and its card draws the first one that loads as an <img>: lazy, no referrer, async decode;
// a candidate that fails gives way to the next, and when none loads the card keeps its text face.
export const picksPicturePatches = [
  {
    file: "features/work/lib/board/types.ts",
    find: "export type PickView = Likeness & {\n",
    replace:
      "export type PickView = Likeness & {\n  /** AEGIS: web addresses of its picture (at most three), tried in order when none was admitted. */\n  remote?: readonly string[];\n",
    why: "A pick can carry its web picture addresses.",
  },
  {
    file: "features/work/lib/board/objects.ts",
    find: "            ...(item.logo_host ? { logo: item.logo_host } : {}),\n            ...(item.url ? { url: item.url } : {}),\n",
    replace:
      "            ...(item.logo_host ? { logo: item.logo_host } : {}),\n" +
      "            // AEGIS: no admitted picture, so the agent's own web candidates (http(s) only, at most three).\n" +
      "            ...(!src\n" +
      "              ? (() => {\n" +
      "                  const remote = pickCandidates(item).filter((candidate) => /^https?:\\/\\//iu.test(candidate)).slice(0, 3);\n" +
      "                  return remote.length ? { remote } : {};\n" +
      "                })()\n" +
      "              : {}),\n" +
      "            ...(item.url ? { url: item.url } : {}),\n",
    why: "Pass a pick's web picture candidates through when no picture was admitted.",
  },
  {
    file: "features/work/components/objects/PickCard.svelte",
    find: "  const picture = $derived(pick.picture && !failed ? pick.picture : null);\n",
    replace:
      "  const picture = $derived(pick.picture && !failed ? pick.picture : null);\n" +
      "  /** AEGIS: which of the web candidates is tried now; one that fails gives way to the next. */\n" +
      "  let remoteAt = $state(0);\n" +
      "  const remote = $derived(!picture ? (pick.remote?.[remoteAt] ?? null) : null);\n",
    why: "Track the web candidate the card is trying.",
  },
  {
    file: "features/work/components/objects/PickCard.svelte",
    find: "  class:pictured={!!picture}\n",
    replace: "  class:pictured={!!picture || !!remote}\n",
    why: "A pick drawn from a web picture is pictured.",
  },
  {
    file: "features/work/components/objects/PickCard.svelte",
    find: '    </div>\n  {/if}\n  <div class="body">\n    {#if !picture && pick.recommended}',
    replace:
      '    </div>\n  {:else if remote}\n' +
      '    <div class="photo remote" class:video class:product>\n' +
      '      <img src={remote} alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" draggable="false" onerror={() => (remoteAt += 1)} />\n' +
      '      {#if pick.recommended}<span class="badge"><Star size={11} />{m.work_pick_top()}</span>{/if}\n' +
      '    </div>\n' +
      '  {/if}\n  <div class="body">\n    {#if !picture && !remote && pick.recommended}',
    why: "Draw the first web candidate that loads, lazily and without a referrer.",
  },
  {
    file: "features/work/components/objects/PickCard.svelte",
    find: "<style>",
    replace:
      "<style>\n  .photo.remote img{display:block;inline-size:100%;block-size:100%;object-fit:cover}\n  .photo.remote.product img{object-fit:contain;mix-blend-mode:multiply}",
    why: "A web picture fills its photo frame like an admitted one.",
  },
];
