import { useState } from 'react';
import { Archive, FileText, Lock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { toast } from 'sonner';

type Tab = 'loai_tai_lieu' | 'vi_tri_kho' | 'bao_mat';

const INITIAL_TYPES = [
  { id: '1', ma: 'TL_CV_DEN', ten: 'Công văn đến', mo_ta: 'Văn bản tiếp nhận từ đối tác, cơ quan bên ngoài' },
  { id: '2', ma: 'TL_CV_DI', ten: 'Công văn đi', mo_ta: 'Văn bản phát hành gửi ra bên ngoài doanh nghiệp' },
  { id: '3', ma: 'TL_TO_TRINH', ten: 'Tờ trình nội bộ', mo_ta: 'Đề xuất chủ trương, xin phê duyệt ngân sách cấp trên' },
  { id: '4', ma: 'TL_QUY_DINH', ten: 'Quy định & Quy chế', mo_ta: 'Các chính sách, cẩm nang nhân viên, quy chuẩn vận hành' },
];

const INITIAL_LOCATIONS = [
  { id: '1', ma: 'VT_T4_A1', ten: 'Tủ hồ sơ A1 (Tầng 4)', dia_chi: 'Phòng Công nghệ & Sản phẩm', suc_chua: '20 cặp file' },
  { id: '2', ma: 'VT_T5_HC', ten: 'Tủ hồ sơ HCNS (Tầng 5)', dia_chi: 'Phòng Hành chính - Nhân sự', suc_chua: '50 cặp file' },
  { id: '3', ma: 'VT_KHO_B1', ten: 'Kho lưu trữ chứng từ B1', dia_chi: 'Tầng hầm B1, Tòa nhà 5F', suc_chua: '200 thùng hồ sơ' },
];

export default function ThietLapTaiLieuPage() {
  const [tab, setTab] = useState<Tab>('loai_tai_lieu');
  const [types, setTypes] = useState(INITIAL_TYPES);
  const [locations] = useState(INITIAL_LOCATIONS);

  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeDesc, setNewTypeDesc] = useState('');

  const handleAddType = () => {
    if (!newTypeName.trim()) return;
    setTypes((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        ma: `TL_${Date.now().toString().slice(-4)}`,
        ten: newTypeName.trim(),
        mo_ta: newTypeDesc.trim() || 'Loại văn bản nội bộ',
      },
    ]);
    setNewTypeName('');
    setNewTypeDesc('');
    toast.success('Đã thêm loại tài liệu mới');
  };

  const tabList: TabItem<Tab>[] = [
    { id: 'loai_tai_lieu', label: 'Danh mục loại văn bản', icon: FileText },
    { id: 'vi_tri_kho', label: 'Vị trí tủ & Kho lưu trữ', icon: Archive },
    { id: 'bao_mat', label: 'Phân quyền bảo mật tài liệu', icon: Lock },
  ];

  return (
    <div className="flex flex-col h-page relative">
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden mt-1.5">
        {/* Header Tabs */}
        <div className="px-4 pt-3 border-b border-border bg-muted/20 flex items-center justify-between gap-3 flex-wrap">
          <Tabs tabs={tabList} activeTab={tab} onChange={setTab} />
        </div>

        {/* Tab 1: Loại văn bản */}
        {tab === 'loai_tai_lieu' && (
          <div className="p-4 flex-1 flex flex-col gap-4 overflow-y-auto max-w-4xl">
            <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/30 flex-wrap">
              <Input
                placeholder="Tên loại văn bản..."
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                className="text-xs h-8 flex-1 min-w-[200px]"
              />
              <Input
                placeholder="Mô tả chức năng..."
                value={newTypeDesc}
                onChange={(e) => setNewTypeDesc(e.target.value)}
                className="text-xs h-8 flex-1 min-w-[200px]"
              />
              <Button size="sm" onClick={handleAddType} className="h-8 gap-1.5 text-xs bg-primary text-white">
                <Plus size={14} /> Thêm loại văn bản
              </Button>
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[11px]">
                    <th className="py-2.5 px-4">Mã ký hiệu</th>
                    <th className="py-2.5 px-4">Tên loại văn bản</th>
                    <th className="py-2.5 px-4">Mục đích sử dụng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {types.map((t) => (
                    <tr key={t.id} className="hover:bg-muted/30">
                      <td className="py-2.5 px-4 font-mono font-medium text-primary">{t.ma}</td>
                      <td className="py-2.5 px-4 font-medium text-foreground">{t.ten}</td>
                      <td className="py-2.5 px-4 text-muted-foreground">{t.mo_ta}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Vị trí tủ/kho */}
        {tab === 'vi_tri_kho' && (
          <div className="p-4 flex-1 flex flex-col gap-4 overflow-y-auto max-w-4xl">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-foreground">Danh sách tủ & Kho lưu trữ hồ sơ tài liệu vật lý</h4>
                <p className="text-xs text-muted-foreground">Quản lý các ngăn tủ và không gian lưu hồ sơ lưu trữ nội bộ</p>
              </div>
              <Button size="sm" onClick={() => toast.info('Thêm tủ lưu trữ mới')} className="h-8 gap-1.5 text-xs bg-primary text-white">
                <Plus size={14} /> Thêm tủ / vị trí
              </Button>
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[11px]">
                    <th className="py-2.5 px-4">Mã vị trí</th>
                    <th className="py-2.5 px-4">Tên tủ / Ngăn kệ</th>
                    <th className="py-2.5 px-4">Địa điểm đặt</th>
                    <th className="py-2.5 px-4">Sức chứa dự kiến</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {locations.map((loc) => (
                    <tr key={loc.id} className="hover:bg-muted/30">
                      <td className="py-2.5 px-4 font-mono font-medium text-primary">{loc.ma}</td>
                      <td className="py-2.5 px-4 font-medium text-foreground">{loc.ten}</td>
                      <td className="py-2.5 px-4 text-muted-foreground">{loc.dia_chi}</td>
                      <td className="py-2.5 px-4 text-muted-foreground">{loc.suc_chua}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Quyền hạn bảo mật */}
        {tab === 'bao_mat' && (
          <div className="p-4 flex-1 flex flex-col gap-4 overflow-y-auto max-w-3xl">
            <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-4">
              <h4 className="text-sm font-semibold text-foreground">Cấp độ bảo mật tài liệu mặc định</h4>
              <div className="space-y-3 text-xs">
                <label className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                  <div>
                    <div className="font-semibold text-foreground">Công khai nội bộ (Public)</div>
                    <div className="text-muted-foreground text-[11px]">Tất cả nhân viên chính thức đều có quyền đọc và tải file</div>
                  </div>
                  <input type="radio" name="secLevel" defaultChecked className="text-primary" />
                </label>
                <label className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                  <div>
                    <div className="font-semibold text-foreground">Nội bộ phòng ban (Department Only)</div>
                    <div className="text-muted-foreground text-[11px]">Chỉ nhân sự thuộc phòng ban quản lý mới có thể truy cập</div>
                  </div>
                  <input type="radio" name="secLevel" className="text-primary" />
                </label>
                <label className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                  <div>
                    <div className="font-semibold text-foreground">Tài liệu Mật (Confidential - BOD & Trưởng phòng)</div>
                    <div className="text-muted-foreground text-[11px]">Yêu cầu phê duyệt quyền từ Ban giám đốc trước khi xem</div>
                  </div>
                  <input type="radio" name="secLevel" className="text-primary" />
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
