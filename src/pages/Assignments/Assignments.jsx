import React from 'react';
import { mockAssets } from '../../data/mockData';
import { Users, Calendar, ArrowRightLeft } from 'lucide-react';

const Assignments = () => {
  // Only get active items that are assigned
  const assignedAssets = mockAssets.filter(a => a.assignedTo);

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ marginBottom: '4px' }}>Asignaciones y Custodia</h1>
          <p className="text-muted">Control de check-in / check-out de equipos entregados a los empleados.</p>
        </div>
        <button className="btn-primary">
          <ArrowRightLeft size={18} /> Nueva Asignación
        </button>
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        
        <div className="table-container" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(15, 23, 42, 0.4)' }}>
                <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>CUSTODIO ACTUAL</th>
                <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>ACTIVO ASIGNADO</th>
                <th className="hide-mobile" style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>UBICACIÓN</th>
                <th className="hide-mobile" style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>FECHA ASIGNACIÓN</th>
                <th className="hide-mobile" style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center' }}>ACCIONES</th>
              </tr>
            </thead>
          <tbody>
            {assignedAssets.map((asset, index) => (
              <tr key={index} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'var(--transition)' }} className="table-row-hover mobile-list-format">
                <td data-label="CUSTODIO" style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '0.8rem', background: 'var(--bg-tertiary)' }}>
                      <Users size={16} />
                    </div>
                    <span style={{ fontWeight: 600 }}>{asset.assignedTo}</span>
                  </div>
                </td>
                <td data-label="ACTIVO" style={{ padding: '16px 20px' }}>
                  <span style={{ fontWeight: 500 }}>{asset.name}</span>
                  <br />
                  <span className="text-muted" style={{ fontSize: '0.8rem' }}>{asset.id}</span>
                </td>
                <td className="hide-mobile" data-label="UBICACIÓN" style={{ padding: '16px 20px', fontSize: '0.9rem' }}>{asset.location}</td>
                <td className="hide-mobile" data-label="FECHA" style={{ padding: '16px 20px', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} className="text-muted" /> 
                    {/* Mock assigned date */}
                    2023-08-10 
                  </div>
                </td>
                <td className="hide-mobile" data-label="ACCIONES" style={{ padding: '16px 20px', textAlign: 'center' }}>
                  <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Revocar (Check-in)</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html:`
        .table-row-hover:hover {
          background: rgba(255,255,255,0.03);
        }
      `}} />
    </div>
  );
};

export default Assignments;
