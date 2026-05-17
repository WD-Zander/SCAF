import React, { useState, useEffect } from 'react';
import { Save, Building2, Database, Plug, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import ConfirmModal from '../../components/Common/ConfirmModal';
import ImportMappings from './ImportMappings';
import { api } from '../../api';

const ConfigEmpresa = () => {
  const { tenantName, setTenantName, setGlobalAlert } = useAppContext();
  const [localName, setLocalName] = useState(tenantName);
  const [razonSocial, setRazonSocial] = useState('');
  const [nit, setNit] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [moneda, setMoneda] = useState('USD');
  const [monedaSimbolo, setMonedaSimbolo] = useState('$');
  const [diasAlerta, setDiasAlerta] = useState(15);
  const [itemsPorPagina, setItemsPorPagina] = useState(50);
  const [permitirBorrado, setPermitirBorrado] = useState(true);
  const [dbConfig, setDbConfig] = useState({ server: '', user: '', password: '', database: '' });
  const [isTesting, setIsTesting] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  // Cargar configuración desde la BD al montar
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await api.get('/api/settings');
        if (res?.ok) {
          const s = await res.json();
          setLocalName(s.name || s.Name || tenantName);
          setRazonSocial(s.nit_razon || s.razonSocial || '');
          setNit(s.nit || s.Nit || '');
          setCorreo(s.email || s.Email || '');
          setTelefono(s.phone || s.Phone || '');
          setDireccion(s.address || s.Address || '');
          setMoneda(s.currency || s.Currency || 'USD');
          setMonedaSimbolo(s.currencysymbol || s.CurrencySymbol || '$');
          setDiasAlerta(s.alertdays || s.AlertDays || 15);
          setItemsPorPagina(s.itemsperpage || s.ItemsPerPage || 50);
          setPermitirBorrado(s.allowdelete ?? s.AllowDelete ?? true);
        }
      } catch (err) {
        console.error('Error cargando configuración:', err);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    try {
      const res = await api.put('/api/settings', {
        Name: localName,
        Nit: nit,
        Email: correo,
        Phone: telefono,
        Address: direccion,
        Currency: moneda,
        CurrencySymbol: monedaSimbolo,
        AlertDays: diasAlerta,
        ItemsPerPage: itemsPorPagina,
        AllowDelete: permitirBorrado,
      });
      if (res?.ok) {
        setTenantName(localName);
        setGlobalAlert({ isOpen: true, title: 'Éxito', message: 'Configuración guardada correctamente en el sistema.' });
      } else {
        const err = await res.json();
        setGlobalAlert({ isOpen: true, title: 'Error al Guardar', message: err.error });
      }
    } catch {
      setGlobalAlert({ isOpen: true, title: 'Error de Red', message: 'No se pudo comunicar con el servidor.' });
    }
  };

  const testConnection = async () => {
    setIsTesting(true);
    try {
      const res = await api.post('/api/db/test', dbConfig);
      if (!res) { setIsTesting(false); return; }
      const data = await res.json();
      if (data.success) {
        setGlobalAlert({ isOpen: true, title: 'Conexión Exitosa', message: 'Sistema conectado adecuadamente al Servidor SQL.' });
      } else {
        setGlobalAlert({ isOpen: true, title: 'Fallo en la conexión SQL', message: data.error });
      }
    } catch {
      setGlobalAlert({ isOpen: true, title: 'Error de API', message: 'El Backend Node no responde de manera correcta.' });
    }
    setIsTesting(false);
  };

  const saveConnection = async () => {
    try {
      const res = await api.post('/api/db/save', dbConfig);
      if (!res) return;
      const data = await res.json();
      if (data.success) {
        setGlobalAlert({ isOpen: true, title: 'Datos Guardados', message: "Datos guardados con éxito en tu servidor.\nPor favor, reinicia el backend para aplicar los cambios." });
      } else {
        setGlobalAlert({ isOpen: true, title: 'Error al guardar', message: "Error: " + data.error });
      }
    } catch {
      setGlobalAlert({ isOpen: true, title: 'Aviso', message: "Error de servidor local." });
    }
  };

  const handleFactoryReset = async () => {
    setIsResetModalOpen(false);
    try {
      const res = await api.post('/api/factory-reset', {});
      const data = await res.json();
      if (res?.ok) {
        setGlobalAlert({ isOpen: true, title: 'Puesta en Marcha Completada', message: data.message + ' Refresca la página.' });
      } else {
        setGlobalAlert({ isOpen: true, title: 'Acceso Denegado', message: data.error });
      }
    } catch {
      setGlobalAlert({ isOpen: true, title: 'Error de API', message: 'Error de comunicación con el servidor.' });
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ marginBottom: '8px' }}>Configuración del Sistema SCAF</h1>
        <p className="text-muted">Personaliza la plataforma o realiza cargas masivas de datos maestros.</p>
      </div>

      <div style={{ marginBottom: '24px', display: 'flex', gap: '8px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px' }}>
        <button className={`btn ${activeTab === 'general' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none', boxShadow: 'none' }} onClick={() => setActiveTab('general')}>
          <Building2 size={18} style={{ marginRight: '8px' }} /> Empresa y Base de Datos
        </button>
        <button className={`btn ${activeTab === 'mappings' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none', boxShadow: 'none' }} onClick={() => setActiveTab('mappings')}>
          <FileSpreadsheet size={18} style={{ marginRight: '8px' }} /> Mappings de Importación
        </button>
      </div>

      {activeTab === 'general' ? (
        <>
          <div className="dashboard-grid">
            <div className="glass-panel" style={{ padding: '32px' }}>
              <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 className="text-accent" size={20} /> Información Fiscal
              </h3>
              <div className="input-group">
                <label>Nombre Comercial (Mostrado en Panel)</label>
                <input type="text" className="input-control" value={localName} onChange={(e) => setLocalName(e.target.value)} />
              </div>
              <div className="input-group">
                <label>Correo Electrónico</label>
                <input type="email" className="input-control" placeholder="empresa@ejemplo.com" value={correo} onChange={(e) => setCorreo(e.target.value)} />
              </div>
              <div className="input-group">
                <label>RUC / NIT / RFC</label>
                <input type="text" className="input-control" placeholder="Ej. 0992384723001" value={nit} onChange={(e) => setNit(e.target.value)} />
              </div>
              <div className="input-group">
                <label>Teléfono</label>
                <input type="text" className="input-control" placeholder="Ej. +593 4 123 4567" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
              </div>
              <div className="input-group">
                <label>Dirección</label>
                <input type="text" className="input-control" placeholder="Dirección de la empresa" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '32px' }}>
              <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Database className="text-secondary" size={20} /> Conexión a Base de Datos (SQL Server)
              </h3>
              <p className="text-muted" style={{ marginBottom: '16px', fontSize: '0.85rem' }}>
                Ajusta los parámetros de red para sincronizar SCAF con tu servidor local o en la nube.
              </p>
              <div className="input-group">
                <label>Punto de Enlace (Server / IP)</label>
                <input type="text" className="input-control" placeholder="Ej. 192.168.1.100 o localhost\SQLEXPRESS" value={dbConfig.server} onChange={(e) => setDbConfig({ ...dbConfig, server: e.target.value })} />
              </div>
              <div className="form-grid form-grid-2">
                <div className="input-group">
                  <label>Usuario</label>
                  <input type="text" className="input-control" placeholder="sa" value={dbConfig.user} onChange={(e) => setDbConfig({ ...dbConfig, user: e.target.value })} />
                </div>
                <div className="input-group">
                  <label>Contraseña</label>
                  <input type="password" className="input-control" placeholder="••••••••" value={dbConfig.password} onChange={(e) => setDbConfig({ ...dbConfig, password: e.target.value })} />
                </div>
              </div>
              <div className="input-group" style={{ marginBottom: '24px' }}>
                <label>Nombre de la Base de Datos</label>
                <input type="text" className="input-control" placeholder="Ej. SCAF_DB" value={dbConfig.database} onChange={(e) => setDbConfig({ ...dbConfig, database: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={testConnection} disabled={isTesting}>
                  <Plug size={18} /> {isTesting ? 'Probando...' : 'Probar Conexión'}
                </button>
                <button className="btn-primary" style={{ flex: 1, justifyContent: 'center', background: 'var(--success)' }} onClick={saveConnection}>
                  <Save size={18} /> Guardar Conexión
                </button>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button className="btn-primary" style={{ padding: '12px 32px' }} onClick={handleSave}>
              <Save size={20} /> Guardar Configuración
            </button>
          </div>

          <div style={{ marginTop: '40px', padding: '24px', border: '1px solid var(--danger)', borderRadius: '12px', background: 'rgba(220, 38, 38, 0.05)' }}>
            <h3 style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <AlertTriangle size={20} /> Zona de Peligro (Puesta en Marcha)
            </h3>
            <p className="text-muted" style={{ marginBottom: '16px' }}>
              Esta acción inicializará el software desde 0 para la puesta en marcha oficial. Se borrarán permanentemente todos los activos, mantenimientos, proveedores y auditorías de prueba (solo el Super Administrador conservará acceso).
            </p>
            <button onClick={() => setIsResetModalOpen(true)} style={{ background: 'var(--danger)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} /> Inicializar Software a 0
            </button>
          </div>
        </>
      ) : (
        <ImportMappings />
      )}

      <ConfirmModal
        isOpen={isResetModalOpen}
        title="ADVERTENCIA CRÍTICA: Inicializar de Cero"
        message="¿Estás completamente seguro? Esta acción borrará TODO el historial y los datos demo del sistema. Solo quedarán intactos los roles y tu cuenta de SuperAdmin. Esta acción no se puede deshacer."
        onConfirm={handleFactoryReset}
        onCancel={() => setIsResetModalOpen(false)}
      />
    </div>
  );
};

export default ConfigEmpresa;
