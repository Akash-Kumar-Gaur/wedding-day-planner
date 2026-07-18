import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, prefer",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const CHUNK_SIZE = 100;

/** Must match DEV_EMAILS on the web app — only these accounts may invoke via user JWT. */
const DEV_EMAILS = ["ak45hhh@gmail.com"];

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isServiceRoleRequest(req: Request): boolean {
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!serviceKey) return false;
  const auth = req.headers.get("Authorization") ?? "";
  const apikey = req.headers.get("apikey") ?? "";
  return auth === `Bearer ${serviceKey}` || apikey === serviceKey;
}

async function isDevUserRequest(req: Request): Promise<boolean> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return false;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email?.trim().toLowerCase() ?? "";
  return Boolean(email && DEV_EMAILS.includes(email));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const serviceOk = isServiceRoleRequest(req);
  const devOk = serviceOk ? false : await isDevUserRequest(req);
  if (!serviceOk && !devOk) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  try {
    const body = await req.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const message = typeof body.body === "string" ? body.body.trim() : "";

    if (!title || !message) {
      return jsonResponse({ error: "title and body are required" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: tokens, error } = await supabase
      .from("device_push_tokens")
      .select("push_token");

    if (error) {
      console.error("device_push_tokens select failed:", error);
      return jsonResponse({ error: "Failed to load tokens" }, 500);
    }

    if (!tokens?.length) {
      return jsonResponse({ sent: 0 });
    }

    const uniqueTokens = [...new Set(tokens.map((t) => t.push_token).filter(Boolean))];
    const messages = uniqueTokens.map((to) => ({ to, title, body: message }));

    let sent = 0;
    const errors: string[] = [];

    for (let i = 0; i < messages.length; i += CHUNK_SIZE) {
      const chunk = messages.slice(i, i + CHUNK_SIZE);
      const res = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chunk),
      });

      if (!res.ok) {
        const detail = await res.text();
        console.error("Expo push error:", detail);
        errors.push(detail);
        continue;
      }

      sent += chunk.length;
    }

    return jsonResponse({
      sent,
      total: uniqueTokens.length,
      ...(errors.length ? { errors } : {}),
    });
  } catch (err) {
    console.error(err);
    return jsonResponse({ error: "Unexpected error" }, 500);
  }
});
