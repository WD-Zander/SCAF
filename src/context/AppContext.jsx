import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AlertModal from '../components/Common/AlertModal';
import { api } from '../api';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('scaf_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [tenantName, setTenantName] = useState('SCAF Platform');
  const [assets, setAssets] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [maintenances, setMaintenances] = useState([]);
  const [maintenancePlans, setMaintenancePlans] = useState([]);
  const [globalAlert, setGlobalAlert] = useState({ isOpen: false, title: '', message: '' });
  const [dbConnected, setDbConnected] = useState(false);

  // Árboles (Ficheros)
  const [assetCategoriesTree, setAssetCategoriesTree] = useState([]);
  const [organizationalTree, setOrganizationalTree] = useState([]);
  const [maintenanceTypesTree, setMaintenanceTypesTree] = useState([]);
  const [assetStatuses, setAssetStatuses] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [movementReasons, setMovementReasons] = useState([]);
  const [planFrequencies, setPlanFrequencies] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [maintenanceScopes, setMaintenanceScopes] = useState([]);
  const [areas, setAreas] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [infraTypes, setInfraTypes] = useState([]);
  const [infraItems, setInfraItems] = useState([]);

  useEffect(() => {
    if (currentUser) fetchGlobalState();
  }, [currentUser]);

  const fetchGlobalState = async () => {
    try {
      const [assRes, supRes, mainRes, setRes, plansRes] = await Promise.all([
        api.get('/api/assets?limit=2000'),
        api.get('/api/suppliers'),
        api.get('/api/maintenances'),
        api.get('/api/settings'),
        api.get('/api/maintenance-plans'),
      ]);

      // Si la primera llamada retornó null, significa que hubo 401 y ya se redirigió
      if (assRes === null && setRes === null) return;

      if (assRes?.ok) { const j = await assRes.json(); setAssets(Array.isArray(j) ? j : (j.data ?? [])); }
      if (supRes?.ok) setSuppliers(await supRes.json());
      if (mainRes?.ok) setMaintenances(await mainRes.json());
      if (plansRes?.ok) setMaintenancePlans(await plansRes.json());

      const [catRes, orgRes, mtTypesRes, statusRes, payRes, motRes, freqRes, empRes, scopesRes, areasRes, roomsRes, infraTypesRes, infraItemsRes] = await Promise.all([
        api.get('/api/files/categories'),
        api.get('/api/files/organization'),
        api.get('/api/files/maintenanceTypes'),
        api.get('/api/files/assetStatuses'),
        api.get('/api/files/paymentMethods'),
        api.get('/api/files/movementReasons'),
        api.get('/api/files/planFrequencies'),
        api.get('/api/employees'),
        api.get('/api/maintenance-scopes'),
        api.get('/api/areas'),
        api.get('/api/rooms'),
        api.get('/api/infrastructure/types'),
        api.get('/api/infrastructure/items'),
      ]);
      if (catRes?.ok) setAssetCategoriesTree(await catRes.json());
      if (orgRes?.ok) setOrganizationalTree(await orgRes.json());
      if (mtTypesRes?.ok) setMaintenanceTypesTree(await mtTypesRes.json());
      if (statusRes?.ok) setAssetStatuses(await statusRes.json());
      if (payRes?.ok) setPaymentMethods(await payRes.json());
      if (motRes?.ok) setMovementReasons(await motRes.json());
      if (freqRes?.ok) setPlanFrequencies(await freqRes.json());
      if (empRes?.ok) setEmployees(await empRes.json());
      if (scopesRes?.ok) setMaintenanceScopes(await scopesRes.json());
      if (areasRes?.ok) setAreas(await areasRes.json());
      if (roomsRes?.ok) setRooms(await roomsRes.json());
      if (infraTypesRes?.ok) setInfraTypes(await infraTypesRes.json());
      if (infraItemsRes?.ok) setInfraItems(await infraItemsRes.json());

      if (setRes?.ok) {
        setDbConnected(true);
        const settings = await setRes.json();
        if (settings.name || settings.NAME) setTenantName(settings.name || settings.NAME);
      } else if (setRes) {
        // El backend responde pero la BD está caída (error 500)
        setDbConnected(false);
        console.warn('Backend disponible pero BD no conecta. Status:', setRes.status);
      } else {
        // null → 401 ya manejado en api.js
        setDbConnected(false);
      }
    } catch (err) {
      setDbConnected(false);
      console.error('Error connecting to backend API:', err);
    }
  };

  // ─── Sequential ID Generator ──────────────────────────────────
  const getNextSeqId = (prefix, itemList) => {
    let maxNum = 0;
    for (const item of itemList) {
      const id = item.id || '';
      const match = id.match(new RegExp(`^${prefix}-(\\d+)$`));
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    }
    return `${prefix}-${String(maxNum + 1).padStart(3, '0')}`;
  };

  // ─── Asset Actions ─────────────────────────────────────────────
  const addAsset = async (newAsset) => {
    const newId = getNextSeqId('ACT', assets);
    const payload = { ...newAsset, id: newId };
    try {
      const res = await api.post('/api/assets', payload);
      if (!res?.ok) {
        const errData = await res?.json?.() || {};
        setGlobalAlert({ isOpen: true, title: 'Error al Guardar Activo', message: errData.error || 'Error desconocido.' });
        return null;
      }
      setAssets(prev => [...prev, payload]);
    } catch (e) {
      setGlobalAlert({ isOpen: true, title: 'Error de Red', message: e.message });
      return null;
    }
    return payload;
  };

  const updateAsset = async (updatedAsset) => {
    setAssets(assets.map(a => a.id === updatedAsset.id ? updatedAsset : a));
    await api.put(`/api/assets/${updatedAsset.id}`, updatedAsset);
  };

  const removeAsset = async (assetId) => {
    try {
      const res = await api.delete(`/api/assets/${assetId}`);
      if (!res?.ok) {
        const err = await res.json();
        setGlobalAlert({ isOpen: true, title: 'Error SQL', message: err.error });
        return;
      }
      setAssets(assets.filter(a => a.id !== assetId));
    } catch (e) { console.error(e); }
  };

  const importAssets = async (assetsList) => {
    try {
      const res = await api.post('/api/assets/batch', { assets: assetsList });
      if (!res?.ok) {
        const err = await res.json();
        setGlobalAlert({ isOpen: true, title: 'Error Importando Excel', message: err.error });
        return false;
      }
      const listRes = await api.get('/api/assets');
      if (listRes?.ok) setAssets(await listRes.json());
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  // ─── Supplier Actions ──────────────────────────────────────────
  const addSupplier = async (newSupplier) => {
    const newId = getNextSeqId('PRV', suppliers);
    const payload = { ...newSupplier, id: newId };
    setSuppliers(prev => [...prev, payload]);
    await api.post('/api/suppliers', payload);
  };

  const updateSupplier = async (updatedSupplier) => {
    setSuppliers(suppliers.map(s => s.id === updatedSupplier.id ? updatedSupplier : s));
    await api.put(`/api/suppliers/${updatedSupplier.id}`, updatedSupplier);
  };

  const removeSupplier = async (supplierId) => {
    try {
      const res = await api.delete(`/api/suppliers/${supplierId}`);
      if (!res?.ok) {
        const err = await res.json();
        setGlobalAlert({ isOpen: true, title: 'Error de Restricción SQL', message: err.error });
        return;
      }
      setSuppliers(suppliers.filter(s => s.id !== supplierId));
    } catch (e) { console.error(e); }
  };

  // ─── Maintenance Actions ───────────────────────────────────────
  const addMaintenance = async (newMaint) => {
    const newId = newMaint.id || getNextSeqId('MT', maintenances);
    const payload = { ...newMaint, id: newId };
    try {
      const resp = await api.post('/api/maintenances', payload);
      if (!resp?.ok) {
        const errData = await resp?.json?.() || {};
        const errMsg = errData.error || 'Error al crear el mantenimiento.';
        setGlobalAlert({ isOpen: true, title: 'Error al Guardar', message: errMsg });
        return null;
      }
      setMaintenances(prev => [...prev, payload]);
    } catch (e) {
      setGlobalAlert({ isOpen: true, title: 'Error de Red', message: e.message });
      return null;
    }
    return payload;
  };

  const refreshAssets = async () => {
    try {
      const res = await api.get('/api/assets?limit=2000');
      if (res?.ok) { const j = await res.json(); setAssets(Array.isArray(j) ? j : (j.data ?? [])); }
    } catch (e) { console.error(e); }
  };

  const refreshSuppliers = async () => {
    try {
      const res = await api.get('/api/suppliers');
      if (res?.ok) setSuppliers(await res.json());
    } catch (e) { console.error(e); }
  };

  const refreshFiles = async () => {
    try {
      const [catRes, orgRes, mtTypesRes, statusRes, payRes, motRes] = await Promise.all([
        api.get('/api/files/categories'),
        api.get('/api/files/organization'),
        api.get('/api/files/maintenanceTypes'),
        api.get('/api/files/assetStatuses'),
        api.get('/api/files/paymentMethods'),
        api.get('/api/files/movementReasons'),
      ]);
      if (catRes?.ok) setAssetCategoriesTree(await catRes.json());
      if (orgRes?.ok) setOrganizationalTree(await orgRes.json());
      if (mtTypesRes?.ok) setMaintenanceTypesTree(await mtTypesRes.json());
      if (statusRes?.ok) setAssetStatuses(await statusRes.json());
      if (payRes?.ok) setPaymentMethods(await payRes.json());
      if (motRes?.ok) setMovementReasons(await motRes.json());
    } catch (e) { console.error(e); }
  };

  const refreshEmployees = async () => {
    try {
      const res = await api.get('/api/employees');
      if (res?.ok) setEmployees(await res.json());
    } catch (e) { console.error(e); }
  };

  const refreshMaintenances = async () => {
    try {
      const res = await api.get('/api/maintenances');
      if (res?.ok) setMaintenances(await res.json());
    } catch (e) { console.error(e); }
  };

  const updateMaintenance = async (updated) => {
    setMaintenances(maintenances.map(m => m.id === updated.id ? updated : m));
    await api.put(`/api/maintenances/${updated.id}`, updated);
  };

  const removeMaintenance = async (id) => {
    try {
      const res = await api.delete(`/api/maintenances/${id}`);
      if (!res?.ok) {
        const err = await res.json();
        setGlobalAlert({ isOpen: true, title: 'Error SQL', message: err.error });
        return;
      }
      setMaintenances(maintenances.filter(m => m.id !== id));
    } catch (e) { console.error(e); }
  };

  // ─── Scope-aware category filter ────────────────────────────────
  const getCategoriesForScope = useCallback((scopeSlug) => {
    if (!scopeSlug) return assetCategoriesTree;
    const scopeObj = maintenanceScopes.find(s => s.slug === scopeSlug);
    if (!scopeObj) return assetCategoriesTree;
    return assetCategoriesTree.filter(root => root.scopeId === scopeObj.id);
  }, [assetCategoriesTree, maintenanceScopes]);

  // ─── Entity resolver for polymorphic scopes ────────────────────
  const getEntitiesForScope = useCallback((scopeSlug) => {
    const scope = maintenanceScopes.find(s => s.slug === scopeSlug);
    const tipoEntidad = scope?.tipoEntidad || 'activo';

    // "activo" always points to inventory assets
    if (tipoEntidad === 'activo') {
      return { type: 'activo', items: assets, label: 'Activo', labelPlural: 'Activos' };
    }

    // Dynamic infrastructure type lookup
    const infraType = infraTypes.find(t => t.slug === tipoEntidad);
    if (infraType) {
      const items = infraItems.filter(i => i.tipoSlug === tipoEntidad);
      const singular = infraType.nombre.replace(/s$/, '');
      return { type: tipoEntidad, items, label: singular, labelPlural: infraType.nombre };
    }

    // Fallback: legacy areas/rooms
    if (tipoEntidad === 'area') return { type: 'area', items: areas, label: 'Área', labelPlural: 'Áreas' };
    if (tipoEntidad === 'habitacion') return { type: 'habitacion', items: rooms, label: 'Habitación', labelPlural: 'Habitaciones' };

    return { type: tipoEntidad, items: [], label: tipoEntidad, labelPlural: tipoEntidad };
  }, [maintenanceScopes, assets, areas, rooms, infraTypes, infraItems]);

  // ─── Permission Checker ────────────────────────────────────────
  const hasPermission = useCallback((permId) => {
    if (!currentUser?.role) return false;
    const perms = currentUser.role.permissions || [];
    if (perms.includes('all')) return true;
    if (perms.includes(permId)) return true;
    return perms.some(p => p.startsWith(permId + '_'));
  }, [currentUser]);

  return (
    <AppContext.Provider value={{
      tenantName, setTenantName,
      assets, setAssets, addAsset, updateAsset, removeAsset, importAssets, refreshAssets,
      suppliers, setSuppliers, addSupplier, updateSupplier, removeSupplier, refreshSuppliers,
      refreshFiles,
      maintenances, setMaintenances, addMaintenance, updateMaintenance, removeMaintenance, refreshMaintenances,
      maintenancePlans, setMaintenancePlans,
      currentUser, setCurrentUser,
      assetCategoriesTree, setAssetCategoriesTree,
      organizationalTree, setOrganizationalTree,
      maintenanceTypesTree, setMaintenanceTypesTree,
      assetStatuses, setAssetStatuses,
      paymentMethods, setPaymentMethods,
      movementReasons, setMovementReasons,
      planFrequencies, setPlanFrequencies,
      employees, setEmployees, refreshEmployees,
      maintenanceScopes, setMaintenanceScopes,
      areas, setAreas, rooms, setRooms,
      infraTypes, setInfraTypes, infraItems, setInfraItems,
      getCategoriesForScope, getEntitiesForScope,
      getNextSeqId, setGlobalAlert,
      dbConnected, setDbConnected,
      hasPermission,
      fetchGlobalState,
    }}>
      {children}
      <AlertModal
        isOpen={globalAlert.isOpen}
        title={globalAlert.title}
        message={globalAlert.message}
        onClose={() => setGlobalAlert({ isOpen: false, title: '', message: '' })}
      />
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
