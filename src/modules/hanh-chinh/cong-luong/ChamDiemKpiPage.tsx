import { useMemo, useState } from 'react';
import { Award, CheckCircle2, Download, Edit3, Plus, Search, Target, TrendingUp, Users } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { toast } from 'sonner';

type Tab = 'my_kpi' | 'manage_kpi';

interface KpiItem {
  id: string;
  muc_tieu: string;
  trong_so: number;
  chi_tieu: string;
  thuc_dat: string;
  diem: number;
  nhan_xet: string;
}

interface MemberKpi {
  id: string;
  ma_nv: string;
  ho_ten: string;
  phong_ban: string;
  chuc_vu: string;
  ky_danh_gia: string;
  tong_diem: number;
  xep_loai: 'A+' | 'A' | 'B' | 'C' | 'D';
  trang_thai: 'chua_cham' | 'da_cham' | 'da_duyet';
}

const MY_KPI_ITEMS: KpiItem[] = [
  { id: '1', muc_tieu: 'Hoàn thành phát triển phân hệ Hành chính - Nhân sự đúng hạn', trong_so: 40, chi_tieu: '100% đúng tiến độ', thuc_dat: '100%', diem: 95, nhan_xet: 'Đáp ứng tốt tiến độ và chất lượng mã nguồn' },
  { id: '2', muc_tieu: 'Giảm thiểu tỷ lệ lỗi phát sinh sau nghiệm thu dưới 2%', trong_so: 30, chi_tieu: '< 2%', thuc_dat: '1.2%', diem: 98, nhan_xet: 'Chất lượng kiểm thử tự động cao' },
  { id: '3', muc_tieu: 'Hỗ trợ đào tạo nhân sự mới & chia sẻ kiến thức kỹ thuật', trong_so: 30, chi_tieu: '2 buổi sharing', thuc_dat: '2 buổi', diem: 90, nhan_xet: 'Tích cực tham gia hoạt động đào tạo' },
];

const MEMBER_KPIS: MemberKpi[] = [
  { id: '1', ma_nv: 'NV001', ho_ten: 'Nguyễn Văn An', phong_ban: 'Phòng Công nghệ', chuc_vu: 'Lập trình viên', ky_danh_gia: 'Tháng 02/2025', tong_diem: 94.4, xep_loai: 'A', trang_thai: 'da_duyet' },
  { id: '2', ma_nv: 'NV002', ho_ten: 'Trần Thị Mai', phong_ban: 'Phòng Kế toán', chuc_vu: 'Kế toán tổng hợp', ky_danh_gia: 'Tháng 02/2025', tong_diem: 92.0, xep_loai: 'A', trang_thai: 'da_duyet' },
  { id: '3', ma_nv: 'NV003', ho_ten: 'Lê Hoàng Nam', phong_ban: 'Phòng Marketing', chuc_vu: 'Chuyên viên SEO', ky_danh_gia: 'Tháng 02/2025', tong_diem: 78.5, xep_loai: 'B', trang_thai: 'chua_cham' },
  { id: '4', ma_nv: 'NV004', ho_ten: 'Phạm Thu Hương', phong_ban: 'Phòng HCNS', chuc_vu: 'Chuyên viên Tuyển dụng', ky_danh_gia: 'Tháng 02/2025', tong_diem: 97.0, xep_loai: 'A+', trang_thai: 'da_duyet' },
];

const STATUS_BADGE = {
  chua_cham: 'bg-muted text-muted-foreground border-border',
  da_cham: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  da_duyet: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
};

const STATUS_LABEL = {
  chua_cham: 'Chưa chấm điểm',
  da_cham: 'Đã chấm điểm',
  da_duyet: 'Đã chốt kết quả',
};

