import { useState } from 'react';
import { Building2, CheckCircle2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { toast } from 'sonner';

type Tab = 'nhom_ts' | 'trang_thai_ts';

interface AssetGroupSetting {
  id: string;
  ma_nhom: string;
  ten_nhom: string;
  pp_khau_hao: string;
  thoi_gian_kh_thang: number;
  ty_le_nam: string;
}

interface AssetStatusSetting {
  id: string;
  ma_tt: string;
  ten_tt: string;
  mau: string;
  cho_phep_cap_phat: boolean;
}

const INITIAL_GROUPS: AssetGroupSetting[] = [
  { id: '1', ma_nhom: 'NTS_CNTT', ten_nhom: 'Thiết bị Công nghệ thông tin', pp_khau_hao: 'Đường thẳng', thoi_gian_kh_thang: 36, ty_le_nam: '33.3%' },
  { id: '2', ma_nhom: 'NTS_VP', ten_nhom: 'Máy móc & Thiết bị văn phòng', pp_khau_hao: 'Đường thẳng', thoi_gian_kh_thang: 24, ty_le_nam: '50.0%' },
  { id: '3', ma_nhom: 'NTS_NOI_THAT', ten_nhom: 'Nội thất & Bàn ghế làm việc', pp_khau_hao: 'Đường thẳng', thoi_gian_kh_thang: 60, ty_le_nam: '20.0%' },
  { id: '4', ma_nhom: 'NTS_XE', ten_nhom: 'Phương tiện vận tải & Xe công tác', pp_khau_hao: 'Đường thẳng', thoi_gian_kh_thang: 120, ty_le_nam: '10.0%' },
];

const INITIAL_STATUSES: AssetStatusSetting[] = [
  { id: '1', ma_tt: 'DANG_SD', ten_tt: 'Đang sử dụng', mau: '#10b981', cho_phep_cap_phat: false },
  { id: '2', ma_tt: 'TRONG_KHO', ten_tt: 'Trong kho (Sẵn sàng cấp)', mau: '#2563eb', cho_phep_cap_phat: true },
  { id: '3', ma_tt: 'BAO_TRI', ten_tt: 'Đang bảo trì / sửa chữa', mau: '#f59e0b', cho_phep_cap_phat: false },
  { id: '4', ma_tt: 'THANH_LY', ten_tt: 'Hỏng hóc / Đề xuất thanh lý', mau: '#ef4444', cho_phep_cap_phat: false },
];

export default function ThietLapTaiSanPage() {
  const [tab, setTab] = useState<Tab>('nhom_ts');
  const [groups, setGroups] = useState(INITIAL_GROUPS);
  const [statuses] = useState(INITIAL_STATUSES);

  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupMonths, setNewGroupMonths] = useState('36');

  const handleAddGroup = () => {
    if (!newGroupName.trim()) return;
    const months = Number(newGroupMonths) || 36;
    setGroups((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        ma_nhom: `NTS_${Date.now().toString().slice(-4)}`,
        ten_nhom: newGroupName.trim(),
        pp_khau_hao: 'Đường thẳng',
        thoi_gian_kh_thang: months,
        ty_le_nam: `${((12 / months) * 100).toFixed(1)}%`,
      },
    ]);
    setNewGroupName('');
    setNewGroupMonths('36');
    toast.success('Đã thêm nhóm tài sản mới');
  };

  const tabList: TabItem<Tab>[] = [
    { id: 'nhom_ts', label: 'Nhóm tài sản & Khấu hao', icon: Building2 },
    { id: 'trang_thai_ts', label: 'Trạng thái tài sản', icon: CheckCircle2 },
  ];

  return (
    <div className="flex flex-col h-page relative">
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden mt-1.5">
        {/* Header Tabs */}
        <div className="px-4 pt-3 border-b border-border bg-muted/20 flex items-center justify-between gap-3 flex-wrap">
          <Tabs tabs={tabList} activeTab={tab} onChange={setTab} />
        </div>

        {/* Tab 1: Nhóm tài sản */}
        {tab === 'nhom_ts' && (
          <div className="p-4 flex-1 flex flex-col gap-4 overflow-y-auto max-w-4xl">
            <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/30 flex-wrap">
              <Input
                placeholder="Tên nhóm tài sản..."
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="text-xs h-8 flex-1 min-w-[200px]"
              />
              <Input
                type="number"
                placeholder="Số tháng khấu hao (VD: 36)..."
                value={newGroupMonths}
                onChange={(e) => setNewGroupMonths(e.target.value)}
                className="text-xs h-8 w-44"
              />
              <Button size="sm" onClick={handleAddGroup} className="h-8 gap-1.5 text-xs bg-primary text-white">
                <Plus size={14} /> Thêm nhóm tài sản
              </Button>
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[11px]">
                    <th className="py-2.5 px-4">Mã nhóm</th>
                    <th className="py-2.5 px-4">Tên nhóm tài sản</th>
                    <th className="py-2.5 px-4">Phương pháp KH</th>
                    <th className="py-2.5 px-4 text-center">Thời gian KH</th>
                    <th className="py-2.5 px-4 text-center">Tỷ lệ KH / năm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {groups.map((g) => (
                    <tr key={g.id} className="hover:bg-muted/30">
                      <td className="py-2.5 px-4 font-mono font-medium text-primary">{g.ma_nhom}</td>
                      <td className="py-2.5 px-4 font-medium text-foreground">{g.ten_nhom}</td>
                      <td className="py-2.5 px-4 text-muted-foreground">{g.pp_khau_hao}</td>
                      <td className="py-2.5 px-4 text-center font-bold text-foreground">{g.thoi_gian_kh_thang} tháng</td>
                      <td className="py-2.5 px-4 text-center text-muted-foreground">{g.ty_le_nam}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Trạng thái tài sản */}
        {tab === 'trang_thai_ts' && (
          <div className="p-4 flex-1 flex flex-col gap-4 overflow-y-auto max-w-4xl">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-foreground">Danh mục trạng thái tài sản</h4>
                <p className="text-xs text-muted-foreground">Quy định trạng thái phục vụ luồng cấp phát, bảo trì và kiểm kê</p>
              </div>
              <Button size="sm" onClick={() => toast.info('Thêm trạng thái tài sản mới')} className="h-8 gap-1.5 text-xs bg-primary text-white">
                <Plus size={14} /> Thêm trạng thái
              </Button>
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[11px]">
                    <th className="py-2.5 px-4">Mã</th>
                    <th className="py-2.5 px-4">Tên trạng thái</th>
                    <th className="py-2.5 px-4">Màu sắc</th>
                    <th className="py-2.5 px-4 text-center">Sẵn sàng cấp phát</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {statuses.map((s) => (
                    <tr key={s.id} className="hover:bg-muted/30">
                      <td className="py-2.5 px-4 font-mono font-medium text-primary">{s.ma_tt}</td>
                      <td className="py-2.5 px-4 font-medium text-foreground">{s.ten_tt}</td>
                      <td className="py-2.5 px-4">
                        <span className="inline-flex items-center gap-1.5 font-mono text-[11px]">
                          <span className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: s.mau }} />
                          {s.mau}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        {s.cho_phep_cap_phat ? (
                          <span className="text-emerald-600 font-semibold">Có</span>
                        ) : (
                          <span className="text-muted-foreground">Không</span>
                        )}
                      </td>
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
