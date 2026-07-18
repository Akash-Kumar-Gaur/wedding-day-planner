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

export type GuestMyUpload = {
  id: string;
  deleteToken: string;
  storagePath: string;
  uploadedAt: string;
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

function myUploadsKey(token: string): string {
  return `album-${token}-my-uploads`;
}

export function loadMyUploads(token: string): GuestMyUpload[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(myUploadsKey(token));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as GuestMyUpload[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveMyUpload(
  token: string,
  upload: { id: string; deleteToken: string; storagePath: string },
): GuestMyUpload[] {
  const next: GuestMyUpload[] = [
    ...loadMyUploads(token),
    { ...upload, uploadedAt: new Date().toISOString() },
  ];
  localStorage.setItem(myUploadsKey(token), JSON.stringify(next));
  return next;
}

export function removeMyUpload(token: string, uploadId: string): GuestMyUpload[] {
  const next = loadMyUploads(token).filter((u) => u.id !== uploadId);
  localStorage.setItem(myUploadsKey(token), JSON.stringify(next));
  return next;
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

/** Host gallery — never selects delete_token (column revoked + explicit list). */
export async function fetchAlbumUploads(albumId: string): Promise<PhotoUpload[]> {
  const { data, error } = await supabase
    .from("photo_uploads")
    .select("id, album_id, storage_path, uploader_name, created_at")
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

export type GuestUploadResult = {
  id: string;
  deleteToken: string;
  storagePath: string;
};

/** Guest upload path — no auth session required (anon key). Returns delete token once. */
export async function uploadGuestPhoto(input: {
  token: string;
  file: File;
  uploaderName?: string;
}): Promise<GuestUploadResult> {
  const ext = input.file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = ["jpg", "jpeg", "png", "webp", "heic", "heif"].includes(ext) ? ext : "jpg";
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

  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.id || !row?.delete_token) {
    await supabase.storage.from("wedding-photos").remove([storagePath]);
    throw new Error("Upload registered without a delete token");
  }

  return {
    id: row.id as string,
    deleteToken: row.delete_token as string,
    storagePath,
  };
}

/** Guest delete via ownership token; RPC also removes the Storage object. */
export async function deleteGuestPhoto(input: {
  uploadId: string;
  deleteToken: string;
}): Promise<boolean> {
  const { data, error } = await supabase.rpc("delete_photo_via_token", {
    p_upload_id: input.uploadId,
    p_delete_token: input.deleteToken,
  });

  if (error) throw error;
  return data === true;
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

export function albumGuestUrl(
  accessToken: string,
  origin = typeof window !== "undefined" ? window.location.origin : "",
): string {
  return `${origin}/album/${accessToken}`;
}
