import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Award, Briefcase, Calendar, CircleCheck, CircleDot, Eye, FileText, Mail, MapPin, MessageSquare, Printer, SquarePen, Trash2, User, Video } from 'lucide-react';
import { t } from '@/lib/i18n';
import { Drawer, DRAWER_WIDTH } from '@/components/ui/Drawer';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
  DetailField,
  DetailFooter,
  DetailSection,
  FormFooter,
  FormGrid,
  FormSection,
  QuickActions,
  TableSection,
  subTdActions,
  subTh,
} from '@/components/ui/Sections';
import {
  LPV_DANH_GIA,
  LPV_TRANG_THAI,
  useCreateLichPhongVan,
  useUngVien,
  useUpdateLichPhongVan,
  type LichPhongVan,
  type LichPhongVanInput,
  type LpvDanhGia,
  type LpvTrangThai,
} from '../tuyen-dung/data';

/* ---------- Hằng số + màu nhãn ---------- */

export const TRANG_THAI_COLOR: Record<LpvTrangThai, string> = {
  Chờ: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  'Đã diễn ra': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  Hoãn: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
  Hủy: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
};
export const HINH_THUC_COLOR: Record<string, string> = { online: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20', offline: 'bg-muted/80 text-foreground border-border' };
export const DANH_GIA_COLOR: Record<LpvDanhGia, string> = {
  'Chưa đánh giá': 'bg-muted/80 text-muted-foreground border-border',
  Đạt: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  'Không đạt': 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
};

export const hinhThucLabel = (v: string) => t(v === 'online' ? 'lichPhongVan.hinhThuc.online' : 'lichPhongVan.hinhThuc.offline');

/** Màu nhãn kết quả phỏng vấn, đoán theo nội dung (giống bản gốc). */
export function ketQuaColor(value?: string | null) {
  if (!value || value.trim() === '') return 'bg-muted/80 text-muted-foreground border-border';
  const v = value.trim().toLowerCase();
  if (v === 'đạt' || v === 'dat' || v === 'đạt yêu cầu' || v.includes('mời nhận việc') || v.includes('nhan viec'))
    return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
  if (v === 'không đạt' || v === 'khong dat' || v === 'từ chối' || v === 'tu choi' || v.includes('reject'))
    return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
  if (v.includes('vòng 2') || v.includes('vong 2') || v.includes('chuyển vòng') || v.includes('round 2'))
    return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
  if (v.includes('lưu hồ sơ') || v.includes('luu ho so') || v.includes('cân nhắc') || v.includes('can nhac'))
    return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
  return 'bg-muted/80 text-foreground border-border';
}

const XEP_HANG = [
  { value: 'rat_xuat_sac', labelKey: 'lichPhongVan.danhGia.xepHang.ratXuatSac' },
  { value: 'dat_yeu_cau', labelKey: 'lichPhongVan.danhGia.xepHang.datYeuCau' },
  { value: 'can_nhac', labelKey: 'lichPhongVan.danhGia.xepHang.canNhac' },
  { value: 'khong_dat', labelKey: 'lichPhongVan.danhGia.xepHang.khongDat' },
];
const DE_XUAT = [
  { value: 'vong_2', labelKey: 'lichPhongVan.danhGia.deXuat.vong2' },
  { value: 'moi_nhan_viec', labelKey: 'lichPhongVan.danhGia.deXuat.moiNhanViec' },
  { value: 'luu_ho_so', labelKey: 'lichPhongVan.danhGia.deXuat.luuHoSo' },
  { value: 'tu_choi', labelKey: 'lichPhongVan.danhGia.deXuat.tuChoi' },
];

interface DanhGiaChiTiet {
  nguoi_phong_van: string | null;
  hard_nghiep_vu: number | null;
  hard_kinh_nghiem: number | null;
  hard_ky_thuat: number | null;
  soft_giao_tiep: number | null;
  soft_tu_duy: number | null;
  soft_van_hoa: number | null;
  soft_tac_phong: number | null;
  diem_manh: string | null;
  diem_yeu: string | null;
  ky_vong_luong: string | null;
  xep_hang_chung: string | null;
  de_xuat: string | null;
  ghi_chu: string | null;
}

function parseDanhGia(raw?: string | null): DanhGiaChiTiet | null {
  if (!raw || raw.trim() === '') return null;
  try {
    return JSON.parse(raw) as DanhGiaChiTiet;
  } catch {
    return null;
  }
}

/* ---------- Khối "Lịch phỏng vấn" trong chi tiết ứng viên ---------- */

export function LichPhongVanSection({
  items,
  loading = false,
  addLabel,
  onAdd,
  onView,
  onEdit,
  onDelete,
}: {
  items: LichPhongVan[];
  loading?: boolean;
  addLabel?: string;
  onAdd?: () => void;
  onView?: (row: LichPhongVan) => void;
  onEdit?: (row: LichPhongVan) => void;
  onDelete?: (row: LichPhongVan) => void;
}) {
  const hasRows = items.length > 0;
  const hasActions = !!(onView || onEdit || onDelete);
  return (
    <TableSection
      title={t('lichPhongVan.detail.lichSection')}
      icon={<Calendar size={14} className="text-primary" />}
      count={items.length}
      addLabel={addLabel}
      onAdd={onAdd}
      emptyTitle={t('lichPhongVan.detail.lichEmpty')}
      emptyDescription={t('lichPhongVan.detail.lichEmptyHint')}
      emptyIcon={<Calendar className="w-10 h-10 text-muted-foreground" />}
      loading={loading}
      loadingText={t('common.loading')}
    >
      {hasRows ? (
        <>
          <thead className="sticky top-0 z-[1] bg-muted border-b border-border">
            <tr>
              <th className={subTh}>#</th>
              <th className={subTh}>{t('lichPhongVan.detail.lichColVong')}</th>
              <th className={subTh}>{t('lichPhongVan.detail.lichColNgayGio')}</th>
              <th className={subTh}>{t('lichPhongVan.detail.lichColHinhThuc')}</th>
              <th className={subTh}>{t('lichPhongVan.detail.lichColDiaDiem')}</th>
              <th className={subTh}>{t('lichPhongVan.detail.lichColTrangThai')}</th>
              {hasActions && (
                <th className="sticky right-0 z-[2] px-4 py-2 font-semibold text-foreground/80 text-xs text-center bg-muted border-l border-border min-w-[120px]">
                  {t('common.actions')}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="[&>tr>td]:border-b [&>tr>td]:border-border">
            {items.map((row, i) => (
              <tr key={row.id} className="hover:bg-muted/60 transition-colors">
                <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{i + 1}</td>
                <td className="px-4 py-2.5 font-medium text-foreground">{row.so_vong}</td>
                <td className="px-4 py-2.5 text-foreground tabular-nums">
                  {row.ngay} – {row.gio}
                </td>
                <td className="px-4 py-2.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${HINH_THUC_COLOR[row.hinh_thuc] ?? HINH_THUC_COLOR.offline}`}>
                    {hinhThucLabel(row.hinh_thuc)}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-foreground line-clamp-1 max-w-[180px]">{row.dia_diem || '—'}</td>
                <td className="px-4 py-2.5">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${TRANG_THAI_COLOR[row.trang_thai] ?? 'bg-muted text-muted-foreground border-border'}`}
                  >
                    {row.trang_thai}
                  </span>
                </td>
                {hasActions && (
                  <td className={subTdActions} onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-0.5">
                      {onView && (
                        <button type="button" onClick={() => onView(row)} className="p-1.5 text-primary hover:bg-primary/10 rounded-md transition-all" title={t('common.view')} aria-label={t('common.view')}>
                          <Eye size={14} />
                        </button>
                      )}
                      {onEdit && (
                        <button type="button" onClick={() => onEdit(row)} className="p-1.5 text-primary hover:bg-primary/10 rounded-md transition-all" title={t('common.edit')} aria-label={t('common.edit')}>
                          <SquarePen size={14} />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(row)}
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

/* ---------- Ngăn kéo chi tiết buổi phỏng vấn ---------- */

export function LichPhongVanDetail({
  data,
  onClose,
  onEdit,
  onDelete,
  onOpenDanhGia,
}: {
  data: LichPhongVan;
  onClose: () => void;
  onEdit: (row: LichPhongVan) => void;
  onDelete?: (id: string) => void;
  onOpenDanhGia?: (row: LichPhongVan) => void;
}) {
  const actions = [
    {
      label: t('lichPhongVan.detail.toolbar.printEvaluation'),
      icon: <Printer size={16} />,
      onClick: () => window.open(`/phieu-danh-gia-pv/${encodeURIComponent(data.id)}`, '_blank', 'noopener,noreferrer'),
      variant: 'primary' as const,
    },
    ...(onOpenDanhGia ? [{ label: t('lichPhongVan.detail.toolbar.evaluate'), icon: <Award size={16} />, onClick: () => onOpenDanhGia(data), variant: 'info' as const }] : []),
    {
      label: t('lichPhongVan.detail.toolbar.printInvitation'),
      icon: <Mail size={16} />,
      onClick: () => window.open(`/thu-moi-phong-van/${encodeURIComponent(data.id)}`, '_blank', 'noopener,noreferrer'),
      variant: 'secondary' as const,
    },
  ];
  const detail = parseDanhGia(data.danh_gia_chi_tiet);
  const xepHang = detail?.xep_hang_chung ? t(XEP_HANG.find((x) => x.value === detail.xep_hang_chung)?.labelKey ?? '') : null;
  const deXuat = detail?.de_xuat ? t(DE_XUAT.find((x) => x.value === detail.de_xuat)?.labelKey ?? '') : null;
  const danhGia = data.trang_thai_danh_gia ?? LPV_DANH_GIA[0];

  return (
    <Drawer
      title={t('lichPhongVan.detail.title')}
      subtitle={`${data.ten_ung_vien ?? '—'} · ${t('lichPhongVan.detail.lichColVong')} ${data.so_vong}`}
      icon={<Calendar size={20} />}
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
        <QuickActions actions={actions} className="bg-card rounded-xl border border-border" />
        <DetailSection title={t('lichPhongVan.detail.sectionInfo')} icon={<Calendar size={14} />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailField label={t('lichPhongVan.store.ungVienCol')} value={data.ten_ung_vien ?? '—'} />
            <DetailField label={t('lichPhongVan.detail.viTriUngTuyen')} value={data.ma_de_xuat ?? '—'} />
            <DetailField label={t('lichPhongVan.store.soVongCol')} value={String(data.so_vong)} />
            <DetailField label={t('lichPhongVan.detail.ngayGio')} value={`${data.ngay} – ${data.gio}`} />
            <DetailField label={t('lichPhongVan.store.hinhThucCol')} value={hinhThucLabel(data.hinh_thuc)} />
            <DetailField label={t('lichPhongVan.store.diaDiemCol')} value={data.dia_diem ?? '—'} />
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">{t('lichPhongVan.store.trangThaiCol')}</p>
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${TRANG_THAI_COLOR[data.trang_thai] ?? 'bg-muted text-muted-foreground border-border'}`}
              >
                {data.trang_thai}
              </span>
            </div>
          </div>
        </DetailSection>
        <DetailSection title={t('lichPhongVan.detail.sectionDanhGia')} icon={<Award size={14} />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {detail ? (
              <>
                {detail.nguoi_phong_van && <DetailField label={t('lichPhongVan.danhGia.nguoiPhongVan')} value={detail.nguoi_phong_van} />}
                {xepHang && <DetailField label={t('lichPhongVan.danhGia.xepHangChung')} value={xepHang} />}
                {deXuat && <DetailField label={t('lichPhongVan.danhGia.deXuatLabel')} value={deXuat} />}
                {detail.diem_manh && <DetailField label={t('lichPhongVan.danhGia.diemManh')} value={detail.diem_manh} className="sm:col-span-2" />}
                {detail.diem_yeu && <DetailField label={t('lichPhongVan.danhGia.diemYeu')} value={detail.diem_yeu} className="sm:col-span-2" />}
              </>
            ) : (
              <>
                <DetailField label={t('lichPhongVan.form.danhGiaDiemSo')} value={data.danh_gia_diem_so ?? '—'} />
                <DetailField label={t('lichPhongVan.form.danhGiaNhanXet')} value={data.danh_gia_nhan_xet ?? '—'} className="sm:col-span-2" />
              </>
            )}
          </div>
        </DetailSection>
        <DetailSection title={t('lichPhongVan.detail.sectionKetQua')} icon={<MessageSquare size={14} />}>
          <DetailField
            label={t('lichPhongVan.store.trangThaiDanhGiaCol')}
            value={
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border w-fit ${DANH_GIA_COLOR[danhGia] ?? 'bg-muted text-muted-foreground border-border'}`}>
                {danhGia}
              </span>
            }
          />
          <DetailField
            label={t('lichPhongVan.store.ketQuaCol')}
            value={<span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border w-fit ${ketQuaColor(data.ket_qua)}`}>{data.ket_qua ?? '—'}</span>}
          />
        </DetailSection>
        {data.ghi_chu && data.ghi_chu.trim() !== '' && (
          <DetailSection title={t('lichPhongVan.detail.sectionGhiChu')} icon={<FileText size={14} />}>
            <p className="text-body-sm text-foreground whitespace-pre-wrap">{data.ghi_chu}</p>
          </DetailSection>
        )}
      </div>
    </Drawer>
  );
}

/* ---------- Form thêm/sửa lịch phỏng vấn ---------- */

const lichSchema = z.object({
  id_ung_vien: z.string().min(1, { message: t('lichPhongVan.validation.ungVienRequired') }),
  so_vong: z.coerce.number().min(1, { message: t('lichPhongVan.validation.soVongMin') }),
  ngay: z.string().min(1, { message: t('lichPhongVan.validation.ngayRequired') }),
  gio: z.string().min(1, { message: t('lichPhongVan.validation.gioRequired') }),
  hinh_thuc: z.enum(['online', 'offline'], { required_error: t('lichPhongVan.validation.hinhThucRequired') }),
  dia_diem: z.string().min(1, { message: t('lichPhongVan.validation.diaDiemRequired') }),
  trang_thai: z.enum(LPV_TRANG_THAI, { message: t('lichPhongVan.validation.trangThaiInvalid') }),
  trang_thai_danh_gia: z.enum(LPV_DANH_GIA).nullable().optional(),
  danh_gia_diem_so: z.string().nullable(),
  danh_gia_nhan_xet: z.string().nullable(),
  ket_qua: z.string().nullable(),
  ghi_chu: z.string().nullable(),
  danh_gia_chi_tiet: z.string().nullable().optional(),
});
type LichFormValues = z.infer<typeof lichSchema>;

const LICH_DEFAULTS: LichFormValues = {
  id_ung_vien: '',
  so_vong: 1,
  ngay: '',
  gio: '09:00',
  hinh_thuc: 'offline',
  dia_diem: '',
  trang_thai: LPV_TRANG_THAI[0],
  trang_thai_danh_gia: LPV_DANH_GIA[0],
  danh_gia_diem_so: null,
  danh_gia_nhan_xet: null,
  ket_qua: null,
  ghi_chu: null,
};

const emptyToNull = (v: string | null | undefined) => (v === '' || v == null ? null : v);

export function LichPhongVanForm({ initialData, initialIdUngVien, onClose }: { initialData: LichPhongVan | null; initialIdUngVien?: string; onClose: () => void }) {
  const isEdit = !!initialData;
  const { data: candidates = [] } = useUngVien();
  const create = useCreateLichPhongVan(onClose);
  const update = useUpdateLichPhongVan(onClose);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LichFormValues>({ resolver: zodResolver(lichSchema), defaultValues: LICH_DEFAULTS });

  const candidateOptions = useMemo(
    () => candidates.map((c) => ({ label: `${c.ho_ten}${c.ma_de_xuat ? ` · ${c.ma_de_xuat}` : ''}`, value: c.id, subLabel: c.ma_de_xuat })),
    [candidates],
  );
  const statusOptions = LPV_TRANG_THAI.map((v) => ({ label: v, value: v }));
  const formatOptions = [
    { value: 'online', label: t('lichPhongVan.hinhThuc.online') },
    { value: 'offline', label: t('lichPhongVan.hinhThuc.offline') },
  ];
  const evalOptions = LPV_DANH_GIA.map((v) => ({ label: v, value: v }));

  useEffect(() => {
    reset(
      initialData
        ? {
            id_ung_vien: initialData.id_ung_vien,
            so_vong: initialData.so_vong,
            ngay: initialData.ngay,
            gio: initialData.gio,
            hinh_thuc: initialData.hinh_thuc,
            dia_diem: initialData.dia_diem,
            trang_thai: initialData.trang_thai,
            trang_thai_danh_gia: initialData.trang_thai_danh_gia ?? LPV_DANH_GIA[0],
            danh_gia_diem_so: initialData.danh_gia_diem_so ?? null,
            danh_gia_nhan_xet: initialData.danh_gia_nhan_xet ?? null,
            ket_qua: initialData.ket_qua ?? null,
            ghi_chu: initialData.ghi_chu ?? null,
          }
        : { ...LICH_DEFAULTS, id_ung_vien: initialIdUngVien ?? '' },
    );
  }, [initialData, initialIdUngVien, reset]);

  const submit = (v: LichFormValues) => {
    const data: LichPhongVanInput = {
      ...v,
      trang_thai_danh_gia: v.trang_thai_danh_gia ?? null,
      danh_gia_diem_so: emptyToNull(v.danh_gia_diem_so),
      danh_gia_nhan_xet: emptyToNull(v.danh_gia_nhan_xet),
      ket_qua: emptyToNull(v.ket_qua),
      ghi_chu: emptyToNull(v.ghi_chu),
      danh_gia_chi_tiet: initialData?.danh_gia_chi_tiet ?? null,
    };
    if (isEdit && initialData) update.mutate({ id: initialData.id, data });
    else create.mutate(data);
  };

  return (
    <Drawer
      title={t(isEdit ? 'lichPhongVan.form.editTitle' : 'lichPhongVan.form.createTitle')}
      icon={<Calendar size={20} />}
      onClose={onClose}
      maxWidthClass={DRAWER_WIDTH}
      footer={
        <FormFooter
          formId="lich-phong-van-form"
          onCancel={onClose}
          isLoading={create.isPending || update.isPending}
          isEdit={isEdit}
          saveLabel={t('lichPhongVan.form.save')}
          createLabel={t('lichPhongVan.form.create')}
        />
      }
    >
      <form id="lich-phong-van-form" onSubmit={handleSubmit(submit)} className="space-y-5">
        <FormSection title={t('lichPhongVan.detail.sectionInfo')} icon={<Calendar size={14} />}>
          <FormGrid cols={2}>
            <div className="col-span-2">
              <Controller
                name="id_ung_vien"
                control={control}
                render={({ field }) => (
                  <Select
                    label={t('lichPhongVan.form.ungVien')}
                    options={candidateOptions}
                    placeholder={t('lichPhongVan.form.ungVienPlaceholder')}
                    icon={<User size={14} />}
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.id_ung_vien?.message}
                    required
                    disabled={!!initialIdUngVien}
                    dropdownInPortal
                  />
                )}
              />
            </div>
            <Input
              label={t('lichPhongVan.form.soVong')}
              type="number"
              min={1}
              placeholder={t('lichPhongVan.form.soVongPlaceholder')}
              {...register('so_vong')}
              error={errors.so_vong?.message}
              required
            />
            <Controller
              name="trang_thai"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('lichPhongVan.form.trangThai')}
                  options={statusOptions}
                  placeholder={t('lichPhongVan.form.trangThai')}
                  icon={<CircleDot size={14} />}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.trang_thai?.message}
                  searchable={false}
                  dropdownInPortal
                />
              )}
            />
            <Input label={t('lichPhongVan.form.ngay')} type="date" icon={<Calendar size={14} />} {...register('ngay')} error={errors.ngay?.message} required />
            <Input
              label={t('lichPhongVan.form.gio')}
              type="time"
              placeholder={t('lichPhongVan.form.gioPlaceholder')}
              icon={<Calendar size={14} />}
              {...register('gio')}
              error={errors.gio?.message}
              required
            />
            <Controller
              name="hinh_thuc"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('lichPhongVan.form.hinhThuc')}
                  options={formatOptions}
                  placeholder={t('lichPhongVan.form.hinhThuc')}
                  icon={<Video size={14} />}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.hinh_thuc?.message}
                  required
                  searchable={false}
                  dropdownInPortal
                />
              )}
            />
            <div className="col-span-2">
              <Input
                label={t('lichPhongVan.form.diaDiem')}
                placeholder={t('lichPhongVan.form.diaDiemPlaceholder')}
                icon={<MapPin size={14} />}
                {...register('dia_diem')}
                error={errors.dia_diem?.message}
                required
              />
            </div>
          </FormGrid>
        </FormSection>
        <FormSection title={t('lichPhongVan.detail.sectionDanhGia')} icon={<Award size={14} />}>
          <FormGrid cols={1}>
            <Controller
              name="trang_thai_danh_gia"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('lichPhongVan.store.trangThaiDanhGiaCol')}
                  options={evalOptions}
                  value={field.value ?? LPV_DANH_GIA[0]}
                  onChange={(v) => field.onChange(v || null)}
                  placeholder={t('lichPhongVan.store.trangThaiDanhGiaCol')}
                  error={errors.trang_thai_danh_gia?.message}
                  searchable={false}
                  dropdownInPortal
                />
              )}
            />
            <Input label={t('lichPhongVan.form.danhGiaDiemSo')} {...register('danh_gia_diem_so')} />
            <Textarea label={t('lichPhongVan.form.danhGiaNhanXet')} {...register('danh_gia_nhan_xet')} rows={3} />
            <Input label={t('lichPhongVan.form.ketQua')} {...register('ket_qua')} />
            <Textarea label={t('lichPhongVan.form.ghiChu')} {...register('ghi_chu')} rows={2} />
          </FormGrid>
        </FormSection>
      </form>
    </Drawer>
  );
}

