import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BannerSection from "../components/BannerSection";
import { CheckCircle, XCircle, Clock, Calendar, User, GraduationCap, Search, Eye } from "lucide-react";
import { licenciasRealService } from "../services/licenciasRealService";
const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/,"") ?? "http://localhost:3000";
import LoadingSpinner from "../components/LoadingSpinner";

// Probaremos estos endpoints en orden hasta que uno devuelva 200
const LIST_PATH = "/api/licencias/resueltas";

// ---------- helpers ----------
function fmtDateOnly(d) {
  if (!d) return "-";
  try {
    const dd = typeof d === "string" ? new Date(d) : d;
    if (Number.isNaN(dd.getTime())) return String(d).slice(0, 10);
    return dd.toISOString().slice(0, 10);
  } catch { return String(d); }
}

function normalizeItem(raw) {
  if (!raw || typeof raw !== "object") return null;

  const usuario = raw.usuario || raw.Usuario || null;

  const id = raw.id_licencia || raw.id || raw.folio || raw.codigo || "-";
  const estudiante =
    (usuario && (usuario.nombre || usuario.nombre_completo)) ||
    raw.estudiante ||
    raw.nombre_estudiante ||
    raw.nombre ||
    (raw.id_usuario ? `Usuario #${raw.id_usuario}` : "-");


  const fechaEmision       = fmtDateOnly(raw.fecha_emision || raw.emision);
  const fechaEnvio         = fmtDateOnly(raw.fecha_creacion || raw.createdAt);
  const fechaInicioReposo  = fmtDateOnly(raw.fecha_inicio);
  const fechaFinReposo     = fmtDateOnly(raw.fecha_fin);
  const fechaRevision      = fmtDateOnly(raw.fecha_revision || raw.updatedAt);

  const e = String(raw.estado || raw.estado_final || raw.status || "").toLowerCase();
  const estado = e.includes("acept") || e.includes("aprob") || e.includes("verific")
    ? "Verificada"
    : e.includes("rechaz")
    ? "Rechazada"
    : "—";

  const comentario = raw.motivo_rechazo || raw.motivo || raw.comentario || "";

  return {
    id,
    estudiante,
    fechaEmision,
    fechaEnvio,
    fechaInicioReposo,
    fechaFinReposo,
    fechaRevision,
    estado,
    comentario,
  };
}

