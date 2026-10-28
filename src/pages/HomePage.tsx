import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight, Search, type LucideIcon } from 'lucide-react';
import { t } from '@/lib/i18n';
import { NAV_ITEMS } from '@/config/navigation';
import { HANH_CHINH_GROUPS, NHAN_SU_GROUPS, HE_THONG_GROUPS } from '@/config/modules';
import { useAuthStore } from '@/stores/auth';
import { useFavoriteModules } from '@/stores/favorites';
import { Tabs } from '@/components/ui/Tabs';
import { EmptyState } from '@/components/ui/Feedback';
import { ModuleGroupsGrid, toHubGroups, type HubGroup } from './ModuleHub';

function greetingKey(hour: number) {
  if (hour >= 5 && hour < 12) return 'page.home.greetingMorning';
  if (hour >= 12 && hour < 18) return 'page.home.greetingAfternoon';
  return 'page.home.greetingEvening';
}

function FunctionCard({ title, description, icon: Icon, gradient, onClick }: { title: string; description: string; icon: LucideIcon; gradient: string; onClick: () => void }) {
  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group relative rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200 cursor-pointer flex flex-col items-center text-center"
    >
      <div className="absolute top-3 right-3 rounded-full bg-muted p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
      <div className={`mb-4 flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${gradient} shadow-sm group-hover:scale-105 transition-transform duration-200`}>
        <Icon className="w-7 h-7 text-white" strokeWidth={1.8} />
      </div>
      <h2 className="text-base md:text-lg font-semibold text-foreground leading-tight mb-1.5 line-clamp-1">{title}</h2>
      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 min-h-[2.5rem]">{description}</p>
    </motion.div>
  );
}

function filterByQuery(groups: HubGroup[], q: string) {
  if (!q) return groups;
  return groups
    .map((g) => ({ ...g, items: g.items.filter((i) => i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)) }))
    .filter((g) => g.items.length > 0);
}

type HomeTab = 'functions' | 'bookmarks' | 'all';

/** Trang chủ: lời chào + tab Chức năng / Đánh dấu / Tất cả. */
export function HomePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { favoriteIds } = useFavoriteModules();
  const [tab, setTab] = useState<HomeTab>('functions');
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  const functions = NAV_ITEMS.filter((n) => n.path !== '/');
  const allGroups = useMemo(
    () => [
      ...toHubGroups('/hanh-chinh', HANH_CHINH_GROUPS),
      ...toHubGroups('/nhan-su', NHAN_SU_GROUPS),
      ...toHubGroups('/he-thong', HE_THONG_GROUPS),
    ],
    []
  );
  const bookmarked = useMemo(() => {
    const set = new Set(favoriteIds);
    return allGroups.map((g) => ({ ...g, items: g.items.filter((i) => set.has(i.moduleId)) })).filter((g) => g.items.length > 0);
  }, [allGroups, favoriteIds]);
  const shownAll = useMemo(() => filterByQuery(allGroups, q), [allGroups, q]);
  const shownBookmarks = useMemo(() => filterByQuery(bookmarked, q), [bookmarked, q]);

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } } };

  return (
    <div className="pb-10 pt-2 shrink-0">
      <div className="mb-6">
        <h1 className="text-lg md:text-xl font-semibold text-foreground tracking-tight">
          {t(greetingKey(new Date().getHours()))}, <span className="text-primary">{user?.full_name || t('page.home.adminFallback')}</span> 👋
        </h1>
      </div>
      <div className="h-px bg-border w-full" />
      <div className="sticky top-12 md:top-14 z-20 py-2 -mx-1 px-1 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center gap-2 sm:gap-3">
          <Tabs<HomeTab>
            tabs={[
              { id: 'functions', label: t('page.home.tabFunctions') },
              { id: 'bookmarks', label: t('page.home.tabBookmarks') },
              { id: 'all', label: t('page.home.tabAll') },
            ]}
            activeTab={tab}
            onChange={setTab}
            className="shrink-0"
          />
          {(tab === 'all' || tab === 'bookmarks') && (
            <div className="relative min-w-0 flex-1 sm:min-w-[240px] sm:max-w-md">
              <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('page.home.searchPlaceholder')}
                className="w-full h-9 pl-8 pr-3 bg-muted/40 border border-border/60 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                aria-label={t('page.home.searchPlaceholder')}
              />
            </div>
          )}
        </div>
      </div>
      <div className="pt-3">
        {tab === 'functions' && (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 h-full items-start content-start"
          >
            {functions.map((f) => (
              <motion.div key={f.path} variants={item}>
                <FunctionCard title={t(f.nameKey)} description={t(f.descriptionKey)} icon={f.icon} gradient={f.gradient} onClick={() => navigate(f.path)} />
              </motion.div>
            ))}
          </motion.div>
        )}
        {tab === 'bookmarks' &&
          (bookmarked.length > 0 ? (
            <div className="space-y-6 md:space-y-8">
              <ModuleGroupsGrid groups={shownBookmarks} />
            </div>
          ) : (
            <EmptyState title={t('page.home.tabBookmarks')} description={t('page.home.bookmarksEmpty')} />
          ))}
        {tab === 'all' &&
          (shownAll.length > 0 ? (
            <div className="space-y-6 md:space-y-8">
              <ModuleGroupsGrid groups={shownAll} />
            </div>
          ) : (
            <EmptyState title={t('page.home.tabAll')} description={t('page.home.searchPlaceholder')} />
          ))}
      </div>
    </div>
  );
}
