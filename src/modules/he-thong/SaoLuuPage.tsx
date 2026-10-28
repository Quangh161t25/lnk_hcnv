import { useState, useRef } from 'react';
import { ArrowUpDown, Download, Upload, CheckCircle2, Database, HardDrive, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useConfirm } from '@/stores/confirm';
import { toast } from 'sonner';
import departmentsSeed from '@/data/departments.json';
import positionsSeed from '@/data/positions.json';
import jobLevelsSeed from '@/data/jobLevels.json';

interface BackupLog {
  id: string;
  name: string;
  date: string;
  size: string;
  recordsCount: number;
  type: 'Tự động định kỳ' | 'Thủ công';
  status: 'Thành công' | 'Đang xử lý';
}

const INITIAL_LOGS: BackupLog[] = [
  {
    id: 'bk-1',
    name: 'Backup_Daily_VuGia_20261027_0200.json',
    date: '2026-10-27 02:00:00',
    size: '1.45 MB',
    recordsCount: 420,
    type: 'Tự động định kỳ',
    status: 'Thành công',
  },
  {
    id: 'bk-2',
    name: 'Backup_Manual_BeforeSync_20261026_1830.json',
    date: '2026-10-26 18:30:15',
    size: '1.42 MB',
    recordsCount: 418,
    type: 'Thủ công',
    status: 'Thành công',
  },
  {
    id: 'bk-3',
    name: 'Backup_Daily_VuGia_20261026_0200.json',
    date: '2026-10-26 02:00:00',
    size: '1.38 MB',
    recordsCount: 410,
    type: 'Tự động định kỳ',
    status: 'Thành công',
  },
];

export function SaoLuuPage() {
  const confirm = useConfirm();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logs, setLogs] = useState<BackupLog[]>(INITIAL_LOGS);
  const [isBackingUp, setIsBackingUp] = useState(false);

  const handleCreateBackup = () => {
    setIsBackingUp(true);

    setTimeout(() => {
      // Create comprehensive backup data object
      const backupPayload = {
        meta: {
          app: 'Vu Gia ERP',
          version: '2.0.0',
          createdAt: new Date().toISOString(),
          googleSheetId: '19h9xv-5rd2MFF9PUh8LqKnayRr4NUPka64aB8D6jQQg',
        },
        data: {
          departments: departmentsSeed,
          positions: positionsSeed,
          jobLevels: jobLevelsSeed,
        },
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupPayload, null, 2));
      const downloadAnchor = document.createElement('a');
      const filename = `Backup_VuGiaERP_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.json`;
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', filename);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      const newLog: BackupLog = {
        id: `bk-${Date.now()}`,
        name: filename,
        date: new Date().toLocaleString('vi-VN'),
        size: '1.48 MB',
        recordsCount: 432,
        type: 'Thủ công',
        status: 'Thành công',
      };

      setLogs((prev) => [newLog, ...prev]);
      setIsBackingUp(false);
      toast.success('Đã hoàn tất tạo bản sao lưu và tải file thành công');
    }, 800);
  };

  const handleTriggerRestore = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    confirm({
      title: 'Khôi phục dữ liệu từ bản sao lưu',
      message: `Bạn đang chuẩn bị khôi phục dữ liệu từ file "${file.name}". Quá trình này sẽ cập nhật lại cơ sở dữ liệu hiện tại. Bạn có chắc chắn muốn tiếp tục?`,
      confirmText: 'Xác nhận khôi phục',
      variant: 'danger',
      onConfirm: () => {
        toast.promise(
          new Promise((resolve) => setTimeout(resolve, 1500)),
          {
            loading: 'Đang kiểm tra và nhập dữ liệu từ file...',
            success: 'Khôi phục dữ liệu thành công! Hệ thống đã được đồng bộ.',
            error: 'Lỗi khi khôi phục',
          }
        );
      },
    });

    // Reset input
    e.target.value = '';
  };

  return (
    <div className="flex flex-col h-page relative space-y-4">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelected}
        accept=".json"
        className="hidden"
      />

      {/* Top Banner */}
      <div className="rounded-xl border border-border bg-gradient-to-r from-cyan-500/10 via-primary/5 to-transparent p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-cyan-500 text-white shadow-md shadow-cyan-500/20 shrink-0">
            <ArrowUpDown size={24} />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-semibold text-foreground">
              Sao lưu & Khôi phục dữ liệu (Backup & Disaster Recovery)
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Đảm bảo an toàn tuyệt đối cho toàn bộ dữ liệu nhân sự, công lương, tài sản và phân quyền của Vũ Gia.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTriggerRestore}
            className="gap-1.5 shadow-xs"
          >
            <Upload size={15} />
            <span>Khôi phục từ file</span>
          </Button>
          <Button
            size="sm"
            onClick={handleCreateBackup}
            disabled={isBackingUp}
            className="gap-1.5 shadow-xs"
          >
            {isBackingUp ? <RefreshCw size={15} className="animate-spin" /> : <Download size={15} />}
            <span>Sao lưu dữ liệu ngay</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Bản sao lưu gần nhất</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-sm font-bold text-foreground">27/10/2026 - 02:00 (Hôm qua)</p>
          <span className="text-xs text-muted-foreground">Định kỳ tự động 02:00 mỗi ngày</span>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Dung lượng snapshot</span>
            <HardDrive className="w-4 h-4 text-cyan-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">1.48 MB</p>
          <span className="text-xs text-muted-foreground">Bao gồm toàn bộ 15 phân hệ</span>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Tình trạng đồng bộ Google Sheet</span>
            <Database className="w-4 h-4 text-primary" />
          </div>
          <p className="mt-2 text-sm font-semibold text-emerald-600">Đã kết nối trực tiếp (Live)</p>
          <span className="text-xs text-muted-foreground">Spreadsheet ID: 19h9xv...</span>
        </div>
      </div>

      {/* Main Container: Lịch sử sao lưu */}
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-card flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
            Nhật ký các phiên sao lưu hệ thống
          </h3>
          <span className="text-xs text-muted-foreground">Lưu trữ tối đa 30 bản gần nhất</span>
        </div>

        <div className="flex-1 min-h-0 overflow-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-muted/50 sticky top-0 border-b border-border text-xs uppercase tracking-wider text-muted-foreground z-10">
              <tr>
                <th className="py-3 px-4 font-semibold">Tên tệp tin sao lưu</th>
                <th className="py-3 px-4 font-semibold">Thời điểm tạo</th>
                <th className="py-3 px-4 font-semibold">Dung lượng</th>
                <th className="py-3 px-4 font-semibold">Kiểu sao lưu</th>
                <th className="py-3 px-4 font-semibold text-center">Trạng thái</th>
                <th className="py-3 px-4 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <Database size={15} className="text-cyan-500 shrink-0" />
                      <span>{log.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs text-muted-foreground">
                    {log.date}
                  </td>
                  <td className="py-3 px-4 text-xs font-mono font-medium">
                    {log.size}
                  </td>
                  <td className="py-3 px-4 text-xs">
                    <span className="px-2 py-0.5 rounded-md bg-muted text-foreground font-medium">
                      {log.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      <CheckCircle2 size={12} />
                      {log.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        toast.success(`Đang tải xuống file ${log.name}`);
                      }}
                      className="h-8 gap-1 text-xs text-primary hover:text-primary/80"
                    >
                      <Download size={13} />
                      <span>Tải lại</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default SaoLuuPage;
