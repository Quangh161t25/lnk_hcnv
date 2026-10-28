import { useState } from 'react';
import { Target, CheckSquare, Building2, TrendingUp, Layers, Award } from 'lucide-react';
import { Tabs, type TabItem } from '@/components/ui/Tabs';

type Tab = 'chuc_nang' | 'kpi_chuan';

interface DeptMission {
  id: string;
  deptName: string;
  code: string;
  mission: string;
  functions: string[];
  kpis: string[];
}

const MISSIONS: DeptMission[] = [
  {
    id: '1',
    deptName: 'Phòng Hành chính - Nhân sự (HCNS)',
    code: 'PB-HCNS',
    mission: 'Xây dựng và phát triển đội ngũ nhân lực vững mạnh, tối ưu văn hóa doanh nghiệp và bảo đảm môi trường làm việc hiệu quả, chuyên nghiệp.',
    functions: [
      'Hoạch định nguồn nhân lực, tuyển dụng và đào tạo phát triển năng lực nhân viên.',
      'Quản lý hồ sơ nhân sự, hợp đồng lao động và thực hiện các chế độ chính sách, bảo hiểm.',
      'Tổ chức chấm công, tính lương thưởng và xây dựng hệ thống đãi ngộ cạnh tranh.',
      'Quản lý cơ sở vật chất, tài sản, trang thiết bị văn phòng và điều phối đội xe công vụ.',
      'Tổ chức các sự kiện nội bộ, chăm sóc đời sống tinh thần và phát triển văn hóa Vũ Gia.',
    ],
    kpis: [
      'Tỷ lệ đáp ứng nhu cầu tuyển dụng đúng hạn (≥ 90%)',
      'Tỷ lệ nhân sự hoàn thành thử việc đạt yêu cầu (≥ 85%)',
      'Độ chính xác và đúng hạn trong tính lương & công (100% trước ngày 05)',
      'Chỉ số hài lòng của nhân viên đối với dịch vụ hành chính (≥ 4.5/5.0)',
    ],
  },
  {
    id: '2',
    deptName: 'Ban Giám đốc & Nhóm Điều hành',
    code: 'PB-GD',
    mission: 'Hoạch định chiến lược dài hạn, chỉ đạo điều hành toàn diện hoạt động sản xuất kinh doanh và quản trị rủi ro của Tập đoàn.',
    functions: [
      'Xác định tầm nhìn, sứ mệnh, giá trị cốt lõi và chiến lược phát triển 3-5 năm.',
      'Phê duyệt các kế hoạch kinh doanh, ngân sách tài chính và dự án đầu tư trọng điểm.',
      'Giám sát hoạt động của các khối phòng ban, ban hành các quy chế điều hành nội bộ.',
      'Đại diện pháp lý và phát triển quan hệ với các đối tác chiến lược cấp cao.',
    ],
    kpis: [
      'Tỷ lệ hoàn thành mục tiêu doanh thu & lợi nhuận năm (≥ 100%)',
      'Mức tăng trưởng thị phần và mở rộng quy mô kinh doanh (≥ 20%/năm)',
      'Hiệu quả sử dụng vốn và chỉ số ROE / ROI mục tiêu',
    ],
  },
  {
    id: '3',
    deptName: 'Phòng Kế toán - Tài chính',
    code: 'PB-KTTC',
    mission: 'Quản trị minh bạch dòng tiền, tối ưu hóa chi phí vận hành và đảm bảo an toàn tài chính bền vững cho doanh nghiệp.',
    functions: [
      'Thiết lập và quản lý hệ thống sổ sách kế toán theo chuẩn mực và pháp luật hiện hành.',
      'Lập báo cáo tài chính định kỳ, báo cáo thuế và quyết toán thường niên.',
      'Quản lý thu chi ngân sách, kiểm soát thanh toán và thu hồi công nợ khách hàng.',
      'Phân tích hiệu quả tài chính các dự án và tham mưu chiến lược tài chính cho Ban Giám đốc.',
    ],
    kpis: [
      'Đúng hạn và chính xác trong báo cáo tài chính & nộp thuế (100%)',
      'Tỷ lệ nợ xấu / nợ quá hạn kiểm soát dưới ngưỡng cho phép (< 2%)',
      'Tối ưu hóa chi phí vận hành và quản lý dòng tiền an toàn',
    ],
  },
  {
    id: '4',
    deptName: 'Phòng Kỹ thuật & Công nghệ',
    code: 'PB-TECH',
    mission: 'Nghiên cứu, phát triển và ứng dụng giải pháp kỹ thuật, công nghệ tiên tiến nhằm nâng cao năng suất và năng lực cạnh tranh.',
    functions: [
      'Quản trị, vận hành và bảo đảm an toàn hệ thống hạ tầng CNTT và phần mềm ERP.',
      'Thiết kế, chế tạo và kiểm định tiêu chuẩn kỹ thuật các sản phẩm, giải pháp Vũ Gia.',
      'Hỗ trợ kỹ thuật và bảo hành bảo trì sản phẩm cho khách hàng và đối tác.',
    ],
    kpis: [
      'Thời gian uptime hệ thống ERP và dịch vụ mạng (≥ 99.8%)',
      'Tốc độ xử lý sự cố kỹ thuật và hỗ trợ nội bộ (< 2 giờ)',
      'Tiến độ nghiên cứu phát triển các giải pháp mới đúng kế hoạch',
    ],
  },
];

