import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  BookOpen,
  Filter,
  Plus,
  Pencil,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Calendar as CalendarIcon,
  User as UserIcon,
  X,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import LoadingSpinner from "../components/LoadingSpinner";
import SkeletonLoader from "../components/SkeletonLoader";

// ⛳ Cambia a true si necesitas usar mocks temporalmente
const USE_MOCK = false;

/** ========= API LAYER ========= */
async function apiRequest(path, opts = {}) {
  if (USE_MOCK) return mockApi(path, opts);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  
  const response = await fetch(`${API_BASE}/api${path}`, {
    credentials: "include",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    ...opts,
  });

  if (!response.ok) {
    let errorMessage = "Error en la solicitud";
    try {
      const errorData = await response.json();
      errorMessage = errorData.mensaje || errorMessage;
    } catch {
      errorMessage = await response.text() || `Error ${response.status}`;
    }
    
    const err = new Error(errorMessage);
    err.status = response.status;
    throw err;
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const data = await response.json();
    // Manejar diferentes formatos de respuesta del backend
    return data.data !== undefined ? data.data : data;
  }
  
  return response.blob();
}

const api = {
  // Obtener periodos académicos
  getPeriodos: () => apiRequest("/periodos"),
  
  // Obtener profesores (usuarios con rol profesor)
  getProfesores: () => apiRequest("/admin/profesores"),
  
  // Obtener cursos con filtros
  getCursos: ({ periodoId, profesorId }) => {
    const params = new URLSearchParams();
    if (periodoId) params.set("id_periodo", periodoId);
    if (profesorId) params.set("id_profesor", profesorId);
    const queryString = params.toString();
    return apiRequest(`/cursos${queryString ? "?" + queryString : ""}`);
  },
  
  // Crear nuevo curso
  createCurso: (payload) =>
    apiRequest("/cursos", { 
      method: "POST", 
      body: JSON.stringify(payload) 
    }),
  
  // Actualizar curso existente
  updateCurso: (id, payload) =>
    apiRequest(`/cursos/${id}`, { 
      method: "PUT", 
      body: JSON.stringify(payload) 
    }),
  
  // Eliminar curso
  deleteCurso: (id) => 
    apiRequest(`/cursos/${id}`, { 
      method: "DELETE" 
    }),
};

// ======= MOCKS CON DATOS DE TU BD REAL =======
async function mockApi(path, opts = {}) {
  await new Promise((r) => setTimeout(r, 350));
  
  
  const DB = window.__COURSES_MOCK__;
  
  // GET /periodos
  if (path === "/periodos") return DB.periodos;
  
  // GET /admin/profesores
  if (path === "/admin/profesores") return DB.profesores;
  
  // GET /cursos
  if (path.startsWith("/cursos") && (!opts.method || opts.method === "GET")) {
    const url = new URL("http://x" + path);
    const id_periodo = url.searchParams.get("id_periodo");
    const id_profesor = url.searchParams.get("id_profesor");
    
    let rows = DB.cursos;
    if (id_periodo) rows = rows.filter(c => c.id_periodo == id_periodo);
    if (id_profesor) rows = rows.filter(c => c.id_usuario == id_profesor);
    
    return rows;
  }
  
  // POST /cursos
  if (path === "/cursos" && opts.method === "POST") {
    const body = JSON.parse(opts.body || "{}");
    const { codigo, nombre_curso, seccion, semestre, id_periodo, id_usuario } = body;
    
    if (!codigo || !nombre_curso || !seccion || !semestre || !id_periodo || !id_usuario) {
      const e = new Error("Faltan datos obligatorios");
      e.status = 422;
      throw e;
    }
    
    const exists = DB.cursos.some(c => 
      c.codigo === codigo && 
      c.seccion == seccion && 
      c.id_periodo == id_periodo
    );
    
    if (exists) {
      const e = new Error("Ya existe un curso con ese código, sección y período");
      e.status = 409;
      throw e;
    }
    
    const newCourse = {
      id_curso: DB.seq++,
      codigo,
      nombre_curso,
      seccion: Number(seccion),
      semestre: Number(semestre),
      id_periodo: Number(id_periodo),
      id_usuario: Number(id_usuario),
      usuario: DB.profesores.find(p => p.id_usuario == id_usuario),
      periodo: DB.periodos.find(p => p.id_periodo == id_periodo)
    };
    
    DB.cursos.push(newCourse);
    return newCourse;
  }
  
  // PUT /cursos/:id
  if (path.startsWith("/cursos/") && opts.method === "PUT") {
    const id = path.split("/").pop();
    const body = JSON.parse(opts.body || "{}");
    const { codigo, nombre_curso, seccion, semestre, id_periodo, id_usuario } = body;
    
    const index = DB.cursos.findIndex(c => c.id_curso == id);
    if (index === -1) {
      const e = new Error("Curso no encontrado");
      e.status = 404;
      throw e;
    }
    
    const exists = DB.cursos.some(c => 
      c.id_curso != id &&
      c.codigo === codigo && 
      c.seccion == seccion && 
      c.id_periodo == id_periodo
    );
    
    if (exists) {
      const e = new Error("Ya existe un curso con ese código, sección y período");
      e.status = 409;
      throw e;
    }
    
    DB.cursos[index] = {
      ...DB.cursos[index],
      codigo,
      nombre_curso,
      seccion: Number(seccion),
      semestre: Number(semestre),
      id_periodo: Number(id_periodo),
      id_usuario: Number(id_usuario),
      usuario: DB.profesores.find(p => p.id_usuario == id_usuario),
      periodo: DB.periodos.find(p => p.id_periodo == id_periodo)
    };
    
    return DB.cursos[index];
  }
  
  // DELETE /cursos/:id
  if (path.startsWith("/cursos/") && opts.method === "DELETE") {
    const id = path.split("/").pop();
    const index = DB.cursos.findIndex(c => c.id_curso == id);
    
    if (index === -1) {
      const e = new Error("Curso no encontrado");
      e.status = 404;
      throw e;
    }
    
    DB.cursos.splice(index, 1);
    return { ok: true };
  }
  
  const e = new Error("Ruta no implementada");
  e.status = 501;
  throw e;
}

