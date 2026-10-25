import { useState } from 'react';
import { Bell, Plus, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

export default function ThietLapCuocHopPage() {
  const [remind15, setRemind15] = useState(true);
  const [remind30, setRemind30] = useState(true);
  const [autoEmail, setAutoEmail] = useState(true);

  const handleSave = () => {
    toast.success('Đã lưu cấu hình thiết lập cuộc họp');
  };

  return (
    <div className="flex flex-col h-page relative">
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm p-6 overflow-y-auto mt-1.5 space-y-6 max-w-3xl">
        <div>
          <h3 className="text-base font-semibold text-foreground">Thiết lập cấu hình cuộc họp</h3>
          <p className="text-xs text-muted-foreground">Tùy chỉnh thông báo nhắc lịch và phân loại cuộc họp trong hệ thống</p>
        </div>

        {/* Thông báo nhắc hẹn */}
        <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-4">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-primary" />
            <h4 className="text-sm font-semibold text-foreground">Cấu hình nhắc lịch cuộc họp</h4>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={remind15}
                onChange={(e) => setRemind15(e.target.checked)}
                className="rounded text-primary focus:ring-primary w-4 h-4"
              />
              <span className="text-foreground">Nhắc trước 15 phút qua Thông báo nội bộ & Email</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={remind30}
                onChange={(e) => setRemind30(e.target.checked)}
                className="rounded text-primary focus:ring-primary w-4 h-4"
              />
              <span className="text-foreground">Nhắc trước 30 phút cho người chủ trì và thư ký</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoEmail}
                onChange={(e) => setAutoEmail(e.target.checked)}
                className="rounded text-primary focus:ring-primary w-4 h-4"
              />
              <span className="text-foreground">Tự động gửi email đính kèm tệp .ics (Google Calendar / Outlook)</span>
            </label>
          </div>
        </div>

        {/* Phân loại cuộc họp */}
        <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">Danh mục loại cuộc họp</h4>
            <Button size="sm" variant="outline" className="h-7 text-xs">
              <Plus size={13} className="mr-1" /> Thêm loại
            </Button>
          </div>

          <div className="divide-y divide-border border border-border rounded-lg bg-card text-xs">
            {['Họp giao ban định kỳ tuần', 'Họp khẩn / Đột xuất', 'Họp hội đồng quản trị', 'Họp dự án / Sprint', 'Họp đào tạo nội bộ'].map((loai, i) => (
              <div key={i} className="p-2.5 flex items-center justify-between">
                <span className="font-medium text-foreground">{loai}</span>
                <span className="text-emerald-600 font-medium">Hoạt động</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button size="sm" onClick={handleSave} className="bg-primary text-white gap-1.5 text-xs">
            <Save size={14} /> Lưu thiết lập
          </Button>
        </div>
      </div>
    </div>
  );
}
