import { useState } from 'react';
import { FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { t } from '@/lib/i18n';
import { useCreatePhieuThanhLy, type HopDong } from './data';

interface PhieuThanhLyModalProps {
  hopDong: HopDong;
  onClose: () => void;
}

const LY_DO_OPTIONS = [
  { value: 'Nghỉ việc theo nguyện vọng', label: 'Nghỉ việc theo nguyện vọng' },
  { value: 'Hết hạn hợp đồng', label: 'Hết hạn hợp đồng' },
  { value: 'Thỏa thuận chấm dứt', label: 'Thỏa thuận hai bên' },
  { value: 'Vi phạm kỷ luật lao động', label: 'Vi phạm kỷ luật' },
  { value: 'Khác', label: 'Lý do khác' },
];

export function PhieuThanhLyModal({ hopDong, onClose }: PhieuThanhLyModalProps) {
  const [soPhieu] = useState(`PTL-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`);
  const [ngayThanhLy, setNgayThanhLy] = useState(new Date().toISOString().slice(0, 10));
  const [lyDo, setLyDo] = useState(LY_DO_OPTIONS[0].value);
  const [ghiChu, setGhiChu] = useState('');

  const createPhieu = useCreatePhieuThanhLy();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPhieu.mutate(
      {
        id_hop_dong: hopDong.id,
        so_phieu: soPhieu,
        ngay_thanh_ly: ngayThanhLy,
        ly_do: lyDo,
        ghi_chu: ghiChu.trim() || null,
      },
      {
        onSuccess: () => onClose(),
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/40">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600">
              <FileText size={18} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">{t('hopDong.phieuThanhLy.title')}</h3>
              <p className="text-xs text-muted-foreground">{hopDong.so_hop_dong} • {hopDong.ten_ung_vien}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Số phiếu thanh lý
            </label>
            <Input value={soPhieu} readOnly className="bg-muted/50 font-mono text-sm" />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              {t('hopDong.phieuThanhLy.ngayThanhLy')} <span className="text-rose-500">*</span>
            </label>
            <Input
              type="date"
              value={ngayThanhLy}
              onChange={(e) => setNgayThanhLy(e.target.value)}
              required
              className="text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              {t('hopDong.phieuThanhLy.lyDo')} <span className="text-rose-500">*</span>
            </label>
            <Select
              options={LY_DO_OPTIONS}
              value={lyDo}
              onChange={(v) => setLyDo(v)}
              className="w-full text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              {t('hopDong.ghiChu')} / Bàn giao
            </label>
            <textarea
              value={ghiChu}
              onChange={(e) => setGhiChu(e.target.value)}
              rows={3}
              placeholder="Ghi chú bàn giao tài sản, công việc..."
              className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={createPhieu.isPending}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {createPhieu.isPending ? t('common.saving') : 'Xác nhận thanh lý'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
