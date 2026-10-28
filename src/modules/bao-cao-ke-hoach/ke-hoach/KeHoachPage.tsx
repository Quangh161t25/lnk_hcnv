import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { CalendarRange, ChartColumn, List } from 'lucide-react';
import { Tabs } from '@/components/ui/Tabs';
import { useConfirm } from '@/stores/confirm';
import { useTabParam } from '@/modules/shared/useTabParam';
import { pullEmployees } from '@/services/employeesSheet';
import { usePlanAction, usePlans, type Plan } from './data';
import { KeHoachDetail } from './KeHoachDetail';
import { KeHoachForm } from './KeHoachForm';
import { KeHoachList } from './KeHoachList';
import { KeHoachStats } from './KeHoachStats';
import { TheoKyView } from '../TheoKyView';

const TABS = ['danhsach', 'theoky', 'thongke'] as const;
type Tab = (typeof TABS)[number];
const PANEL = 'flex-1 min-h-0 flex flex-col mt-1.5 rounded-xl border border-border bg-card shadow-sm overflow-hidden';

/** Báo cáo & Kế hoạch › Kế hoạch: kế hoạch phòng ban và cá nhân theo tuần/tháng/quý, có gửi duyệt. */
export default function KeHoachPage() {
  const [tab, setTab] = useTabParam<Tab>(TABS, 'danhsach');
  const { plans, me, source, isLoading } = usePlans();
  const confirm = useConfirm();
  const remove = usePlanAction();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const viewing = viewingId ? (plans.find((p) => p.id === viewingId) ?? null) : null;

  // Danh sách nhân viên (để chọn người phụ trách, hiển thị tên).
  useEffect(() => {
    pullEmployees().catch(() => undefined);
  }, []);

  const openForm = (p: Plan | null) => {
    setEditing(p);
    setViewingId(null);
    setFormOpen(true);
  };
  const askDelete = (p: Plan) =>
    confirm({
      title: 'Xóa kế hoạch',
      message: `Xóa kế hoạch "${p.tieu_de}" và toàn bộ đầu việc?`,
      variant: 'danger',
      confirmText: 'Xóa',
      onConfirm: () => remove.mutate({ action: 'delete', id: p.id }, { onSuccess: () => setViewingId(null) }),
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
          <KeHoachList plans={plans} isLoading={isLoading} source={source} onAdd={() => openForm(null)} onView={(p) => setViewingId(p.id)} onEdit={openForm} onDelete={askDelete} />
        </div>
      ) : tab === 'theoky' ? (
        <div className={PANEL}>
          <TheoKyView docs={plans} isLoading={isLoading} onView={(p) => setViewingId(p.id)} />
        </div>
      ) : (
        <div className={PANEL}>
          <KeHoachStats plans={plans} isLoading={isLoading} />
        </div>
      )}
      <AnimatePresence>{formOpen && me && <KeHoachForm initialData={editing} me={me} plans={plans} onClose={() => setFormOpen(false)} />}</AnimatePresence>
      <AnimatePresence>{viewing && me && !formOpen && <KeHoachDetail data={viewing} me={me} onClose={() => setViewingId(null)} onEdit={openForm} onDelete={askDelete} />}</AnimatePresence>
    </div>
  );
}
