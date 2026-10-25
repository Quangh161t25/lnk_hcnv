import { useMemo } from 'react';
import { Briefcase, Calendar, ExternalLink, FileText, SquarePen, Trash2, User } from 'lucide-react';
import { t } from '@/lib/i18n';
import { formatDateTime } from '@/lib/format';
import { extractYear } from '@/lib/utils';
import { useConfirm } from '@/stores/confirm';
import { Drawer, DRAWER_WIDTH } from '@/components/ui/Drawer';
import { DetailField, DetailFooter, DetailSection, TableSection, subTdActions, subTh, subThActions } from '@/components/ui/Sections';
import { BADGE, sourceBadgeColor, statusBadgeColor } from '../tuyen-dung/badges';
import { useLichPhongVan, useUpdateUngVien, type LichPhongVan, type TaiLieuUngVien, type UngVien, type UngVienInput } from '../tuyen-dung/data';
import { LichPhongVanSection } from '../lich-phong-van/components';

function toInput(row: UngVien, docs?: TaiLieuUngVien[]): UngVienInput {
  return {
    ho_ten: row.ho_ten,
    email: row.email,
    so_dien_thoai: row.so_dien_thoai ?? '',
    dia_chi: row.dia_chi ?? null,
    ngay_sinh: row.ngay_sinh ?? null,
    ghi_chu_noi_bo: row.ghi_chu_noi_bo ?? null,
    id_de_xuat_tuyen_dung: row.id_de_xuat_tuyen_dung,
    id_trang_thai_ung_vien: row.id_trang_thai_ung_vien,
    id_kenh_tuyen_dung: row.id_kenh_tuyen_dung ?? null,
    ngay_phong_van_gan_nhat: row.ngay_phong_van_gan_nhat ?? null,
    ket_qua_phan_hoi_gan_nhat: row.ket_qua_phan_hoi_gan_nhat ?? null,
    tai_lieu: docs ?? row.tai_lieu ?? [],
  };
}

