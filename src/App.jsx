import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import ConfigEmpresa from './pages/Companies/ConfigEmpresa';
import InventoryList from './pages/Inventory/InventoryList';
import InventoryForm from './pages/Inventory/InventoryForm';
import InventoryView from './pages/Inventory/InventoryView';
import Assignments from './pages/Assignments/Assignments';
import SuppliersList from './pages/Suppliers/SuppliersList';
import SupplierForm from './pages/Suppliers/SupplierForm';
import SupplierView from './pages/Suppliers/SupplierView';
import MaintenanceList from './pages/Maintenance/MaintenanceList';
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
import Files from './pages/Files/Files';
import AuditLogs from './pages/Audit/AuditLogs';
import UsersList from './pages/Users/UsersList';
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
            <Route path="movements" element={<MovementsList />} />
            <Route path="movements/new" element={<MovementForm />} />
            <Route path="suppliers" element={<SuppliersList />} />
            <Route path="suppliers/new" element={<SupplierForm />} />
            <Route path="suppliers/edit/:id" element={<SupplierForm />} />
            <Route path="suppliers/view/:id" element={<SupplierView />} />
            {/* RUTAS DE MANTENIMIENTO */}
            <Route path="maintenances" element={<MaintenanceList />} />
            <Route path="maintenances/routines" element={<MaintenanceRoutines />} />
            <Route path="maintenances/routines/new" element={<PlanForm />} />
            <Route path="maintenances/routines/edit/:id" element={<PlanForm />} />
            <Route path="maintenances/routines/schedule/:planId" element={<ScheduleForm />} />
            <Route path="maintenances/new" element={<MaintenanceForm />} />
            <Route path="maintenances/edit/:id" element={<MaintenanceForm />} />
            <Route path="maintenances/view/:id" element={<MaintenanceView />} />
            <Route path="calendar" element={<CalendarSchedule />} />
            <Route path="maintenances/timeline" element={<MaintenanceTimeline />} />
            <Route path="maintenances/daily" element={<OperatorDailySchedule />} />
            <Route path="maintenances/planner" element={<WorkOrderPlanner />} />
            <Route path="maintenances/planner/:planId" element={<WorkOrderPlanner />} />
            <Route path="maintenances/work-orders" element={<WorkOrdersList />} />
            <Route path="maintenances/rescheduled" element={<MaintenanceRescheduled />} />
            <Route path="maintenances/planner/:planId" element={<WorkOrderPlanner />} />
            <Route path="assignments" element={<Assignments />} />
            <Route path="users" element={<UsersList />} />
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
