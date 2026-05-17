import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Edit2, ArrowLeft, Image, FileText, X } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import SearchableSelect from '../../components/Common/SearchableSelect';
import { api, BASE_URL } from '../../api';

const InventoryForm = () => {
  const { assets, addAsset, updateAsset, refreshAssets, suppliers, assetCategoriesTree, organizationalTree, assetStatuses, employees, hasPermission, setGlobalAlert, maintenanceScopes } = useAppContext();
  const navigate = useNavigate();
  const { id } = useParams(); // to know if we are editing
  const isEditMode = Boolean(id);

  // Route guard — runs ONCE on mount only
  useEffect(() => {
    if (isEditMode && !hasPermission('inventory_edit')) {
      setGlobalAlert({ isOpen: true, title: 'Acceso Denegado', message: 'No tienes permiso para editar activos.' });
      navigate('/inventory');
    }
    if (!isEditMode && !hasPermission('inventory_create')) {
      setGlobalAlert({ isOpen: true, title: 'Acceso Denegado', message: 'No tienes permiso para crear activos.' });
      navigate('/inventory');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initialFormState = {
    id: '', name: '', categoryId: '', category: '',
    sectionId: '', sectionName: '',
    familyId: '', family: '',
    subFamilyId: '', subFamily: '',
    brand: '', model: '',
    serial: '', loadedBy: '', entryDate: new Date().toISOString().split('T')[0],
    observations: '', supplierId: '', supplier: '', description: '',
    departmentId: '', department: '',
    area: '', acquisitionCost: '',
    location: '', status: 'Activo', assignedTo: '',
  };

  const [formData, setFormData] = useState(initialFormState);
  const [photoFile, setPhotoFile] = useState(null);
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const handler = (e) => { if (isDirty) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const handleCancel = () => {
    if (isDirty && !window.confirm('¿Está seguro de salir? Los cambios no guardados se perderán.')) return;
    navigate('/inventory');
  };

  const prepareFormData = (data) => ({
    ...initialFormState,
    ...data,
    categoryId: data.categoryId || '',
    category: data.category || '',
    sectionId: data.sectionId || '',
    sectionName: data.sectionName || '',
    familyId: data.familyId || '',
    family: data.family || '',
    subFamilyId: data.subFamilyId || '',
    subFamily: data.subFamily || '',
    departmentId: data.departmentId || '',
    department: data.department || '',
    supplierId: data.supplierId || '',
    supplier: data.supplier || '',
    assignedTo: data.assignedTo || '',
  });

  useEffect(() => {
    if (isEditMode) {
      const fetchAsset = async () => {
        const assetToEdit = assets.find(a => a.id === id);
        if (assetToEdit) {
          setFormData(prepareFormData(assetToEdit));
          if (assetToEdit.photoUrl) setPhotoPreview(assetToEdit.photoUrl.startsWith('http') ? assetToEdit.photoUrl : `${BASE_URL}${assetToEdit.photoUrl}`);
          return;
        }

        try {
          const res = await api.get(`/api/assets/${id}`);
          if (res?.ok) {
            const data = await res.json();
            setFormData(prepareFormData(data));
            if (data.photoUrl) setPhotoPreview(data.photoUrl.startsWith('http') ? data.photoUrl : `${BASE_URL}${data.photoUrl}`);
          } else {
            navigate('/inventory');
          }
        } catch (err) {
          console.error(err);
          navigate('/inventory');
        }
      };

      fetchAsset();
    }
  }, [id, assets, isEditMode, navigate]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    let savedId;
    if (isEditMode) {
      await updateAsset(formData);
      savedId = formData.id;
    } else {
      const result = await addAsset({
        ...formData,
        acquisitionDate: formData.entryDate,
        currentValue: formData.acquisitionCost,
        assignedTo: formData.assignedTo || null
      });
      savedId = result?.id;
    }

    // Upload files if selected
    if ((photoFile || invoiceFile) && savedId) {
      setUploading(true);
      const fd = new FormData();
      if (photoFile) fd.append('photo', photoFile);
      if (invoiceFile) fd.append('invoice', invoiceFile);
      await api.upload(`/api/assets/${savedId}/files`, fd);
      setUploading(false);
    }

    // Refrescar contexto para que InventoryView vea photoUrl/invoiceUrl actualizados
    await refreshAssets();
    setIsDirty(false);
    navigate('/inventory');
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>

      {/* Header with back button */}
      <div className="flex-between" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            className="btn-secondary"
            onClick={handleCancel}
            style={{ padding: '8px', borderRadius: '50%' }}
            title="Volver"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ marginBottom: '4px' }}>{isEditMode ? `Editar Activo: ${formData.id}` : 'Registrar Nuevo Activo'}</h1>
            <p className="text-muted">Desarrolla la ficha técnica completa y la asignación del activo.</p>
          </div>
        </div>
      </div>

      <div className="glass-panel form-container" style={{ overflow: 'hidden' }}>
        <form onSubmit={handleFormSubmit} onInput={() => setIsDirty(true)}>
          <div style={{ padding: '32px 40px' }}>

            {/* Información Principal */}
            <div className="form-section">
              <h3 className="form-section-title">Información Principal</h3>
              <div className="form-grid form-grid-2">
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Nombre del Activo *</label>
                  <input required type="text" className="input-control" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ej. Laptop Dell XP 15" />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Cargado Por</label>
                  <input type="text" className="input-control" value={formData.loadedBy} onChange={e => setFormData({ ...formData, loadedBy: e.target.value })} placeholder="Usuario que registra" />
                </div>
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label>Descripción del Activo</label>
                <textarea className="input-control" rows="2" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Añadir descripción detallada..."></textarea>
              </div>
            </div>

            {/* Clasificación */}
            <div className="form-section">
              <h3 className="form-section-title">Clasificación del Activo</h3>

              <div className="form-grid form-grid-2">
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Categoría *</label>
                  <SearchableSelect
                    value={formData.categoryId || ''}
                    onChange={(value, label) => {
                      setFormData(prev => ({ ...prev, categoryId: value, category: label || '', sectionId: '', sectionName: '', familyId: '', family: '', subFamilyId: '', subFamily: '' }));
                    }}
                    options={assetCategoriesTree.map(cat => ({ value: cat.id, label: cat.name }))}
                    placeholder="Seleccionar categoría..."
                  />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Sección</label>
                  <SearchableSelect
                    value={formData.sectionId || ''}
                    disabled={!formData.categoryId || (assetCategoriesTree.find(c => c.id === formData.categoryId)?.children || []).length === 0}
                    onChange={(value, label) => {
                      setFormData(prev => ({ ...prev, sectionId: value, sectionName: label || '', familyId: '', family: '', subFamilyId: '', subFamily: '' }));
                    }}
                    options={(assetCategoriesTree.find(c => c.id === formData.categoryId)?.children || []).map(s => ({ value: s.id, label: s.name }))}
                    placeholder={!formData.categoryId ? 'Primero selecciona categoría' : 'Seleccionar sección...'}
                  />
                </div>
              </div>
              <div className="form-grid form-grid-2" style={{ marginTop: '12px' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Familia</label>
                  <SearchableSelect
                    value={formData.familyId || ''}
                    disabled={!formData.sectionId || (assetCategoriesTree.find(c => c.id === formData.categoryId)?.children?.find(s => s.id === formData.sectionId)?.children || []).length === 0}
                    onChange={(value, label) => {
                      setFormData(prev => ({ ...prev, familyId: value, family: label || '', subFamilyId: '', subFamily: '' }));
                    }}
                    options={(assetCategoriesTree.find(c => c.id === formData.categoryId)?.children?.find(s => s.id === formData.sectionId)?.children || []).map(f => ({ value: f.id, label: f.name }))}
                    placeholder={!formData.sectionId ? 'Primero selecciona sección' : 'Seleccionar familia...'}
                  />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Subfamilia</label>
                  <SearchableSelect
                    value={formData.subFamilyId || ''}
                    disabled={!formData.familyId || (assetCategoriesTree.find(c => c.id === formData.categoryId)?.children?.find(s => s.id === formData.sectionId)?.children?.find(f => f.id === formData.familyId)?.children || []).length === 0}
                    onChange={(value, label) => {
                      setFormData(prev => ({ ...prev, subFamilyId: value, subFamily: label || '' }));
                    }}
                    options={(assetCategoriesTree.find(c => c.id === formData.categoryId)?.children?.find(s => s.id === formData.sectionId)?.children?.find(f => f.id === formData.familyId)?.children || []).map(sf => ({ value: sf.id, label: sf.name }))}
                    placeholder={!formData.familyId ? 'Primero selecciona familia' : 'Seleccionar subfamilia...'}
                  />
                </div>
              </div>

              {/* Scope badge: show which maintenance module this asset belongs to */}
              {formData.categoryId && (() => {
                const rootCat = assetCategoriesTree.find(c => c.id === formData.categoryId);
                if (!rootCat?.scopeId) return null;
                const scopeObj = maintenanceScopes.find(s => s.id === rootCat.scopeId);
                if (!scopeObj) return null;
                return (
                  <div style={{ padding: '8px 12px', background: `${scopeObj.color}15`, borderLeft: `3px solid ${scopeObj.color}`, borderRadius: '6px', fontSize: '0.85rem', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: scopeObj.color, display: 'inline-block' }}></span>
                    <span>Módulo: <strong style={{ color: scopeObj.color }}>{scopeObj.nombre}</strong></span>
                    <span className="text-muted" style={{ marginLeft: 'auto', fontSize: '0.78rem' }}>Los tickets de este activo se verán en ese módulo</span>
                  </div>
                );
              })()}

              <div className="form-grid form-grid-2" style={{ marginTop: '16px' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <SearchableSelect
                    label="Proveedor Asignado"
                    value={formData.supplierId || ''}
                    onChange={(value, label) => {
                      setFormData({ ...formData, supplierId: value, supplier: label || '' });
                    }}
                    options={suppliers.map(s => ({ value: s.id, label: s.name, sub: s.id }))}
                    placeholder="-- Seleccionar Proveedor --"
                  />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Marca</label>
                  <input required type="text" className="input-control" value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} placeholder="Ej. Dell" />
                </div>
              </div>
              <div className="form-grid form-grid-2" style={{ marginTop: '12px' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Modelo</label>
                  <input type="text" className="input-control" value={formData.model || ''} onChange={e => setFormData({ ...formData, model: e.target.value })} placeholder="Ej. XPS 15 9520" />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Serial</label>
                  <input type="text" className="input-control" value={formData.serial || ''} onChange={e => setFormData({ ...formData, serial: e.target.value })} placeholder="Número de serie de fábrica" />
                </div>
              </div>
            </div>

            {/* Adquisición */}
            <div className="form-section">
              <h3 className="form-section-title">Adquisición y Estado</h3>
              <div className="form-grid form-grid-3">
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Valor (USD) *</label>
                  <input required type="number" step="0.01" className="input-control" value={formData.acquisitionCost} onChange={e => setFormData({ ...formData, acquisitionCost: e.target.value })} placeholder="0.00" />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Fecha de Ingreso</label>
                  <input required type="date" className="input-control" value={formData.entryDate} onChange={e => setFormData({ ...formData, entryDate: e.target.value })} />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <SearchableSelect
                    label="Estado"
                    value={formData.status}
                    onChange={(value) => setFormData({ ...formData, status: value })}
                    options={assetStatuses.map(s => ({ value: s.name, label: s.name }))}
                    placeholder="-- Seleccionar --"
                  />
                </div>
              </div>
            </div>

            {/* Ubicación */}
            <div className="form-section">
              <h3 className="form-section-title">Estructura Organizativa (Módulo Ficheros) y Asignación</h3>
              <div className="form-grid form-grid-3">
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <SearchableSelect
                    label="Area*"
                    value={formData.location}
                    onChange={(value) => setFormData({ ...formData, location: value, departmentId: '', department: '', area: '' })}
                    options={organizationalTree.map(sede => ({ value: sede.name, label: sede.name }))}
                    placeholder="-- Seleccionar --"
                  />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <SearchableSelect
                    label="Ubicación"
                    value={formData.departmentId || ''}
                    disabled={!formData.location}
                    onChange={(value, label) => {
                      setFormData({ ...formData, departmentId: value, department: label || '', area: '' });
                    }}
                    options={(organizationalTree.find(s => s.name === formData.location)?.children || []).map(dept => ({ value: dept.id, label: dept.name }))}
                    placeholder="-- Seleccionar --"
                  />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <SearchableSelect
                    label="Departamento"
                    value={formData.area}
                    disabled={!formData.departmentId}
                    onChange={(value) => setFormData({ ...formData, area: value })}
                    options={(organizationalTree.find(s => s.name === formData.location)?.children?.find(d => d.id === formData.departmentId)?.children || []).map(a => ({ value: a.name, label: a.name }))}
                    placeholder="-- Seleccionar --"
                  />
                </div>
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <SearchableSelect
                  label="Custodio / Asignado A (Opcional)"
                  value={formData.assignedTo}
                  onChange={(value) => setFormData({ ...formData, assignedTo: value })}
                  options={employees.map(e => ({ value: `${e.nombre} ${e.apellido}`, label: `${e.apellido}, ${e.nombre}` }))}
                  placeholder="-- Sin asignar --"
                />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label>Observaciones</label>
                <textarea className="input-control" rows="2" value={formData.observations} onChange={e => setFormData({ ...formData, observations: e.target.value })}></textarea>
              </div>
            </div>

            {/* Archivos */}
            <div className="form-section">
              <h3 className="form-section-title">Archivos Adjuntos</h3>
              <div className="form-grid form-grid-2">

                {/* Foto del Activo */}
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Image size={14} /> Foto del Activo</label>
                  {photoPreview ? (
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <img src={photoPreview} alt="Vista previa" style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--glass-border)' }} />
                      <button
                        type="button"
                        onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                        style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      ><X size={14} /></button>
                    </div>
                  ) : (
                    <input type="file" accept="image/*" capture="environment" className="input-control" style={{ padding: '9px 14px' }} onChange={handlePhotoChange} />
                  )}
                  {photoPreview && !photoFile && (
                    <button type="button" className="btn-secondary" style={{ marginTop: '8px', fontSize: '0.8rem', padding: '4px 10px' }}
                      onClick={() => document.getElementById('photoInput').click()}>
                      Cambiar foto
                    </button>
                  )}
                  <input id="photoInput" type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handlePhotoChange} />
                </div>

                {/* Factura PDF */}
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FileText size={14} /> Factura de Compra (PDF)</label>
                  {isEditMode && formData.invoiceUrl && !invoiceFile ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <a href={formData.invoiceUrl?.startsWith('http') ? formData.invoiceUrl : `${BASE_URL}${formData.invoiceUrl}`} target="_blank" rel="noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'rgba(37,99,235,0.06)', border: '1px solid var(--accent-light)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--accent-primary)', textDecoration: 'none' }}>
                        <FileText size={16} /> Ver factura actual
                      </a>
                      <button type="button" className="btn-secondary" style={{ fontSize: '0.8rem', padding: '4px 10px' }}
                        onClick={() => document.getElementById('invoiceInput').click()}>
                        Reemplazar factura
                      </button>
                    </div>
                  ) : (
                    <div>
                      {invoiceFile && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'rgba(34,197,94,0.08)', border: '1px solid var(--success)', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '8px' }}>
                          <FileText size={14} style={{ color: 'var(--success)' }} />
                          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{invoiceFile.name}</span>
                          <button type="button" onClick={() => setInvoiceFile(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}><X size={14} /></button>
                        </div>
                      )}
                      <input id="invoiceInput" type="file" accept="application/pdf" className="input-control" style={{ padding: '9px 14px' }} onChange={e => setInvoiceFile(e.target.files[0] || null)} />
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>

          <div className="form-footer" style={{
            padding: '24px 40px', background: 'var(--bg-primary)',
            borderTop: '1px solid var(--glass-border)', display: 'flex',
            justifyContent: 'flex-end', gap: '16px'
          }}>
            <button type="button" className="btn-secondary" onClick={handleCancel}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={uploading}>
              {uploading ? 'Subiendo archivos...' : isEditMode ? <><Edit2 size={18} /> Actualizar Activo</> : <><Plus size={18} /> Guardar Activo</>}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};

export default InventoryForm;
