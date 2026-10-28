import { useState } from 'react';
import { Building, Save, Edit3, Globe, Phone, Mail, MapPin, CreditCard, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';

export function ThongTinCongTyPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    ten_cong_ty: 'CÔNG TY CỔ PHẦN TẬP ĐOÀN VŨ GIA',
    ten_quoc_te: 'VU GIA GROUP JOINT STOCK COMPANY',
    ten_viet_tat: 'VU GIA GROUP',
    ma_so_thue: '0109876543',
    ngay_thanh_lap: '2018-01-16',
    nguoi_dai_dien: 'Vũ Đức Gia',
    chuc_vu_dai_dien: 'Tổng Giám đốc',
    dia_chi_tru_so: 'Tầng 6, Tòa nhà Vũ Gia Tower, Số 168 Đường Cầu Giấy, P. Quan Hoa, Q. Cầu Giấy, TP. Hà Nội',
    so_dien_thoai: '024.3999.8888',
    hotline: '0988.161.161',
    email: 'contact@vugia.vn',
    website: 'https://vugia.vn',
    so_tai_khoan: '19036888888',
    ngan_hang: 'Techcombank - Chi nhánh Thăng Long, Hà Nội',
    chu_tai_khoan: 'CONG TY CO PHAN TAP DOAN VU GIA',
    linh_vuc: 'Sản xuất công nghiệp, thương mại xuất nhập khẩu, giải pháp công nghệ & dịch vụ kỹ thuật',
  });

  const handleSave = () => {
    setIsEditing(false);
    toast.success('Đã lưu thông tin pháp nhân công ty');
  };

  return (
    <div className="flex flex-col h-page relative space-y-4">
      {/* Top Banner */}
      <div className="rounded-xl border border-border bg-gradient-to-r from-violet-500/10 via-primary/5 to-transparent p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-violet-500/20 shrink-0 font-black text-2xl tracking-tighter">
            VG
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg md:text-xl font-bold text-foreground">
                {formData.ten_cong_ty}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                Đang hoạt động
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              MST: <span className="font-mono font-medium text-foreground">{formData.ma_so_thue}</span> • Đại diện pháp luật: <span className="font-medium text-foreground">{formData.nguoi_dai_dien}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          {isEditing ? (
            <>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                Hủy
              </Button>
              <Button size="sm" onClick={handleSave} className="gap-1.5 shadow-xs">
                <Save size={15} />
                <span>Lưu thay đổi</span>
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => setIsEditing(true)} className="gap-1.5 shadow-xs">
              <Edit3 size={15} />
              <span>Chỉnh sửa thông tin</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Form Cards */}
      <div className="flex-1 min-h-0 overflow-auto space-y-4">
        {/* Card 1: Pháp lý doanh nghiệp */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Thông tin pháp nhân & Đăng ký kinh doanh
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Tên doanh nghiệp</label>
              {isEditing ? (
                <Input
                  value={formData.ten_cong_ty}
                  onChange={(e) => setFormData({ ...formData, ten_cong_ty: e.target.value })}
                />
              ) : (
                <p className="text-sm font-semibold text-foreground py-1.5">{formData.ten_cong_ty}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Tên giao dịch quốc tế</label>
              {isEditing ? (
                <Input
                  value={formData.ten_quoc_te}
                  onChange={(e) => setFormData({ ...formData, ten_quoc_te: e.target.value })}
                />
              ) : (
                <p className="text-sm font-medium text-foreground py-1.5">{formData.ten_quoc_te}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Mã số thuế (Doanh nghiệp)</label>
              {isEditing ? (
                <Input
                  value={formData.ma_so_thue}
                  onChange={(e) => setFormData({ ...formData, ma_so_thue: e.target.value })}
                />
              ) : (
                <p className="text-sm font-mono font-bold text-foreground py-1.5">{formData.ma_so_thue}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Ngày thành lập / Cấp phép</label>
              {isEditing ? (
                <Input
                  type="date"
                  value={formData.ngay_thanh_lap}
                  onChange={(e) => setFormData({ ...formData, ngay_thanh_lap: e.target.value })}
                />
              ) : (
                <p className="text-sm font-medium text-foreground py-1.5">16/01/2018 (Hơn 8 năm hoạt động)</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Người đại diện pháp luật</label>
              {isEditing ? (
                <Input
                  value={formData.nguoi_dai_dien}
                  onChange={(e) => setFormData({ ...formData, nguoi_dai_dien: e.target.value })}
                />
              ) : (
                <p className="text-sm font-semibold text-foreground py-1.5">{formData.nguoi_dai_dien} ({formData.chuc_vu_dai_dien})</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Lĩnh vực hoạt động chính</label>
              {isEditing ? (
                <Input
                  value={formData.linh_vuc}
                  onChange={(e) => setFormData({ ...formData, linh_vuc: e.target.value })}
                />
              ) : (
                <p className="text-sm text-foreground py-1.5">{formData.linh_vuc}</p>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Liên hệ & Trụ sở */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
            <MapPin className="w-5 h-5 text-indigo-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Địa chỉ trụ sở & Thông tin liên lạc
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Địa chỉ trụ sở chính</label>
              {isEditing ? (
                <Input
                  value={formData.dia_chi_tru_so}
                  onChange={(e) => setFormData({ ...formData, dia_chi_tru_so: e.target.value })}
                />
              ) : (
                <p className="text-sm text-foreground py-1.5 flex items-center gap-1.5">
                  <Building size={15} className="text-primary shrink-0" />
                  <span>{formData.dia_chi_tru_so}</span>
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Hotline / Tổng đài</label>
              {isEditing ? (
                <Input
                  value={formData.hotline}
                  onChange={(e) => setFormData({ ...formData, hotline: e.target.value })}
                />
              ) : (
                <p className="text-sm font-medium text-foreground py-1.5 flex items-center gap-1.5">
                  <Phone size={15} className="text-emerald-500 shrink-0" />
                  <span>{formData.hotline} ({formData.so_dien_thoai})</span>
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Hộp thư điện tử (Email)</label>
              {isEditing ? (
                <Input
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              ) : (
                <p className="text-sm font-medium text-foreground py-1.5 flex items-center gap-1.5">
                  <Mail size={15} className="text-blue-500 shrink-0" />
                  <span>{formData.email}</span>
                </p>
              )}
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Cổng thông tin Website</label>
              {isEditing ? (
                <Input
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                />
              ) : (
                <p className="text-sm font-medium text-primary py-1.5 flex items-center gap-1.5">
                  <Globe size={15} className="shrink-0" />
                  <a href={formData.website} target="_blank" rel="noreferrer" className="underline hover:text-primary/80">
                    {formData.website}
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Card 3: Tài khoản ngân hàng doanh nghiệp */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
            <CreditCard className="w-5 h-5 text-emerald-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Tài khoản ngân hàng giao dịch
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Số tài khoản</label>
              {isEditing ? (
                <Input
                  value={formData.so_tai_khoan}
                  onChange={(e) => setFormData({ ...formData, so_tai_khoan: e.target.value })}
                />
              ) : (
                <p className="text-base font-mono font-bold text-emerald-600 py-1.5">{formData.so_tai_khoan}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Ngân hàng & Chi nhánh</label>
              {isEditing ? (
                <Input
                  value={formData.ngan_hang}
                  onChange={(e) => setFormData({ ...formData, ngan_hang: e.target.value })}
                />
              ) : (
                <p className="text-sm font-medium text-foreground py-1.5">{formData.ngan_hang}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Tên chủ tài khoản</label>
              {isEditing ? (
                <Input
                  value={formData.chu_tai_khoan}
                  onChange={(e) => setFormData({ ...formData, chu_tai_khoan: e.target.value })}
                />
              ) : (
                <p className="text-sm font-semibold text-foreground py-1.5">{formData.chu_tai_khoan}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ThongTinCongTyPage;
