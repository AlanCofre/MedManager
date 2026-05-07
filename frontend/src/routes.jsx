import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import Dashboard from "./pages/Dashboard"; // alumno
import DashboardSecretary from "./pages/DashboardSecretary";
import DashboardAdmin from "./pages/DashboardAdmin";
import AppLogin from "./pages/AppLogin";
import AppRegistro from "./pages/AppRegistro";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ComoUsar from "./pages/ComoUsar";
import VerificarResultados from "./pages/VerificarResultados";
import AppVisualizar from "./pages/LicenciaInfo";
import LicenseDetail from "./pages/LicenseDetail";
import LicenseDetailView from "./pages/LicenseDetailView";
import AppEditProfile from "./pages/AppEditProfile";
import GenerarRevision from "./pages/GenerarRevision";
import EvaluarLicencia from "./pages/EvaluarLicencia";
import LicenciasPorRevisar from "./pages/LicenciasPorRevisar";
import LicenciasEstudiante from "./pages/LicenciasEstudiante";
import LicenciasEvaluadas from "./pages/LicenciasEvaluadas";
import LicenciaDetalle from "./pages/DetalleLicencia";
import AdminMatriculas from "./pages/Matriculas";
import AdminCursos from "./pages/Cursos";
import Matriculas from "./pages/Matriculas";
import MisMatriculas from "./pages/MisMatriculas";
import LicenciaNueva from "./pages/LicenciaNueva.jsx";
import ProfesorEntregaDetalle from "./pages/EntregaDetalle.jsx";
import AdminResumenPeriodo from "./pages/AdminResumenPeriodo";
import AdminPeriodos from "./pages/PeriodoActivo.jsx";
import ProfeLicencias from "./pages/ProfeLicencias.jsx";
import ProfesorRegularidad from "./pages/ProfeRegularidad.jsx";
import EstudianteRegularidad from "./pages/EstudianteRegularidad.jsx";
import SecretariaLicenciasAlerta from "./pages/SecretariaLicenciasAlerta";
import DashboardProfesor from "./pages/DashboardProfesor";
import NotificacionesProfesorPage from "./pages/NotificacionesProfesorPage";
import TestRoleAssign from "./pages/TestRoleAssign";
import AssignRole from "./pages/AssignRole";
export default function AppRoutes() {
  return (
    <Routes>
      {/* Ruta raíz simple - directo a login como el antiguo */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Auth */}
      <Route path="/login" element={<AppLogin />} />
      <Route path="/registro" element={<AppRegistro />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Dashboards por rol */}
      <Route path="/alumno" element={<Dashboard />} />
      <Route path="/profesor" element={<Dashboard />} />
      <Route path="/admin" element={<DashboardAdmin />} />
      <Route path="/secretaria" element={<DashboardSecretary />} />

      {/* Páginas comunes */}
      <Route path="/como-usar" element={<ComoUsar />} />
      <Route path="/verificar-resultados" element={<VerificarResultados />} />
      <Route path="/licencia-info" element={<AppVisualizar />} />
      <Route path="/generar-revision" element={<GenerarRevision />} />
      <Route path="/license-detail/:id" element={<LicenseDetail />} />
      <Route path="/license/:id" element={<LicenseDetailView />} />
      <Route path="/edit-profile" element={<AppEditProfile />} />
      <Route path="/mis-licencias" element={<LicenciasEstudiante />} />
      <Route path="/detalle-licencia/:id" element={<LicenciaDetalle />} />
      <Route path="/admin/matriculas" element={<AdminMatriculas />} />
      <Route path="/admin/cursos" element={<AdminCursos />} />
      <Route path="/estudiante/mis-matriculas" element={<MisMatriculas />} />
      <Route path="/estudiante/licencias/nueva" element={<LicenciaNueva />} />
      <Route path="/profesor/licencias/:idEntrega" element={<ProfesorEntregaDetalle />} />
      <Route path="/admin/periodos" element={<AdminPeriodos />} />
      <Route path="/profesor/licencias" element={<ProfeLicencias />} />
      <Route path="/profesor/regularidad" element={<ProfesorRegularidad />} />
      <Route path="/profesor/regularidad/:studentId" element={<EstudianteRegularidad />} />

      <Route path="/evaluar/:id" element={<EvaluarLicencia />} />
      <Route path="/licencias-por-revisar" element={<LicenciasPorRevisar />} />
      <Route path="/licencias-evaluadas/:id" element={<LicenciasEvaluadas />} />
      <Route path="/admin/periodo/resumen" element={<AdminResumenPeriodo />} />
      <Route path="/secretaria/alertas-licencias" element={<SecretariaLicenciasAlerta />} />
      <Route path="/test/role-assign" element={<TestRoleAssign />} />
      <Route path="/admin/assign-role" element={<AssignRole />} />

      <Route path="/pendientes" element={<Dashboard />} />
      <Route path="/revisadas" element={<Dashboard />} />
      <Route path="/verificadas" element={<Dashboard />} />
      <Route path="/historial" element={<AppVisualizar />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}