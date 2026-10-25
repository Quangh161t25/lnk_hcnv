import { useEmployeeStore, type Employee } from '@/stores/employees';

// Google Service Account Credentials
const SERVICE_ACCOUNT = {
  client_email: 'lnk-773@cty-lnk-161.iam.gserviceaccount.com',
  private_key: `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDTg5BFj22QViBG
TyE073/XFsN/Tu0qf9zHmCREpC0V8hMUIG1sh7BhcfEYMpoQy3PK1EKmcVFj33/f
n8p1KI+4vGrFAJgXLPxlbNmfJA1S2Ru5rMZxamZPiQ+vfCSVbjlyfb019oaDTd55
TYWxl8QjI7uv+bd8p2aJDCk6fMams96j82kjQG5GObrmDNINtNWXW9S7K32Yndjx
OcoFe4VFICAau9y2phJFdw1Dh82fa2DMtnJttCeRN+wgQhoH0299XEoyJvGTzBTH
1hJnwzKiiZHlLNMTAmzqlp+/YZa9kkqBhslKG+w3U0qS6gJA2Qh2yJQCEQYUk5OD
qDrd2ZmBAgMBAAECggEAJIbhJJ4dE/LHrpSuPaPJnkW0W7kv3GnJ4R8tTjxS++n6
8PwboYU6SM3CTsU4VYOpGsM2wmMp5Nc9UEtaTYrEbSj+wEg2u7PdX4+hcmnpsh/D
ubg0afQvuHcJQissbzDik1rTEO1is+y/6Y9hcfatXMsoN77meMy4+Jxkx1CyhqmT
cOowEwASxDkSKN4472OSujg7ECkQY224FlafLbjU5nsRgF2EqfA4Z10e+FGQE6l0
+E6mD135lUyk/Ug6zjizEdEmHC8+BBfsGJCIYizBFJZ7KjfF5VPbdWHBdw+m0qQr
MIqfTrfiO7TVs8VqiFv3JEOYKSG6ZM7oAIii7xsGdQKBgQDxqLxd+NPbZFp0OKEU
AOmNt2CjA/iEmCeNZ8Cjkkn6lWS6q8X9fdWEHAgWJPcnOZA4U3PrZSNFZzrJ9f+b
VWS5/zynJgAY96YAQoOiTJjnJUlaMTNt+QkEtduFZKOwy1I4Ig9fFwQQBIrlE4rQ
c39QaYm7Az9JLJAqVwScMYlAPQKBgQDgEN1NOKMUkEbOtLIWWnUWTzCtSChs4AvQ
bhIivQAMQRcZ4ALtpf1RIJgqHyh2SA3ptGaujJDic61tfTeEUx1NEIFdisFpLIG6
u88g0KMU/0hJd0yabg/Cgh464Sp2XTeiB3tDd7LwfdUMZFVameiSREAZW/feLbPO
bmJ/3aFulQKBgCwSScgZiQmJ07U+XqH3SKC/wK/6GWiVFyGCum8aTsOUWzpv+Tux
npy7grdjcBPbyWIrtLUbQuw39NYt/gY4ilKwXEEirdXkYMP37I2aF8Zy2ABqivm5f
7HUfdVlucSvc6LG0BHmjCOqi6XG9jqNVbPKNTMD+ZpxBtEkEdaLGpfFBAoGAE+bL
kTlPmtr5vxBjpQKh1bpw62M2W/1Gb1vndnhtEamSYLT57ZvJtTP87/jWgjMCMVjZ
qfVIRSTbKZdun+019AtcQi+54BqY5zoZOqPtaEcIZ6YWAr113uPpxXcMa3j6IQUj
GKoAFcZHbxNWVXbIJn2zZ804Zd6PUu2RCCRqW0UCgYEAv5rs4lg2tdIx3zKX67qQ
aFDBvxYriDqUuACpzV9TlZme6tDp+S21BGhwzwl9dcaWjda++lqyBqtkSHZtGAY+
Nf7d7jqgqgiofhYlBTSVo8qU8vVvIlzgzOb+Z3aZPiZHiCu8K4YAJ9Qn5q8Fz1PV
4b87bpePRsmiNvOiCsTBaRY=
-----END PRIVATE KEY-----`,
  spreadsheet_id: '19h9xv-5rd2MFF9PUh8LqKnayRr4NUPka64aB8D6jQQg',
};

