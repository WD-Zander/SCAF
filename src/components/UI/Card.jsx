/**
 * Flat white panel — the SCAF replacement for `.glass-panel`.
 * Use `padded={false}` and provide your own padding when laying out tables/lists.
 */
export default function Card({ children, padded = true, style, ...rest }) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid var(--glass-border)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--glass-shadow)',
        padding: padded ? '20px 22px' : 0,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
