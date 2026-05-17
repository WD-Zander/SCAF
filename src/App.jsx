import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import ConfigEmpresa from './pages/Companies/ConfigEmpresa';
import InventoryList from './pages/Inventory/InventoryList';
import InventoryForm from './pages/Inventory/InventoryForm';
import InventoryView from './pages/Inventory/InventoryView';
import AssetHistory from './pages/Inventory/AssetHistory';
import Assignments from './pages/Assignments/Assignments';
import SuppliersList from './pages/Suppliers/SuppliersList';
import SupplierForm from './pages/Suppliers/SupplierForm';
import SupplierView from './pages/Suppliers/SupplierView';
import MaintenanceList from './pages/Maintenance/MaintenanceList';
import MaintenanceTypeSelector from './pages/Maintenance/MaintenanceTypeSelector';
import ScopeGate from './components/Maintenance/ScopeGate';
import MaintenanceForm from './pages/Maintenance/MaintenanceForm';
import MaintenanceView from './pages/Maintenance/MaintenanceView';
import MaintenanceRoutines from './pages/Maintenance/MaintenanceRoutines';
import PlanForm from './pages/Maintenance/PlanForm';
import ScheduleForm from './pages/Maintenance/ScheduleForm';
import CalendarSchedule from './pages/Maintenance/CalendarSchedule';
import MaintenanceTimeline from './pages/Maintenance/MaintenanceTimeline';
import OperatorDailySchedule from './pages/Maintenance/OperatorDailySchedule';
import WorkOrderPlanner from './pages/Maintenance/WorkOrderPlanner';
import WorkOrdersList from './pages/Maintenance/WorkOrdersList';
import MaintenanceRescheduled from './pages/Maintenance/MaintenanceRescheduled';
import MovementsList from './pages/Movements/MovementsList';
import MovementForm from './pages/Movements/MovementForm';
import EmployeesList from './pages/Employees/EmployeesList';
import EmployeeForm from './pages/Employees/EmployeeForm';
import Files from './pages/Files/Files';
import AuditLogs from './pages/Audit/AuditLogs';
import UsersList from './pages/Users/UsersList';
import RolesList from './pages/Roles/RolesList';
import InfrastructureManager from './pages/Infrastructure/InfrastructureManager';
import FormsList from './pages/Forms/FormsList';
import FormBuilder from './pages/Forms/FormBuilder';
import FormFill from './pages/Forms/FormFill';
import FormRecords from './pages/Forms/FormRecords';
import FormViewRecords from './pages/Forms/FormViewRecords';
import ReportsList from './pages/Reports/ReportsList';
import ReportBuilder from './pages/Reports/ReportBuilder';
import ReportView from './pages/Reports/ReportView';
import Scanner from './pages/Scanner/Scanner';
import { AppProvider } from './context/AppContext';

function App() {
  const isAuthenticated = !!localStorage.getItem('scaf_token');

  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          {/* Todas las rutas del Dashboard embebidas de forma transparente */}
          <Route element={isAuthenticated ? <MainLayout /> : <Navigate to="/login" />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="inventory" element={<InventoryList />} />
            <Route path="inventory/new" element={<InventoryForm />} />
            <Route path="inventory/edit/:id" element={<InventoryForm />} />
            <Route path="inventory/view/:id" element={<InventoryView />} />
            <Route path="inventory/history/:id" element={<AssetHistory />} />
            <Route path="movements" element={<MovementsList />} />
            <Route path="movements/new" element={<MovementForm />} />
            <Route path="suppliers" element={<SuppliersList />} />
            <Route path="suppliers/new" element={<SupplierForm />} />
            <Route path="suppliers/edit/:id" element={<SupplierForm />} />
            <Route path="suppliers/view/:id" element={<SupplierView />} />
            {/* RUTAS DE MANTENIMIENTO */}
            <Route path="maintenances" element={<MaintenanceTypeSelector />} />
            <Route path="maintenances/list/:scope" element={<MaintenanceList />} />
            <Route path="maintenances/routines" element={
              <ScopeGate title="Programación" subtitle="Gestión de planes y protocolos de mantenimiento.">
                <MaintenanceRoutines />
              </ScopeGate>
            } />
            <Route path="maintenances/routines/new" element={<PlanForm />} />
            <Route path="maintenances/routines/edit/:id" element={<PlanForm />} />
            <Route path="maintenances/routines/schedule/:planId" element={<ScheduleForm />} />
            <Route path="maintenances/new" element={<MaintenanceForm />} />
            <Route path="maintenances/edit/:id" element={<MaintenanceForm />} />
            <Route path="maintenances/view/:id" element={<MaintenanceView />} />
            <Route path="calendar" element={<CalendarSchedule />} />
            <Route path="maintenances/timeline" element={<MaintenanceTimeline />} />
            <Route path="maintenances/daily" element={
              <ScopeGate title="Mi Agenda Diaria" subtitle="Tareas y mantenimientos asignados para hoy.">
                <OperatorDailySchedule />
              </ScopeGate>
            } />
            <Route path="maintenances/planner" element={<WorkOrderPlanner />} />
            <Route path="maintenances/planner/:planId" element={<WorkOrderPlanner />} />
            <Route path="maintenances/work-orders" element={
              <ScopeGate title="Planes en Marcha" subtitle="Órdenes de trabajo activas y su progreso.">
                <WorkOrdersList />
              </ScopeGate>
            } />
            <Route path="maintenances/rescheduled" element={
              <ScopeGate title="Reprogramados" subtitle="Historial de mantenimientos reprogramados.">
                <MaintenanceRescheduled />
              </ScopeGate>
            } />
            {/* FORMULARIOS */}
            <Route path="forms" element={<FormsList />} />
            <Route path="forms/new" element={<FormBuilder />} />
            <Route path="forms/edit/:id" element={<FormBuilder />} />
            <Route path="forms/records" element={<FormRecords />} />
            <Route path="forms/fill/:id" element={<FormFill />} />
            <Route path="forms/view/:id" element={<FormViewRecords />} />
            {/* INFORMES */}
            <Route path="reports" element={<ReportsList />} />
            <Route path="reports/new" element={<ReportBuilder />} />
            <Route path="reports/edit/:id" element={<ReportBuilder />} />
            <Route path="reports/view/:id" element={<ReportView />} />
            {/* INFRAESTRUCTURA */}
            <Route path="infrastructure" element={<InfrastructureManager />} />
            {/* ESCANER */}
            <Route path="scanner" element={<Scanner />} />
            <Route path="employees" element={<EmployeesList />} />
            <Route path="employees/new" element={<EmployeeForm />} />
            <Route path="employees/edit/:id" element={<EmployeeForm />} />
            <Route path="assignments" element={<Assignments />} />
            <Route path="users" element={<UsersList />} />
            <Route path="roles" element={<RolesList />} />
            <Route path="files" element={<Files />} />
            <Route path="audit" element={<AuditLogs />} />
            <Route path="settings" element={<ConfigEmpresa />} />
          </Route>
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;
