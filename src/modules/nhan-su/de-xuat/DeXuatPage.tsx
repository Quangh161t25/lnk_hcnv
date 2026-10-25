import { ChartColumn, List } from 'lucide-react';
import { t } from '@/lib/i18n';
import { Tabs } from '@/components/ui/Tabs';
import { useTabParam } from '@/modules/shared/useTabParam';
import { DeXuatList } from './DeXuatList';
import { DeXuatStats } from './DeXuatStats';

const TABS = ['danhsach', 'thongke'] as const;
type Tab = (typeof TABS)[number];

/** Nhân sự › Đề xuất tuyển dụng: tab Danh sách + Thống kê. */
export default function DeXuatPage() {
  const [tab, setTab] = useTabParam<Tab>(TABS, 'danhsach');
  return (
    <div className="flex flex-col h-page relative">
      <div className="shrink-0 relative z-0">
        <Tabs<Tab>
          tabs={[
            { id: 'danhsach', label: t('deXuatTuyenDung.tabs.danhSach'), icon: List },
            { id: 'thongke', label: t('deXuatTuyenDung.tabs.thongKe'), icon: ChartColumn },
          ]}
          activeTab={tab}
          onChange={setTab}
        />
      </div>
      {tab === 'danhsach' ? (
        <div className="flex-1 min-h-0 flex flex-col mt-1.5">
          <DeXuatList />
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col mt-1.5 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <DeXuatStats />
        </div>
      )}
    </div>
  );
}
