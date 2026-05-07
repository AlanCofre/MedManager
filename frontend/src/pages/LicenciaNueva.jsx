import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const STORAGE_KEY = "licencia_cursos_seleccionados";

export default function LicenciaNueva() {
  const { t } = useTranslation();

  const [cursos, setCursos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [periodoActivo, setPeriodoActivo] = useState(true);
  const [selected, setSelected] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchCursos();
    // eslint-disable-next-line
  }, []);

  async function fetchCursos() {
    try {
      await new Promise((r) => setTimeout(r, 700));

      const data = [
        { codigo: "INF-101", nombre: "Programación I", seccion: "A", profesor: "Rumencio González" },
        { codigo: "MAT-201", nombre: "Matemáticas II", seccion: "B", profesor: "Ana Martínez" },
      ];

      setCursos(data);
      setPeriodoActivo(true);
    } catch (err) {
      if (err.status === 409) {
        setPeriodoActivo(false);
      } else {
        setError(t("licenciaNueva.error.load"));
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selected));
  }, [selected]);

  const cursosFiltrados = cursos.filter(
    (c) =>
      c.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-blue-50 dark:bg-app dark:bg-none">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">

        <h1 className="text-2xl font-bold mb-6">
          {t("licenciaNueva.title")}
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-center mb-4">
            {error}
            <button
              className="ml-4 text-sm text-blue-700 underline"
              onClick={fetchCursos}
            >
              {t("licenciaNueva.error.retry")}
            </button>
          </div>
        )}

        {!periodoActivo ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800 text-center">
            {t("licenciaNueva.noPeriodo")}
          </div>
        ) : loading ? (
          <div className="text-center text-gray-500">
            {t("licenciaNueva.loading")}
          </div>
        ) : cursos.length === 0 ? (
          <div className="bg-white dark:bg-surface rounded-lg border dark:border-app p-6 text-center">
            {t("licenciaNueva.empty.noCursos")}{" "}
            <a
              href="/estudiante/mis-matriculas"
              className="text-blue-600 underline"
            >
              {t("licenciaNueva.empty.verMatriculas")}
            </a>
          </div>
        ) : (
          <div className="bg-white dark:bg-surface rounded-lg border dark:border-app p-6">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-2">
              <input
                type="text"
                placeholder={t("licenciaNueva.search.placeholder")}
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none"
                aria-label={t("licenciaNueva.search.aria")}
              />
              <span className="text-xs text-gray-400 dark:text-muted sm:ml-4">
                {t("licenciaNueva.search.help")}
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {cursosFiltrados.length === 0 ? (
                <div className="text-gray-500 text-center">
                  {t("licenciaNueva.search.noResults")}
                </div>
              ) : (
                cursosFiltrados.map((curso) => (
                  <label key={curso.codigo + curso.seccion} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(curso.codigo)}
                      onChange={(e) => {
                        setSelected((prev) =>
                          e.target.checked
                            ? [...prev, curso.codigo]
                            : prev.filter((c) => c !== curso.codigo)
                        );
                      }}
                    />
                    <span>
                      <b>{curso.codigo}</b> - {curso.nombre} (
                      {t("licenciaNueva.course.section")} {curso.seccion}) —{" "}
                      {t("licenciaNueva.course.professorPrefix")} {curso.profesor}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}