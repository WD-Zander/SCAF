import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Download, Upload, Plus, QrCode, Edit2, Trash2, X, Printer,
  ArrowUpDown, ChevronLeft, ChevronRight, Search, SlidersHorizontal, Activity,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAppContext } from '../../context/AppContext';
import { api, BASE_URL } from '../../api';
import { Button, Badge, Card, Field } from '../../components/UI';
import { useIsMobile } from '../../hooks/useIsMobile';
import ConfirmModal from '../../components/Common/ConfirmModal';

const ITEMS_PER_PAGE = 20;

const InventoryList = () => {
  const { removeAsset, importAssets, hasPermission } = useAppContext();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

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
  const [batchPrint, setBatchPrint] = useState({ open: false, from: '', to: '', loading: false, labelSize: '50x30', mode: 'range', category: '' });
  const [categories, setCategories] = useState([]);

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

  const handleExportExcel = async () => {
    try {
      const res = await api.get('/api/assets?limit=5000');
      if (!res?.ok) return;
      const json = await res.json();
      const data = Array.isArray(json) ? json : (json.data ?? []);
      const dataToExport = data.map(a => ({
        'Código ID': a.id, 'Nombre del Activo': a.name, 'Descripción': a.description,
        'Categoría': a.category, 'Sección': a.sectionName || '', 'Familia': a.family || '', 'Subfamilia': a.subFamily || '',
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
    if (isMobile) { setExpandedId(expandedId === id ? null : id); }
    else { navigate(`/inventory/view/${id}`); }
  };

  const loadCategories = async () => {
    try {
      const res = await api.get('/api/assets?limit=5000');
      if (!res?.ok) return;
      const json = await res.json();
      const all = Array.isArray(json) ? json : (json.data ?? []);
      const unique = [...new Set(all.map(a => a.category).filter(Boolean))].sort();
      setCategories(unique);
    } catch (e) { console.error(e); }
  };

  const handleBatchPrint = async () => {
    const { from, to, labelSize, mode, category } = batchPrint;
    if (mode === 'range' && (!from || !to)) return alert('Ingresa el rango de códigos (ej: ACT-0001 a ACT-0050)');
    if (mode === 'category' && !category) return alert('Selecciona una categoría');
    setBatchPrint(p => ({ ...p, loading: true }));
    try {
      const res = await api.get(`/api/assets?limit=5000`);
      if (!res?.ok) { alert('Error al obtener activos'); return; }
      const json = await res.json();
      const all = Array.isArray(json) ? json : (json.data ?? []);

      let filtered;
      if (mode === 'range') {
        const numFrom = parseInt(from.replace(/\D/g, ''), 10);
        const numTo = parseInt(to.replace(/\D/g, ''), 10);
        if (isNaN(numFrom) || isNaN(numTo)) { alert('Códigos inválidos'); return; }
        filtered = all.filter(a => {
          const num = parseInt((a.id || '').replace(/\D/g, ''), 10);
          return !isNaN(num) && num >= numFrom && num <= numTo;
        });
      } else {
        filtered = all.filter(a => a.category === category);
      }

      filtered.sort((a, b) => {
        const na = parseInt((a.id || '').replace(/\D/g, ''), 10) || 0;
        const nb = parseInt((b.id || '').replace(/\D/g, ''), 10) || 0;
        return na - nb;
      });

      if (filtered.length === 0) { alert('No se encontraron activos con ese filtro'); return; }

      // Label sizes in mm: [width, height]
      const sizes = { '50x30': [50, 30], '60x40': [60, 40], '70x40': [70, 40], '80x50': [80, 50] };
      const [lw, lh] = sizes[labelSize] || sizes['50x30'];

      const origin = window.location.origin;
      const labels = filtered.map(a => {
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(origin + '/inventory/view/' + a.id)}`;
        return `<div class="label"><img src="${qrUrl}" /><div class="info"><strong class="id">${a.id}</strong><span class="name">${a.name}</span><span class="extra">${a.brand || ''}${a.model ? ' · ' + a.model : ''}</span></div></div>`;
      }).join('');

      const title = mode === 'range' ? `Etiquetas ${from} - ${to}` : `Etiquetas - ${category}`;
      const html = `<!DOCTYPE html><html><head><title>${title}</title>
<style>
@page { size: ${lw}mm ${lh}mm; margin: 0; }
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,Helvetica,sans-serif}
.label{width:${lw}mm;height:${lh}mm;display:flex;align-items:center;padding:1.5mm;page-break-after:always;overflow:hidden}
.label img{width:${lh - 4}mm;height:${lh - 4}mm;flex-shrink:0;image-rendering:pixelated}
.info{margin-left:2mm;display:flex;flex-direction:column;justify-content:center;overflow:hidden;min-width:0}
.id{font-size:${lh >= 40 ? 9 : 7}pt;font-weight:700;font-family:monospace;white-space:nowrap}
.name{font-size:${lh >= 40 ? 7.5 : 6}pt;line-height:1.2;margin-top:0.5mm;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.extra{font-size:${lh >= 40 ? 6 : 5}pt;color:#555;margin-top:0.3mm;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
@media print{.label{page-break-after:always}}
</style></head><body>${labels}
<script>
var imgs=document.querySelectorAll("img"),loaded=0,total=imgs.length;
function check(){loaded++;if(loaded>=total){window.print();window.onafterprint=function(){window.close();}}}
imgs.forEach(function(i){if(i.complete)check();else{i.onload=check;i.onerror=check;}});
if(total===0)window.print();
<\/script></body></html>`;

      let iframe = document.getElementById('print-iframe');
      if (iframe) iframe.remove();
      iframe = document.createElement('iframe');
      iframe.id = 'print-iframe';
      iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:800px;height:600px;border:none;';
      document.body.appendChild(iframe);
      iframe.contentDocument.open();
      iframe.contentDocument.write(html);
      iframe.contentDocument.close();
    } catch (e) {
      console.error(e);
      alert('Error al generar etiquetas');
    } finally {
      setBatchPrint(p => ({ ...p, loading: false }));
    }
  };

  const statusTone = (status) => {
    if (status === 'Activo' || status === 'ACTIVO') return 'success';
    if (status === 'En Mantenimiento' || status === 'EN MANTENIMIENTO') return 'warning';
    return 'danger';
  };

  const getPageNumbers = () => {
    const delta = 3;
    const range = [];
    for (let i = Math.max(1, currentPage - delta); i <= Math.min(totalPages, currentPage + delta); i++) {
      range.push(i);
    }
    return range;
  };

  const statusCounts = rows.reduce((acc, a) => {
    const s = (a.status || '').toUpperCase();
    if (s === 'ACTIVO') acc.active++;
    else if (s === 'EN MANTENIMIENTO') acc.maint++;
    else acc.other++;
    return acc;
  }, { active: 0, maint: 0, other: 0 });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Inventario</div>
          <h1 style={{ margin: 0 }}>Inventario de Activos</h1>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0', fontSize: '0.9rem' }}>
            {totalItems > 0 ? (
              <>
                <strong style={{ color: 'var(--text-main)' }}>{totalItems.toLocaleString('es-ES')}</strong> activos registrados
              </>
            ) : 'Gestiona los activos de la empresa.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button variant="secondary" icon={Download} onClick={handleDownloadTemplate}>Plantilla</Button>
          {hasPermission('inventory') && (
            <>
              <input type="file" accept=".xlsx,.xls" style={{ display: 'none' }} ref={fileInputRef} onChange={handleFileUpload} />
              <Button variant="secondary" icon={Upload} onClick={() => fileInputRef.current?.click()}>Importar</Button>
            </>
          )}
          <Button variant="secondary" icon={Download} onClick={handleExportExcel}>Exportar</Button>
          <Button variant="secondary" icon={Printer} onClick={() => { setBatchPrint({ open: true, from: '', to: '', loading: false, labelSize: '50x30', mode: 'range', category: '' }); loadCategories(); }}>
            {isMobile ? 'Etiquetas' : 'Imprimir Etiquetas'}
          </Button>
          {hasPermission('inventory') && (
            <Button variant="primary" icon={Plus} onClick={() => navigate('/inventory/new')}>
              {isMobile ? 'Nuevo' : 'Registrar Activo'}
            </Button>
          )}
        </div>
      </div>

      {/* Search bar */}
      <Card padded={false} style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <Field
              icon={Search}
              value={searchInput}
              onChange={(e) => handleSearchInput(e.target.value)}
              placeholder="Buscar por código, nombre o serial..."
            />
          </div>
        </div>
      </Card>

      {/* Desktop table */}
      {!isMobile && (
        <Card padded={false} style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {[
                  { label: 'Código', key: 'id' },
                  { label: 'Activo', key: 'name' },
                  { label: 'Categoría', key: 'category' },
                  { label: 'Serial', key: null },
                  { label: 'Estado', key: null },
                  { label: 'Custodio', key: null },
                  { label: 'Acciones', key: null },
                ].map((h, i) => (
                  <th key={i}
                    onClick={h.key ? () => handleSort(h.key) : undefined}
                    style={{
                      textAlign: i === 6 ? 'center' : 'left',
                      fontSize: '0.66rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase',
                      color: 'var(--text-muted)', padding: '11px 14px',
                      background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--glass-border)',
                      cursor: h.key ? 'pointer' : 'default',
                    }}>
                    {h.label}
                    {h.key && <ArrowUpDown size={10} style={{ display: 'inline', marginLeft: 4, opacity: 0.5 }} />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loadingTable ? (
                <tr>
                  <td colSpan={7} style={{ padding: 60, textAlign: 'center' }}>
                    <Activity size={24} style={{ color: 'var(--accent-primary)', animation: 'pulse 1.5s infinite', marginBottom: 8 }} />
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>Cargando...</p>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No se encontraron activos.</td></tr>
              ) : rows.map((asset, i) => (
                <tr key={asset.id}
                  onClick={e => handleRowClick(e, asset.id)}
                  style={{
                    borderBottom: i < rows.length - 1 ? '1px solid var(--glass-border)' : 'none',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(37,99,235,0.02)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '11px 14px', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>{asset.id}</td>
                  <td style={{ padding: '11px 14px', fontSize: '0.85rem' }}>
                    <div style={{ fontWeight: 600 }}>{asset.name}</div>
                    <div className="code-font" style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: 2 }}>
                      {asset.brand}{asset.model ? ` · ${asset.model}` : ''}
                    </div>
                  </td>
                  <td style={{ padding: '11px 14px', fontSize: '0.84rem' }}>
                    <div>{asset.category}</div>
                    {(asset.sectionName || asset.family) && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        {[asset.sectionName, asset.family, asset.subFamily].filter(Boolean).join(' › ')}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '11px 14px', fontSize: '0.84rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{asset.serial || '--'}</td>
                  <td style={{ padding: '11px 14px' }}>
                    <Badge tone={statusTone(asset.status)} dot>{asset.status}</Badge>
                  </td>
                  <td style={{ padding: '11px 14px', fontSize: '0.84rem' }}>{asset.assignedTo || '--'}</td>
                  <td style={{ padding: '11px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => setSelectedAssetForQR(asset)} title="Ver QR"
                        style={{ color: 'var(--accent-primary)', padding: 6, background: 'var(--accent-light)', borderRadius: 6, border: 'none', cursor: 'pointer' }}>
                        <QrCode size={16} />
                      </button>
                      {hasPermission('inventory_edit') && (
                        <button onClick={() => navigate(`/inventory/edit/${asset.id}`)} title="Editar"
                          style={{ color: 'var(--text-muted)', padding: 6, borderRadius: 6, border: 'none', cursor: 'pointer', background: 'transparent' }}>
                          <Edit2 size={16} />
                        </button>
                      )}
                      {hasPermission('inventory_delete') && (
                        <button onClick={() => handleDeleteClick(asset.id)} title="Eliminar"
                          style={{ color: 'var(--danger)', padding: 6, borderRadius: 6, border: 'none', cursor: 'pointer', background: 'transparent' }}>
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              padding: '14px 18px', borderTop: '1px solid var(--glass-border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8,
            }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Página {currentPage} de {totalPages} ({totalItems.toLocaleString('es-ES')} activos)
              </span>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <Button variant="ghost" style={{ padding: '4px 8px' }} disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                  <ChevronLeft size={16} />
                </Button>
                {currentPage > 4 && (
                  <>
                    <Button variant="ghost" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => setCurrentPage(1)}>1</Button>
                    <span style={{ color: 'var(--text-muted)', padding: '0 4px' }}>...</span>
                  </>
                )}
                {getPageNumbers().map(n => (
                  <Button key={n} variant={currentPage === n ? 'primary' : 'ghost'} style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => setCurrentPage(n)}>{n}</Button>
                ))}
                {currentPage < totalPages - 3 && (
                  <>
                    <span style={{ color: 'var(--text-muted)', padding: '0 4px' }}>...</span>
                    <Button variant="ghost" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => setCurrentPage(totalPages)}>{totalPages}</Button>
                  </>
                )}
                <Button variant="ghost" style={{ padding: '4px 8px' }} disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Mobile cards */}
      {isMobile && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {loadingTable ? (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <Activity size={24} style={{ color: 'var(--accent-primary)', animation: 'pulse 1.5s infinite' }} />
              <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>Cargando...</p>
            </div>
          ) : rows.length === 0 ? (
            <Card padded={false} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No se encontraron activos.</Card>
          ) : rows.map((asset) => (
            <Card key={asset.id} padded={false} style={{ padding: '14px 14px 12px', cursor: 'pointer' }}
              onClick={() => navigate(`/inventory/view/${asset.id}`)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="code-font" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>{asset.id} · {asset.serial || '--'}</div>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem', lineHeight: 1.25 }}>{asset.name}</div>
                </div>
                <Badge tone={statusTone(asset.status)} dot>{asset.status}</Badge>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: 6, fontSize: '0.78rem' }}>
                <div><span style={{ color: 'var(--text-muted)' }}>Categoría · </span>{asset.category || '--'}</div>
                <div><span style={{ color: 'var(--text-muted)' }}>Custodio · </span>{asset.assignedTo || '--'}</div>
              </div>
            </Card>
          ))}

          {/* Mobile pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, padding: '12px 0' }}>
              <Button variant="ghost" style={{ padding: '6px 10px' }} disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                <ChevronLeft size={16} />
              </Button>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {currentPage} / {totalPages}
              </span>
              <Button variant="ghost" style={{ padding: '6px 10px' }} disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                <ChevronRight size={16} />
              </Button>
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Eliminar Activo"
        message={`¿Estás seguro de eliminar el activo ${confirmModal.idToDelete}? Esta acción no se puede deshacer.`}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmModal({ isOpen: false, idToDelete: null })}
      />

      {/* Batch print modal */}
      {batchPrint.open && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999,
        }}>
          <Card padded={false} style={{ padding: 32, width: 420, position: 'relative', background: '#fff', maxWidth: '95vw' }}>
            <button onClick={() => setBatchPrint(p => ({ ...p, open: false }))}
              style={{ position: 'absolute', top: 16, right: 16, color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
              <X size={24} />
            </button>
            <h3 style={{ marginBottom: 4 }}>Imprimir Etiquetas</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>
              Genera etiquetas adhesivas con QR para imprimir.
            </p>
            {/* Mode tabs */}
            <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
              {[{ key: 'range', label: 'Por Rango' }, { key: 'category', label: 'Por Categoría' }].map(tab => (
                <button key={tab.key} onClick={() => setBatchPrint(p => ({ ...p, mode: tab.key }))}
                  style={{
                    flex: 1, padding: '8px 12px', border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                    background: batchPrint.mode === tab.key ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                    color: batchPrint.mode === tab.key ? '#fff' : 'var(--text-muted)',
                  }}>
                  {tab.label}
                </button>
              ))}
            </div>
            {/* Range fields */}
            {batchPrint.mode === 'range' && (
              <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 4 }}>DESDE</label>
                  <Field
                    placeholder="ACT-0001"
                    value={batchPrint.from}
                    onChange={e => setBatchPrint(p => ({ ...p, from: e.target.value }))}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 4 }}>HASTA</label>
                  <Field
                    placeholder="ACT-0050"
                    value={batchPrint.to}
                    onChange={e => setBatchPrint(p => ({ ...p, to: e.target.value }))}
                  />
                </div>
              </div>
            )}
            {/* Category selector */}
            {batchPrint.mode === 'category' && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 4 }}>CATEGORÍA</label>
                <select
                  value={batchPrint.category}
                  onChange={e => setBatchPrint(p => ({ ...p, category: e.target.value }))}
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--glass-border)',
                    background: 'var(--bg-secondary)', color: 'var(--text-main)', fontSize: '0.88rem',
                  }}>
                  <option value="">-- Seleccionar categoría --</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 4 }}>TAMAÑO DE ETIQUETA</label>
              <select
                value={batchPrint.labelSize}
                onChange={e => setBatchPrint(p => ({ ...p, labelSize: e.target.value }))}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--glass-border)',
                  background: 'var(--bg-secondary)', color: 'var(--text-main)', fontSize: '0.88rem',
                }}>
                <option value="50x30">50 x 30 mm (estándar pequeña)</option>
                <option value="60x40">60 x 40 mm (mediana)</option>
                <option value="70x40">70 x 40 mm (mediana-grande)</option>
                <option value="80x50">80 x 50 mm (grande)</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="secondary" style={{ flex: 1 }} onClick={() => setBatchPrint(p => ({ ...p, open: false }))}>
                Cancelar
              </Button>
              <Button variant="primary" icon={Printer} style={{ flex: 1 }} disabled={batchPrint.loading}
                onClick={handleBatchPrint}>
                {batchPrint.loading ? 'Generando...' : 'Imprimir'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {selectedAssetForQR && (
        <div className="print-overlay" style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999,
        }}>
          <Card padded={false} className="print-card" style={{ padding: 32, width: 350, position: 'relative', textAlign: 'center', background: '#fff' }}>
            <button className="no-print" onClick={() => setSelectedAssetForQR(null)}
              style={{ position: 'absolute', top: 16, right: 16, color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
              <X size={24} />
            </button>
            <h3 style={{ marginBottom: 8 }}>Etiqueta de Activo</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: '0.9rem' }}>
              <strong>{selectedAssetForQR.name}</strong><br />ID: {selectedAssetForQR.id}<br />
              <span style={{ fontSize: '0.75rem' }}>{selectedAssetForQR.brand} - {selectedAssetForQR.model}</span>
            </p>
            <div style={{ background: '#fff', padding: 16, borderRadius: 12, display: 'inline-block', border: '1px solid var(--glass-border)' }}>
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.origin + '/inventory/view/' + selectedAssetForQR.id)}`} alt="QR" width={200} height={200} />
            </div>
            <Button variant="primary" icon={Printer} className="no-print"
              style={{ marginTop: 24, width: '100%' }} onClick={() => {
                const a = selectedAssetForQR;
                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.origin + '/inventory/view/' + a.id)}`;
                const html = `<!DOCTYPE html><html><head><title>Etiqueta ${a.id}</title><style>body{font-family:Arial,sans-serif;text-align:center;padding:32px;margin:0}h2{margin:0 0 4px}p{color:#555;margin:0 0 20px;font-size:14px}.qr{padding:16px;display:inline-block}small{font-size:12px;color:#888}</style></head><body><h2>Etiqueta de Activo</h2><p><strong>${a.name}</strong><br/>ID: ${a.id}<br/><small>${a.brand || ''} ${a.model ? '- ' + a.model : ''}</small></p><div class="qr"><img src="${qrUrl}" width="200" height="200" /></div></body></html>`;
                // Use hidden iframe to print
                let iframe = document.getElementById('print-iframe');
                if (iframe) iframe.remove();
                iframe = document.createElement('iframe');
                iframe.id = 'print-iframe';
                iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:400px;height:600px;border:none;';
                document.body.appendChild(iframe);
                iframe.contentDocument.open();
                iframe.contentDocument.write(html);
                iframe.contentDocument.close();
                const img = iframe.contentDocument.querySelector('img');
                const doPrint = () => {
                  iframe.contentWindow.focus();
                  iframe.contentWindow.print();
                };
                if (img) {
                  img.onload = doPrint;
                  img.onerror = doPrint;
                  // Fallback if image takes too long
                  setTimeout(doPrint, 3000);
                } else {
                  doPrint();
                }
              }}>
              Imprimir Etiqueta
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
};

export default InventoryList;
