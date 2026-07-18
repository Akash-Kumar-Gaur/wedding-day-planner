export const weddingQueryKeys = {
  meta: (userId: string) => ["wedding-meta", userId] as const,
  vendors: (weddingId: string) => ["vendors", weddingId] as const,
  guestGroups: (weddingId: string) => ["guest-groups", weddingId] as const,
  guests: (weddingId: string) => ["guests", weddingId] as const,
  timelineEvents: (weddingId: string) => ["timeline-events", weddingId] as const,
  budgetCategories: (weddingId: string) => ["budget-categories", weddingId] as const,
  planningTasks: (weddingId: string) => ["planning-tasks", weddingId] as const,
  pendingSuggestions: (weddingId: string) => ["pending-suggestions", weddingId] as const,
  transactions: (weddingId: string) => ["transactions", weddingId] as const,
  collaborators: (weddingId: string) => ["collaborators", weddingId] as const,
  eventSongs: (timelineEventId: string) => ["event-songs", timelineEventId] as const,
  outfitPlans: (weddingId: string) => ["outfit-plans", weddingId] as const,
  gifts: (weddingId: string) => ["gifts", weddingId] as const,
  photoAlbum: (weddingId: string) => ["photo-album", weddingId] as const,
  photoUploads: (albumId: string) => ["photo-uploads", albumId] as const,
  emergencyContacts: (weddingId: string) => ["emergency-contacts", weddingId] as const,
};

export const realtimeTableQueryKey = {
  vendors: weddingQueryKeys.vendors,
  guests: weddingQueryKeys.guests,
  timeline_events: weddingQueryKeys.timelineEvents,
  budget_categories: weddingQueryKeys.budgetCategories,
  transactions: weddingQueryKeys.transactions,
} as const;
