export async function onRequestPost({ request, env }) {
  const { password } = await request.json();

  if (password !== env.SITE_PASSWORD) {
    // DEBUG TEMPORAL — no expone la contraseña, solo longitudes y si hay espacios
    return new Response(JSON.stringify({
      ok: false,
      debug: {
        recibida_longitud: password.length,
        guardada_longitud: env.SITE_PASSWORD ? env.SITE_PASSWORD.length : null,
        guardada_existe: !!env.SITE_PASSWORD,
        recibida_tiene_espacios: password !== password.trim(),
        guardada_tiene_espacios: env.SITE_PASSWORD ? env.SITE_PASSWORD !== env.SITE_PASSWORD.trim() : null,
      }
    }), { status: 401 });
  }

  const token = await sign(env.SITE_PASSWORD);
  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      "Set-Cookie": `session=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`,
      "Content-Type": "application/json",
    },
  });
}

async function sign(secret) {
  const enc = new TextEncoder().encode(secret);
  const hash = await crypto.subtle.digest("SHA-256", enc);
  return btoa(String.fromCharCode(...new Uint8Array(hash))).replace(/[^a-zA-Z0-9]/g, "");
}
