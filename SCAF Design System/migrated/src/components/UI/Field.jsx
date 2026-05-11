import { useState } from 'react';

/**
 * Text input with optional leading lucide-react icon.
 * @param {object} props
 * @param {React.ComponentType} [props.icon] - lucide-react component
 */
export default function Field({
  label, icon: Icon, value, onChange, placeholder, type = 'text', style, ...rest
}) {
  const [focus, setFocus] = useState(false);
  return (
    <label style={{ display: 'block', ...style }}>
      {label && (
        <span style={{
          display: 'block', fontSize: '0.74rem', fontWeight: 600,
          color: 'var(--text-main)', marginBottom: 6,
        }}>{label}</span>
      )}
      <span style={{ position: 'relative', display: 'block' }}>
        {Icon && (
          <Icon size={14} style={{
            position: 'absolute', left: 11, top: '50%',
            transform: 'translateY(-50%)', opacity: 0.55,
            pointerEvents: 'none',
          }} />
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: Icon ? '9px 12px 9px 34px' : '9px 12px',
            background: '#fff',
            border: `1px solid ${focus ? 'var(--accent-primary)' : 'var(--glass-border)'}`,
            boxShadow: focus ? '0 0 0 3px rgba(15,23,42,.08)' : 'none',
            borderRadius: 'var(--radius-sm)',
            fontFamily: 'inherit', fontSize: '0.85rem',
            color: 'var(--text-main)',
            outline: 'none',
            transition: 'var(--transition)',
          }}
          {...rest}
        />
      </span>
    </label>
  );
}