export function ChucNangNhiemVuPage() {
  const [tab, setTab] = useState<Tab>('chuc_nang');

  const tabList: TabItem<Tab>[] = [
    { id: 'chuc_nang', label: 'Chức năng nhiệm vụ theo phòng ban', icon: Building2 },
    { id: 'kpi_chuan', label: 'Khung năng lực & KPI tiêu chuẩn', icon: Target },
  ];

  return (
    <div className="flex flex-col h-page relative space-y-4">
      {/* Top Banner */}
      <div className="rounded-xl border border-border bg-gradient-to-r from-sky-500/10 via-indigo-500/5 to-transparent p-5 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-sky-500 text-white shadow-md shadow-sky-500/20 shrink-0">
            <Target size={24} />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-semibold text-foreground">
              Chức năng nhiệm vụ & Bộ chỉ số KPI Vũ Gia
            </h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-3xl leading-relaxed">
              Quy định rõ ràng về sứ mệnh, chức năng cốt lõi của từng phòng ban và khung đánh giá hiệu suất công việc (KPI), giúp phân định trách nhiệm minh bạch và tối ưu hóa năng suất doanh nghiệp.
            </p>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {/* Header Tabs */}
        <div className="px-4 pt-3 border-b border-border bg-muted/20 flex items-center justify-between gap-3">
          <Tabs tabs={tabList} activeTab={tab} onChange={setTab} />
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-auto p-4 md:p-6">
          {tab === 'chuc_nang' ? (
            <div className="space-y-6">
              {MISSIONS.map((dept) => (
                <div
                  key={dept.id}
                  className="rounded-xl border border-border bg-card p-5 shadow-xs hover:border-primary/30 transition-colors space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-border/60 pb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Building2 size={18} />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-foreground">{dept.deptName}</h3>
                        <span className="text-xs font-mono text-muted-foreground">{dept.code}</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      Đang áp dụng
                    </span>
                  </div>

                  {/* Sứ mệnh */}
                  <div className="rounded-lg bg-muted/40 p-3 text-sm">
                    <span className="font-semibold text-foreground">Sứ mệnh phòng ban: </span>
                    <span className="text-muted-foreground">{dept.mission}</span>
                  </div>

                  {/* 2 cột Chức năng và KPI */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                        <CheckSquare size={14} />
                        <span>Chức năng & Nhiệm vụ cốt lõi</span>
                      </div>
                      <ul className="space-y-1.5 text-sm text-muted-foreground">
                        {dept.functions.map((fn, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                            <span>{fn}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-600">
                        <Award size={14} />
                        <span>Bộ chỉ số KPI trọng yếu</span>
                      </div>
                      <ul className="space-y-1.5 text-sm text-muted-foreground">
                        {dept.kpis.map((kpi, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                            <span className="font-medium text-foreground">{kpi}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                  <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                    <Layers size={18} />
                    <span>Thang đánh giá hiệu suất</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Hệ thống tính điểm từ 0 đến 100 điểm, chia làm 5 phân cấp: Xuất sắc (A), Tốt (B), Đạt yêu cầu (C), Cần cải thiện (D), Không đạt (F).
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm">
                    <TrendingUp size={18} />
                    <span>Chu kỳ đánh giá</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Đánh giá định kỳ hàng tháng gắn liền với bảng lương và xét duyệt tăng bậc, khen thưởng cuối năm tài chính.
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm">
                    <Award size={18} />
                    <span>Gắn kết đãi ngộ</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Điểm số KPI được liên kết trực tiếp vào hệ số thưởng năng suất và điểm cộng trừ trong module Chấm điểm KPI Hành chính.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Khung năng lực cốt lõi cán bộ nhân viên Vũ Gia:</h4>
                <div className="divide-y divide-border text-sm">
                  <div className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-medium text-foreground">1. Tinh thần trách nhiệm & Chủ động</span>
                      <p className="text-xs text-muted-foreground">Tự giác trong công việc, cam kết hoàn thành đúng hạn và chất lượng.</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">Trọng số 25%</span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-medium text-foreground">2. Năng lực chuyên môn & Kỹ năng nghiệp vụ</span>
                      <p className="text-xs text-muted-foreground">Nắm vững kiến thức, thao tác nghiệp vụ chính xác, sáng tạo giải pháp.</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">Trọng số 35%</span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-medium text-foreground">3. Kỹ năng làm việc nhóm & Hợp tác</span>
                      <p className="text-xs text-muted-foreground">Tương tác hiệu quả với đồng nghiệp, hỗ trợ liên phòng ban vì mục tiêu chung.</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">Trọng số 20%</span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-medium text-foreground">4. Ý thức kỷ luật & Văn hóa doanh nghiệp</span>
                      <p className="text-xs text-muted-foreground">Tuân thủ nội quy lao động, quy tắc bảo mật và chuẩn mực ứng xử Vũ Gia.</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">Trọng số 20%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChucNangNhiemVuPage;
