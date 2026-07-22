// Netlify Function (v2) — records video votes + follow-up emails.
// Ported from api/vote.js (Vercel serverless + @vercel/kv).
// Storage is the same Upstash Redis instance; @vercel/kv was a thin wrapper
// over @upstash/redis, so the data format and commands are unchanged.
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'content-type': 'application/json' },
  });
}

export default async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: CORS });
  }

  // POST: record or update a vote
  if (req.method === 'POST') {
    try {
      const { topic, email, video, voteId } = await req.json();

      if (!topic) {
        return json({ error: 'topic is required' }, 400);
      }

      // If this is an email update to an existing vote, store it separately
      if (voteId && email) {
        await redis.hset('vote_emails', { [voteId]: email });
        return json({ ok: true, updated: true });
      }

      const id = `v_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      const entry = {
        id,
        topic,
        email: email || null,
        video: video || null,
        timestamp: new Date().toISOString(),
        ua: req.headers.get('user-agent') || null,
      };

      // Push to a Redis list
      await redis.lpush('votes', JSON.stringify(entry));

      // Increment counter per topic for quick tallies
      await redis.hincrby('vote_counts', topic, 1);

      return json({ ok: true, voteId: id });
    } catch (err) {
      console.error('Vote error:', err);
      return json({ error: 'Failed to record vote' }, 500);
    }
  }

  // GET: retrieve votes (admin)
  if (req.method === 'GET') {
    try {
      const url = new URL(req.url);
      const secret = url.searchParams.get('secret');
      if (secret !== process.env.ADMIN_SECRET) {
        return json({ error: 'unauthorized' }, 401);
      }

      const counts = (await redis.hgetall('vote_counts')) || {};
      const limit = parseInt(url.searchParams.get('limit')) || 50;
      const rawVotes = await redis.lrange('votes', 0, limit - 1);
      const emails = (await redis.hgetall('vote_emails')) || {};

      // Merge emails into votes
      const votes = rawVotes.map((v) => {
        const vote = typeof v === 'string' ? JSON.parse(v) : v;
        if (vote.id && emails[vote.id]) {
          vote.email = emails[vote.id];
        }
        return vote;
      });

      return json({ counts, total: votes.length, votes });
    } catch (err) {
      console.error('Vote read error:', err);
      return json({ error: 'Failed to read votes' }, 500);
    }
  }

  return json({ error: 'Method not allowed' }, 405);
};

// Serve this function at /api/vote (Netlify Functions v2 routing),
// matching the path the front-end fetches.
export const config = {
  path: '/api/vote',
};
