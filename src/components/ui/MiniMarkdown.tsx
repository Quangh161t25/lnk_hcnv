import { Fragment, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Định dạng trong dòng: **đậm**, *nghiêng* / _nghiêng_, `mã`. Dựng phần tử React — không dùng innerHTML. */
function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|`([^`]+)`|(?<![\w*])\*(?!\s)(.+?)\*(?!\w)|(?<!\w)_(?!\s)(.+?)_(?!\w)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const k = out.length;
    if (m[1] != null) out.push(<strong key={k} className="font-semibold">{inline(m[1])}</strong>);
    else if (m[2] != null) out.push(<code key={k} className="px-1 py-0.5 rounded bg-muted text-[0.85em]">{m[2]}</code>);
    else out.push(<em key={k} className="text-muted-foreground">{m[3] ?? m[4]}</em>);
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const splitRow = (line: string) =>
  line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim());

type Block = { kind: 'p'; lines: string[] } | { kind: 'list'; ordered: boolean; items: string[] } | { kind: 'table'; head: string[]; rows: string[][] } | { kind: 'h'; text: string };

function parse(src: string): Block[] {
  const blocks: Block[] = [];
  const lines = src.replace(/\r/g, '').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const t = line.trim();
    if (!t) continue;
    if (t.startsWith('|') && lines[i + 1]?.trim().match(/^\|?\s*:?-{2,}/)) {
      const head = splitRow(t);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i].trim().startsWith('|')) rows.push(splitRow(lines[i++]));
      i--;
      blocks.push({ kind: 'table', head, rows });
      continue;
    }
    const h = t.match(/^#{1,4}\s+(.*)$/);
    if (h) {
      blocks.push({ kind: 'h', text: h[1] });
      continue;
    }
    const ul = t.match(/^[-*•]\s+(.*)$/);
    const ol = t.match(/^\d+[.)]\s+(.*)$/);
    if (ul || ol) {
      const ordered = !ul;
      const prev = blocks[blocks.length - 1];
      const item = (ul ?? ol)![1];
      if (prev?.kind === 'list' && prev.ordered === ordered) prev.items.push(item);
      else blocks.push({ kind: 'list', ordered, items: [item] });
      continue;
    }
    const prev = blocks[blocks.length - 1];
    if (prev?.kind === 'p' && lines[i - 1]?.trim()) prev.lines.push(t);
    else blocks.push({ kind: 'p', lines: [t] });
  }
  return blocks;
}

/** Hiển thị markdown đơn giản (đoạn, tiêu đề, danh sách, bảng) cho câu trả lời của Trợ lý AI. */
export function MiniMarkdown({ text, className }: { text: string; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {parse(text).map((b, i) => {
        if (b.kind === 'h') return <p key={i} className="font-semibold">{inline(b.text)}</p>;
        if (b.kind === 'p')
          return (
            <p key={i}>
              {b.lines.map((l, j) => (
                <Fragment key={j}>
                  {j > 0 && <br />}
                  {inline(l)}
                </Fragment>
              ))}
            </p>
          );
        if (b.kind === 'list') {
          const List = b.ordered ? 'ol' : 'ul';
          return (
            <List key={i} className={cn('pl-5 space-y-1', b.ordered ? 'list-decimal' : 'list-disc')}>
              {b.items.map((it, j) => (
                <li key={j}>{inline(it)}</li>
              ))}
            </List>
          );
        }
        return (
          <div key={i} className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-xs">
              <thead className="bg-muted/60">
                <tr>
                  {b.head.map((c, j) => (
                    <th key={j} className="px-2.5 py-1.5 text-left font-semibold whitespace-nowrap">
                      {inline(c)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {b.rows.map((r, j) => (
                  <tr key={j} className="border-t border-border/70">
                    {r.map((c, k) => (
                      <td key={k} className="px-2.5 py-1.5 align-top">
                        {inline(c)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
