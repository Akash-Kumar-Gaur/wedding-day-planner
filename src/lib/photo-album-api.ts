import { supabase } from "@/lib/supabase";

export type PhotoAlbum = {
  id: string;
  weddingId: string;
  accessToken: string;
};

export type PhotoUpload = {
  id: string;
  albumId: string;
  storagePath: string;
  uploaderName?: string;
  createdAt: string;
};

type AlbumRow = {
  id: string;
  wedding_id: string;
  access_token: string;
};

type UploadRow = {
  id: string;
  album_id: string;
  storage_path: string;
  uploader_name: string | null;
  created_at: string;
};

function mapAlbum(row: AlbumRow): PhotoAlbum {
  return {
    id: row.id,
    weddingId: row.wedding_id,
    accessToken: row.access_token,
  };
}

function mapUpload(row: UploadRow): PhotoUpload {
  return {
    id: row.id,
    albumId: row.album_id,
    storagePath: row.storage_path,
    uploaderName: row.uploader_name ?? undefined,
    createdAt: row.created_at,
  };
}

export async function ensurePhotoAlbum(weddingId: string): Promise<PhotoAlbum> {
  const { data: existing, error: fetchError } = await supabase
    .from("photo_albums")
    .select("*")
    .eq("wedding_id", weddingId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (existing) return mapAlbum(existing as AlbumRow);

  const { data, error } = await supabase
    .from("photo_albums")
    .insert({ wedding_id: weddingId })
    .select()
    .single();

  if (error) throw error;
  return mapAlbum(data as AlbumRow);
}

export async function fetchAlbumUploads(albumId: string): Promise<PhotoUpload[]> {
  const { data, error } = await supabase
    .from("photo_uploads")
    .select("*")
    .eq("album_id", albumId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapUpload(row as UploadRow));
}

export async function getSignedPhotoUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from("wedding-photos")
    .createSignedUrl(storagePath, 60 * 60);

  if (error) throw error;
  return data.signedUrl;
}

export async function deletePhotoUpload(upload: PhotoUpload): Promise<void> {
  const { error: storageError } = await supabase.storage
    .from("wedding-photos")
    .remove([upload.storagePath]);
  if (storageError) throw storageError;

  const { error } = await supabase.from("photo_uploads").delete().eq("id", upload.id);
  if (error) throw error;
}

/** Guest upload path — no auth session required (anon key). */
export async function uploadGuestPhoto(input: {
  token: string;
  file: File;
  uploaderName?: string;
}): Promise<string> {
  const ext = input.file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = ["jpg", "jpeg", "png", "webp", "heic", "heif"].includes(ext) ? ext : "jpg";
  // Must match upload_photo_via_token path check: guest/<token>/...
  const storagePath = `guest/${input.token}/${crypto.randomUUID()}.${safeExt}`;

  const { error: uploadError } = await supabase.storage
    .from("wedding-photos")
    .upload(storagePath, input.file, {
      contentType: input.file.type || `image/${safeExt}`,
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data, error } = await supabase.rpc("upload_photo_via_token", {
    p_token: input.token,
    p_storage_path: storagePath,
    p_uploader_name: input.uploaderName?.trim() || null,
  });

  if (error) {
    await supabase.storage.from("wedding-photos").remove([storagePath]);
    throw error;
  }

  return data as string;
}

/** Public token validation + couple names for the guest upload page. */
export async function fetchGuestAlbumInfo(
  token: string,
): Promise<{ coupleNames: string } | null> {
  const { data, error } = await supabase.rpc("get_guest_album_info", {
    p_token: token,
  });

  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.couple_names) return null;
  return { coupleNames: row.couple_names as string };
}

export function albumGuestUrl(accessToken: string, origin = typeof window !== "undefined" ? window.location.origin : ""): string {
  return `${origin}/album/${accessToken}`;
}
