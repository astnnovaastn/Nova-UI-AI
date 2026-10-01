# News media layout: primary-source implementation notes

This note records the browser and React behavior that informs the Live News
Briefing editorial media layout.

## Container-driven layout

Make the briefing content wrapper a named, width-queryable container:

```css
.news-editorial-content {
  container: news-content / inline-size;
}

@container news-content (width < 40rem) {
  /* Collapse the editorial rail beneath the text column. */
}
```

`inline-size` is appropriate because the widget must adapt to its own width,
not the browser viewport. Avoid `size` containment unless block-size queries
are required; it changes intrinsic sizing behavior. Named containers keep the
query attached to the intended widget wrapper rather than an incidental
ancestor.

Sources: [MDN: CSS container queries](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_queries), [CSS Containment Level 3](https://drafts.csswg.org/css-contain-3/#container-queries).

## Responsive images and fitting

For image variants, emit actual intrinsic-width candidates in `srcset` and a
slot-specific `sizes` value. The browser combines the first matching `sizes`
condition, the rendered slot width, and device pixel ratio to select a source.
Always include a final fallback size. Width (`w`) candidates are paired with
`sizes`; do not use density descriptors for the same source set.

Use `<picture>` only when the layout needs art direction (a legitimately
different crop/composition), not merely a different resolution.

`object-fit` is a layout decision after the image has been selected: `cover`
preserves the ratio while clipping, whereas `contain` preserves all content but
may letterbox. It cannot improve a thumbnail or choose a better source. Use
intentional `cover` only for suitable photography; use `contain` for charts,
logos, screenshots, documents, and images whose complete content matters.

Sources: [MDN: responsive images](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Responsive_images), [WHATWG HTML image and sizes processing](https://html.spec.whatwg.org/multipage/images.html#parsing-a-sizes-attribute), [MDN: object-fit](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/object-fit).

## Carousel state

Keep a carousel at the same component type, tree position, and stable key when
the briefing changes width or switches visual presentation. React preserves its
local active-index state under those conditions. Prefer CSS container-query
layout changes around a stable carousel root; do not conditionally replace it
with another root component or key it by media layout/breakpoint. Key carousel
slides by persistent media IDs, not array indexes.

Source: [React: preserving and resetting state](https://react.dev/learn/preserving-and-resetting-state).

## Concrete implications for this widget

- Keep backend media selection separate from frontend placement: media metadata
  and slot recommendations identify *what* is appropriate; the named container
  decides *how* the existing slots arrange at the current widget width.
- Use distinct `sizes` values for hero, supporting, and related-card slots so a
  compact thumbnail never causes a hero to use the same low-resolution asset.
- Do not use a fixed, wide `contain` box for portrait media. Put portrait or
  square assets in a constrained rail/card or pair them with adjacent text;
  collapse absent slots.
- Preserve carousel identity through resize, theme, and unrelated briefing
  updates so active selection does not reset.
