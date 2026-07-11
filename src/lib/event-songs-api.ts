import { supabase } from "@/lib/supabase";
import type { CreateEventSongInput, EventSong } from "@/data/wedding-types";

type EventSongRow = {
  id: string;
  timeline_event_id: string;
  moment: string;
  song_name: string;
  artist: string | null;
  link: string | null;
  order_index: number;
};

function mapEventSong(row: EventSongRow): EventSong {
  return {
    id: row.id,
    timelineEventId: row.timeline_event_id,
    moment: row.moment,
    songName: row.song_name,
    artist: row.artist ?? undefined,
    link: row.link ?? undefined,
    orderIndex: row.order_index,
  };
}

export async function fetchEventSongs(timelineEventId: string): Promise<EventSong[]> {
  const { data, error } = await supabase
    .from("event_songs")
    .select("*")
    .eq("timeline_event_id", timelineEventId)
    .order("order_index", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => mapEventSong(row as EventSongRow));
}

export async function insertEventSong(
  timelineEventId: string,
  input: CreateEventSongInput,
): Promise<EventSong> {
  const existing = await fetchEventSongs(timelineEventId);
  const sameMoment = existing.filter((s) => s.moment === input.moment.trim());
  const orderIndex =
    sameMoment.length > 0
      ? Math.max(...sameMoment.map((s) => s.orderIndex)) + 1
      : existing.length > 0
        ? Math.max(...existing.map((s) => s.orderIndex)) + 1
        : 0;

  const { data, error } = await supabase
    .from("event_songs")
    .insert({
      timeline_event_id: timelineEventId,
      moment: input.moment.trim(),
      song_name: input.songName.trim(),
      artist: input.artist?.trim() || null,
      link: input.link?.trim() || null,
      order_index: orderIndex,
    })
    .select()
    .single();

  if (error) throw error;
  return mapEventSong(data as EventSongRow);
}

export async function deleteEventSong(id: string): Promise<void> {
  const { error } = await supabase.from("event_songs").delete().eq("id", id);
  if (error) throw error;
}

/** Swap order_index with the adjacent song in the same moment (direction: -1 up, +1 down). */
export async function reorderEventSong(
  timelineEventId: string,
  songId: string,
  direction: -1 | 1,
): Promise<void> {
  const songs = await fetchEventSongs(timelineEventId);
  const song = songs.find((s) => s.id === songId);
  if (!song) return;

  const siblings = songs
    .filter((s) => s.moment === song.moment)
    .sort((a, b) => a.orderIndex - b.orderIndex || a.id.localeCompare(b.id));
  const index = siblings.findIndex((s) => s.id === songId);
  const swapWith = siblings[index + direction];
  if (!swapWith) return;

  const a = song.orderIndex;
  const b = swapWith.orderIndex;
  // If indices collide, force distinct values from sibling positions
  const nextA = a === b ? index + direction : b;
  const nextB = a === b ? index : a;

  const { error: err1 } = await supabase
    .from("event_songs")
    .update({ order_index: nextA })
    .eq("id", song.id);
  if (err1) throw err1;

  const { error: err2 } = await supabase
    .from("event_songs")
    .update({ order_index: nextB })
    .eq("id", swapWith.id);
  if (err2) throw err2;
}

/** Group songs by moment, preserving first-seen moment order from sorted list. */
export function groupSongsByMoment(songs: EventSong[]): { moment: string; songs: EventSong[] }[] {
  const map = new Map<string, EventSong[]>();
  for (const song of songs) {
    const list = map.get(song.moment) ?? [];
    list.push(song);
    map.set(song.moment, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.orderIndex - b.orderIndex || a.id.localeCompare(b.id));
  }
  return [...map.entries()].map(([moment, groupSongs]) => ({ moment, songs: groupSongs }));
}
