import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  AreaChart, Area, LineChart, Line, Legend
} from 'recharts';
import { fetchAllForChart } from '../supabase';

const PALETTE = ['#6c8fff','#a78bfa','#34d399','#fb923c','#f472b6','#38bdf8','#facc15','#4ade80'];

const GLASS_CARD = {
  background: 'rgba(255,255,255,0.05)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: '18px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
  padding: '20px 22px',
};

const TOOLTIP_STYLE = {
  background: 'rgba(15,17,23,0.92)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: '10px',
  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
  fontSize: '12px',
  color: 'rgba(255,255,255,0.9)',
};

function countBy(data, key, top = 12) {
  const map = {};
  data.forEach(row => { const v = row[key] ?? 'Sin dato'; map[v] = (map[v] || 0) + 1; });
  return Object.entries(map).map(([name, count]) => ({ name: String(name), count }))
    .sort((a, b) => b.count - a.count).slice(0, top);
}

function GlassStatCard({ label, value, sub, color = '#6c8fff' }) {
  return (
    <div style={{
      ...GLASS_CARD, padding: '18px 20px',
      background: `linear-gradient(135deg, rgba(${hexToRgb(color)},0.12), rgba(255,255,255,0.04))`,
      border: `1px solid rgba(${hexToRgb(color)},0.25)`,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: '-20px', right: '-20px',
        width: '80px', height: '80px', borderRadius: '50%',
        background: `radial-gradient(circle, rgba(${hexToRgb(color)},0.2), transparent)`,
        pointerEvents: 'none',
      }} />
      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontSize: '26px', fontWeight: 600, color: 'rgba(255,255,255,0.95)', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '5px' }}>{sub}</div>}
    </div>
  );
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return `${r},${g},${b}`;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={TOOLTIP_STYLE}>
      <div style={{ fontWeight: 600, marginBottom: '4px', color: 'rgba(255,255,255,0.7)', fontSize: '11px' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: p.color, display: 'inline-block' }} />
          <span style={{ color: 'rgba(255,255,255,0.95)', fontWeight: 500 }}>{p.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

const CustomPieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div style={TOOLTIP_STYLE}>
      <div style={{ fontWeight: 600, color: p.payload.fill }}>{p.name}</div>
      <div style={{ color: 'rgba(255,255,255,0.8)' }}>{p.value?.toLocaleString()} registros</div>
      <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px' }}>{(p.percent * 100).toFixed(1)}%</div>
    </div>
  );
};

function HorizontalBar({ data, color }) {
  const max = data[0]?.count || 1;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
      {data.slice(0, 8).map((d, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '90px', fontSize: '11px', color: 'rgba(255,255,255,0.55)', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 0 }}>{d.name}</div>
          <div style={{ flex: 1, height: '22px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
            <div style={{
              height: '100%', borderRadius: '6px',
              width: `${(d.count / max) * 100}%`,
              background: `linear-gradient(90deg, ${color}, ${color}88)`,
              transition: 'width .6s cubic-bezier(.4,0,.2,1)',
              boxShadow: `0 0 10px ${color}44`,
            }} />
          </div>
          <div style={{ width: '44px', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.75)', textAlign: 'right', flexShrink: 0 }}>{d.count.toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ data }) {
  const total = data.reduce((a, b) => a + b.count, 0);
  return (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <ResponsiveContainer width={160} height={160}>
        <PieChart>
          <Pie data={data.slice(0,6)} dataKey="count" cx="50%" cy="50%" innerRadius={46} outerRadius={72} paddingAngle={3}>
            {data.slice(0,6).map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} stroke="transparent" />)}
          </Pie>
          <Tooltip content={<CustomPieTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {data.slice(0,6).map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: PALETTE[i % PALETTE.length], flexShrink: 0 }} />
            <span style={{ color: 'rgba(255,255,255,0.6)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
            <span style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 500, flexShrink: 0 }}>{((d.count / total) * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function VerticalBarChart({ data, color }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 36 }}>
        <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} angle={-40} textAnchor="end" interval={0} />
        <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="count" radius={[4,4,0,0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={`url(#bar-grad-${i})`} />
          ))}
          <defs>
            {data.map((_, i) => (
              <linearGradient key={i} id={`bar-grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.9} />
                <stop offset="100%" stopColor={color} stopOpacity={0.4} />
              </linearGradient>
            ))}
          </defs>
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function Charts({ activeTable }) {
  const [chartData, setChartData] = useState({});
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true); setChartData({}); setColumns([]);
    fetchAllForChart(activeTable, '*', 1000).then(rows => {
      if (!rows.length) { setLoading(false); return; }
      const cols = Object.keys(rows[0]);
      setColumns(cols);
      setTotal(rows.length);

      const categoricals = cols.filter(c => {
        const sample = rows.slice(0, 100).map(r => r[c]).filter(v => v != null);
        const unique = new Set(sample).size;
        return unique > 0 && unique <= 40 && typeof sample[0] !== 'object';
      });

      const built = {};
      categoricals.slice(0, 6).forEach(col => { built[col] = countBy(rows, col); });
      setChartData(built);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [activeTable]);

  const entries = Object.entries(chartData);

  const statColors = ['#6c8fff', '#a78bfa', '#34d399', '#fb923c'];

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem', gap: '10px', color: 'rgba(255,255,255,0.4)' }}>
      <div style={{ width: '20px', height: '20px', border: '2px solid rgba(108,143,255,0.3)', borderTopColor: '#6c8fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      Analizando datos…
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!entries.length) return (
    <div style={{ ...GLASS_CARD, textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.35)' }}>
      Sin columnas categóricas para graficar en esta tabla.
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
        <GlassStatCard label="Registros" value={total.toLocaleString()} sub="en muestra" color="#6c8fff" />
        <GlassStatCard label="Columnas" value={columns.length} sub="detectadas" color="#a78bfa" />
        <GlassStatCard label="Gráficas" value={entries.length} sub="categóricas" color="#34d399" />
        <GlassStatCard label="Tabla" value={activeTable.replace('_', ' ')} sub="activa" color="#fb923c" />
      </div>

      {/* Charts grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
        {entries.map(([col, data], idx) => {
          const color = PALETTE[idx % PALETTE.length];
          const type = idx % 3 === 0 ? 'hbar' : idx % 3 === 1 ? 'donut' : 'vbar';
          return (
            <div key={col} style={{
              ...GLASS_CARD,
              background: `linear-gradient(145deg, rgba(255,255,255,0.05), rgba(${hexToRgb(color)},0.04))`,
              border: `1px solid rgba(${hexToRgb(color)},0.18)`,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.9)', letterSpacing: '-0.01em' }}>{col}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>
                    {data.length} valores únicos · distribución
                  </div>
                </div>
                <span style={{
                  padding: '3px 9px', borderRadius: '20px', fontSize: '10px', fontWeight: 600,
                  background: `rgba(${hexToRgb(color)},0.15)`,
                  border: `1px solid rgba(${hexToRgb(color)},0.35)`,
                  color: color, textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>{type === 'hbar' ? 'barras' : type === 'donut' ? 'donut' : 'columnas'}</span>
              </div>

              {type === 'hbar' && <HorizontalBar data={data} color={color} />}
              {type === 'donut' && <DonutChart data={data} />}
              {type === 'vbar' && <VerticalBarChart data={data} color={color} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
