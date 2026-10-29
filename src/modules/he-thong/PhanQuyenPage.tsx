import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Boxes, Copy, Crown, Info, KeyRound, RotateCcw, Save, Search, Shield, UserCog, Users } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';
import { apiFetch } from '@/lib/api';
import { Tabs } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Feedback';
import { MODULE_ROOTS } from '@/config/modules';
import { useEmployeeStore, type Employee } from '@/stores/employees';
import { useTabParam } from '@/modules/shared/useTabParam';
import { pullEmployees } from '@/services/employeesSheet';
import { FULL, PERM_ACTIONS, PERM_KEY, usePermissions, type ModulePerm, type PermAction, type PermRow } from '@/lib/permissions';
import { VaiTroTab } from './VaiTroTab';

const TABS = ['nhanvien', 'module', 'vaitro'] as const;
type Tab = (typeof TABS)[number];
const DEFAULT = '*';
const LOCAL_KEY = 'lnk-hcns:permissions';

/** Danh mục module lấy từ cấu hình menu (phân hệ → nhóm → module). */
interface ModuleInfo {
  key: string;
  title: string;
  section: string;
  group: string;
}
function useModuleCatalog(): ModuleInfo[] {
  return useMemo(
    () =>
      MODULE_ROOTS.flatMap((root) =>
        root.groups.flatMap((g) => g.items.map((m) => ({ key: `${root.base.slice(1)}/${m.slug}`, title: t(m.titleKey), section: t(root.labelKey), group: t(g.groupKey) }))),
      ),
    [],
  );
}

const pk = (ma: string, module: string) => `${ma.toLowerCase()}|${module}`;

