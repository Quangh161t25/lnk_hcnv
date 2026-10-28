import {
  ClipboardList,
  FileText,
  Gauge,
  House,
  Layers,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  path: string;
  nameKey: string;
  descriptionKey: string;
  icon: LucideIcon;
  gradient: string;
}

/** Menu thanh bên (Đầy đủ các phân hệ chính: Tổng quan, Hành chính, Nhân sự, Hệ thống, Trợ lý AI, Vận hành). */
export const NAV_ITEMS: NavItem[] = [
  { path: '/', nameKey: 'nav.home', descriptionKey: 'page.home.systemModuleDesc', icon: House, gradient: 'bg-gradient-to-br from-primary/90 to-primary' },
  { path: '/hanh-chinh', nameKey: 'nav.hanhChinh', descriptionKey: 'page.home.hanhChinhDesc', icon: FileText, gradient: 'bg-gradient-to-br from-amber-600 to-amber-800' },
  { path: '/nhan-su', nameKey: 'nav.nhanSu', descriptionKey: 'page.home.nhanSuDesc', icon: Users, gradient: 'bg-gradient-to-br from-emerald-600 to-emerald-800' },
  { path: '/bao-cao-ke-hoach', nameKey: 'nav.baoCaoKeHoach', descriptionKey: 'page.home.baoCaoKeHoachDesc', icon: ClipboardList, gradient: 'bg-gradient-to-br from-violet-600 to-violet-800' },
  { path: '/he-thong', nameKey: 'nav.system', descriptionKey: 'page.home.systemModuleDesc', icon: Layers, gradient: 'bg-gradient-to-br from-slate-600 to-slate-800 dark:from-slate-500 dark:to-slate-700' },
  { path: '/tro-ly-ai', nameKey: 'nav.aiAssistant', descriptionKey: 'page.home.systemModuleDesc', icon: Sparkles, gradient: 'bg-gradient-to-br from-indigo-600 to-indigo-800' },
  { path: '/van-hanh', nameKey: 'nav.vanHanh', descriptionKey: 'page.home.vanHanhDesc', icon: Gauge, gradient: 'bg-gradient-to-br from-sky-600 to-sky-800' },
];
