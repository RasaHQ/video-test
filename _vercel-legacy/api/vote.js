import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // POST: record or update a vote
  if (req.method === 'POST') {
    try {
      const { topic, email, video, voteId } = req.body;

      if (!topic) {
        return res.status(400).json({ error: 'topic is required' });
      }

      // If this is an email update to an existing vote, store it separately
      if (voteId && email) {
        await kv.hset('vote_emails', { [voteId]: email });
        return res.status(200).json({ ok: true, updated: true });
      }

      const id = `v_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      const entry = {
        id,
        topic,
        email: email || null,
        video: video || null,
        timestamp: new Date().toISOString(),
        ua: req.headers['user-agent'] || null,
      };

      // Push to a KV list
      await kv.lpush('votes', JSON.stringify(entry));

      // Increment counter per topic for quick tallies
      await kv.hincrby('vote_counts', topic, 1);

      return res.status(200).json({ ok: true, voteId: id });
    } catch (err) {
      console.error('Vote error:', err);
      return res.status(500).json({ error: 'Failed to record vote' });
    }
  }

  // GET: retrieve votes (admin)
  if (req.method === 'GET') {
    try {
      const secret = req.query.secret;
      if (secret !== process.env.ADMIN_SECRET) {
        return res.status(401).json({ error: 'unauthorized' });
      }

      const counts = await kv.hgetall('vote_counts') || {};
      const limit = parseInt(req.query.limit) || 50;
      const rawVotes = await kv.lrange('votes', 0, limit - 1);
      const emails = await kv.hgetall('vote_emails') || {};

      // Merge emails into votes
      const votes = rawVotes.map(v => {
        const vote = typeof v === 'string' ? JSON.parse(v) : v;
        if (vote.id && emails[vote.id]) {
          vote.email = emails[vote.id];
        }
        return vote;
      });

      return res.status(200).json({
        counts,
        total: votes.length,
        votes,
      });
    } catch (err) {
      console.error('Vote read error:', err);
      return res.status(500).json({ error: 'Failed to read votes' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