export default function HistorialLicencias() {
  const [licencias, setLicencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // filtros & orden
  const [searchTerm, setSearchTerm] = useState("");
  const [sortAsc, setSortAsc] = useState(false);
  const [filterDate, setFilterDate] = useState("");
  const [filterEstado, setFilterEstado] = useState("");

  const navigate = useNavigate();
  const token = useMemo(() => localStorage.getItem("token") || "", []);

useEffect(() => {
  const cargar = async () => {
    setLoading(true);
    setErr("");
    try {
      console.log("🔍 Cargando licencias resueltas...");
      const response = await licenciasRealService.getLicenciasResueltas();
      
      // Tu backend devuelve: { ok: true, data: [...], meta: {...} }
      const licenciasData = response.data || [];
      
      console.log("✅ Licencias resueltas cargadas:", licenciasData);
      
      let arr = licenciasData;
      
      // Normaliza + filtra vacíos
      const normalizadas = arr.map(normalizeItem).filter(Boolean);

      setLicencias(normalizadas);
    } catch (e) {
      console.error(e);
      setErr(e.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };
  cargar();
}, [token]);

  const licenciasFiltradas = licencias
    .filter(l => !searchTerm ? true : l.estudiante.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(l => (!filterEstado ? true : l.estado === filterEstado))
    .filter(l => (!filterDate ? true : l.fechaEmision === filterDate))
    .sort((a, b) => {
      const da = new Date(a.fechaEmision).getTime();
      const db = new Date(b.fechaEmision).getTime();
      return sortAsc ? da - db : db - da;
    });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100 dark:bg-app dark:bg-none">
        <LoadingSpinner size="large" text="Cargando historial..." />
      </div>
    );
  }

  if (err) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md">
            <h2 className="text-lg font-semibold mb-2">No se pudo cargar el historial</h2>
            <p className="text-sm text-red-600 mb-4">{err}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-black"
            >
              Reintentar
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 dark:bg-app dark:bg-none">
      <Navbar />
      <BannerSection />
      <main className="flex-1 w-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-7xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-green-100 p-3 rounded-full mr-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900">Historial de Licencias Médicas</h1>
                  <p className="text-gray-600 mt-2">Registros de licencias verificadas y rechazadas</p>
                </div>
              </div>

              {/* Controles */}
              <div className="mt-6 flex items-center gap-4 flex-wrap justify-center">
                {/* Fecha (emisión) */}
                <div className="flex items-center gap-2">
                  <label htmlFor="filterDate" className="text-sm text-gray-600">
                    Fecha (Emisión)
                  </label>
                  <input
                    id="filterDate"
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="border border-gray-200 bg-white px-3 py-1 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#048FD4]"
                  />
                </div>

                {/* Orden */}
                <button
                  onClick={() => setSortAsc((p) => !p)}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-white/90 hover:bg-white rounded-md border border-gray-200 text-sm font-medium shadow-sm"
                >
                  {sortAsc ? "Ascendente ▲" : "Descendente ▼"}
                </button>

                {/* Estado */}
                <div className="flex items-center gap-2">
                  <label htmlFor="filterEstado" className="text-sm text-gray-600">Estado</label>
                  <select
                    id="filterEstado"
                    value={filterEstado}
                    onChange={(e) => setFilterEstado(e.target.value)}
                    className="border border-gray-200 bg-white px-3 py-1 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#048FD4]"
                  >
                    <option value="">Todos</option>
                    <option value="Verificada">Verificada</option>
                    <option value="Rechazada">Rechazada</option>
                  </select>
                </div>

                {/* Buscar por estudiante */}
                <form onSubmit={(e) => e.preventDefault()} className="flex items-center w-full max-w-xs bg-white border border-gray-300 rounded-lg shadow-sm px-3 py-2">
                  <Search className="w-5 h-5 text-gray-400 mr-2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por estudiante..."
                    className="flex-1 outline-none text-gray-700 placeholder-gray-400"
                  />
                </form>

                {/* Limpiar */}
                <button
                  onClick={() => { setSearchTerm(""); setSortAsc(false); setFilterDate(""); setFilterEstado(""); }}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-white/90 hover:bg-white rounded-md border border-gray-200 text-sm text-gray-600"
                >
                  Limpiar filtros
                </button>
              </div>
            </div>
          </div>

          {/* Tabla */}
          {licenciasFiltradas.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
              <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <Clock className="h-12 w-12 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-700 mb-3">No hay registros en el historial</h2>
              <p className="text-gray-500 text-lg">No se encontraron licencias según los filtros.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-green-50 to-blue-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          Estudiante
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        <Calendar className="h-4 w-4 mr-2" />
                        Fechas
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Detalle
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {licenciasFiltradas.map((lic) => (
                      <tr key={lic.id} className="hover:bg-blue-50 transition-colors duration-200">
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="bg-blue-100 rounded-full p-2 mr-3">
                              <User className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">{lic.estudiante}</div>
                              <div className="text-xs text-gray-500">ID: {lic.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-sm space-y-1">
                          <div><span className="font-medium text-blue-600">Emisión:</span> {lic.fechaEmision}</div>
                          <div><span className="font-medium text-green-600">Inicio:</span> {lic.fechaInicioReposo}</div>
                          <div><span className="font-medium text-red-600">Fin:</span> {lic.fechaFinReposo}</div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          {lic.estado === "Verificada" ? (
                            <span className="px-3 py-2 inline-flex text-sm leading-5 font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">
                              <CheckCircle className="h-4 w-4 mr-1" /> Verificada
                            </span>
                          ) : (
                            <span className="px-3 py-2 inline-flex text-sm leading-5 font-semibold rounded-full bg-red-100 text-red-800 border border-red-200">
                              <XCircle className="h-4 w-4 mr-1" /> Rechazada
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-center">
                          <button
                            onClick={() => navigate(`/licencias-evaluadas/${lic.id}`)}
                            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalle
                          </button>
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