export default function ChamDiemKpiPage() {
  const [tab, setTab] = useState<Tab>('my_kpi');
  const [period, setPeriod] = useState('2025-02');
  const [searchTerm, setSearchTerm] = useState('');
  const [members, setMembers] = useState(MEMBER_KPIS);
  const [scoringMember, setScoringMember] = useState<MemberKpi | null>(null);
  const [tempScore, setTempScore] = useState('');

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return m.ho_ten.toLowerCase().includes(q) || m.ma_nv.toLowerCase().includes(q) || m.phong_ban.toLowerCase().includes(q);
    });
  }, [members, searchTerm]);

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(tab === 'my_kpi' ? MY_KPI_ITEMS : filteredMembers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, tab === 'my_kpi' ? 'MyKPI' : 'QuanLyKPI');
    XLSX.writeFile(wb, `Bao_cao_KPI_${period}.xlsx`);
  };

  const handleSaveScore = () => {
    if (!scoringMember) return;
    const score = parseFloat(tempScore);
    if (isNaN(score) || score < 0 || score > 100) {
      toast.error('Điểm KPI phải từ 0 đến 100');
      return;
    }
    const grade: 'A+' | 'A' | 'B' | 'C' | 'D' = score >= 95 ? 'A+' : score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 50 ? 'C' : 'D';
    setMembers((prev) => prev.map((m) => (m.id === scoringMember.id ? { ...m, tong_diem: score, xep_loai: grade, trang_thai: 'da_cham' } : m)));
    setScoringMember(null);
    toast.success(`Đã cập nhật điểm KPI cho ${scoringMember.ho_ten}: ${score} điểm (${grade})`);
  };

  const tabList: TabItem<Tab>[] = [
    { id: 'my_kpi', label: 'KPI của tôi', icon: Target },
    { id: 'manage_kpi', label: 'Tôi quản lý / Đánh giá', icon: Users },
  ];

  return (
    <div className="flex flex-col h-page relative">
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden mt-1.5">
        {/* Header Tabs & Toolbar */}
        <div className="px-4 pt-3 border-b border-border bg-muted/20 flex items-center justify-between gap-3 flex-wrap">
          <Tabs tabs={tabList} activeTab={tab} onChange={setTab} />
          <div className="flex items-center gap-2 pb-2">
            <Select
              options={[
                { value: '2025-02', label: 'Kỳ tháng 02/2025' },
                { value: '2025-01', label: 'Kỳ tháng 01/2025' },
                { value: '2024-12', label: 'Kỳ tháng 12/2024' },
              ]}
              value={period}
              onChange={setPeriod}
              className="text-xs h-8 w-40"
            />
            <Button size="sm" variant="outline" onClick={handleExport} className="h-8 gap-1.5 text-xs">
              <Download size={14} /> Xuất Excel
            </Button>
          </div>
        </div>

        {/* Tab 1: My KPI */}
        {tab === 'my_kpi' ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Quick KPI Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-muted/30 p-3.5 rounded-xl border border-border shadow-2xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Target size={20} />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Điểm KPI tổng</div>
                  <div className="text-xl font-bold text-foreground">94.4 / 100</div>
                </div>
              </div>

              <div className="bg-muted/30 p-3.5 rounded-xl border border-border shadow-2xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                  <Award size={20} />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Xếp loại tháng</div>
                  <div className="text-xl font-bold text-emerald-600">Loại A</div>
                </div>
              </div>

              <div className="bg-muted/30 p-3.5 rounded-xl border border-border shadow-2xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Thưởng KPI ước tính</div>
                  <div className="text-xl font-bold text-foreground">100% mức thưởng</div>
                </div>
              </div>

              <div className="bg-muted/30 p-3.5 rounded-xl border border-border shadow-2xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Trạng thái phê duyệt</div>
                  <div className="text-sm font-semibold text-emerald-600">Đã chốt kết quả</div>
                </div>
              </div>
            </div>

            {/* My KPI Table */}
            <div className="border border-border rounded-xl overflow-hidden bg-card">
              <div className="p-3.5 border-b border-border bg-muted/20 font-semibold text-xs text-foreground">
                Chi tiết các chỉ tiêu KPI cá nhân - Kỳ đánh giá {period}
              </div>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[11px]">
                    <th className="py-3 px-4">Mục tiêu & Hạng mục công việc</th>
                    <th className="py-3 px-4 text-center">Trọng số</th>
                    <th className="py-3 px-4">Chỉ tiêu cam kết</th>
                    <th className="py-3 px-4">Thực tế đạt được</th>
                    <th className="py-3 px-4 text-center">Điểm số</th>
                    <th className="py-3 px-4">Nhận xét của Quản lý</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {MY_KPI_ITEMS.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/30">
                      <td className="py-3 px-4 font-medium text-foreground max-w-xs">{item.muc_tieu}</td>
                      <td className="py-3 px-4 text-center font-bold text-primary">{item.trong_so}%</td>
                      <td className="py-3 px-4">{item.chi_tieu}</td>
                      <td className="py-3 px-4 font-medium text-emerald-600">{item.thuc_dat}</td>
                      <td className="py-3 px-4 text-center font-bold text-foreground">{item.diem}</td>
                      <td className="py-3 px-4 text-muted-foreground text-[11px]">{item.nhan_xet}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Search toolbar */}
            <div className="p-4 border-b border-border flex items-center justify-between gap-3 flex-wrap bg-muted/20">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm theo tên, mã NV, phòng ban..."
                  className="pl-8 text-xs h-8"
                />
              </div>
              <Button size="sm" onClick={() => toast.info('Chức năng giao chỉ tiêu KPI cho nhân viên')} className="h-8 gap-1.5 text-xs bg-primary text-white">
                <Plus size={14} /> Giao KPI kỳ mới
              </Button>
            </div>

            {/* Subordinates Table */}
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[11px]">
                    <th className="py-3 px-4">Mã NV</th>
                    <th className="py-3 px-4">Họ và tên</th>
                    <th className="py-3 px-4">Phòng ban / Chức vụ</th>
                    <th className="py-3 px-4 text-center">Kỳ đánh giá</th>
                    <th className="py-3 px-4 text-center">Tổng điểm</th>
                    <th className="py-3 px-4 text-center">Xếp loại</th>
                    <th className="py-3 px-4 text-center">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredMembers.map((m) => (
                    <tr key={m.id} className="hover:bg-muted/30">
                      <td className="py-3 px-4 font-mono font-medium text-primary">{m.ma_nv}</td>
                      <td className="py-3 px-4 font-medium text-foreground">{m.ho_ten}</td>
                      <td className="py-3 px-4">
                        <div className="text-foreground">{m.phong_ban}</div>
                        <div className="text-[11px] text-muted-foreground">{m.chuc_vu}</div>
                      </td>
                      <td className="py-3 px-4 text-center">{m.ky_danh_gia}</td>
                      <td className="py-3 px-4 text-center font-bold text-foreground">{m.tong_diem || '-'}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
                          {m.xep_loai}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${STATUS_BADGE[m.trang_thai]}`}>
                          {STATUS_LABEL[m.trang_thai]}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setScoringMember(m);
                            setTempScore(m.tong_diem ? String(m.tong_diem) : '90');
                          }}
                          className="h-7 text-xs gap-1"
                        >
                          <Edit3 size={13} /> Chấm điểm
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal scoring */}
      {scoringMember && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-lg w-full max-w-md p-5 space-y-4">
            <h3 className="text-base font-semibold text-foreground">Chấm điểm KPI nhân viên</h3>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Nhân viên: <strong className="text-foreground">{scoringMember.ho_ten}</strong> ({scoringMember.ma_nv})</div>
              <div>Phòng ban: {scoringMember.phong_ban}</div>
              <div>Kỳ đánh giá: {scoringMember.ky_danh_gia}</div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">Tổng điểm KPI (Thang điểm 100):</label>
              <Input
                type="number"
                min={0}
                max={100}
                value={tempScore}
                onChange={(e) => setTempScore(e.target.value)}
                placeholder="Nhập điểm từ 0 đến 100..."
                className="text-sm h-9"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setScoringMember(null)}>
                Hủy
              </Button>
              <Button size="sm" onClick={handleSaveScore} className="bg-primary text-white">
                Lưu điểm KPI
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
