import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const PRIMARY_COLORS = {
  blue: '221.2 83.2% 53.3%',
  violet: '262.1 83.3% 57.8%',
  emerald: '142.1 76.2% 36.3%',
  rose: '346.8 77.2% 49.8%',
  amber: '37.7 92.1% 50.2%',
  orange: '24.6 95% 53.1%',
  cyan: '188.7 94.5% 42.7%',
  slate: '215.4 16.3% 46.9%',
} as const;

export type PrimaryColor = keyof typeof PRIMARY_COLORS;

interface CompanyInfo {
  appName: string;
  appDescription: string;
  appLogo: string | null;
  companyName: string;
  taxId: string;
  address: string;
  phone: string;
  email: string;
  website: string;
}

interface UiState {
  sidebarOpen: boolean;
  primaryColor: PrimaryColor;
  colorScheme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  timezone: string;
  companyInfo: CompanyInfo;
  toggleSidebar: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarOpen: false,
      primaryColor: 'blue',
      colorScheme: 'light',
      fontSize: 'medium',
      timezone: 'Asia/Ho_Chi_Minh',
      companyInfo: {
        appName: 'Vũ Gia',
        appDescription: 'Hệ thống Quản lý Doanh nghiệp',
        appLogo: null,
        companyName: 'Công ty Cổ phần Vũ Gia',
        taxId: '0101234567',
        address: 'Số 1 Đường Mẫu, Quận 1, TP. Hồ Chí Minh',
        phone: '028 1234 5678',
        email: 'contact@vugia.vn',
        website: 'www.vugia.vn',
      },
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
    }),
    {
      name: 'vugia-ui-storage',
      version: 2,
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<UiState>;
        const savedCompany = (p.companyInfo ?? {}) as Partial<CompanyInfo>;
        if (savedCompany.appName === '5F template') {
          savedCompany.appName = 'Vũ Gia';
          savedCompany.appDescription = 'Hệ thống Quản lý Doanh nghiệp';
        }
        return { ...current, ...p, companyInfo: { ...current.companyInfo, ...savedCompany } };
      },
    },
  ),
);

/** Mã hex của màu chủ đạo (dùng cho icon thẻ module màu "bg-primary"). */
export function primaryHex(color: PrimaryColor) {
  const [h, s, l] = PRIMARY_COLORS[color].replace(/%/g, '').split(/\s+/).map(Number);
  const sat = s / 100;
  const light = l / 100;
  const a = sat * Math.min(light, 1 - light);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = light - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * c)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}
