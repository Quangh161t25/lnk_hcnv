import { Award, FilePenLine, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/format';
import { t } from '@/lib/i18n';
import {
  QUYET_DINH_BADGE,
  QUYET_DINH_LABELS,
  TRANG_THAI_DANH_GIA_BADGE,
  TRANG_THAI_DANH_GIA_LABELS,
  type DanhGiaThuViec,
} from './data';

interface DanhGiaDetailProps {
  data: DanhGiaThuViec;
  onClose: () => void;
  onEdit: (d: DanhGiaThuViec) => void;
  onDelete: (id: string) => void;
}

export function DanhGiaDetail({ data, onClose, onEdit, onDelete }: DanhGiaDetailProps) {
  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-card border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-muted/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <Award size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-foreground">{data.ho_ten}</h2>
              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${TRANG_THAI_DANH_GIA_BADGE[data.trang_thai] || ''}`}>
                {TRANG_THAI_DANH_GIA_LABELS[data.trang_thai] || data.trang_thai}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{data.vi_tri} • {data.ten_phong_ban}</p>
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

      {/* Action Toolbar */}
      <div className="px-6 py-2.5 border-b border-border bg-muted/20 flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onEdit(data)}
          className="h-8 gap-1.5 text-xs font-medium"
        >
          <FilePenLine size={14} />
          {t('common.edit')}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDelete(data.id)}
          className="h-8 gap-1.5 text-xs font-medium text-rose-500 hover:bg-rose-500/10 ml-auto"
        >
          <Trash2 size={14} />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Score & Ranking Card */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Điểm đánh giá tổng kết</p>
            <p className="text-2xl font-bold font-mono text-primary mt-1">
              {data.diem_trung_binh != null ? `${data.diem_trung_binh} / 5.0` : 'Chưa chấm điểm'}
            </p>
          </div>
          {data.xep_loai && (
            <div className="text-right">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary text-white uppercase">
                {data.xep_loai}
              </span>
            </div>
          )}
        </div>

        {/* Criteria Breakdown */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Chi tiết tiêu chí</h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-foreground">Năng lực chuyên môn kỹ thuật</span>
              <span className="font-mono font-semibold text-foreground">{data.diem_chuyen_mon ?? '—'} / 5.0</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-500 h-full rounded-full transition-all"
                style={{ width: `${((data.diem_chuyen_mon ?? 0) / 5) * 100}%` }}
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-foreground">Thái độ & Trách nhiệm công việc</span>
              <span className="font-mono font-semibold text-foreground">{data.diem_thai_do ?? '—'} / 5.0</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all"
                style={{ width: `${((data.diem_thai_do ?? 0) / 5) * 100}%` }}
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-foreground">Kỷ luật & Tinh thần đồng đội</span>
              <span className="font-mono font-semibold text-foreground">{data.diem_ky_luat ?? '—'} / 5.0</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-purple-500 h-full rounded-full transition-all"
                style={{ width: `${((data.diem_ky_luat ?? 0) / 5) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Manager feedback & decision */}
        <div className="rounded-xl border border-border p-4 bg-muted/20 space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Đề xuất quyết định</span>
            {data.quyet_dinh ? (
              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${QUYET_DINH_BADGE[data.quyet_dinh] || ''}`}>
                {QUYET_DINH_LABELS[data.quyet_dinh] || data.quyet_dinh}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">Chưa có quyết định</span>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Quản lý trực tiếp:</p>
            <p className="font-medium text-foreground mt-0.5">{data.ten_quan_ly}</p>
          </div>
          {data.nhan_xet_quan_ly && (
            <div>
              <p className="text-xs text-muted-foreground">Nhận xét của quản lý:</p>
              <p className="text-foreground mt-0.5 italic">"{data.nhan_xet_quan_ly}"</p>
            </div>
          )}
          {data.nguyen_vong_lam_viec && (
            <div>
              <p className="text-xs text-muted-foreground">Nguyện vọng của nhân sự:</p>
              <p className="text-foreground mt-0.5">{data.nguyen_vong_lam_viec}</p>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="rounded-xl border border-border p-4 bg-muted/20 grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-muted-foreground">Bắt đầu thử việc:</span>
            <p className="font-medium text-foreground mt-0.5">{formatDate(data.ngay_bat_dau_thu_viec)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Kết thúc thử việc:</span>
            <p className="font-medium text-foreground mt-0.5">{formatDate(data.ngay_ket_thuc_thu_viec)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Đợt tháng:</span>
            <p className="font-medium text-foreground mt-0.5">{data.dot_thang}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Đợt quý:</span>
            <p className="font-medium text-foreground mt-0.5">{data.dot_quy}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
