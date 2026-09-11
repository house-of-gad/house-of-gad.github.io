export async function onRequestGet({ request, env }) {
  const cookie = request.headers.get("Cookie") || "";
  const expected = `session=${await sign(env.SITE_PASSWORD)}`;

  if (!cookie.includes(expected)) {
    return new Response("No autorizado", { status: 401 });
  }


  const range = request.headers.get("range");
  const object = await env.VIDEO_BUCKET.get("drmxlre7.mp4", {
    range: range ? parseRange(range) : undefined,
  });

  if (!object) return new Response("No encontrado", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("Accept-Ranges", "bytes");

  if (range && object.range) {
    headers.set(
      "Content-Range",
      `bytes ${object.range.offset}-${object.range.offset + object.range.length - 1}/${object.size}`
    );
    return new Response(object.body, { status: 206, headers });
  }

  return new Response(object.body, { headers });
}

async function sign(secret) {
  const enc = new TextEncoder().encode(secret);
  const hash = await crypto.subtle.digest("SHA-256", enc);
  return btoa(String.fromCharCode(...new Uint8Array(hash))).replace(/[^a-zA-Z0-9]/g, "");
}

function parseRange(rangeHeader) {
  const match = /bytes=(\d+)-(\d*)/.exec(rangeHeader);
  if (!match) return undefined;
  const offset = parseInt(match[1], 10);
  const end = match[2] ? parseInt(match[2], 10) : undefined;
  return end ? { offset, length: end - offset + 1 } : { offset };
}
