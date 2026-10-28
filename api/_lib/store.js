// Đọc/ghi một bảng (kèm chuyển đổi cột tham chiếu và cột bí mật).
import { TABLES, objectsToRows, rowsToObjects } from './tables.js';
import { readMany, readValues, replaceValues } from './google.js';

export async function loadRaw(name) {
  const def = TABLES[name];
  return rowsToObjects(def, await readValues(def.tab));
}

/** Cột tham chiếu: trên Sheet lưu MÃ (dễ đọc), trong app dùng ID. Các tab tham chiếu được đọc chung một lượt. */
async function refMaps(def) {
  const refs = def.columns.filter((x) => x.ref);
  if (!refs.length) return {};
  const values = await readMany(refs.map((c) => TABLES[c.ref.table].tab));
  const maps = {};
  for (const c of refs) maps[c.key] = { rows: rowsToObjects(TABLES[c.ref.table], values[TABLES[c.ref.table].tab]), ...c.ref };
  return maps;
}

export async function loadTable(name, { includeSecrets = false } = {}) {
  const def = TABLES[name];
  const rows = await loadRaw(name);
  const maps = await refMaps(def);
  return rows.map((r) => {
    const out = { ...r };
    for (const [key, m] of Object.entries(maps)) {
      const hit = m.rows.find((x) => x[m.code] === r[key] || x.id === r[key]);
      out[key] = hit ? hit.id : r[key] || null;
      out[m.nameKey] = hit ? hit[m.name] : undefined;
    }
    if (!includeSecrets) for (const c of def.columns) if (c.secret) delete out[c.key];
    return out;
  });
}

export async function saveTable(name, rows) {
  const def = TABLES[name];
  const maps = await refMaps(def);
  let prepared = rows.map((r) => {
    const out = { ...r };
    for (const [key, m] of Object.entries(maps)) {
      // Tìm theo ID; nếu form chỉ có tên (vd. cấp bậc nhập tay) thì khớp theo tên.
      const hit = m.rows.find((x) => x.id === r[key]) ?? (r[m.nameKey] ? m.rows.find((x) => x[m.name] === r[m.nameKey]) : undefined);
      out[key] = hit ? hit[m.code] : (r[key] ?? '');
    }
    return out;
  });
  // Cột bí mật (mật khẩu): giữ giá trị cũ trên Sheet nếu client không gửi giá trị mới.
  const secrets = def.columns.filter((c) => c.secret);
  if (secrets.length) {
    const current = new Map((await loadRaw(name)).map((r) => [String(r[def.idKey]).toLowerCase(), r]));
    prepared = prepared.map((r) => {
      const old = current.get(String(r[def.idKey]).toLowerCase());
      const out = { ...r };
      for (const c of secrets) if (!out[c.key]) out[c.key] = old?.[c.key] || '123456';
      return out;
    });
  }
  await replaceValues(def.tab, objectsToRows(def, prepared));
}
