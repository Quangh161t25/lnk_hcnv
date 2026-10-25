import { ChartColumn, FileText, List } from 'lucide-react';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { t } from '@/lib/i18n';
import { useTabParam } from '@/modules/shared/useTabParam';
import { BangLuongMy } from './BangLuongMy';
import { BangLuongList } from './BangLuongList';
import { BangLuongStats } from './BangLuongStats';

const TABS = ['my', 'list', 'stats'] as const;
type Tab = (typeof TABS)[number];

export default function BangLuongPage() {
  const [tab, setTab] = useTabParam<Tab>(TABS, 'my');

  const tabList: TabItem<Tab>[] = [
    { id: 'my', label: t('bangLuong.tabs.my'), icon: FileText },
    { id: 'list', label: t('bangLuong.tabs.list'), icon: List },
    { id: 'stats', label: t('bangLuong.tabs.stats'), icon: ChartColumn },
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
        {tab === 'my' && <BangLuongMy />}
        {tab === 'list' && <BangLuongList />}
        {tab === 'stats' && <BangLuongStats />}
      </div>
    </div>
  );
}
