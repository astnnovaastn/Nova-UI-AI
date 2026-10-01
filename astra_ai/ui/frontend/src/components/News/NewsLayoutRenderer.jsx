import React, { useMemo, useRef, useState } from 'react';
import { resolveRenderFlow } from './newsLayout.js';

const text = (value) => String(value || '').trim();
const paragraphs = (value) => text(value).split(/\n+/).map((item) => item.trim()).filter(Boolean);
const status = (story) => story?.isBreaking ? 'BREAKING' : story?.isLive ? 'LIVE UPDATE' : story?.isTopStory ? 'TOP STORY' : 'LATEST';
const formatDate = (value) => { if (!value) return ''; const date = new Date(value); return Number.isNaN(date.getTime()) ? String(value) : new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date); };
const mediaBy = (story, key) => story?.mediaPlan?.[key] || story?.mediaPlan?.[key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)] || [];
const motion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

function LayoutMedia({ item, className = '', priority = false, fit = 'auto' }) {
  const [failed, setFailed] = useState(false);
  if (!item?.url || failed) return null;
  const srcSet = item.variants?.map((variant) => variant.width ? `${variant.url} ${variant.width}w` : '').filter(Boolean).join(', ');
  const imageFit = fit === 'cover' ? 'cover' : 'contain';
  return <figure className={`news-layout-media ${className}`}><img src={item.url} srcSet={srcSet || undefined} sizes={className.includes('hero') ? '(max-width: 470px) calc(100vw - 44px), 42cqw' : '(max-width: 470px) calc(100vw - 44px), 28cqw'} width={item.width || undefined} height={item.height || undefined} alt={item.alt || ''} loading={priority ? 'eager' : 'lazy'} decoding="async" fetchPriority={priority ? 'high' : 'auto'} style={{ objectFit: imageFit }} onError={() => setFailed(true)} />{item.caption && <figcaption>{item.caption}</figcaption>}</figure>;
}

function LayoutHero({ items, settings }) {
  const [index, setIndex] = useState(0); const trackRef = useRef(null); const visible = items.filter((item) => item?.url); const count = visible.length;
  if (!count) return null;
  const go = (target) => { const next = (target + count) % count; setIndex(next); trackRef.current?.children[next]?.scrollIntoView({ behavior: motion(), inline: 'center', block: 'nearest' }); };
  return <section className="news-layout-hero news-editorial-hero" aria-label="Featured story media" tabIndex="0" onKeyDown={(event) => { if (event.key === 'ArrowLeft') { event.preventDefault(); go(index - 1); } if (event.key === 'ArrowRight') { event.preventDefault(); go(index + 1); } }}><div className="news-layout-hero-track" ref={trackRef}>{visible.map((item, itemIndex) => <div className="news-layout-hero-slide" key={item.id || item.url}><LayoutMedia item={item} className="news-layout-media--hero" priority={itemIndex === 0} fit={settings?.fit}/></div>)}</div>{count > 1 && <div className="news-layout-hero-controls"><button type="button" aria-label="Previous story image" onClick={() => go(index - 1)}>‹</button>{settings?.pagination !== 'hidden' && <output aria-live="polite">{index + 1} / {count}</output>}<button type="button" aria-label="Next story image" onClick={() => go(index + 1)}>›</button></div>}</section>;
}

function RelatedCoverage({ stories = [] }) {
  const [index, setIndex] = useState(0); const rail = useRef(null); const cards = stories.slice(0, 8);
  if (!cards.length) return null;
  const go = (next) => { const target = Math.max(0, Math.min(cards.length - 1, next)); setIndex(target); rail.current?.children[target]?.scrollIntoView({ behavior: motion(), inline: 'start', block: 'nearest' }); };
  return <section className="news-layout-related"><header><h2>RELATED COVERAGE</h2><div><button type="button" aria-label="Previous related story" disabled={index === 0} onClick={() => go(index - 1)}>‹</button><output aria-live="polite">{index + 1} / {cards.length}</output><button type="button" aria-label="Next related story" disabled={index === cards.length - 1} onClick={() => go(index + 1)}>›</button></div></header><div className="news-layout-related-rail news-related-strip" ref={rail}>{cards.map((item, itemIndex) => <a key={item.id || `${item.headline}-${itemIndex}`} href={item.sources?.[0]?.url || '#'} target="_blank" rel="noopener noreferrer"><span>{item.imageUrl && <img src={item.imageUrl} alt="" loading="lazy"/>}</span><strong>{item.headline}</strong><small>{item.sources?.[0]?.name || 'News source'}{item.publishedAt ? ` · ${formatDate(item.publishedAt)}` : ''}</small></a>)}</div></section>;
}

