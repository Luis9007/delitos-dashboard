import { useState } from 'react';
import DataTable from './components/DataTable';
import Charts from './components/Charts';
import Filters from './components/Filters';
import { TABLES } from './supabase';
import './index.css';

const VIEWS = [
  { id: 'Tabla', icon: '⊞' },
  { id: 'Gráficas', icon: '◈' },
  { id: 'Filtros', icon: '⧉' },
];

const TABLE_ICONS = {
  fact_delitos: '⬡',
  dim_fecha: '◷',
  dim_municipio: '◉',
  dim_sexo: '◎',
  dim_dept: '◈',
};

export default function App() {
  const [activeTable, setActiveTable] = useState(TABLES[0]);
  const [activeView, setActiveView] = useState('Tabla');
  const [filters, setFilters] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? '230px' : '0',
        minWidth: sidebarOpen ? '230px' : '0',
        overflow: 'hidden',
        transition: 'min-width .25s cubic-bezier(.4,0,.2,1), width .25s cubic-bezier(.4,0,.2,1)',
        background: 'rgba(15,17,23,0.7)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 20,
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', whiteSpace: 'nowrap' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '10px', flexShrink: 0,
              background: 'linear-gradient(135deg, #6c8fff, #a78bfa)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '16px', boxShadow: '0 4px 12px rgba(108,143,255,0.4)',
            }}>⬡</div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.95)', letterSpacing: '-0.01em' }}>Delitos CO</div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginTop: '1px' }}>Panel analítico</div>
            </div>
          </div>
        </div>

        {/* Tables nav */}
        <nav style={{ padding: '16px 12px', flex: 1, overflow: 'auto' }}>
          <div style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 8px', marginBottom: '8px', whiteSpace: 'nowrap' }}>
            Tablas
          </div>
          {TABLES.map(t => {
            const active = activeTable === t;
            return (
              <button key={t} onClick={() => { setActiveTable(t); setFilters({}); }} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                width: '100%', textAlign: 'left', padding: '9px 12px',
                border: active ? '1px solid rgba(108,143,255,0.35)' : '1px solid transparent',
                borderRadius: '10px', cursor: 'pointer', marginBottom: '3px',
                background: active
                  ? 'linear-gradient(135deg, rgba(108,143,255,0.18), rgba(167,139,250,0.12))'
                  : 'transparent',
                color: active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.5)',
                fontSize: '13px', fontWeight: active ? 500 : 400,
                transition: 'all .15s ease',
                whiteSpace: 'nowrap',
                backdropFilter: active ? 'blur(8px)' : 'none',
              }}>
                <span style={{ fontSize: '16px', opacity: active ? 1 : 0.5 }}>{TABLE_ICONS[t]}</span>
                <span>{t}</span>
                {active && <span style={{ marginLeft: 'auto', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 6px var(--accent)', flexShrink: 0 }} />}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '10px', color: 'rgba(255,255,255,0.25)', whiteSpace: 'nowrap' }}>
          Supabase · cddaomfvpx…
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Topbar */}
        <header style={{
          height: '60px', display: 'flex', alignItems: 'center', gap: '14px',
          padding: '0 24px',
          background: 'rgba(15,17,23,0.65)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <button onClick={() => setSidebarOpen(o => !o)} style={{
            width: '32px', height: '32px', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '8px', background: 'rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all .15s',
          }}>☰</button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>{TABLE_ICONS[activeTable]}</span>
            <span style={{ fontWeight: 500, fontSize: '15px', letterSpacing: '-0.01em' }}>{activeTable}</span>
          </div>

          {Object.keys(filters).length > 0 && (
            <span style={{
              padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
              background: 'linear-gradient(135deg, rgba(108,143,255,0.25), rgba(167,139,250,0.2))',
              border: '1px solid rgba(108,143,255,0.4)', color: 'var(--accent)',
            }}>
              {Object.keys(filters).length} filtro{Object.keys(filters).length > 1 ? 's' : ''}
            </span>
          )}

          {/* View switcher */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '3px', padding: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.09)' }}>
            {VIEWS.map(({ id, icon }) => {
              const active = activeView === id;
              return (
                <button key={id} onClick={() => setActiveView(id)} style={{
                  padding: '6px 16px', border: 'none', borderRadius: '9px', cursor: 'pointer',
                  fontSize: '12px', fontWeight: active ? 600 : 400, display: 'flex', alignItems: 'center', gap: '6px',
                  background: active ? 'linear-gradient(135deg, rgba(108,143,255,0.3), rgba(167,139,250,0.2))' : 'transparent',
                  color: active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.45)',
                  boxShadow: active ? '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)' : 'none',
                  border: active ? '1px solid rgba(108,143,255,0.3)' : '1px solid transparent',
                  transition: 'all .15s ease',
                }}>
                  <span>{icon}</span> {id}
                </button>
              );
            })}
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, padding: '24px', overflow: 'auto' }} className="fade-in" key={activeTable + activeView}>
          {activeView === 'Tabla' && <DataTable table={activeTable} globalFilters={filters} />}
          {activeView === 'Gráficas' && <Charts activeTable={activeTable} />}
          {activeView === 'Filtros' && <Filters table={activeTable} onFiltersChange={setFilters} />}
        </main>
      </div>
    </div>
  );
}
