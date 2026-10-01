import React, { useEffect, useMemo, useRef, useState } from 'react';
import { hasEditorialMediaRail, mediaBand, normalizeBriefingSections, resolveEditorialMediaPlan, resolveEditorialSectionLayout } from './newsMedia.js';
import NewsLayoutRenderer from './NewsLayoutRenderer.jsx';

const paragraphs = (value) => String(value || '').split(/\n+/).map((item) => item.trim()).filter(Boolean);
const status = (story) => story?.isBreaking ? 'BREAKING' : story?.isLive ? 'LIVE UPDATE' : story?.isTopStory ? 'TOP STORY' : 'LATEST';
const formatDate = (value) => { if (!value) return ''; const date = new Date(value); return Number.isNaN(date.getTime()) ? String(value) : new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date); };
const motion = () => matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

function EditorialImage({ item, slot, priority = false, onFailed }) {
  const [failed, setFailed] = useState(false);
  const srcSet = item.variants?.map((variant) => variant.width ? `${variant.url} ${variant.width}w` : '').filter(Boolean).join(', ');
  if (!item?.url || failed) return null;
  return <figure className={`news-editorial-image news-editorial-image--${slot} news-editorial-image--${mediaBand(item)}`}>
    <img src={item.url} srcSet={srcSet || undefined} sizes={slot === 'hero' ? '(max-width: 449px) calc(100vw - 44px), 40cqw' : slot === 'related' ? '92px' : '(max-width: 449px) calc(100vw - 44px), 34cqw'} alt={item.alt || ''} loading={priority ? 'eager' : 'lazy'} decoding="async" fetchpriority={priority ? 'high' : 'auto'} onError={() => { setFailed(true); onFailed?.(item.id); }} />
    {item.caption && slot !== 'related' && <figcaption>{item.caption}</figcaption>}
  </figure>;
}

function HeroCarousel({ items, onMediaFailed }) {
  const [index, setIndex] = useState(0); const [failedIds, setFailedIds] = useState(() => new Set()); const track = useRef(null);
  const visibleItems = items.filter((item) => !failedIds.has(item.id)); const count = visibleItems.length;
  const go = (next) => { const target = (next + count) % count; setIndex(target); track.current?.children[target]?.scrollIntoView({ behavior: motion(), inline: 'center', block: 'nearest' }); };
  if (!count) return null;
  return <section className="news-editorial-hero" aria-label="Featured story images" tabIndex="0" onKeyDown={(event) => { if (event.key === 'ArrowLeft') { event.preventDefault(); go(index - 1); } if (event.key === 'ArrowRight') { event.preventDefault(); go(index + 1); } }}><div className="news-editorial-hero-track" ref={track}>{visibleItems.map((item, itemIndex) => <div className="news-editorial-hero-slide" key={item.id}><EditorialImage item={item} slot="hero" priority={itemIndex === 0} onFailed={(id) => { setFailedIds((current) => new Set(current).add(id)); onMediaFailed?.(id); }}/></div>)}</div>{count > 1 && <div className="news-editorial-carousel-controls"><button type="button" onClick={() => go(index - 1)} aria-label="Previous story image">‹</button><output aria-live="polite">{index + 1} / {count}</output><button type="button" onClick={() => go(index + 1)} aria-label="Next story image">›</button></div>}</section>;
}

