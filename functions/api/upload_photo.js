export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const uploader = (body.uploader || '').trim();
    const father_name = (body.father_name || '').trim();
    const caption = (body.caption || '').trim();
    const image = body.image || '';

    if (!image || !father_name || !uploader) {
      return new Response(JSON.stringify({ success: false, error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const newPhoto = {
      id: Date.now(),
      uploader,
      father_name,
      caption: caption || 'Honoring our beloved father',
      url: image,
      date: new Date().toLocaleDateString()
    };

    if (env && env.DAD_KV) {
      let photos = await env.DAD_KV.get('community_photos', { type: 'json' }) || [];
      photos.unshift(newPhoto);
      // Keep up to 100 community photos
      if (photos.length > 100) photos = photos.slice(0, 100);
      await env.DAD_KV.put('community_photos', JSON.stringify(photos));
      return new Response(JSON.stringify({ success: true, photo: newPhoto }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true, storedLocally: true, photo: newPhoto }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
