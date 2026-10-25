import { useState } from 'react';
import { Award, BookOpen, Building2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { toast } from 'sonner';

type Tab = 'ky_nang' | 'chung_chi' | 'doi_tac';

const INITIAL_SKILLS = [
  { id: '1', ma: 'SK-REACT', ten: 'React & Frontend Architecture', nhom: 'Chuyên môn Công nghệ' },
  { id: '2', ma: 'SK-LEAD', ten: 'Kỹ năng lãnh đạo & Quản lý đội nhóm', nhom: 'Kỹ năng mềm / Quản lý' },
  { id: '3', ma: 'SK-SALES', ten: 'Đàm phán & Thuyết trình bán hàng B2B', nhom: 'Kinh doanh & Bán hàng' },
  { id: '4', ma: 'SK-SEC', ten: 'Bảo mật thông tin doanh nghiệp (ISO 27001)', nhom: 'An ninh thông tin' },
];

const INITIAL_CERTS = [
  { id: '1', ma: 'CERT-FE-01', ten: 'Chứng nhận Kỹ sư Frontend Chuyên nghiệp', don_vi: 'Nội bộ công ty', thoi_han: '2 năm' },
  { id: '2', ma: 'CERT-PMP', ten: 'Project Management Professional (PMP)', don_vi: 'PMI Institute', thoi_han: '3 năm' },
  { id: '3', ma: 'CERT-ISO', ten: 'Internal Auditor ISO 27001', don_vi: 'Tổ chức BSI', thoi_han: 'Không thời hạn' },
];

const INITIAL_PARTNERS = [
  { id: '1', ma: 'DT-TOPDEV', ten: 'Học viện Đào tạo TopDev Academy', lien_he: '0901 234 567', dia_chi: 'Hà Nội' },
  { id: '2', ma: 'DT-PACE', ten: 'Học viện Quản lý PACE', lien_he: '028 3837 0208', dia_chi: 'TP. Hồ Chí Minh' },
  { id: '3', ma: 'DT-INTERNAL', ten: 'Trung tâm Đào tạo Nội bộ 5F', lien_he: 'hr@5f.com', dia_chi: 'Tầng 5, Tòa nhà 5F' },
];

export default function ThietLapDaoTaoPage() {
  const [tab, setTab] = useState<Tab>('ky_nang');
  const [skills, setSkills] = useState(INITIAL_SKILLS);
  const [certs] = useState(INITIAL_CERTS);
  const [partners] = useState(INITIAL_PARTNERS);

  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillGroup, setNewSkillGroup] = useState('');

  const handleAddSkill = () => {
    if (!newSkillName.trim()) return;
    setSkills((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        ma: `SK-${Date.now().toString().slice(-4)}`,
        ten: newSkillName.trim(),
        nhom: newSkillGroup.trim() || 'Chung',
      },
    ]);
    setNewSkillName('');
    setNewSkillGroup('');
    toast.success('Đã thêm kỹ năng mới vào hệ thống');
  };

  const tabList: TabItem<Tab>[] = [
    { id: 'ky_nang', label: 'Danh mục kỹ năng', icon: BookOpen },
    { id: 'chung_chi', label: 'Danh mục chứng chỉ', icon: Award },
    { id: 'doi_tac', label: 'Đối tác & Giảng viên', icon: Building2 },
  ];

  return (
    <div className="flex flex-col h-page relative">
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden mt-1.5">
        {/* Header Tab Bar */}
        <div className="px-4 pt-3 border-b border-border bg-muted/20 flex items-center justify-between gap-3 flex-wrap">
          <Tabs tabs={tabList} activeTab={tab} onChange={setTab} />
        </div>

        {/* Tab 1: Kỹ năng */}
        {tab === 'ky_nang' && (
          <div className="p-4 flex-1 flex flex-col gap-4 overflow-y-auto max-w-4xl">
            <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/30 flex-wrap">
              <Input
                placeholder="Tên kỹ năng cần đào tạo..."
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                className="text-xs h-8 flex-1 min-w-[200px]"
              />
              <Input
                placeholder="Nhóm kỹ năng (VD: Công nghệ, Kỹ năng mềm...)"
                value={newSkillGroup}
                onChange={(e) => setNewSkillGroup(e.target.value)}
                className="text-xs h-8 flex-1 min-w-[200px]"
              />
              <Button size="sm" onClick={handleAddSkill} className="h-8 gap-1.5 text-xs bg-primary text-white">
                <Plus size={14} /> Thêm kỹ năng
              </Button>
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[11px]">
                    <th className="py-2.5 px-4">Mã</th>
                    <th className="py-2.5 px-4">Tên kỹ năng</th>
                    <th className="py-2.5 px-4">Nhóm phân loại</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {skills.map((s) => (
                    <tr key={s.id} className="hover:bg-muted/30">
                      <td className="py-2.5 px-4 font-mono font-medium text-primary">{s.ma}</td>
                      <td className="py-2.5 px-4 font-medium text-foreground">{s.ten}</td>
                      <td className="py-2.5 px-4 text-muted-foreground">{s.nhom}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Chứng chỉ */}
        {tab === 'chung_chi' && (
          <div className="p-4 flex-1 flex flex-col gap-4 overflow-y-auto max-w-4xl">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-foreground">Danh mục chứng chỉ ghi nhận</h4>
                <p className="text-xs text-muted-foreground">Các chứng chỉ chuyên môn được lưu vào hồ sơ nhân sự sau khóa học</p>
              </div>
              <Button size="sm" onClick={() => toast.info('Thêm chứng chỉ mới')} className="h-8 gap-1.5 text-xs bg-primary text-white">
                <Plus size={14} /> Thêm chứng chỉ
              </Button>
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[11px]">
                    <th className="py-2.5 px-4">Mã chứng chỉ</th>
                    <th className="py-2.5 px-4">Tên chứng chỉ</th>
                    <th className="py-2.5 px-4">Đơn vị cấp</th>
                    <th className="py-2.5 px-4">Thời hạn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {certs.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/30">
                      <td className="py-2.5 px-4 font-mono font-medium text-primary">{c.ma}</td>
                      <td className="py-2.5 px-4 font-medium text-foreground">{c.ten}</td>
                      <td className="py-2.5 px-4 text-muted-foreground">{c.don_vi}</td>
                      <td className="py-2.5 px-4 text-muted-foreground">{c.thoi_han}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Đối tác */}
        {tab === 'doi_tac' && (
          <div className="p-4 flex-1 flex flex-col gap-4 overflow-y-auto max-w-4xl">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-foreground">Đối tác đào tạo & Giảng viên ngoài</h4>
                <p className="text-xs text-muted-foreground">Danh sách đơn vị hợp tác cung cấp các khóa học và dịch vụ đào tạo</p>
              </div>
              <Button size="sm" onClick={() => toast.info('Thêm đối tác đào tạo')} className="h-8 gap-1.5 text-xs bg-primary text-white">
                <Plus size={14} /> Thêm đối tác
              </Button>
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[11px]">
                    <th className="py-2.5 px-4">Mã đối tác</th>
                    <th className="py-2.5 px-4">Tên đối tác / Trung tâm</th>
                    <th className="py-2.5 px-4">Số điện thoại / Email</th>
                    <th className="py-2.5 px-4">Địa chỉ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {partners.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/30">
                      <td className="py-2.5 px-4 font-mono font-medium text-primary">{p.ma}</td>
                      <td className="py-2.5 px-4 font-medium text-foreground">{p.ten}</td>
                      <td className="py-2.5 px-4 text-muted-foreground">{p.lien_he}</td>
                      <td className="py-2.5 px-4 text-muted-foreground">{p.dia_chi}</td>
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