function toBase64Url(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function bufferToBase64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

/**
 * Lấy Access Token từ Google OAuth2 bằng Service Account JWT
 */
export async function getGoogleServiceAccountToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedAccessToken && cachedAccessToken.expiresAt > now + 60) {
    return cachedAccessToken.token;
  }

  const cleanPem = SERVICE_ACCOUNT.private_key
    .replace(/-----[^\n]+-----/g, '')
    .replace(/\s+/g, '');
  const binaryDer = Uint8Array.from(atob(cleanPem), (c) => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const header = toBase64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = toBase64Url(
    JSON.stringify({
      iss: SERVICE_ACCOUNT.client_email,
      scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    })
  );

  const signInput = `${header}.${payload}`;
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(signInput)
  );

  const jwt = `${signInput}.${bufferToBase64Url(signature)}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    throw new Error(`Lỗi cấp token Google Service Account: ${res.statusText}`);
  }

  const data = await res.json();
  cachedAccessToken = {
    token: data.access_token,
    expiresAt: now + (data.expires_in || 3600),
  };

  return data.access_token;
}

/**
 * Lấy danh sách nhân viên và MẬT KHẨU trực tiếp từ Google Sheet '1. NhanSu_DanhSach'
 */
export async function fetchEmployeesFromGoogleSheet(): Promise<Employee[]> {
  const token = await getGoogleServiceAccountToken();
  const range = encodeURIComponent('1. NhanSu_DanhSach!A2:K100');
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SERVICE_ACCOUNT.spreadsheet_id}/values/${range}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Không thể đọc Google Sheet: ${res.statusText}`);
  }

  const data = await res.json();
  const rows: string[][] = data.values || [];

  const employeesFromSheet: Employee[] = rows.map((r, index) => {
    const ma_nv = r[0] || `NV00${index + 1}`;
    const ho_ten = r[1] || 'Nhân viên';
    const email = r[2] || `${ma_nv.toLowerCase()}@vugia.vn`;
    const sdt = r[3] || '0900 000 000';
    const phong_ban = r[4] || 'Khối Công nghệ';
    const chuc_vu = r[5] || 'Nhân viên';
    const vai_tro_text = r[6] || '';
    const vai_tro: 'admin' | 'member' = vai_tro_text.toLowerCase().includes('admin') ? 'admin' : 'member';
    const loai_hop_dong = (r[7] || 'Chính thức') as 'Chính thức' | 'Thử việc' | 'Thời vụ';
    const ngay_vao_lam = r[8] || '2023-01-01';
    const trang_thai_text = (r[9] || '').toLowerCase();
    const trang_thai = trang_thai_text.includes('thử')
      ? 'thu_viec'
      : trang_thai_text.includes('nghỉ')
      ? 'da_nghi_viec'
      : 'dang_lam_viec';
    // Cột K (index 10) là MẬT KHẨU
    const mat_khau = r[10] || '123456';

    return {
      id: `emp-sheet-${ma_nv}`,
      ma_nv,
      ho_ten,
      email,
      sdt,
      phong_ban,
      chuc_vu,
      vai_tro,
      loai_hop_dong,
      ngay_vao_lam,
      trang_thai,
      mat_khau,
      avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(ho_ten)}&background=random`,
    };
  });

  return employeesFromSheet;
}

/**
 * Đồng bộ danh sách nhân viên & mật khẩu từ Google Sheet vào Store ứng dụng
 */
export async function syncEmployeesStoreWithGoogleSheet(): Promise<Employee[]> {
  try {
    const sheetEmployees = await fetchEmployeesFromGoogleSheet();
    if (sheetEmployees && sheetEmployees.length > 0) {
      useEmployeeStore.setState((state) => {
        // Cập nhật hoặc bổ sung nhân viên từ Google Sheet
        const updated = [...state.employees];
        for (const se of sheetEmployees) {
          const idx = updated.findIndex((e) => e.ma_nv === se.ma_nv || e.email.toLowerCase() === se.email.toLowerCase());
          if (idx >= 0) {
            updated[idx] = {
              ...updated[idx],
              ...se,
              // Giữ lại id hiện tại để không gãy liên kết phiên
              id: updated[idx].id,
              // Đảm bảo lấy đúng mật khẩu từ Google Sheet
              mat_khau: se.mat_khau || updated[idx].mat_khau || '123456',
            };
          } else {
            updated.push(se);
          }
        }
        return { employees: updated };
      });
      return sheetEmployees;
    }
  } catch (error) {
    console.warn('Lưu ý: Không thể đồng bộ trực tiếp từ Google Sheet (đang dùng dữ liệu offline):', error);
  }
  return useEmployeeStore.getState().employees;
}