function DocumentsSection({ items, onAdd, onEdit, onDelete }: { items: TaiLieuUngVien[]; onAdd: () => void; onEdit: () => void; onDelete: (doc: TaiLieuUngVien) => void }) {
  return (
    <TableSection
      title={t('ungVien.detail.taiLieu')}
      icon={<FileText size={14} className="text-primary" />}
      count={items.length}
      addLabel={t('ungVien.form.addFile')}
      onAdd={onAdd}
      emptyTitle={t('ungVien.detail.noDocuments')}
      emptyDescription={t('ungVien.detail.noDocuments')}
      emptyIcon={<FileText className="w-10 h-10 text-muted-foreground" />}
    >
      {items.length > 0 ? (
        <>
          <thead className="sticky top-0 z-[1] bg-muted border-b border-border">
            <tr>
              <th className={subTh}>#</th>
              <th className={subTh}>{t('ungVien.form.tenFile')}</th>
              <th className={subTh}>{t('ungVien.form.loaiFile')}</th>
              <th className={subTh}>{t('ungVien.form.linkLabel')}</th>
              <th className={subThActions}>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody className="[&>tr>td]:border-b [&>tr>td]:border-border">
            {items.map((doc, i) => (
              <tr key={doc.id} className="hover:bg-muted/60 transition-colors">
                <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{i + 1}</td>
                <td className="px-4 py-2.5 text-foreground">{doc.ten_file || t('ungVien.noValue')}</td>
                <td className="px-4 py-2.5 text-foreground">{doc.loai || t('ungVien.noValue')}</td>
                <td className="px-4 py-2.5 text-foreground">
                  {doc.link ? (
                    <a
                      href={doc.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline truncate max-w-[180px]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink size={12} />
                      {t('common.view')}
                    </a>
                  ) : (
                    <span className="text-muted-foreground text-xs">{t('ungVien.noValue')}</span>
                  )}
                </td>
                <td className={subTdActions} onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-center gap-0.5">
                    <button type="button" onClick={onEdit} className="p-1.5 text-primary hover:bg-primary/10 rounded-md transition-all" title={t('common.edit')}>
                      <SquarePen size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(doc)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-all"
                      title={t('common.delete')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </>
      ) : null}
    </TableSection>
  );
}

/** Ngăn kéo chi tiết ứng viên. */
export function UngVienDetail({
  data,
  onClose,
  onEdit,
  onDelete,
  onAddLichPhongVan,
  onViewLichPhongVan,
  onEditLichPhongVan,
  onDeleteLichPhongVan,
}: {
  data: UngVien;
  onClose: () => void;
  onEdit: (row: UngVien) => void;
  onDelete?: (id: string) => void;
  onAddLichPhongVan?: () => void;
  onViewLichPhongVan?: (row: LichPhongVan) => void;
  onEditLichPhongVan?: (row: LichPhongVan) => void;
  onDeleteLichPhongVan?: (row: LichPhongVan) => void;
}) {
  const confirm = useConfirm();
  const update = useUpdateUngVien();
  const { data: schedules = [], isLoading } = useLichPhongVan();
  const mine = useMemo(() => schedules.filter((s) => s.id_ung_vien === data.id), [schedules, data.id]);
  const editAndClose = () => {
    onEdit(data);
    onClose();
  };
  const removeDoc = (doc: TaiLieuUngVien) =>
    confirm({
      title: t('ungVien.deleteTitle'),
      message: t('ungVien.deleteDocMessage'),
      confirmText: t('common.delete'),
      variant: 'danger',
      onConfirm: () => update.mutate({ id: data.id, data: toInput(data, (data.tai_lieu ?? []).filter((d) => d.id !== doc.id)) }),
    });
  const year = extractYear(data.ngay_sinh);

  return (
    <Drawer
      title={data.ho_ten}
      subtitle={data.email}
      icon={<User size={20} />}
      onClose={onClose}
      maxWidthClass={DRAWER_WIDTH}
      footer={
        <DetailFooter
          onClose={onClose}
          onEdit={editAndClose}
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
            <User size={24} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground leading-tight truncate">{data.ho_ten}</h2>
            <p className="text-body-sm text-muted-foreground truncate">{data.email}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className={`${BADGE} ${statusBadgeColor(data.id_trang_thai_ung_vien)}`}>{data.ten_trang_thai ?? t('ungVien.noValue')}</span>
              {data.id_kenh_tuyen_dung && (
                <span className={`${BADGE} ${sourceBadgeColor(data.id_kenh_tuyen_dung)}`}>{data.ten_kenh_tuyen_dung ?? t('ungVien.noValue')}</span>
              )}
            </div>
          </div>
        </div>

        <DetailSection title={t('ungVien.detail.basicInfo')} icon={<User size={14} />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailField label={t('ungVien.form.hoTen')} value={data.ho_ten} />
            <DetailField label={t('ungVien.form.email')} value={data.email} />
            <DetailField label={t('ungVien.form.soDienThoai')} value={data.so_dien_thoai || t('ungVien.noValue')} />
            {data.dia_chi && <DetailField label={t('ungVien.form.diaChi')} value={data.dia_chi} className="sm:col-span-2" />}
            {data.ngay_sinh && <DetailField label={t('ungVien.form.ngaySinh')} value={data.ngay_sinh} />}
            <DetailField label={t('ungVien.detail.namSinh')} value={year != null ? String(year) : t('ungVien.noValue')} />
          </div>
        </DetailSection>

        <DetailSection title={t('ungVien.detail.viTriUngTuyen')} icon={<Briefcase size={14} />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailField label={t('ungVien.store.viTriCol')} value={data.ma_de_xuat ?? t('ungVien.noValue')} />
            <DetailField label={t('ungVien.stats.chucVu')} value={data.ten_chuc_vu ?? t('ungVien.noValue')} />
            <div className="sm:col-span-2">
              <p className="text-xs font-medium text-muted-foreground mb-1">{t('ungVien.detail.trangThai')}</p>
              <span className={`inline-block ${BADGE} ${statusBadgeColor(data.id_trang_thai_ung_vien)} w-fit`}>{data.ten_trang_thai ?? t('ungVien.noValue')}</span>
            </div>
            {data.id_kenh_tuyen_dung ? (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">{t('ungVien.detail.nguon')}</p>
                <span className={`inline-block ${BADGE} ${sourceBadgeColor(data.id_kenh_tuyen_dung)} w-fit`}>{data.ten_kenh_tuyen_dung ?? t('ungVien.noValue')}</span>
              </div>
            ) : null}
          </div>
        </DetailSection>

        <DetailSection title={t('ungVien.detail.phongVanGanNhat')} icon={<Calendar size={14} />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailField label={t('ungVien.detail.ngayPv')} value={data.ngay_phong_van_gan_nhat ? formatDateTime(data.ngay_phong_van_gan_nhat) : t('ungVien.noValue')} />
            <DetailField label={t('ungVien.detail.ketQua')} value={data.ket_qua_phan_hoi_gan_nhat || t('ungVien.noValue')} className="sm:col-span-2" />
          </div>
        </DetailSection>

        <DocumentsSection items={data.tai_lieu ?? []} onAdd={editAndClose} onEdit={editAndClose} onDelete={removeDoc} />
        <LichPhongVanSection
          items={mine}
          loading={isLoading}
          addLabel={t('lichPhongVan.detail.addLich')}
          onAdd={onAddLichPhongVan}
          onView={onViewLichPhongVan}
          onEdit={onEditLichPhongVan}
          onDelete={onDeleteLichPhongVan}
        />

        {data.ghi_chu_noi_bo && data.ghi_chu_noi_bo.trim() !== '' && (
          <DetailSection title={t('ungVien.detail.ghiChuNoiBo')} icon={<FileText size={14} />}>
            <p className="text-body-sm text-foreground whitespace-pre-wrap">{data.ghi_chu_noi_bo}</p>
          </DetailSection>
        )}
      </div>
    </Drawer>
  );
}