/* ---------- Form đánh giá chi tiết ---------- */

const score = z.union([z.number().min(1).max(5), z.null()]);
const danhGiaSchema = z
  .object({
    nguoi_phong_van: z.string().nullable(),
    hard_nghiep_vu: score,
    hard_kinh_nghiem: score,
    hard_ky_thuat: score,
    soft_giao_tiep: score,
    soft_tu_duy: score,
    soft_van_hoa: score,
    soft_tac_phong: score,
    diem_manh: z.string().nullable(),
    diem_yeu: z.string().nullable(),
    ky_vong_luong: z.string().nullable(),
    xep_hang_chung: z.string().nullable(),
    de_xuat: z.string().nullable(),
    ghi_chu: z.string().nullable(),
  })
  .refine((e) => e.nguoi_phong_van != null && String(e.nguoi_phong_van).trim() !== '', { message: ' ', path: ['nguoi_phong_van'] })
  .refine((e) => e.hard_nghiep_vu != null, { message: ' ', path: ['hard_nghiep_vu'] })
  .refine((e) => e.hard_kinh_nghiem != null, { message: ' ', path: ['hard_kinh_nghiem'] })
  .refine((e) => e.hard_ky_thuat != null, { message: ' ', path: ['hard_ky_thuat'] })
  .refine((e) => e.soft_giao_tiep != null, { message: ' ', path: ['soft_giao_tiep'] })
  .refine((e) => e.soft_tu_duy != null, { message: ' ', path: ['soft_tu_duy'] })
  .refine((e) => e.soft_van_hoa != null, { message: ' ', path: ['soft_van_hoa'] })
  .refine((e) => e.soft_tac_phong != null, { message: ' ', path: ['soft_tac_phong'] })
  .refine((e) => e.xep_hang_chung != null && e.xep_hang_chung !== '', { message: ' ', path: ['xep_hang_chung'] })
  .refine((e) => e.de_xuat != null && e.de_xuat !== '', { message: ' ', path: ['de_xuat'] });

