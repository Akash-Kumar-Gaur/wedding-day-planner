import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink, Music, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EventSong } from "@/data/wedding-types";
import { SONG_MOMENT_PRESETS } from "@/data/wedding-types";
import {
  deleteEventSong,
  fetchEventSongs,
  groupSongsByMoment,
  insertEventSong,
  reorderEventSong,
} from "@/lib/event-songs-api";
import { weddingQueryKeys } from "@/lib/wedding-query-keys";
import { cn } from "@/lib/utils";

const CUSTOM_MOMENT = "__custom__";

export function EventSongsSection({ timelineEventId }: { timelineEventId: string }) {
  const queryClient = useQueryClient();
  const songsQuery = useQuery({
    queryKey: weddingQueryKeys.eventSongs(timelineEventId),
    queryFn: () => fetchEventSongs(timelineEventId),
    enabled: !!timelineEventId,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [momentPreset, setMomentPreset] = useState<string>(SONG_MOMENT_PRESETS[0]);
  const [customMoment, setCustomMoment] = useState("");
  const [songName, setSongName] = useState("");
  const [artist, setArtist] = useState("");
  const [link, setLink] = useState("");
  const [error, setError] = useState<string | null>(null);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: weddingQueryKeys.eventSongs(timelineEventId) });

  const createMutation = useMutation({
    mutationFn: (input: { moment: string; songName: string; artist?: string; link?: string }) =>
      insertEventSong(timelineEventId, input),
    onSuccess: () => invalidate(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEventSong(id),
    onSuccess: () => invalidate(),
  });

  const reorderMutation = useMutation({
    mutationFn: ({ id, direction }: { id: string; direction: -1 | 1 }) =>
      reorderEventSong(timelineEventId, id, direction),
    onSuccess: () => invalidate(),
  });

  const grouped = useMemo(
    () => groupSongsByMoment(songsQuery.data ?? []),
    [songsQuery.data],
  );

  const resetForm = () => {
    setMomentPreset(SONG_MOMENT_PRESETS[0]);
    setCustomMoment("");
    setSongName("");
    setArtist("");
    setLink("");
    setError(null);
  };

  const handleAdd = async () => {
    const moment =
      momentPreset === CUSTOM_MOMENT ? customMoment.trim() : momentPreset.trim();
    if (!moment) {
      setError("Choose or enter a moment");
      return;
    }
    if (!songName.trim()) {
      setError("Song name is required");
      return;
    }
    setError(null);
    try {
      await createMutation.mutateAsync({
        moment,
        songName: songName.trim(),
        artist: artist.trim() || undefined,
        link: link.trim() || undefined,
      });
      resetForm();
      setFormOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add song");
    }
  };

  return (
    <section className="space-y-3 border-t border-border pt-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
          <Music className="h-3.5 w-3.5 text-muted-foreground" />
          Songs
        </h3>
        {!formOpen ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1 px-2 text-xs text-primary"
            onClick={() => setFormOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Add song
          </Button>
        ) : null}
      </div>

      {songsQuery.isPending ? (
        <p className="text-xs text-muted-foreground">Loading songs…</p>
      ) : grouped.length === 0 && !formOpen ? (
        <p className="text-xs text-muted-foreground">
          No songs yet — add entry music, performances, or dance tracks for this event.
        </p>
      ) : (
        <ul className="space-y-4">
          {grouped.map(({ moment, songs }) => (
            <li key={moment} className="space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                {moment}
              </p>
              <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                {songs.map((song, index) => (
                  <SongRow
                    key={song.id}
                    song={song}
                    canMoveUp={index > 0}
                    canMoveDown={index < songs.length - 1}
                    busy={deleteMutation.isPending || reorderMutation.isPending}
                    onMoveUp={() => reorderMutation.mutate({ id: song.id, direction: -1 })}
                    onMoveDown={() => reorderMutation.mutate({ id: song.id, direction: 1 })}
                    onDelete={() => deleteMutation.mutate(song.id)}
                  />
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}

      {formOpen ? (
        <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-3">
          <div className="space-y-2">
            <Label>Moment</Label>
            <Select value={momentPreset} onValueChange={setMomentPreset}>
              <SelectTrigger>
                <SelectValue placeholder="Select moment" />
              </SelectTrigger>
              <SelectContent>
                {SONG_MOMENT_PRESETS.map((preset) => (
                  <SelectItem key={preset} value={preset}>
                    {preset}
                  </SelectItem>
                ))}
                <SelectItem value={CUSTOM_MOMENT}>Custom…</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {momentPreset === CUSTOM_MOMENT ? (
            <div className="space-y-2">
              <Label htmlFor="custom-moment">Custom moment</Label>
              <Input
                id="custom-moment"
                value={customMoment}
                onChange={(e) => setCustomMoment(e.target.value)}
                placeholder="e.g. Cake cutting"
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="song-name">Song name *</Label>
            <Input
              id="song-name"
              value={songName}
              onChange={(e) => setSongName(e.target.value)}
              placeholder="Song title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="song-artist">Artist</Label>
            <Input
              id="song-artist"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Optional"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="song-link">Link</Label>
            <Input
              id="song-link"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="Spotify / YouTube URL (optional)"
              inputMode="url"
            />
          </div>

          {error ? <p className="text-sm text-[color:var(--destructive)]">{error}</p> : null}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              disabled={createMutation.isPending}
              onClick={() => {
                resetForm();
                setFormOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="flex-1"
              disabled={createMutation.isPending}
              onClick={() => void handleAdd()}
            >
              {createMutation.isPending ? "Adding…" : "Add song"}
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function SongRow({
  song,
  canMoveUp,
  canMoveDown,
  busy,
  onMoveUp,
  onMoveDown,
  onDelete,
}: {
  song: EventSong;
  canMoveUp: boolean;
  canMoveDown: boolean;
  busy: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="flex items-start gap-2 bg-card px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="font-normal">
            {song.moment}
          </Badge>
          {song.link ? (
            <a
              href={song.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex text-muted-foreground transition-colors hover:text-primary"
              aria-label={`Open link for ${song.songName}`}
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : null}
        </div>
        <p className="mt-1 truncate text-sm font-medium text-foreground">{song.songName}</p>
        {song.artist ? (
          <p className="truncate text-xs text-muted-foreground">{song.artist}</p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          className={cn(
            "rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            (!canMoveUp || busy) && "pointer-events-none opacity-30",
          )}
          disabled={!canMoveUp || busy}
          onClick={onMoveUp}
          aria-label="Move song up"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={cn(
            "rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            (!canMoveDown || busy) && "pointer-events-none opacity-30",
          )}
          disabled={!canMoveDown || busy}
          onClick={onMoveDown}
          aria-label="Move song down"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={cn(
            "rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            busy && "pointer-events-none opacity-30",
          )}
          disabled={busy}
          onClick={onDelete}
          aria-label={`Remove ${song.songName}`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}
