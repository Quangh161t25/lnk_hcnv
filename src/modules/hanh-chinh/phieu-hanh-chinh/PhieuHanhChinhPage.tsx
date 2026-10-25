import { ChartPie, CheckSquare, User } from 'lucide-react';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { t } from '@/lib/i18n';
import { useTabParam } from '@/modules/shared/useTabParam';
import { PhieuMyList } from './PhieuMyList';
import { PhieuManagedList } from './PhieuManagedList';
import { PhieuQuotaList } from './PhieuQuotaList';

const TABS = ['my', 'managed', 'quota'] as const;
type Tab = (typeof TABS)[number];

export default function PhieuHanhChinhPage() {
  const [tab, setTab] = useTabParam<Tab>(TABS, 'my');

  const tabList: TabItem<Tab>[] = [
    { id: 'my', label: t('adminForm.tabs.my'), icon: User },
    { id: 'managed', label: t('adminForm.tabs.managed'), icon: CheckSquare },
    { id: 'quota', label: t('adminForm.tabs.quota'), icon: ChartPie },
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
        {tab === 'my' && <PhieuMyList />}
        {tab === 'managed' && <PhieuManagedList />}
        {tab === 'quota' && <PhieuQuotaList />}
      </div>
    </div>
  );
}
