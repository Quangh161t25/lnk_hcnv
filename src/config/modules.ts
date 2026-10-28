import {
  Archive,
  ArrowLeftRight,
  ArrowUpDown,
  Banknote,
  Briefcase,
  Building,
  Building2,
  Calculator,
  Calendar,
  CalendarRange,
  CalendarCheck,
  CalendarDays,
  Car,
  ChartColumn,
  CircleUser,
  ClipboardCheck,
  ClipboardList,
  FileChartColumn,
  FilePenLine,
  FileText,
  FolderOpen,
  Fuel,
  ListOrdered,
  Mail,
  MapPin,
  Monitor,
  Receipt,
  Scale,
  Send,
  Settings,
  Shield,
  Target,
  UserPlus,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

export interface ModuleDef {
  slug: string;
  titleKey: string;
  descKey: string;
  icon: LucideIcon;
  color: string;
}

export interface ModuleGroupDef {
  groupKey: string;
  items: ModuleDef[];
}

const hc = (slug: string, key: string, icon: LucideIcon, color: string): ModuleDef => ({
  slug,
  titleKey: `page.hanhChinh.modules.${key}`,
  descKey: `page.hanhChinh.descs.${key}`,
  icon,
  color,
});
const ns = (slug: string, key: string, icon: LucideIcon, color: string): ModuleDef => ({
  slug,
  titleKey: `page.nhanSu.modules.${key}`,
  descKey: `page.nhanSu.descs.${key}`,
  icon,
  color,
});
const ht = (slug: string, key: string, icon: LucideIcon, color: string): ModuleDef => ({
  slug,
  titleKey: `page.systemDashboard.${key}`,
  descKey: `page.systemDashboard.${key}Desc`,
  icon,
  color,
});

const bk = (slug: string, key: string, icon: LucideIcon, color: string): ModuleDef => ({
  slug,
  titleKey: `page.baoCaoKeHoach.modules.${key}`,
  descKey: `page.baoCaoKeHoach.descs.${key}`,
  icon,
  color,
});

/** Các module con của Hành chính (thứ tự, icon, màu như bản gốc). */
export const HANH_CHINH_GROUPS: ModuleGroupDef[] = [
  {
    groupKey: 'page.hanhChinh.groupCongLuong',
    items: [
      hc('cham-cong', 'chamCong', Calendar, 'bg-blue-500'),
      hc('tong-hop-cham-cong', 'tongHopChamCong', ClipboardCheck, 'bg-amber-500'),
      hc('phieu-hanh-chinh', 'phieuHanhChinh', Receipt, 'bg-indigo-500'),
      hc('cham-diem-kpi', 'chamDiemKpi', Target, 'bg-purple-500'),
      hc('bang-luong', 'bangLuong', Banknote, 'bg-emerald-500'),
      hc('diem-cong-tru', 'diemCongTru', Scale, 'bg-violet-500'),
      hc('thiet-lap-cong-luong', 'thietLapCongLuong', Settings, 'bg-slate-500'),
      hc('hom-thu-gop-y', 'homThuGopY', Mail, 'bg-rose-500'),
    ],
  },
  {
    groupKey: 'page.hanhChinh.groupTaiLieu',
    items: [
      hc('danh-sach-tai-lieu', 'danhSachTaiLieu', FileText, 'bg-blue-500'),
      hc('luu-tru-ho-so', 'luuTruHoSo', Archive, 'bg-teal-500'),
      hc('thiet-lap-tai-lieu', 'thietLapTaiLieu', Settings, 'bg-slate-500'),
    ],
  },
  {
    groupKey: 'page.hanhChinh.groupCongViec',
    items: [
      hc('du-an', 'duAn', FolderOpen, 'bg-blue-500'),
      hc('cong-viec-cua-toi', 'congViecCuaToi', ClipboardList, 'bg-emerald-500'),
      hc('cong-viec-toi-quan-ly', 'congViecToiQuanLy', ClipboardList, 'bg-teal-500'),
      hc('bao-cao', 'baoCao', ChartColumn, 'bg-cyan-500'),
      hc('thiet-lap-cong-viec', 'thietLapCongViec', Settings, 'bg-slate-500'),
    ],
  },
  {
    groupKey: 'page.hanhChinh.groupTaiSan',
    items: [
      hc('danh-sach-tai-san', 'danhMucTaiSan', Building2, 'bg-blue-500'),
      hc('cap-phat-thu-hoi', 'capPhatThuHoi', ArrowLeftRight, 'bg-indigo-500'),
      hc('bao-tri-sua-chua', 'baoTriSuaChua', Wrench, 'bg-orange-500'),
      hc('kiem-ke-tai-san', 'kiemKeTaiSan', ClipboardCheck, 'bg-teal-500'),
      hc('khau-hao-tai-san', 'khauHaoTaiSan', Calculator, 'bg-violet-500'),
      hc('noi-quan-ly', 'noiQuanLy', MapPin, 'bg-cyan-500'),
      hc('thiet-lap-tai-san', 'thietLapTaiSan', Settings, 'bg-slate-500'),
    ],
  },
  {
    groupKey: 'page.hanhChinh.groupQuanLyXe',
    items: [
      hc('danh-sach-xe', 'danhSachXe', Car, 'bg-blue-500'),
      hc('su-dung-xe', 'dangKySuDungXe', CalendarCheck, 'bg-emerald-500'),
      hc('lich-bao-duong', 'lichBaoDuong', Calendar, 'bg-amber-500'),
      hc('phieu-xang-chi-phi-xe', 'phieuXangChiPhiXe', Fuel, 'bg-orange-500'),
      hc('bao-cao-xe', 'baoCaoXe', ChartColumn, 'bg-cyan-500'),
      hc('quan-ly-lai-xe', 'quanLyLaiXe', CircleUser, 'bg-rose-500'),
      hc('thiet-lap-quan-ly-xe', 'thietLapQuanLyXe', Settings, 'bg-slate-500'),
    ],
  },
];

/** Các module con của Nhân sự. */
export const NHAN_SU_GROUPS: ModuleGroupDef[] = [
  {
    groupKey: 'page.nhanSu.groupNhanVien',
    items: [
      ns('nhan-vien', 'nhanVien', Users, 'bg-blue-500'),
    ],
  },
  {
    groupKey: 'page.nhanSu.groupTuyenDung',
    items: [
      ns('de-xuat-tuyen-dung', 'deXuatTuyenDung', Send, 'bg-teal-500'),
      ns('ho-so-ung-vien', 'hoSoUngVien', UserPlus, 'bg-indigo-500'),
      ns('lich-phong-van', 'lichPhongVan', CalendarCheck, 'bg-violet-500'),
      ns('thu-gui-ung-vien', 'thuGuiUngVien', Mail, 'bg-amber-500'),
      ns('hop-dong', 'hopDong', FilePenLine, 'bg-rose-500'),
      ns('danh-gia-thu-viec', 'danhGiaThuViec', ClipboardCheck, 'bg-amber-500'),
      ns('bao-cao-tuyen-dung', 'baoCaoTuyenDung', ChartColumn, 'bg-cyan-500'),
      ns('thiet-lap-tuyen-dung', 'thietLapTuyenDung', Settings, 'bg-slate-500'),
    ],
  },
  {
    groupKey: 'page.nhanSu.groupCuocHop',
    items: [
      ns('phong-hop', 'phongHop', Building2, 'bg-sky-500'),
      ns('cuoc-hop', 'cuocHop', CalendarDays, 'bg-blue-500'),
      ns('bien-ban-hop', 'bienBanHop', FilePenLine, 'bg-violet-500'),
      ns('bao-cao-cuoc-hop', 'baoCaoCuocHop', ChartColumn, 'bg-cyan-500'),
      ns('thiet-lap-cuoc-hop', 'thietLapCuocHop', Settings, 'bg-slate-500'),
    ],
  },
];

/** Các module con của Hệ thống (Sơ đồ & Bảo mật). */
export const HE_THONG_GROUPS: ModuleGroupDef[] = [
  {
    groupKey: 'page.systemDashboard.orgChartGroup',
    items: [
      ht('phong-ban', 'department', Building2, 'bg-indigo-500'),
      ht('cap-bac', 'jobLevel', ListOrdered, 'bg-orange-500'),
      ht('chuc-vu', 'position', Briefcase, 'bg-blue-500'),
      ht('chuc-nang-nhiem-vu', 'functionsTasks', Target, 'bg-sky-500'),
      ht('nhan-vien', 'employee', Users, 'bg-emerald-500'),
    ],
  },
  {
    groupKey: 'page.systemDashboard.securityGroup',
    items: [
      ht('thong-tin-cong-ty', 'companyInfo', Building, 'bg-violet-500'),
      ht('chi-nhanh', 'branch', MapPin, 'bg-fuchsia-500'),
      ht('phan-quyen', 'permission', Shield, 'bg-rose-500'),
      ht('sao-luu', 'backup', ArrowUpDown, 'bg-cyan-500'),
      ht('thiet-bi-dang-nhap', 'loginDevices', Monitor, 'bg-teal-500'),
    ],
  },
];

/** Các module con của Báo cáo & Kế hoạch (dùng cho phòng ban và từng nhân viên). */
export const BAO_CAO_KE_HOACH_GROUPS: ModuleGroupDef[] = [
  {
    groupKey: 'page.baoCaoKeHoach.groups.main',
    items: [
      bk('ke-hoach', 'keHoach', CalendarRange, 'bg-violet-500'),
      bk('bao-cao', 'baoCao', FileChartColumn, 'bg-cyan-500'),
      bk('tinh-hinh-nop', 'tinhHinhNop', ClipboardCheck, 'bg-emerald-500'),
    ],
  },
  {
    groupKey: 'page.baoCaoKeHoach.groups.settings',
    items: [bk('thiet-lap', 'thietLap', Settings, 'bg-slate-500')],
  },
];

export const MODULE_ROOTS = [
  { base: '/hanh-chinh', labelKey: 'breadcrumb.hanhChinh', groups: HANH_CHINH_GROUPS },
  { base: '/nhan-su', labelKey: 'breadcrumb.nhanSu', groups: NHAN_SU_GROUPS },
  { base: '/bao-cao-ke-hoach', labelKey: 'breadcrumb.baoCaoKeHoach', groups: BAO_CAO_KE_HOACH_GROUPS },
  { base: '/he-thong', labelKey: 'breadcrumb.system', groups: HE_THONG_GROUPS },
];

/** Màu icon + nền nhạt theo lớp màu của thẻ module (màu không có trong bảng sẽ về xám, giống bản gốc). */
const CARD_COLORS: Record<string, { icon: string; bg: string }> = {
  'bg-blue-500': { icon: '#2563eb', bg: 'rgba(37, 99, 235, 0.12)' },
  'bg-indigo-500': { icon: '#4f46e5', bg: 'rgba(79, 70, 229, 0.12)' },
  'bg-purple-500': { icon: '#7c3aed', bg: 'rgba(124, 58, 237, 0.12)' },
  'bg-violet-500': { icon: '#7c3aed', bg: 'rgba(124, 58, 237, 0.12)' },
  'bg-teal-500': { icon: '#0d9488', bg: 'rgba(13, 148, 136, 0.12)' },
  'bg-cyan-500': { icon: '#0891b2', bg: 'rgba(8, 145, 178, 0.12)' },
  'bg-emerald-500': { icon: '#059669', bg: 'rgba(5, 150, 105, 0.12)' },
  'bg-rose-500': { icon: '#e11d48', bg: 'rgba(225, 29, 72, 0.12)' },
  'bg-pink-500': { icon: '#db2777', bg: 'rgba(219, 39, 119, 0.12)' },
  'bg-amber-500': { icon: '#d97706', bg: 'rgba(217, 119, 6, 0.12)' },
  'bg-orange-500': { icon: '#ea580c', bg: 'rgba(234, 88, 12, 0.12)' },
  'bg-red-500': { icon: '#dc2626', bg: 'rgba(220, 38, 38, 0.12)' },
  'bg-slate-500': { icon: '#475569', bg: 'rgba(71, 85, 105, 0.12)' },
  'bg-sky-500': { icon: '#0284c7', bg: 'rgba(2, 132, 199, 0.12)' },
  'bg-fuchsia-500': { icon: '#c026d3', bg: 'rgba(192, 38, 211, 0.12)' },
};

export function cardColors(color: string, primaryHex?: string) {
  if (color === 'bg-primary' && primaryHex) {
    const r = parseInt(primaryHex.slice(1, 3), 16);
    const g = parseInt(primaryHex.slice(3, 5), 16);
    const b = parseInt(primaryHex.slice(5, 7), 16);
    return { icon: primaryHex, bg: `rgba(${r}, ${g}, ${b}, 0.12)` };
  }
  return CARD_COLORS[color] ?? { icon: '#475569', bg: 'rgba(71, 85, 105, 0.12)' };
}
