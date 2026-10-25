import { useState } from 'react';
import { Car, Fuel, Plus, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { toast } from 'sonner';

type Tab = 'loai_xe' | 'dinh_muc_bd';

interface VehicleTypeSetting {
  id: string;
  ma_loai: string;
  ten_loai: string;
  so_cho: number;
  dinh_muc_xang_100km: number;
  mo_ta: string;
}

interface MaintenanceStageSetting {
  id: string;
  ma_moc: string;
  ten_moc: string;
  so_km: number;
  noi_dung_chinh: string;
}

const INITIAL_TYPES: VehicleTypeSetting[] = [
  { id: '1', ma_loai: 'SEDAN_5', ten_loai: 'Xe Sedan 5 chỗ', so_cho: 5, dinh_muc_xang_100km: 8.5, mo_ta: 'Phục vụ Ban giám đốc & Tiếp khách VIP nội đô' },
  { id: '2', ma_loai: 'SUV_7', ten_loai: 'Xe SUV 7 chỗ gầm cao', so_cho: 7, dinh_muc_xang_100km: 10.5, mo_ta: 'Công tác tỉnh xa, địa hình hỗn hợp' },
  { id: '3', ma_loai: 'BUS_16', ten_loai: 'Xe Minibus 16 chỗ', so_cho: 16, dinh_muc_xang_100km: 12.0, mo_ta: 'Đưa đón đoàn cán bộ nhân viên, sự kiện công ty' },
];

const INITIAL_STAGES: MaintenanceStageSetting[] = [
  { id: '1', ma_moc: 'BD_5K', ten_moc: 'Bảo dưỡng cấp 5.000 km', so_km: 5000, noi_dung_chinh: 'Thay dầu động cơ, kiểm tra lọc gió động cơ, siết ốc gầm' },
  { id: '2', ma_moc: 'BD_10K', ten_moc: 'Bảo dưỡng cấp 10.000 km', so_km: 10000, noi_dung_chinh: 'Thay dầu + lọc dầu, đảo lốp, vệ sinh hệ thống phanh 4 bánh' },
  { id: '3', ma_moc: 'BD_20K', ten_moc: 'Bảo dưỡng cấp 20.000 km', so_km: 20000, noi_dung_chinh: 'Thay lọc gió điều hòa, lọc gió động cơ, cân bằng động bánh xe' },
  { id: '4', ma_moc: 'BD_40K', ten_moc: 'Bảo dưỡng lớn cấp 40.000 km', so_km: 40000, noi_dung_chinh: 'Thay dầu hộp số, dầu phanh, nước làm mát, bugi đánh lửa' },
];

export default function ThietLapQuanLyXePage() {
  const [tab, setTab] = useState<Tab>('loai_xe');
  const [types, setTypes] = useState(INITIAL_TYPES);
  const [stages] = useState(INITIAL_STAGES);

  const [newTypeName, setNewTypeName] = useState('');
  const [newSeats, setNewSeats] = useState('5');
  const [newQuota, setNewQuota] = useState('9.0');

  const handleAddType = () => {
    if (!newTypeName.trim()) return;
    setTypes((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        ma_loai: `TYPE_${Date.now().toString().slice(-4)}`,
        ten_loai: newTypeName.trim(),
        so_cho: Number(newSeats) || 5,
        dinh_muc_xang_100km: Number(newQuota) || 8.0,
        mo_ta: 'Loại phương tiện bổ sung',
      },
    ]);
    setNewTypeName('');
    toast.success('Đã thêm cấu hình loại xe mới');
  };

  const tabList: TabItem<Tab>[] = [
    { id: 'loai_xe', label: 'Phân loại xe & Định mức xăng', icon: Car },
    { id: 'dinh_muc_bd', label: 'Mốc quy trình bảo dưỡng', icon: Wrench },
  ];

  return (
    <div className="flex flex-col h-page relative">
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden mt-1.5">
        {/* Header Tabs */}
        <div className="px-4 pt-3 border-b border-border bg-muted/20 flex items-center justify-between gap-3 flex-wrap">
          <Tabs tabs={tabList} activeTab={tab} onChange={setTab} />
        </div>

        {/* Tab 1: Phân loại xe */}
        {tab === 'loai_xe' && (
          <div className="p-4 flex-1 flex flex-col gap-4 overflow-y-auto max-w-4xl">
            <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/30 flex-wrap">
              <Input
                placeholder="Tên loại xe..."
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                className="text-xs h-8 flex-1 min-w-[180px]"
              />
              <Input
                type="number"
                placeholder="Số chỗ..."
                value={newSeats}
                onChange={(e) => setNewSeats(e.target.value)}
                className="text-xs h-8 w-24"
              />
              <Input
                type="number"
                step="0.5"
                placeholder="Định mức (L/100km)..."
                value={newQuota}
                onChange={(e) => setNewQuota(e.target.value)}
                className="text-xs h-8 w-36"
              />
              <Button size="sm" onClick={handleAddType} className="h-8 gap-1.5 text-xs bg-primary text-white">
                <Plus size={14} /> Thêm cấu hình
              </Button>
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[11px]">
                    <th className="py-2.5 px-4">Mã loại</th>
                    <th className="py-2.5 px-4">Tên phân loại xe</th>
                    <th className="py-2.5 px-4 text-center">Số chỗ ngồi</th>
                    <th className="py-2.5 px-4 text-center">Định mức tiêu hao</th>
                    <th className="py-2.5 px-4">Mục đích sử dụng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {types.map((t) => (
                    <tr key={t.id} className="hover:bg-muted/30">
                      <td className="py-2.5 px-4 font-mono font-medium text-primary">{t.ma_loai}</td>
                      <td className="py-2.5 px-4 font-medium text-foreground">{t.ten_loai}</td>
                      <td className="py-2.5 px-4 text-center font-bold">{t.so_cho} chỗ</td>
                      <td className="py-2.5 px-4 text-center font-bold text-emerald-600">
                        <span className="inline-flex items-center gap-1">
                          <Fuel size={12} /> {t.dinh_muc_xang_100km} L / 100km
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-muted-foreground">{t.mo_ta}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Mốc bảo dưỡng */}
        {tab === 'dinh_muc_bd' && (
          <div className="p-4 flex-1 flex flex-col gap-4 overflow-y-auto max-w-4xl">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-foreground">Định mức chu kỳ bảo dưỡng định kỳ theo ODO</h4>
                <p className="text-xs text-muted-foreground">Quy định cảnh báo hệ thống khi xe đến mốc cần kiểm tra kỹ thuật</p>
              </div>
              <Button size="sm" onClick={() => toast.info('Thêm mốc bảo dưỡng')} className="h-8 gap-1.5 text-xs bg-primary text-white">
                <Plus size={14} /> Thêm mốc bảo dưỡng
              </Button>
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[11px]">
                    <th className="py-2.5 px-4">Mã mốc</th>
                    <th className="py-2.5 px-4">Tên cấp bảo dưỡng</th>
                    <th className="py-2.5 px-4 text-center">Số ODO mốc (km)</th>
                    <th className="py-2.5 px-4">Nội dung kỹ thuật bắt buộc</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {stages.map((st) => (
                    <tr key={st.id} className="hover:bg-muted/30">
                      <td className="py-2.5 px-4 font-mono font-medium text-primary">{st.ma_moc}</td>
                      <td className="py-2.5 px-4 font-medium text-foreground">{st.ten_moc}</td>
                      <td className="py-2.5 px-4 text-center font-mono font-bold text-amber-600">
                        {st.so_km.toLocaleString('vi-VN')} km
                      </td>
                      <td className="py-2.5 px-4 text-muted-foreground">{st.noi_dung_chinh}</td>
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
