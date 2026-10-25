import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Check, Plus, SquarePen, Trash2, X, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t, LOCALE } from '@/lib/i18n';
import { formatDateTime } from '@/lib/format';
import { createListStore, filterItems } from '@/stores/createListStore';
import { useConfirm } from '@/stores/confirm';
import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';
import { MultiSelectFilter } from '@/components/ui/MultiSelectFilter';
import { Drawer, DRAWER_WIDTH } from '@/components/ui/Drawer';
import { DetailFooter, DetailSection } from '@/components/ui/Sections';
import { ListToolbar } from '@/components/data/ListToolbar';
import { DataTable } from '@/components/data/DataTable';

/** Các khối dùng chung cho những tab "danh mục" trong trang Thiết lập (mã, tên, trạng thái hoạt động...). */

export const ACTIVE = 'Đang hoạt động';
export const INACTIVE = 'Ngừng hoạt động';

export interface CatalogRow {
  id: string;
  trang_thai: string;
  tg_cap_nhat: string;
}

/* ---------- Nút gạt trạng thái hoạt động ---------- */

export function StatusToggle({
  label,
  value,
  onChange,
  icon,
  required,
  disabled = false,
  error,
  className,
}: {
  label?: ReactNode;
  value: string;
  onChange: (v: string) => void;
  icon?: ReactNode;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
}) {
  const on = value === ACTIVE;
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="text-sm font-medium leading-none mb-2 flex items-center gap-1.5 text-foreground">
          {icon && <span className="text-muted-foreground shrink-0">{icon}</span>}
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <button
        type="button"
        onClick={() => !disabled && onChange(on ? INACTIVE : ACTIVE)}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between rounded-lg border px-3 py-2 h-10 text-sm font-medium transition-all duration-200',
          on ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-muted/30 border-border text-muted-foreground',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        <span className="flex items-center gap-2">
          {on ? <Check size={14} className="text-primary" /> : <X size={14} className="text-muted-foreground" />}
          {on ? ACTIVE : INACTIVE}
        </span>
        <div className={cn('relative w-9 h-5 rounded-full transition-colors duration-200 shrink-0', on ? 'bg-primary' : 'bg-border')}>
          <div className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-card shadow-sm transition-transform duration-200', on ? 'translate-x-4' : 'translate-x-0.5')} />
        </div>
      </button>
      {error && <p className="text-xs font-medium text-destructive mt-1.5 ml-1">{error}</p>}
    </div>
  );
}

export function ActiveBadge({ value }: { value: string }) {
  return value === ACTIVE ? (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">{t('common.active')}</span>
  ) : (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">{t('common.inactive')}</span>
  );
}

/* ---------- Khung trang chi tiết ---------- */

export function CatalogDetail({
  title,
  subtitle,
  icon: Icon,
  iconBg = 'from-primary to-primary/80 shadow-primary/20',
  meta,
  active,
  sectionTitle,
  sectionIcon,
  onClose,
  onEdit,
  onDelete,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  icon: LucideIcon;
  iconBg?: string;
  meta?: ReactNode;
  active: boolean;
  sectionTitle: string;
  sectionIcon?: ReactNode;
  onClose: () => void;
  onEdit: () => void;
  onDelete?: () => void;
  children: ReactNode;
}) {
  return (
    <Drawer
      title={title}
      icon={<Icon size={20} />}
      subtitle={subtitle}
      onClose={onClose}
      maxWidthClass={DRAWER_WIDTH}
      footer={
        <DetailFooter
          onClose={onClose}
          onEdit={() => {
            onEdit();
            onClose();
          }}
          onDelete={
            onDelete
              ? () => {
                  onDelete();
                  onClose();
                }
              : undefined
          }
        />
      }
    >
      <div className="space-y-5">
        <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
          <div className={cn('h-14 w-14 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg shrink-0', iconBg)}>
            <Icon size={24} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground leading-tight truncate">{title}</h2>
            {meta}
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              {active ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" /> {t('common.active')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium border border-border">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" /> {t('common.inactive')}
                </span>
              )}
            </div>
          </div>
        </div>
        <DetailSection title={sectionTitle} icon={sectionIcon}>
          {children}
        </DetailSection>
      </div>
    </Drawer>
  );
}

