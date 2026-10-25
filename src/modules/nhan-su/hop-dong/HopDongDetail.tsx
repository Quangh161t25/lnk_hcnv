import { DollarSign, FileCheck, FileDown, FilePenLine, FileText, Info, Printer, Trash2, User, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/format';
import { t } from '@/lib/i18n';
import {
  LOAI_HOP_DONG_BADGE,
  LOAI_HOP_DONG_LABELS,
  TRANG_THAI_HOP_DONG_BADGE,
  TRANG_THAI_HOP_DONG_LABELS,
  type HopDong,
  type PhieuThanhLy,
} from './data';

interface HopDongDetailProps {
  data: HopDong;
  phieuThanhLy?: PhieuThanhLy;
  onClose: () => void;
  onEdit: (hd: HopDong) => void;
  onDelete: (id: string) => void;
  onPrint: (hd: HopDong) => void;
  onOpenCreateChinhThuc: (hd: HopDong) => void;
  onOpenPhieuThanhLy: (hd: HopDong) => void;
}

export function HopDongDetail({
  data,
  phieuThanhLy,
  onClose,
  onEdit,
  onDelete,
  onPrint,
  onOpenCreateChinhThuc,
  onOpenPhieuThanhLy,
}: HopDongDetailProps) {
  const isThuViec = data.loai_hop_dong === 'thu-viec';
  const isThanhLy = data.trang_thai === 'thanh_ly';

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-card border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-muted/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <FileText size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-foreground font-mono">{data.so_hop_dong}</h2>
              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${LOAI_HOP_DONG_BADGE[data.loai_hop_dong] || ''}`}>
                {LOAI_HOP_DONG_LABELS[data.loai_hop_dong] || data.loai_hop_dong}
              </span>
              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${TRANG_THAI_HOP_DONG_BADGE[data.trang_thai] || ''}`}>
                {TRANG_THAI_HOP_DONG_LABELS[data.trang_thai] || data.trang_thai}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{data.ten_ung_vien}</p>
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
      <div className="px-6 py-2.5 border-b border-border bg-muted/20 flex items-center gap-2 flex-wrap">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onPrint(data)}
          className="h-8 gap-1.5 text-xs font-medium"
        >
          <Printer size={14} />
          {t('hopDong.detail.toolbar.print')}
        </Button>

        {isThuViec && !isThanhLy && (
          <Button
            size="sm"
            onClick={() => onOpenCreateChinhThuc(data)}
            className="h-8 gap-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <FileCheck size={14} />
            {t('hopDong.createChinhThuc')}
          </Button>
        )}

        {!isThanhLy && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onOpenPhieuThanhLy(data)}
            className="h-8 gap-1.5 text-xs font-medium text-rose-600 hover:bg-rose-500/10 hover:border-rose-300"
          >
            <FileDown size={14} />
            {t('hopDong.createPhieuThanhLy')}
          </Button>
        )}

        <Button
          size="sm"
          variant="outline"
          onClick={() => onEdit(data)}
          className="h-8 gap-1.5 text-xs font-medium ml-auto"
        >
          <FilePenLine size={14} />
          {t('common.edit')}
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDelete(data.id)}
          className="h-8 gap-1.5 text-xs font-medium text-rose-500 hover:bg-rose-500/10"
        >
          <Trash2 size={14} />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Thông tin nhân sự */}
        <div className="rounded-xl border border-border p-4 bg-muted/20 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <User size={14} />
            <span>Thông tin nhân sự</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">{t('hopDong.table.ungVien')}</p>
              <p className="font-medium text-foreground mt-0.5">{data.ten_ung_vien}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="font-medium text-foreground mt-0.5">{data.email_ung_vien || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Số điện thoại</p>
              <p className="font-medium text-foreground mt-0.5">{data.sdt_ung_vien || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('hopDong.ngayVaoLam')}</p>
              <p className="font-medium text-foreground mt-0.5">{data.ngay_vao_lam ? formatDate(data.ngay_vao_lam) : '—'}</p>
            </div>
          </div>
        </div>

        {/* Thông tin hợp đồng */}
        <div className="rounded-xl border border-border p-4 bg-muted/20 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <Info size={14} />
            <span>{t('hopDong.detail.basicInfo')}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">{t('hopDong.table.soHopDong')}</p>
              <p className="font-mono font-medium text-foreground mt-0.5">{data.so_hop_dong}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('hopDong.table.loaiHopDong')}</p>
              <p className="font-medium text-foreground mt-0.5">{LOAI_HOP_DONG_LABELS[data.loai_hop_dong] || data.loai_hop_dong}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('hopDong.table.ngayBatDau')}</p>
              <p className="font-medium text-foreground mt-0.5">{formatDate(data.ngay_bat_dau)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('hopDong.table.ngayKetThuc')}</p>
              <p className="font-medium text-foreground mt-0.5">{data.ngay_ket_thuc ? formatDate(data.ngay_ket_thuc) : 'Không xác định thời hạn'}</p>
            </div>
            {data.id_hop_dong_goc && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">{t('hopDong.hopDongThuViecGoc')}</p>
                <p className="font-mono text-xs text-primary mt-0.5">{data.id_hop_dong_goc}</p>
              </div>
            )}
          </div>
        </div>

        {/* Chế độ đãi ngộ & Lương */}
        <div className="rounded-xl border border-border p-4 bg-muted/20 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <DollarSign size={14} />
            <span>{t('hopDong.detail.terms')}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">{t('hopDong.bacLuong')}</p>
              <p className="font-medium text-foreground mt-0.5">{data.bac_luong || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('hopDong.mucLuong')}</p>
              <p className="font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">{data.muc_luong || '—'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground">{t('hopDong.coCheKhac')}</p>
              <p className="text-foreground mt-0.5">{data.co_che_khac || '—'}</p>
            </div>
            {data.ghi_chu_khac && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">{t('hopDong.ghiChuKhac')}</p>
                <p className="text-foreground mt-0.5">{data.ghi_chu_khac}</p>
              </div>
            )}
          </div>
        </div>

        {/* Thông tin thanh lý nếu có */}
        {phieuThanhLy && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              <FileCheck size={14} />
              <span>{t('hopDong.phieuThanhLy.title')}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Số phiếu</p>
                <p className="font-mono font-medium text-foreground mt-0.5">{phieuThanhLy.so_phieu}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('hopDong.phieuThanhLy.ngayThanhLy')}</p>
                <p className="font-medium text-foreground mt-0.5">{formatDate(phieuThanhLy.ngay_thanh_ly)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">{t('hopDong.phieuThanhLy.lyDo')}</p>
                <p className="font-medium text-foreground mt-0.5">{phieuThanhLy.ly_do}</p>
              </div>
              {phieuThanhLy.ghi_chu && (
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Ghi chú bàn giao</p>
                  <p className="text-foreground mt-0.5">{phieuThanhLy.ghi_chu}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
