import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Employee {
  id: string;
  ma_nv: string;
  ho_ten: string;
  email: string;
  sdt: string;
  phong_ban: string;
  chuc_vu: string;
  vai_tro: 'admin' | 'member';
  loai_hop_dong: 'Chính thức' | 'Thử việc' | 'Thời vụ';
  ngay_vao_lam: string;
  trang_thai: 'dang_lam_viec' | 'thu_viec' | 'da_nghi_viec';
  avatar_url?: string;
  mat_khau?: string;
}

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-admin',
    ma_nv: 'VG001',
    ho_ten: 'Vũ Minh Trí (Vũ Gia Admin)',
    email: 'admin@vugia.vn',
    sdt: '0901 888 999',
    phong_ban: 'Ban Giám Đốc',
    chuc_vu: 'Tổng Giám đốc / Quản trị viên',
    vai_tro: 'admin',
    loai_hop_dong: 'Chính thức',
    ngay_vao_lam: '2020-01-01',
    trang_thai: 'dang_lam_viec',
    mat_khau: '123456',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'emp-001',
    ma_nv: 'NV001',
    ho_ten: 'Nguyễn Văn An',
    email: 'an.nguyen@vugia.vn',
    sdt: '0912 345 678',
    phong_ban: 'Khối Công nghệ',
    chuc_vu: 'Lập trình viên Fullstack',
    vai_tro: 'member',
    loai_hop_dong: 'Chính thức',
    ngay_vao_lam: '2023-03-15',
    trang_thai: 'dang_lam_viec',
    mat_khau: '123456',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'emp-002',
    ma_nv: 'NV002',
    ho_ten: 'Trần Thị Mai',
    email: 'mai.tran@vugia.vn',
    sdt: '0988 234 567',
    phong_ban: 'Khối Kế toán',
    chuc_vu: 'Kế toán trưởng',
    vai_tro: 'member',
    loai_hop_dong: 'Chính thức',
    ngay_vao_lam: '2022-06-01',
    trang_thai: 'dang_lam_viec',
    mat_khau: '123456',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'emp-003',
    ma_nv: 'NV003',
    ho_ten: 'Lê Hoàng Nam',
    email: 'nam.le@vugia.vn',
    sdt: '0977 123 456',
    phong_ban: 'Khối Marketing',
    chuc_vu: 'Trưởng nhóm Marketing',
    vai_tro: 'member',
    loai_hop_dong: 'Chính thức',
    ngay_vao_lam: '2023-08-10',
    trang_thai: 'dang_lam_viec',
    mat_khau: '123456',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'emp-004',
    ma_nv: 'NV004',
    ho_ten: 'Phạm Thu Hương',
    email: 'huong.pham@vugia.vn',
    sdt: '0933 654 321',
    phong_ban: 'Khối HCNS',
    chuc_vu: 'Chuyên viên Tuyển dụng & Đào tạo',
    vai_tro: 'member',
    loai_hop_dong: 'Chính thức',
    ngay_vao_lam: '2024-01-05',
    trang_thai: 'dang_lam_viec',
    mat_khau: '123456',
    avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'emp-005',
    ma_nv: 'NV005',
    ho_ten: 'Đặng Quốc Huy',
    email: 'huy.dang@vugia.vn',
    sdt: '0944 555 666',
    phong_ban: 'Khối Công nghệ',
    chuc_vu: 'Thực tập sinh Frontend',
    vai_tro: 'member',
    loai_hop_dong: 'Thử việc',
    ngay_vao_lam: '2025-02-01',
    trang_thai: 'thu_viec',
    mat_khau: '123456',
    avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80',
  },
];

interface EmployeeState {
  employees: Employee[];
  addEmployee: (emp: Omit<Employee, 'id'>) => Employee;
  updateEmployee: (id: string, emp: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
}

export const useEmployeeStore = create<EmployeeState>()(
  persist(
    (set) => ({
      employees: INITIAL_EMPLOYEES,
      addEmployee: (emp) => {
        const newEmp: Employee = {
          ...emp,
          id: `emp-${Date.now()}`,
        };
        set((state) => ({ employees: [newEmp, ...state.employees] }));
        return newEmp;
      },
      updateEmployee: (id, data) => {
        set((state) => ({
          employees: state.employees.map((e) => (e.id === id ? { ...e, ...data } : e)),
        }));
      },
      deleteEmployee: (id) => {
        set((state) => ({
          employees: state.employees.filter((e) => e.id !== id),
        }));
      },
    }),
    { name: 'vugia-employees-storage' },
  ),
);
