import { supabase } from "@/lib/supabase";

export type PhotoAlbum = {
  id: string;
  weddingId: string;
  accessToken: string;
  name: string;
  photoCount: number;
  createdAt: string;
};

export type PhotoUpload = {
  id: string;
  albumId: string;
  storagePath: string;
  uploaderName?: string;
  uploaderSessionId?: string;
  createdAt: string;
};

export type GuestMyUpload = {
  id: string;
  deleteToken: string;
  storagePath: string;
  uploadedAt: string;
};

export type UploaderGroup = {
  key: string;
  label: string;
  photoCount: number;
  photos: PhotoUpload[];
};

type AlbumRow = {
  id: string;
  wedding_id: string;
  access_token: string;
  name: string | null;
  created_at: string;
  photo_uploads?: { count: number }[] | null;
};

type UploadRow = {
  id: string;
  album_id: string;
  storage_path: string;
  uploader_name: string | null;
  uploader_session_id: string | null;
  created_at: string;
};

function mapAlbum(row: AlbumRow): PhotoAlbum {
  const count = row.photo_uploads?.[0]?.count;
  return {
    id: row.id,
    weddingId: row.wedding_id,
    accessToken: row.access_token,
    name: row.name?.trim() || "Wedding Photos",
    photoCount: typeof count === "number" ? count : 0,
    createdAt: row.created_at,
  };
}

function mapUpload(row: UploadRow): PhotoUpload {
  return {
    id: row.id,
    albumId: row.album_id,
    storagePath: row.storage_path,
    uploaderName: row.uploader_name ?? undefined,
    uploaderSessionId: row.uploader_session_id ?? undefined,
    createdAt: row.created_at,
  };
}

function myUploadsKey(token: string): string {
  return `album-${token}-my-uploads`;
}

function sessionKey(token: string): string {
  return `album-${token}-session-id`;
}

/** One ongoing session per album+browser — same guest stays one group across visits. */
export function getOrCreateSessionId(token: string): string {
  if (typeof window === "undefined") return crypto.randomUUID();
  const key = sessionKey(token);
  let sessionId = localStorage.getItem(key);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(key, sessionId);
  }
  return sessionId;
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

