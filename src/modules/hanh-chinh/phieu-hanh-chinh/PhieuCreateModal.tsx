import { useState } from 'react';
import { FilePenLine, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { t } from '@/lib/i18n';
import {
  LOAI_PHIEU_LABELS,
  useCreatePhieu,
  type LoaiPhieu,
  type PhieuHanhChinhInput,
} from './data';

interface PhieuCreateModalProps {
  onClose: () => void;
}

const LOAI_OPTIONS = Object.entries(LOAI_PHIEU_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const NGUOI_DUYET_OPTIONS = [
  { value: 'Nguyễn Văn Quản Trị (Tổng Giám Đốc)', label: 'Nguyễn Văn Quản Trị (Tổng Giám Đốc)' },
  { value: 'Trần Minh Quân (Trưởng phòng Công nghệ)', label: 'Trần Minh Quân (Trưởng phòng Công nghệ)' },
  { value: 'Vũ Thị Hồng (Kế toán trưởng)', label: 'Vũ Thị Hồng (Kế toán trưởng)' },
  { value: 'Hoàng Lan Anh (Trưởng phòng HCNS)', label: 'Hoàng Lan Anh (Trưởng phòng HCNS)' },
];

export function PhieuCreateModal({ onClose }: PhieuCreateModalProps) {
  const [formData, setFormData] = useState<PhieuHanhChinhInput>({
    user_id: 'u-1',
    user_name: 'Nguyễn Văn Quản Trị',
    department_name: 'Ban Giám Đốc',
    loai_phieu: 'nghi_phep',
    tu_ngay: new Date().toISOString().slice(0, 10),
    den_ngay: new Date().toISOString().slice(0, 10),
    so_luong: 1,
    don_vi: 'ngày',
    ly_do: '',
    nguoi_duyet: NGUOI_DUYET_OPTIONS[0].value,
  });

  const createMut = useCreatePhieu();

  const handleLoaiChange = (val: string) => {
    const loai = val as LoaiPhieu;
    const don_vi = loai === 'lam_them' || loai === 'di_muon_ve_som' ? 'giờ' : 'ngày';
    setFormData((prev) => ({
      ...prev,
      loai_phieu: loai,
      don_vi,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMut.mutate(formData, {
      onSuccess: () => onClose(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <FilePenLine size={20} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Tạo phiếu hành chính mới</h3>
              <p className="text-xs text-muted-foreground">Đơn xin nghỉ, làm thêm, công tác, đi muộn về sớm</p>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Loại phiếu <span className="text-rose-500">*</span>
            </label>
            <Select
              options={LOAI_OPTIONS}
              value={formData.loai_phieu}
              onChange={handleLoaiChange}
              className="w-full text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Từ ngày / giờ <span className="text-rose-500">*</span>
              </label>
              <Input
                type={formData.don_vi === 'giờ' ? 'datetime-local' : 'date'}
                value={formData.tu_ngay}
                onChange={(e) => setFormData((s) => ({ ...s, tu_ngay: e.target.value }))}
                required
                className="text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Đến ngày / giờ <span className="text-rose-500">*</span>
              </label>
              <Input
                type={formData.don_vi === 'giờ' ? 'datetime-local' : 'date'}
                value={formData.den_ngay}
                onChange={(e) => setFormData((s) => ({ ...s, den_ngay: e.target.value }))}
                required
                className="text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Số lượng ({formData.don_vi}) <span className="text-rose-500">*</span>
              </label>
              <Input
                type="number"
                step="0.5"
                min="0.5"
                value={formData.so_luong}
                onChange={(e) => setFormData((s) => ({ ...s, so_luong: parseFloat(e.target.value) || 1 }))}
                required
                className="text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Người phê duyệt <span className="text-rose-500">*</span>
              </label>
              <Select
                options={NGUOI_DUYET_OPTIONS}
                value={formData.nguoi_duyet}
                onChange={(v) => setFormData((s) => ({ ...s, nguoi_duyet: v }))}
                className="w-full text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Lý do chi tiết <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={formData.ly_do}
              onChange={(e) => setFormData((s) => ({ ...s, ly_do: e.target.value }))}
              rows={3}
              placeholder="Nhập lý do gửi phiếu..."
              required
              className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={createMut.isPending}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {createMut.isPending ? t('common.saving') : 'Gửi phiếu duyệt'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