const EMPTY_DANH_GIA: DanhGiaChiTiet = {
  nguoi_phong_van: null,
  hard_nghiep_vu: null,
  hard_kinh_nghiem: null,
  hard_ky_thuat: null,
  soft_giao_tiep: null,
  soft_tu_duy: null,
  soft_van_hoa: null,
  soft_tac_phong: null,
  diem_manh: null,
  diem_yeu: null,
  ky_vong_luong: null,
  xep_hang_chung: null,
  de_xuat: null,
  ghi_chu: null,
};

type ScoreField = 'hard_nghiep_vu' | 'hard_kinh_nghiem' | 'hard_ky_thuat' | 'soft_giao_tiep' | 'soft_tu_duy' | 'soft_van_hoa' | 'soft_tac_phong';

export function DanhGiaForm({ initialData, onClose, onSuccess }: { initialData: LichPhongVan; onClose: () => void; onSuccess?: (row: LichPhongVan) => void }) {
  const update = useUpdateLichPhongVan();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<DanhGiaChiTiet>({ resolver: zodResolver(danhGiaSchema), defaultValues: parseDanhGia(initialData.danh_gia_chi_tiet) ?? EMPTY_DANH_GIA });

  useEffect(() => {
    reset(parseDanhGia(initialData.danh_gia_chi_tiet) ?? EMPTY_DANH_GIA);
  }, [initialData.id, initialData.danh_gia_chi_tiet, reset]);

  const scaleOptions = [{ label: `— ${t('lichPhongVan.danhGia.scaleLabel')} —`, value: '' }, ...[1, 2, 3, 4, 5].map((n) => ({ label: String(n), value: String(n) }))];

  const scoreField = (name: ScoreField, labelKey: string, hintKey: string) => (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div>
          <Select
            label={t(labelKey)}
            required
            options={scaleOptions}
            value={field.value != null ? String(field.value) : ''}
            onChange={(v) => field.onChange(v === '' ? null : Number(v))}
            error={errors[name]?.message}
            searchable={false}
            dropdownInPortal
          />
          <p className="text-xs text-muted-foreground mt-0.5">{t(hintKey)}</p>
        </div>
      )}
    />
  );

  const submit = (v: DanhGiaChiTiet) => {
    const clean: DanhGiaChiTiet = {
      ...v,
      nguoi_phong_van: emptyToNull(v.nguoi_phong_van),
      diem_manh: emptyToNull(v.diem_manh),
      diem_yeu: emptyToNull(v.diem_yeu),
      ky_vong_luong: emptyToNull(v.ky_vong_luong),
      xep_hang_chung: emptyToNull(v.xep_hang_chung),
      de_xuat: emptyToNull(v.de_xuat),
      ghi_chu: emptyToNull(v.ghi_chu),
    };
    update.mutate(
      {
        id: initialData.id,
        data: {
          id_ung_vien: initialData.id_ung_vien,
          so_vong: initialData.so_vong,
          ngay: initialData.ngay,
          gio: initialData.gio,
          hinh_thuc: initialData.hinh_thuc,
          dia_diem: initialData.dia_diem,
          trang_thai: initialData.trang_thai,
          trang_thai_danh_gia: initialData.trang_thai_danh_gia,
          danh_gia_diem_so: initialData.danh_gia_diem_so ?? null,
          danh_gia_nhan_xet: initialData.danh_gia_nhan_xet ?? null,
          ket_qua: initialData.ket_qua ?? null,
          ghi_chu: initialData.ghi_chu ?? null,
          danh_gia_chi_tiet: JSON.stringify(clean),
        },
      },
      {
        onSuccess: (row) => {
          onSuccess?.(row);
          onClose();
        },
      },
    );
  };

  const readonly = 'bg-muted/50';
  return (
    <Drawer
      title={t('lichPhongVan.danhGiaForm.title')}
      subtitle={`${initialData.ten_ung_vien ?? '—'} · ${t('lichPhongVan.detail.lichColVong')} ${initialData.so_vong}`}
      icon={<Award size={20} />}
      onClose={onClose}
      maxWidthClass={DRAWER_WIDTH}
      footer={
        <FormFooter
          formId="lich-phong-van-danh-gia-form"
          onCancel={onClose}
          isLoading={update.isPending}
          isEdit
          saveLabel={t('lichPhongVan.form.save')}
          createLabel={t('lichPhongVan.form.save')}
        />
      }
    >
      <form id="lich-phong-van-danh-gia-form" onSubmit={handleSubmit(submit)} className="space-y-5">
        <FormSection title={t('lichPhongVan.danhGia.sectionBasic')} icon={<User size={14} />}>
          <FormGrid cols={2}>
            <div className="col-span-2">
              <Input label={t('lichPhongVan.danhGia.hoTenUngVien')} value={initialData.ten_ung_vien ?? '—'} readOnly disabled className={readonly} />
            </div>
            <Input label={t('lichPhongVan.danhGia.viTriUngTuyen')} value={initialData.ma_de_xuat ?? '—'} readOnly disabled className={readonly} />
            <Input label={t('lichPhongVan.danhGia.ngayPhongVan')} value={`${initialData.ngay} – ${initialData.gio}`} readOnly disabled className={readonly} />
            <div className="col-span-2">
              <Input
                label={t('lichPhongVan.danhGia.nguoiPhongVan')}
                placeholder={t('lichPhongVan.danhGia.nguoiPhongVanPlaceholder')}
                required
                {...register('nguoi_phong_van')}
                error={errors.nguoi_phong_van?.message}
              />
            </div>
          </FormGrid>
        </FormSection>
        <FormSection title={t('lichPhongVan.danhGia.sectionHard')} icon={<Briefcase size={14} />}>
          <FormGrid cols={3}>
            {scoreField('hard_nghiep_vu', 'lichPhongVan.danhGia.hardNghiepVu', 'lichPhongVan.danhGia.hardNghiepVuHint')}
            {scoreField('hard_kinh_nghiem', 'lichPhongVan.danhGia.hardKinhNghiem', 'lichPhongVan.danhGia.hardKinhNghiemHint')}
            {scoreField('hard_ky_thuat', 'lichPhongVan.danhGia.hardKyThuat', 'lichPhongVan.danhGia.hardKyThuatHint')}
          </FormGrid>
        </FormSection>
        <FormSection title={t('lichPhongVan.danhGia.sectionSoft')} icon={<MessageSquare size={14} />}>
          <FormGrid cols={2}>
            {scoreField('soft_giao_tiep', 'lichPhongVan.danhGia.softGiaoTiep', 'lichPhongVan.danhGia.softGiaoTiepHint')}
            {scoreField('soft_tu_duy', 'lichPhongVan.danhGia.softTuDuy', 'lichPhongVan.danhGia.softTuDuyHint')}
            {scoreField('soft_van_hoa', 'lichPhongVan.danhGia.softVanHoa', 'lichPhongVan.danhGia.softVanHoaHint')}
            {scoreField('soft_tac_phong', 'lichPhongVan.danhGia.softTacPhong', 'lichPhongVan.danhGia.softTacPhongHint')}
          </FormGrid>
        </FormSection>
        <FormSection title={t('lichPhongVan.danhGia.sectionNhanXet')} icon={<MessageSquare size={14} />}>
          <FormGrid cols={1}>
            <Textarea label={t('lichPhongVan.danhGia.diemManh')} placeholder={t('lichPhongVan.danhGia.diemManhPlaceholder')} {...register('diem_manh')} rows={3} />
            <Textarea label={t('lichPhongVan.danhGia.diemYeu')} placeholder={t('lichPhongVan.danhGia.diemYeuPlaceholder')} {...register('diem_yeu')} rows={3} />
            <Input label={t('lichPhongVan.danhGia.kyVongLuong')} placeholder={t('lichPhongVan.danhGia.kyVongLuongPlaceholder')} {...register('ky_vong_luong')} />
          </FormGrid>
        </FormSection>
        <FormSection title={t('lichPhongVan.danhGia.sectionKetLuan')} icon={<CircleCheck size={14} />}>
          <FormGrid cols={2}>
            <Controller
              name="xep_hang_chung"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('lichPhongVan.danhGia.xepHangChung')}
                  required
                  options={[{ label: '—', value: '' }, ...XEP_HANG.map((x) => ({ label: t(x.labelKey), value: x.value }))]}
                  value={field.value ?? ''}
                  onChange={(v) => field.onChange(v === '' ? null : v)}
                  error={errors.xep_hang_chung?.message}
                  searchable={false}
                  dropdownInPortal
                />
              )}
            />
            <Controller
              name="de_xuat"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('lichPhongVan.danhGia.deXuatLabel')}
                  required
                  options={[{ label: '—', value: '' }, ...DE_XUAT.map((x) => ({ label: t(x.labelKey), value: x.value }))]}
                  value={field.value ?? ''}
                  onChange={(v) => field.onChange(v === '' ? null : v)}
                  error={errors.de_xuat?.message}
                  searchable={false}
                  dropdownInPortal
                />
              )}
            />
            <div className="col-span-2">
              <Textarea label={t('lichPhongVan.danhGia.ghiChu')} {...register('ghi_chu')} rows={2} error={errors.ghi_chu?.message} />
            </div>
          </FormGrid>
        </FormSection>
      </form>
    </Drawer>
  );
}