// ======= UI COMPONENTS =======
function Toast({ toast, onClose }) {
  const { t } = useTranslation();
  if (!toast) return null;
  const base =
    toast.type === "error"
      ? "bg-red-50 border-red-200 text-red-800"
      : "bg-green-50 border-green-200 text-green-800";
  const Icon = toast.type === "error" ? AlertCircle : CheckCircle2;
  return (
    <div className="fixed bottom-5 right-5 z-50">
      <div className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm shadow-lg ${base}`}>
        <Icon className="h-5 w-5 mt-0.5" />
        <div className="max-w-xs">{toast.message}</div>
        <button onClick={onClose} className="ml-2 text-xs underline decoration-dotted">
          {t("toast.close")}
        </button>
      </div>
    </div>
  );
}

function Modal({ open, title, children, onClose }) {
  const { t } = useTranslation();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900 text-sm flex items-center gap-1"
          >
            <X size={16} /> {t("btn.close")}
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function ConfirmDialog({
  open,
  title,
  message,
  onCancel,
  onConfirm,
  confirmLabel,
}) {
  const { t } = useTranslation();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 bg-gradient-to-r from-red-50 to-rose-50 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">{title}</h3>
          <button
            onClick={onCancel}
            className="text-gray-600 hover:text-gray-900 text-sm flex items-center gap-1"
          >
            <X size={16} /> {t("btn.close")}
          </button>
        </div>
        <div className="p-5 text-sm text-gray-700">{message}</div>
        <div className="px-5 pb-5 flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-all shadow-sm"
          >
            {t("btn.cancel")}
          </button>
          <button
            onClick={onConfirm}
            className="inline-flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-all shadow-sm"
          >
            <Trash2 className="h-4 w-4" />
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============= MAIN COMPONENT =============
export default function AdminCursos() {
  const { t } = useTranslation();

  const [periodos, setPeriodos] = useState([]);
  const [profesores, setProfesores] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Filtros
  const [periodoId, setPeriodoId] = useState("");
  const [profesorId, setProfesorId] = useState("");

  // Modal form
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    codigo: "",
    nombre_curso: "",
    seccion: "",
    semestre: 1,
    id_periodo: "",
    id_usuario: "",
  });
  const [saving, setSaving] = useState(false);

  // Eliminar
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  // Toasts
  const [toast, setToast] = useState(null);
  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3200);
  };

  // En el useEffect que carga datos iniciales:
  useEffect(() => {
    let alive = true;
    
    const loadInitialData = async () => {
      try {
        setLoadingInitial(true);
        
        const [periodosData, profesoresData] = await Promise.all([
          api.getPeriodos(),
          api.getProfesores()
        ]);
        
        if (!alive) return;
        
        console.log('📊 Periodos recibidos:', periodosData);
        console.log('👨‍🏫 Profesores recibidos:', profesoresData);
        
        const safePeriodos = Array.isArray(periodosData) ? periodosData : [];
        const safeProfesores = Array.isArray(profesoresData) ? profesoresData : [];
        
        setPeriodos(safePeriodos);
        setProfesores(safeProfesores);
        
        // CORREGIDO: Seleccionar el periodo 1 por defecto (donde están los cursos)
        if (safePeriodos.length > 0) {
          // Buscar el periodo con ID 1, o el primero si no existe
          const periodoDefault = safePeriodos.find(p => p.id_periodo === 1) || safePeriodos[0];
          setPeriodoId(String(periodoDefault.id_periodo));
        }
        
      } catch (error) {
        console.error('❌ Error cargando datos iniciales:', error);
        showToast("error", "No se pudieron cargar periodos/profesores.");
        setPeriodos([]);
        setProfesores([]);
      } finally {
        if (alive) setLoadingInitial(false);
      }
    };

    loadInitialData();
    
    return () => {
      alive = false;
    };
  }, []);

  // Cargar cursos según filtros con DEBUG
  useEffect(() => {
    let alive = true;
    
    const loadCursos = async () => {
      if (loadingInitial) {
        return;
      }
      
      setLoadingList(true);
      
      try {
        const cursosData = await api.getCursos({ 
          periodoId, 
          profesorId 
        });
        
        if (!alive) return;
        
        // Asegurarse de que los cursos sean un array
        const safeCursos = Array.isArray(cursosData) ? cursosData : [];
        setCursos(safeCursos);
        
        if (safeCursos.length === 0) {
        }
      } catch (error) {
        showToast("error", "No se pudo cargar la oferta de cursos.");
        setCursos([]);
      } finally {
        if (alive) setLoadingList(false);
      }
    };

    loadCursos();
    
    return () => {
      alive = false;
    };
  }, [periodoId, profesorId, loadingInitial]);

  // CORREGIDO: Reset form - manejo correcto de valores
  const resetForm = (preset = {}) => {
    setForm({
      codigo: preset.codigo || "",
      nombre_curso: preset.nombre_curso || "",
      seccion: preset.seccion !== undefined ? String(preset.seccion) : "",
      semestre: preset.semestre || 1,
      id_periodo: preset.periodo?.id_periodo || preset.id_periodo || "", // CORREGIDO: usar periodo.id_periodo
      id_usuario: preset.profesor?.id_usuario || preset.id_usuario || "", // CORREGIDO: usar profesor.id_usuario
    });
};

  const openCreate = () => {
    setEditing(null);
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (curso) => {
    setEditing(curso);
    resetForm(curso);
    setModalOpen(true);
  };



  // CORREGIDO: Función onChange mejorada
  const onChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "semestre" || name === "seccion") {
      setForm((f) => ({ 
        ...f, 
        [name]: value === "" ? "" : Number(value) 
      }));
    } else if (name === "id_periodo" || name === "id_usuario") {
      setForm((f) => ({ 
        ...f, 
        [name]: value === "" ? "" : Number(value) 
      }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  // CORREGIDO: Validación mejorada
  const canSave =
    form.codigo.trim() &&
    form.nombre_curso.trim() &&
    form.seccion !== "" && // Sección puede ser 0
    Number(form.semestre) >= 1 &&
    Number(form.semestre) <= 10 &&
    form.id_periodo && // Estos deben ser truthy (no vacíos)
    form.id_usuario;   // Estos deben ser truthy (no vacíos)

  // CORREGIR la función handleSave:
  const handleSave = async (ev) => {
    ev?.preventDefault();
    if (!canSave || saving) return;
    setSaving(true);

    const payload = {
      codigo: form.codigo.trim(),
      nombre_curso: form.nombre_curso.trim(),
      seccion: Number(form.seccion),
      semestre: Number(form.semestre),
      id_periodo: Number(form.id_periodo),
      id_usuario: Number(form.id_usuario),
    };

    try {
      if (editing) {
        const updated = await api.updateCurso(editing.id_curso, payload);
        // En lugar de actualizar solo el curso editado, recargamos todos los cursos
        // para asegurar que tenemos las relaciones actualizadas
        const cursosActualizados = await api.getCursos({ periodoId, profesorId });
        setCursos(cursosActualizados);
        showToast("success", "Curso actualizado correctamente.");
      } else {
        const created = await api.createCurso(payload);
        // Recargar cursos después de crear uno nuevo
        const cursosActualizados = await api.getCursos({ periodoId, profesorId });
        setCursos(cursosActualizados);
        showToast("success", "Curso creado correctamente.");
      }
      setModalOpen(false);
      setEditing(null);
    } catch (error) {
      console.error('❌ Error guardando curso:', error);
      if (error.status === 409) {
        showToast("error", "Ya existe un curso con ese código, sección y período.");
      } else if (error.status === 422) {
        showToast("error", "Datos inválidos: verifica que todos los campos sean correctos.");
      } else {
        showToast("error", error.message || "No se pudo guardar el curso.");
      }
    } finally {
      setSaving(false);
    }
  };
  // Eliminar curso
  const askDelete = (curso) => {
    setToDelete(curso);
    setConfirmOpen(true);
  };

  const doDelete = async () => {
    const curso = toDelete;
    if (!curso) return;
    
    setConfirmOpen(false);
    setToDelete(null);
    
    // Optimistic update
    const snapshot = [...cursos];
    setCursos((prev) => prev.filter((c) => c.id_curso !== curso.id_curso));
    
    try {
      await api.deleteCurso(curso.id_curso);
      showToast("success", "Curso eliminado correctamente.");
    } catch (error) {
      // Revertir en caso de error
      setCursos(snapshot);
      if (error.status === 400) {
        showToast("error", "No se puede eliminar el curso porque tiene matrículas asociadas.");
      } else {
        showToast("error", error.message || "Error al eliminar el curso.");
      }
    }
  };

  const filteredCount = cursos.length;

  if (loadingList) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100 dark:bg-app dark:bg-none">
        <LoadingSpinner size="large" text="Cargando cursos..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 dark:bg-app dark:bg-none">
      <Navbar />

      <main className="flex-1 w-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <BookOpen className="h-7 w-7 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                    {t("adminCursos.title")}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {t("adminCursos.subtitle")}
                  </p>
                </div>
              </div>

              {/* Filtros - CORREGIDOS */}
              <div className="mt-4 grid grid-cols-12 gap-3 items-end">
                {/* Periodo */}
                <div className="col-span-12 md:col-span-4">
                  <label htmlFor="periodo" className="block text-xs font-medium text-gray-600 mb-1">
                    {t("adminCursos.filters.period")}
                  </label>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-gray-500" />
                    <select
                      id="periodo"
                      value={periodoId}
                      onChange={(e) => {
                        setPeriodoId(e.target.value);
                      }}
                      className="w-full border border-gray-200 bg-white px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#048FD4]"
                    >
                      <option value="">Todos los periodos</option>
                      {periodos.map((p) => (
                        <option key={p.id_periodo} value={String(p.id_periodo)}>
                          {p.codigo} {p.activo ? "(Activo)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {periodos.length} periodo(s) cargado(s)
                  </div>
                </div>

                {/* Profesor */}
                <div className="col-span-12 md:col-span-4">
                  <label htmlFor="profesor" className="block text-xs font-medium text-gray-600 mb-1">
                    {t("adminCursos.filters.professor")}
                  </label>
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-5 w-5 text-gray-500" />
                    <select
                      id="profesor"
                      value={profesorId}
                      onChange={(e) => {
                        setProfesorId(e.target.value);
                      }}
                      className="w-full border border-gray-200 bg-white px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#048FD4]"
                    >
                      <option value="">Todos los profesores</option>
                      {profesores.map((p) => (
                        <option key={p.id_usuario} value={String(p.id_usuario)}>
                          {p.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {profesores.length} profesor(es) cargado(s)
                  </div>
                </div>

                {/* Acciones y contador */}
                <div className="col-span-12 md:col-span-4">
                  <div className="flex flex-col md:flex-row items-stretch md:items-end gap-2 md:justify-end">
                    <div className="flex items-center justify-between md:justify-end gap-2">
                      <div className="inline-flex items-center text-gray-600 text-sm px-3 py-2">
                        <Filter size={16} className="mr-2" />
                        {t("adminCursos.filters.results", { count: filteredCount })}
                      </div>
                      <button
                        onClick={openCreate}
                        disabled={periodos.length === 0 || profesores.length === 0}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="h-4 w-4" />
                        {t("adminCursos.actions.create")}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de cursos - CORREGIDO: mostrar profesor correctamente */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {loadingList ? (
              <div className="flex items-center justify-center py-16 text-gray-600">
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                {t("adminCursos.list.loading")}
              </div>
            ) : cursos.length === 0 ? (
              <div className="text-center text-gray-500 text-sm py-16">
                {periodos.length === 0 
                  ? "No hay periodos académicos configurados. Contacta al administrador."
                  : profesores.length === 0
                  ? "No hay profesores disponibles para asignar cursos."
                  : "No hay cursos para los filtros seleccionados."
                }
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        {t("adminCursos.table.code")}
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        {t("adminCursos.table.name")}
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        {t("adminCursos.table.section")}
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        {t("adminCursos.table.semester")}
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        {t("adminCursos.table.period")}
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        {t("adminCursos.table.professor")}
                      </th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        {t("adminCursos.table.action")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {cursos.map((curso) => (
                      <tr key={curso.id_curso} className="hover:bg-blue-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          {curso.codigo}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-800">{curso.nombre_curso}</td>
                        <td className="px-6 py-4 text-sm text-gray-800">{curso.seccion}</td>
                        <td className="px-6 py-4 text-sm text-gray-800">{curso.semestre}</td>
                        <td className="px-6 py-4 text-sm text-gray-800">
                          {curso.periodo?.codigo || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-800">
                          {curso.Usuario?.nombre || "No asignado"}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center gap-2 justify-center">
                            <button
                              onClick={() => openEdit(curso)}
                              className="inline-flex items-center gap-2 px-3 py-2 bg-white hover:bg-blue-50 text-blue-700 text-sm font-medium rounded-lg border border-blue-200 transition-all shadow-sm"
                            >
                              <Pencil className="h-4 w-4" />
                              {t("adminCursos.actions.edit")}
                            </button>
                            <button
                              onClick={() => askDelete(curso)}
                              className="inline-flex items-center gap-2 px-3 py-2 bg-white hover:bg-red-50 text-red-600 text-sm font-medium rounded-lg border border-red-200 transition-all shadow-sm"
                            >
                              <Trash2 className="h-4 w-4" />
                              {t("adminCursos.actions.delete")}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal Crear/Editar - CORREGIDO: combobox funcionando */}
        <Modal
          open={modalOpen}
          title={
            editing
              ? t("adminCursos.modal.editTitle")
              : t("adminCursos.modal.createTitle")
          }
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
        >
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Código *</label>
              <input
                name="codigo"
                value={form.codigo}
                onChange={onChange}
                placeholder={t("adminCursos.modal.fields.codePlaceholder")}
                className="w-full border border-gray-200 bg-white px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#048FD4]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
              <input
                name="nombre_curso"
                value={form.nombre_curso}
                onChange={onChange}
                placeholder={t("adminCursos.modal.fields.namePlaceholder")}
                className="w-full border border-gray-200 bg-white px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#048FD4]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Sección *</label>
              <input
                type="number"
                min="1"
                max="999"
                name="seccion"
                value={form.seccion}
                onChange={onChange}
                placeholder="1"
                className="w-full border border-gray-200 bg-white px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#048FD4]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Semestre (1-10) *</label>
              <input
                type="number"
                min={1}
                max={10}
                name="semestre"
                value={form.semestre}
                onChange={onChange}
                className="w-full border border-gray-200 bg-white px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#048FD4]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Periodo *</label>
              <select
                name="id_periodo"
                value={form.id_periodo}
                onChange={onChange}
                className="w-full border border-gray-200 bg-white px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#048FD4]"
                required
              >
                <option value="">Selecciona un periodo</option>
                {periodos.map((p) => (
                  <option key={p.id_periodo} value={p.id_periodo}>
                    {p.codigo} {p.activo ? "(Activo)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Profesor *</label>
              <select
                name="id_usuario"
                value={form.id_usuario}
                onChange={onChange}
                className="w-full border border-gray-200 bg-white px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#048FD4]"
                required
              >
                <option value="">Selecciona un profesor</option>
                {profesores.map((p) => (
                  <option key={p.id_usuario} value={p.id_usuario}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setModalOpen(false);
                  setEditing(null);
                }}
                className="px-3 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-all shadow-sm"
              >
                {t("btn.cancel")}
              </button>
              <button
                type="submit"
                disabled={!canSave || saving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing
                  ? t("adminCursos.modal.saveChanges")
                  : t("adminCursos.modal.create")}
              </button>
            </div>

            <div className="md:col-span-2 text-xs text-gray-500 pt-1">
              * Campos obligatorios. No se permite repetir <span className="font-semibold">Código + Sección</span> en el mismo <span className="font-semibold">Periodo</span>.
            </div>
          </form>
        </Modal>

        {/* Confirmación eliminar */}
        <ConfirmDialog
          open={confirmOpen}
          title={t("adminCursos.confirm.title")}
          message={t("adminCursos.confirm.message")}
          onCancel={() => {
            setConfirmOpen(false);
            setToDelete(null);
          }}
          onConfirm={doDelete}
          confirmLabel={t("adminCursos.confirm.confirm")}
        />
      </main>

      <Toast toast={toast} onClose={() => setToast(null)} />
        
      <Footer />
    </div>
  );
}