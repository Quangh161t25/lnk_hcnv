import { useEffect, useMemo, useState } from 'react';
import { Award, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { t } from '@/lib/i18n';
import {
  QUYET_DINH_LABELS,
  TRANG_THAI_DANH_GIA_LABELS,
  useCreateDanhGia,
  useUpdateDanhGia,
  type DanhGiaThuViec,
  type DanhGiaThuViecInput,
  type QuyetDinhThuViec,
  type TrangThaiDanhGia,
} from './data';

interface DanhGiaFormProps {
  initialData?: DanhGiaThuViec | null;
  onClose: () => void;
}

const TRANG_THAI_OPTIONS = Object.entries(TRANG_THAI_DANH_GIA_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const QUYET_DINH_OPTIONS = [
  { value: '', label: '— Chưa có quyết định —' },
  ...Object.entries(QUYET_DINH_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
];

export function DanhGiaForm({ initialData, onClose }: DanhGiaFormProps) {
  const isEdit = Boolean(initialData);

  const [formData, setFormData] = useState<DanhGiaThuViecInput>({
    id_hop_dong: initialData?.id_hop_dong ?? 'hd-1',
    id_ung_vien: initialData?.id_ung_vien ?? 'uv-1',
    ho_ten: initialData?.ho_ten ?? '',
    vi_tri: initialData?.vi_tri ?? '',
    ten_phong_ban: initialData?.ten_phong_ban ?? '',
    ten_quan_ly: initialData?.ten_quan_ly ?? '',
    ngay_bat_dau_thu_viec: initialData?.ngay_bat_dau_thu_viec ?? new Date().toISOString().slice(0, 10),
    ngay_ket_thuc_thu_viec: initialData?.ngay_ket_thuc_thu_viec ?? new Date().toISOString().slice(0, 10),
    dot_thang: initialData?.dot_thang ?? new Date().toISOString().slice(0, 7),
    dot_quy: initialData?.dot_quy ?? `Q${Math.floor(new Date().getMonth() / 3) + 1}/${new Date().getFullYear()}`,
    diem_chuyen_mon: initialData?.diem_chuyen_mon ?? 4,
    diem_thai_do: initialData?.diem_thai_do ?? 4,
    diem_ky_luat: initialData?.diem_ky_luat ?? 4,
    diem_trung_binh: initialData?.diem_trung_binh ?? 4,
    xep_loai: initialData?.xep_loai ?? 'tot',
    nhan_xet_quan_ly: initialData?.nhan_xet_quan_ly ?? '',
    kho_khan_de_xuat: initialData?.kho_khan_de_xuat ?? '',
    nguyen_vong_lam_viec: initialData?.nguyen_vong_lam_viec ?? '',
    quyet_dinh: initialData?.quyet_dinh ?? null,
    trang_thai: initialData?.trang_thai ?? 'cho_danh_gia',
  });

  // Re-calculate average score & rating
  const avg = useMemo(() => {
    const cm = Number(formData.diem_chuyen_mon) || 0;
    const td = Number(formData.diem_thai_do) || 0;
    const kl = Number(formData.diem_ky_luat) || 0;
    const score = Number(((cm + td + kl) / 3).toFixed(2));
    let xep: 'xuat_sac' | 'tot' | 'kha' | 'trung_binh' | 'kem' = 'trung_binh';
    if (score >= 4.5) xep = 'xuat_sac';
    else if (score >= 4.0) xep = 'tot';
    else if (score >= 3.0) xep = 'kha';
    else if (score >= 2.0) xep = 'trung_binh';
    else xep = 'kem';
    return { score, xep };
  }, [formData.diem_chuyen_mon, formData.diem_thai_do, formData.diem_ky_luat]);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      diem_trung_binh: avg.score,
      xep_loai: avg.xep,
    }));
  }, [avg]);

  const createMut = useCreateDanhGia();
  const updateMut = useUpdateDanhGia();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit && initialData) {
      updateMut.mutate({ id: initialData.id, data: formData }, { onSuccess: onClose });
    } else {
      createMut.mutate(formData, { onSuccess: onClose });
    }
  };

  const isPending = createMut.isPending || updateMut.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Award size={20} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                {isEdit ? 'Cập nhật đánh giá thử việc' : t('danhGiaThuViec.add')}
              </h3>
              <p className="text-xs text-muted-foreground">{formData.ho_ten || 'Phiếu đánh giá nhân sự thử việc'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Thông tin nhân viên */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                {t('danhGiaThuViec.table.hoTen')} <span className="text-rose-500">*</span>
              </label>
              <Input
                value={formData.ho_ten}
                onChange={(e) => setFormData((s) => ({ ...s, ho_ten: e.target.value }))}
                required
                className="text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                {t('danhGiaThuViec.table.viTri')} <span className="text-rose-500">*</span>
              </label>
              <Input
                value={formData.vi_tri}
                onChange={(e) => setFormData((s) => ({ ...s, vi_tri: e.target.value }))}
                required
                className="text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                {t('danhGiaThuViec.table.phongBan')} <span className="text-rose-500">*</span>
              </label>
              <Input
                value={formData.ten_phong_ban}
                onChange={(e) => setFormData((s) => ({ ...s, ten_phong_ban: e.target.value }))}
                required
                className="text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                {t('danhGiaThuViec.table.quanLyTrucTiep')} <span className="text-rose-500">*</span>
              </label>
              <Input
                value={formData.ten_quan_ly}
                onChange={(e) => setFormData((s) => ({ ...s, ten_quan_ly: e.target.value }))}
                required
                className="text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                {t('danhGiaThuViec.table.ngayBatDau')}
              </label>
              <Input
                type="date"
                value={formData.ngay_bat_dau_thu_viec}
                onChange={(e) => setFormData((s) => ({ ...s, ngay_bat_dau_thu_viec: e.target.value }))}
                className="text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                {t('danhGiaThuViec.table.ngayKetThuc')}
              </label>
              <Input
                type="date"
                value={formData.ngay_ket_thuc_thu_viec}
                onChange={(e) => setFormData((s) => ({ ...s, ngay_ket_thuc_thu_viec: e.target.value }))}
                className="text-sm"
              />
            </div>
          </div>

          {/* Tiêu chí chấm điểm 1-5 */}
          <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Chấm điểm tiêu chí (Thang điểm 1 - 5)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Chuyên môn kỹ thuật: <strong className="text-foreground">{formData.diem_chuyen_mon}</strong>
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="0.5"
                  value={formData.diem_chuyen_mon ?? 4}
                  onChange={(e) => setFormData((s) => ({ ...s, diem_chuyen_mon: parseFloat(e.target.value) }))}
                  className="w-full accent-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Thái độ & Trách nhiệm: <strong className="text-foreground">{formData.diem_thai_do}</strong>
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="0.5"
                  value={formData.diem_thai_do ?? 4}
                  onChange={(e) => setFormData((s) => ({ ...s, diem_thai_do: parseFloat(e.target.value) }))}
                  className="w-full accent-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Kỷ luật & Chuyên cần: <strong className="text-foreground">{formData.diem_ky_luat}</strong>
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="0.5"
                  value={formData.diem_ky_luat ?? 4}
                  onChange={(e) => setFormData((s) => ({ ...s, diem_ky_luat: parseFloat(e.target.value) }))}
                  className="w-full accent-primary"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-xs text-muted-foreground">Điểm trung bình tự tính:</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-primary font-mono">{formData.diem_trung_binh} / 5.0</span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase">
                  Xếp loại: {formData.xep_loai}
                </span>
              </div>
            </div>
          </div>

          {/* Nhận xét & Quyết định */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Nhận xét của quản lý trực tiếp
              </label>
              <textarea
                value={formData.nhan_xet_quan_ly ?? ''}
                onChange={(e) => setFormData((s) => ({ ...s, nhan_xet_quan_ly: e.target.value }))}
                rows={2}
                placeholder="Đánh giá kết quả công việc, ưu điểm, nhược điểm..."
                className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Đề xuất quyết định
                </label>
                <Select
                  options={QUYET_DINH_OPTIONS}
                  value={formData.quyet_dinh ?? ''}
                  onChange={(v) => setFormData((s) => ({ ...s, quyet_dinh: (v as QuyetDinhThuViec) || null }))}
                  className="w-full text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Trạng thái phiếu
                </label>
                <Select
                  options={TRANG_THAI_OPTIONS}
                  value={formData.trang_thai}
                  onChange={(v) => setFormData((s) => ({ ...s, trang_thai: v as TrangThaiDanhGia }))}
                  className="w-full text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {isPending ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
