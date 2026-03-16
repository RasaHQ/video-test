const OG_DATA = {
  '/multitasking': {
    title: 'Multitasking — Rasa in 2026',
    description: 'Filing a claim, arranging a courtesy car, answering questions — all at once. Watch an AI agent handle three tasks in a single conversation.',
    image: '/assets/thumbnails/multitasking.png',
  },
  '/memory': {
    title: 'Memory — Rasa in 2026',
    description: 'The shift from slots to memory is as big as intents to LLMs. See how Rasa agents build memory on their own — across skills, channels, and conversations.',
    image: '/assets/thumbnails/memory.png',
  },
  '/skills': {
    title: 'Skills — Rasa in 2026',
    description: 'Too many agent architectures rely on prompt and pray. Rasa skills sit on a spectrum from fully controlled to fully autonomous.',
    image: '/assets/thumbnails/skills.png',
  },
};

const DEFAULT_OG = {
  title: 'Prompt and pray? I\'m over it. — Rasa',
  description: 'The elements of a modern agent architecture, explained in 1 minute each. A video series from Rasa.',
  image: '/assets/thumbnails/multitasking.png',
};

export default function middleware(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  // Only intercept video deep links
  const og = OG_DATA[path];
  if (!og) return;

  // Fetch the original HTML and inject OG tags
  return fetch(new URL('/index.html', request.url))
    .then(res => res.text())
    .then(html => {
      const data = og || DEFAULT_OG;
      const absImage = `${url.origin}${data.image}`;
      const absUrl = `${url.origin}${path}`;

      const ogTags = `
    <meta property="og:title" content="${data.title}">
    <meta property="og:description" content="${data.description}">
    <meta property="og:image" content="${absImage}">
    <meta property="og:url" content="${absUrl}">
    <meta property="og:type" content="video.other">
    <meta property="og:site_name" content="Rasa">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${data.title}">
    <meta name="twitter:description" content="${data.description}">
    <meta name="twitter:image" content="${absImage}">`;

      // Inject after <head>
      const injected = html.replace('<head>', `<head>${ogTags}`);

      return new Response(injected, {
        headers: {
          'content-type': 'text/html; charset=utf-8',
        },
      });
    });
}

export const config = {
  matcher: ['/multitasking', '/memory', '/skills'],
};
