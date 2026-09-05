export async function onRequestGet(context) {
  try {
    const { env } = context;
    let photos = [];
    if (env && env.DAD_KV) {
      photos = await env.DAD_KV.get('community_photos', { type: 'json' }) || [];
    }
    return new Response(JSON.stringify({ success: true, photos }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, photos: [], error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