/** Bảng quyền đang chỉnh: dòng gốc từ Sheet + bản nháp chưa lưu. */
function usePermEditor() {
  const qc = useQueryClient();
  const [rows, setRows] = useState<PermRow[] | null>(null);
  const [offline, setOffline] = useState(false);
  // undefined = theo bảng gốc; null = bỏ cấu hình riêng (theo mặc định); object = quyền riêng
  const [draft, setDraft] = useState<Map<string, ModulePerm | null>>(new Map());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch<{ rows?: PermRow[] }>('/api/permissions')
      .then((res) => {
        if (res) return setRows(res.rows ?? []);
        setOffline(true);
        try {
          setRows(JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '[]') as PermRow[]);
        } catch {
          setRows([]);
        }
      })
      .catch((e: Error) => {
        toast.error(e.message);
        setRows([]);
      });
  }, []);

  const base = rows ?? [];
  const explicit = (ma: string, module: string): ModulePerm | null => {
    const k = pk(ma, module);
    if (draft.has(k)) return draft.get(k) ?? null;
    const r = base.find((x) => pk(x.ma_nv, x.module) === k);
    return r ? { xem: r.xem, them: r.them, sua: r.sua, xoa: r.xoa } : null;
  };
  const effective = (ma: string, module: string): ModulePerm => explicit(ma, module) ?? (ma === DEFAULT ? FULL : (explicit(DEFAULT, module) ?? FULL));
  const set = (entries: { ma: string; module: string; perm: ModulePerm | null }[]) =>
    setDraft((d) => {
      const n = new Map(d);
      for (const e of entries) n.set(pk(e.ma, e.module), e.perm);
      return n;
    });

  /** Bật/tắt một quyền; bật quyền khác cũng bật Xem, tắt Xem thì tắt hết. */
  const toggle = (ma: string, module: string, action: PermAction | 'all', value: boolean): { ma: string; module: string; perm: ModulePerm } => {
    const cur = effective(ma, module);
    let next: ModulePerm;
    if (action === 'all') next = { xem: value, them: value, sua: value, xoa: value };
    else if (action === 'xem' && !value) next = { xem: false, them: false, sua: false, xoa: false };
    else next = { ...cur, [action]: value, ...(value ? { xem: true } : {}) };
    return { ma, module, perm: next };
  };

  const save = async (employees: Employee[], catalog: ModuleInfo[]) => {
    const merged = new Map<string, PermRow>();
    for (const r of base) merged.set(pk(r.ma_nv, r.module), r);
    for (const [k, v] of draft) {
      const [ma, module] = [k.slice(0, k.indexOf('|')), k.slice(k.indexOf('|') + 1)];
      if (v == null) merged.delete(k);
      else {
        const emp = employees.find((e) => e.ma_nv.toLowerCase() === ma);
        merged.set(k, {
          ma_nv: ma === DEFAULT ? DEFAULT : (emp?.ma_nv ?? ma.toUpperCase()),
          ho_ten: ma === DEFAULT ? 'Mặc định cho mọi nhân viên' : (emp?.ho_ten ?? ''),
          module,
          ten_module: catalog.find((m) => m.key === module)?.title ?? module,
          ...v,
        });
      }
    }
    const list = [...merged.values()];
    setSaving(true);
    try {
      const res = await apiFetch<{ rows: PermRow[] }>('/api/permissions', { method: 'PUT', body: JSON.stringify({ rows: list }) });
      if (res) setRows(res.rows);
      else {
        localStorage.setItem(LOCAL_KEY, JSON.stringify(list));
        setRows(list);
      }
      setDraft(new Map());
      qc.invalidateQueries({ queryKey: PERM_KEY });
      toast.success(res ? 'Đã lưu phân quyền vào Google Sheet' : 'Đã lưu phân quyền (bản cục bộ)');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return { loading: rows == null, offline, explicit, effective, set, toggle, save, saving, dirty: draft.size, discard: () => setDraft(new Map()) };
}
type Editor = ReturnType<typeof usePermEditor>;

/* ---------- Ô quyền ---------- */

function Cell({ checked, partial, disabled, onChange, label }: { checked: boolean; partial?: boolean; disabled?: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <td className="px-2 py-1.5 text-center">
      <input
        type="checkbox"
        aria-label={label}
        className="w-4 h-4 accent-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        checked={checked}
        ref={(el) => {
          if (el) el.indeterminate = !!partial && !checked;
        }}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
    </td>
  );
}

const th = 'px-2 py-2 text-xs font-semibold text-foreground/80 text-center whitespace-nowrap';

/** Bảng quyền: mỗi dòng là một (người, module); có dòng tổng cho cả nhóm và cột "Tất cả". */
function Matrix({
  rows,
  editor,
  nameHeader,
  groupBy,
  readOnly,
}: {
  rows: { id: string; ma: string; module: string; title: string; sub?: string; group?: string; isAdmin?: boolean }[];
  editor: Editor;
  nameHeader: string;
  groupBy?: boolean;
  readOnly?: boolean;
}) {
  const editable = rows.filter((r) => !r.isAdmin);
  const all = (action: PermAction | 'all', list = editable) => list.length > 0 && list.every((r) => (action === 'all' ? PERM_ACTIONS.every(({ key }) => editor.effective(r.ma, r.module)[key]) : editor.effective(r.ma, r.module)[action]));
  const some = (action: PermAction | 'all', list = editable) => list.some((r) => (action === 'all' ? PERM_ACTIONS.some(({ key }) => editor.effective(r.ma, r.module)[key]) : editor.effective(r.ma, r.module)[action]));
  const bulk = (action: PermAction | 'all', v: boolean, list = editable) => editor.set(list.map((r) => editor.toggle(r.ma, r.module, action, v)));

  const groups = groupBy ? Array.from(new Set(rows.map((r) => r.group ?? ''))) : [''];
  const header = (list: typeof editable, label: string, sticky = false) => (
    <tr className={cn(sticky ? 'sticky top-0 z-[2] bg-muted' : 'bg-muted/50', 'border-b border-border')}>
      <th className={cn(th, 'text-left px-3', !sticky && 'text-primary')}>{label}</th>
      {[...PERM_ACTIONS.map((a) => ({ key: a.key as PermAction | 'all', label: a.label })), { key: 'all' as const, label: 'Tất cả' }].map((c) =>
        sticky ? (
          <th key={c.key} className={th}>
            <span className="block">{c.label}</span>
            <input type="checkbox" className="w-3.5 h-3.5 mt-1 accent-primary" aria-label={`${c.label} — tất cả`} disabled={readOnly || !editable.length} checked={all(c.key, list)} ref={(el) => {
              if (el) el.indeterminate = !all(c.key, list) && some(c.key, list);
            }} onChange={(e) => bulk(c.key, e.target.checked, list)} />
          </th>
        ) : (
          <Cell key={c.key} label={`${label} — ${c.label}`} checked={all(c.key, list)} partial={some(c.key, list)} disabled={readOnly || !list.length} onChange={(v) => bulk(c.key, v, list)} />
        ),
      )}
    </tr>
  );

  return (
    <div className="rounded-xl border border-border overflow-auto custom-scrollbar max-h-full">
      <table className="w-full text-sm">
        <thead>{header(editable, nameHeader, true)}</thead>
        {groups.map((g) => {
          const list = rows.filter((r) => (groupBy ? (r.group ?? '') === g : true));
          return (
            <tbody key={g} className="divide-y divide-border/60">
              {groupBy && g && header(list.filter((r) => !r.isAdmin), g)}
              {list.map((r) => {
                const eff = r.isAdmin ? FULL : editor.effective(r.ma, r.module);
                const custom = r.ma !== DEFAULT && editor.explicit(r.ma, r.module) != null;
                return (
                  <tr key={r.id} className="hover:bg-muted/30">
                    <td className="px-3 py-1.5">
                      <span className="flex items-center gap-1.5">
                        {r.isAdmin ? <Crown size={13} className="text-amber-500 shrink-0" /> : custom ? <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" title="Cấu hình riêng (khác mặc định)" /> : <span className="w-1.5 shrink-0" />}
                        <span className="text-foreground">{r.title}</span>
                      </span>
                      {r.sub ? <span className="block pl-3 text-xs text-muted-foreground">{r.sub}</span> : null}
                    </td>
                    {PERM_ACTIONS.map(({ key, label }) => (
                      <Cell key={key} label={`${r.title} — ${label}`} checked={eff[key]} disabled={readOnly || r.isAdmin} onChange={(v) => editor.set([editor.toggle(r.ma, r.module, key, v)])} />
                    ))}
                    <Cell label={`${r.title} — Tất cả`} checked={PERM_ACTIONS.every(({ key }) => eff[key])} partial={PERM_ACTIONS.some(({ key }) => eff[key])} disabled={readOnly || r.isAdmin} onChange={(v) => editor.set([editor.toggle(r.ma, r.module, 'all', v)])} />
                  </tr>
                );
              })}
            </tbody>
          );
        })}
      </table>
    </div>
  );
}

/* ---------- Danh sách bên trái ---------- */

function SideList<T>({ items, selected, onSelect, render, search, onSearch, placeholder, keyOf }: { items: T[]; selected: string; onSelect: (k: string) => void; render: (i: T) => React.ReactNode; search: string; onSearch: (v: string) => void; placeholder: string; keyOf: (i: T) => string }) {
  return (
    <div className="flex flex-col min-h-0 h-full rounded-xl border border-border bg-card overflow-hidden">
      <div className="p-2 border-b border-border">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => onSearch(e.target.value)} placeholder={placeholder} className="w-full h-8 pl-8 pr-2 rounded-lg bg-muted/40 border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-1.5 space-y-0.5">
        {items.map((i) => {
          const k = keyOf(i);
          return (
            <button key={k} type="button" onClick={() => onSelect(k)} className={cn('w-full text-left px-2.5 py-2 rounded-lg text-sm transition-colors', selected === k ? 'bg-primary/10 text-primary' : 'hover:bg-muted/60 text-foreground')}>
              {render(i)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').toLowerCase();

/* ---------- Tab "Theo nhân viên" ---------- */

function TheoNhanVien({ editor, employees, catalog }: { editor: Editor; employees: Employee[]; catalog: ModuleInfo[] }) {
  const [selected, setSelected] = useState(DEFAULT);
  const [q, setQ] = useState('');
  const [copyFrom, setCopyFrom] = useState('');
  const people = [{ ma_nv: DEFAULT, ho_ten: 'Mặc định cho mọi nhân viên', chuc_vu: 'Áp dụng khi chưa cấu hình riêng', vai_tro: 'member' } as Employee, ...employees];
  const shown = people.filter((p) => !q || norm(`${p.ho_ten} ${p.ma_nv} ${p.chuc_vu}`).includes(norm(q)));
  const emp = people.find((p) => p.ma_nv === selected) ?? people[0];
  const isAdmin = emp.vai_tro === 'admin' && emp.ma_nv !== DEFAULT;
  const customCount = (ma: string) => catalog.filter((m) => editor.explicit(ma, m.key) != null).length;

  const resetToDefault = () => editor.set(catalog.map((m) => ({ ma: emp.ma_nv, module: m.key, perm: null })));
  const copy = () => {
    if (!copyFrom) return;
    editor.set(catalog.map((m) => ({ ma: emp.ma_nv, module: m.key, perm: editor.explicit(copyFrom, m.key) })));
    toast.success(`Đã chép quyền của ${people.find((p) => p.ma_nv === copyFrom)?.ho_ten} — bấm Lưu để áp dụng`);
  };
  const rows = catalog.map((m) => ({ id: m.key, ma: emp.ma_nv, module: m.key, title: m.title, group: `${m.section} › ${m.group}`, isAdmin }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-[260px_minmax(0,1fr)] gap-3 h-full min-h-0">
      <SideList
        items={shown}
        selected={selected}
        onSelect={setSelected}
        keyOf={(p) => p.ma_nv}
        search={q}
        onSearch={setQ}
        placeholder="Tìm nhân viên..."
        render={(p) => (
          <span className="flex items-center gap-2">
            {p.ma_nv === DEFAULT ? <Users size={15} className="shrink-0" /> : p.vai_tro === 'admin' ? <Crown size={15} className="text-amber-500 shrink-0" /> : <UserCog size={15} className="shrink-0 text-muted-foreground" />}
            <span className="min-w-0 flex-1">
              <span className="block font-medium truncate">{p.ho_ten}</span>
              <span className="block text-xs text-muted-foreground truncate">{p.ma_nv === DEFAULT ? p.chuc_vu : `${p.ma_nv} · ${p.vai_tro === 'admin' ? 'Quản trị viên' : customCount(p.ma_nv) ? `${customCount(p.ma_nv)} module riêng` : 'Theo mặc định'}`}</span>
            </span>
          </span>
        )}
      />
      <div className="flex flex-col min-h-0 gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground mr-auto">
            {emp.ho_ten}
            {emp.ma_nv !== DEFAULT && <span className="ml-1.5 text-xs font-normal text-muted-foreground">{emp.ma_nv} · {emp.chuc_vu}</span>}
          </h3>
          {!isAdmin && emp.ma_nv !== DEFAULT && (
            <>
              <div className="w-56">
                <Select options={people.filter((p) => p.ma_nv !== emp.ma_nv && p.vai_tro !== 'admin').map((p) => ({ label: p.ho_ten, value: p.ma_nv }))} value={copyFrom} onChange={setCopyFrom} placeholder="Chép quyền từ..." dropdownInPortal />
              </div>
              <Button size="sm" variant="outline" className="h-9 gap-1.5" onClick={copy} disabled={!copyFrom}>
                <Copy size={14} /> Chép
              </Button>
              <Button size="sm" variant="outline" className="h-9 gap-1.5" onClick={resetToDefault} title="Bỏ toàn bộ cấu hình riêng, dùng quyền mặc định">
                <RotateCcw size={14} /> Theo mặc định
              </Button>
            </>
          )}
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
            <Crown size={14} /> Quản trị viên luôn có toàn quyền. Đổi vai trò ở Hệ thống › Nhân viên nếu muốn giới hạn.
          </div>
        )}
        {emp.ma_nv === DEFAULT && (
          <div className="flex items-center gap-2 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-xs text-sky-700 dark:text-sky-400">
            <Info size={14} /> Nhân viên chưa được cấu hình riêng cho module nào sẽ dùng quyền ở đây. Dấu chấm xanh ở từng nhân viên = cấu hình riêng.
          </div>
        )}
        <div className="flex-1 min-h-0">
          <Matrix rows={rows} editor={editor} nameHeader="Module" groupBy />
        </div>
      </div>
    </div>
  );
}

/* ---------- Tab "Theo module" ---------- */

function TheoModule({ editor, employees, catalog }: { editor: Editor; employees: Employee[]; catalog: ModuleInfo[] }) {
  const [selected, setSelected] = useState(catalog[0]?.key ?? '');
  const [q, setQ] = useState('');
  const [qe, setQe] = useState('');
  const shown = catalog.filter((m) => !q || norm(`${m.title} ${m.section} ${m.group}`).includes(norm(q)));
  const mod = catalog.find((m) => m.key === selected) ?? catalog[0];
  const people = employees.filter((e) => !qe || norm(`${e.ho_ten} ${e.ma_nv} ${e.phong_ban}`).includes(norm(qe)));
  const rows = [
    { id: DEFAULT, ma: DEFAULT, module: mod.key, title: 'Mặc định cho mọi nhân viên', sub: 'Áp dụng khi chưa cấu hình riêng' },
    ...people.map((e) => ({ id: e.ma_nv, ma: e.ma_nv, module: mod.key, title: e.ho_ten, sub: `${e.ma_nv} · ${e.phong_ban}`, isAdmin: e.vai_tro === 'admin' })),
  ];
  let lastSection = '';

  return (
    <div className="grid grid-cols-1 md:grid-cols-[260px_minmax(0,1fr)] gap-3 h-full min-h-0">
      <SideList
        items={shown}
        selected={selected}
        onSelect={setSelected}
        keyOf={(m) => m.key}
        search={q}
        onSearch={setQ}
        placeholder="Tìm module..."
        render={(m) => {
          const head = m.section !== lastSection ? m.section : '';
          lastSection = m.section;
          const viewers = employees.filter((e) => e.vai_tro !== 'admin' && editor.effective(e.ma_nv, m.key).xem).length;
          return (
            <>
              {head ? <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{head}</span> : null}
              <span className="flex items-center gap-2">
                <Boxes size={14} className="shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium truncate">{m.title}</span>
                  <span className="block text-xs text-muted-foreground truncate">
                    {m.group} · {viewers} người xem được
                  </span>
                </span>
              </span>
            </>
          );
        }}
      />
      <div className="flex flex-col min-h-0 gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground mr-auto">
            {mod.title} <span className="text-xs font-normal text-muted-foreground">{mod.section} › {mod.group}</span>
          </h3>
          <div className="relative w-56">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={qe} onChange={(e) => setQe(e.target.value)} placeholder="Lọc nhân viên..." className="w-full h-9 pl-8 pr-2 rounded-lg bg-muted/40 border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <Matrix rows={rows} editor={editor} nameHeader="Nhân viên" />
        </div>
      </div>
    </div>
  );
}

/** Hệ thống › Phân quyền: quyền Xem / Thêm / Sửa / Xóa theo từng nhân viên × module. */
export default function PhanQuyenPage() {
  const [tab, setTab] = useTabParam<Tab>(TABS, 'nhanvien');
  const { isAdmin } = usePermissions();
  const employees = useEmployeeStore((s) => s.employees);
  const catalog = useModuleCatalog();
  const editor = usePermEditor();
  useEffect(() => {
    pullEmployees().catch(() => undefined);
  }, []);
  const active = useMemo(() => employees.filter((e) => e.trang_thai !== 'da_nghi_viec'), [employees]);

  // Rời trang khi còn thay đổi chưa lưu.
  useEffect(() => {
    if (!editor.dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [editor.dirty]);

  return (
    <div className="flex flex-col h-page relative">
      <div className="shrink-0 relative z-0">
        <Tabs<Tab>
          tabs={[
            { id: 'nhanvien', label: 'Theo nhân viên', icon: Users },
            { id: 'module', label: 'Theo module', icon: Boxes },
            { id: 'vaitro', label: 'Vai trò (mẫu)', icon: Shield },
          ]}
          activeTab={tab}
          onChange={setTab}
        />
      </div>
      <div className="flex-1 min-h-0 flex flex-col mt-1.5 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {tab === 'vaitro' ? (
          <VaiTroTab />
        ) : !isAdmin ? (
          <div className="flex-1 flex items-center justify-center p-8 text-sm text-muted-foreground">Chỉ quản trị viên được phân quyền.</div>
        ) : editor.loading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <Spinner text="Đang tải phân quyền..." />
          </div>
        ) : (
          <>
            <div className="shrink-0 flex flex-wrap items-center gap-2 px-3 sm:px-4 py-2.5 border-b border-border">
              <KeyRound size={16} className="text-primary" />
              <p className="text-xs text-muted-foreground mr-auto">
                Bật Thêm / Sửa / Xóa sẽ tự bật Xem; tắt Xem sẽ tắt hết. Quyền được kiểm tra cả ở máy chủ. {editor.offline ? <b className="text-amber-600">Đang ở chế độ offline — chỉ lưu trên trình duyệt.</b> : <>Lưu vào tab <b>25. PhanQuyen_NhanVien</b>.</>}
              </p>
              {editor.dirty > 0 && <span className="text-xs font-medium text-amber-600">{editor.dirty} thay đổi chưa lưu</span>}
              <Button size="sm" variant="outline" onClick={editor.discard} disabled={!editor.dirty || editor.saving}>
                Hủy
              </Button>
              <Button size="sm" onClick={() => editor.save(employees, catalog)} disabled={!editor.dirty} isLoading={editor.saving} className="gap-1.5">
                <Save size={14} /> Lưu phân quyền
              </Button>
            </div>
            <div className="flex-1 min-h-0 p-3 sm:p-4">
              {tab === 'nhanvien' ? <TheoNhanVien editor={editor} employees={active} catalog={catalog} /> : <TheoModule editor={editor} employees={active} catalog={catalog} />}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

