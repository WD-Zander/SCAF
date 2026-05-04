import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Upload, Plus, QrCode, Edit2, Trash2, X, Printer, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAppContext } from '../../context/AppContext';
import { api, BASE_URL } from '../../api';
import ConfirmModal from '../../components/Common/ConfirmModal';

const ITEMS_PER_PAGE = 20;

/**
 * DISEÑO DE ESCALABILIDAD:
 * - Los datos se obtienen directamente del servidor con paginación (OFFSET/FETCH NEXT).
 * - El componente no depende del estado global de assets para renderizar la tabla.
 * - La búsqueda es server-side (el filtro viaja en el query string).
 * - De esta forma, la lista escala a decenas de miles de activos sin impacto en memoria.
 * - El contexto global sigue cargando una copia ligera para los dropdowns de mantenimientos.
 */
const InventoryList = () => {
  const { removeAsset, importAssets, hasPermission } = useAppContext();
  const navigate = useNavigate();

  // ── Estado local de paginación server-side ──────────────────────
  const [rows, setRows] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loadingTable, setLoadingTable] = useState(true);
  const searchTimer = useRef(null);

  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [selectedAssetForQR, setSelectedAssetForQR] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, idToDelete: null });
  const [expandedId, setExpandedId] = useState(null);

  // ── Carga de datos desde el servidor ────────────────────────────
  const loadPage = async (page, search, sort) => {
    setLoadingTable(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: ITEMS_PER_PAGE,
        ...(search ? { search } : {}),
        ...(sort ? { sortKey: sort.key, sortDir: sort.direction } : {})
      });
      const res = await api.get(`/api/assets?${params}`);
      if (res?.ok) {
        const json = await res.json();
        const data = Array.isArray(json) ? json : (json.data ?? []);
        const total = json.total ?? data.length;
        setRows(data);
        setTotalItems(total);
        setTotalPages(Math.ceil(total / ITEMS_PER_PAGE));
      }
    } catch (e) {
      console.error('Error loading assets:', e);
    } finally {
      setLoadingTable(false);
    }
  };

  useEffect(() => {
    loadPage(currentPage, searchTerm, sortConfig);
  }, [currentPage, searchTerm, sortConfig]);

  // Debounce de búsqueda — evita un request por cada tecla
  const handleSearchInput = (val) => {
    setSearchInput(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearchTerm(val);
      setCurrentPage(1);
    }, 400);
  };

  const handleSort = (key) => {
    const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  // ── Exportar Excel (todos los activos, sin paginación) ───────────
  const handleExportExcel = async () => {
    try {
      const res = await api.get('/api/assets?limit=5000');
      if (!res?.ok) return;
      const json = await res.json();
      const data = Array.isArray(json) ? json : (json.data ?? []);
      const dataToExport = data.map(a => ({
        'Código ID': a.id, 'Nombre del Activo': a.name, 'Descripción': a.description,
        'Categoría': a.category, 'Familia': a.family, 'Subfamilia': a.subFamily,
        'Marca': a.brand, 'Modelo': a.model, 'Serial': a.serial, 'Proveedor': a.supplier,
        'Fecha Adquisición / Ingreso': a.entryDate || a.acquisitionDate,
        'Cargado Por': a.loadedBy, 'Valor Compra': Number(a.acquisitionCost) || 0,
        'Valor Actual': Number(a.currentValue) || 0, 'Estado': a.status,
        'Ubicación': a.location, 'Departamento': a.department, 'Área': a.area,
        'Asignado A': a.assignedTo || 'N/A', 'Observaciones': a.observations
      }));
      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Inventario SCAF');
      XLSX.writeFile(wb, 'Inventario_Activos.xlsx');
    } catch (e) { console.error(e); }
  };

  const fileInputRef = useRef(null);

  const handleDownloadTemplate = () => {
    const templateData = [{ 'Código ID': 'ACT-9999', 'Nombre del Activo': 'Ejemplo Servidor HP', 'Descripción': 'Servidor rack 1U', 'Categoría': 'Equipos de Cómputo', 'Familia': 'Servidores', 'Subfamilia': 'Rack', 'Marca': 'HP', 'Modelo': 'Proliant DL380', 'Serial': 'HP-SN-12345', 'Proveedor': 'Tech Solutions C.A.', 'Fecha Adquisición / Ingreso': '2026-01-01', 'Valor Compra (USD)': 2500, 'Valor Actual (USD)': 2000, 'Estado': 'ACTIVO', 'Ubicación': 'Sede Principal', 'Departamento': 'TI', 'Área': 'Data Center', 'Asignado A': 'Carlos Gestor', 'Observaciones': 'Requiere AC a 18C' }];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');
    XLSX.writeFile(wb, 'Plantilla_Importacion_Activos.xlsx');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const json = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        if (!json.length) { alert('El archivo Excel está vacío.'); return; }
        const assetsToImport = json.map(row => ({
          id: row['Código ID'] || `ACT-IMP-${Math.floor(Math.random()*10000)}`,
          name: row['Nombre del Activo'], description: row['Descripción'] || '',
          category: row['Categoría'] || '', family: row['Familia'] || '',
          subFamily: row['Subfamilia'] || '', brand: row['Marca'] || '',
          model: row['Modelo'] || '', serial: row['Serial'] || '',
          supplier: row['Proveedor'] || '',
          entryDate: row['Fecha Adquisición / Ingreso'] || new Date().toISOString().split('T')[0],
          acquisitionCost: row['Valor Compra (USD)'] || 0,
          currentValue: row['Valor Actual (USD)'] || 0,
          status: row['Estado'] || 'ACTIVO', location: row['Ubicación'] || '',
          department: row['Departamento'] || '', area: row['Área'] || '',
          assignedTo: row['Asignado A'] || '', observations: row['Observaciones'] || ''
        })).filter(a => a.name);
        if (assetsToImport.length > 0) {
          const success = await importAssets(assetsToImport);
          if (success) { alert(`${assetsToImport.length} activos importados.`); loadPage(1, searchTerm, sortConfig); setCurrentPage(1); }
        } else { alert('No se encontraron activos válidos.'); }
      } catch (err) { console.error(err); alert('Error al procesar el archivo Excel.'); }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDeleteClick = (assetId) => setConfirmModal({ isOpen: true, idToDelete: assetId });

  const confirmDelete = async () => {
    if (confirmModal.idToDelete) {
      await removeAsset(confirmModal.idToDelete);
      loadPage(currentPage, searchTerm, sortConfig);
    }
    setConfirmModal({ isOpen: false, idToDelete: null });
  };

  const handleRowClick = (e, id) => {
    if (window.innerWidth <= 1024) { setExpandedId(expandedId === id ? null : id); }
    else { navigate(`/inventory/view/${id}`); }
  };

  const statusColor = (status) => {
    if (status === 'Activo' || status === 'ACTIVO') return 'success';
    if (status === 'En Mantenimiento' || status === 'EN MANTENIMIENTO') return 'warning';
    return 'danger';
  };

  // ── Rango de páginas para el paginador ──────────────────────────
  const getPageNumbers = () => {
    const delta = 3;
    const range = [];
    for (let i = Math.max(1, currentPage - delta); i <= Math.min(totalPages, currentPage + delta); i++) {
      range.push(i);
    }
    return range;
  };

  return (
    <div style={{ position: 'relative' }}>
      <div className="no-print">
        <div className="flex-between" style={{ marginBottom: '24px' }}>
          <div>
            <h1 style={{ marginBottom: '4px' }}>Inventario de Activos</h1>
            <p className="text-muted">
              {totalItems > 0 ? `${totalItems.toLocaleString()} activos registrados` : 'Gestiona los activos de la empresa.'}
            </p>
          </div>
          <div className="flex-center gap-2">
            <button className="btn-secondary" onClick={handleDownloadTemplate} title="Descargar plantilla">Plantilla</button>
            {hasPermission('inventory') && (
              <>
                <input type="file" accept=".xlsx,.xls" style={{ display: 'none' }} ref={fileInputRef} onChange={handleFileUpload} />
                <button className="btn-secondary" onClick={() => fileInputRef.current?.click()} title="Importar Excel">
                  <Upload size={18} /> Importar
                </button>
              </>
            )}
            <button className="btn-secondary" onClick={handleExportExcel}><Download size={18} /> Exportar</button>
            {hasPermission('inventory') && (
              <button className="btn-primary" onClick={() => navigate('/inventory/new')}><Plus size={18} /> Registrar</button>
            )}
          </div>
        </div>

        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)' }}>
            <div className="input-group" style={{ margin: 0, maxWidth: '320px' }}>
              <input
                type="text"
                className="input-control"
                placeholder="Buscar por código, nombre o serial..."
                value={searchInput}
                onChange={e => handleSearchInput(e.target.value)}
              />
            </div>
          </div>

          <div className="table-container" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(37, 99, 235, 0.05)' }}>
                  <th onClick={() => handleSort('id')} style={{ cursor: 'pointer', padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>CÓDIGO <ArrowUpDown size={12} style={{ display: 'inline' }} /></th>
                  <th onClick={() => handleSort('name')} style={{ cursor: 'pointer', padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>ACTIVO <ArrowUpDown size={12} style={{ display: 'inline' }} /></th>
                  <th className="hide-mobile" onClick={() => handleSort('category')} style={{ cursor: 'pointer', padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>CATEGORÍA <ArrowUpDown size={12} style={{ display: 'inline' }} /></th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>SERIAL</th>
                  <th className="hide-mobile" style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>ESTADO</th>
                  <th className="hide-mobile" style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>CUSTODIO</th>
                  <th className="hide-mobile" style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center' }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {loadingTable ? (
                  <tr><td colSpan="7" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando...</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan="7" style={{ padding: '40px', textAlign: 'center' }}><p className="text-muted">No se encontraron activos.</p></td></tr>
                ) : rows.map(asset => (
                  <tr
                    key={asset.id}
                    onClick={e => handleRowClick(e, asset.id)}
                    style={{ borderBottom: '1px solid var(--glass-border)', transition: 'var(--transition)' }}
                    className={`table-row-hover clickable-row mobile-list-format ${expandedId === asset.id ? 'is-expanded' : ''}`}
                  >
                    <td data-label="CÓDIGO" style={{ padding: '16px 20px', fontWeight: 600 }}>{asset.id}</td>
                    <td data-label="ACTIVO" style={{ padding: '16px 20px' }}>
                      <p style={{ fontWeight: 600 }}>{asset.name}</p>
                      <p className="text-muted" style={{ fontSize: '0.75rem' }}>{asset.brand}{asset.model ? ` - ${asset.model}` : ''}</p>
                    </td>
                    <td className="hide-mobile" data-label="CATEGORÍA" style={{ padding: '16px 20px', fontSize: '0.9rem' }}>{asset.category}</td>
                    <td data-label="SERIAL" style={{ padding: '16px 20px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{asset.serial || '--'}</td>
                    <td className="hide-mobile" data-label="ESTADO" style={{ padding: '16px 20px' }}>
                      <span className={`badge ${statusColor(asset.status)}`}>{asset.status}</span>
                    </td>
                    <td className="hide-mobile" data-label="CUSTODIO" style={{ padding: '16px 20px', fontSize: '0.9rem' }}>{asset.assignedTo || '--'}</td>
                    <td className="hide-mobile" data-label="ACCIONES" style={{ padding: '16px 20px' }}>
                      <div className="flex-center gap-2" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setSelectedAssetForQR(asset)} title="Ver QR" style={{ color: 'var(--accent-primary)', padding: '6px', background: 'var(--accent-light)', borderRadius: '6px' }}>
                          <QrCode size={18} />
                        </button>
                        {hasPermission('inventory_edit') && (
                          <button onClick={() => navigate(`/inventory/edit/${asset.id}`)} title="Editar" style={{ color: 'var(--text-muted)', padding: '6px', borderRadius: '6px' }} className="hover-gray">
                            <Edit2 size={18} />
                          </button>
                        )}
                        {hasPermission('inventory_delete') && (
                          <button onClick={() => handleDeleteClick(asset.id)} title="Eliminar" style={{ color: 'var(--danger)', padding: '6px', borderRadius: '6px' }} className="hover-red">
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginador */}
          {totalPages > 1 && (
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                Mostrando página {currentPage} de {totalPages} ({totalItems.toLocaleString()} activos)
              </span>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <button className="btn-secondary" style={{ padding: '6px 10px' }} disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                  <ChevronLeft size={16} />
                </button>
                {currentPage > 4 && (
                  <>
                    <button className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.85rem' }} onClick={() => setCurrentPage(1)}>1</button>
                    <span className="text-muted" style={{ padding: '0 4px' }}>…</span>
                  </>
                )}
                {getPageNumbers().map(n => (
                  <button key={n} className={currentPage === n ? 'btn-primary' : 'btn-secondary'} style={{ padding: '4px 10px', fontSize: '0.85rem' }} onClick={() => setCurrentPage(n)}>{n}</button>
                ))}
                {currentPage < totalPages - 3 && (
                  <>
                    <span className="text-muted" style={{ padding: '0 4px' }}>…</span>
                    <button className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.85rem' }} onClick={() => setCurrentPage(totalPages)}>{totalPages}</button>
                  </>
                )}
                <button className="btn-secondary" style={{ padding: '6px 10px' }} disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Eliminar Activo"
        message={`¿Estás seguro de eliminar el activo ${confirmModal.idToDelete}? Esta acción no se puede deshacer.`}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmModal({ isOpen: false, idToDelete: null })}
      />

      {selectedAssetForQR && (
        <div className="print-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className="glass-panel animate-fade-in print-card" style={{ padding: '32px', width: '350px', position: 'relative', textAlign: 'center', background: '#fff' }}>
            <button className="no-print" onClick={() => setSelectedAssetForQR(null)} style={{ position: 'absolute', top: '16px', right: '16px', color: 'var(--text-muted)' }}><X size={24} /></button>
            <h3 style={{ marginBottom: '8px' }}>Etiqueta de Activo</h3>
            <p className="text-muted" style={{ marginBottom: '24px', fontSize: '0.9rem' }}>
              <strong>{selectedAssetForQR.name}</strong><br />ID: {selectedAssetForQR.id}<br />
              <span style={{ fontSize: '0.75rem' }}>{selectedAssetForQR.brand} - {selectedAssetForQR.model}</span>
            </p>
            <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', display: 'inline-block', border: '1px solid #e2e8f0' }}>
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.origin + '/inventory/view/' + selectedAssetForQR.id)}`} alt="QR" width={200} height={200} />
            </div>
            <button className="btn-primary no-print" style={{ marginTop: '24px', width: '100%' }} onClick={() => window.print()}>
              <Printer size={18} /> Imprimir Etiqueta
            </button>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `.table-row-hover:hover{background:rgba(37,99,235,0.02)}.hover-gray:hover{background:rgba(0,0,0,0.05)}.hover-red:hover{background:rgba(220,38,38,0.1)}@media print{body *{visibility:hidden}.sidebar,.topbar{display:none!important}.print-overlay,.print-card,.print-card *{visibility:visible}.print-overlay{position:absolute;left:0;top:0;background:transparent!important;backdrop-filter:none!important}.print-card{box-shadow:none!important;border:none!important;padding:0!important;margin:0!important}.no-print{display:none!important}}`}} />
    </div>
  );
};

export default InventoryList;
