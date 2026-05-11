import { useState } from 'react';

const VARIANTS = {
  primary:   { bg: '#0F172A', fg: '#fff',     border: '#0F172A',   hover: '#1E293B' },
  secondary: { bg: '#fff',    fg: '#09090B',  border: '#E4E4E7',   hover: '#F4F4F5' },
  ghost:     { bg: 'transparent', fg: '#71717A', border: 'transparent', hover: '#F1F5F9' },
  danger:    { bg: '#FEE2E2', fg: '#B91C1C',  border: 'transparent', hover: '#FECACA' },
};

/**
 * SCAF primary button.
 * @param {object} props
 * @param {'primary'|'secondary'|'ghost'|'danger'} [props.variant]
 * @param {React.ComponentType} [props.icon]  - lucide-react component, e.g. Plus
 */
export default function Button({
  variant = 'primary',
  icon: Icon,
  children,
  onClick,
  type = 'button',
  disabled,
  style,
  ...rest
}) {
  const v = VARIANTS[variant];
  const [hover, setHover] = useState(false);
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '9px 16px',
        background: hover && !disabled ? v.hover : v.bg,
        color: v.fg,
        border: `1px solid ${v.border}`,
        borderRadius: 'var(--radius-sm)',
        fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        transition: 'var(--transition)',
        whiteSpace: 'nowrap',
        ...style,
      }}
      {...rest}
    >
      {Icon && <Icon size={14} />}
      {children}
    </button>
  );
}
