const MAP: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escapa texto para insertarlo de forma segura en HTML. */
export const esc = (t: unknown): string => String(t ?? '').replace(/[&<>"']/g, (c) => MAP[c]);

/** "a, b ,c" → ["a","b","c"] */
export const splitTags = (t: string | null | undefined): string[] =>
  (t ?? '').split(',').map((s) => s.trim()).filter(Boolean);

export const isVideo = (path: string | null | undefined) => /\.(mp4|webm)$/i.test(path ?? '');
