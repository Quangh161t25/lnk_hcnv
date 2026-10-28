import { useState } from 'react';
import { CalendarPlus, CircleCheck, FileChartColumn, FileDown, FileText, Printer, Send, ShieldCheck, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate, formatDateTime } from '@/lib/format';
import { exportToExcel } from '@/lib/export';
import { Button } from '@/components/ui/Button';
import { Drawer, DRAWER_WIDTH } from '@/components/ui/Drawer';
import { DetailField, DetailFooter, DetailSection, QuickActions, TableSection, subTh, type QuickAction } from '@/components/ui/Sections';
import { useCompanyInfo } from '@/modules/he-thong/companyInfo';
import { LOAI_LABEL, periodLabel, periodRange, useEmployeeName, usePlanAction, type Plan } from '../ke-hoach/data';
import { CommentModal, PlanStatusBadge } from '../ke-hoach/KeHoachDetail';
import { DeadlineField } from '../DeadlineField';
import type { Me } from '../workflowData';
import { SECTIONS, completionColor, nextPeriod, useReportAction, type Phan, type Report } from './data';
import { downloadWord, printHtml, reportHtml } from './print';

export function CompletionBar({ value, className = '' }: { value: number; className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden min-w-[48px]">
        <div className={`h-full ${completionColor(value)}`} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
      <span className="text-xs font-semibold tabular-nums w-9 text-right">{value}%</span>
    </div>
  );
}

const COLS: Record<Phan, string[]> = {
  A: ['Công việc', 'Kết quả / Chỉ số', 'Hoàn thành', 'Trọng số'],
  B: ['Vấn đề', 'Biện pháp', 'Đã xử lý'],
  C: ['Đầu việc', 'Mục tiêu', 'Phụ trách', 'Thời hạn'],
  D: ['Đề xuất', 'Nội dung trình bày'],
};

