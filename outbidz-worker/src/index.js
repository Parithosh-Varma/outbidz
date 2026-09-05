export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/leaderboard') {
      const { results } = await env.DB.prepare(`
        SELECT p.id, p.name, p.slug, p.url, p.category_slug as category,
               COALESCE(MAX(b.amount),0) as top_bid,
               COUNT(b.id) as bid_count,
               MAX(b.created_at) as last_bid_at
        FROM products p
        LEFT JOIN bids b ON b.product_id = p.id
        GROUP BY p.id
        ORDER BY top_bid DESC, bid_count DESC
        LIMIT 50
      `).all();
      return new Response(JSON.stringify(results), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    if (url.pathname === '/api/bid' && request.method === 'POST') {
      const body = await request.json();
      const id = crypto.randomUUID();
      await env.DB.prepare(`INSERT INTO bids (id, product_id, user_id, amount) VALUES (?, ?, ?, ?)`)
        .bind(id, body.product_id, body.user_id || 'anon', body.amount).run();
      return new Response(JSON.stringify({ok:true}), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    return new Response('Outbidz API', { headers: { 'Access-Control-Allow-Origin':'*' }});
  }
}
