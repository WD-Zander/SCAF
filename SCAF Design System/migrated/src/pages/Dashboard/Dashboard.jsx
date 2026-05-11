import { useState } from 'react';
import {
  DollarSign, Box, Wrench, CheckCircle2,
  Plus, Download, AlertTriangle, CalendarClock, CirclePlus,
} from 'lucide-react';
import { Button, Badge, Card } from '../../components/UI';
import { useIsMobile } from '../../hooks/useIsMobile';

const KPIS = [
  { label: 'Activos totales',   value: '1.247',  delta: '+4.2% vs mes ant.',  tone: 'up',   Icon: Box },
  { label: 'Valor del parque',  value: '$ 4.8M', delta: 'Estable últimos 30d', tone: 'flat', Icon: DollarSign },
  { label: 'Mantenimientos',    value: '23',     delta: '8 vencen esta sem.',  tone: 'down', Icon: Wrench },
  { label: 'Cumplimiento ISO',  value: '94 %',   delta: '+2.1pp objetivo',     tone: 'up',   Icon: CheckCircle2 },
];

const REMINDERS = [
  { id: 'PM-204', asset: 'Compresor Atlas Copco GA-90', code: 'ACT-0014', due: 'Hoy',     priority: 'danger',  op: 'Lubricación de rodamientos' },
  { id: 'PM-198', asset: 'Generador Cummins 75kVA',     code: 'ACT-0027', due: 'Mañana',  priority: 'warning', op: 'Cambio de filtros aire/aceite' },
  { id: 'PM-187', asset: 'Servidor Proliant DL380',      code: 'ACT-0114', due: '12 May',  priority: 'neutral', op: 'Limpieza de polvo + test UPS' },
  { id: 'PM-162', asset: 'Carretilla elevadora Yale',    code: 'ACT-0042', due: '15 May',  priority: 'neutral', op: 'Revisión hidráulica' },
];

const ACTIVITY = [
  { who: 'Carlos L.', what: 'completó',    where: 'PM-204 · Compresor Atlas',    when: 'Hace 12 min', Icon: CheckCircle2,    tone: 'success' },
  { who: 'Ana M.',    what: 'creó activo', where: 'ACT-0114 · Servidor DL380',   when: 'Hace 3h',     Icon: CirclePlus,      tone: 'neutral' },
  { who: 'Sistema',   what: 'alertó',      where: 'Vencimiento PM-187 en 3 días', when: 'Hace 4h',    Icon: AlertTriangle,   tone: 'warning' },
  { who: 'Diego R.',  what: 'reprogramó',  where: 'PM-162 → 15 May',              when: 'Ayer',       Icon: CalendarClock,   tone: 'neutral' },
];

export default function Dashboard() {
  const isMobile = useIsMobile();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Lunes · 11 mayo 2026</div>
          <h1 style={{ margin: 0 }}>Bienvenido, Carlos</h1>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0', fontSize: '0.9rem' }}>
            ⚠️ Tienes <strong style={{ color: 'var(--danger)' }}>3 mantenimientos vencidos</strong> y 8 que vencen esta semana.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" icon={Download}>Exportar</Button>
          <Button variant="primary" icon={Plus}>Crear activo</Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? 10 : 14 }}>
        {KPIS.map((k) => (
          <Card key={k.label} padded={false} style={{ padding: '16px 16px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.03em', textTransform: 'uppercase' }}>{k.label}</span>
              <span style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-light)', color: 'var(--accent-primary)' }}>
                <k.Icon size={14} />
              </span>
            </div>
            <div style={{ fontSize: isMobile ? '1.35rem' : '1.6rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{k.value}</div>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, marginTop: 4, color: k.tone === 'up' ? 'var(--success)' : k.tone === 'down' ? 'var(--danger)' : 'var(--text-muted)' }}>{k.delta}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.55fr 1fr', gap: isMobile ? 14 : 22 }}>
        <Card padded={false}>
          <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)' }}>
            <div>
              <h3 style={{ margin: 0 }}>Mantenimientos próximos</h3>
              <p style={{ margin: '2px 0 0', color: 'var(--text-muted)', fontSize: '0.78rem' }}>15 días siguientes · ordenados por urgencia</p>
            </div>
            <Button variant="ghost">Ver todos →</Button>
          </div>
          {REMINDERS.map((r, i) => (
            <div key={r.id} style={{
              padding: '13px 18px',
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'auto 1fr auto',
              alignItems: 'center', gap: isMobile ? 6 : 14,
              borderBottom: i < REMINDERS.length - 1 ? '1px solid var(--glass-border)' : 'none',
            }}>
              <span className="code-font" style={{ color: 'var(--text-muted)', fontSize: '0.74rem', fontWeight: 600 }}>{r.id}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{r.asset}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.73rem', marginTop: 2 }}>
                  <span className="code-font" style={{ marginRight: 8 }}>{r.code}</span>{r.op}
                </div>
              </div>
              <Badge tone={r.priority} dot>{r.due}</Badge>
            </div>
          ))}
        </Card>

        <Card padded={false}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--glass-border)' }}>
            <h3 style={{ margin: 0 }}>Actividad reciente</h3>
            <p style={{ margin: '2px 0 0', color: 'var(--text-muted)', fontSize: '0.78rem' }}>Auditoría — últimas 24 horas</p>
          </div>
          {ACTIVITY.map((a, i) => (
            <div key={i} style={{
              padding: '12px 18px', display: 'flex', gap: 12, alignItems: 'flex-start',
              borderBottom: i < ACTIVITY.length - 1 ? '1px solid var(--glass-border)' : 'none',
            }}>
              <span style={{
                width: 28, height: 28, flexShrink: 0, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: a.tone === 'success' ? 'var(--success-bg)' : a.tone === 'warning' ? 'var(--warning-bg)' : 'var(--bg-tertiary)',
                color:      a.tone === 'success' ? 'var(--success)'    : a.tone === 'warning' ? 'var(--warning)'    : 'var(--text-muted)',
              }}>
                <a.Icon size={13} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.84rem', lineHeight: 1.4 }}>
                  <strong style={{ fontWeight: 600 }}>{a.who}</strong>{' '}
                  <span style={{ color: 'var(--text-muted)' }}>{a.what}</span>{' '}
                  <span>{a.where}</span>
                </div>
                <div className="code-font" style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: 2 }}>{a.when}</div>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
