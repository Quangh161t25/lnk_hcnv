import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Briefcase, Calendar, ExternalLink, Eye, FileText, Funnel, Hash, Link as LinkIcon, ListOrdered, RefreshCw, SquarePen, Trash2, UserPlus } from 'lucide-react';
import { t } from '@/lib/i18n';
import { formatDateTime } from '@/lib/format';
import { Drawer, DRAWER_WIDTH } from '@/components/ui/Drawer';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { StatusChangeModal } from '@/components/ui/StatusChangeModal';
import { DetailField, DetailFooter, DetailSection, FormFooter, FormGrid, FormSection, QuickActions, TableSection, subTdActions, subTh } from '@/components/ui/Sections';
import { usePositions } from '@/modules/shared/orgData';
import {
  DX_TRANG_THAI,
  useChangeDeXuatStatus,
  useCreateDeXuat,
  useUngVien,
  useUpdateDeXuat,
  type DeXuatInput,
  type DeXuatTuyenDung,
  type DeXuatWithCounts,
  type UngVien,
} from '../tuyen-dung/data';

export const DX_STATUS_OPTIONS = [
  { value: DX_TRANG_THAI[0], key: 'deXuatTuyenDung.status.nhap' },
  { value: DX_TRANG_THAI[1], key: 'deXuatTuyenDung.status.choDuyet' },
  { value: DX_TRANG_THAI[2], key: 'deXuatTuyenDung.status.daDuyet' },
  { value: DX_TRANG_THAI[3], key: 'deXuatTuyenDung.status.tuChoi' },
];

export function dxStatusColor(status: string) {
  if (status === 'Đã duyệt') return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
  if (status === 'Từ chối') return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
  if (status === 'Chờ duyệt') return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
  return 'bg-muted text-muted-foreground border-border';
}