function EditorialSection({ section, media, onMediaFailed }) {
  const layout = resolveEditorialSectionLayout(section, media);
  const prose = <div className="news-editorial-section-copy"><h2>{section.title}</h2>{paragraphs(section.body).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>;
  if (layout.variant === 'text') return <section className="news-editorial-section news-editorial-section--text">{prose}</section>;
  if (layout.variant === 'fullMedia') return <section className="news-editorial-section news-editorial-section--full-media">{prose}<EditorialImage item={layout.media} slot="inline" onFailed={onMediaFailed}/></section>;
  return <section className={`news-editorial-section news-editorial-section--${layout.variant}`}>{layout.variant === 'mediaLeftText' && <EditorialImage item={layout.media} slot="inline" onFailed={onMediaFailed}/>} {prose}{layout.variant === 'textRightMedia' && <EditorialImage item={layout.media} slot="inline" onFailed={onMediaFailed}/>}</section>;
}

function RelatedCoverage({ stories, media }) {
  const thumbnails = new Map(media.map((item) => [item.id, item])); const [index, setIndex] = useState(0); const rail = useRef(null);
  const cards = stories.slice(0, 6); if (!cards.length) return null;
  const go = (next) => { const target = Math.max(0, Math.min(cards.length - 1, next)); setIndex(target); rail.current?.children[target]?.scrollIntoView({ behavior: motion(), inline: 'start', block: 'nearest' }); };
  return <section className="news-related-coverage"><div className="news-related-heading"><h2>RELATED COVERAGE</h2><div className="news-related-controls"><button type="button" onClick={() => go(index - 1)} disabled={index === 0} aria-label="Previous related story">‹</button><output aria-live="polite">{index + 1} / {cards.length}</output><button type="button" onClick={() => go(index + 1)} disabled={index === cards.length - 1} aria-label="Next related story">›</button></div></div><div className="news-related-strip" ref={rail}>{cards.map((story, cardIndex) => { const image = thumbnails.get(story.id) || media[cardIndex]; return <a key={story.id || `${story.headline}-${cardIndex}`} className={`news-related-card${image ? '' : ' is-text-only'}`} href={story.sources?.[0]?.url || '#'} target="_blank" rel="noopener noreferrer">{image && <EditorialImage item={image} slot="related"/>}<div><strong>{story.headline}</strong><span>{story.sources?.[0]?.name || 'News source'}{story.publishedAt ? ` · ${formatDate(story.publishedAt)}` : ''}</span></div></a>; })}</div></section>;
}

export default function NewsBriefing({ story, relatedStories = [], allSources, sourcesOpen, setSourcesOpen, changeTab, researchingMore, layout = null }) {
  if (layout) return <NewsLayoutRenderer layout={layout} story={story} relatedStories={relatedStories} allSources={allSources} sourcesOpen={sourcesOpen} setSourcesOpen={setSourcesOpen} changeTab={changeTab}/>;
  const plan = useMemo(() => resolveEditorialMediaPlan(story.media || [], story.mediaPlan), [story.media, story.mediaPlan]);
  const [failedMediaIds, setFailedMediaIds] = useState(() => new Set());
  useEffect(() => setFailedMediaIds(new Set()), [story.id]);
  const visiblePlan = useMemo(() => Object.fromEntries(Object.entries(plan).map(([slot, items]) => [slot, items.filter((item) => !failedMediaIds.has(item.id))])), [failedMediaIds, plan]);
  const markMediaFailed = (id) => setFailedMediaIds((current) => current.has(id) ? current : new Set(current).add(id));
  const hasMediaRail = hasEditorialMediaRail(visiblePlan) || Boolean(story.insight);
  const sections = normalizeBriefingSections(story.briefingSections, story.body || story.summary);
  const usedMedia = useMemo(() => new Set([...visiblePlan.hero, ...visiblePlan.supporting, ...visiblePlan.quote, ...visiblePlan.related].map((item) => item.id)), [visiblePlan]);
  const sectionMedia = useMemo(() => (story.media || []).filter((item) => !failedMediaIds.has(item.id) && !usedMedia.has(item.id) && item.relatedSectionId), [failedMediaIds, story.media, usedMedia]);
  const intro = paragraphs(story.body || story.summary); const [leadSection, ...flowSections] = sections;
  const metadata = [formatDate(story.publishedAt), story.category, allSources.length ? `${allSources.length} sources` : ''].filter(Boolean);
  return <article className="news-briefing news-editorial" aria-busy={researchingMore}>
    <div className={`news-editorial-lead${hasMediaRail ? '' : ' is-text-led'}`}><div className="news-editorial-copy"><div className="news-briefing-label"><span>{status(story)}</span>{(story.isBreaking || story.isLive) && <em>JUST IN</em>}</div>{researchingMore && <div className="news-researching" role="status"><span/>Searching for additional coverage…</div>}<h1>{story.headline}</h1>{metadata.length > 0 && <div className="news-briefing-meta">{metadata.join(' · ')}</div>}<div className="news-briefing-body">{intro.map((paragraph, index) => <p className={index === 0 ? 'lead' : ''} key={index}>{paragraph}</p>)}</div></div>{hasMediaRail && <aside className="news-editorial-rail"><HeroCarousel items={visiblePlan.hero} onMediaFailed={markMediaFailed}/>{visiblePlan.supporting.slice(0, 1).map((item) => <EditorialImage key={item.id} item={item} slot="supporting" onFailed={markMediaFailed}/>)}{(story.insight || visiblePlan.quote[0]) && <aside className="news-editorial-insight">{visiblePlan.quote[0] && <EditorialImage item={visiblePlan.quote[0]} slot="quote" onFailed={markMediaFailed}/>}<div><span>EDITORIAL INSIGHT</span><p>{story.insight?.text || visiblePlan.quote[0]?.caption || visiblePlan.quote[0]?.alt}</p>{(story.insight?.publisher || visiblePlan.quote[0]?.caption) && <small>{story.insight?.publisher || visiblePlan.quote[0]?.caption}</small>}</div></aside>}</aside>}</div>
    {leadSection && <EditorialSection section={leadSection} media={sectionMedia.filter((item) => item.relatedSectionId === leadSection.id)} onMediaFailed={markMediaFailed}/>}<div className="news-editorial-flow">{flowSections.map((section) => <EditorialSection key={section.id} section={section} media={sectionMedia.filter((item) => item.relatedSectionId === section.id)} onMediaFailed={markMediaFailed}/>)}</div>
    <RelatedCoverage stories={relatedStories} media={visiblePlan.related}/>
    <section className="news-sources"><div><h2>{allSources.length} SOURCE{allSources.length === 1 ? '' : 'S'}</h2><p>More Coverage</p></div><button type="button" onClick={() => setSourcesOpen((open) => !open)} aria-expanded={sourcesOpen}>{sourcesOpen ? 'Hide sources' : 'View sources'}</button></section>
    {sourcesOpen && <div className="news-source-coverage">{allSources.map((source) => <article key={source.id}><div><strong>{source.name}</strong>{source.headline && <p>{source.headline}</p>}<time>{formatDate(source.publishedAt)}</time></div>{source.url && <a href={source.url} target="_blank" rel="noopener noreferrer">Open</a>}</article>)}</div>}
    <button className="news-full-coverage" type="button" onClick={() => changeTab('results')}>See full coverage →</button>
  </article>;
}
