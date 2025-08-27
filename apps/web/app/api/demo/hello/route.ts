export async function POST(request: Request): Promise<Response> {
  try {
    const payload = await request.json().catch(() => ({}));
    const webhookUrl = process.env.N8N_WEBHOOK_URL || process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;

    if (!webhookUrl) {
      return new Response(JSON.stringify({ error: "N8N_WEBHOOK_URL (or NEXT_PUBLIC_N8N_WEBHOOK_URL) is not set" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload ?? {}),
      // Do not use Next.js fetch caching for webhooks
      cache: "no-store",
    });

    return new Response(
      JSON.stringify({ ok: res.ok, status: res.status }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    return new Response(
      JSON.stringify({ error: (error as Error)?.message ?? "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}


