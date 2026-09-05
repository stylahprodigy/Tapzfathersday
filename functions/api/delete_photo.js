export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const photoId = body.id;

    if (!photoId) {
      return new Response(JSON.stringify({ success: false, error: 'Photo ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (env && env.DAD_KV) {
      let photos = await env.DAD_KV.get('community_photos', { type: 'json' }) || [];
      photos = photos.filter(p => p.id !== photoId);
      await env.DAD_KV.put('community_photos', JSON.stringify(photos));
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true, localOnly: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