/* ---------- Tab danh sách danh mục ---------- */

type StatusFilter = { status: string[] };
export type CatalogListStore = ReturnType<typeof createListStore<StatusFilter>>;
export const createCatalogStore = (columns: Parameters<typeof createListStore<StatusFilter>>[1]) => createListStore<StatusFilter>({ status: [] }, columns);

interface MutationLike<V> {
  mutate: (vars: V, opts?: { onSuccess?: () => void }) => void;
}

export interface CatalogTabConfig<T extends CatalogRow> {
  /** Khóa i18n của tab, vd. "thietLapTuyenDung.kenhTuyenDung". */
  prefix: string;
  /** Giá trị ?tab= của tab, dùng cho tham số openId. */
  tabKey: string;
  useList: CatalogListStore;
  useData: () => { data?: T[]; isLoading: boolean };
  useDelete: () => MutationLike<string[]>;
  useStatusMany?: () => MutationLike<{ ids: string[]; status: string }>;
  filterIcon: LucideIcon;
  searchFields: (r: T) => (string | null | undefined)[];
  renderCell: (col: string, r: T) => ReactNode;
  card: {
    icon: LucideIcon;
    title: (r: T) => string;
    subtitle: (r: T) => ReactNode;
    extra?: (r: T) => { label: string; value: string } | null;
  };
  Form: ComponentType<{ initialData: T | null; onClose: () => void }>;
  Detail: ComponentType<{ data: T; onClose: () => void; onEdit: (r: T) => void; onDelete?: (id: string) => void }>;
}

