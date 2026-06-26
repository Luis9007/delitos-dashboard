import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchTableData } from '../supabase';

const PAGE_SIZES = [20, 50, 100];

const GlassBtn = ({ onClick, children, accent, style = {} }) => (
  <button onClick={onClick} style={{
    padding: '7px 14px', border: `1px solid ${accent ? 'rgba(108,143,255,0.4)' : 'rgba(255,255,255,0.12)'}`,
    borderRadius: '9px', cursor: 'pointer', fontSize: '12px', fontWeight: 500,
    background: accent
      ? 'linear-gradient(135deg, rgba(108,143,255,0.25), rgba(167,139,250,0.18))'
      : 'rgba(255,255,255,0.07)',
    backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
    color: accent ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.7)',
    transition: 'all .15s', display: 'flex', alignItems: 'center', gap: '5px',
    ...style,
  }}>{children}</button>
);

export default function DataTable({ table, globalFilters }) {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [columns, setColumns] = useState([]);
  const [visibleCols, setVisibleCols] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const searchTimer = useRef(null);

  const load = useCallback(async ({ pg = page, ps = pageSize, q = search, sc = sortCol, sa = sortAsc, cols = columns } = {}) => {
    setLoading(true); setError(null);
    try {
      const { data: rows, total: t } = await fetchTableData(table, {
        page: pg, pageSize: ps, search: q, searchCol: cols[0] ?? null,
        sortCol: sc, sortAsc: sa, filters: globalFilters || {},
      });
      setData(rows); setTotal(t);
      if (cols.length === 0 && rows.length > 0) {
        const c = Object.keys(rows[0]);
        setColumns(c); setVisibleCols(c);
      }
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [table, page, pageSize, search, sortCol, sortAsc, columns, globalFilters]);

  useEffect(() => {
    setPage(1); setSearch(''); setSortCol(null); setColumns([]); setVisibleCols([]);
    fetchTableData(table, { page: 1, pageSize, search: '', filters: globalFilters || {} })
      .then(({ data: rows, total: t }) => {
        setData(rows); setTotal(t); setLoading(false);
        if (rows.length > 0) { const c = Object.keys(rows[0]); setColumns(c); setVisibleCols(c); }
      }).catch(e => { setError(e.message); setLoading(false); });
  }, [table]);

  useEffect(() => { load({ pg: 1 }); }, [globalFilters]);

  const sort = (col) => {
    const asc = sortCol === col ? !sortAsc : true;
    setSortCol(col); setSortAsc(asc); setPage(1);
    load({ sc: col, sa: asc, pg: 1 });
  };

  const onSearch = (val) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setPage(1); load({ q: val, pg: 1 }); }, 380);
  };

  const goPage = (p) => {
    const max = Math.ceil(total / pageSize);
    if (p < 1 || p > max) return;
    setPage(p); load({ pg: p });
  };

  const toggleCol = (col) => {
    const next = visibleCols.includes(col)
      ? visibleCols.filter(c => c !== col)
      : columns.filter(c => visibleCols.includes(c) || c === col);
    if (next.length === 0) return;
    setVisibleCols(next);
  };

  const exportCSV = () => {
    const rows = [visibleCols.join(','), ...data.map(r =>
      visibleCols.map(c => { let v = r[c] ?? ''; if (String(v).includes(',') || String(v).includes('"')) v = `"${String(v).replace(/"/g, '""')}"`;  return v; }).join(',')
    )];
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv' }));
    a.download = `${table}.csv`; a.click();
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total ? (page - 1) * pageSize + 1 : 0;
  const to = Math.min(page * pageSize, total);

  const pageNums = [];
  if (totalPages <= 6) { for (let i = 1; i <= totalPages; i++) pageNums.push(i); }
  else {
    pageNums.push(1);
    if (page > 3) pageNums.push('…');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pageNums.push(i);
    if (page < totalPages - 2) pageNums.push('…');
    pageNums.push(totalPages);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {error && (
        <div style={{ background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#fca5a5', backdropFilter: 'blur(8px)' }}>
          ⚠ {error}
        </div>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <span style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', fontSize: '13px', pointerEvents: 'none' }}>⌕</span>
          <input
            type="text" value={search} onChange={e => onSearch(e.target.value)}
            placeholder={`Buscar en ${columns[0] ?? 'tabla'}…`}
            style={{
              width: '100%', padding: '8px 12px 8px 30px',
              border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px',
              background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(8px)',
              color: 'rgba(255,255,255,0.9)', fontSize: '13px', outline: 'none',
              transition: 'border-color .15s',
            }}
            onFocus={e => e.target.style.borderColor = 'rgba(108,143,255,0.5)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
          />
        </div>
        <select
          value={pageSize} onChange={e => { setPageSize(+e.target.value); setPage(1); load({ ps: +e.target.value, pg: 1 }); }}
          style={{ padding: '8px 10px', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(8px)', color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}
        >
          {PAGE_SIZES.map(v => <option key={v} value={v} style={{ background: '#1a1f2e' }}>{v} filas</option>)}
        </select>
        <GlassBtn onClick={() => load()}>↻ Actualizar</GlassBtn>
        <GlassBtn onClick={exportCSV} accent>↓ CSV</GlassBtn>
      </div>

      {/* Column chips */}
      {columns.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
          {columns.map(c => {
            const on = visibleCols.includes(c);
            return (
              <span key={c} onClick={() => toggleCol(c)} style={{
                padding: '3px 11px', borderRadius: '20px', fontSize: '11px', fontWeight: on ? 500 : 400,
                cursor: 'pointer', userSelect: 'none', transition: 'all .15s',
                background: on ? 'linear-gradient(135deg, rgba(108,143,255,0.2), rgba(167,139,250,0.15))' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${on ? 'rgba(108,143,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
                color: on ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)',
              }}>{c}</span>
            );
          })}
        </div>
      )}

      {/* Table */}
      <div style={{
        borderRadius: '16px', overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.10)',
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)',
        overflowX: 'auto',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {visibleCols.map(c => (
                <th key={c} onClick={() => sort(c)} style={{
                  padding: '12px 16px', textAlign: 'left', fontWeight: 500, fontSize: '11px',
                  color: sortCol === c ? 'rgba(108,143,255,0.9)' : 'rgba(255,255,255,0.45)',
                  whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  transition: 'color .15s',
                }}>
                  {c} {sortCol === c ? (sortAsc ? '↑' : '↓') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={99} style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.3)' }}>
                <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                  <div style={{ width: '16px', height: '16px', border: '2px solid rgba(108,143,255,0.3)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Cargando…
                </div>
              </td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={99} style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.25)', fontSize: '13px' }}>Sin resultados</td></tr>
            ) : data.map((row, i) => (
              <tr key={i} style={{
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                transition: 'background .1s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(108,143,255,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'}
              >
                {visibleCols.map(c => (
                  <td key={c} title={String(row[c] ?? '')} style={{
                    padding: '10px 16px', color: 'rgba(255,255,255,0.82)',
                    whiteSpace: 'nowrap', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {row[c] == null ? <span style={{ color: 'rgba(255,255,255,0.2)' }}>—</span> : String(row[c])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
          {total > 0 ? `${from.toLocaleString()}–${to.toLocaleString()} de ${total.toLocaleString()} registros` : ''}
        </span>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <button onClick={() => goPage(page - 1)} disabled={page === 1} style={{
            padding: '5px 10px', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px',
            background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '13px',
          }}>‹</button>
          {pageNums.map((p, i) => p === '…'
            ? <span key={i} style={{ padding: '0 4px', color: 'rgba(255,255,255,0.25)' }}>…</span>
            : <button key={p} onClick={() => goPage(p)} style={{
              padding: '5px 10px', border: `1px solid ${p === page ? 'rgba(108,143,255,0.5)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: p === page ? 600 : 400,
              background: p === page ? 'linear-gradient(135deg, rgba(108,143,255,0.3), rgba(167,139,250,0.2))' : 'rgba(255,255,255,0.04)',
              color: p === page ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.5)',
            }}>{p}</button>
          )}
          <button onClick={() => goPage(page + 1)} disabled={page >= totalPages} style={{
            padding: '5px 10px', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px',
            background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '13px',
          }}>›</button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
