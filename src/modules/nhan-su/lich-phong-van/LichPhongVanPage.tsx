import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Calendar, ChartColumn, List } from 'lucide-react';
import { t } from '@/lib/i18n';
import { Tabs } from '@/components/ui/Tabs';
import { useTabParam } from '@/modules/shared/useTabParam';
import type { LichPhongVan } from '../tuyen-dung/data';
import { DanhGiaForm, LichPhongVanDetail } from './components';
import { LichCalendar } from './LichCalendar';
import { LichPhongVanList } from './LichPhongVanList';
import { LichStats } from './LichStats';

const TABS = ['lich', 'calendar', 'thongke'] as const;
type Tab = (typeof TABS)[number];
const PANEL = 'flex-1 min-h-0 flex flex-col mt-1.5 rounded-xl border border-border bg-card shadow-sm overflow-hidden';

/** Nhân sự › Lịch phỏng vấn: Danh sách, Lịch tháng, Thống kê. */
export default function LichPhongVanPage() {
  const [tab, setTab] = useTabParam<Tab>(TABS, 'lich');
  const [viewing, setViewing] = useState<LichPhongVan | null>(null);
  const [danhGia, setDanhGia] = useState<LichPhongVan | null>(null);
  return (
    <div className="flex flex-col h-page relative">
      <div className="shrink-0 relative z-0">
        <Tabs<Tab>
          tabs={[
            { id: 'lich', label: t('lichPhongVan.tabs.lich'), icon: List },
            { id: 'calendar', label: t('lichPhongVan.tabs.calendar'), icon: Calendar },
            { id: 'thongke', label: t('lichPhongVan.tabs.thongKe'), icon: ChartColumn },
          ]}
          activeTab={tab}
          onChange={setTab}
        />
      </div>
      {tab === 'lich' ? (
        <div className="flex-1 min-h-0 flex flex-col mt-1.5">
          <LichPhongVanList />
        </div>
      ) : tab === 'calendar' ? (
        <div className={PANEL}>
          <LichCalendar onViewDetail={setViewing} />
        </div>
      ) : (
        <div className={PANEL}>
          <LichStats />
        </div>
      )}
      <AnimatePresence>{viewing && <LichPhongVanDetail data={viewing} onClose={() => setViewing(null)} onEdit={() => setViewing(null)} onOpenDanhGia={setDanhGia} />}</AnimatePresence>
      <AnimatePresence>
        {danhGia && <DanhGiaForm initialData={danhGia} onClose={() => setDanhGia(null)} onSuccess={(row) => viewing?.id === row.id && setViewing(row)} />}
      </AnimatePresence>
    </div>
  );
}