export function CatalogTab<T extends CatalogRow>(cfg: CatalogTabConfig<T>) {
  const { prefix, useList } = cfg;
  const confirm = useConfirm();
  const list = useList();
  const { searchTerm, filters, sort, resetState, clearSelection, selectedIds } = list;
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [viewing, setViewing] = useState<T | null>(null);
  const [reopenAfterEdit, setReopenAfterEdit] = useState<string | null>(null);
  const [params, setParams] = useSearchParams();
  const { data: rows = [], isLoading } = cfg.useData();
  const remove = cfg.useDelete();
  const statusMany = cfg.useStatusMany?.();

  useEffect(() => () => resetState(), [resetState]);

  // Mở sẵn chi tiết khi được điều hướng tới với ?tab=...&openId=...
  const openId = params.get('openId');
  useEffect(() => {
    if (params.get('tab') !== cfg.tabKey || !openId || rows.length === 0) return;
    const hit = rows.find((r) => r.id === openId);
    if (hit) setViewing(hit);
    setParams({}, { replace: true });
  }, [openId, rows, params, setParams, cfg.tabKey]);

  const matches = (r: T, q: string, f: StatusFilter) => {
    const s = q.toLowerCase();
    const text = !q || cfg.searchFields(r).some((v) => !!v && v.toLowerCase().includes(s));
    const st = r.trang_thai === ACTIVE ? 'Active' : 'Inactive';
    return text && (f.status.length === 0 || f.status.includes(st));
  };
  const filtered = useMemo(() => filterItems(rows, searchTerm, filters, matches), [rows, searchTerm, filters]); // eslint-disable-line react-hooks/exhaustive-deps
  const sorted = useMemo(() => {
    if (!sort.column || !sort.direction) return filtered;
    const col = sort.column;
    return [...filtered].sort((a, b) => {
      const av = (a as unknown as Record<string, unknown>)[col] ?? '';
      const bv = (b as unknown as Record<string, unknown>)[col] ?? '';
      const c = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv), LOCALE);
      return sort.direction === 'desc' ? -c : c;
    });
  }, [filtered, sort]);

  const statusOptions = useMemo(
    () => [
      { label: t('common.activeStatus'), value: 'Active', count: rows.filter((r) => r.trang_thai === ACTIVE).length },
      { label: t('common.inactiveStatus'), value: 'Inactive', count: rows.filter((r) => r.trang_thai === INACTIVE).length },
    ],
    [rows],
  );

  const edit = (r: T) => {
    setEditing(r);
    setFormOpen(true);
    setReopenAfterEdit(viewing?.id === r.id ? r.id : null);
    setViewing(null);
  };
  const askDelete = (id: string) =>
    confirm({
      title: t(`${prefix}.deleteTitle`),
      message: t(`${prefix}.deleteMessage`),
      variant: 'danger',
      confirmText: t('common.delete'),
      onConfirm: () => remove.mutate([id], { onSuccess: () => viewing?.id === id && setViewing(null) }),
    });
  const askDeleteMany = (ids: string[]) =>
    confirm({
      title: t(`${prefix}.bulkDeleteTitle`),
      message: t(`${prefix}.bulkDeleteMessage`, { count: ids.length }),
      variant: 'danger',
      confirmText: t('common.deleteAll'),
      onConfirm: () =>
        remove.mutate(ids, {
          onSuccess: () => {
            clearSelection();
            if (viewing && ids.includes(viewing.id)) setViewing(null);
          },
        }),
    });
  const askStatusMany = (ids: string[], status: string) =>
    statusMany &&
    confirm({
      title: t(`${prefix}.statusChangeTitle`),
      message: t(`${prefix}.statusChangeMessage`, { count: ids.length, status: t(status === ACTIVE ? 'common.active' : 'common.inactive') }),
      variant: 'warning',
      confirmText: t('common.confirm'),
      onConfirm: () =>
        statusMany.mutate(
          { ids, status },
          {
            onSuccess: () => {
              clearSelection();
              setViewing(null);
            },
          },
        ),
    });
  const closeForm = () => {
    const reopen = reopenAfterEdit;
    setFormOpen(false);
    setEditing(null);
    setReopenAfterEdit(null);
    if (reopen) setViewing(rows.find((r) => r.id === reopen) ?? null);
  };
  const add = () => {
    setViewing(null);
    setEditing(null);
    setFormOpen(true);
  };

  const renderCell = (col: string, r: T) => {
    if (col === 'trang_thai') return <ActiveBadge value={r.trang_thai} />;
    if (col === 'tg_cap_nhat') return <span className="text-xs text-muted-foreground tabular-nums">{formatDateTime(r.tg_cap_nhat)}</span>;
    if (col === 'actions')
      return (
        <div className="flex items-center justify-center gap-1">
          <Tooltip content={t('common.edit')} placement="left">
            <button
              onClick={(e) => {
                e.stopPropagation();
                edit(r);
              }}
              className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all"
              aria-label={t('common.edit')}
            >
              <SquarePen size={16} />
            </button>
          </Tooltip>
          <Tooltip content={t('common.delete')} placement="left">
            <button
              onClick={(e) => {
                e.stopPropagation();
                askDelete(r.id);
              }}
              className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all"
              aria-label={t('common.delete')}
            >
              <Trash2 size={16} />
            </button>
          </Tooltip>
        </div>
      );
    return cfg.renderCell(col, r);
  };

  const CardIcon = cfg.card.icon;
  const renderCard = (y: T, selected: boolean) => {
    const extra = cfg.card.extra?.(y);
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => setViewing(y)}
        onKeyDown={(e) => e.key === 'Enter' && setViewing(y)}
        className={`bg-card rounded-xl border p-3.5 shadow-sm transition-all ${selected ? 'border-primary ring-2 ring-primary/10' : 'border-border'}`}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="h-11 w-11 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <CardIcon size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-semibold text-foreground text-sm truncate">{cfg.card.title(y)}</h4>
              <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                <input type="checkbox" checked={selected} onChange={() => list.toggleSelection(y.id)} className="w-4 h-4 rounded border-border text-primary accent-primary cursor-pointer" aria-label={t('common.select')} />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {cfg.card.subtitle(y)}
              <ActiveBadge value={y.trang_thai} />
            </div>
          </div>
        </div>
        {extra ? (
          <div className="grid grid-cols-1 gap-2 px-3 py-2 bg-muted/30 rounded-lg mb-3 text-body-sm">
            <p className="text-muted-foreground mb-0.5">{extra.label}</p>
            <p className="font-medium text-foreground line-clamp-2">{extra.value}</p>
          </div>
        ) : null}
        <div className="flex justify-between items-center pt-2.5 border-t border-border">
          <span className="text-muted-foreground text-xs">{formatDateTime(y.tg_cap_nhat)}</span>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                edit(y);
              }}
              className="p-2 text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-all active:scale-90"
              aria-label={t('common.edit')}
            >
              <SquarePen size={14} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                askDelete(y.id);
              }}
              className="p-2 text-rose-500 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 rounded-lg transition-all active:scale-90"
              aria-label={t('common.delete')}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const { Form, Detail } = cfg;
  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <ListToolbar
        selectedCount={selectedIds.size}
        searchTerm={searchTerm}
        onSearchChange={list.setSearchTerm}
        onClearSelection={clearSelection}
        searchPlaceholder={t(`${prefix}.searchPlaceholder`)}
        actions={
          <Button onClick={add} size="sm" className="bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 h-9 px-3 sm:px-4">
            <Plus className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
            <span className="hidden sm:inline">{t('common.addNew')}</span>
          </Button>
        }
        filters={
          <MultiSelectFilter options={statusOptions} value={filters.status} onChange={(v) => list.setFilter('status', v)} placeholder={t('common.status')} icon={cfg.filterIcon} className="w-full sm:w-[140px]" />
        }
        filterGroups={[{ key: 'status', label: t('common.status'), icon: cfg.filterIcon, options: statusOptions, value: filters.status, onChange: (v) => list.setFilter('status', v) }]}
        onAdd={add}
        activeFilterCount={filters.status.length}
        onClearAllFilters={() => list.setFilter('status', [])}
        onDeleteMany={() => askDeleteMany(Array.from(selectedIds))}
        onStatusChangeMany={statusMany ? (s) => askStatusMany(Array.from(selectedIds), s) : undefined}
        columns={list.columns}
        onToggleColumn={list.toggleColumn}
        onReorderColumns={list.reorderColumns}
        onResetColumns={list.resetColumns}
        showBack
      />
      <div className="flex-1 min-h-0">
        <DataTable
          data={sorted}
          columns={list.columns}
          isLoading={isLoading}
          loadingText={t('common.loading')}
          selectedIds={selectedIds}
          onToggleSelection={list.toggleSelection}
          onToggleAll={list.toggleAllSelection}
          page={list.pagination.page}
          pageSize={list.pagination.pageSize}
          onPageChange={list.setPage}
          onPageSizeChange={list.setPageSize}
          sort={sort}
          onSort={list.setSort}
          onResizeColumn={list.resizeColumn}
          renderCell={renderCell}
          renderMobileCard={renderCard}
          keyExtractor={(r) => r.id}
          onRowClick={setViewing}
        />
      </div>
      <AnimatePresence>{formOpen && <Form initialData={editing} onClose={closeForm} />}</AnimatePresence>
      <AnimatePresence>
        {viewing && !formOpen && (
          <Detail
            data={viewing}
            onClose={() => setViewing(null)}
            onEdit={edit}
            onDelete={(id) => {
              setViewing(null);
              askDelete(id);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
