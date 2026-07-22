// Netlify Function (v2) — records video view events to Supabase.
// Ported from api/track.js (Vercel serverless).
// Writes rows to the `video_views` table via the Supabase REST API.
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'content-type': 'application/json' },
  });
}

const VALID_EVENTS = ['page_load', 'play', 'play_25', 'play_50', 'play_75', 'complete'];

export default async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: CORS });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    const { tracking_code, video_id, event } = await req.json();

    if (!video_id || !event) {
      return json({ error: 'video_id and event are required' }, 400);
    }

    if (!VALID_EVENTS.includes(event)) {
      return json({ error: 'Invalid event type' }, 400);
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY env vars');
      return json({ error: 'Server configuration error' }, 500);
    }

    const row = {
      tracking_code: tracking_code || null,
      video_id,
      event,
      user_agent: req.headers.get('user-agent') || null,
      referrer: req.headers.get('referer') || null,
    };

    const response = await fetch(`${supabaseUrl}/rest/v1/video_views`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(row),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Supabase insert error:', errorText);
      return json({ error: 'Failed to record event' }, 500);
    }

    return json({ ok: true });
  } catch (err) {
    console.error('Track error:', err);
    return json({ error: 'Failed to record event' }, 500);
  }
};

// Serve this function at /api/track, matching the path the front-end fetches.
export const config = {
  path: '/api/track',
};
