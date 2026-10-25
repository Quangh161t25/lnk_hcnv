import { useEffect, useMemo, useState } from 'react';
import { Building2, Shield } from 'lucide-react';
import { t } from '@/lib/i18n';
import type { Position } from '@/modules/shared/orgData';
import { Button } from '@/components/ui/Button';
import { Drawer, DRAWER_WIDTH } from '@/components/ui/Drawer';

const NONE = '__none__';

/** Hộp thoại chọn chức vụ được xem tài liệu (nhóm theo phòng ban, có chọn cả nhóm). */
export function PhanQuyenModal({
  onClose,
  positions,
  selectedIds,
  onSave,
  title,
  activeOnly = true,
}: {
  onClose: () => void;
  positions: Position[];
  selectedIds: string[];
  onSave: (ids: string[]) => void;
  title?: string;
  activeOnly?: boolean;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedIds));
  useEffect(() => setSelected(new Set(selectedIds)), [selectedIds]);

  const grouped = useMemo(() => {
    const list = activeOnly ? positions.filter((p) => p.trang_thai !== 'Ngừng hoạt động') : positions;
    const map = new Map<string, Position[]>();
    const names = new Map<string, string>();
    for (const p of list) {
      const key = p.id_phong_ban ?? NONE;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
      if (!names.has(key)) names.set(key, p.ten_phong_ban || t('common.unknown') || 'Không xác định');
    }
    return { map, order: Array.from(names.entries()).sort((a, b) => a[1].localeCompare(b[1])) };
  }, [positions, activeOnly]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleGroup = (key: string) => {
    const ids = (grouped.map.get(key) ?? []).map((p) => p.id);
    const all = ids.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (all ? next.delete(id) : next.add(id)));
      return next;
    });
  };

  return (
    <Drawer
      title={title ?? t('taiLieu.detail.phanQuyenTitle')}
      icon={<Shield size={20} />}
      onClose={onClose}
      maxWidthClass={DRAWER_WIDTH}
      stackLevel={1}
      variant="modal"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button variant="ghost" onClick={onClose} className="text-muted-foreground border border-border">
            {t('common.close')}
          </Button>
          <Button
            onClick={() => {
              onSave(Array.from(selected));
              onClose();
            }}
            className="bg-primary text-white hover:bg-primary/90"
          >
            {t('common.save')}
          </Button>
        </div>
      }
    >
      <p className="text-sm text-muted-foreground mb-4">{t('taiLieu.detail.phanQuyenMessage')}</p>
      <div className="space-y-4">
        {grouped.order.map(([key, name]) => {
          const items = grouped.map.get(key) ?? [];
          if (items.length === 0) return null;
          const all = items.every((p) => selected.has(p.id));
          const some = items.some((p) => selected.has(p.id));
          return (
            <div key={key} className="rounded-xl border border-border bg-card overflow-hidden">
              <button type="button" onClick={() => toggleGroup(key)} className="w-full flex items-center gap-3 px-4 py-3 bg-muted/50 hover:bg-muted/70 transition-colors text-left">
                <input
                  type="checkbox"
                  checked={all}
                  ref={(el) => {
                    if (el) el.indeterminate = some && !all;
                  }}
                  onChange={() => toggleGroup(key)}
                  className="w-4 h-4 rounded border-border text-primary accent-primary cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                />
                <Building2 size={18} className="text-muted-foreground shrink-0" />
                <span className="font-medium text-foreground">{name}</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {items.filter((p) => selected.has(p.id)).length}/{items.length}
                </span>
              </button>
              <div className="divide-y divide-border">
                {items.map((p) => (
                  <label key={p.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 cursor-pointer">
                    <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} className="w-4 h-4 rounded border-border text-primary accent-primary cursor-pointer" />
                    <span className="text-sm text-foreground">{p.ten_chuc_vu}</span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Drawer>
  );
}
