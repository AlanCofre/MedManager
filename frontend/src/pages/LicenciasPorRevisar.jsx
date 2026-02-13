// frontend/src/pages/LicenciasPorRevisar.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import BannerSection from "../components/BannerSection";
import Footer from "../components/Footer";
import LoadingSpinner from "../components/LoadingSpinner";
import { Eye, Clock, Calendar, User, GraduationCap, Search } from "lucide-react";
import { licenciasRealService } from "../services/licenciasRealService";
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

function mapLicenciaBackendToFrontend(l) {
  return {
    id: l.id_licencia || l.id,
    id_usuario: l.id_usuario,
    id_estudiante: l.id_usuario,
    estudiante: l.estudiante_nombre || l.nombre || "Estudiante",
    fechaEmision: l.fecha_emision,
    fechaEnvio: l.fecha_creacion,
    fechaInicioReposo: l.fecha_inicio,
    fechaFinReposo: l.fecha_fin,
    estado: l.estado === "pendiente" ? "En revisión" :
            l.estado?.charAt(0).toUpperCase() + l.estado?.slice(1)
  };
}


function formatFecha(fechaStr) {
  if (!fechaStr) return "";
  const d = new Date(fechaStr);
  if (isNaN(d)) return fechaStr;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatFechaHora(fechaStr) {
  if (!fechaStr) return "";
  const d = new Date(fechaStr);
  if (isNaN(d)) return fechaStr;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2,"0");
  const dd = String(d.getDate()).padStart(2,"0");
  const hh = String(d.getHours()).padStart(2,"0");
  const min = String(d.getMinutes()).padStart(2,"0");
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

// función para obtener fecha local YYYY-MM-DD
function hoyLocal() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2,"0");
  const dd = String(d.getDate()).padStart(2,"0");
  return `${yyyy}-${mm}-${dd}`;
}

function obtenerIdEstudiante(licencia) {
  const id = licencia.id_estudiante || licencia.id_usuario || licencia.id_usuario_estudiante || null;
  console.log("🔍 ID estudiante detectado:", id, licencia);
  return id;
}


function tieneAnomaliaLicencia(licencia, observaciones) {
  const idEst = obtenerIdEstudiante(licencia);
  return observaciones[idEst]?.some(obs => obs.repeticiones >= 3);
}


