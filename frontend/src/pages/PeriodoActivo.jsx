import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { Calendar, CheckCircle2, XCircle, AlertTriangle, Loader2, Plus } from "lucide-react";

// =============================== API REAL ===============================
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

async function apiRequest(path, opts = {}) {
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
    return data.data !== undefined ? data.data : data;
  }
  
  return response.blob();
}

// Obtener todos los periodos
async function getPeriodos() {
  return apiRequest("/periodos");
}

// Obtener periodo activo actual
async function getPeriodoActivo() {
  return apiRequest("/periodos/activo");
}

// Activar un periodo (esto automáticamente desactiva los demás según tu backend)
async function activarPeriodo(id) {
  return apiRequest(`/periodos/${id}/activar`, {
    method: "PATCH"
  });
}

// Crear un nuevo periodo
async function crearPeriodo(data) {
  return apiRequest("/periodos", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// =============================== TOAST ===============================
function Toast({ kind = "error", title, desc, onClose }) {
  const palette =
    kind === "success"
      ? "bg-green-50 border-green-200 text-green-800"
      : "bg-red-50 border-red-200 text-red-800";
  const Icon = kind === "success" ? CheckCircle2 : XCircle;
  return (
    <div className={`fixed bottom-6 right-6 z-50 max-w-sm rounded-xl border shadow-lg ${palette}`}>
      <div className="p-4 flex gap-3">
        <Icon className="h-5 w-5 mt-0.5" />
        <div className="flex-1">
          <div className="font-semibold">{title}</div>
          {desc && <div className="text-sm mt-0.5">{desc}</div>}
        </div>
        <button onClick={onClose} className="text-sm opacity-70 hover:opacity-100" aria-label="Cerrar">
          ✕
        </button>
      </div>
    </div>
  );
}

// =============================== MODAL ===============================
function ConfirmModal({ open, title, message, confirmLabel = "Confirmar", cancelLabel = "Cancelar", onConfirm, onCancel, loading = false }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-gray-600 mt-2">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================== MODAL CREAR PERIODO ===============================
function CreatePeriodoModal({ open, onClose, onSuccess }) {
  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const codigoRegex = /^\d{4}-[12]$/;
    if (!codigoRegex.test(codigo)) {
      setError("Formato inválido. Use AÑO-SEMESTRE (ej: 2025-1)");
      return;
    }
    setLoading(true);
    try {
      await crearPeriodo({ codigo });
      onSuccess(codigo);
      setCodigo("");
    } catch (e) {
      setError(e.message || "Error al crear el periodo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-surface w-full max-w-md rounded-2xl shadow-xl border border-gray-100 dark:border-app p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Crear Nuevo Periodo</h3>
        <p className="text-sm text-gray-600 dark:text-muted mt-1">
          Ingresa el código para el nuevo periodo académico.
        </p>
        <form onSubmit={handleSubmit} className="mt-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Código (Ej: 2025-1)
            </label>
            <input
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              placeholder="YYYY-S"
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-app rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-app text-gray-900 dark:text-white outline-none"
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-app text-gray-700 dark:text-gray-300 bg-white dark:bg-surface hover:bg-gray-50 dark:hover:bg-app"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow flex items-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Crear Periodo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =============================== PAGE ===============================
export default function AdminPeriodos() {
  const { user } = useAuth?.() ?? {};
  const role = String(user?.role || user?.id_rol || "admin").toLowerCase();
  const isAdmin = role === "admin" || role === "administrador" || user?.id_rol === 4;

  const [loading, setLoading] = useState(true);
  const [periodos, setPeriodos] = useState([]);
  const [activo, setActivo] = useState(null);
  const [error, setError] = useState(null);

  const [toast, setToast] = useState(null);
  const closeToast = () => setToast(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toActivate, setToActivate] = useState(null);
  const [activating, setActivating] = useState(false);

  const [createModalOpen, setCreateModalOpen] = useState(false);

  const activoNombre = useMemo(() => {
    if (!activo?.id_periodo) return null;
    return periodos.find((p) => p.id_periodo === activo.id_periodo)?.codigo ?? activo.codigo;
  }, [activo, periodos]);

  // Cargar lista + activo
  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔄 Cargando periodos...');
      const [all, act] = await Promise.all([getPeriodos(), getPeriodoActivo()]);
      
      console.log('📊 Periodos recibidos:', all);
      console.log('🎯 Periodo activo:', act);
      
      setPeriodos(all);
      setActivo(act);
    } catch (e) {
      console.error('❌ Error cargando periodos:', e);
      setError(e?.message || "Error al cargar periodos");
      
      // Si es error 404 en periodo activo, no es crítico
      if (e.status === 404 && e.message?.includes('periodo activo')) {
        setActivo(null);
        setError(null); // No mostrar error por falta de periodo activo
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Acción: solicitar confirmación
  const onAskActivate = (id) => {
    setToActivate(id);
    setConfirmOpen(true);
  };

  // Acción: activar confirmado
  const onConfirmActivate = async () => {
    if (!toActivate) return;
    
    setActivating(true);
    try {
      console.log('🎯 Activando periodo:', toActivate);
      await activarPeriodo(toActivate);

      // Notificar al resto de la app
      const periodo = periodos.find((p) => p.id_periodo === toActivate);
      window.dispatchEvent(new CustomEvent("periodoActivoChanged", { 
        detail: { 
          id_periodo: toActivate, 
          codigo: periodo?.codigo 
        } 
      }));

      setToast({ 
        kind: "success", 
        title: "Periodo activado", 
        desc: `Ahora el periodo activo es ${periodo?.codigo}.` 
      });

      // Refrescar datos
      await refetch();
      
    } catch (e) {
      console.error('❌ Error activando periodo:', e);
      setToast({
        kind: "error",
        title: "No se pudo activar el periodo",
        desc: e?.message || "Intenta nuevamente."
      });
    } finally {
      setActivating(false);
      setConfirmOpen(false);
      setToActivate(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-100 to-blue-300 dark:bg-app dark:bg-none">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center bg-white dark:bg-surface p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-app">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-700 dark:text-white">Cargando periodos...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Verificar permisos
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-100 to-blue-300 dark:bg-app dark:bg-none">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center bg-white dark:bg-surface p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-app">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Acceso Denegado</h1>
            <p className="text-gray-600 dark:text-muted">No tienes permisos para administrar periodos académicos.</p>
            <Link
              to="/admin"
              className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Volver al Panel
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-100 to-blue-300 dark:bg-app dark:bg-none w-full overflow-x-hidden">
      <Navbar />
      <main className="flex-1 w-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-6xl">
          {/* Banner de advertencia si no hay periodo activo */}
          {!activo?.id_periodo && (
            <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 text-yellow-900 dark:text-yellow-300 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
              <AlertTriangle className="h-5 w-5 mt-0.5 text-yellow-700 dark:text-yellow-400" />
              <div className="text-sm">
                <div className="font-semibold">No hay un periodo activo configurado.</div>
                <div>Activa un periodo para que el resto del sistema funcione correctamente.</div>
              </div>
            </div>
          )}

          {/* Panel superior: Periodo activo */}
          <div className="mb-8 bg-white dark:bg-surface rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-app">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
                  <Calendar className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Periodos Académicos</h1>
                  <p className="text-gray-600 dark:text-muted mt-1">Administra el periodo activo del sistema.</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition shadow-sm font-medium text-sm"
                >
                  <Plus className="h-4 w-4" />
                  Nuevo Periodo
                </button>
                <div className="h-6 w-px bg-gray-200 dark:bg-app hidden sm:block"></div>
                {activo?.id_periodo ? (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-700">
                    Activo: {activoNombre}
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700">
                    Sin periodo activo
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Tabla de periodos */}
          <div className="bg-white dark:bg-surface rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-app">
            {periodos.length === 0 ? (
              <div className="text-center py-16 text-gray-500 dark:text-muted">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay periodos académicos configurados.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-blue-200 uppercase tracking-wider">
                        Periodo
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-blue-200 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 dark:text-blue-200 uppercase tracking-wider">
                        Acción
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-surface divide-y divide-gray-100 dark:divide-app">
                    {periodos.map((p) => {
                      const isActive = activo?.id_periodo === p.id_periodo;
                      return (
                        <tr key={p.id_periodo} className="hover:bg-blue-50 dark:hover:bg-app/20 transition-colors duration-200">
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">{p.codigo}</div>
                            <div className="text-xs text-gray-500 dark:text-muted">ID: {p.id_periodo}</div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            {isActive ? (
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-700">
                                Activo
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-app text-gray-700 dark:text-muted border border-gray-200 dark:border-app">
                                Inactivo
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-center">
                            {isActive ? (
                              <button
                                disabled
                                className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-app text-gray-400 dark:text-muted text-sm font-medium rounded-lg border border-gray-200 dark:border-app cursor-not-allowed"
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Actual
                              </button>
                            ) : (
                              <button
                                onClick={() => onAskActivate(p.id_periodo)}
                                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
                              >
                                Activar periodo
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Link back opcional */}
          <div className="text-center mt-6">
            <Link
              to="/admin"
              className="inline-flex items-center px-4 py-2 bg-white dark:bg-surface border border-gray-200 dark:border-app rounded-lg hover:bg-gray-50 dark:hover:bg-app/20 shadow-sm dark:text-white"
            >
              Volver al panel
            </Link>
          </div>
        </div>
      </main>
      <Footer />

      {/* Modal de confirmación */}
      <ConfirmModal
        open={confirmOpen}
        title="Activar periodo"
        message={
          toActivate
            ? `¿Seguro que deseas activar el periodo ${periodos.find(p => p.id_periodo === toActivate)?.codigo}? Esta acción desactivará automáticamente los demás periodos.`
            : "¿Activar periodo?"
        }
        confirmLabel="Activar"
        cancelLabel="Cancelar"
        onConfirm={onConfirmActivate}
        onCancel={() => {
          setConfirmOpen(false);
          setToActivate(null);
        }}
        loading={activating}
      />

      {/* Toast */}
      {toast && (
        <Toast kind={toast.kind} title={toast.title} desc={toast.desc} onClose={closeToast} />
      )}

      {/* Modal de Crear */}
      <CreatePeriodoModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={(codigo) => {
          setCreateModalOpen(false);
          setToast({
            kind: "success",
            title: "Periodo creado",
            desc: `El periodo ${codigo} se ha creado exitosamente.`,
          });
          refetch();
        }}
      />
    </div>
  );
}