import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ExternalLink, FileText, Pin, PinOff, Power, Shield } from 'lucide-react';
import { t } from '@/lib/i18n';
import { formatDate, formatDateTime } from '@/lib/format';
import { useConfirm } from '@/stores/confirm';
import { usePositions } from '@/modules/shared/orgData';
import { Drawer, DRAWER_WIDTH } from '@/components/ui/Drawer';
import { Select } from '@/components/ui/Select';
import { DetailField, DetailFooter, DetailSection, QuickActions } from '@/components/ui/Sections';
import { DEFAULT_STATUS_COLOR, HUONG_BADGE, huongLabel, useHoSoByTaiLieu, useSetPhanQuyen, useTrangThaiTaiLieu, useUpdateTaiLieu, type TaiLieu } from './data';
import { PhanQuyenModal } from './PhanQuyenModal';

export function StatusBadge({ name, color }: { name?: string; color?: string }) {
  const c = color || DEFAULT_STATUS_COLOR;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border border-border" style={{ backgroundColor: `${c}20`, color: c, borderColor: `${c}40` }}>
      {name || '—'}
    </span>
  );
}

/** Ngăn kéo chi tiết tài liệu. */
export function TaiLieuDetail({
  data,
  onClose,
  onEdit,
  onDelete,
  isPinned,
  onTogglePin,
}: {
  data: TaiLieu;
  onClose: () => void;
  onEdit: (row: TaiLieu) => void;
  onDelete?: (id: string) => void;
  isPinned: boolean;
  onTogglePin?: () => void;
}) {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const update = useUpdateTaiLieu();
  const [phanQuyenOpen, setPhanQuyenOpen] = useState(false);
  const setPhanQuyen = useSetPhanQuyen(() => setPhanQuyenOpen(false));
  const { data: statuses = [] } = useTrangThaiTaiLieu();
  const { data: hoSo = [] } = useHoSoByTaiLieu(data.id);
  const { data: positions = [] } = usePositions();

  const changeStatus = () => {
    let next = data.id_trang_thai;
    confirm({
      title: t('taiLieu.detail.changeStatusTitle'),
      message: (
        <div className="space-y-4 text-left py-2">
          <p className="text-sm text-muted-foreground">{t('taiLieu.detail.changeStatusMessage')}</p>
          <StatusPicker initial={data.id_trang_thai} options={statuses.map((s) => ({ label: s.ten, value: s.id, subLabel: s.ma }))} onChange={(v) => (next = v)} />
        </div>
      ),
      variant: 'info',
      confirmText: t('common.confirm'),
      onConfirm: async () => {
        await update.mutateAsync({
          id: data.id,
          data: {
            huong: data.huong,
            id_loai: data.id_loai,
            id_nhom_tai_lieu: data.id_nhom_tai_lieu,
            id_trang_thai: next,
            trich_yeu: data.trich_yeu,
            so_den: data.so_den,
            ngay_den: data.ngay_den,
            noi_gui: data.noi_gui,
            so_di: data.so_di,
            ngay_ky: data.ngay_ky,
            noi_nhan: data.noi_nhan,
            id_phong_ban: data.id_phong_ban,
            ghi_chu: data.ghi_chu,
          },
        });
      },
    });
  };

  const actions = [
    { label: t('taiLieu.detail.changeStatus'), icon: <Power size={16} />, onClick: changeStatus, variant: 'info' as const },
    { label: t('taiLieu.detail.phanQuyen'), icon: <Shield size={16} />, onClick: () => setPhanQuyenOpen(true), variant: 'secondary' as const },
    ...(onTogglePin
      ? [{ label: t(isPinned ? 'taiLieu.unpin' : 'taiLieu.pin'), icon: isPinned ? <PinOff size={16} /> : <Pin size={16} />, onClick: onTogglePin, variant: 'warning' as const }]
      : []),
  ];

  const permitted = (data.id_chuc_vu_xem ?? []).map((id) => positions.find((p) => p.id === id)?.ten_chuc_vu).filter(Boolean) as string[];

  return (
    <>
      <Drawer
        title={data.trich_yeu || t('taiLieu.detail.title')}
        icon={<FileText size={20} />}
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
              <FileText size={24} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-foreground leading-tight line-clamp-2">{data.trich_yeu}</h2>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${HUONG_BADGE[data.huong]}`}>{huongLabel(data.huong)}</span>
                {data.ten_trang_thai && <StatusBadge name={data.ten_trang_thai} color={data.mau_trang_thai} />}
                <span className="text-xs text-muted-foreground">{data.ten_loai || data.ma_loai || '—'}</span>
              </div>
            </div>
          </div>
          <QuickActions actions={actions} className="bg-card rounded-xl border border-border" />
          <DetailSection title={t('taiLieu.form.basicInfo')} icon={<FileText size={14} />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailField label={t('taiLieu.form.maSo')} value={data.ma_so || '—'} />
              <DetailField label={t('taiLieu.form.trichYeu')} value={data.trich_yeu} />
              <DetailField label={t('taiLieu.store.huongCol')} value={huongLabel(data.huong)} />
              <DetailField label={t('taiLieu.store.loaiCol')} value={data.ten_loai || data.ma_loai || '—'} />
              <DetailField label={t('taiLieu.store.nhomCol')} value={data.ten_nhom_tai_lieu || '—'} />
              <DetailField label={t('taiLieu.store.trangThaiCol')} value={data.ten_trang_thai ? <StatusBadge name={data.ten_trang_thai} color={data.mau_trang_thai} /> : '—'} />
              <DetailField label={t('taiLieu.store.phongQuanLyCol')} value={data.ten_phong_ban || '—'} />
              <DetailField
                label={t('taiLieu.detail.phanQuyenLabel')}
                value={
                  permitted.length === 0 ? (
                    t('taiLieu.detail.phanQuyenEmpty')
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {permitted.map((name) => (
                        <span key={name} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                          {name}
                        </span>
                      ))}
                    </div>
                  )
                }
              />
              {data.huong !== 'noi_bo' && (
                <>
                  <DetailField label={t('taiLieu.form.soDen')} value={data.so_den || '—'} />
                  <DetailField label={t('taiLieu.form.ngayDen')} value={data.ngay_den ? formatDate(data.ngay_den) : '—'} />
                  <DetailField label={t('taiLieu.form.noiGui')} value={data.noi_gui || '—'} />
                  <DetailField label={t('taiLieu.form.soDi')} value={data.so_di || '—'} />
                  <DetailField label={t('taiLieu.form.ngayKy')} value={data.ngay_ky ? formatDate(data.ngay_ky) : '—'} />
                  <DetailField label={t('taiLieu.form.noiNhan')} value={data.noi_nhan || '—'} />
                </>
              )}
              {data.ghi_chu ? (
                <div className="col-span-1 sm:col-span-2">
                  <DetailField label={t('taiLieu.form.ghiChu')} value={data.ghi_chu} />
                </div>
              ) : null}
              <DetailField label={t('taiLieu.store.updatedCol')} value={formatDateTime(data.tg_cap_nhat)} />
            </div>
          </DetailSection>
          {hoSo.length > 0 && (
            <DetailSection title={t('taiLieu.detail.sectionHoSo')} icon={<FileText size={14} />}>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs text-muted-foreground">{t('taiLieu.detail.hoSoCount', { count: hoSo.length })}</span>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate(`/hanh-chinh/luu-tru-ho-so?tai_lieu_id=${encodeURIComponent(data.id)}`);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                  >
                    {t('taiLieu.detail.viewHoSoList')}
                    <ExternalLink size={12} />
                  </button>
                </div>
                {hoSo.map((h) => (
                  <div key={h.id} className="flex items-center justify-between gap-2 py-2 px-3 rounded-lg bg-muted/50 border border-border">
                    <div>
                      <span className="font-medium text-sm text-foreground">{h.ma_ho_so}</span>
                      <span className="text-sm text-muted-foreground ml-2">{h.ten_ho_so}</span>
                    </div>
                    {h.thoi_han_luu_tru && <span className="text-xs text-muted-foreground">{formatDate(h.thoi_han_luu_tru)}</span>}
                  </div>
                ))}
              </div>
            </DetailSection>
          )}
        </div>
      </Drawer>
      <AnimatePresence>
        {phanQuyenOpen && (
          <PhanQuyenModal
            onClose={() => setPhanQuyenOpen(false)}
            positions={positions.filter((p) => p.trang_thai === 'Đang hoạt động')}
            selectedIds={data.id_chuc_vu_xem ?? []}
            onSave={(ids) => setPhanQuyen.mutate({ id: data.id, id_chuc_vu_xem: ids })}
            title={t('taiLieu.detail.phanQuyenTitle')}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/** Ô chọn trạng thái trong hộp xác nhận "Đổi trạng thái" (giữ giá trị cục bộ để hiển thị lựa chọn). */
function StatusPicker({ initial, options, onChange }: { initial: string; options: { label: string; value: string; subLabel?: string }[]; onChange: (v: string) => void }) {
  const [value, setValue] = useState(initial);
  return (
    <Select
      value={value}
      options={options}
      onChange={(v) => {
        setValue(v);
        onChange(v);
      }}
      dropdownInPortal
    />
  );
}
