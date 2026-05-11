const TONES = {
  success: { bg: '#DCFCE7', fg: '#15803D' },
  warning: { bg: '#FEF3C7', fg: '#B45309' },
  danger:  { bg: '#FEE2E2', fg: '#B91C1C' },
  neutral: { bg: '#F4F4F5', fg: '#71717A' },
  accent:  { bg: '#0F172A', fg: '#fff' },
};

/**
 * Status badge — use ONLY these 5 tones (matches design-system semantics).
 * @param {object} props
 * @param {'success'|'warning'|'danger'|'neutral'|'accent'} [props.tone]
 * @param {boolean} [props.dot]
 */
export default function Badge({ tone = 'neutral', dot = false, children, style }) {
  const t = TONES[tone];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 10px',
      background: t.bg, color: t.fg,
      borderRadius: 'var(--radius-pill)',
      fontSize: '0.68rem', fontWeight: 700,
      letterSpacing: '0.04em', textTransform: 'uppercase',
      whiteSpace: 'nowrap',
      ...style,
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />}
      {children}
    </span>
  );
}
