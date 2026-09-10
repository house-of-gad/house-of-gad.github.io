export async function onRequestGet({ params, env }) {
  const key = `img/${params.filename}`;
  const object = await env.VIDEO_BUCKET.get(key);

  if (!object) return new Response("No encontrado", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("Cache-Control", "public, max-age=86400");

  return new Response(object.body, { headers });
}
