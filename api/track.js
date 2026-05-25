export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { tracking_code, video_id, event } = req.body;

    if (!video_id || !event) {
      return res.status(400).json({ error: 'video_id and event are required' });
    }

    const validEvents = ['page_load', 'play', 'play_25', 'play_50', 'play_75', 'complete'];
    if (!validEvents.includes(event)) {
      return res.status(400).json({ error: 'Invalid event type' });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY env vars');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const row = {
      tracking_code: tracking_code || null,
      video_id,
      event,
      user_agent: req.headers['user-agent'] || null,
      referrer: req.headers['referer'] || null,
    };

    const response = await fetch(`${supabaseUrl}/rest/v1/video_views`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(row),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Supabase insert error:', errorText);
      return res.status(500).json({ error: 'Failed to record event' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Track error:', err);
    return res.status(500).json({ error: 'Failed to record event' });
  }
}
