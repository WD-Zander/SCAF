import { useState } from 'react';
import { Search, Upload, QrCode, Plus, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { Button, Badge, Card, Field } from '../../components/UI';
import { useIsMobile } from '../../hooks/useIsMobile';

const ROWS = [
  { id: 'ACT-0014', name: 'Compresor Atlas Copco GA-90', serial: 'HP-SN-12345',  cat: 'Maquinaria', site: 'Sede Norte',   status: 'ok',      next: '14 May 2026', value: 38500 },
  { id: 'ACT-0027', name: 'Generador Cummins 75kVA',     serial: 'CMN-SN-49021', cat: 'Energía',    site: 'Planta 2',     status: 'warn',    next: 'Hoy',         value: 22400 },
  { id: 'ACT-0114', name: 'Servidor Proliant DL380',      serial: 'SRV-2024-001', cat: 'IT',         site: 'Data Center',  status: 'bad',     next: '02 Abr 2026', value: 9800 },
  { id: 'ACT-0042', name: 'Carretilla elevadora Yale',    serial: 'YL-2022-118',  cat: 'Logística',  site: 'Almacén A',    status: 'ok',      next: '15 May 2026', value: 15300 },
  { id: 'ACT-0089', name: 'Banco prueba hidráulico',      serial: 'HYD-008',      cat: 'Calidad',    site: 'Laboratorio',  status: 'ok',      next: '28 May 2026', value: 6200 },
  { id: 'ACT-0151', name: 'Robot soldador Fanuc R-2000',  serial: 'FAN-R-001',    cat: 'Maquinaria', site: 'Línea 3',      status: 'neutral', next: '—',           value: 42100 },
];

const STATUS = {
  ok:      { tone: 'success', label: 'Activo' },
  warn:    { tone: 'warning', label: 'En Mantenimiento' },
  bad:     { tone: 'danger',  label: 'Vencido' },
  neutral: { tone: 'neutral', label: 'Inactivo' },
};

export default function InventoryList() {
  const isMobile = useIsMobile();
  const [q, setQ] = useState('');
  const filtered = ROWS.filter(r => `${r.id} ${r.name} ${r.serial} ${r.cat} ${r.site}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Sistema y Config</div>
          <h1 style={{ margin: 0 }}>Inventario inteligente</h1>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0', fontSize: '0.9rem' }}>
            <strong style={{ color: 'var(--text-main)' }}>{ROWS.length.toLocaleString('es-ES')}</strong> activos registrados ·{' '}
            <span style={{ color: 'var(--success)' }}>4 activos</span> ·{' '}
            <span style={{ color: 'var(--warning)' }}>1 en mant.</span> ·{' '}
            <span style={{ color: 'var(--danger)' }}>1 vencido</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button variant="secondary" icon={Upload}>Importar Excel</Button>
          <Button variant="secondary" icon={QrCode}>{isMobile ? 'QR' : 'Imprimir QR'}</Button>
          <Button variant="primary" icon={Plus}>Nuevo activo</Button>
        </div>
      </div>

      <Card padded={false} style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <Field icon={Search} value={q} onChange={(e) => setQ(e.target.value)} placeholder="ID, nombre, serial, categoría…" />
          </div>
          <Button variant="ghost" icon={SlidersHorizontal}>Filtros</Button>
          <Button variant="ghost" icon={ArrowUpDown}>Ordenar</Button>
        </div>
      </Card>

      {!isMobile && (
        <Card padded={false} style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['ID', 'Activo', 'Categoría', 'Ubicación', 'Estado', 'Próximo mant.', 'Valor'].map((h, i) => (
                  <th key={i} style={{
                    textAlign: i === 6 ? 'right' : 'left',
                    fontSize: '0.66rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase',
                    color: 'var(--text-muted)', padding: '11px 14px',
                    background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--glass-border)',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const s = STATUS[r.status];
                return (
                  <tr key={r.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--glass-border)' : 'none' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(37,99,235,0.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '11px 14px', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>{r.id}</td>
                    <td style={{ padding: '11px 14px', fontSize: '0.85rem' }}>
                      <div style={{ fontWeight: 600 }}>{r.name}</div>
                      <div className="code-font" style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: 2 }}>{r.serial}</div>
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: '0.84rem' }}>{r.cat}</td>
                    <td style={{ padding: '11px 14px', fontSize: '0.84rem', color: 'var(--text-muted)' }}>{r.site}</td>
                    <td style={{ padding: '11px 14px' }}><Badge tone={s.tone} dot>{s.label}</Badge></td>
                    <td style={{ padding: '11px 14px', fontSize: '0.82rem' }}>{r.next}</td>
                    <td style={{ padding: '11px 14px', fontSize: '0.84rem', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>${r.value.toLocaleString('es-ES')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {isMobile && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((r) => {
            const s = STATUS[r.status];
            return (
              <Card key={r.id} padded={false} style={{ padding: '14px 14px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="code-font" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>{r.id} · {r.serial}</div>
                    <div style={{ fontWeight: 600, fontSize: '0.92rem', lineHeight: 1.25 }}>{r.name}</div>
                  </div>
                  <Badge tone={s.tone} dot>{s.label}</Badge>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: 6, fontSize: '0.78rem' }}>
                  <div><span style={{ color: 'var(--text-muted)' }}>Categoría · </span>{r.cat}</div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Sitio · </span>{r.site}</div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Próximo · </span>{r.next}</div>
                  <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>${r.value.toLocaleString('es-ES')}</div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
