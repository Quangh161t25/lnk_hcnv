import { ChartColumn, Clock, List } from 'lucide-react';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { t } from '@/lib/i18n';
import { useTabParam } from '@/modules/shared/useTabParam';
import { ChamCongToday } from './ChamCongToday';
import { ChamCongHistory } from './ChamCongHistory';
import { ChamCongSummary } from './ChamCongSummary';

const TABS = ['today', 'history', 'summary'] as const;
type Tab = (typeof TABS)[number];

export default function ChamCongPage() {
  const [tab, setTab] = useTabParam<Tab>(TABS, 'today');

  const tabList: TabItem<Tab>[] = [
    { id: 'today', label: t('attendance.tabs.today'), icon: Clock },
    { id: 'history', label: t('attendance.tabs.history'), icon: List },
    { id: 'summary', label: t('attendance.tabs.summary'), icon: ChartColumn },
  ];

  return (
    <div className="flex flex-col h-page relative">
      <div className="shrink-0 relative z-0">
        <Tabs<Tab>
          tabs={tabList}
          activeTab={tab}
          onChange={setTab}
        />
      </div>

      <div className="flex-1 min-h-0 flex flex-col mt-1.5">
        {tab === 'today' && <ChamCongToday />}
        {tab === 'history' && <ChamCongHistory />}
        {tab === 'summary' && <ChamCongSummary />}
      </div>
    </div>
  );
}
