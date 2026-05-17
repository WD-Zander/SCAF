import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check, X } from 'lucide-react';

/**
 * SearchableSelect - Dropdown buscable reutilizable.
 *
 * Props:
 *  - value        : valor seleccionado (string | number)
 *  - onChange      : (value, label) => void
 *  - options       : [{ value, label, sub?, icon? }]
 *  - placeholder   : texto cuando no hay selección
 *  - label         : nombre del campo (para placeholder por defecto)
 *  - disabled      : boolean
 *  - icon          : componente Lucide para el trigger
 *  - clearable     : permite limpiar selección (default true)
 *  - color         : color de acento para el borde cuando está abierto
 */
const SearchableSelect = ({
  value,
  onChange,
  options = [],
  placeholder,
  label,
  disabled,
  icon: Icon,
  clearable = true,
  color,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const term = search.toLowerCase();
    return options.filter(o =>
      o.label.toLowerCase().includes(term) ||
      (o.sub && o.sub.toLowerCase().includes(term))
    );
  }, [options, search]);

  const selectedOption = useMemo(() => options.find(o => String(o.value) === String(value)), [options, value]);

  // Focus search input when opened
  useEffect(() => {
    if (open && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 10);
    }
  }, [open]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSelect = (opt) => {
    onChange(opt.value, opt.label);
    setOpen(false);
    setSearch('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('', '');
    setSearch('');
  };

  const accentColor = color || 'var(--accent-primary)';

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Trigger */}
      <div
        onClick={() => { if (!disabled) setOpen(!open); }}
        className="input-control"
        style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          minHeight: '42px', padding: '0 12px',
          background: 'var(--bg-primary)',
          borderColor: open ? accentColor : undefined,
          transition: 'border-color 0.15s',
        }}
      >
        {Icon && <Icon size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />}
        <span style={{
          flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          color: selectedOption ? 'var(--text-main)' : 'var(--text-muted)',
          fontWeight: selectedOption ? 500 : 400,
          fontSize: '0.88rem',
        }}>
          {selectedOption?.label || placeholder || `Seleccionar ${label || ''}...`}
        </span>
        {clearable && selectedOption && !disabled && (
          <span onClick={handleClear} style={{
            display: 'flex', padding: '2px', borderRadius: '4px', cursor: 'pointer',
            color: 'var(--text-muted)',
          }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <X size={14} />
          </span>
        )}
        <ChevronDown size={16} color="var(--text-muted)" style={{
          flexShrink: 0, transition: 'transform 0.2s',
          transform: open ? 'rotate(180deg)' : 'none',
        }} />
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: 'var(--bg-secondary, #fff)',
          border: '1px solid var(--glass-border)',
          borderRadius: '10px',
          boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
          zIndex: 9999,
          maxHeight: '280px',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Search bar */}
          {options.length > 5 && (
            <div style={{
              padding: '10px 12px',
              borderBottom: '1px solid var(--glass-border)',
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'var(--bg-tertiary, #f8fafc)',
            }}>
              <Search size={15} color="var(--text-muted)" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar..."
                style={{
                  border: 'none', outline: 'none', background: 'transparent',
                  flex: 1, fontSize: '0.88rem', color: 'var(--text-main)',
                }}
              />
              {search && (
                <span onClick={() => setSearch('')} style={{ cursor: 'pointer', display: 'flex', color: 'var(--text-muted)' }}>
                  <X size={14} />
                </span>
              )}
            </div>
          )}

          {/* Options */}
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Sin resultados
              </div>
            ) : (
              filtered.map(opt => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <div
                    key={opt.value}
                    onClick={() => handleSelect(opt)}
                    style={{
                      padding: '10px 14px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '10px',
                      fontSize: '0.88rem',
                      background: isSelected ? `${accentColor}0d` : 'transparent',
                      fontWeight: isSelected ? 600 : 400,
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-tertiary, #f1f5f9)'; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {isSelected && <Check size={15} color={accentColor} style={{ flexShrink: 0 }} />}
                    {opt.icon && !isSelected && <opt.icon size={15} color="var(--text-muted)" style={{ flexShrink: 0 }} />}
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opt.label}</span>
                    {opt.sub && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>{opt.sub}</span>}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
