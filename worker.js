export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // 1. GET ALL COMMUNITY PHOTOS
    if (url.pathname === '/api/community_photos' && request.method === 'GET') {
      try {
        const photos = await env.DAD_KV.get('community_photos', { type: 'json' }) || [];
        return new Response(JSON.stringify({ success: true, photos }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ success: false, photos: [], error: e.message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // 2. UPLOAD PHOTO
    if (url.pathname === '/api/upload_photo' && request.method === 'POST') {
      try {
        const body = await request.json();
        const uploader = (body.uploader || '').trim();
        const father_name = (body.father_name || '').trim();
        const caption = (body.caption || '').trim();
        const image = body.image || '';

        if (!image || !father_name || !uploader) {
          return new Response(JSON.stringify({ success: false, error: 'Missing required fields' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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

        let photos = await env.DAD_KV.get('community_photos', { type: 'json' }) || [];
        photos.unshift(newPhoto);
        if (photos.length > 100) photos = photos.slice(0, 100);
        await env.DAD_KV.put('community_photos', JSON.stringify(photos));

        return new Response(JSON.stringify({ success: true, photo: newPhoto }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ success: false, error: e.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // 3. RECORD VISITOR
    if (url.pathname === '/api/record_visitor' && request.method === 'POST') {
      try {
        const body = await request.json();
        const name = (body.name || '').trim();
        const note = (body.note || '').trim();

        if (!name) {
          return new Response(JSON.stringify({ success: false, error: 'Name required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const newVisitor = {
          id: Date.now(),
          name,
          note,
          timestamp: new Date().toISOString(),
          date: new Date().toLocaleDateString()
        };

        let visitors = await env.DAD_KV.get('visitors', { type: 'json' }) || [];
        visitors.unshift(newVisitor);
        if (visitors.length > 500) visitors = visitors.slice(0, 500);
        await env.DAD_KV.put('visitors', JSON.stringify(visitors));

        return new Response(JSON.stringify({ success: true, count: visitors.length, visitor: newVisitor }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ success: false, error: e.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // 4. GET VISITORS
    if (url.pathname === '/api/visitors' && request.method === 'GET') {
      try {
        const visitors = await env.DAD_KV.get('visitors', { type: 'json' }) || [];
        return new Response(JSON.stringify({ success: true, visitors }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ success: false, visitors: [], error: e.message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // 5. DELETE PHOTO
    if (url.pathname === '/api/delete_photo' && request.method === 'POST') {
      try {
        const body = await request.json();
        const photoId = body.id;
        let photos = await env.DAD_KV.get('community_photos', { type: 'json' }) || [];
        photos = photos.filter(p => p.id !== photoId);
        await env.DAD_KV.put('community_photos', JSON.stringify(photos));
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ success: false, error: e.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // 6. DELETE VISITOR (Admin Only: Delete single or purge testers)
    if (url.pathname === '/api/delete_visitor' && request.method === 'POST') {
      try {
        const body = await request.json();
        const visitorId = body.id;
        const targetName = (body.name || '').trim().toLowerCase();
        const purgeTests = !!body.purgeTests;
        const purgeAll = !!body.purgeAll;

        let visitors = await env.DAD_KV.get('visitors', { type: 'json' }) || [];

        if (purgeAll) {
          visitors = [];
        } else if (purgeTests) {
          // Remove any entries with "test", "tester", "admin", "guest", or empty
          visitors = visitors.filter(v => {
            const n = (v.name || '').toLowerCase();
            return !n.includes('test') && !n.includes('admin') && n !== 'guest' && n.length > 0;
          });
        } else if (visitorId || targetName) {
          visitors = visitors.filter(v => {
            if (visitorId && v.id === visitorId) return false;
            if (targetName && (v.name || '').toLowerCase() === targetName && (!v.id || v.id === visitorId)) return false;
            return true;
          });
        }

        await env.DAD_KV.put('visitors', JSON.stringify(visitors));
        return new Response(JSON.stringify({ success: true, count: visitors.length, visitors }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ success: false, error: e.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Serve static assets directly (index.html, style.css, photos, videos)
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not Found', { status: 404 });
  }
};
