import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/** Thông tin pháp nhân công ty — lưu ở Google Sheet "16. ThongTin_CongTy" qua /api/company-info. */
export interface CompanyInfo {
  ten_cong_ty: string;
  ten_quoc_te: string;
  ten_viet_tat: string;
  ma_so_thue: string;
  ngay_thanh_lap: string;
  nguoi_dai_dien: string;
  chuc_vu_dai_dien: string;
  linh_vuc: string;
  dia_chi_tru_so: string;
  hotline: string;
  so_dien_thoai: string;
  email: string;
  website: string;
  so_tai_khoan: string;
  ngan_hang: string;
  chu_tai_khoan: string;
}

export const DEFAULT_COMPANY_INFO: CompanyInfo = {
  ten_cong_ty: 'CÔNG TY CỔ PHẦN TẬP ĐOÀN VŨ GIA',
  ten_quoc_te: 'VU GIA GROUP JOINT STOCK COMPANY',
  ten_viet_tat: 'VU GIA GROUP',
  ma_so_thue: '0109876543',
  ngay_thanh_lap: '2018-01-16',
  nguoi_dai_dien: 'Vũ Đức Gia',
  chuc_vu_dai_dien: 'Tổng Giám đốc',
  linh_vuc: 'Sản xuất công nghiệp, thương mại xuất nhập khẩu, giải pháp công nghệ & dịch vụ kỹ thuật',
  dia_chi_tru_so: 'Tầng 6, Tòa nhà Vũ Gia Tower, Số 168 Đường Cầu Giấy, P. Quan Hoa, Q. Cầu Giấy, TP. Hà Nội',
  hotline: '0988.161.161',
  so_dien_thoai: '024.3999.8888',
  email: 'contact@vugia.vn',
  website: 'https://vugia.vn',
  so_tai_khoan: '19036888888',
  ngan_hang: 'Techcombank - Chi nhánh Thăng Long, Hà Nội',
  chu_tai_khoan: 'CONG TY CO PHAN TAP DOAN VU GIA',
};

const API = '/api/company-info';
const CACHE_KEY = 'lnk-hcns:company-info';
const QUERY_KEY = ['company-info'];

export type CompanyInfoSource = 'sheet' | 'local';

function readCache(): Partial<CompanyInfo> {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) ?? '{}') as Partial<CompanyInfo>;
  } catch {
    return {};
  }
}
function writeCache(info: CompanyInfo) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(info));
  } catch {
    /* bộ nhớ trình duyệt bị chặn: bỏ qua */
  }
}

/** Gọi API; trả null khi không có API (vd. chạy `vite dev` không có serverless function). */
async function callApi(init?: RequestInit): Promise<Partial<CompanyInfo> | null> {
  let res: Response;
  try {
    res = await fetch(API, { headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, ...init });
  } catch {
    return null;
  }
  if (!(res.headers.get('content-type') ?? '').includes('application/json')) return null;
  const body = (await res.json()) as { data?: Partial<CompanyInfo>; error?: string };
  if (!res.ok) throw new Error(body.error ?? `Lỗi ${res.status}`);
  return body.data ?? {};
}

/** Giữ các ô trống trên sheet bằng giá trị mặc định để giao diện không bị rỗng. */
const merge = (...parts: Partial<CompanyInfo>[]) => {
  const out = { ...DEFAULT_COMPANY_INFO };
  for (const p of parts) for (const [k, v] of Object.entries(p)) if (typeof v === 'string' && v !== '') out[k as keyof CompanyInfo] = v;
  return out;
};

async function loadCompanyInfo(): Promise<{ info: CompanyInfo; source: CompanyInfoSource }> {
  const fromSheet = await callApi();
  if (fromSheet) {
    const info = merge(fromSheet);
    writeCache(info);
    return { info, source: 'sheet' };
  }
  return { info: merge(readCache()), source: 'local' };
}

export const useCompanyInfo = () => useQuery({ queryKey: QUERY_KEY, queryFn: loadCompanyInfo, staleTime: 60 * 1000 });

export function useSaveCompanyInfo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (info: CompanyInfo): Promise<{ info: CompanyInfo; source: CompanyInfoSource }> => {
      const saved = await callApi({ method: 'PUT', body: JSON.stringify(info) });
      writeCache(info);
      return { info: saved ? merge(saved) : info, source: saved ? 'sheet' : 'local' };
    },
    onSuccess: (result) => qc.setQueryData(QUERY_KEY, result),
  });
}
