import {
  FileText,
  Gauge,
  House,
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

/** Menu thanh bên (chỉ giữ lại các phân hệ ngoài khung đỏ). */
export const NAV_ITEMS: NavItem[] = [
  { path: '/', nameKey: 'nav.home', descriptionKey: 'page.home.systemModuleDesc', icon: House, gradient: 'bg-gradient-to-br from-primary/90 to-primary' },
  { path: '/hanh-chinh', nameKey: 'nav.hanhChinh', descriptionKey: 'page.home.hanhChinhDesc', icon: FileText, gradient: 'bg-gradient-to-br from-amber-600 to-amber-800' },
  { path: '/nhan-su', nameKey: 'nav.nhanSu', descriptionKey: 'page.home.nhanSuDesc', icon: Users, gradient: 'bg-gradient-to-br from-emerald-600 to-emerald-800' },
  { path: '/van-hanh', nameKey: 'nav.vanHanh', descriptionKey: 'page.home.vanHanhDesc', icon: Gauge, gradient: 'bg-gradient-to-br from-sky-600 to-sky-800' },
];