export function DxStatusBadge({ status, className = '' }: { status: string; className?: string }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${dxStatusColor(status)} ${className}`}>{status}</span>;
}

/* ---------- Form ---------- */

const schema = z.object({
  id_chuc_vu: z.string().min(1, { message: t('deXuatTuyenDung.validation.idChucVuRequired') }),
  ma_de_xuat: z.string().min(1, { message: t('deXuatTuyenDung.validation.maDeXuatRequired') }),
  tieu_de: z.string().nullable(),
  mo_ta: z.string().min(1, { message: t('deXuatTuyenDung.validation.moTaRequired') }),
  yeu_cau: z.string().min(1, { message: t('deXuatTuyenDung.validation.yeuCauRequired') }),
  link_tuyen: z.string().min(1, { message: t('deXuatTuyenDung.validation.linkTuyenRequired') }),
  so_luong: z.coerce.number().min(1, { message: t('deXuatTuyenDung.validation.soLuongMin') }),
  so_luong_da_tuyen: z.coerce.number().min(0, { message: t('deXuatTuyenDung.validation.soLuongDaTuyenMin') }),
  han_nop: z.string().nullable(),
  trang_thai: z.enum(DX_TRANG_THAI, { message: t('deXuatTuyenDung.validation.statusInvalid') }),
});
type FormValues = z.infer<typeof schema>;

const DEFAULTS: FormValues = {
  id_chuc_vu: '',
  ma_de_xuat: '',
  tieu_de: null,
  mo_ta: '',
  yeu_cau: '',
  link_tuyen: '',
  so_luong: 1,
  so_luong_da_tuyen: 0,
  han_nop: null,
  trang_thai: DX_TRANG_THAI[0],
};

export function DeXuatForm({ initialData, onClose }: { initialData: DeXuatTuyenDung | null; onClose: () => void }) {
  const isEdit = !!initialData;
  const { data: positions = [] } = usePositions();
  const create = useCreateDeXuat(onClose);
  const update = useUpdateDeXuat(onClose);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: DEFAULTS });

  const positionOptions = useMemo(
    () => positions.filter((p) => p.trang_thai === 'Đang hoạt động').map((p) => ({ label: p.ten_chuc_vu, value: p.id, subLabel: p.ma_chuc_vu })),
    [positions],
  );
  const statusOptions = DX_STATUS_OPTIONS.map((o) => ({ label: t(o.key), value: o.value }));

  useEffect(() => {
    reset(
      initialData
        ? {
            id_chuc_vu: initialData.id_chuc_vu,
            ma_de_xuat: initialData.ma_de_xuat,
            tieu_de: initialData.tieu_de ?? null,
            mo_ta: initialData.mo_ta,
            yeu_cau: initialData.yeu_cau,
            link_tuyen: initialData.link_tuyen ?? '',
            so_luong: initialData.so_luong,
            so_luong_da_tuyen: initialData.so_luong_da_tuyen ?? 0,
            han_nop: initialData.han_nop ?? null,
            trang_thai: (DX_TRANG_THAI as readonly string[]).includes(initialData.trang_thai) ? (initialData.trang_thai as FormValues['trang_thai']) : DX_TRANG_THAI[0],
          }
        : DEFAULTS,
    );
  }, [initialData, reset]);

  const submit = (v: FormValues) => {
    const data: DeXuatInput = { ...v, tieu_de: v.tieu_de === '' ? null : v.tieu_de, han_nop: v.han_nop === '' ? null : v.han_nop };
    if (isEdit && initialData) update.mutate({ id: initialData.id, data });
    else create.mutate(data);
  };

  return (
    <Drawer
      title={t(isEdit ? 'deXuatTuyenDung.form.editTitle' : 'deXuatTuyenDung.form.createTitle')}
      icon={<Briefcase size={20} />}
      onClose={onClose}
      maxWidthClass={DRAWER_WIDTH}
      footer={
        <FormFooter
          formId="de-xuat-tuyen-dung-form"
          onCancel={onClose}
          isLoading={create.isPending || update.isPending}
          isEdit={isEdit}
          saveLabel={t('deXuatTuyenDung.form.save')}
          createLabel={t('deXuatTuyenDung.form.create')}
        />
      }
    >
      <form id="de-xuat-tuyen-dung-form" onSubmit={handleSubmit(submit)} className="space-y-5">
        <FormSection title={t('deXuatTuyenDung.form.basicInfo')} icon={<ListOrdered size={14} />}>
          <FormGrid cols={2}>
            <Input
              label={t('deXuatTuyenDung.form.maDeXuat')}
              placeholder={t('deXuatTuyenDung.form.maDeXuatPlaceholder')}
              icon={<Hash size={14} />}
              required
              {...register('ma_de_xuat')}
              error={errors.ma_de_xuat?.message}
            />
            <Controller
              name="id_chuc_vu"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('deXuatTuyenDung.form.chucVu')}
                  options={positionOptions}
                  placeholder={t('deXuatTuyenDung.form.chucVuPlaceholder')}
                  icon={<Briefcase size={14} />}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.id_chuc_vu?.message}
                  required
                  dropdownInPortal
                />
              )}
            />
            <div className="col-span-1 sm:col-span-2">
              <Input
                label={t('deXuatTuyenDung.form.tieuDe')}
                placeholder={t('deXuatTuyenDung.form.tieuDePlaceholder')}
                icon={<FileText size={14} />}
                {...register('tieu_de')}
                error={errors.tieu_de?.message}
              />
            </div>
            <Controller
              name="trang_thai"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('deXuatTuyenDung.form.status')}
                  options={statusOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t('deXuatTuyenDung.form.status')}
                  icon={<Funnel size={14} />}
                  error={errors.trang_thai?.message}
                  required
                  searchable={false}
                  dropdownInPortal
                />
              )}
            />
          </FormGrid>
        </FormSection>
        <FormSection title={t('deXuatTuyenDung.form.jobContent')} icon={<FileText size={14} />}>
          <FormGrid cols={2}>
            <div className="col-span-1 sm:col-span-2">
              <Textarea label={t('deXuatTuyenDung.form.moTa')} placeholder={t('deXuatTuyenDung.form.moTaPlaceholder')} {...register('mo_ta')} error={errors.mo_ta?.message} rows={4} required />
            </div>
            <div className="col-span-1 sm:col-span-2">
              <Textarea label={t('deXuatTuyenDung.form.yeuCau')} placeholder={t('deXuatTuyenDung.form.yeuCauPlaceholder')} {...register('yeu_cau')} error={errors.yeu_cau?.message} rows={4} required />
            </div>
            <div className="col-span-1 sm:col-span-2">
              <Input
                label={t('deXuatTuyenDung.form.linkTuyen')}
                placeholder={t('deXuatTuyenDung.form.linkTuyenPlaceholder')}
                icon={<LinkIcon size={14} />}
                required
                {...register('link_tuyen')}
                error={errors.link_tuyen?.message}
              />
            </div>
          </FormGrid>
        </FormSection>
        <FormSection title={t('deXuatTuyenDung.form.quantityAndStatus')} icon={<Calendar size={14} />}>
          <FormGrid cols={2}>
            <Input
              label={t('deXuatTuyenDung.form.soLuong')}
              placeholder={t('deXuatTuyenDung.form.soLuongPlaceholder')}
              type="number"
              min={1}
              required
              {...register('so_luong')}
              error={errors.so_luong?.message}
            />
            <div className="col-span-1 sm:col-span-2">
              <Input
                label={t('deXuatTuyenDung.form.hanNop')}
                placeholder={t('deXuatTuyenDung.form.hanNopPlaceholder')}
                type="date"
                icon={<Calendar size={14} />}
                {...register('han_nop')}
                error={errors.han_nop?.message}
              />
            </div>
          </FormGrid>
        </FormSection>
      </form>
    </Drawer>
  );
}

/* ---------- Bảng ứng viên trong chi tiết đề xuất ---------- */

function UngVienSubSection({
  items,
  loading,
  onAdd,
  onView,
  onEdit,
  onDelete,
}: {
  items: UngVien[];
  loading: boolean;
  onAdd?: () => void;
  onView?: (r: UngVien) => void;
  onEdit?: (r: UngVien) => void;
  onDelete?: (r: UngVien) => void;
}) {
  const hasActions = !!(onView || onEdit || onDelete);
  return (
    <TableSection
      title={t('deXuatTuyenDung.detail.ungVienSection')}
      icon={<UserPlus size={14} className="text-primary" />}
      count={items.length}
      addLabel={onAdd ? t('deXuatTuyenDung.detail.addUngVien') : undefined}
      onAdd={onAdd}
      emptyTitle={t('deXuatTuyenDung.detail.ungVienEmpty')}
      emptyDescription={t('deXuatTuyenDung.detail.ungVienEmptyHint')}
      emptyIcon={<UserPlus className="w-10 h-10 text-muted-foreground" />}
      loading={loading}
      loadingText={t('common.loading')}
    >
      {items.length > 0 ? (
        <>
          <thead className="sticky top-0 z-[1] bg-muted border-b border-border">
            <tr>
              <th className={subTh}>#</th>
              <th className={subTh}>{t('deXuatTuyenDung.detail.ungVienColHoTen')}</th>
              <th className={subTh}>{t('deXuatTuyenDung.detail.ungVienColEmail')}</th>
              <th className={subTh}>{t('deXuatTuyenDung.detail.ungVienColTrangThai')}</th>
              {hasActions && (
                <th className="sticky right-0 z-[2] px-4 py-2 font-semibold text-foreground/80 text-xs text-center bg-muted border-l border-border min-w-[120px]">
                  {t('common.actions')}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="[&>tr>td]:border-b [&>tr>td]:border-border">
            {items.map((d, i) => (
              <tr key={d.id} className="hover:bg-muted/60 transition-colors">
                <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{i + 1}</td>
                <td className="px-4 py-2.5 font-medium text-foreground">{d.ho_ten || '—'}</td>
                <td className="px-4 py-2.5 text-foreground">{d.email || '—'}</td>
                <td className="px-4 py-2.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted/80 text-foreground border border-border">{d.ten_trang_thai || '—'}</span>
                </td>
                {hasActions && (
                  <td className={subTdActions} onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-0.5">
                      {onView && (
                        <button type="button" onClick={() => onView(d)} className="p-1.5 text-primary hover:bg-primary/10 rounded-md transition-all" title={t('common.view')} aria-label={t('common.view')}>
                          <Eye size={14} />
                        </button>
                      )}
                      {onEdit && (
                        <button type="button" onClick={() => onEdit(d)} className="p-1.5 text-primary hover:bg-primary/10 rounded-md transition-all" title={t('common.edit')} aria-label={t('common.edit')}>
                          <SquarePen size={14} />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(d)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-all"
                          title={t('common.delete')}
                          aria-label={t('common.delete')}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </>
      ) : null}
    </TableSection>
  );
}

/* ---------- Chi tiết ---------- */

export function DeXuatDetail({
  data,
  onClose,
  onEdit,
  onDelete,
  onDataUpdated,
  onAddUngVien,
  onViewUngVien,
  onEditUngVien,
  onDeleteUngVien,
}: {
  data: DeXuatWithCounts;
  onClose: () => void;
  onEdit: (row: DeXuatWithCounts) => void;
  onDelete?: (id: string) => void;
  onDataUpdated?: (row: DeXuatTuyenDung) => void;
  onAddUngVien?: () => void;
  onViewUngVien?: (r: UngVien) => void;
  onEditUngVien?: (r: UngVien) => void;
  onDeleteUngVien?: (r: UngVien) => void;
}) {
  const { data: candidates = [], isLoading } = useUngVien();
  const items = useMemo(() => candidates.filter((c) => c.id_de_xuat_tuyen_dung === data.id), [candidates, data.id]);
  const [statusOpen, setStatusOpen] = useState(false);
  const changeStatus = useChangeDeXuatStatus((row) => {
    setStatusOpen(false);
    onDataUpdated?.(row);
  });
  const title = data.tieu_de || data.ma_de_xuat;

  return (
    <Drawer
      title={title}
      subtitle={data.ma_de_xuat}
      icon={<Briefcase size={20} />}
      onClose={onClose}
      maxWidthClass={DRAWER_WIDTH}
      footer={
        <DetailFooter
          onClose={onClose}
          onEdit={() => {
            onEdit(data);
            onClose();
          }}
          onDelete={
            onDelete
              ? () => {
                  onDelete(data.id);
                  onClose();
                }
              : undefined
          }
        />
      }
    >
      <div className="space-y-5">
        <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-primary/20 shadow-lg shrink-0">
            <Briefcase size={24} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground leading-tight truncate">{title}</h2>
            <p className="text-body-sm text-muted-foreground font-mono mt-0.5">{data.ma_de_xuat}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <DxStatusBadge status={data.trang_thai} />
              {data.ten_chuc_vu && <span className="text-xs text-foreground">{data.ten_chuc_vu}</span>}
            </div>
          </div>
        </div>
        <QuickActions
          actions={[{ label: t('deXuatTuyenDung.detail.changeStatus'), icon: <RefreshCw />, onClick: () => setStatusOpen(true), variant: 'info' }]}
          className="bg-card rounded-xl border border-border"
        />
        <StatusChangeModal
          open={statusOpen}
          title={t('deXuatTuyenDung.detail.changeStatusTitle')}
          statusLabel={t('deXuatTuyenDung.store.statusCol')}
          noteLabel={t('deXuatTuyenDung.detail.changeStatusNote')}
          notePlaceholder={t('deXuatTuyenDung.detail.changeStatusNotePlaceholder')}
          options={DX_TRANG_THAI.map((s) => ({ label: s, value: s }))}
          initialStatus={data.trang_thai}
          initialNote={data.ghi_chu ?? ''}
          isPending={changeStatus.isPending}
          onClose={() => setStatusOpen(false)}
          onSubmit={(status, note) => (DX_TRANG_THAI as readonly string[]).includes(status) && changeStatus.mutate({ id: data.id, status, ghi_chu: note })}
        />
        <DetailSection title={t('deXuatTuyenDung.detail.basicInfo')} icon={<ListOrdered size={14} />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailField label={t('deXuatTuyenDung.store.maDeXuatCol')} value={data.ma_de_xuat} />
            <DetailField label={t('deXuatTuyenDung.store.chucVuCol')} value={data.ten_chuc_vu ?? '—'} />
            {data.ten_phong_ban && <DetailField label={t('deXuatTuyenDung.detail.phongBan')} value={data.ten_phong_ban} className="sm:col-span-2" />}
            {data.tieu_de && <DetailField label={t('deXuatTuyenDung.store.tieuDeCol')} value={data.tieu_de} className="sm:col-span-2" />}
            <DetailField label={t('deXuatTuyenDung.store.statusCol')} value={<DxStatusBadge status={data.trang_thai} className="w-fit" />} />
            {data.ghi_chu != null && data.ghi_chu.trim() !== '' && <DetailField label={t('deXuatTuyenDung.detail.ghiChu')} value={data.ghi_chu} className="sm:col-span-2" />}
          </div>
        </DetailSection>
        <DetailSection title={t('deXuatTuyenDung.detail.jobContent')} icon={<FileText size={14} />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <DetailField label={t('deXuatTuyenDung.detail.moTa')} value={data.mo_ta || '—'} />
            </div>
            <div className="sm:col-span-2">
              <DetailField label={t('deXuatTuyenDung.detail.yeuCau')} value={data.yeu_cau || '—'} />
            </div>
            {data.link_tuyen ? (
              <div className="sm:col-span-2">
                <p className="text-body-sm text-muted-foreground mb-1">{t('deXuatTuyenDung.detail.linkTuyen')}</p>
                <a href={data.link_tuyen} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                  <ExternalLink size={14} />
                  {data.link_tuyen}
                </a>
              </div>
            ) : null}
          </div>
        </DetailSection>
        <DetailSection title={t('deXuatTuyenDung.detail.quantityAndDeadline')} icon={<Calendar size={14} />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailField label={t('deXuatTuyenDung.detail.soLuong')} value={String(data.so_luong)} />
            <DetailField label={t('deXuatTuyenDung.detail.soLuongOnboard')} value={String(data.so_luong_onboard)} />
            <DetailField label={t('deXuatTuyenDung.detail.soLuongDaNghi')} value={String(data.so_luong_da_nghi)} />
            <DetailField label={t('deXuatTuyenDung.detail.soLuongConLai')} value={String(data.so_luong_con_lai)} />
            <DetailField label={t('deXuatTuyenDung.detail.hanNop')} value={data.han_nop ? formatDateTime(data.han_nop) : '—'} />
            <DetailField label={t('deXuatTuyenDung.detail.tgTao')} value={formatDateTime(data.tg_tao)} />
            <DetailField label={t('deXuatTuyenDung.detail.tgCapNhat')} value={formatDateTime(data.tg_cap_nhat)} />
          </div>
        </DetailSection>
        <UngVienSubSection items={items} loading={isLoading} onAdd={onAddUngVien} onView={onViewUngVien} onEdit={onEditUngVien} onDelete={onDeleteUngVien} />
      </div>
    </Drawer>
  );
}
