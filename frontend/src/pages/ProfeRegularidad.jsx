import React, { useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AlertaLicenciasAnual from "../components/AlertaLicenciasAnual";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../context/AuthContext";
import { useEstudiantesProfesor } from "../hooks/useRegularidad";
import { Clock, Search, Eye, AlertTriangle, CheckCircle, Info } from "lucide-react";

// Componente para mostrar el badge de regularidad
const BadgeRegularidad = ({ regularidad }) => {
  if (!regularidad) return null;

  const { categoria_regularidad, total_licencias_aceptadas } = regularidad;
  
  const getBadgeConfig = () => {
    switch (categoria_regularidad) {
      case 'Alta regularidad':
        return { 
          color: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300', 
          icon: CheckCircle,
          label: 'Alta regularidad'
        };
      case 'Media regularidad':
        return { 
          color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300', 
          icon: AlertTriangle,
          label: 'Media regularidad'
        };
      case 'Baja regularidad':
        return { 
          color: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300', 
          icon: AlertTriangle,
          label: 'Baja regularidad'
        };
      default:
        return { 
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300', 
          icon: Info,
          label: 'Sin información'
        };
    }
  };

  const config = getBadgeConfig();
  const IconComponent = config.icon;

  return (
    <div className="flex flex-col gap-2">
      <span className={`inline-flex items-center gap-2 min-w-[140px] px-4 py-2 rounded-full text-sm font-semibold ${config.color}`}>
        <IconComponent className="h-4 w-4" />
        {config.label}
      </span>
      <div className="text-xs text-gray-500 dark:text-muted text-center">
        {total_licencias_aceptadas} {total_licencias_aceptadas === 1 ? 'licencia aceptada' : 'licencias aceptadas'}
      </div>
    </div>
  );
};

// Componente para mostrar iniciales del nombre
const AvatarEstudiante = ({ nombre }) => {
  const iniciales = useMemo(() => {
    const partes = nombre.trim().split(/\s+/);
    if (partes.length === 0) return "";
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  }, [nombre]);

  return (
    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center font-semibold text-blue-800 dark:text-blue-300">
      {iniciales}
    </div>
  );
};

// Componente para la tabla de estudiantes
const TablaEstudiantes = ({ estudiantes, onVerDetalle }) => {
  if (estudiantes.length === 0) {
    return (
      <div className="bg-white dark:bg-surface rounded-2xl shadow p-8 text-center">
        <p className="text-gray-500 dark:text-muted">No se encontraron estudiantes para los filtros seleccionados.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-surface rounded-2xl shadow overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-app/40">
          <tr>
            <th className="text-left px-6 py-3 dark:text-blue-200">Estudiante</th>
            <th className="text-left px-6 py-3 dark:text-blue-200">Curso</th>
            <th className="text-left px-6-3 dark:text-blue-200">Licencias Aceptadas</th>
            <th className="text-left px-6 py-3 dark:text-blue-200">Nivel de Regularidad</th>
            <th className="px-6 py-3 text-center dark:text-blue-200">Acción</th>
          </tr>
        </thead>
        <tbody>
          {estudiantes.map((estudiante) => (
            <tr key={estudiante.id} className="hover:bg-blue-50 dark:hover:bg-app/20 border-b dark:border-app">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <AvatarEstudiante nombre={estudiante.nombre} />
                  <div>
                    <div className="font-medium dark:text-white">{estudiante.nombre}</div>
                    <div className="text-xs text-gray-500 dark:text-muted">{estudiante.legajo}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 dark:text-white">
                <div className="font-medium">{estudiante.curso}</div>
              </td>
              <td className="px-6 py-4 dark:text-white text-center font-semibold">
                {estudiante.regularidad?.total_licencias_aceptadas || 0}
              </td>
              <td className="px-6 py-4">
                <BadgeRegularidad regularidad={estudiante.regularidad} />
              </td>
              <td className="px-6 py-4 text-center">
                <button
                  onClick={() => onVerDetalle(estudiante.id)}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded hover:from-blue-700 hover:to-indigo-700 transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  Ver Detalle
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Componente de leyenda
const LeyendaRegularidad = () => (
  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
    <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Leyenda de Regularidad</h3>
    <div className="flex flex-wrap gap-4 text-sm">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        <span className="text-gray-600 dark:text-muted">Alta regularidad (0-2 licencias aceptadas)</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
        <span className="text-gray-600 dark:text-muted">Media regularidad (3-5 licencias aceptadas)</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
        <span className="text-gray-600 dark:text-muted">Baja regularidad (6+ licencias aceptadas)</span>
      </div>
    </div>
    <p className="text-xs text-gray-500 dark:text-muted mt-2">
      * Basado en licencias médicas aceptadas durante el año actual {new Date().getFullYear()}
    </p>
  </div>
);

export default function ProfesorRegularidad() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const role = String(user?.role || "").toLowerCase();
  const isTeacher = role === "profesor" || role === "teacher";
  const isAdmin = role === "admin" || role === "administrador" || role === "administrator";
  const año = new Date().getFullYear();

  const [filterCourse, setFilterCourse] = useState("");
  const [search, setSearch] = useState("");

  // Verificar permisos
  const role = String(user?.role || "").toLowerCase();
  const isAllowed = ['profesor', 'teacher', 'admin', 'administrador', 'administrator'].includes(role);
  
  if (!isAllowed) {
    navigate('/');
    return null;
  }

  // Filtrar estudiantes
  const estudiantesFiltrados = useMemo(() => {
    return estudiantes.filter(estudiante => {
      const matchCurso = !filterCurso || estudiante.curso.toLowerCase().includes(filterCurso.toLowerCase());
      const matchSearch = !search || 
        estudiante.nombre.toLowerCase().includes(search.toLowerCase()) ||
        estudiante.legajo.toLowerCase().includes(search.toLowerCase());
      return matchCurso && matchSearch;
    });
  }, [estudiantes, filterCurso, search]);

  // Obtener cursos únicos para el filtro
  const cursosUnicos = useMemo(() => {
    return [...new Set(estudiantes.map(e => e.curso))].sort();
  }, [estudiantes]);

  const handleVerDetalle = (idEstudiante) => {
    navigate(`/profesor/regularidad/${idEstudiante}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-blue-50 dark:bg-app dark:bg-none">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-10 max-w-6xl flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg dark:text-white">Cargando información de regularidad...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-blue-50 dark:bg-app dark:bg-none">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-10 max-w-6xl">
          <div className="bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg p-6">
            <h2 className="text-red-800 dark:text-red-300 font-semibold mb-2">Error</h2>
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

      return { ...st, validated, lastUpload, uploadedLastMonth, missedDays, missedPercent, status, licporAño, cantidadAño, excedeLicencias };
    });
  }, []);

  const filtered = useMemo(() => {
    return enriched.filter((s) => {
      if (filterCourse && `${s.course} - ${s.section}` !== filterCourse) return false;
      if (search) {
        const q = search.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.legajo.toLowerCase().includes(q);
      }
      return true;
    });
  }, [enriched, filterCourse, search]);

  useEffect(() => {
    const loadData = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100 dark:bg-app dark:bg-none">
        <LoadingSpinner size="large" text="Cargando regularidad de estudiantes..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-blue-50 dark:bg-app dark:bg-none">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-6xl">
        {/* Header */}
        <div className="bg-white dark:bg-surface rounded-2xl shadow p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
              <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold dark:text-blue-200">Regularidad Académica</h1>
              <p className="text-gray-600 dark:text-muted">
                Visualización de la regularidad de estudiantes basada en licencias médicas aceptadas en el año actual
              </p>
            </div>
          </div>

          {/* Filtros */}
          <div className="mt-6 flex gap-4 flex-wrap items-center">
            <div>
              <label className="text-sm text-gray-600 dark:text-muted block mb-1">Filtrar por curso:</label>
              <select 
                value={filterCurso} 
                onChange={(e) => setFilterCurso(e.target.value)} 
                className="border dark:border-app dark:bg-surface dark:text-white px-3 py-2 rounded"
              >
                <option value="">Todos los cursos</option>
                {cursosUnicos.map((curso) => (
                  <option key={curso} value={curso}>{curso}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-600 dark:text-muted block mb-1">Buscar estudiante:</label>
              <div className="relative">
                <input 
                  placeholder="Nombre o legajo..." 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                  className="pl-10 pr-3 py-2 border dark:border-app dark:bg-surface dark:text-white rounded w-64"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-surface rounded-2xl shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-blue-200 uppercase tracking-wider">
                  Estudiante
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-blue-200 uppercase tracking-wider">
                  Ramo
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-blue-200 uppercase tracking-wider">
                  Última subida
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-blue-200 uppercase tracking-wider">
                  Licencias (30d)
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-blue-200 uppercase tracking-wider">
                  Faltas estimadas
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-blue-200 uppercase tracking-wider w-32">
                  Estado
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 dark:text-blue-200 uppercase tracking-wider">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <React.Fragment key={s.id}>
                  <tr className="hover:bg-blue-50 dark:hover:bg-app/20 border-b dark:border-app">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center font-semibold text-blue-800 dark:text-blue-300">{initialsFromName(s.name)}</div>
                        <div>
                          <div className="font-medium dark:text-white">{s.name}</div>
                          <div className="text-xs text-gray-500 dark:text-muted">{s.legajo}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 dark:text-white">
                      <div className="font-medium">{s.course} · {s.section}</div>
                    </td>
                    <td className="px-6 py-4 dark:text-white">{s.lastUpload || "-"}</td>
                    <td className="px-6 py-4 dark:text-white">{s.uploadedLastMonth}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm dark:text-white">
                        <div>{s.missedDays} días</div>
                        <div className="text-xs text-gray-500 dark:text-muted">{s.missedPercent}% del periodo</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center justify-center min-w-[120px] px-4 py-2 rounded-full text-sm font-semibold ${
                        s.missedPercent >= ATTENDANCE_THRESHOLD_PERCENT ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" :
                        s.status === "Afecta" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300" :
                        "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                      }`}>
                        {s.missedPercent >= ATTENDANCE_THRESHOLD_PERCENT ? "En riesgo" : s.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Link to={`/profesor/regularidad/${s.id}`} className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded hover:from-blue-700 hover:to-indigo-700">
                        <Eye className="h-4 w-4" />
                        Ver
                      </Link>
                    </td>
                  </tr>
                  {/* Fila expandida con alerta de licencias anuales si excede */}
                  {s.excedeLicencias && (
                    <tr className="bg-red-50 dark:bg-red-900/20">
                      <td colSpan={7} className="px-6 py-3">
                        <AlertaLicenciasAnual licenciasporAño={s.licporAño} año={año} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-gray-600 dark:text-muted">
                    No se encontraron estudiantes para los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
      <Footer />
    </div>
  );
}