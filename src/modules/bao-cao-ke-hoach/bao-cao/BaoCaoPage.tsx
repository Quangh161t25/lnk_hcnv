import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { CalendarRange, ChartColumn, List } from 'lucide-react';
import { Tabs } from '@/components/ui/Tabs';
import { useConfirm } from '@/stores/confirm';
import { useTabParam } from '@/modules/shared/useTabParam';
import { pullEmployees } from '@/services/employeesSheet';
import { usePlans } from '../ke-hoach/data';
import { TheoKyView } from '../TheoKyView';
import { CompletionBar, BaoCaoDetail } from './BaoCaoDetail';
import { BaoCaoForm } from './BaoCaoForm';
import { BaoCaoList } from './BaoCaoList';
import { BaoCaoStats } from './BaoCaoStats';
import { useReportAction, useReports, type Report } from './data';

const TABS = ['danhsach', 'theoky', 'thongke'] as const;
type Tab = (typeof TABS)[number];
const PANEL = 'flex-1 min-h-0 flex flex-col mt-1.5 rounded-xl border border-border bg-card shadow-sm overflow-hidden';

/** Báo cáo & Kế hoạch › Báo cáo: báo cáo tuần/tháng của phòng ban và cá nhân (A–D), đối chiếu kế hoạch, gửi duyệt. */
export default function BaoCaoPage() {
  const [tab, setTab] = useTabParam<Tab>(TABS, 'danhsach');
  const { reports, me, source, isLoading } = useReports();
  const { plans } = usePlans();
  const confirm = useConfirm();
  const remove = useReportAction();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Report | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const viewing = viewingId ? (reports.find((r) => r.id === viewingId) ?? null) : null;

  useEffect(() => {
    pullEmployees().catch(() => undefined);
  }, []);

  const openForm = (r: Report | null) => {
    setEditing(r);
    setViewingId(null);
    setFormOpen(true);
  };
  const askDelete = (r: Report) =>
    confirm({
      title: 'Xóa báo cáo',
      message: `Xóa báo cáo "${r.tieu_de}"?`,
      variant: 'danger',
      confirmText: 'Xóa',
      onConfirm: () => remove.mutate({ action: 'delete', id: r.id }, { onSuccess: () => setViewingId(null) }),
    });

  return (
    <div className="flex flex-col h-page relative">
      <div className="shrink-0 relative z-0">
        <Tabs<Tab>
          tabs={[
            { id: 'danhsach', label: 'Danh sách', icon: List },
            { id: 'theoky', label: 'Theo kỳ', icon: CalendarRange },
            { id: 'thongke', label: 'Thống kê', icon: ChartColumn },
          ]}
          activeTab={tab}
          onChange={setTab}
        />
      </div>
      {tab === 'danhsach' ? (
        <div className="flex-1 min-h-0 flex flex-col mt-1.5">
          <BaoCaoList reports={reports} isLoading={isLoading} source={source} onAdd={() => openForm(null)} onView={(r) => setViewingId(r.id)} onEdit={openForm} onDelete={askDelete} />
        </div>
      ) : tab === 'theoky' ? (
        <div className={PANEL}>
          <TheoKyView docs={reports} isLoading={isLoading} onView={(r) => setViewingId(r.id)} periods={['tuan', 'thang']} noun="báo cáo" extra={(r) => <CompletionBar value={r.phan_tram ?? 0} className="w-36" />} />
        </div>
      ) : (
        <div className={PANEL}>
          <BaoCaoStats reports={reports} isLoading={isLoading} />
        </div>
      )}
      <AnimatePresence>{formOpen && me && <BaoCaoForm initialData={editing} me={me} reports={reports} plans={plans} onClose={() => setFormOpen(false)} />}</AnimatePresence>
      <AnimatePresence>{viewing && me && !formOpen && <BaoCaoDetail data={viewing} me={me} plans={plans} onClose={() => setViewingId(null)} onEdit={openForm} onDelete={askDelete} />}</AnimatePresence>
    </div>
  );
}