function formatUploadLabel(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** Group host gallery by persistent browser session (ongoing, not per-visit). */
export function groupByUploader(uploads: PhotoUpload[]): UploaderGroup[] {
  const groups = new Map<string, PhotoUpload[]>();
  for (const upload of uploads) {
    const key = upload.uploaderSessionId ?? `no-session-${upload.id}`;
    const list = groups.get(key) ?? [];
    list.push(upload);
    groups.set(key, list);
  }

  return Array.from(groups.entries())
    .map(([key, photos]) => {
      const sorted = [...photos].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      const named = sorted.find((p) => p.uploaderName?.trim())?.uploaderName?.trim();
      const oldest = sorted[sorted.length - 1] ?? sorted[0];
      return {
        key,
        label: named || `Uploaded ${formatUploadLabel(oldest.createdAt)}`,
        photoCount: sorted.length,
        photos: sorted,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.photos[0]?.createdAt ?? 0).getTime() -
        new Date(a.photos[0]?.createdAt ?? 0).getTime(),
    );
}

const ALBUM_SELECT =
  "id, wedding_id, access_token, name, created_at, photo_uploads(count)";

/** List all albums for a wedding (creates a default if none exist). */
export async function fetchWeddingAlbums(weddingId: string): Promise<PhotoAlbum[]> {
  const { data, error } = await supabase
    .from("photo_albums")
    .select(ALBUM_SELECT)
    .eq("wedding_id", weddingId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  const albums = (data ?? []).map((row) => mapAlbum(row as AlbumRow));
  if (albums.length > 0) return albums;
  return [await createPhotoAlbum(weddingId, "Wedding Photos")];
}

export async function createPhotoAlbum(
  weddingId: string,
  name: string,
): Promise<PhotoAlbum> {
  const trimmed = name.trim() || "Wedding Photos";
  const { data, error } = await supabase
    .from("photo_albums")
    .insert({ wedding_id: weddingId, name: trimmed })
    .select(ALBUM_SELECT)
    .single();

  if (error) throw error;
  return mapAlbum(data as AlbumRow);
}

/** @deprecated Prefer fetchWeddingAlbums — kept for call sites that want a single album. */
export async function ensurePhotoAlbum(weddingId: string): Promise<PhotoAlbum> {
  const albums = await fetchWeddingAlbums(weddingId);
  return albums[0]!;
}

/** Host gallery — never selects delete_token (column revoked + explicit list). */
export async function fetchAlbumUploads(albumId: string): Promise<PhotoUpload[]> {
  const { data, error } = await supabase
    .from("photo_uploads")
    .select("id, album_id, storage_path, uploader_name, uploader_session_id, created_at")
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

/**
 * Delete an upload row. Removes the Storage object only when no other
 * photo_uploads row still references the same storage_path (shared copies).
 */
export async function deletePhotoUpload(upload: PhotoUpload): Promise<void> {
  const { error } = await supabase.from("photo_uploads").delete().eq("id", upload.id);
  if (error) throw error;

  const { count, error: countError } = await supabase
    .from("photo_uploads")
    .select("id", { count: "exact", head: true })
    .eq("storage_path", upload.storagePath);
  if (countError) throw countError;

  if ((count ?? 0) === 0) {
    const { error: storageError } = await supabase.storage
      .from("wedding-photos")
      .remove([upload.storagePath]);
    if (storageError) throw storageError;
  }
}

export async function movePhoto(photoId: string, newAlbumId: string): Promise<void> {
  const { error } = await supabase
    .from("photo_uploads")
    .update({ album_id: newAlbumId })
    .eq("id", photoId);
  if (error) throw error;
}

export async function copyPhoto(photo: PhotoUpload, newAlbumId: string): Promise<void> {
  const { error } = await supabase.from("photo_uploads").insert({
    album_id: newAlbumId,
    storage_path: photo.storagePath,
    uploader_name: photo.uploaderName ?? null,
    uploader_session_id: photo.uploaderSessionId ?? null,
  });
  if (error) throw error;
}

export async function movePhotos(photos: PhotoUpload[], newAlbumId: string): Promise<void> {
  await Promise.all(photos.map((p) => movePhoto(p.id, newAlbumId)));
}

export async function copyPhotos(photos: PhotoUpload[], newAlbumId: string): Promise<void> {
  await Promise.all(photos.map((p) => copyPhoto(p, newAlbumId)));
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
  sessionId?: string;
}): Promise<GuestUploadResult> {
  const ext = input.file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = ["jpg", "jpeg", "png", "webp", "heic", "heif"].includes(ext) ? ext : "jpg";
  const storagePath = `guest/${input.token}/${crypto.randomUUID()}.${safeExt}`;
  const sessionId = input.sessionId ?? getOrCreateSessionId(input.token);

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
    p_session_id: sessionId,
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

/** True while the upload row still exists (host may have deleted it). */
export async function checkStillExists(input: {
  uploadId: string;
  deleteToken: string;
}): Promise<boolean> {
  const { data, error } = await supabase.rpc("photo_still_exists_via_token", {
    p_upload_id: input.uploadId,
    p_delete_token: input.deleteToken,
  });

  if (error) throw error;
  return data === true;
}

/**
 * Guest delete via ownership token.
 * Uses an edge function so Storage API removes the file only when no other
 * photo_uploads row still references the same storage_path.
 */
export async function deleteGuestPhoto(input: {
  uploadId: string;
  deleteToken: string;
}): Promise<boolean> {
  const { data, error } = await supabase.functions.invoke("delete-photo-via-token", {
    body: {
      uploadId: input.uploadId,
      deleteToken: input.deleteToken,
    },
  });

  if (error) throw error;
  if (data && typeof data === "object" && "error" in data && data.error) {
    throw new Error(String(data.error));
  }
  return data?.ok === true;
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
