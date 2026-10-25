import { useMemo, useState } from 'react';
import { Building2, Plus, Search, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { toast } from 'sonner';

interface Room {
  id: string;
  ten: string;
  suc_chua: number;
  vi_tri: string;
  thiet_bi: string[];
  trang_thai: 'trong' | 'dang_hop' | 'bao_tri';
}

const INITIAL_ROOMS: Room[] = [
  { id: '1', ten: 'Phòng họp VIP (Hà Nội)', suc_chua: 20, vi_tri: 'Tầng 5, Tòa 5F', thiet_bi: ['Máy chiếu 4K', 'Hệ thống Polycom', 'Bảng kính'], trang_thai: 'trong' },
  { id: '2', ten: 'Phòng họp Sáng tạo A', suc_chua: 10, vi_tri: 'Tầng 4, Tòa 5F', thiet_bi: ['Smart TV 65"', 'Micro không dây', 'Bảng trắng'], trang_thai: 'dang_hop' },
  { id: '3', ten: 'Phòng họp Sprint B', suc_chua: 8, vi_tri: 'Tầng 4, Tòa 5F', thiet_bi: ['Smart TV 55"', 'Bảng Kanban'], trang_thai: 'trong' },
  { id: '4', ten: 'Phòng họp Training', suc_chua: 40, vi_tri: 'Tầng 3, Tòa 5F', thiet_bi: ['Máy chiếu', 'Âm thanh hội trường', 'Bục phát biểu'], trang_thai: 'bao_tri' },
];

const STATUS_BADGE = {
  trong: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  dang_hop: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  bao_tri: 'bg-rose-500/10 text-rose-600 border-rose-500/30',
};

const STATUS_LABEL = {
  trong: 'Sẵn sàng / Trống',
  dang_hop: 'Đang có cuộc họp',
  bao_tri: 'Đang bảo trì',
};

export default function PhongHopPage() {
  const [rooms, setRooms] = useState<Room[]>(INITIAL_ROOMS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // New room state
  const [newRoom, setNewRoom] = useState({
    ten: '',
    suc_chua: 10,
    vi_tri: 'Tầng 4',
    thiet_bi: 'Smart TV, Bảng trắng',
  });

  const filtered = useMemo(() => {
    return rooms.filter((r) => {
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        if (!r.ten.toLowerCase().includes(q) && !r.vi_tri.toLowerCase().includes(q)) return false;
      }
      if (selectedStatus && r.trang_thai !== selectedStatus) return false;
      return true;
    });
  }, [rooms, searchTerm, selectedStatus]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoom.ten.trim()) return;
    setRooms((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        ten: newRoom.ten,
        suc_chua: newRoom.suc_chua,
        vi_tri: newRoom.vi_tri,
        thiet_bi: newRoom.thiet_bi.split(',').map((s) => s.trim()),
        trang_thai: 'trong',
      },
    ]);
    setIsAdding(false);
    setNewRoom({ ten: '', suc_chua: 10, vi_tri: 'Tầng 4', thiet_bi: 'Smart TV, Bảng trắng' });
    toast.success('Thêm phòng họp thành công');
  };

  return (
    <div className="flex flex-col h-page relative">
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden mt-1.5">
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex items-center justify-between gap-3 flex-wrap bg-muted/20">
          <div className="flex items-center gap-3 flex-1 flex-wrap min-w-[280px]">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm phòng họp, vị trí..."
                className="pl-8 text-xs h-8"
              />
            </div>
            <div className="w-full sm:w-44">
              <Select
                options={[
                  { value: '', label: 'Tất cả trạng thái' },
                  { value: 'trong', label: 'Sẵn sàng / Trống' },
                  { value: 'dang_hop', label: 'Đang họp' },
                  { value: 'bao_tri', label: 'Đang bảo trì' },
                ]}
                value={selectedStatus}
                onChange={setSelectedStatus}
                className="text-xs h-8"
              />
            </div>
          </div>

          <Button size="sm" onClick={() => setIsAdding(true)} className="h-8 gap-1.5 text-xs bg-primary text-white">
            <Plus size={14} /> Thêm phòng họp
          </Button>
        </div>

        {/* Room Cards Grid */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((r) => (
            <div key={r.id} className="rounded-xl border border-border bg-card p-5 shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Building2 size={18} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-foreground">{r.ten}</h4>
                      <p className="text-xs text-muted-foreground">{r.vi_tri}</p>
                    </div>
                  </div>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium border ${STATUS_BADGE[r.trang_thai]}`}>
                    {STATUS_LABEL[r.trang_thai]}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                  <Users size={14} className="text-primary" />
                  <span>Sức chứa: <strong className="text-foreground">{r.suc_chua} người</strong></span>
                </div>

                <div className="pt-2">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase">Thiết bị có sẵn:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {r.thiet_bi.map((tb, idx) => (
                      <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[11px]">
                        {tb}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-[11px] text-muted-foreground">ID: #{r.id}</span>
                <Button size="sm" variant="outline" className="h-7 text-xs">
                  Xem lịch đặt
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 border-b border-border bg-muted/40">
              <h3 className="text-sm font-semibold text-foreground">Thêm phòng họp mới</h3>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Tên phòng họp *</label>
                <Input
                  required
                  value={newRoom.ten}
                  onChange={(e) => setNewRoom((s) => ({ ...s, ten: e.target.value }))}
                  placeholder="Ví dụ: Phòng họp Hội nghị..."
                  className="text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Sức chứa (người)</label>
                  <Input
                    type="number"
                    min="2"
                    value={newRoom.suc_chua}
                    onChange={(e) => setNewRoom((s) => ({ ...s, suc_chua: parseInt(e.target.value) || 10 }))}
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Vị trí</label>
                  <Input
                    value={newRoom.vi_tri}
                    onChange={(e) => setNewRoom((s) => ({ ...s, vi_tri: e.target.value }))}
                    className="text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Thiết bị (cách nhau bởi dấu phẩy)</label>
                <Input
                  value={newRoom.thiet_bi}
                  onChange={(e) => setNewRoom((s) => ({ ...s, thiet_bi: e.target.value }))}
                  className="text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsAdding(false)}>
                  Hủy
                </Button>
                <Button type="submit" size="sm" className="bg-primary text-white">
                  Lưu phòng họp
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
