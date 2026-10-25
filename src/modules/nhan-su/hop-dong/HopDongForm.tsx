import { useState } from 'react';
import { FilePenLine, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { t } from '@/lib/i18n';
import ungVienSeed from '@/data/ungVien.json';
import jobLevelsSeed from '@/data/jobLevels.json';
import {
  useCreateHopDong,
  useUpdateHopDong,
  type HopDong,
  type HopDongInput,
  type LoaiHopDong,
  type TrangThaiHopDong,
} from './data';

interface HopDongFormProps {
  initialData?: HopDong | null;
  prefillFromHopDong?: HopDong | null;
  onClose: () => void;
}

const LOAI_OPTIONS: { value: LoaiHopDong; label: string }[] = [
  { value: 'thu-viec', label: 'Hợp đồng thử việc' },
  { value: 'chinh-thuc', label: 'Hợp đồng lao động chính thức' },
  { value: 'hoc-viec', label: 'Hợp đồng học việc' },
  { value: 'thoi-vu', label: 'Hợp đồng thời vụ' },
  { value: 'part-time', label: 'Hợp đồng bán thời gian' },
];

const TRANG_THAI_OPTIONS: { value: TrangThaiHopDong; label: string }[] = [
  { value: 'hieu_luc', label: 'Hiệu lực' },
  { value: 'het_han', label: 'Hết hạn' },
  { value: 'sap_het_han', label: 'Sắp hết hạn' },
  { value: 'thanh_ly', label: 'Đã thanh lý' },
  { value: 'bi_huy', label: 'Bị hủy' },
];

export function HopDongForm({ initialData, prefillFromHopDong, onClose }: HopDongFormProps) {
  const isEdit = Boolean(initialData);

  const ungVienOptions = (ungVienSeed as any[]).map((u) => ({
    value: u.id,
    label: `${u.ho_ten} (${u.email || u.so_dien_thoai || 'Ứng viên'})`,
  }));

  const jobLevelOptions = (jobLevelsSeed as any[]).map((j) => ({
    value: `${j.code} - ${j.title}`,
    label: `${j.code} - ${j.title}`,
  }));

  const defaultLoai: LoaiHopDong = prefillFromHopDong ? 'chinh-thuc' : initialData?.loai_hop_dong ?? 'thu-viec';
  const defaultSoHD =
    initialData?.so_hop_dong ??
    `${defaultLoai === 'chinh-thuc' ? 'HDCT' : 'HDTV'}-${new Date().getFullYear()}-${String(
      Math.floor(Math.random() * 900) + 100
    )}`;

  const [formData, setFormData] = useState<HopDongInput>({
    id_ung_vien: prefillFromHopDong?.id_ung_vien ?? initialData?.id_ung_vien ?? ungVienOptions[0]?.value ?? '',
    so_hop_dong: defaultSoHD,
    loai_hop_dong: defaultLoai,
    ngay_bat_dau: prefillFromHopDong ? new Date().toISOString().slice(0, 10) : initialData?.ngay_bat_dau ?? new Date().toISOString().slice(0, 10),
    ngay_ket_thuc: initialData?.ngay_ket_thuc ?? null,
    ngay_vao_lam: prefillFromHopDong?.ngay_vao_lam ?? initialData?.ngay_vao_lam ?? new Date().toISOString().slice(0, 10),
    bac_luong: prefillFromHopDong?.bac_luong ?? initialData?.bac_luong ?? jobLevelOptions[0]?.value ?? 'L_04 - Nhân viên',
    muc_luong: prefillFromHopDong?.muc_luong ?? initialData?.muc_luong ?? '15.000.000 VND/tháng',
    id_hop_dong_goc: prefillFromHopDong?.id ?? initialData?.id_hop_dong_goc ?? null,
    co_che_khac: prefillFromHopDong?.co_che_khac ?? initialData?.co_che_khac ?? 'BHXH, BHYT, BHTN theo quy định',
    ghi_chu: initialData?.ghi_chu ?? null,
    ghi_chu_khac: initialData?.ghi_chu_khac ?? null,
    trang_thai: initialData?.trang_thai ?? 'hieu_luc',
  });

  const createMut = useCreateHopDong();
  const updateMut = useUpdateHopDong();

  const handleLoaiChange = (val: string) => {
    const loai = val as LoaiHopDong;
    const prefix = loai === 'chinh-thuc' ? 'HDCT' : loai === 'thu-viec' ? 'HDTV' : 'HD';
    const soHD = !isEdit
      ? `${prefix}-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`
      : formData.so_hop_dong;
    setFormData((prev) => ({
      ...prev,
      loai_hop_dong: loai,
      so_hop_dong: soHD,
      ngay_ket_thuc: loai === 'chinh-thuc' ? null : prev.ngay_ket_thuc,
    }));
  };

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
              <FilePenLine size={20} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                {isEdit
                  ? t('hopDong.edit')
                  : prefillFromHopDong
                  ? t('hopDong.createChinhThuc')
                  : t('hopDong.add')}
              </h3>
              <p className="text-xs text-muted-foreground">{t('hopDong.form.basicInfo')}</p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                {t('hopDong.table.ungVien')} <span className="text-rose-500">*</span>
              </label>
              <Select
                options={ungVienOptions}
                value={formData.id_ung_vien}
                onChange={(v) => setFormData((s) => ({ ...s, id_ung_vien: v }))}
                className="w-full text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                {t('hopDong.table.loaiHopDong')} <span className="text-rose-500">*</span>
              </label>
              <Select
                options={LOAI_OPTIONS}
                value={formData.loai_hop_dong}
                onChange={handleLoaiChange}
                className="w-full text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                {t('hopDong.table.soHopDong')} <span className="text-rose-500">*</span>
              </label>
              <Input
                value={formData.so_hop_dong}
                onChange={(e) => setFormData((s) => ({ ...s, so_hop_dong: e.target.value }))}
                required
                className="font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                {t('hopDong.table.trangThai')}
              </label>
              <Select
                options={TRANG_THAI_OPTIONS}
                value={formData.trang_thai}
                onChange={(v) => setFormData((s) => ({ ...s, trang_thai: v as TrangThaiHopDong }))}
                className="w-full text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                {t('hopDong.table.ngayBatDau')} <span className="text-rose-500">*</span>
              </label>
              <Input
                type="date"
                value={formData.ngay_bat_dau}
                onChange={(e) => setFormData((s) => ({ ...s, ngay_bat_dau: e.target.value }))}
                required
                className="text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                {t('hopDong.table.ngayKetThuc')} {formData.loai_hop_dong === 'chinh-thuc' ? '(Không xác định thời hạn)' : ''}
              </label>
              <Input
                type="date"
                value={formData.ngay_ket_thuc ?? ''}
                onChange={(e) => setFormData((s) => ({ ...s, ngay_ket_thuc: e.target.value || null }))}
                className="text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                {t('hopDong.ngayVaoLam')}
              </label>
              <Input
                type="date"
                value={formData.ngay_vao_lam ?? ''}
                onChange={(e) => setFormData((s) => ({ ...s, ngay_vao_lam: e.target.value || null }))}
                className="text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                {t('hopDong.bacLuong')}
              </label>
              <Select
                options={jobLevelOptions}
                value={formData.bac_luong ?? ''}
                onChange={(v) => setFormData((s) => ({ ...s, bac_luong: v }))}
                className="w-full text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-foreground mb-1.5">
                {t('hopDong.mucLuong')} <span className="text-rose-500">*</span>
              </label>
              <Input
                value={formData.muc_luong ?? ''}
                onChange={(e) => setFormData((s) => ({ ...s, muc_luong: e.target.value }))}
                placeholder={t('hopDong.mucLuongPlaceholder')}
                required
                className="text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                {t('hopDong.coCheKhac')}
              </label>
              <Input
                value={formData.co_che_khac ?? ''}
                onChange={(e) => setFormData((s) => ({ ...s, co_che_khac: e.target.value }))}
                placeholder={t('hopDong.coCheKhacPlaceholder')}
                className="text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                {t('hopDong.ghiChuKhac')}
              </label>
              <textarea
                value={formData.ghi_chu_khac ?? ''}
                onChange={(e) => setFormData((s) => ({ ...s, ghi_chu_khac: e.target.value }))}
                rows={2}
                placeholder={t('hopDong.ghiChuKhacPlaceholder')}
                className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
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
