import { Routes, Route } from "react-router-dom";
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientDetail from './pages/PatientDetail';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';
import AddPatient from "./pages/AddPatient";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import LiveMonitoring from "./pages/LiveMonitoring";
import Reports from "./pages/Reports";
import ProtectedLayout from './components/layouts/ProtectedLayout';
import RoleGuard from './components/routes/RoleGuard';
import DarkModeWatcher from './components/DarkModeWatcher';
import { useAuth } from "./context/AuthContext";

export default function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin text-blue-500 text-4xl">⏳</div>
      </div>
    );
  }

  return (
    <>
      <DarkModeWatcher />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<ProtectedLayout />}>
          <Route index element={
            <RoleGuard allowedRoles={['admin', 'doctor', 'nurse']}>
              <Dashboard />
            </RoleGuard>
          } />
          <Route path="profile" element={
            <RoleGuard allowedRoles={['admin', 'doctor', 'nurse']}>
              <Profile />
            </RoleGuard>
          } />
          <Route path="patients" element={
            <RoleGuard allowedRoles={['admin', 'doctor']}>
              <Patients />
            </RoleGuard>
          } />
          <Route path="patient/:id" element={
            <RoleGuard allowedRoles={['admin', 'doctor', 'nurse']}>
              <PatientDetail />
            </RoleGuard>
          } />
          <Route path="alerts" element={
            <RoleGuard allowedRoles={['admin', 'doctor', 'nurse']}>
              <Alerts />
            </RoleGuard>
          } />
          <Route path="live-monitoring" element={
            <RoleGuard allowedRoles={['admin', 'doctor', 'nurse']}>
              <LiveMonitoring />
            </RoleGuard>
          } />
          <Route path="reports" element={
            <RoleGuard allowedRoles={['admin', 'doctor', 'nurse']}>
              <Reports />
            </RoleGuard>
          } />
          <Route path="settings" element={
            <RoleGuard allowedRoles={['admin', 'doctor']}>
              <Settings />
            </RoleGuard>
          } />
          <Route path="add-patient" element={
            <RoleGuard allowedRoles={['admin', 'doctor']}>
              <AddPatient />
            </RoleGuard>
          } />
        </Route>
      </Routes>
    </>
  );
}
