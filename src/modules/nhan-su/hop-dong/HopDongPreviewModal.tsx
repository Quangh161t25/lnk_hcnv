import { useRef } from 'react';
import { Printer, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/format';
import { t } from '@/lib/i18n';
import { LOAI_HOP_DONG_LABELS, type HopDong } from './data';

interface HopDongPreviewModalProps {
  data: HopDong;
  onClose: () => void;
}

export function HopDongPreviewModal({ data, onClose }: HopDongPreviewModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white">
      <div className="w-full max-w-4xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col my-8 print:border-none print:shadow-none print:m-0 animate-in fade-in zoom-in-95">
        {/* Controls - Hidden when printing */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-border bg-muted/40 print:hidden">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">
              {t('hopDong.preview.title')}: <span className="font-mono text-primary">{data.so_hop_dong}</span>
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handlePrint} className="h-8 gap-1.5 text-xs">
              <Printer size={14} />
              {t('hopDong.preview.print')}
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Paper Contract View */}
        <div ref={printRef} className="p-8 sm:p-12 bg-white text-slate-900 font-serif leading-relaxed text-sm space-y-6 overflow-y-auto max-h-[80vh] print:max-h-none print:p-0">
          {/* Header */}
          <div className="text-center space-y-1">
            <h4 className="font-bold uppercase tracking-wider text-xs">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h4>
            <p className="font-semibold text-xs border-b border-slate-900 pb-1 w-fit mx-auto">Độc lập - Tự do - Hạnh phúc</p>
          </div>

          <div className="text-center pt-4">
            <h2 className="text-xl font-bold uppercase tracking-wide">
              {data.loai_hop_dong === 'thu-viec' ? 'HỢP ĐỒNG THỬ VIỆC' : 'HỢP ĐỒNG LAO ĐỘNG'}
            </h2>
            <p className="text-xs font-mono text-slate-600 mt-1">Số: {data.so_hop_dong}</p>
          </div>

          <p className="italic text-xs">
            Hôm nay, ngày {new Date(data.ngay_bat_dau).getDate()} tháng {new Date(data.ngay_bat_dau).getMonth() + 1} năm {new Date(data.ngay_bat_dau).getFullYear()}, tại Văn phòng Công ty, chúng tôi gồm các bên:
          </p>

          {/* Bên A */}
          <div className="space-y-1.5">
            <p className="font-bold uppercase text-xs">BÊN SỬ DỤNG LAO ĐỘNG (BÊN A): CÔNG TY CỔ PHẦN CÔNG NGHỆ VŨ GIA</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <p>Đại diện: <strong>Ông Vũ Minh Trí</strong></p>
              <p>Chức vụ: <strong>Tổng Giám Đốc</strong></p>
              <p>Địa chỉ: Tòa nhà Vũ Gia Tower, Quận Cầu Giấy, Hà Nội</p>
              <p>Điện thoại: 024.3999.8888</p>
            </div>
          </div>

          {/* Bên B */}
          <div className="space-y-1.5 pt-2">
            <p className="font-bold uppercase text-xs">BÊN NGƯỜI LAO ĐỘNG (BÊN B):</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <p>Họ và tên: <strong>{data.ten_ung_vien}</strong></p>
              <p>Số điện thoại: <strong>{data.sdt_ung_vien || '—'}</strong></p>
              <p>Email: <strong>{data.email_ung_vien || '—'}</strong></p>
              <p>Ngày bắt đầu làm việc: <strong>{data.ngay_vao_lam ? formatDate(data.ngay_vao_lam) : formatDate(data.ngay_bat_dau)}</strong></p>
            </div>
          </div>

          <p className="text-xs">
            Hai bên thống nhất ký kết hợp đồng lao động và cam kết thực hiện đầy đủ các điều khoản sau đây:
          </p>

          {/* Điều khoản */}
          <div className="space-y-3 text-xs">
            <div>
              <p className="font-bold">Điều 1: Thời hạn và công việc hợp đồng</p>
              <p>- Loại hợp đồng: <strong>{LOAI_HOP_DONG_LABELS[data.loai_hop_dong] || data.loai_hop_dong}</strong></p>
              <p>- Thời gian hợp đồng: Từ ngày <strong>{formatDate(data.ngay_bat_dau)}</strong> {data.ngay_ket_thuc ? `đến ngày ${formatDate(data.ngay_ket_thuc)}` : 'đến khi chấm dứt theo quy định pháp luật'}.</p>
              <p>- Chức danh chuyên môn: <strong>{data.bac_luong || 'Nhân viên chuyên trách'}</strong>.</p>
            </div>

            <div>
              <p className="font-bold">Điều 2: Chế độ làm việc và đãi ngộ</p>
              <p>- Mức lương chính: <strong>{data.muc_luong || 'Theo thỏa thuận'}</strong>.</p>
              <p>- Các chế độ đãi ngộ khác: {data.co_che_khac || 'Theo quy chế của Công ty và Bộ luật Lao động Việt Nam'}.</p>
              {data.ghi_chu_khac && <p>- Điều khoản bổ sung: {data.ghi_chu_khac}</p>}
            </div>

            <div>
              <p className="font-bold">Điều 3: Nghĩa vụ và quyền lợi của người lao động</p>
              <p>- Chấp hành nội quy lao động, an toàn vệ sinh lao động và kỷ luật công ty.</p>
              <p>- Được hưởng đầy đủ quyền lợi về bảo hiểm xã hội, bảo hiểm y tế theo quy định hiện hành.</p>
            </div>
          </div>

          {/* Chữ ký */}
          <div className="grid grid-cols-2 pt-8 text-center text-xs">
            <div>
              <p className="font-bold uppercase">ĐẠI DIỆN BÊN B</p>
              <p className="italic text-slate-500">(Ký và ghi rõ họ tên)</p>
              <div className="h-16"></div>
              <p className="font-semibold">{data.ten_ung_vien}</p>
            </div>
            <div>
              <p className="font-bold uppercase">ĐẠI DIỆN BÊN A</p>
              <p className="italic text-slate-500">(Ký tên và đóng dấu)</p>
              <div className="h-16"></div>
              <p className="font-semibold">Nguyễn Văn Quản Trị</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
