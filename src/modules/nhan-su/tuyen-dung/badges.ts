/** Lớp CSS cơ bản của nhãn tròn (badge). */
export const BADGE = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border';

const PALETTE = [
  'bg-primary/10 text-primary border-primary/20',
  'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
  'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
  'bg-muted/80 text-muted-foreground border-border',
];

function hash(value: string) {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h << 5) - h + value.charCodeAt(i);
  return Math.abs(h);
}

/** Màu nhãn trạng thái ứng viên: băm theo id trạng thái (giống bản gốc nên màu ổn định). */
export function statusBadgeColor(id?: string | null) {
  if (!id) return PALETTE[5];
  return PALETTE[hash(id) % (PALETTE.length - 1)];
}

/** Màu nhãn nguồn tuyển dụng. */
export function sourceBadgeColor(id?: string | null) {
  if (!id) return PALETTE[5];
  return PALETTE[hash('nguon-' + id) % (PALETTE.length - 1)];
}
