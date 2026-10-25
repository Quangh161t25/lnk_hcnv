import { useState } from 'react';
import { Mail, Plus, Sliders, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { toast } from 'sonner';

type Tab = 'kenh' | 'vong' | 'mau_thu';

const INITIAL_KENH = [
  { id: '1', ten: 'TopCV', ma: 'TOPCV', active: true },
  { id: '2', ten: 'VietnamWorks', ma: 'VNW', active: true },
  { id: '3', ten: 'LinkedIn', ma: 'LINKEDIN', active: true },
  { id: '4', ten: 'Giới thiệu nội bộ', ma: 'INTERNAL', active: true },
];

const INITIAL_VONG = [
  { id: '1', ten: 'Sơ loại hồ sơ', thoi_gian: '1-2 ngày', nguoi_phu_trach: 'HR Recruiter' },
  { id: '2', ten: 'Phỏng vấn chuyên môn (Vòng 1)', thoi_gian: '45 phút', nguoi_phu_trach: 'Trưởng bộ phận' },
  { id: '3', ten: 'Phỏng vấn văn hóa & đàm phán (Vòng 2)', thoi_gian: '30 phút', nguoi_phu_trach: 'Giám đốc / HR Manager' },
];

const INITIAL_MAU = [
  { id: '1', tieu_de: 'Thư mời phỏng vấn vòng 1', ma: 'MAIL_INVITE_V1', loai: 'Thư mời' },
  { id: '2', tieu_de: 'Thư thông báo không phù hợp (Từ chối)', ma: 'MAIL_REJECT', loai: 'Từ chối' },
  { id: '3', tieu_de: 'Thư mời nhận việc (Offer Letter)', ma: 'MAIL_OFFER', loai: 'Offer' },
];

export default function ThietLapTuyenDungPage() {
  const [tab, setTab] = useState<Tab>('kenh');
  const [kenhList, setKenhList] = useState(INITIAL_KENH);
  const [vongList] = useState(INITIAL_VONG);
  const [mauList] = useState(INITIAL_MAU);

  const [newKenhName, setNewKenhName] = useState('');

  const handleAddKenh = () => {
    if (!newKenhName.trim()) return;
    setKenhList((prev) => [
      ...prev,
      { id: String(Date.now()), ten: newKenhName, ma: newKenhName.toUpperCase().replace(/\s+/g, '_'), active: true },
    ]);
    setNewKenhName('');
    toast.success('Đã thêm kênh tuyển dụng mới');
  };

  const toggleKenh = (id: string) => {
    setKenhList((prev) => prev.map((k) => (k.id === id ? { ...k, active: !k.active } : k)));
  };

  const tabs: TabItem<Tab>[] = [
    { id: 'kenh', label: 'Kênh tuyển dụng', icon: Users },
    { id: 'vong', label: 'Vòng phỏng vấn', icon: Sliders },
    { id: 'mau_thu', label: 'Mẫu thư tự động', icon: Mail },
  ];

  return (
    <div className="flex flex-col h-page relative">
      <div className="shrink-0 relative z-0">
        <Tabs<Tab> tabs={tabs} activeTab={tab} onChange={setTab} />
      </div>

      <div className="flex-1 min-h-0 flex flex-col mt-2 rounded-xl border border-border bg-card shadow-sm p-6 overflow-y-auto">
        {tab === 'kenh' && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h3 className="text-base font-semibold text-foreground">Danh mục kênh tuyển dụng</h3>
              <p className="text-xs text-muted-foreground">Quản lý các nguồn tiếp nhận hồ sơ ứng viên</p>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Nhập tên kênh tuyển dụng mới..."
                value={newKenhName}
                onChange={(e) => setNewKenhName(e.target.value)}
                className="text-sm"
              />
              <Button size="sm" onClick={handleAddKenh} className="bg-primary text-white shrink-0">
                <Plus size={16} className="mr-1" /> Thêm kênh
              </Button>
            </div>

            <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
              {kenhList.map((k) => (
                <div key={k.id} className="p-3.5 flex items-center justify-between hover:bg-muted/30">
                  <div>
                    <span className="font-semibold text-sm text-foreground">{k.ten}</span>
                    <span className="ml-2 font-mono text-xs text-muted-foreground">({k.ma})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleKenh(k.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      k.active
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                        : 'bg-muted text-muted-foreground border-border'
                    }`}
                  >
                    {k.active ? 'Đang kích hoạt' : 'Tạm tắt'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'vong' && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h3 className="text-base font-semibold text-foreground">Quy trình các vòng phỏng vấn</h3>
              <p className="text-xs text-muted-foreground">Chuẩn hóa các bước đánh giá ứng viên trong công ty</p>
            </div>

            <div className="space-y-3">
              {vongList.map((v, idx) => (
                <div key={v.id} className="p-4 rounded-xl border border-border bg-muted/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">{v.ten}</h4>
                      <p className="text-xs text-muted-foreground">Thời lượng: {v.thoi_gian} • Phụ trách: {v.nguoi_phu_trach}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'mau_thu' && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h3 className="text-base font-semibold text-foreground">Mẫu thư gửi ứng viên tự động</h3>
              <p className="text-xs text-muted-foreground">Cấu hình template email thông báo kết quả và lịch phỏng vấn</p>
            </div>

            <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
              {mauList.map((m) => (
                <div key={m.id} className="p-4 flex items-center justify-between hover:bg-muted/30">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">{m.tieu_de}</span>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{m.ma}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Loại template: {m.loai}</p>
                  </div>
                  <Button size="sm" variant="outline" className="text-xs">
                    Chỉnh sửa mẫu
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
