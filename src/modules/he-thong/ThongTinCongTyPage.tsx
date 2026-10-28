import { useEffect, useRef, useState, type ReactNode } from 'react';
import dayjs from 'dayjs';
import { Building, Save, Edit3, Globe, Phone, Mail, MapPin, CreditCard, ShieldCheck, Sheet, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Feedback';
import { toast } from 'sonner';
import { DEFAULT_COMPANY_INFO, useCompanyInfo, useSaveCompanyInfo, type CompanyInfo } from './companyInfo';

const label = 'text-xs font-semibold text-muted-foreground uppercase';

function Field({ title, editing, input, children, className }: { title: string; editing: boolean; input: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className ?? ''}`}>
      <label className={label}>{title}</label>
      {editing ? input : children}
    </div>
  );
}

function foundedText(date: string) {
  const d = dayjs(date);
  if (!d.isValid()) return date || '—';
  const years = dayjs().diff(d, 'year');
  return `${d.format('DD/MM/YYYY')}${years > 0 ? ` (Hơn ${years} năm hoạt động)` : ''}`;
}

export function ThongTinCongTyPage() {
  const { data, isLoading } = useCompanyInfo();
  const save = useSaveCompanyInfo();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<CompanyInfo>(DEFAULT_COMPANY_INFO);
  const source = data?.source;

  // Chỉ đồng bộ khi dữ liệu thay đổi (không ghi đè lúc người dùng đang sửa).
  const editingRef = useRef(isEditing);
  editingRef.current = isEditing;
  useEffect(() => {
    if (data && !editingRef.current) setFormData(data.info);
  }, [data]);

  const set = (k: keyof CompanyInfo) => (e: React.ChangeEvent<HTMLInputElement>) => setFormData((f) => ({ ...f, [k]: e.target.value }));
  const input = (k: keyof CompanyInfo, extra?: React.InputHTMLAttributes<HTMLInputElement>) => <Input value={formData[k]} onChange={set(k)} {...extra} />;

  const handleCancel = () => {
    if (data) setFormData(data.info);
    setIsEditing(false);
  };
  const handleSave = () => {
    if (!formData.ten_cong_ty.trim()) {
      toast.error('Tên doanh nghiệp không được để trống');
      return;
    }
    save.mutate(formData, {
      onSuccess: (r) => {
        setFormData(r.info);
        setIsEditing(false);
        if (r.source === 'sheet') toast.success('Đã lưu thông tin công ty vào Google Sheet');
        else toast.warning('Chưa kết nối được Google Sheet — đã lưu tạm trên trình duyệt này');
      },
      onError: (e) => toast.error(`Lưu vào Google Sheet thất bại: ${e.message}`),
    });
  };

  if (isLoading)
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <Spinner text="Đang tải thông tin công ty..." />
      </div>
    );

  return (
    <div className="flex flex-col h-page relative space-y-4">
      {/* Top Banner */}
      <div className="rounded-xl border border-border bg-gradient-to-r from-violet-500/10 via-primary/5 to-transparent p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-violet-500/20 shrink-0 font-black text-2xl tracking-tighter">
            VG
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg md:text-xl font-bold text-foreground">{formData.ten_cong_ty}</h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">Đang hoạt động</span>
              {source && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                    source === 'sheet' ? 'bg-sky-500/10 text-sky-600 border-sky-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                  }`}
                  title={source === 'sheet' ? 'Dữ liệu đọc từ tab "16. ThongTin_CongTy" của Google Sheet' : 'Không kết nối được Google Sheet, đang dùng bản lưu trên trình duyệt'}
                >
                  {source === 'sheet' ? <Sheet size={11} /> : <HardDrive size={11} />}
                  {source === 'sheet' ? 'Google Sheet' : 'Bản lưu cục bộ'}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              MST: <span className="font-mono font-medium text-foreground">{formData.ma_so_thue}</span> • Đại diện pháp luật: <span className="font-medium text-foreground">{formData.nguoi_dai_dien}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          {isEditing ? (
            <>
              <Button variant="outline" size="sm" onClick={handleCancel} disabled={save.isPending}>
                Hủy
              </Button>
              <Button size="sm" onClick={handleSave} isLoading={save.isPending} className="gap-1.5 shadow-xs">
                <Save size={15} />
                <span>Lưu thay đổi</span>
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => setIsEditing(true)} className="gap-1.5 shadow-xs">
              <Edit3 size={15} />
              <span>Chỉnh sửa thông tin</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Form Cards */}
      <div className="flex-1 min-h-0 overflow-auto space-y-4">
        {/* Card 1: Pháp lý doanh nghiệp */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Thông tin pháp nhân & Đăng ký kinh doanh</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field title="Tên doanh nghiệp" editing={isEditing} input={input('ten_cong_ty')}>
              <p className="text-sm font-semibold text-foreground py-1.5">{formData.ten_cong_ty}</p>
            </Field>
            <Field title="Tên giao dịch quốc tế" editing={isEditing} input={input('ten_quoc_te')}>
              <p className="text-sm font-medium text-foreground py-1.5">{formData.ten_quoc_te}</p>
            </Field>
            {isEditing && (
              <Field title="Tên viết tắt" editing input={input('ten_viet_tat')}>
                {null}
              </Field>
            )}
            <Field title="Mã số thuế (Doanh nghiệp)" editing={isEditing} input={input('ma_so_thue')}>
              <p className="text-sm font-mono font-bold text-foreground py-1.5">{formData.ma_so_thue}</p>
            </Field>
            <Field title="Ngày thành lập / Cấp phép" editing={isEditing} input={input('ngay_thanh_lap', { type: 'date' })}>
              <p className="text-sm font-medium text-foreground py-1.5">{foundedText(formData.ngay_thanh_lap)}</p>
            </Field>
            <Field title="Người đại diện pháp luật" editing={isEditing} input={input('nguoi_dai_dien')}>
              <p className="text-sm font-semibold text-foreground py-1.5">
                {formData.nguoi_dai_dien} ({formData.chuc_vu_dai_dien})
              </p>
            </Field>
            {isEditing && (
              <Field title="Chức vụ người đại diện" editing input={input('chuc_vu_dai_dien')}>
                {null}
              </Field>
            )}
            <Field title="Lĩnh vực hoạt động chính" editing={isEditing} input={input('linh_vuc')}>
              <p className="text-sm text-foreground py-1.5">{formData.linh_vuc}</p>
            </Field>
          </div>
        </div>

        {/* Card 2: Liên hệ & Trụ sở */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
            <MapPin className="w-5 h-5 text-indigo-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Địa chỉ trụ sở & Thông tin liên lạc</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field title="Địa chỉ trụ sở chính" editing={isEditing} input={input('dia_chi_tru_so')} className="md:col-span-2">
              <p className="text-sm text-foreground py-1.5 flex items-center gap-1.5">
                <Building size={15} className="text-primary shrink-0" />
                <span>{formData.dia_chi_tru_so}</span>
              </p>
            </Field>
            <Field title="Hotline / Tổng đài" editing={isEditing} input={input('hotline')}>
              <p className="text-sm font-medium text-foreground py-1.5 flex items-center gap-1.5">
                <Phone size={15} className="text-emerald-500 shrink-0" />
                <span>
                  {formData.hotline}
                  {formData.so_dien_thoai ? ` (${formData.so_dien_thoai})` : ''}
                </span>
              </p>
            </Field>
            {isEditing && (
              <Field title="Số tổng đài" editing input={input('so_dien_thoai')}>
                {null}
              </Field>
            )}
            <Field title="Hộp thư điện tử (Email)" editing={isEditing} input={input('email', { type: 'email' })}>
              <p className="text-sm font-medium text-foreground py-1.5 flex items-center gap-1.5">
                <Mail size={15} className="text-blue-500 shrink-0" />
                <span>{formData.email}</span>
              </p>
            </Field>
            <Field title="Cổng thông tin Website" editing={isEditing} input={input('website')} className="md:col-span-2">
              <p className="text-sm font-medium text-primary py-1.5 flex items-center gap-1.5">
                <Globe size={15} className="shrink-0" />
                <a href={formData.website} target="_blank" rel="noreferrer" className="underline hover:text-primary/80">
                  {formData.website}
                </a>
              </p>
            </Field>
          </div>
        </div>

        {/* Card 3: Tài khoản ngân hàng doanh nghiệp */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
            <CreditCard className="w-5 h-5 text-emerald-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Tài khoản ngân hàng giao dịch</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field title="Số tài khoản" editing={isEditing} input={input('so_tai_khoan')}>
              <p className="text-base font-mono font-bold text-emerald-600 py-1.5">{formData.so_tai_khoan}</p>
            </Field>
            <Field title="Ngân hàng & Chi nhánh" editing={isEditing} input={input('ngan_hang')}>
              <p className="text-sm font-medium text-foreground py-1.5">{formData.ngan_hang}</p>
            </Field>
            <Field title="Tên chủ tài khoản" editing={isEditing} input={input('chu_tai_khoan')}>
              <p className="text-sm font-semibold text-foreground py-1.5">{formData.chu_tai_khoan}</p>
            </Field>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ThongTinCongTyPage;
