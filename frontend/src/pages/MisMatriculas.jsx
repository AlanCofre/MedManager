import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SkeletonList from "../components/SkeletonList";
import LoadingSpinner from "../components/LoadingSpinner";

const toast = { error: (msg) => alert(msg) };

export default function MisMatriculas() {
  const [matriculas, setMatriculas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error409, setError409] = useState(false);

  useEffect(() => {
    cargarMatriculas();
    // eslint-disable-next-line
  }, []);

  async function cargarMatriculas({ historicos = false } = {}) {
    setLoading(true);
    setError409(false);
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
      const token = localStorage.getItem('token');
      
      let url = `${API_BASE}/api/matriculas/mis-matriculas`;
      if (historicos) {
        url += '?historicos=true';
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 409) {
          setError409(true);
          return;
        }
        throw new Error(`Error ${response.status} al cargar matrículas`);
      }

      const result = await response.json();

      if (result.ok && result.data) {
        console.log('📦 Datos recibidos del backend:', result.data);
        
        // Transformar datos del backend al formato esperado
        const datosTransformados = result.data.map(periodo => ({
          periodo: periodo.periodo,
          nombre: periodo.periodo, // o puedes formatearlo: `Periodo ${periodo.periodo}`
          activo: periodo.es_periodo_actual,
          cursos: periodo.cursos.map(curso => ({
            codigo: curso.codigo,
            nombre: curso.nombre_curso,
            seccion: curso.seccion,
            profesor: curso.profesor?.nombre || "Por asignar",
            activo: periodo.es_periodo_actual // Los cursos heredan el estado del periodo
          }))
        }));

        // Ordenar periodos descendente
        const dataOrdenada = datosTransformados.sort((a, b) => b.periodo.localeCompare(a.periodo));
        
        // Ordenar cursos por nombre dentro de cada periodo
        dataOrdenada.forEach((periodo) => {
          if (periodo.cursos && periodo.cursos.length > 0) {
            periodo.cursos.sort((a, b) => a.nombre.localeCompare(b.nombre));
          }
        });
        
        setMatriculas(dataOrdenada);
      } else {
        setMatriculas([]);
      }
    } catch (err) {
      console.error('Error cargando matrículas:', err);
      if (err.status === 409) {
        setError409(true);
      } else {
        toast.error("Error al cargar matrículas. Intenta nuevamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  // ✅ Loading pantalla completa
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50 dark:bg-app dark:bg-none">
        <LoadingSpinner size="large" text="Cargando mis matrículas..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-blue-50 dark:bg-app dark:bg-none">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Mis Matrículas</h1>

        {error409 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-xl mx-auto text-center">
            <p className="text-yellow-800 mb-2">
              No hay un periodo académico activo en este momento.
            </p>
            <button
              onClick={() => cargarMatriculas({ historicos: true })}
              className="mt-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 transition"
            >
              Ver histórico de matrículas
            </button>
          </div>
        ) : matriculas.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-surface rounded-lg border dark:border-app max-w-xl mx-auto">
            <p className="text-gray-500 dark:text-muted">
              No se encontraron matrículas registradas.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {matriculas.map((periodo) => (
              <section
                key={periodo.periodo}
                className="bg-white dark:bg-surface rounded-lg border dark:border-app overflow-hidden shadow-sm"
              >
                {/* Header del periodo */}
                <div className="px-6 py-4 border-b dark:border-app flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Periodo {periodo.periodo}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {periodo.nombre}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-full ${
                      periodo.activo
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    {periodo.activo ? "Activo" : "Cerrado"}
                  </span>
                </div>

                {/* Lista de cursos */}
                <div className="divide-y dark:divide-app">
                  {periodo.cursos.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-muted">
                      <div className="text-lg mb-2">📚</div>
                      <p>No tienes cursos inscritos en este periodo.</p>
                    </div>
                  ) : (
                    periodo.cursos.map((curso, index) => (
                      <div
                        key={`${curso.codigo}-${curso.seccion}-${index}`}
                        className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-start gap-3">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-1">
                                  {curso.nombre}
                                </h3>
                                <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                                  <span>Código: {curso.codigo}</span>
                                  <span>Sección: {curso.seccion}</span>
                                  <span>Prof. {curso.profesor}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <span
                              className={`px-3 py-1 text-sm font-medium rounded-full ${
                                curso.activo
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                              }`}
                            >
                              {curso.activo ? "En curso" : "Completado"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}