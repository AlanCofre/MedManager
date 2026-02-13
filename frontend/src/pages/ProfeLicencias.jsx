import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Eye, Clock, Search, Calendar, X } from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../context/AuthContext";

const PAGE_SIZE = 10;
const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:3000";

/* -------------------- UTILIDADES -------------------- */
function initialsFromName(name = "") {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function inDateRange(valueDateStr, startStr, endStr) {
  if (!valueDateStr) return false;
  const v = new Date(valueDateStr);
  if (isNaN(v)) return false;
  if (startStr) {
    const s = new Date(startStr);
    if (isNaN(s)) return false;
    if (v < s) return false;
  }
  if (endStr) {
    const e = new Date(endStr);
    if (isNaN(e)) return false;
    e.setHours(23, 59, 59, 999);
    if (v > e) return false;
  }
  return true;
}

// Función para formatear fecha (solo fecha, sin hora)
function formatDate(dateString) {
  if (!dateString) return "-";
  try {
    // Si ya está en formato YYYY-MM-DD, convertir a DD/MM/YYYY
    if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-');
      return `${day}/${month}/${year}`;
    }
    
    // Si es un objeto Date o string con hora, extraer solo la fecha
    const date = new Date(dateString);
    if (isNaN(date)) return "-";
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch {
    return "-";
  }
}

/* -------------------- COMPONENTE PRINCIPAL -------------------- */
export default function ProfeLicencias() {
  const { user, token, isLoading: authLoading } = useAuth();

  /* estado de datos */
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [periodos, setPeriodos] = useState([]);
  const [periodoActivo, setPeriodoActivo] = useState("");

  /* filtros locales + paginación */
  const [searchParams, setSearchParams] = useSearchParams();
  const [filterCourse, setFilterCourse] = useState(searchParams.get("course") || "");
  const [filterEstado, setFilterEstado] = useState(searchParams.get("estado") || "");
  const [startDate, setStartDate] = useState(searchParams.get("start") || "");
  const [endDate, setEndDate] = useState(searchParams.get("end") || "");
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [page, setPage] = useState(Number(searchParams.get("page") || 1));

  /* Obtener períodos desde la base de datos */
  useEffect(() => {
    const obtenerPeriodos = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/periodos`);
        const data = await response.json();
        
        if (data.ok && Array.isArray(data.data)) {
          console.log("[ProfeLicencias] Períodos obtenidos:", data.data);
          setPeriodos(data.data);
          
          // Buscar el período activo
          const periodoActivoEncontrado = data.data.find(p => p.activo);
          if (periodoActivoEncontrado) {
            console.log("[ProfeLicencias] Período activo encontrado:", periodoActivoEncontrado.codigo);
            setPeriodoActivo(periodoActivoEncontrado.codigo);
            localStorage.setItem("periodo_activo_codigo", periodoActivoEncontrado.codigo);
          } else if (data.data.length > 0) {
            // Si no hay activo, usar el primero
            console.log("[ProfeLicencias] Usando primer período:", data.data[0].codigo);
            setPeriodoActivo(data.data[0].codigo);
            localStorage.setItem("periodo_activo_codigo", data.data[0].codigo);
          }
        } else {
          console.warn("[ProfeLicencias] No se pudieron obtener períodos:", data.mensaje);
        }
      } catch (error) {
        console.error("[ProfeLicencias] Error al obtener períodos:", error);
      }
    };

    obtenerPeriodos();
  }, []);

  // También mantener la lógica existente para compatibilidad
  const periodoFromUrl = searchParams.get("periodo");
  const periodoFromStorage = (() => {
    try {
      return localStorage.getItem("periodo_activo_codigo") || null;
    } catch {
      return null;
    }
  })();

  // Usar el período del estado si está disponible, sino usar los métodos anteriores
  const periodoFinal = periodoActivo || periodoFromUrl || periodoFromStorage || "";

  /* cargar datos desde backend /profesor/licencias */
  useEffect(() => {
    // Si AuthContext aún está cargando, no hacer nada
    if (authLoading) {
      console.log("[ProfeLicencias] Esperando AuthContext...");
      setLoading(true);
      return;
    }

    // Si no tenemos período, no cargar datos aún
    if (!periodoFinal) {
      console.log("[ProfeLicencias] Esperando período...");
      return;
    }

    let mounted = true;
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);

      // Validar token y user DESPUÉS de que AuthContext termine de cargar
      if (!token) {
        console.warn("[ProfeLicencias] Sin token");
        setError("No hay token de autenticación. Inicia sesión nuevamente.");
        setLoading(false);
        return;
      }

      if (!user?.id_usuario) {
        console.warn("[ProfeLicencias] Sin id_usuario");
        setError("No se encontró información del usuario.");
        setLoading(false);
        return;
      }

      try {
        const params = new URLSearchParams();
        params.set("periodo", periodoFinal);

        const url = `${API_BASE}/profesor/licencias?${params.toString()}`;

        console.log("[ProfeLicencias] Llamando a:", url);
        console.log("[ProfeLicencias] Token presente:", !!token);
        console.log("[ProfeLicencias] User ID:", user?.id_usuario);
        console.log("[ProfeLicencias] Rol:", user?.rol);
        console.log("[ProfeLicencias] Período:", periodoFinal);

        const res = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        console.log("[ProfeLicencias] Status:", res.status);

        if (!res.ok) {
          if (res.status === 403) {
            throw new Error("No tienes permisos de profesor para acceder a esta información");
          }
          if (res.status === 404) {
            throw new Error("Recurso no encontrado");
          }
          const txt = await res.text();
          throw new Error(txt || `Error HTTP ${res.status}`);
        }

        const json = await res.json();
        console.log("[ProfeLicencias] Respuesta completa:", json);

        if (!json.ok) {
          throw new Error(json.mensaje || "Error en la respuesta del servidor");
        }

        // Manejar la respuesta de tu backend
        const dataArray = Array.isArray(json.data) ? json.data : [];
        
        // Normalizar datos para el frontend
        const normalized = dataArray.map((row) => ({
          id: row.id_licencia,
          studentName: row.nombre_estudiante || "Estudiante",
          studentId: row.correo_estudiante || "Sin email",
          courseCode: row.codigo_curso || "UNK",
          section: row.seccion || "?",
          fechaEmision: row.fecha_emision || "",
          fechaInicio: row.fecha_inicio || "",
          fechaFin: row.fecha_fin || "",
          estado: row.estado || "",
          folio: row.folio || "",
          motivoMedico: row.motivo_medico || "",
        }));

        if (!mounted) return;

        console.log("[ProfeLicencias] Licencias normalizadas:", normalized.length);
        setItems(normalized);
        setLoading(false);

        if (normalized.length === 0) {
          if (json.mensaje) {
            setError(json.mensaje);
          } else {
            setError("No hay licencias médicas aceptadas en tus cursos para este período.");
          }
        }
      } catch (err) {
        if (!mounted) return;
        console.error("[ProfeLicencias] Error completo:", err);
        
        if (err.name === 'AbortError') {
          console.log('[ProfeLicencias] Request cancelado');
          return;
        }
        
        setError(err.message || "Error al cargar las licencias");
        setLoading(false);
        setItems([]);
      }
    }

    load();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [authLoading, token, user?.id_usuario, periodoFinal]);

  /* sincronizar filtros al montar */
  useEffect(() => {
    const spCourse = searchParams.get("course") || "";
    const spEstado = searchParams.get("estado") || "";
    const spStart = searchParams.get("start") || "";
    const spEnd = searchParams.get("end") || "";
    const spQ = searchParams.get("q") || "";
    const spPage = Number(searchParams.get("page") || 1);

    setFilterCourse(spCourse);
    setFilterEstado(spEstado);
    setStartDate(spStart);
    setEndDate(spEnd);
    setSearchTerm(spQ);
    setPage(spPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* opciones de dropdowns */
  const courseOptions = useMemo(() => {
    const setC = new Set();
    items.forEach((it) => {
      const key = `${it.courseCode || "UNK"} - ${it.section || "?"}`;
      setC.add(key);
    });
    return Array.from(setC).sort();
  }, [items]);

  const estadoOptions = useMemo(() => {
    const setE = new Set();
    items.forEach((it) => {
      const e = String(it.estado || "Desconocido");
      setE.add(e);
    });
    return Array.from(setE).sort();
  }, [items]);

  /* aplicar filtros */
  const filtered = useMemo(() => {
    let out = items.slice();

    if (filterCourse) {
      out = out.filter((it) => {
        const key = `${it.courseCode || "UNK"} - ${it.section || "?"}`;
        return key === filterCourse;
      });
    }

    if (filterEstado) {
      out = out.filter((it) => {
        return String(it.estado || "").toLowerCase() === String(filterEstado).toLowerCase();
      });
    }

    if (startDate || endDate) {
      out = out.filter((it) => {
        return (
          inDateRange(it.fechaEmision, startDate, endDate) ||
          inDateRange(it.fechaInicio, startDate, endDate)
        );
      });
    }

    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      out = out.filter(
        (it) =>
          String(it.studentName || "").toLowerCase().includes(s) ||
          String(it.studentId || "").toLowerCase().includes(s) ||
          String(it.folio || "").toLowerCase().includes(s)
      );
    }

    out.sort((a, b) => {
      const da = new Date(a.fechaInicio || a.fechaEmision || 0).getTime();
      const db = new Date(b.fechaInicio || b.fechaEmision || 0).getTime();
      return db - da;
    });

    return out;
  }, [items, filterCourse, filterEstado, startDate, endDate, searchTerm]);

  /* paginación */
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* actualizar querystring */
  useEffect(() => {
    const params = {};
    if (filterCourse) params.course = filterCourse;
    if (filterEstado) params.estado = filterEstado;
    if (startDate) params.start = startDate;
    if (endDate) params.end = endDate;
    if (searchTerm) params.q = searchTerm;
    if (page && page > 1) params.page = String(page);
    setSearchParams(params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCourse, filterEstado, startDate, endDate, searchTerm, page]);

  /* limpiar filtros */
  function clearFilters() {
    setFilterCourse("");
    setFilterEstado("");
    setStartDate("");
    setEndDate("");
    setSearchTerm("");
    setPage(1);
    setSearchParams({});
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100 dark:bg-app dark:bg-none">
        <LoadingSpinner size="large" text="Cargando licencias..." />
      </div>
    );
  }

  /* cambiar período */
  const handleCambiarPeriodo = (nuevoPeriodo) => {
    setPeriodoActivo(nuevoPeriodo);
    localStorage.setItem("periodo_activo_codigo", nuevoPeriodo);
    // Recargar datos
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 dark:bg-app dark:bg-none">
      <Navbar />

      <main className="flex-1 w-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-6xl">
          {/* header y filtros */}
          <div className="mb-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Clock className="h-7 w-7 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900">Licencias — Mis Alumnos</h1>
                  <p className="text-gray-600 mt-1">Filtra la bandeja para localizar rápidamente licencias.</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Período activo: <span className="font-semibold">{periodoFinal}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Selector de períodos */}
                  {periodos.length > 0 && (
                    <select
                      value={periodoFinal}
                      onChange={(e) => handleCambiarPeriodo(e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#048FD4] bg-white"
                    >
                      {periodos.map((periodo) => (
                        <option key={periodo.id_periodo} value={periodo.codigo}>
                          {periodo.codigo} {periodo.activo ? "(Activo)" : ""}
                        </option>
                      ))}
                    </select>
                  )}
                  
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-white border rounded shadow-sm hover:bg-gray-50 text-sm"
                    aria-label="Limpiar filtros"
                  >
                    <X className="h-4 w-4 text-gray-600" />
                    Limpiar filtros
                  </button>
                </div>
              </div>

              {/* filtros */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <div>
                  <label htmlFor="filterCourse" className="text-sm text-gray-600">
                    Ramo
                  </label>
                  <select
                    id="filterCourse"
                    value={filterCourse}
                    onChange={(e) => {
                      setFilterCourse(e.target.value);
                      setPage(1);
                    }}
                    className="mt-1 block w-full border border-gray-200 bg-white px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#048FD4]"
                  >
                    <option value="">Todos los ramos</option>
                    {courseOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="filterEstado" className="text-sm text-gray-600">
                    Estado
                  </label>
                  <select
                    id="filterEstado"
                    value={filterEstado}
                    onChange={(e) => {
                      setFilterEstado(e.target.value);
                      setPage(1);
                    }}
                    className="mt-1 block w-full border border-gray-200 bg-white px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#048FD4]"
                  >
                    <option value="">Todos los estados</option>
                    {estadoOptions.map((e) => (
                      <option key={e} value={e}>
                        {e}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2">
                  <div className="w-1/2">
                    <label htmlFor="startDate" className="text-sm text-gray-600">
                      Desde
                    </label>
                    <div className="relative mt-1">
                      <input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          setPage(1);
                        }}
                        className="block w-full border border-gray-200 bg-white px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#048FD4]"
                      />
                    </div>
                  </div>

                  <div className="w-1/2">
                    <label htmlFor="endDate" className="text-sm text-gray-600">
                      Hasta
                    </label>
                    <div className="relative mt-1">
                      <input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => {
                          setEndDate(e.target.value);
                          setPage(1);
                        }}
                        className="block w-full border border-gray-200 bg-white px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#048FD4]"
                      />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-3">
                  <label htmlFor="searchTerm" className="text-sm text-gray-600">
                    Buscar (alumno, email o folio)
                  </label>
                  <div className="relative mt-1">
                    <input
                      id="searchTerm"
                      type="text"
                      placeholder="Alumno, email o folio"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setPage(1);
                      }}
                      className="pl-10 pr-3 py-2 border border-gray-200 rounded-md w-full text-sm focus:outline-none focus:ring-2 focus:ring-[#048FD4] bg-white"
                    />
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Error global */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm">
                <span className="font-semibold">Error:</span> {error}
              </p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
              >
                Reintentar
              </button>
            </div>
          )}

          {/* Tabla de licencias */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Estudiante
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Ramo
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Fechas
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Acción
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-100">
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-6 py-5">
                          <div className="h-4 bg-gray-200 rounded w-32" />
                        </td>
                        <td className="px-6 py-5">
                          <div className="h-4 bg-gray-200 rounded w-40" />
                        </td>
                        <td className="px-6 py-5">
                          <div className="h-4 bg-gray-200 rounded w-48" />
                        </td>
                        <td className="px-6 py-5">
                          <div className="h-4 bg-gray-200 rounded w-24" />
                        </td>
                        <td className="px-6 py-5 text-center">
                          <div className="h-8 w-24 bg-gray-200 rounded mx-auto" />
                        </td>
                      </tr>
                    ))
                  ) : paged.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center">
                        <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                          <Clock className="h-12 w-12 text-gray-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-700 mb-2">
                          {error ? "Error al cargar" : "No hay licencias aceptadas"}
                        </h2>
                        <p className="text-gray-500">
                          {error || "No se encontraron licencias aceptadas para los filtros seleccionados."}
                        </p>
                        {error && (
                          <button 
                            onClick={() => window.location.reload()}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Reintentar
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    paged.map((lic) => {
                      const courseLabel = `${lic.courseCode || "UNK"} - ${lic.section || "?"}`;
                      const studentName = lic.studentName || "Sin nombre";
                      const studentId = lic.studentId || "";
                      const fechaInicio = formatDate(lic.fechaInicio);
                      const fechaFin = formatDate(lic.fechaFin);
                      const folio = lic.folio || "";

                      return (
                        <tr
                          key={lic.id}
                          className="hover:bg-blue-50 transition-colors duration-200"
                        >
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-semibold">
                                {initialsFromName(studentName)}
                              </div>
                              <div className="text-sm">
                                <div className="font-medium text-gray-900">{studentName}</div>
                                <div className="text-xs text-gray-500">{studentId}</div>
                                {folio && (
                                  <div className="text-xs text-gray-400">Folio: {folio}</div>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="text-sm">
                              <div className="font-medium text-gray-900">{courseLabel}</div>
                            </div>
                          </td>

                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="text-sm space-y-1">
                              <div className="flex items-center text-gray-900">
                                <span className="font-medium text-blue-600">Inicio:</span>
                                <span className="ml-2">{fechaInicio}</span>
                              </div>
                              <div className="flex items-center text-gray-900">
                                <span className="font-medium text-red-600">Fin:</span>
                                <span className="ml-2">{fechaFin}</span>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-5 whitespace-nowrap">
                            <span
                              className={`px-3 py-2 inline-flex text-sm leading-5 font-semibold rounded-full border min-w-[140px] justify-center ${
                                String(lic.estado).toLowerCase().includes("acept") ||
                                String(lic.estado).toLowerCase().includes("aprob")
                                  ? "bg-green-100 text-green-800 border-green-200"
                                  : String(lic.estado).toLowerCase().includes("rechaz")
                                  ? "bg-red-100 text-red-800 border-red-200"
                                  : "bg-yellow-100 text-yellow-800 border-yellow-200"
                              }`}
                            >
                              {lic.estado}
                            </span>
                          </td>

                          <td className="px-6 py-5 whitespace-nowrap text-center">
                            <Link
                              to={`/profesor/licencias/${lic.id}`}
                              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {!loading && filtered.length > 0 && (
              <div className="flex items-center justify-between p-4 border-t">
                <div className="text-sm text-gray-600">
                  Mostrando {filtered.length} resultados — Página {page} de {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 rounded border bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 rounded border bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}