import { useMemo, useState, type MouseEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bookmark, ChevronRight, CircleQuestionMark, Search, SearchX, Star, type LucideIcon } from 'lucide-react';
import { normalizeText } from '@/lib/utils';
import { t } from '@/lib/i18n';
import { cardColors, type ModuleGroupDef } from '@/config/modules';
import { useFavoriteModules } from '@/stores/favorites';
import { primaryHex, useUiStore } from '@/stores/ui';
import { Tabs } from '@/components/ui/Tabs';
import { EmptyState } from '@/components/ui/Feedback';
import { PageHeaderBar } from '@/components/data/PageHeaderBar';
import { usePermissions } from '@/lib/permissions';

export interface HubItem {
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  moduleId: string;
}

export interface HubGroup {
  groupTitle: string;
  items: HubItem[];
}

/** Chuyển cấu hình module sang nhóm hiển thị. */
export function toHubGroups(base: string, groups: ModuleGroupDef[]): HubGroup[] {
  return groups.map((g) => ({
    groupTitle: t(g.groupKey),
    items: g.items.map((m) => ({ title: t(m.titleKey), description: t(m.descKey), icon: m.icon, color: m.color, moduleId: `${base}/${m.slug}` })),
  }));
}

function filterGroups(groups: HubGroup[], query: string) {
  if (!query.trim()) return groups;
  const q = normalizeText(query);
  return groups
    .map((g) => ({ ...g, items: g.items.filter((i) => normalizeText(i.title).includes(q) || normalizeText(i.description).includes(q)) }))
    .filter((g) => g.items.length > 0);
}

/** Thẻ module: icon màu, tên, mô tả, ghim yêu thích và liên kết hướng dẫn. */
export function ModuleCard({ title, description, icon: Icon, color, moduleId }: HubItem) {
  const navigate = useNavigate();
  const primary = useUiStore((s) => s.primaryColor);
  const colors = cardColors(color, primaryHex(primary));
  const { isFavorite, toggleFavorite } = useFavoriteModules();
  const pinned = isFavorite(moduleId);
  const onPin = (e: MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(moduleId);
  };
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.15)' }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(moduleId)}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(moduleId)}
      className="group relative bg-card rounded-xl p-4 md:p-5 border border-border hover:border-primary/30 shadow-soft transition-all cursor-pointer flex items-start gap-3 md:gap-4"
    >
      <button
        type="button"
        onClick={onPin}
        className="absolute top-3 right-3 z-10 p-1.5 rounded-lg text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
        aria-label={pinned ? 'Bỏ ghim module' : 'Ghim module yêu thích'}
        title={pinned ? 'Bỏ ghim' : 'Ghim module'}
      >
        <Star size={18} className={pinned ? 'fill-amber-500 text-amber-500' : ''} strokeWidth={2} />
      </button>
      <div
        className="shrink-0 rounded-xl transition-transform duration-300 group-hover:scale-105 flex items-center justify-center w-11 h-11 md:w-12 md:h-12"
        style={{ backgroundColor: colors.bg }}
      >
        <Icon className="flex-shrink-0" size={24} strokeWidth={2.25} style={{ color: colors.icon }} aria-hidden />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm mb-0.5 md:mb-1 truncate">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{description}</p>
      </div>
      <Link
        to={`${moduleId}/huong-dan`}
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-3 right-3 z-10 p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
        aria-label={t('guide.buttonTitle')}
        title={t('guide.buttonTitle')}
      >
        <CircleQuestionMark size={16} strokeWidth={2} aria-hidden />
      </Link>
      <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all self-center hidden sm:block" />
    </motion.div>
  );
}

/** Danh sách nhóm module dạng lưới. */
export function ModuleGroupsGrid({ groups: all }: { groups: HubGroup[] }) {
  // Ẩn module không có quyền Xem (Hệ thống › Phân quyền).
  const { can } = usePermissions();
  const groups = all.map((g) => ({ ...g, items: g.items.filter((i) => can(i.moduleId, 'xem')) })).filter((g) => g.items.length > 0);
  return (
    <>
      {groups.map((g, gi) => (
        <div key={gi} className="space-y-4 md:space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-1 h-5 rounded-full bg-primary/80" aria-hidden />
            <h3 className="text-sm font-semibold text-primary">{g.groupTitle}</h3>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            {g.items.map((item) => (
              <ModuleCard key={item.moduleId} {...item} />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

type HubTab = 'all' | 'bookmarks';

/** Trang tổng của một phân hệ (Hành chính / Nhân sự): tab Tất cả/Đánh dấu + tìm kiếm + lưới module. */
export function ModuleHub({ groups, backTo = '/' }: { groups: HubGroup[]; backTo?: string }) {
  const navigate = useNavigate();
  const { isFavorite } = useFavoriteModules();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<HubTab>('all');

  const tabGroups = useMemo(
    () =>
      tab === 'all'
        ? groups
        : groups.map((g) => ({ ...g, items: g.items.filter((i) => isFavorite(i.moduleId)) })).filter((g) => g.items.length > 0),
    [groups, tab, isFavorite],
  );
  const shown = useMemo(() => filterGroups(tabGroups, query), [tabGroups, query]);
  const placeholder = t('page.home.searchPlaceholder');

  const leading = (
    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
      <Tabs<HubTab>
        tabs={[
          { id: 'all', label: t('page.home.tabAll') },
          { id: 'bookmarks', label: t('page.home.tabBookmarks') },
        ]}
        activeTab={tab}
        onChange={setTab}
        className="shrink-0"
      />
      <div className="relative min-w-0 flex-1 sm:min-w-[240px] sm:max-w-md">
        <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full h-9 pl-8 pr-3 rounded-lg bg-muted/40 border border-border/60 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
          aria-label={placeholder}
        />
      </div>
    </div>
  );

  const searching = query.trim().length > 0;
  return (
    <div className="pb-10 pt-2 shrink-0">
      <PageHeaderBar className="-mx-1.5 -mt-2 md:-mx-2 md:-mt-2 mb-4" onBack={() => navigate(backTo)} leadingContent={leading} />
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 md:space-y-8">
        {shown.length === 0 ? (
          <EmptyState
            icon={searching ? SearchX : tab === 'bookmarks' ? Bookmark : undefined}
            title={tab === 'bookmarks' && !searching ? t('page.home.bookmarksEmptyTitle') : t('common.noResults')}
            description={tab === 'bookmarks' && !searching ? t('page.home.bookmarksEmpty') : searching ? t('page.home.searchEmptyHint') : undefined}
            className="min-h-[280px] py-12"
          />
        ) : (
          <ModuleGroupsGrid groups={shown} />
        )}
      </motion.div>
    </div>
  );
}
