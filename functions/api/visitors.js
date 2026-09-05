export async function onRequestGet(context) {
  try {
    const { env } = context;
    let visitors = [];
    if (env && env.DAD_KV) {
      visitors = await env.DAD_KV.get('visitors', { type: 'json' }) || [];
    }
    return new Response(JSON.stringify({ success: true, visitors }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, visitors: [], error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
