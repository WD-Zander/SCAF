import React, { useState } from 'react';
import { FolderTree, FolderOpen, Folder, Plus, Trash2, Edit2, Check, X, FilePlus } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import ConfirmModal from '../../components/Common/ConfirmModal';
import { api } from '../../api';

const TreeNode = ({ node, level = 0, onUpdateName, onAddChild, onDeleteRequest, expandTrigger, collapseTrigger }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(node.name);
  const hasChildren = node.children && node.children.length > 0;

  const handleSaveEdit = () => {
    if (editName.trim() !== '') {
      onUpdateName(node.id, editName);
    } else {
      setEditName(node.name); // revert if empty
    }
    setIsEditing(false);
  };

  React.useEffect(() => {
    if (expandTrigger) setIsOpen(true);
  }, [expandTrigger]);

  React.useEffect(() => {
    if (collapseTrigger) setIsOpen(false);
  }, [collapseTrigger]);

  return (
    <div style={{ 
      marginLeft: level === 0 ? '0' : '24px', 
      borderLeft: level === 0 ? 'none' : '1px dashed var(--glass-border)',
      paddingLeft: level === 0 ? '0' : '16px',
      marginTop: '8px',
      position: 'relative'
    }}>
      
      {/* Node Content Header */}
      <div 
        className="flex-between hover-gray" 
        style={{ 
          padding: '8px 12px', 
          borderRadius: '8px', 
          background: 'var(--bg-secondary)',
          border: '1px solid var(--glass-border)',
          marginBottom: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
          <span 
            onClick={() => setIsOpen(!isOpen)} 
            style={{ cursor: 'pointer', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center' }}
          >
            {hasChildren ? (isOpen ? <FolderOpen size={18} /> : <Folder size={18} />) : <FilePlus size={18} />}
          </span>
          
          {isEditing ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
              <input 
                autoFocus
                type="text" 
                className="input-control" 
                style={{ padding: '4px 8px', margin: 0, minHeight: 'auto' }}
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSaveEdit()}
              />
              <button className="btn-primary" style={{ padding: '6px' }} onClick={handleSaveEdit}><Check size={14}/></button>
              <button className="btn-secondary" style={{ padding: '6px' }} onClick={() => { setIsEditing(false); setEditName(node.name); }}><X size={14}/></button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, cursor: 'pointer' }} onClick={() => setIsOpen(!isOpen)}>
              <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{node.name}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {!isEditing && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button 
              className="btn-secondary" 
              title="Añadir Sub-Nivel" 
              style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: '4px' }} 
              onClick={() => { setIsOpen(true); onAddChild(node.id); }}
            >
              <Plus size={14} /> Sub-Nivel
            </button>
            <button 
              className="btn-secondary hover-gray" 
              title="Editar Nombre" 
              style={{ padding: '6px', borderRadius: '4px', color: 'var(--text-muted)' }} 
              onClick={() => setIsEditing(true)}
            >
              <Edit2 size={14} />
            </button>
            <button 
              className="btn-secondary hover-red" 
              title="Eliminar" 
              style={{ padding: '6px', borderRadius: '4px', color: 'var(--danger)' }} 
              onClick={() => onDeleteRequest(node.id, node.name)}
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Children Container */}
      {isOpen && (
        <div className="tree-children">
          {node.children && node.children.map(child => (
            <TreeNode 
              key={child.id} 
              node={child} 
              level={level + 1} 
              onUpdateName={onUpdateName}
              onAddChild={onAddChild}
              onDeleteRequest={onDeleteRequest}
              expandTrigger={expandTrigger}
              collapseTrigger={collapseTrigger}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const Files = () => {
  const { assetCategoriesTree, setAssetCategoriesTree, organizationalTree, setOrganizationalTree, maintenanceTypesTree, setMaintenanceTypesTree, assetStatuses, setAssetStatuses, paymentMethods, setPaymentMethods, setGlobalAlert } = useAppContext();
  const [activeTab, setActiveTab] = useState('assets'); 
  const [expandTrigger, setExpandTrigger] = useState(0);
  const [collapseTrigger, setCollapseTrigger] = useState(0);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, idToDelete: null, itemName: '' });
  
  // --------------------------------------------------------------------------
  // LÓGICA DE ÁRBOLES Y DIRECTORIOS (DICCIONARIOS DE DATOS)
  // Aquí obtenemos del AppContext todas las listas planas y de árbol 
  // que ahora vienen directamente desde la Base de Datos SQL, 
  // eliminando cualquier "hardcodeo" en memoria.
  // --------------------------------------------------------------------------
  const currentTree = activeTab === 'assets' ? assetCategoriesTree 
    : activeTab === 'organization' ? organizationalTree 
    : activeTab === 'maintenanceTypes' ? maintenanceTypesTree
    : activeTab === 'assetStatuses' ? assetStatuses
    : paymentMethods;
    
  const setCurrentTree = activeTab === 'assets' ? setAssetCategoriesTree 
    : activeTab === 'organization' ? setOrganizationalTree 
    : activeTab === 'maintenanceTypes' ? setMaintenanceTypesTree
    : activeTab === 'assetStatuses' ? setAssetStatuses
    : setPaymentMethods;

  // -- Recursion Functions --
  const traverseAndUpdateName = (nodes, targetId, newName) => {
    return nodes.map(node => {
      if (node.id === targetId) return { ...node, name: newName };
      if (node.children) return { ...node, children: traverseAndUpdateName(node.children, targetId, newName) };
      return node;
    });
  };

  const traverseAndAddChild = (nodes, parentId, newNode) => {
    return nodes.map(node => {
      if (node.id === parentId) return { ...node, children: [...(node.children || []), newNode] };
      if (node.children) return { ...node, children: traverseAndAddChild(node.children, parentId, newNode) };
      return node;
    });
  };

  const traverseAndDelete = (nodes, targetId) => {
    return nodes
      .filter(n => n.id !== targetId)
      .map(node => {
        if (node.children) return { ...node, children: traverseAndDelete(node.children, targetId) };
        return node;
      });
  };

  // -- Handlers (Funciones Principales de Comunicación con el Backend) --
  
  /**
   * Mapea la pestaña activa hacia la entidad o tabla correspondiente en el backend SQL.
   * Esto garantiza que los endpoints dinámicos (/api/files/:entity) sepan qué tabla usar.
   */
  const getEntity = () => {
    if (activeTab === 'assets') return 'categories';
    if (activeTab === 'organization') return 'organization';
    if (activeTab === 'maintenanceTypes') return 'maintenanceTypes';
    if (activeTab === 'assetStatuses') return 'assetStatuses';
    if (activeTab === 'paymentMethods') return 'paymentMethods';
    return 'categories';
  };

  const handleUpdateName = async (id, newName) => {
    setCurrentTree(traverseAndUpdateName(currentTree, id, newName));
    await api.put(`/api/files/${getEntity()}/${id}`, { name: newName });
  };

  const handleAddChild = async (parentId) => {
    const newId = `${parentId.split('-')[0]}-${Date.now().toString().slice(-4)}`;
    const newNode = { id: newId, name: 'Nuevo Valor', children: [] };
    setCurrentTree(traverseAndAddChild(currentTree, parentId, newNode));

    await api.post(`/api/files/${getEntity()}`, { id: newId, name: 'Nuevo Valor', parentId: parentId });
  };

  const handleAddRoot = async () => {
    let prefix = 'CAT';
    if (activeTab === 'organization') prefix = 'ORG';
    if (activeTab === 'maintenanceTypes') prefix = 'MT';
    if (activeTab === 'assetStatuses') prefix = 'EST';
    if (activeTab === 'paymentMethods') prefix = 'FP';

    const newId = `${prefix}-${Date.now().toString().slice(-4)}`;
    const newNode = { id: newId, name: 'Nueva Clasificación', children: [] };
    setCurrentTree([...currentTree, newNode]);

    await api.post(`/api/files/${getEntity()}`, { id: newId, name: 'Nueva Clasificación', parentId: null });
  };

  const handleDeleteRequest = (id, name) => {
    setConfirmModal({ isOpen: true, idToDelete: id, itemName: name });
  };

  const confirmDelete = async () => {
    try {
      const id = confirmModal.idToDelete;
      const res = await api.delete(`/api/files/${getEntity()}/${id}`);
      if (!res?.ok) {
        const err = await res?.json();
        setGlobalAlert({ isOpen: true, title: 'Error de Integridad de Ficheros', message: `No se puede eliminar la estructura conceptual: ${err?.error}` });
      } else {
        setCurrentTree(traverseAndDelete(currentTree, id));
      }
    } catch(e) { console.error(e); }
    setConfirmModal({ isOpen: false, idToDelete: null, itemName: '' });
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px', maxWidth: '800px', margin: '0 auto' }}>
      
      <div className="flex-between" style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ marginBottom: '4px' }}>Catálogos de Selección</h1>
          <p className="text-muted">Editor visual súper simplificado para las Clasificaciones.</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '8px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px' }}>
        <button 
          className={`btn ${activeTab === 'assets' ? 'btn-primary' : 'btn-secondary'}`} 
          style={{ border: 'none', boxShadow: 'none' }}
          onClick={() => setActiveTab('assets')}
        >
          Categorías de Inventario
        </button>
        <button 
          className={`btn ${activeTab === 'organization' ? 'btn-primary' : 'btn-secondary'}`} 
          style={{ border: 'none', boxShadow: 'none' }}
          onClick={() => setActiveTab('organization')}
        >
          Organización (Sedes y Deptos)
        </button>
        <button 
          className={`btn ${activeTab === 'maintenanceTypes' ? 'btn-primary' : 'btn-secondary'}`} 
          style={{ border: 'none', boxShadow: 'none' }}
          onClick={() => setActiveTab('maintenanceTypes')}
        >
          Tipos de Mantenimiento
        </button>
        <button 
          className={`btn ${activeTab === 'assetStatuses' ? 'btn-primary' : 'btn-secondary'}`} 
          style={{ border: 'none', boxShadow: 'none' }}
          onClick={() => setActiveTab('assetStatuses')}
        >
          Estados de Activo
        </button>
        <button 
          className={`btn ${activeTab === 'paymentMethods' ? 'btn-primary' : 'btn-secondary'}`} 
          style={{ border: 'none', boxShadow: 'none' }}
          onClick={() => setActiveTab('paymentMethods')}
        >
          Formas de Pago
        </button>
      </div>

      {/* Simplified Tree UI Component */}
      <div className="glass-panel" style={{ padding: '32px' }}>
        <div className="flex-between" style={{ marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FolderTree size={20} className="text-muted" />
              Estructura Base
            </h3>
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>Añade tus valores base, luego haz clic en "Sub-Nivel" para meter opciones dentro de ellos.</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.8rem' }} onClick={() => setExpandTrigger(Date.now())}>Expandir Todo</button>
            <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.8rem' }} onClick={() => setCollapseTrigger(Date.now())}>Contraer Todo</button>
          </div>
        </div>

        {/* Root Nodes Render */}
        <div style={{ marginTop: '24px' }}>
          {currentTree.map(rootNode => (
            <TreeNode 
              key={rootNode.id} 
              node={rootNode} 
              onUpdateName={handleUpdateName}
              onAddChild={handleAddChild}
              onDeleteRequest={handleDeleteRequest}
              expandTrigger={expandTrigger}
              collapseTrigger={collapseTrigger}
            />
          ))}

          {/* Add Root Button */}
          <div style={{ marginTop: '16px', paddingLeft: '8px' }}>
            <button 
              className="btn-secondary" 
              style={{ color: 'var(--accent-primary)', border: '1px dashed var(--accent-primary)' }}
              onClick={handleAddRoot}
            >
              <Plus size={16} /> Crear {
                activeTab === 'assets' ? 'Categoría Principal' 
                : activeTab === 'organization' ? 'Sede Principal' 
                : activeTab === 'maintenanceTypes' ? 'Tipo de Mantenimiento'
                : activeTab === 'assetStatuses' ? 'Estado'
                : 'Forma de Pago'
              }
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        title="Eliminar Clasificación"
        message={`¿Estás seguro de que deseas eliminar permanentemente el ítem "${confirmModal.itemName}" y todo su sub-nodo? Si este fichero está vinculado a un inventario no se podrá borrar por seguridad.`}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmModal({ isOpen: false, idToDelete: null, itemName: '' })}
      />
    </div>
  );
};

export default Files;
