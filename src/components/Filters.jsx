import { useEffect, useState } from 'react';
import { fetchDistinct } from '../supabase';

const FILTER_COLS = {
  fact_delitos: ['tipo_delito', 'ano', 'mes'],
  dim_fecha: ['ano', 'mes', 'trimestre'],
  dim_municipio: ['departamento', 'municipio'],
  dim_sexo: ['sexo'],
  dim_dept: ['departamento', 'region'],
};

const GLASS_CARD = {
  background: 'rgba(255,255,255,0.05)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: '18px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
  padding: '20px 22px',
};

export default function Filters({ table, onFiltersChange }) {
  const [fields, setFields] = useState({});
  const [values, setValues] = useState({});
  const [applied, setApplied] = useState({});
  const [loading, setLoading] = useState(false);

  const cols = FILTER_COLS[table] || [];

  useEffect(() => {
    if (!cols.length) return;
    setLoading(true); setFields({}); setValues({}); setApplied({}); onFiltersChange({});
    Promise.all(cols.map(c => fetchDistinct(table, c).then(vals => [c, vals])))
      .then(res => { setFields(Object.fromEntries(res)); setLoading(false); })
      .catch(() => setLoading(false));
  }, [table]);

  const apply = () => {
    const active = Object.fromEntries(Object.entries(values).filter(([, v]) => v !== ''));
    setApplied(active); onFiltersChange(active);
  };

  const clear = () => { setValues({}); setApplied({}); onFiltersChange({}); };

  const removeFilter = (col) => {
    const next = { ...applied }; delete next[col];
    setApplied(next); onFiltersChange(next);
    setValues(v => { const n = { ...v }; delete n[col]; return n; });
  };

  const activeCount = Object.keys(applied).length;

  const inputStyle = {
    width: '100%', padding: '9px 12px',
    border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px',
    background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(8px)',
    color: 'rgba(255,255,255,0.9)', fontSize: '13px', outline: 'none',
  };

  if (!cols.length) return (
    <div style={{ ...GLASS_CARD, textAlign: 'center', color: 'rgba(255,255,255,0.35)', padding: '3rem' }}>
      No hay filtros predefinidos para esta tabla.
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '780px' }}>
      {/* Header */}
      <div style={{ ...GLASS_CARD }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: activeCount > 0 ? '16px' : '0' }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: 'rgba(255,255,255,0.9)', letterSpacing: '-0.01em' }}>Filtros avanzados</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>
              {activeCount > 0 ? `${activeCount} filtro${activeCount > 1 ? 's' : ''} activo${activeCount > 1 ? 's' : ''}` : 'Ningún filtro aplicado'}
            </div>
          </div>
          {activeCount > 0 && (
            <button onClick={clear} style={{
              padding: '7px 14px', border: '1px solid rgba(248,113,113,0.35)', borderRadius: '10px',
              background: 'rgba(248,113,113,0.1)', color: '#fca5a5', fontSize: '12px',
              cursor: 'pointer', fontWeight: 500,
            }}>✕ Limpiar todo</button>
          )}
        </div>

        {activeCount > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {Object.entries(applied).map(([col, val]) => (
              <span key={col} style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                padding: '4px 12px', borderRadius: '20px', fontSize: '12px',
                background: 'linear-gradient(135deg, rgba(108,143,255,0.2), rgba(167,139,250,0.15))',
                border: '1px solid rgba(108,143,255,0.4)', color: 'rgba(255,255,255,0.9)',
              }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px' }}>{col}:</span>
                <span style={{ fontWeight: 500 }}>{val}</span>
                <span onClick={() => removeFilter(col)} style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontWeight: 700, fontSize: '13px', lineHeight: 1 }}>×</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Filter fields */}
      {loading ? (
        <div style={{ ...GLASS_CARD, color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>Cargando opciones de filtro…</div>
      ) : (
        <div style={{ ...GLASS_CARD }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            {cols.map(col => (
              <div key={col}>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '7px' }}>{col}</label>
                {fields[col] && fields[col].length <= 20 ? (
                  <select
                    value={values[col] || ''}
                    onChange={e => setValues(v => ({ ...v, [col]: e.target.value }))}
                    style={{ ...inputStyle }}
                  >
                    <option value="" style={{ background: '#1a1f2e' }}>Todos</option>
                    {(fields[col] || []).map(v => <option key={v} value={v} style={{ background: '#1a1f2e' }}>{v}</option>)}
                  </select>
                ) : (
                  <input
                    type="text" value={values[col] || ''}
                    onChange={e => setValues(v => ({ ...v, [col]: e.target.value }))}
                    placeholder={`Filtrar por ${col}…`}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'rgba(108,143,255,0.5)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
                  />
                )}
              </div>
            ))}
          </div>

          <button onClick={apply} style={{
            marginTop: '20px', padding: '10px 24px',
            background: 'linear-gradient(135deg, #6c8fff, #a78bfa)',
            border: 'none', borderRadius: '10px', color: '#fff',
            fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(108,143,255,0.35)',
            transition: 'opacity .15s',
          }}
          onMouseEnter={e => e.target.style.opacity = '0.9'}
          onMouseLeave={e => e.target.style.opacity = '1'}
          >
            Aplicar filtros →
          </button>
        </div>
      )}
    </div>
  );
}
