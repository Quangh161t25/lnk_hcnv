import { useState } from 'react';
import { AlertCircle, CheckCircle2, FolderKanban, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { toast } from 'sonner';

type Tab = 'trang_thai' | 'uu_tien' | 'loai_du_an';

const INITIAL_STATUSES = [
  { id: '1', ma: 'TODO', ten: 'Cần làm', mau: '#64748b', mo_ta: 'Công việc mới được giao, chưa bắt đầu' },
  { id: '2', ma: 'IN_PROGRESS', ten: 'Đang thực hiện', mau: '#2563eb', mo_ta: 'Đang trong quá trình xử lý' },
  { id: '3', ma: 'REVIEW', ten: 'Chờ duyệt / Nghiệm thu', mau: '#d97706', mo_ta: 'Đã hoàn thành, đang chờ quản lý nghiệm thu' },
  { id: '4', ma: 'DONE', ten: 'Đã hoàn thành', mau: '#10b981', mo_ta: 'Công việc đã được nghiệm thu đạt yêu cầu' },
];

const INITIAL_PRIORITIES = [
  { id: '1', ma: 'URGENT', ten: 'Khẩn cấp', mau: '#e11d48', diem: 4 },
  { id: '2', ma: 'HIGH', ten: 'Cao', mau: '#ea580c', diem: 3 },
  { id: '3', ma: 'NORMAL', ten: 'Trung bình', mau: '#2563eb', diem: 2 },
  { id: '4', ma: 'LOW', ten: 'Thấp', mau: '#64748b', diem: 1 },
];

const INITIAL_PROJECT_TYPES = [
  { id: '1', ma: 'INTERNAL', ten: 'Dự án Nội bộ doanh nghiệp', mo_ta: 'Tối ưu quy trình, nâng cấp cơ sở vật chất, hệ thống thông tin' },
  { id: '2', ma: 'CLIENT', ten: 'Dự án Khách hàng B2B', mo_ta: 'Triển khai hợp đồng phần mềm & dịch vụ cho khách hàng' },
  { id: '3', ma: 'RND', ten: 'Nghiên cứu & Phát triển (R&D)', mo_ta: 'Nghiên cứu công nghệ mới, sản phẩm mẫu thử nghiệm' },
];

export default function ThietLapCongViecPage() {
  const [tab, setTab] = useState<Tab>('trang_thai');
  const [statuses] = useState(INITIAL_STATUSES);
  const [priorities] = useState(INITIAL_PRIORITIES);
  const [projectTypes, setProjectTypes] = useState(INITIAL_PROJECT_TYPES);

  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeDesc, setNewTypeDesc] = useState('');

  const handleAddProjectType = () => {
    if (!newTypeName.trim()) return;
    setProjectTypes((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        ma: `PRJ_${Date.now().toString().slice(-4)}`,
        ten: newTypeName.trim(),
        mo_ta: newTypeDesc.trim() || 'Loại hình dự án mới',
      },
    ]);
    setNewTypeName('');
    setNewTypeDesc('');
    toast.success('Đã thêm loại hình dự án mới');
  };

  const tabList: TabItem<Tab>[] = [
    { id: 'trang_thai', label: 'Trạng thái công việc', icon: CheckCircle2 },
    { id: 'uu_tien', label: 'Mức độ ưu tiên', icon: AlertCircle },
    { id: 'loai_du_an', label: 'Loại hình dự án', icon: FolderKanban },
  ];

  return (
    <div className="flex flex-col h-page relative">
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden mt-1.5">
        {/* Header Tabs */}
        <div className="px-4 pt-3 border-b border-border bg-muted/20 flex items-center justify-between gap-3 flex-wrap">
          <Tabs tabs={tabList} activeTab={tab} onChange={setTab} />
        </div>

        {/* Tab 1: Trạng thái công việc */}
        {tab === 'trang_thai' && (
          <div className="p-4 flex-1 flex flex-col gap-4 overflow-y-auto max-w-4xl">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-foreground">Quy trình trạng thái vòng đời công việc</h4>
                <p className="text-xs text-muted-foreground">Các bước chuyển tiếp từ lúc giao việc đến khi nghiệm thu</p>
              </div>
              <Button size="sm" onClick={() => toast.info('Thêm trạng thái mới')} className="h-8 gap-1.5 text-xs bg-primary text-white">
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
                    <th className="py-2.5 px-4">Mô tả quy trình</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {statuses.map((s) => (
                    <tr key={s.id} className="hover:bg-muted/30">
                      <td className="py-2.5 px-4 font-mono font-medium text-primary">{s.ma}</td>
                      <td className="py-2.5 px-4 font-medium text-foreground">{s.ten}</td>
                      <td className="py-2.5 px-4">
                        <span className="inline-flex items-center gap-1.5 font-mono text-[11px]">
                          <span className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: s.mau }} />
                          {s.mau}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-muted-foreground">{s.mo_ta}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Mức độ ưu tiên */}
        {tab === 'uu_tien' && (
          <div className="p-4 flex-1 flex flex-col gap-4 overflow-y-auto max-w-4xl">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-foreground">Phân cấp mức độ ưu tiên công việc</h4>
                <p className="text-xs text-muted-foreground">Xác định trọng số xử lý và cảnh báo hạn chót trong hệ thống</p>
              </div>
              <Button size="sm" onClick={() => toast.info('Thêm cấp độ ưu tiên')} className="h-8 gap-1.5 text-xs bg-primary text-white">
                <Plus size={14} /> Thêm cấp độ
              </Button>
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[11px]">
                    <th className="py-2.5 px-4">Mã</th>
                    <th className="py-2.5 px-4">Tên cấp độ</th>
                    <th className="py-2.5 px-4">Màu sắc hiển thị</th>
                    <th className="py-2.5 px-4 text-center">Trọng số ưu tiên</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {priorities.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/30">
                      <td className="py-2.5 px-4 font-mono font-medium text-primary">{p.ma}</td>
                      <td className="py-2.5 px-4 font-medium text-foreground">{p.ten}</td>
                      <td className="py-2.5 px-4">
                        <span className="inline-flex items-center gap-1.5 font-mono text-[11px]">
                          <span className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: p.mau }} />
                          {p.mau}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center font-bold text-foreground">{p.diem}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Loại hình dự án */}
        {tab === 'loai_du_an' && (
          <div className="p-4 flex-1 flex flex-col gap-4 overflow-y-auto max-w-4xl">
            <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/30 flex-wrap">
              <Input
                placeholder="Tên loại hình dự án..."
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                className="text-xs h-8 flex-1 min-w-[200px]"
              />
              <Input
                placeholder="Mô tả phạm vi áp dụng..."
                value={newTypeDesc}
                onChange={(e) => setNewTypeDesc(e.target.value)}
                className="text-xs h-8 flex-1 min-w-[200px]"
              />
              <Button size="sm" onClick={handleAddProjectType} className="h-8 gap-1.5 text-xs bg-primary text-white">
                <Plus size={14} /> Thêm loại dự án
              </Button>
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[11px]">
                    <th className="py-2.5 px-4">Mã phân loại</th>
                    <th className="py-2.5 px-4">Tên loại hình dự án</th>
                    <th className="py-2.5 px-4">Mô tả đặc điểm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {projectTypes.map((pt) => (
                    <tr key={pt.id} className="hover:bg-muted/30">
                      <td className="py-2.5 px-4 font-mono font-medium text-primary">{pt.ma}</td>
                      <td className="py-2.5 px-4 font-medium text-foreground">{pt.ten}</td>
                      <td className="py-2.5 px-4 text-muted-foreground">{pt.mo_ta}</td>
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
