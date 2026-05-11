import { CheckCircle2, PlayCircle, Circle } from 'lucide-react';
import { Button, Badge, Card } from '../../components/UI';

const TASKS = [
  { time: '08:00', asset: 'Compresor Atlas Copco GA-90', op: 'Lubricación de rodamientos', code: 'ACT-0014', site: 'Sede Norte · Línea 1',    status: 'done',    est: '45 min' },
  { time: '10:30', asset: 'Generador Cummins 75kVA',     op: 'Cambio filtros aire/aceite', code: 'ACT-0027', site: 'Planta 2 · Sala motores', status: 'current', est: '1h 30 min' },
  { time: '13:00', asset: 'Robot soldador Fanuc R-2000', op: 'Calibración brazos 5/6',     code: 'ACT-0151', site: 'Línea 3 · Celda C',        status: 'pending', est: '2h 15 min' },
  { time: '16:00', asset: 'Carretilla elevadora Yale',   op: 'Revisión hidráulica',         code: 'ACT-0042', site: 'Almacén A',                status: 'pending', est: '50 min' },
];

const STATUS = {
  done:    { tone: 'success', label: 'Completada', Icon: CheckCircle2 },
  current: { tone: 'warning', label: 'En curso',    Icon: PlayCircle },
  pending: { tone: 'neutral', label: 'Pendiente',   Icon: Circle },
};

export default function OperatorDailySchedule() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <div className="eyebrow" style={{ marginBottom: 6 }}>Lunes · 11 mayo 2026</div>
        <h1 style={{ margin: 0 }}>Mi Agenda</h1>
        <p style={{ color: 'var(--text-muted)', margin: '4px 0 0', fontSize: '0.9rem' }}>
          <strong>4</strong> tareas hoy · <strong style={{ color: 'var(--success)' }}>1 completada</strong> · <strong style={{ color: 'var(--warning)' }}>1 en curso</strong>
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {TASKS.map((t, i) => {
          const s = STATUS[t.status];
          return (
            <Card key={i} padded={false} style={{
              padding: '14px 16px',
              opacity: t.status === 'done' ? 0.65 : 1,
              borderColor: t.status === 'current' ? 'var(--accent-primary)' : 'var(--glass-border)',
              boxShadow: t.status === 'current'
                ? '0 0 0 3px rgba(15,23,42,0.06), var(--glass-shadow)'
                : 'var(--glass-shadow)',
            }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0, paddingTop: 2 }}>
                  <div className="code-font" style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-main)' }}>{t.time}</div>
                  <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>{t.est}</div>
                </div>
                <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--glass-border)' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 4 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.92rem', lineHeight: 1.25, textDecoration: t.status === 'done' ? 'line-through' : 'none' }}>{t.asset}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: 2 }}>{t.op}</div>
                    </div>
                    <Badge tone={s.tone} dot>{s.label}</Badge>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      <span className="code-font" style={{ marginRight: 8 }}>{t.code}</span>{t.site}
                    </div>
                    {t.status === 'current' && <Button variant="primary" icon={CheckCircle2} style={{ padding: '6px 12px', fontSize: '0.78rem' }}>Completar</Button>}
                    {t.status === 'pending' && <Button variant="secondary" icon={PlayCircle} style={{ padding: '6px 12px', fontSize: '0.78rem' }}>Iniciar</Button>}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