export default function LicenciasPorRevisar() {
  const [licenciasTodas, setLicenciasTodas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filterDate, setFilterDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [itemsPorPagina] = useState(10);
  const [observaciones, setObservaciones] = useState({});
  const [expandedObs, setExpandedObs] = useState({});
  const toggleObs = (idEst) => {
    setExpandedObs((prev) => ({
      ...prev,
      [idEst]: !prev[idEst]
    }));
  };

  useEffect(() => {
    const cargarLicencias = async () => {
      setLoading(true);
      setError("");
      try {
        console.log("🔍 Cargando licencias pendientes...");
        
        const response = await licenciasRealService.getLicenciasPendientes();
        
        // Tu backend devuelve: { ok: true, data: [...], meta: {...} }
        const licenciasData = response.data || [];
        
        console.log("✅ Licencias pendientes cargadas:", licenciasData);
        
        const lista = licenciasData.map(mapLicenciaBackendToFrontend);
        setLicenciasTodas(lista);
      } catch (e) {
        console.error("❌ Error cargando licencias:", e);
        setError(e.message || "Error al cargar licencias pendientes");
        setLicenciasTodas([]);
      } finally {
        setLoading(false);
      }
    };
    cargarLicencias();
  }, []);
  useEffect(() => {
    const cargarObservaciones = async () => {
      const token = localStorage.getItem("token");
      const rol = localStorage.getItem("rol")?.toLowerCase();
      if (!rol || !["funcionario", "func"].includes(rol)) return;

      try {
        const res = await fetch(`${API_BASE}/reportes/licencias/repetidas`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (!json.ok) return;

        // Agrupar por id_estudiante
        const agrupadas = {};
        for (const obs of json.data) {
          if (!agrupadas[obs.id_estudiante]) agrupadas[obs.id_estudiante] = [];
          agrupadas[obs.id_estudiante].push(obs);


        }
        setObservaciones(agrupadas);
        console.log("📊 Observaciones:", agrupadas);

      } catch (err) {
        console.error("❌ Error al cargar observaciones:", err);
      }
    };

    if (licenciasTodas.length > 0) {
      cargarObservaciones();
    }
  }, [licenciasTodas]);

  // Filtrado por búsqueda y fecha
  const licenciasFiltradas = useMemo(() => {
    return licenciasTodas.filter(l => {
      const cumpleBusqueda = !searchTerm || 
        l.estudiante.toLowerCase().includes(searchTerm.toLowerCase());
      const cumpleFecha = !filterDate || 
        (l.fechaEmision && formatFecha(l.fechaEmision) === filterDate);
      return cumpleBusqueda && cumpleFecha;
    });
  }, [licenciasTodas, searchTerm, filterDate]);
  useEffect(() => {
    console.log("🧠 Observaciones activas:", observaciones);
  }, [observaciones]);
  // Estadísticas
  const estadisticas = useMemo(() => {
    const hoy = hoyLocal();
    const pendientesHoy = licenciasTodas.filter(l => 
      l.fechaEmision && formatFecha(l.fechaEmision) === hoy
    ).length;
    return {
      totalEnRevision: licenciasTodas.length,
      pendientesHoy
    };
  }, [licenciasTodas]);

  // Paginación
  const totalPaginas = Math.max(1, Math.ceil(licenciasFiltradas.length / itemsPorPagina));
  const licenciasPagina = useMemo(() => {
    const inicio = (page - 1) * itemsPorPagina;
    return licenciasFiltradas.slice(inicio, inicio + itemsPorPagina);
  }, [licenciasFiltradas, page, itemsPorPagina]);

  if (loading) return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 w-full overflow-x-hidden dark:bg-app dark:bg-none">
      <Navbar />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-700">Cargando licencias...</p>
        </div>
      </main>
      <Footer />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 w-full overflow-x-hidden dark:bg-app dark:bg-none">
      <Navbar />
      <main className="flex-1 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md">
          <h2 className="text-lg font-semibold mb-2">Error al cargar licencias</h2>
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100 dark:bg-app dark:bg-none">
        <LoadingSpinner size="large" text="Cargando licencias por revisar..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 w-full overflow-x-hidden dark:bg-app dark:bg-none">
      <Navbar />
      <BannerSection />
      <main className="flex-1 w-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-7xl">

          {/* Header */}
          <div className="mb-8 text-center">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-blue-100 p-3 rounded-full mr-4">
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900">Licencias por Revisar</h1>
                  <p className="text-gray-600 mt-2">Bandeja principal de revisión para secretarios</p>
                </div>
              </div>

              {/* Estadísticas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                  <div className="flex items-center justify-center">
                    <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                    <div>
                      <div className="text-yellow-800 font-semibold text-lg">
                        {estadisticas.totalEnRevision} En Revisión
                      </div>
                      <div className="text-yellow-600 text-sm">
                        Total de licencias pendientes
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <div className="text-blue-800 font-semibold text-lg">
                        {estadisticas.pendientesHoy} Pendientes Hoy
                      </div>
                      <div className="text-blue-600 text-sm">
                        Licencias emitidas hoy
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Controles */}
              <div className="mt-6 flex items-center gap-4 flex-wrap justify-center">
                <div className="flex items-center gap-2">
                  <label htmlFor="filterDate" className="text-sm text-gray-600">Fecha (Emisión)</label>
                  <input
                    id="filterDate"
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="border border-gray-200 bg-white px-3 py-1 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#048FD4]"
                  />
                </div>
                <form
                  onSubmit={(e) => e.preventDefault()}
                  className="flex items-center w-full max-w-xs bg-white border border-gray-300 rounded-lg shadow-sm px-3 py-2"
                >
                  <Search className="w-5 h-5 text-gray-400 mr-2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por estudiante..."
                    className="flex-1 outline-none text-gray-700 placeholder-gray-400"
                  />
                </form>
                <button
                  onClick={() => {
                    setFilterDate("");
                    setSearchTerm("");
                  }}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-white/90 hover:bg-white rounded-md border border-gray-200 text-sm text-gray-600"
                >
                  Limpiar filtros
                </button>
              </div>
            </div>
          </div>

          {/* Tabla */}
          {licenciasPagina.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
              <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <Clock className="h-12 w-12 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-700 mb-3">
                {licenciasTodas.length === 0 ? 'No hay licencias pendientes' : 'No hay resultados para los filtros'}
              </h2>
              <p className="text-gray-500 text-lg">
                {licenciasTodas.length === 0 
                  ? 'Todas las licencias han sido procesadas.' 
                  : 'Intenta con otros criterios de búsqueda.'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          Estudiante
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          Fechas
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          Estado
                        </div>
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Acción
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {licenciasPagina.map((licencia) => (
                      <tr key={licencia.id} className="hover:bg-blue-50 transition-colors duration-200">
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="bg-blue-100 rounded-full p-2 mr-3">
                              <User className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>

                              <div className="space-y-1">
                                <div className="text-sm font-semibold text-gray-900">{licencia.estudiante}</div>
                                {tieneAnomaliaLicencia(licencia, observaciones) && (
                                  <div className="text-xs text-red-700 font-semibold">
                                    ⚠️ Anomalía detectada
                                  </div>
                                )}
                                <div className="text-xs text-gray-500">ID: {licencia.id}</div>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="text-sm space-y-1">
                            <div className="flex items-center text-gray-900">
                              <span className="font-medium text-blue-600">Emisión:</span>
                              <span className="ml-2">{formatFecha(licencia.fechaEmision)}</span>
                            </div>
                            <div className="flex items-center text-gray-900">
                              <span className="font-medium text-green-600">Inicio reposo:</span>
                              <span className="ml-2">{formatFecha(licencia.fechaInicioReposo)}</span>
                            </div>
                            <div className="flex items-center text-gray-900">
                              <span className="font-medium text-red-600">Fin reposo:</span>
                              <span className="ml-2">{formatFecha(licencia.fechaFinReposo)}</span>
                            </div>
                            <div className="flex items-center text-gray-500 text-xs">
                              <span className="font-medium">Enviado:</span>
                              <span className="ml-2">{formatFechaHora(licencia.fechaEnvio)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <span className="px-3 py-2 inline-flex text-sm leading-5 font-semibold rounded-full bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border border-yellow-200">
                            <Clock className="h-4 w-4 mr-1" />
                            {licencia.estado}
                          </span>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-center">
                          <Link
                            to={`/evaluar/${licencia.id}`}
                            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalle
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Paginación */}
              <div className="flex justify-center items-center gap-4 py-6">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="text-gray-700 font-medium">
                  Página {page} de {totalPaginas}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPaginas, p + 1))}
                  disabled={page === totalPaginas}
                  className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
