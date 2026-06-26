const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Faltan variables de entorno VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en el archivo .env');
}

export const TABLES = ['fact_delitos', 'dim_fecha', 'dim_municipio', 'dim_sexo', 'dim_dept'];

export async function fetchTableData(table, { page = 1, pageSize = 20, search = '', searchCol = null, sortCol = null, sortAsc = true, filters = {} } = {}) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let url = `${SUPABASE_URL}/rest/v1/${table}?select=*`;
  if (sortCol) url += `&order=${sortCol}.${sortAsc ? 'asc' : 'desc'}`;
  if (search && searchCol) url += `&${searchCol}=ilike.*${encodeURIComponent(search)}*`;
  Object.entries(filters).forEach(([col, val]) => {
    if (val !== '' && val !== null && val !== undefined)
      url += `&${col}=ilike.*${encodeURIComponent(val)}*`;
  });
  url += `&offset=${from}&limit=${pageSize}`;

  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Range': `${from}-${to}`,
      'Range-Unit': 'items',
      'Prefer': 'count=exact',
    },
  });

  if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
  const total = parseInt((res.headers.get('content-range') || '').split('/')[1]) || 0;
  return { data: await res.json(), total };
}

export async function fetchAllForChart(table, col, limit = 500) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=${col}&limit=${limit}`;
  const res = await fetch(url, { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchDistinct(table, col) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=${col}&limit=200`;
  const res = await fetch(url, { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } });
  if (!res.ok) return [];
  const rows = await res.json();
  const seen = new Set();
  return rows.map(r => r[col]).filter(v => { if (v == null || seen.has(v)) return false; seen.add(v); return true; }).sort();
}