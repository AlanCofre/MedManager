import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BannerSection from "../components/BannerSection";
import LoadingSpinner from "../components/LoadingSpinner";
import SkeletonLoader from "../components/SkeletonLoader";
import { Eye, Clock, Calendar, Search } from "lucide-react";
import { licenciasRealService } from "../services/licenciasRealService";

const LIST_ENDPOINT = "/api/licencias/mis-licencias";

export default function LicenciasEstudiante() {
  const [allLicencias, setAllLicencias] = useState([]);
  const [licencias, setLicencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // filtros & orden
  const [filterDate, setFilterDate] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [sortAsc, setSortAsc] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // helper: normalizar objeto de licencia y formatear fechas
  const normalizeLicencia = (l) => {
    const id = l.id_licencia ?? l.id ?? "";
    const folio = l.folio ?? "";

    // Fechas desde el BE - según tu estructura de base de datos
    const fechaCreacionRaw = l.fecha_creacion ?? "";
    const fechaInicioRaw = l.fecha_inicio ?? "";
    const fechaFinRaw = l.fecha_fin ?? "";
    const estadoRaw = l.estado ?? "";

    const fmtDate = (d) => {
      if (!d) return "";
      const dt = new Date(d);
      if (isNaN(dt)) {
        const s = String(d);
        return s.length >= 10 ? s.slice(0, 10) : s;
      }
      return dt.toISOString().slice(0, 10); // YYYY-MM-DD
    };

    // formato con hora local "YYYY-MM-DD HH:MM"
    const fmtDateTime = (d) => {
      if (!d) return "";
      const dt = new Date(d);
      if (isNaN(dt)) return String(d);
      const pad = (n) => String(n).padStart(2, "0");
      return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())} ${pad(
        dt.getHours()
      )}:${pad(dt.getMinutes())}`;
    };

    // normalizar estados del BE a etiquetas amigables
    const STATE_MAP = {
      pendiente: "Pendiente",
      aceptado: "Aceptado",
      rechazado: "Rechazado",
    };

    const cleanKey = String(estadoRaw || "")
      .toLowerCase()
      .trim();

    const estadoNormalized = STATE_MAP[cleanKey] ?? (estadoRaw ? String(estadoRaw) : "Sin estado");

    return {
      id: String(id),
      folio: folio ? String(folio) : "",
      // fecha para filtros (YYYY-MM-DD)
      fecha_creacion: fmtDate(fechaCreacionRaw),
      // fecha con hora para mostrar
      fecha_creacionFull: fmtDateTime(fechaCreacionRaw),
      fechaInicioReposo: fmtDate(fechaInicioRaw),
      fechaFinReposo: fmtDate(fechaFinRaw),
      estadoNormalized,
      estado: estadoRaw, // mantener el estado original para los contadores
      _raw: l,
    };
  };

  useEffect(() => {
    const cargarLicencias = async () => {
      setLoading(true);
      try {
        console.log("🔍 Cargando licencias del estudiante...");
        
        const response = await licenciasRealService.getMisLicencias();
        
        // Tu backend devuelve: { ok: true, data: [...], pagination: {...} }
        const licenciasData = response.data || [];
        
        console.log("✅ Licencias cargadas:", licenciasData);
        
        const normalized = licenciasData.map(normalizeLicencia);
        
        setAllLicencias(normalized);
        setLicencias(normalized);
      } catch (e) {
        console.error("❌ Error cargando licencias:", e);
        setAllLicencias([]);
        setLicencias([]);
      } finally {
        setLoading(false);
      }
    };
    cargarLicencias();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setAllLicencias(mockLicencias);
      setLicencias(mockLicencias);
    } catch (error) {
      console.error("Error refrescando licencias:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // opciones dinámicas de estados según lo que trae el BE (normalizado)
  const estadosUnicos = useMemo(() => {
    const s = new Set(allLicencias.map((x) => x.estadoNormalized).filter(Boolean));
    return Array.from(s).sort();
  }, [allLicencias]);

  // Cálculo de contadores - CORREGIDO
  const total = licencias.length;
  const pendientes = licencias.filter((l) => l.estado === "pendiente").length;
  const aceptadas = licencias.filter((l) => l.estado === "aceptado").length;
  const rechazadas = licencias.filter((l) => l.estado === "rechazado").length;

  useEffect(() => {
    let resultado = [...allLicencias];

    // Filtrar por estado (usar estado normalizado)
    if (filterEstado) {
      resultado = resultado.filter((l) =>
        l.estadoNormalized.toLowerCase().includes(filterEstado.toLowerCase())
      );
    }

    // Filtrar por fecha (YYYY-MM-DD)
    if (filterDate) {
      resultado = resultado.filter((l) => l.fecha_creacion === filterDate);
    }

    // Búsqueda por ID o Folio
    if (searchTerm) {
      const term = searchTerm.toLowerCase().trim();
      resultado = resultado.filter(
        (l) => 
          l.id.toLowerCase().includes(term) || 
          (l.folio && l.folio.toLowerCase().includes(term))
      );
    }

    // Ordenar por fecha_creacion (si no hay fecha, poner al final)
    resultado.sort((a, b) => {
      const da = a.fecha_creacion ? new Date(a.fecha_creacion).getTime() : 0;
      const db = b.fecha_creacion ? new Date(b.fecha_creacion).getTime() : 0;
      return sortAsc ? da - db : db - da;
    });

    setLicencias(resultado);
  }, [allLicencias, filterDate, filterEstado, sortAsc, searchTerm]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <LoadingSpinner size="large" text="Cargando mis licencias..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 w-full overflow-x-hidden dark:bg-app dark:bg-none">
      <Navbar />
      <main className="flex-1 w-full">
        <BannerSection />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-5xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-blue-100 p-3 rounded-full mr-4">
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900">
                    Mis Licencias
                  </h1>
                  <p className="text-gray-600 mt-2">
                    Revisa el estado de tus solicitudes
                  </p>
                </div>
              </div>

              {/* Controles de filtro */}
              <div className="mt-6 flex items-center gap-4 flex-wrap justify-center">
                {/* Buscador por ID o Folio */}
                <div className="flex items-center gap-2">
                  <label htmlFor="search" className="text-sm text-gray-600">
                    Buscar (ID o Folio)
                  </label>
                  <div className="flex items-center gap-2 border border-gray-200 bg-white px-2 py-1 rounded-md">
                    <Search className="h-4 w-4 text-gray-500" />
                    <input
                      id="search"
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Ej: 12 o FOL-2025-0012"
                      className="outline-none text-sm w-32"
                    />
                  </div>
                </div>

                {/* Filtro por fecha */}
                <div className="flex items-center gap-2">
                  <label htmlFor="filterDate" className="text-sm text-gray-600">
                    Fecha (Emisión)
                  </label>
                  <input
                    id="filterDate"
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    disabled={isRefreshing}
                    className="border border-gray-200 bg-white px-3 py-1 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#048FD4] dark:bg-transparent dark:border-app dark:text-text disabled:opacity-50"
                  />
                </div>

                {/* Orden asc/desc */}
                <button
                  onClick={() => setSortAsc((prev) => !prev)}
                  disabled={isRefreshing}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-white/90 hover:bg-white rounded-md border border-gray-200 text-sm font-medium shadow-sm dark:bg-surface dark:border-app dark:text-text dark:hover:bg-surface/80 disabled:opacity-50"
                >
                  {sortAsc ? "Ascendente ▲" : "Descendente ▼"}
                </button>

                {/* Filtro por estado */}
                <div className="flex items-center gap-2">
                  <label htmlFor="filterEstado" className="text-sm text-gray-600">
                    Estado
                  </label>
                  <select
                    id="filterEstado"
                    value={filterEstado}
                    onChange={(e) => setFilterEstado(e.target.value)}
                    disabled={isRefreshing}
                    className="border border-gray-200 bg-white px-3 py-1 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#048FD4] dark:bg-transparent dark:border-app dark:text-text disabled:opacity-50"
                  >
                    <option value="">Todos</option>
                    {estadosUnicos.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Botón refresh */}
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isRefreshing ? (
                    <>
                      <LoadingSpinner size="small" color="white" />
                      Actualizando...
                    </>
                  ) : (
                    "Actualizar"
                  )}
                </button>

                {/* Botón limpiar */}
                <button
                  onClick={() => {
                    setFilterDate("");
                    setFilterEstado("");
                    setSortAsc(false);
                    setSearchTerm("");
                  }}
                  disabled={isRefreshing}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-white/90 hover:bg-white rounded-md border border-gray-200 text-sm dark:bg-surface dark:border-app dark:text-muted disabled:opacity-50"
                >
                  Limpiar filtros
                </button>
              </div>
            </div>
          </div>

          {/* Badges/Contadores */}
          <div className="flex gap-4 mb-6 justify-center">
            <span className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
              Pendientes
              <span className="bg-yellow-600 text-white rounded-full px-2 py-0.5 ml-1 text-xs">
                {pendientes}
              </span>
            </span>
            <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
              Aceptadas
              <span className="bg-green-600 text-white rounded-full px-2 py-0.5 ml-1 text-xs">
                {aceptadas}
              </span>
            </span>
            <span className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
              Rechazadas
              <span className="bg-red-600 text-white rounded-full px-2 py-0.5 ml-1 text-xs">
                {rechazadas}
              </span>
            </span>
            <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
              Totales
              <span className="bg-blue-600 text-white rounded-full px-2 py-0.5 ml-1 text-xs">
                {total}
              </span>
            </span>
          </div>

          {/* Tabla */}
          {licencias.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
              <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <Clock className="h-12 w-12 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-700 mb-3">
                {allLicencias.length === 0 ? "No hay licencias registradas" : "No hay resultados"}
              </h2>
              <p className="text-gray-500 text-lg">
                {allLicencias.length === 0 
                  ? "Aún no has solicitado ninguna licencia médica." 
                  : "No se encontraron resultados según tus filtros o búsqueda."}
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
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Folio
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Acción
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {licencias.map((licencia) => (
                      <tr
                        key={licencia.id}
                        className="hover:bg-blue-50 transition-colors duration-200"
                      >
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="text-sm space-y-1">
                            <div className="flex items-center text-gray-900">
                              <span className="font-medium text-blue-600">
                                Emisión:
                              </span>
                              <span className="ml-2">{licencia.fecha_creacion || "-"}</span>
                            </div>
                            <div className="flex items-center text-gray-900">
                              <span className="font-medium text-green-600">
                                Inicio:
                              </span>
                              <span className="ml-2">{licencia.fechaInicioReposo || "-"}</span>
                            </div>
                            <div className="flex items-center text-gray-900">
                              <span className="font-medium text-red-600">Fin:</span>
                              <span className="ml-2">{licencia.fechaFinReposo || "-"}</span>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-5 whitespace-nowrap">
                          <span
                            className={`px-3 py-2 inline-flex text-sm leading-5 font-semibold rounded-full border ${
                              licencia.estado === "aceptado"
                                ? "bg-green-100 text-green-800 border-green-200"
                                : licencia.estado === "rechazado"
                                ? "bg-red-100 text-red-800 border-red-200"
                                : "bg-yellow-100 text-yellow-800 border-yellow-200"
                            }`}
                          >
                            {licencia.estadoNormalized}
                          </span>
                        </td>

                        <td className="px-6 py-5 whitespace-nowrap">
                          {licencia.folio ? (
                            <span className="px-2 py-1 text-xs font-semibold rounded-md bg-blue-100 text-blue-800 border border-blue-200">
                              {licencia.folio}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>

                        <td className="px-6 py-5 whitespace-nowrap text-center">
                          <Link
                            to={`/detalle-licencia/${licencia.id}`}
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
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}