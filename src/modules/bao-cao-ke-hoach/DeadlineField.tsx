import { DetailField } from '@/components/ui/Sections';
import { SUBMIT_COLOR, SUBMIT_LABEL, deadlineOf, lateBy, submitState, useDeadlines, type DocKind } from './deadlines';
import type { WorkflowDoc } from './workflowData';

/** Ô "Hạn nộp" trong trang chi tiết: thời hạn của kỳ + đúng hạn / nộp muộn / quá hạn. */
export function DeadlineField({ kind, doc }: { kind: DocKind; doc: WorkflowDoc<unknown> }) {
  const { find } = useDeadlines();
  const deadline = deadlineOf(find(kind, doc.loai_ky), doc);
  if (!deadline) return <DetailField label="Hạn nộp" value="" emptyText="Chưa thiết lập" />;
  const state = submitState(doc, deadline);
  const late = lateBy(doc.tg_gui, deadline);
  return (
    <DetailField
      label="Hạn nộp"
      value={
        <span className="flex flex-wrap items-center gap-2">
          <span className="tabular-nums">{deadline.format('HH:mm - DD/MM/YYYY')}</span>
          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${SUBMIT_COLOR[state]}`}>{SUBMIT_LABEL[state]}</span>
          {late ? <span className="text-xs text-amber-600">({late})</span> : null}
        </span>
      }
    />
  );
}
