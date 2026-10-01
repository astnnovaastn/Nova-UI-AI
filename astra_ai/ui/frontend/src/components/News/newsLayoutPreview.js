const image = (id, url, width, height, alt) => ({ id, url, width, height, alt });
const images = [
  image('hero-1', 'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1600&q=85', 1600, 900, 'City skyline at dusk'),
  image('hero-2', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=85', 1600, 900, 'Global network illustration'),
  image('hero-3', 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=85', 1600, 900, 'Technology detail'),
  image('support-1', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=85', 1200, 800, 'Market display'),
  image('support-2', 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=85', 1200, 800, 'Code on display'),
  image('gallery-1', 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1000&q=85', 1000, 700, 'Editorial meeting'),
  image('gallery-2', 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1000&q=85', 1000, 700, 'Newsroom workspace'),
  image('gallery-3', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1000&q=85', 1000, 700, 'Laptop research'),
];

export const NEWS_LAYOUT_PREVIEW_STORY = {
  id: 'layout-preview',
  headline: 'Developing story: the next policy decision is reshaping markets, technology and the public debate',
  summary: 'This fully populated preview lets a layout be judged as a real News briefing, with varied article copy, media and source modules rather than a sparse fallback template.',
  body: 'This fully populated preview uses structured briefing data rather than placeholder lorem ipsum. It reveals spacing, readable widths and the way a design handles a developing story without turning editor minimum heights into empty production space.\n\nA second paragraph tests long-form editorial rhythm. The final renderer keeps prose content-driven, so a user can design a compact or expansive section without clipping a future News result.\n\nA final paragraph gives high-density blocks enough material to demonstrate meaningful visual hierarchy.',
  publishedAt: '2026-08-21T09:30:00Z', category: 'Preview briefing', isTopStory: true,
  briefingSections: Array.from({ length: 16 }, (_, index) => ({ id: `section-${index + 1}`, title: ['Market Context', 'What Changed', 'Technical Analysis', 'Financial Impact', 'What Happens Next'][index % 5], body: `This is realistic sample reporting for section ${index + 1}. It provides enough substantive copy to evaluate the configured density, wrapping, and vertical rhythm of a dynamic News block.\n\nA second paragraph makes the content behave like a genuine editorial section rather than a single short caption.` })),
  keyPoints: [{ id: 'one', title: 'Officials signalled a decision after a late briefing.' }, { id: 'two', title: 'Markets responded as new details reached investors.' }, { id: 'three', title: 'Watch the next primary-source update for confirmation.' }],
  timeline: [{ id: 'timeline-1', title: '08:00', body: 'Initial reporting establishes the first verified details.' }, { id: 'timeline-2', title: '10:30', body: 'Follow-up evidence changes the immediate outlook.' }],
  insight: { text: 'The strongest layouts make the relationship between verified facts, analysis and supporting media immediately legible.', publisher: 'AEGIS Editorial Desk' },
  whatToWatch: 'Watch for official confirmation, follow-up reporting and the market reaction through the next session.',
  mediaPlan: { heroMedia: images.slice(0, 3), supportingMedia: images.slice(3, 5), quoteMedia: [], relatedCoverageMedia: [] },
  media: images.slice(5),
  sources: [{ id: 'source-1', name: 'Public Record', headline: 'Official statement and accompanying data', publishedAt: '2026-08-21T08:45:00Z', url: 'https://example.test/source-1' }, { id: 'source-2', name: 'Independent Wire', headline: 'Independent confirmation of the development', publishedAt: '2026-08-21T08:30:00Z', url: 'https://example.test/source-2' }, { id: 'source-3', name: 'Market Desk', headline: 'Analysis of the immediate impact', publishedAt: '2026-08-21T08:15:00Z', url: 'https://example.test/source-3' }],
};

export const NEWS_LAYOUT_PREVIEW_RELATED = Array.from({ length: 5 }, (_, index) => ({ id: `preview-related-${index + 1}`, headline: ['Why the policy shift matters now', 'The technical detail analysts are watching', 'Markets price the next phase of the story', 'What the latest data confirms', 'A timeline of the key decisions'][index], sources: [{ name: ['Global Desk', 'Example Journal', 'Markets Wire', 'Public Record', 'Technology Review'][index], url: `https://example.test/related-${index + 1}` }], imageUrl: images[(index + 3) % images.length].url, publishedAt: `2026-08-21T0${8 - index}:00:00Z` }));

export function getLayoutTestData() {
  return { story: NEWS_LAYOUT_PREVIEW_STORY, relatedStories: NEWS_LAYOUT_PREVIEW_RELATED, allSources: NEWS_LAYOUT_PREVIEW_STORY.sources };
}

export function getTestContentForBlock(block, index = 0) {
  const { story, relatedStories, allSources } = getLayoutTestData();
  const section = story.briefingSections[index % story.briefingSections.length];
  return { story, relatedStories, allSources, section, image: (story.mediaPlan.heroMedia.concat(story.mediaPlan.supportingMedia, story.media))[index % 8] };
}