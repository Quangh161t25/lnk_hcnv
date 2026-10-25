import { useState } from 'react';
import { Calculator, FileText, Plus, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { toast } from 'sonner';

type Tab = 'wifi_ip' | 'form_groups' | 'point_groups';

interface WifiSetting {
  id: string;
  ten: string;
  bssid: string;
  ip_wan: string;
  dia_diem: string;
  trang_thai: boolean;
}

interface FormTypeQuota {
  id: string;
  ma_loai: string;
  ten_loai: string;
  han_muc_thang: number;
  tinh_cong: boolean;
}

interface PointGroup {
  id: string;
  ma_nhom: string;
  ten_nhom: string;
  he_so_vnd: number;
  ghi_chu: string;
}

const INITIAL_WIFI: WifiSetting[] = [
  { id: '1', ten: '5F_Office_T5_5GHz', bssid: 'A4:2B:B0:12:34:56', ip_wan: '113.190.234.12', dia_diem: 'Văn phòng Tầng 5', trang_thai: true },
  { id: '2', ten: '5F_Office_T4_Tech', bssid: 'A4:2B:B0:78:90:12', ip_wan: '113.190.234.12', dia_diem: 'Văn phòng Tầng 4', trang_thai: true },
  { id: '3', ten: '5F_Branch_HCM', bssid: 'C8:3A:35:44:55:66', ip_wan: '14.161.88.99', dia_diem: 'Chi nhánh TP. HCM', trang_thai: true },
];

const INITIAL_FORMS: FormTypeQuota[] = [
  { id: '1', ma_loai: 'NGHI_PHEP', ten_loai: 'Nghỉ phép năm', han_muc_thang: 1, tinh_cong: true },
  { id: '2', ma_loai: 'DI_MUON_VE_SOM', ten_loai: 'Đi muộn / Về sớm có phép', han_muc_thang: 3, tinh_cong: true },
  { id: '3', ma_loai: 'LAM_NGOAI_GIO', ten_loai: 'Làm ngoài giờ (OT)', han_muc_thang: 40, tinh_cong: true },
  { id: '4', ma_loai: 'NGHI_KHONG_LUONG', ten_loai: 'Nghỉ không hưởng lương', han_muc_thang: 5, tinh_cong: false },
];

const INITIAL_POINTS: PointGroup[] = [
  { id: '1', ma_nhom: 'PG_BONUS', ten_nhom: 'Điểm thưởng cống hiến', he_so_vnd: 100000, ghi_chu: '1 điểm tương đương 100,000 VND' },
  { id: '2', ma_nhom: 'PG_PENALTY', ten_nhom: 'Điểm trừ vi phạm', he_so_vnd: 100000, ghi_chu: '1 điểm trừ tương đương 100,000 VND' },
  { id: '3', ma_nhom: 'PG_KPI', ten_nhom: 'Hệ số KPI tháng', he_so_vnd: 50000, ghi_chu: 'Tính theo mức điểm vượt chuẩn' },
];

export default function ThietLapCongLuongPage() {
  const [tab, setTab] = useState<Tab>('wifi_ip');
  const [wifiList, setWifiList] = useState(INITIAL_WIFI);
  const [formsList] = useState(INITIAL_FORMS);
  const [pointsList] = useState(INITIAL_POINTS);

  const [newWifiName, setNewWifiName] = useState('');
  const [newWifiLocation, setNewWifiLocation] = useState('');

  const handleAddWifi = () => {
    if (!newWifiName.trim()) return;
    setWifiList((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        ten: newWifiName.trim(),
        bssid: 'Auto-detected',
        ip_wan: '113.190.234.12',
        dia_diem: newWifiLocation.trim() || 'Văn phòng chính',
        trang_thai: true,
      },
    ]);
    setNewWifiName('');
    setNewWifiLocation('');
    toast.success('Đã thêm Wi-Fi chấm công mới');
  };

  const tabList: TabItem<Tab>[] = [
    { id: 'wifi_ip', label: 'Wi-Fi & IP chấm công', icon: Wifi },
    { id: 'form_groups', label: 'Nhóm phiếu hành chính', icon: FileText },
    { id: 'point_groups', label: 'Hệ số tính điểm lương', icon: Calculator },
  ];

  return (
    <div className="flex flex-col h-page relative">
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden mt-1.5">
        {/* Header Tabs */}
        <div className="px-4 pt-3 border-b border-border bg-muted/20 flex items-center justify-between gap-3 flex-wrap">
          <Tabs tabs={tabList} activeTab={tab} onChange={setTab} />
        </div>

        {/* Tab 1: Wifi & IP */}
        {tab === 'wifi_ip' && (
          <div className="p-4 flex-1 flex flex-col gap-4 overflow-y-auto max-w-4xl">
            <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/30 flex-wrap">
              <Input
                placeholder="Tên mạng Wi-Fi (SSID)..."
                value={newWifiName}
                onChange={(e) => setNewWifiName(e.target.value)}
                className="text-xs h-8 flex-1 min-w-[200px]"
              />
              <Input
                placeholder="Địa điểm áp dụng..."
                value={newWifiLocation}
                onChange={(e) => setNewWifiLocation(e.target.value)}
                className="text-xs h-8 flex-1 min-w-[200px]"
              />
              <Button size="sm" onClick={handleAddWifi} className="h-8 gap-1.5 text-xs bg-primary text-white">
                <Plus size={14} /> Thêm Wi-Fi
              </Button>
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[11px]">
                    <th className="py-2.5 px-4">Tên Wi-Fi (SSID)</th>
                    <th className="py-2.5 px-4">Địa chỉ BSSID / MAC</th>
                    <th className="py-2.5 px-4">IP WAN cho phép</th>
                    <th className="py-2.5 px-4">Địa điểm</th>
                    <th className="py-2.5 px-4 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {wifiList.map((w) => (
                    <tr key={w.id} className="hover:bg-muted/30">
                      <td className="py-2.5 px-4 font-medium text-foreground">{w.ten}</td>
                      <td className="py-2.5 px-4 font-mono text-muted-foreground">{w.bssid}</td>
                      <td className="py-2.5 px-4 font-mono text-primary">{w.ip_wan}</td>
                      <td className="py-2.5 px-4 text-muted-foreground">{w.dia_diem}</td>
                      <td className="py-2.5 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
                          Đang hoạt động
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Admin Form Groups */}
        {tab === 'form_groups' && (
          <div className="p-4 flex-1 flex flex-col gap-4 overflow-y-auto max-w-4xl">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-foreground">Cấu hình nhóm phiếu hành chính & Hạn mức tháng</h4>
                <p className="text-xs text-muted-foreground">Quy định hạn mức tối đa cho từng loại đơn từ xin phép hàng tháng</p>
              </div>
              <Button size="sm" onClick={() => toast.info('Thêm loại đơn từ mới')} className="h-8 gap-1.5 text-xs bg-primary text-white">
                <Plus size={14} /> Thêm loại đơn
              </Button>
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[11px]">
                    <th className="py-2.5 px-4">Mã đơn</th>
                    <th className="py-2.5 px-4">Tên loại đơn</th>
                    <th className="py-2.5 px-4 text-center">Hạn mức / tháng</th>
                    <th className="py-2.5 px-4 text-center">Tính công lương</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {formsList.map((f) => (
                    <tr key={f.id} className="hover:bg-muted/30">
                      <td className="py-2.5 px-4 font-mono font-medium text-primary">{f.ma_loai}</td>
                      <td className="py-2.5 px-4 font-medium text-foreground">{f.ten_loai}</td>
                      <td className="py-2.5 px-4 text-center font-bold text-foreground">{f.han_muc_thang} ngày/lần</td>
                      <td className="py-2.5 px-4 text-center">
                        {f.tinh_cong ? (
                          <span className="text-emerald-600 font-medium">Có tính công</span>
                        ) : (
                          <span className="text-muted-foreground">Không tính công</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Point groups */}
        {tab === 'point_groups' && (
          <div className="p-4 flex-1 flex flex-col gap-4 overflow-y-auto max-w-4xl">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-foreground">Hệ số quy đổi điểm cộng trừ tính lương</h4>
                <p className="text-xs text-muted-foreground">Đơn giá quy đổi mỗi điểm thưởng hoặc phạt vào tiền lương thực nhận</p>
              </div>
              <Button size="sm" onClick={() => toast.info('Thêm nhóm điểm')} className="h-8 gap-1.5 text-xs bg-primary text-white">
                <Plus size={14} /> Thêm nhóm điểm
              </Button>
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[11px]">
                    <th className="py-2.5 px-4">Mã nhóm</th>
                    <th className="py-2.5 px-4">Tên nhóm quy đổi</th>
                    <th className="py-2.5 px-4 text-right">Đơn giá (VNĐ / Điểm)</th>
                    <th className="py-2.5 px-4">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pointsList.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/30">
                      <td className="py-2.5 px-4 font-mono font-medium text-primary">{p.ma_nhom}</td>
                      <td className="py-2.5 px-4 font-medium text-foreground">{p.ten_nhom}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-emerald-600">
                        {p.he_so_vnd.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="py-2.5 px-4 text-muted-foreground">{p.ghi_chu}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