function BlockContent({ block, story, relatedStories, allSources, sections, changeTab, setSourcesOpen, sourcesOpen }) {
  switch (block.binding) {
    case 'topStoryLabel': return <span className="news-layout-kicker">{status(story)}</span>;
    case 'headline': return <h1>{story.headline}</h1>;
    case 'metadata': return <p className="news-layout-meta">{[formatDate(story.publishedAt || story.updatedAt), story.category, allSources.length ? `${allSources.length} sources` : ''].filter(Boolean).join(' · ')}</p>;
    case 'intro': return <div className="news-layout-prose news-layout-intro">{paragraphs(story.body || story.summary).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>;
    case 'bodyText': return <div className="news-layout-prose">{paragraphs(story.body || story.summary).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>;
    case 'dynamicSection': { const section = sections[block.contentIndex || 0]; return section ? <section className="news-layout-section"><h2>{section.title}</h2><div className="news-layout-prose">{paragraphs(section.body).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div></section> : null; }
    case 'timeline': return story.timeline?.length ? <section className="news-layout-section"><h2>TIMELINE</h2><div className="news-layout-prose">{story.timeline.map((item) => <p key={item.id}><strong>{item.title}</strong> {item.body}</p>)}</div></section> : null;
    case 'insight': return story.insight?.text ? <aside className="news-layout-insight"><span>EDITORIAL INSIGHT</span><blockquote>{story.insight.text}</blockquote>{story.insight.publisher && <small>{story.insight.publisher}</small>}</aside> : null;
    case 'whatToWatch': return story.whatToWatch ? <section className="news-layout-section"><h2>WHAT TO WATCH NEXT</h2><div className="news-layout-prose"><p>{story.whatToWatch}</p></div></section> : null;
    case 'list': { const items = story.keyPoints || story.key_points || story.timeline || []; return items.length ? <section className="news-layout-section news-layout-list"><h2>{block.label || 'KEY DEVELOPMENTS'}</h2><ul>{items.slice(0, block.settings?.itemCount || 6).map((item, index) => <li key={item.id || index}>{item.title || item.description || item.body || String(item)}</li>)}</ul></section> : null; }
    case 'heroMedia': return <LayoutHero items={mediaBy(story, 'heroMedia')} settings={block.settings}/>;
    case 'supportingMedia': return <LayoutMedia item={mediaBy(story, 'supportingMedia')[0]} className="news-layout-media--supporting" fit={block.settings?.fit}/>;
    case 'mediaGallery': return <div className="news-layout-gallery">{(story.media || []).slice(0, 3).map((item) => <LayoutMedia key={item.id} item={item} fit={block.settings?.fit}/>)}</div>;
    case 'relatedCoverage': return <RelatedCoverage stories={relatedStories}/>;
    case 'sourceCoverage': return allSources.length ? <section className="news-layout-sources"><div><h2>{allSources.length} SOURCE{allSources.length === 1 ? '' : 'S'}</h2><p>Coverage supporting this briefing.</p></div><button type="button" onClick={() => setSourcesOpen?.((open) => !open)}>{sourcesOpen ? 'Hide sources' : 'View sources'}</button>{sourcesOpen && <div className="news-layout-source-list">{allSources.map((source) => <article key={source.id}><div><strong>{source.name}</strong><small>{source.headline || source.publishedAt}</small></div>{source.url && <a href={source.url} target="_blank" rel="noopener noreferrer">Open</a>}</article>)}</div>}</section> : null;
    case 'fullSearchAction': return <button type="button" className="news-full-coverage" onClick={() => changeTab('results')}>See full coverage →</button>;
    case 'divider': return <hr className="news-layout-divider"/>;
    case 'container': return <section className="news-layout-guide" aria-label={block.label}>Layout section</section>;
    default: return <section className="news-layout-unsupported">Unsupported preview block: {block.kind}</section>;
  }
}

export default function NewsLayoutRenderer({ layout, story, relatedStories, allSources, changeTab, setSourcesOpen, sourcesOpen = false, mode = 'live' }) {
  const resolved = useMemo(() => resolveRenderFlow(layout, { ...story, relatedStories, sources: allSources, fullSearchResults: relatedStories }, mode), [layout, relatedStories, story, allSources, mode]);
  const sections = useMemo(() => (story.briefingSections || []).filter((section) => text(section?.body)), [story.briefingSections]);
  return <article className="news-layout-renderer" style={{ '--news-layout-gap': `${resolved.gap}px`, '--news-layout-columns': resolved.columns }}>{resolved.bands.map((band) => <section key={`${band.y}-${band.blocks.map((block) => block.id).join('-')}`} className="news-layout-flow-band" style={{ '--news-layout-band-rows': band.rows }}>{band.blocks.map((block) => <div key={block.id} className={`news-layout-block news-layout-block--${block.kind}`} style={{ gridColumn: `${block.layout.x + 1} / span ${block.layout.w}`, gridRow: `${block.renderStart} / span ${block.renderSpan}` }}><BlockContent block={block} story={story} relatedStories={relatedStories} allSources={allSources} sections={sections} changeTab={changeTab} setSourcesOpen={setSourcesOpen} sourcesOpen={sourcesOpen}/></div>)}</section>)}</article>;
}