import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const uploadId = typeof body.uploadId === "string" ? body.uploadId.trim() : "";
    const deleteToken = typeof body.deleteToken === "string" ? body.deleteToken.trim() : "";

    if (!UUID_RE.test(uploadId) || !UUID_RE.test(deleteToken)) {
      return new Response(JSON.stringify({ ok: false, error: "Invalid identifiers" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service role: Storage API deletes S3 + catalog (SQL DELETE on storage.objects is blocked).
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { data: row, error: lookupError } = await admin
      .from("photo_uploads")
      .select("id, storage_path")
      .eq("id", uploadId)
      .eq("delete_token", deleteToken)
      .maybeSingle();

    if (lookupError) throw lookupError;
    if (!row?.storage_path) {
      return new Response(JSON.stringify({ ok: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: storageError } = await admin.storage
      .from("wedding-photos")
      .remove([row.storage_path as string]);
    if (storageError) throw storageError;

    const { error: dbError } = await admin
      .from("photo_uploads")
      .delete()
      .eq("id", uploadId)
      .eq("delete_token", deleteToken);
    if (dbError) throw dbError;

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("delete-photo-via-token error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Could not delete photo",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