export function BaoCaoDetail({ data, me, plans, onClose, onEdit, onDelete }: { data: Report; me: Me; plans: Plan[]; onClose: () => void; onEdit: (r: Report) => void; onDelete: (r: Report) => void }) {
  const nameOf = useEmployeeName();
  const action = useReportAction();
  const planAction = usePlanAction();
  const { data: company } = useCompanyInfo();
  const [modal, setModal] = useState<'approve' | 'return' | null>(null);
  const canDelete = data.quyen.sua || me.role === 'admin';
  const plan = plans.find((p) => p.id === data.ke_hoach_id);
  const mine = data.nguoi_lap.toLowerCase() === me.ma_nv.toLowerCase();
  const cItems = data.items.filter((i) => i.phan === 'C');

  const html = () => reportHtml(data, { companyName: company?.info.ten_cong_ty ?? '', nameOf });
  const exportExcel = () =>
    exportToExcel(
      data.items.map((i) => ({
        Phần: SECTIONS.find((s) => s.key === i.phan)?.title ?? i.phan,
        'Nội dung': i.noi_dung,
        'Kết quả / Biện pháp / Mục tiêu': i.ket_qua,
        '% hoàn thành': i.phan === 'A' ? (i.phan_tram ?? 0) : '',
        'Trọng số': i.phan === 'A' ? (i.trong_so ?? '') : '',
        'Đã xử lý': i.phan === 'B' ? (i.da_xu_ly ? 'Có' : 'Không') : '',
        'Phụ trách': i.phan === 'C' ? nameOf(i.phu_trach) : '',
        'Thời hạn': i.phan === 'C' && i.han ? formatDate(i.han) : '',
      })),
      `bao_cao_${data.id}`,
    );

  /** Tạo kế hoạch nháp cho kỳ ngay sau từ các đầu việc ở phần C. */
  const createNextPlan = () => {
    const next = nextPeriod(data.loai_ky, data.nam, data.so_ky);
    const label = periodLabel({ loai_ky: data.loai_ky, ...next });
    planAction.mutate({
      action: 'save',
      doc: {
        loai: data.loai,
        loai_ky: data.loai_ky,
        ...next,
        ...periodRange(data.loai_ky, next.nam, next.so_ky),
        phong_ban_id: data.phong_ban_id,
        tieu_de: `Kế hoạch ${label.charAt(0).toLowerCase()}${label.slice(1)} – ${data.loai === 'phong_ban' ? (data.ten_phong_ban ?? '') : data.ten_nguoi_lap}`,
        muc_tieu: `Tạo từ phần C của báo cáo ${data.id}`,
      },
      items: cItems.map((i) => ({ ten_viec: i.noi_dung, muc_tieu: i.ket_qua, phu_trach: i.phu_trach ?? '', han: i.han ?? '', uu_tien: 'Trung bình', trong_so: 0, ghi_chu: '' })),
    });
  };

  const actions: QuickAction[] = [
    ...(data.quyen.sua ? [{ label: 'Gửi duyệt', icon: <Send />, variant: 'primary' as const, onClick: () => action.mutate({ action: 'submit', id: data.id }), disabled: action.isPending }] : []),
    ...(data.quyen.duyet
      ? [
          { label: 'Duyệt', icon: <CircleCheck />, variant: 'success' as const, onClick: () => setModal('approve') },
          { label: 'Trả lại', icon: <Undo2 />, variant: 'danger' as const, onClick: () => setModal('return') },
        ]
      : []),
    { label: 'In báo cáo', icon: <Printer />, variant: 'info' as const, onClick: () => printHtml(html()) || toast.error('Trình duyệt đã chặn cửa sổ in — hãy cho phép cửa sổ bật lên') },
    { label: 'Xuất Word', icon: <FileText />, variant: 'violet' as const, onClick: () => downloadWord(html(), `bao_cao_${data.id}`) },
    { label: 'Xuất Excel', icon: <FileDown />, variant: 'secondary' as const, onClick: exportExcel },
    ...(mine && cItems.length ? [{ label: 'Tạo KH kỳ sau', icon: <CalendarPlus />, variant: 'warning' as const, onClick: createNextPlan, disabled: planAction.isPending }] : []),
  ];

  return (
    <Drawer
      title={data.tieu_de}
      subtitle={data.id}
      icon={<FileChartColumn size={20} />}
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
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center text-white shadow-lg shrink-0">
            <FileChartColumn size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground leading-tight truncate">{data.tieu_de}</h2>
            <p className="text-body-sm text-muted-foreground mt-0.5">
              {periodLabel(data, true, data)} · {data.ten_phong_ban ?? '—'}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <PlanStatusBadge status={data.trang_thai} />
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-cyan-500/10 text-cyan-700 border-cyan-500/20">{LOAI_LABEL[data.loai]}</span>
            </div>
            <CompletionBar value={data.phan_tram ?? 0} className="mt-2 max-w-xs" />
          </div>
        </div>

        {data.trang_thai === 'Trả lại' && data.y_kien_duyet && (
          <div className="rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 p-3.5 text-sm">
            <p className="font-semibold text-rose-700 dark:text-rose-400 mb-1">Bị trả lại bởi {nameOf(data.nguoi_duyet)}</p>
            <p className="text-rose-700/90 dark:text-rose-300 whitespace-pre-wrap">{data.y_kien_duyet}</p>
          </div>
        )}

        <QuickActions actions={actions} className="bg-card rounded-xl border border-border" />

        <DetailSection title="Thông tin báo cáo" icon={<FileChartColumn size={14} />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailField label="Loại" value={LOAI_LABEL[data.loai]} />
            <DetailField label="Kỳ" value={periodLabel(data, true, data)} />
            <DetailField label="Phòng ban" value={data.ten_phong_ban ?? '—'} />
            <DetailField label="Người lập" value={`${data.ten_nguoi_lap || nameOf(data.nguoi_lap)} (${data.nguoi_lap})`} />
            <DetailField label="Kế hoạch đối chiếu" value={plan ? plan.tieu_de : data.ke_hoach_id || ''} emptyText="Không đối chiếu" className="sm:col-span-2" />
            <DeadlineField kind="bc" doc={data} />
            <DetailField label="Cập nhật" value={formatDateTime(data.tg_cap_nhat)} />
          </div>
        </DetailSection>

        {SECTIONS.map((s) => {
          const rows = data.items.filter((i) => i.phan === s.key);
          return (
            <TableSection key={s.key} title={s.title} count={rows.length} emptyTitle="Không có nội dung">
              {rows.length > 0 ? (
                <>
                  <thead className="sticky top-0 z-[1] bg-muted border-b border-border">
                    <tr>
                      <th className={subTh}>#</th>
                      {COLS[s.key].map((c, k) => (
                        <th key={c} className={`${subTh} ${k < 2 ? 'min-w-[170px]' : ''}`}>
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="[&>tr>td]:border-b [&>tr>td]:border-border">
                    {rows.map((i, k) => (
                      <tr key={i.id ?? k} className="hover:bg-muted/60">
                        <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{k + 1}</td>
                        <td className="px-4 py-2.5 font-medium text-foreground">
                          {i.noi_dung}
                          {i.nguon_id ? <span className="ml-1.5 text-[10px] text-sky-600 font-normal">(từ kế hoạch)</span> : null}
                        </td>
                        <td className="px-4 py-2.5 text-foreground">{i.ket_qua || '—'}</td>
                        {s.key === 'A' && (
                          <td className="px-4 py-2.5 min-w-[130px]">
                            <CompletionBar value={Number(i.phan_tram) || 0} />
                          </td>
                        )}
                        {s.key === 'A' && <td className="px-4 py-2.5 tabular-nums">{i.trong_so ? `${i.trong_so}%` : '—'}</td>}
                        {s.key === 'B' && (
                          <td className="px-4 py-2.5">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${i.da_xu_ly ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'}`}>
                              {i.da_xu_ly ? 'Đã xử lý' : 'Chưa xử lý'}
                            </span>
                          </td>
                        )}
                        {s.key === 'C' && <td className="px-4 py-2.5 whitespace-nowrap">{nameOf(i.phu_trach) || '—'}</td>}
                        {s.key === 'C' && <td className="px-4 py-2.5 tabular-nums whitespace-nowrap">{i.han ? formatDate(i.han) : '—'}</td>}
                      </tr>
                    ))}
                  </tbody>
                </>
              ) : null}
            </TableSection>
          );
        })}

        {data.tom_tat ? (
          <DetailSection title="Tóm tắt / nhận xét chung" icon={<FileText size={14} />}>
            <p className="text-body-sm text-foreground whitespace-pre-wrap">{data.tom_tat}</p>
          </DetailSection>
        ) : null}

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
        title={modal === 'return' ? 'Trả lại báo cáo' : 'Duyệt báo cáo'}
        required={modal === 'return'}
        confirmLabel={modal === 'return' ? 'Trả lại' : 'Duyệt'}
        isPending={action.isPending}
        onClose={() => setModal(null)}
        onSubmit={(comment) => action.mutate({ action: modal === 'return' ? 'return' : 'approve', id: data.id, comment }, { onSuccess: () => setModal(null) })}
      />
    </Drawer>
  );
}
