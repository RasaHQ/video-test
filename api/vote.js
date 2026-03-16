import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // POST: record a vote
  if (req.method === 'POST') {
    try {
      const { topic, email, video } = req.body;

      if (!topic) {
        return res.status(400).json({ error: 'topic is required' });
      }

      const entry = {
        topic,
        email: email || null,
        video: video || null,
        timestamp: new Date().toISOString(),
        ua: req.headers['user-agent'] || null,
      };

      // Push to a KV list
      await kv.lpush('votes', JSON.stringify(entry));

      // Also increment a counter per topic for quick tallies
      await kv.hincrby('vote_counts', topic, 1);

      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('Vote error:', err);
      return res.status(500).json({ error: 'Failed to record vote' });
    }
  }

  // GET: retrieve votes (for you to check results)
  if (req.method === 'GET') {
    try {
      const secret = req.query.secret;
      if (secret !== process.env.ADMIN_SECRET) {
        return res.status(401).json({ error: 'unauthorized' });
      }

      const counts = await kv.hgetall('vote_counts') || {};
      const limit = parseInt(req.query.limit) || 50;
      const votes = await kv.lrange('votes', 0, limit - 1);

      return res.status(200).json({
        counts,
        total: votes.length,
        votes: votes.map(v => typeof v === 'string' ? JSON.parse(v) : v),
      });
    } catch (err) {
      console.error('Vote read error:', err);
      return res.status(500).json({ error: 'Failed to read votes' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
