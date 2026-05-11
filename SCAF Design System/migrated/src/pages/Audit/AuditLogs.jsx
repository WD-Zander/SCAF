import { useState } from 'react';
import {
  Search, Filter, Download,
  CheckCircle2, CirclePlus, AlertTriangle, CalendarClock, Trash2, Pencil, LogIn,
} from 'lucide-react';
import { Button, Badge, Card, Field } from '../../components/UI';

const EVENTS = [
  { ts: '2026-05-11 09:42', actor: 'Carlos L.',  role: 'Técnico',     action: 'completed',   target: 'PM-204 · Compresor Atlas',          tone: 'success', Icon: CheckCircle2 },
  { ts: '2026-05-11 08:15', actor: 'Ana M.',     role: 'Coordinadora', action: 'created',     target: 'ACT-0114 · Servidor Proliant DL380', tone: 'neutral', Icon: CirclePlus },
  { ts: '2026-05-11 07:00', actor: 'Sistema',    role: 'Automatizado', action: 'alerted',     target: 'PM-187 vence en 3 días',             tone: 'warning', Icon: AlertTriangle },
  { ts: '2026-05-10 18:30', actor: 'Diego R.',   role: 'Supervisor',   action: 'rescheduled', target: 'PM-162 movido a 15 May',             tone: 'neutral', Icon: CalendarClock },
  { ts: '2026-05-10 14:08', actor: 'María V.',   role: 'Admin',        action: 'edited',      target: 'ACT-0042 · valor +$2.400',            tone: 'neutral', Icon: Pencil },
  { ts: '2026-05-10 11:22', actor: 'Diego R.',   role: 'Supervisor',   action: 'deleted',     target: 'ACT-0007 (legacy, archivo)',          tone: 'danger',  Icon: Trash2 },
  { ts: '2026-05-10 08:00', actor: 'Carlos L.',  role: 'Técnico',     action: 'logged in',   target: 'Sesión iniciada',                     tone: 'neutral', Icon: LogIn },
];

const ACTION_LABEL = {
  completed:   'completó',
  created:     'creó',
  alerted:     'alertó sobre',
  rescheduled: 'reprogramó',
  edited:      'editó',
  deleted:     'eliminó',
  'logged in': 'inició sesión',
};

export default function AuditLogs() {
  const [q, setQ] = useState('');
  const filtered = EVENTS.filter(e => `${e.actor} ${e.action} ${e.target}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Sistema y Config</div>
          <h1 style={{ margin: 0 }}>Auditoría</h1>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0', fontSize: '0.9rem' }}>
            Registro inmutable de acciones · ISO 27001 · retención 7 años
          </p>
        </div>
        <Button variant="secondary" icon={Download}>Exportar CSV</Button>
      </div>

      <Card padded={false} style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <Field icon={Search} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Usuario, acción, recurso afectado…" />
          </div>
          <Button variant="ghost" icon={Filter}>Filtros</Button>
        </div>
      </Card>

      <Card padded={false} style={{ padding: '8px 0' }}>
        {filtered.map((e, i) => (
          <div key={i} style={{
            display: 'grid',
            gridTemplateColumns: '160px 36px 1fr',
            gap: 14, padding: '12px 18px',
            borderBottom: i < filtered.length - 1 ? '1px solid var(--glass-border)' : 'none',
            alignItems: 'flex-start',
          }}>
            <div className="code-font" style={{ fontSize: '0.74rem', color: 'var(--text-muted)', paddingTop: 4 }}>{e.ts}</div>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: e.tone === 'success' ? 'var(--success-bg)' : e.tone === 'warning' ? 'var(--warning-bg)' : e.tone === 'danger' ? 'var(--danger-bg)' : 'var(--bg-tertiary)',
              color:      e.tone === 'success' ? 'var(--success)'    : e.tone === 'warning' ? 'var(--warning)'    : e.tone === 'danger' ? 'var(--danger)'    : 'var(--text-muted)',
            }}>
              <e.Icon size={14} />
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', lineHeight: 1.4 }}>
                <strong style={{ fontWeight: 600 }}>{e.actor}</strong>{' '}
                <span style={{ color: 'var(--text-muted)' }}>{ACTION_LABEL[e.action]}</span>{' '}
                <span>{e.target}</span>
              </div>
              <div style={{ marginTop: 4, display: 'flex', gap: 8, alignItems: 'center' }}>
                <Badge tone="neutral">{e.role}</Badge>
                <span className="code-font" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  IP 10.42.{17 + i}.{120 + i * 3}
                </span>
              </div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
