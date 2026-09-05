export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const name = (body.name || '').trim();
    const note = (body.note || '').trim();

    if (!name) {
      return new Response(JSON.stringify({ success: false, error: 'Name is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const timestamp = new Date().toISOString();
    const newVisitor = {
      id: Date.now(),
      name,
      note,
      timestamp,
      date: new Date().toLocaleDateString()
    };

    if (env && env.DAD_KV) {
      let visitors = await env.DAD_KV.get('visitors', { type: 'json' }) || [];
      visitors.unshift(newVisitor);
      if (visitors.length > 500) visitors = visitors.slice(0, 500);
      await env.DAD_KV.put('visitors', JSON.stringify(visitors));
      return new Response(JSON.stringify({ success: true, count: visitors.length, visitor: newVisitor }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true, storedLocally: true, visitor: newVisitor }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

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
