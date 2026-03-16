const OG_DATA = {
  '/multitasking': {
    title: 'Multitasking — Three tasks, one call. Watch an AI agent in action.',
    description: 'Filing a claim, arranging a courtesy car, answering questions — all at once. See a Rasa agent handle a full insurance claim in parallel. 75 seconds.',
    image: '/assets/thumbnails/multitasking.png',
  },
  '/memory': {
    title: 'Memory — The shift from slots to memory is as big as intents to LLMs.',
    description: 'Not a database — a memory. See how Rasa agents build memory on their own, across skills, channels, and conversations, without being told what to look for.',
    image: '/assets/thumbnails/memory.png',
  },
  '/skills': {
    title: 'Skills — Too many agent architectures rely on prompt and pray.',
    description: 'Rasa skills sit on a spectrum from fully controlled to fully autonomous. Build once, compose freely, test in isolation. See how it works in 75 seconds.',
    image: '/assets/thumbnails/skills.png',
  },
};

export default function middleware(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  const og = OG_DATA[path];
  if (!og) return;

  return fetch(new URL('/index.html', request.url))
    .then(res => res.text())
    .then(html => {
      const absImage = `${url.origin}${og.image}`;
      const absUrl = `${url.origin}${path}`;

      const ogTags = `
    <meta property="og:title" content="${og.title}">
    <meta property="og:description" content="${og.description}">
    <meta property="og:image" content="${absImage}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:url" content="${absUrl}">
    <meta property="og:type" content="video.other">
    <meta property="og:site_name" content="Rasa">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${og.title}">
    <meta name="twitter:description" content="${og.description}">
    <meta name="twitter:image" content="${absImage}">`;

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
