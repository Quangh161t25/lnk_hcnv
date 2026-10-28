import { useState } from 'react';
import { Monitor, Smartphone, Laptop, LogOut, CheckCircle2, ShieldCheck, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useConfirm } from '@/stores/confirm';
import { toast } from 'sonner';

interface DeviceSession {
  id: string;
  deviceName: string;
  deviceType: 'desktop' | 'mobile' | 'laptop';
  browser: string;
  ip: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

const INITIAL_SESSIONS: DeviceSession[] = [
  {
    id: 'dev-1',
    deviceName: 'Máy tính bàn Windows 11 (Vũ Gia Workstation)',
    deviceType: 'desktop',
    browser: 'Google Chrome 131.0',
    ip: '14.161.42.10',
    location: 'Cầu Giấy, Hà Nội, Việt Nam',
    lastActive: 'Đang hoạt động (Phiên này)',
    isCurrent: true,
  },
  {
    id: 'dev-2',
    deviceName: 'iPhone 15 Pro Max',
    deviceType: 'mobile',
    browser: 'Mobile Safari 18.1',
    ip: '113.190.23.45',
    location: 'Hà Nội, Việt Nam',
    lastActive: 'Hoạt động 35 phút trước',
    isCurrent: false,
  },
  {
    id: 'dev-3',
    deviceName: 'MacBook Air M2 13"',
    deviceType: 'laptop',
    browser: 'Safari 17.5',
    ip: '42.112.88.92',
    location: 'Đà Nẵng, Việt Nam',
    lastActive: 'Hoạt động ngày hôm qua lúc 16:40',
    isCurrent: false,
  },
];

export function ThietBiDangNhapPage() {
  const confirm = useConfirm();
  const [sessions, setSessions] = useState<DeviceSession[]>(INITIAL_SESSIONS);

  const handleRevokeSession = (session: DeviceSession) => {
    confirm({
      title: 'Đăng xuất thiết bị từ xa',
      message: `Bạn có chắc chắn muốn đăng xuất tài khoản khỏi thiết bị "${session.deviceName}"?`,
      confirmText: 'Đăng xuất',
      variant: 'danger',
      onConfirm: () => {
        setSessions((prev) => prev.filter((s) => s.id !== session.id));
        toast.success(`Đã đăng xuất thiết bị ${session.deviceName}`);
      },
    });
  };

  const handleRevokeAllOthers = () => {
    confirm({
      title: 'Đăng xuất tất cả thiết bị khác',
      message: 'Toàn bộ các phiên đăng nhập khác ngoài thiết bị hiện tại sẽ bị hủy hiệu lực ngay lập tức. Bạn có muốn tiếp tục?',
      confirmText: 'Đăng xuất tất cả',
      variant: 'danger',
      onConfirm: () => {
        setSessions((prev) => prev.filter((s) => s.isCurrent));
        toast.success('Đã đăng xuất khỏi tất cả các thiết bị khác');
      },
    });
  };

  const getDeviceIcon = (type: DeviceSession['deviceType']) => {
    switch (type) {
      case 'mobile':
        return <Smartphone size={20} className="text-emerald-500" />;
      case 'laptop':
        return <Laptop size={20} className="text-indigo-500" />;
      default:
        return <Monitor size={20} className="text-primary" />;
    }
  };

  return (
    <div className="flex flex-col h-page relative space-y-4">
      {/* Top Banner */}
      <div className="rounded-xl border border-border bg-gradient-to-r from-teal-500/10 via-primary/5 to-transparent p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-teal-500 text-white shadow-md shadow-teal-500/20 shrink-0">
            <Monitor size={24} />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-semibold text-foreground">
              Quản lý phiên & Thiết bị đăng nhập (Session Management)
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Theo dõi danh sách các thiết bị đang đăng nhập tài khoản của bạn và chủ động đăng xuất từ xa khi cần thiết.
            </p>
          </div>
        </div>

        {sessions.length > 1 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRevokeAllOthers}
            className="gap-1.5 shadow-xs text-destructive hover:bg-destructive/10 hover:border-destructive/30 self-end md:self-auto"
          >
            <LogOut size={15} />
            <span>Đăng xuất tất cả thiết bị khác</span>
          </Button>
        )}
      </div>

      {/* Main Container */}
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-card flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-primary" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Thiết bị đang hoạt động ({sessions.length})
            </h3>
          </div>
          <span className="text-xs text-muted-foreground">Tự động kết thúc sau 30 ngày không hoạt động</span>
        </div>

        <div className="flex-1 min-h-0 overflow-auto divide-y divide-border">
          {sessions.map((s) => (
            <div
              key={s.id}
              className={`p-4 md:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${
                s.isCurrent ? 'bg-primary/5' : 'hover:bg-muted/20'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-card border border-border shadow-xs shrink-0 mt-0.5 sm:mt-0">
                  {getDeviceIcon(s.deviceType)}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-foreground">{s.deviceName}</span>
                    {s.isCurrent && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        <CheckCircle2 size={12} />
                        Thiết bị hiện tại
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    <span className="font-medium text-foreground">{s.browser}</span>
                    <span>•</span>
                    <span className="font-mono">{s.ip}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin size={12} />
                      {s.location}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock size={12} />
                    <span>{s.lastActive}</span>
                  </div>
                </div>
              </div>

              {!s.isCurrent && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRevokeSession(s)}
                  className="h-8 gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:border-destructive/30 shrink-0 self-end sm:self-center"
                >
                  <LogOut size={13} />
                  <span>Đăng xuất</span>
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ThietBiDangNhapPage;
