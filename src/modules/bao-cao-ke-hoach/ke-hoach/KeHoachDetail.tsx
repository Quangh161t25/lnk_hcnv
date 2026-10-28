import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarRange, CircleCheck, FileDown, ListChecks, Send, ShieldCheck, Target, Undo2, X } from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/format';
import { exportToExcel } from '@/lib/export';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { Drawer, DRAWER_WIDTH } from '@/components/ui/Drawer';
import { DetailField, DetailFooter, DetailSection, QuickActions, TableSection, subTh, type QuickAction } from '@/components/ui/Sections';
import { DeadlineField } from '../DeadlineField';
import { LOAI_LABEL, periodLabel, statusColor, statusLabel, useEmployeeName, usePlanAction, type Me, type Plan } from './data';

export function PlanStatusBadge({ status, className = '' }: { status: string; className?: string }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${statusColor(status)} ${className}`}>{statusLabel(status)}</span>;
}

const PRIORITY_COLOR: Record<string, string> = {
  Cao: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
  'Trung bình': 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  Thấp: 'bg-muted text-muted-foreground border-border',
};

/** Hộp thoại nhập ý kiến khi duyệt / trả lại. */
export function CommentModal({ open, title, required, confirmLabel, isPending, onClose, onSubmit }: { open: boolean; title: string; required: boolean; confirmLabel: string; isPending: boolean; onClose: () => void; onSubmit: (c: string) => void }) {
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50" onClick={() => !isPending && onClose()}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-card rounded-xl border border-border shadow-xl max-w-md w-full p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">{title}</h3>
              <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted" aria-label="Đóng">
                <X size={18} />
              </button>
            </div>
            <Textarea label={required ? 'Lý do trả lại' : 'Ý kiến (tùy chọn)'} required={required} rows={4} value={text} onChange={(e) => setText(e.target.value)} error={err} autoFocus />
            <div className="flex justify-end gap-2 mt-5">
              <Button variant="ghost" onClick={onClose} disabled={isPending} className="border border-border">
                Hủy
              </Button>
              <Button
                onClick={() => {
                  if (required && !text.trim()) return setErr('Vui lòng nhập lý do trả lại');
                  onSubmit(text.trim());
                }}
                disabled={isPending}
                className="bg-primary text-white"
              >
                {isPending ? 'Đang lưu...' : confirmLabel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function KeHoachDetail({ data, me, onClose, onEdit, onDelete }: { data: Plan; me: Me; onClose: () => void; onEdit: (p: Plan) => void; onDelete: (p: Plan) => void }) {
  const nameOf = useEmployeeName();
  const action = usePlanAction();
  const [modal, setModal] = useState<'approve' | 'return' | null>(null);
  const canDelete = data.quyen.sua || me.role === 'admin';
  const totalWeight = data.items.reduce((s, i) => s + (Number(i.trong_so) || 0), 0);

  const exportItems = () =>
    exportToExcel(
      data.items.map((i, k) => ({
        STT: k + 1,
        'Đầu việc': i.ten_viec,
        'Mục tiêu / Chỉ số': i.muc_tieu,
        'Phụ trách': nameOf(i.phu_trach),
        'Thời hạn': i.han ? formatDate(i.han) : '',
        'Ưu tiên': i.uu_tien,
        'Trọng số (%)': i.trong_so,
      })),
      `ke_hoach_${data.id}`,
    );

  const actions: QuickAction[] = [
    ...(data.quyen.sua ? [{ label: 'Gửi duyệt', icon: <Send />, variant: 'primary' as const, onClick: () => action.mutate({ action: 'submit', id: data.id }), disabled: action.isPending }] : []),
    ...(data.quyen.duyet
      ? [
          { label: 'Duyệt', icon: <CircleCheck />, variant: 'success' as const, onClick: () => setModal('approve') },
          { label: 'Trả lại', icon: <Undo2 />, variant: 'danger' as const, onClick: () => setModal('return') },
        ]
      : []),
    { label: 'Xuất Excel', icon: <FileDown />, variant: 'secondary' as const, onClick: exportItems },
  ];

  return (
    <Drawer
      title={data.tieu_de}
      subtitle={data.id}
      icon={<CalendarRange size={20} />}
      onClose={onClose}
      maxWidthClass={DRAWER_WIDTH}
      footer={
        data.quyen.sua ? (
          <DetailFooter
            onClose={onClose}
            onEdit={() => {
              onEdit(data);
              onClose();
            }}
            onDelete={
              canDelete
                ? () => {
                    onDelete(data);
                    onClose();
                  }
                : undefined
            }
          />
        ) : (
          <div className="flex items-center justify-between w-full">
            <Button variant="ghost" onClick={onClose} className="text-muted-foreground hover:text-foreground border border-border">
              Đóng
            </Button>
            {canDelete && (
              <Button
                variant="ghost"
                onClick={() => {
                  onDelete(data);
                  onClose();
                }}
                className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-800"
              >
                Xóa
              </Button>
            )}
          </div>
        )
      }
    >
      <div className="space-y-5">
        <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center text-white shadow-lg shrink-0">
            <CalendarRange size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground leading-tight truncate">{data.tieu_de}</h2>
            <p className="text-body-sm text-muted-foreground mt-0.5">
              {periodLabel(data, true, data)} · {data.ten_phong_ban ?? '—'}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <PlanStatusBadge status={data.trang_thai} />
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-violet-500/10 text-violet-600 border-violet-500/20">{LOAI_LABEL[data.loai]}</span>
            </div>
          </div>
        </div>

        {data.trang_thai === 'Trả lại' && data.y_kien_duyet && (
          <div className="rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 p-3.5 text-sm">
            <p className="font-semibold text-rose-700 dark:text-rose-400 mb-1">Bị trả lại bởi {nameOf(data.nguoi_duyet)}</p>
            <p className="text-rose-700/90 dark:text-rose-300 whitespace-pre-wrap">{data.y_kien_duyet}</p>
          </div>
        )}

        <QuickActions actions={actions} className="bg-card rounded-xl border border-border" />

        <DetailSection title="Thông tin kế hoạch" icon={<CalendarRange size={14} />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailField label="Loại" value={LOAI_LABEL[data.loai]} />
            <DetailField label="Kỳ" value={periodLabel(data, true, data)} />
            <DetailField label="Phòng ban" value={data.ten_phong_ban ?? '—'} />
            <DetailField label="Người lập" value={`${data.ten_nguoi_lap || nameOf(data.nguoi_lap)} (${data.nguoi_lap})`} />
            <DeadlineField kind="kh" doc={data} />
            <DetailField label="Tạo lúc" value={formatDateTime(data.tg_tao)} />
            <DetailField label="Cập nhật" value={formatDateTime(data.tg_cap_nhat)} />
          </div>
        </DetailSection>

        {data.muc_tieu ? (
          <DetailSection title="Mục tiêu chung" icon={<Target size={14} />}>
            <p className="text-body-sm text-foreground whitespace-pre-wrap">{data.muc_tieu}</p>
          </DetailSection>
        ) : null}

        <TableSection title="Đầu việc" icon={<ListChecks size={14} className="text-primary" />} count={data.items.length} emptyTitle="Chưa có đầu việc">
          {data.items.length > 0 ? (
            <>
              <thead className="sticky top-0 z-[1] bg-muted border-b border-border">
                <tr>
                  <th className={subTh}>#</th>
                  <th className={`${subTh} min-w-[200px]`}>Đầu việc</th>
                  <th className={`${subTh} min-w-[140px]`}>Mục tiêu</th>
                  <th className={subTh}>Phụ trách</th>
                  <th className={subTh}>Hạn</th>
                  <th className={subTh}>Ưu tiên</th>
                  <th className={`${subTh} text-right`}>Trọng số</th>
                </tr>
              </thead>
              <tbody className="[&>tr>td]:border-b [&>tr>td]:border-border">
                {data.items.map((i, k) => (
                  <tr key={i.id ?? k} className="hover:bg-muted/60">
                    <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{k + 1}</td>
                    <td className="px-4 py-2.5 font-medium text-foreground">
                      {i.ten_viec}
                      {i.nguon_id ? <span className="ml-1.5 text-[10px] text-sky-600 font-normal">(nhận từ KH phòng)</span> : null}
                    </td>
                    <td className="px-4 py-2.5 text-foreground">{i.muc_tieu || '—'}</td>
                    <td className="px-4 py-2.5 text-foreground whitespace-nowrap">{nameOf(i.phu_trach) || '—'}</td>
                    <td className="px-4 py-2.5 tabular-nums whitespace-nowrap">{i.han ? formatDate(i.han) : '—'}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${PRIORITY_COLOR[i.uu_tien] ?? PRIORITY_COLOR.Thấp}`}>{i.uu_tien}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{i.trong_so ? `${i.trong_so}%` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </>
          ) : null}
        </TableSection>
        {totalWeight > 0 && <p className="text-xs text-muted-foreground -mt-3 px-1">Tổng trọng số: {totalWeight}%</p>}

        {(data.tg_gui || data.nguoi_duyet) && (
          <DetailSection title="Gửi & duyệt" icon={<ShieldCheck size={14} />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailField label="Gửi duyệt lúc" value={data.tg_gui ? formatDateTime(data.tg_gui) : ''} />
              <DetailField label="Người duyệt" value={data.nguoi_duyet ? `${nameOf(data.nguoi_duyet)} (${data.nguoi_duyet})` : ''} />
              <DetailField label="Duyệt / trả lại lúc" value={data.tg_duyet ? formatDateTime(data.tg_duyet) : ''} />
              <DetailField label="Ý kiến" value={data.y_kien_duyet ?? ''} className="sm:col-span-2" />
            </div>
          </DetailSection>
        )}
      </div>

      <CommentModal
        key={modal ?? 'none'}
        open={modal != null}
        title={modal === 'return' ? 'Trả lại kế hoạch' : 'Duyệt kế hoạch'}
        required={modal === 'return'}
        confirmLabel={modal === 'return' ? 'Trả lại' : 'Duyệt'}
        isPending={action.isPending}
        onClose={() => setModal(null)}
        onSubmit={(comment) => action.mutate({ action: modal === 'return' ? 'return' : 'approve', id: data.id, comment }, { onSuccess: () => setModal(null) })}
      />
    </Drawer>
  );
}
