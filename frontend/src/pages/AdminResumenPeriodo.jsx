import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Users, Download, Calendar, BookOpen, User, ChevronDown, ChevronUp } from "lucide-react";
import { BarChart3, Download, Filter } from "lucide-react";
import { useTranslation } from "react-i18next";
import LoadingSpinner from "../components/LoadingSpinner";

// =============================== API FUNCTIONS ===============================
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

// Obtener cursos con matrículas
async function getCursosMatriculas() {
  return apiRequest("/admin/cursos-matriculas");
}

// Obtener periodos
async function getPeriodos() {
  return apiRequest("/periodos");
}

// =============================== MAIN COMPONENT ===============================
export default function AdminResumenPeriodo() {
  const { t } = useTranslation();
  const [periodos, setPeriodos] = useState([]);
  const [periodoSel, setPeriodoSel] = useState("");
  const [cursosRaw, setCursosRaw] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState({});

  // 1) Cargar TODOS los cursos+matrículas y periodos
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🔄 Cargando datos de resumen...');
        
        const [cursosData, periodosData] = await Promise.all([
          getCursosMatriculas(),
          getPeriodos()
        ]);

        console.log('📊 Cursos recibidos:', cursosData);
        console.log('📅 Periodos recibidos:', periodosData);

        // Verificar estructura de datos
        if (!Array.isArray(cursosData)) {
          throw new Error("Formato de datos inválido: se esperaba array de cursos");
        }

        setCursosRaw(cursosData);
        setPeriodos(periodosData);

        // Seleccionar periodo activo por defecto, o el primero
        const periodoActivo = periodosData.find(p => p.activo);
        const periodoDefault = periodoActivo || (periodosData.length > 0 ? periodosData[0] : null);
        
        if (periodoDefault) {
          setPeriodoSel(String(periodoDefault.id_periodo));
          console.log('🎯 Periodo seleccionado por defecto:', periodoDefault.codigo);
        }

      } catch (err) {
        console.error('[AdminResumenPeriodo] error cargando datos:', err);
        setError(err.message || "Error al cargar cursos y matrículas");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 2) Filtrar cursos cuando cambia el periodo seleccionado
  useEffect(() => {
    if (!periodoSel || !cursosRaw.length) {
      setCursos([]);
      return;
    }

    console.log('🔍 Filtrando cursos para periodo:', periodoSel);
    
    const filtrados = cursosRaw.filter(
      (c) => c.periodo && String(c.periodo.id_periodo) === String(periodoSel)
    );

    console.log('📚 Cursos filtrados:', filtrados.length);

    const adaptados = filtrados.map((c) => ({
      id_curso: c.id_curso,
      codigo: c.codigo,
      nombre_curso: c.nombre_curso,
      semestre: c.semestre,
      seccion: c.seccion,
      profesor: c.profesor ? {
        nombre: c.profesor.nombre,
        correo: c.profesor.correo
      } : null,
      matriculados: (c.matriculados || []).map((m) => ({
        id_estudiante: m.id_estudiante,
        nombre: m.nombre || 'Estudiante sin nombre',
        correo: m.correo,
        fecha_matricula: m.fecha_matricula
      })),
      periodo: c.periodo
    }));

    setCursos(adaptados);
    setExpanded({});
  }, [periodoSel, cursosRaw]);

  // 3) Exportar CSV mejorado
  const exportarCSV = () => {
    const periodoNombre = periodos.find(p => String(p.id_periodo) === String(periodoSel))?.codigo || 'sin_periodo';
    
    let csv = "Código,Nombre del Curso,Semestre,Sección,Profesor,Total Matriculados,Estudiantes\n";
    
    cursos.forEach((c) => {
      const estudiantesNombres = c.matriculados.map(m => m.nombre).join('; ');
      csv += `"${c.codigo}","${c.nombre_curso}",${c.semestre},${c.seccion},"${c.profesor?.nombre || 'Sin profesor'}",${c.matriculados.length},"${estudiantesNombres}"\n`;
    });
    
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `resumen_cursos_${periodoNombre}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

    if (loading && periodos.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100 dark:bg-app dark:bg-none">
        <LoadingSpinner size="large" text="Cargando resumen de períodos..." />
      </div>
    );
  }

  // 4) Toggle expandir/contraer todos
  const toggleAll = () => {
    if (Object.keys(expanded).length === cursos.length) {
      // Contraer todos
      setExpanded({});
    } else {
      // Expandir todos
      const allExpanded = {};
      cursos.forEach((_, index) => {
        allExpanded[index] = true;
      });
      setExpanded(allExpanded);
    }
  };

  const periodoActual = periodos.find(p => String(p.id_periodo) === String(periodoSel));
  const totalMatriculados = cursos.reduce((sum, curso) => sum + curso.matriculados.length, 0);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 dark:bg-app dark:bg-none">
      <Navbar />
      <main className="flex-1 w-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-7xl">
          {/* Header Section */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-100 p-3 rounded-full">
                  <BarChart3 className="h-7 w-7 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                    Resumen de Periodo
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Visualiza cursos, profesores y matrículas del periodo
                    seleccionado.
                  </p>
                </div>
              </div>

              {/* Filtros */}
              <div className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-12 md:col-span-6">
                  <label
                    htmlFor="periodo"
                    className="block text-xs font-medium text-gray-600 mb-1"
                  >
                    Periodo
                  </label>
                  <select
                    id="periodo"
                    value={periodoSel}
                    onChange={(e) => setPeriodoSel(e.target.value)}
                    className="w-full border border-gray-200 bg-white px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#048FD4]"
                    disabled={loading || periodos.length === 0}
                  >
                    {periodos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-12 md:col-span-6">
                  <div className="flex items-center justify-between gap-2">
                    {periodos.find((p) => p.id === periodoSel && p.activo) && (
                      <span className="inline-block bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 rounded-full px-3 py-1 text-xs font-semibold">
                        Activo
                      </span>
                    )}
                    <button
                      onClick={exportarCSV}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm"
                      disabled={loading || cursos.length === 0}
                    >
                      <Download className="h-4 w-4" />
                      Exportar CSV
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 text-center shadow-sm">
              <div className="font-semibold">Error al cargar datos</div>
              <div className="text-sm mt-1">{error}</div>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <div className="flex items-center justify-center py-16 text-gray-600">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                Cargando cursos...
              </div>
            </div>
          ) : cursos.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
              <div className="text-center text-gray-500 text-sm py-16">
                No hay cursos para este periodo.
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Código
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Nombre
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Profesor
                      </th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Matriculados
                      </th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Acción
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {cursos.map((curso, idx) => (
                      <React.Fragment key={curso.codigo}>
                        <tr className="hover:bg-blue-50 transition-colors">
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                            {curso.codigo}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-800">
                            {curso.nombre}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-800">
                            {curso.profesor}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-block bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-xs font-semibold">
                              {curso.matriculados.length}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() =>
                                setExpanded((prev) => ({
                                  ...prev,
                                  [idx]: !prev[idx],
                                }))
                              }
                              className="inline-flex items-center gap-2 px-3 py-2 bg-white hover:bg-blue-50 text-blue-700 text-sm font-medium rounded-lg border border-blue-200 transition-all shadow-sm"
                            >
                              {expanded[idx] ? "Ocultar" : "Ver"}
                            </button>
                          </td>
                        </tr>
                        {expanded[idx] && (
                          <tr className="bg-blue-50/50">
                            <td colSpan={5} className="px-6 py-4">
                              <div className="space-y-2">
                                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                  Estudiantes matriculados
                                </p>
                                <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                  {curso.matriculados.map((est, i) => (
                                    <li
                                      key={i}
                                      className="text-sm text-gray-700 bg-white rounded px-3 py-2 border border-gray-100"
                                    >
                                      {est.nombre}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
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