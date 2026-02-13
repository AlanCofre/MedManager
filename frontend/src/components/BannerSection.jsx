import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import bannerImg from "../assets/banner-inicio.png";
/*Iconos*/
import {
  GraduationCap,
  CalendarCheck,
  UsersRound,
  BookOpen,
  CalendarRange,
  PieChart,
  HelpCircle
} from "lucide-react";

const BannerSection = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  const role = String(user?.role || "").toLowerCase();
  const isSecretary = role === "secretaria" || role === "secretary" || role === "funcionario";
  const isProfessor = role === "profesor" || role === "professor";
  const isAdmin = role === "admin" || role === "administrador" || role === "administrator";

  return (
    <>
      {/* Banner superior con imagen de fondo */}
      <section className="relative bg-gradient-to-r from-[var(--blue-600)] to-[var(--blue-400)] h-[300px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-right opacity-100 pointer-events-none"
          style={{
            backgroundImage: `url(${bannerImg})`,
            backgroundPosition: "right center",
          }}
        />
        <div className="relative z-10 h-full flex flex-col justify-center container mx-auto px-8">
          <h1 className="text-5xl md:text-6xl font-display font-bold text-white leading-tight max-w-2xl">
            {t("banner.titleLine1")}
            <br />
            {t("banner.titleLine2")}
          </h1>
        </div>
      </section>

      {/* Botonera inferior */}
      <div className="relative z-20 container mx-auto px-8 -mt-7 flex flex-wrap justify-center gap-8">
        {/* ¿Cómo se usa? (siempre visible) */}
        <Link to="/como-usar" className="inline-flex no-underline">
          <button className="bg-white text-gray-700 px-6 py-3 min-w-[260px] rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-between font-sans font-medium">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <HelpCircle className="w-4 h-4 text-blue-600" strokeWidth={2} />
              </div>
              <span>{t("banner.btnHowUse")}</span>
            </div>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </Link>

        {/* Variante para Administrador */}
        {isAdmin ? (
          <>
            {/* Vista de Cursos */}
            <Link to="/admin/cursos" className="inline-flex no-underline">
              <button className="bg-white text-gray-700 px-6 py-3 min-w-[260px] rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-between font-sans font-medium">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-orange-600" strokeWidth={2} />
                  </div>
                  <span>{t("banner.btnCursos", "Cursos")}</span>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </Link>

            {/* Vista de Matrículas */}
            <Link to="/admin/matriculas" className="inline-flex no-underline">
              <button className="bg-white text-gray-700 px-6 py-3 min-w-[260px] rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-between font-sans font-medium">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <UsersRound className="w-4 h-4 text-green-600" strokeWidth={2} />
                  </div>
                  <span>{t("banner.enrollments", "Matrículas")}</span>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </Link>

            {/* Gestión de Período Activo (activar/desactivar) */}
            <Link to="/admin/periodos" className="inline-flex no-underline">
              <button className="bg-white text-gray-700 px-6 py-3 min-w-[260px] rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-between font-sans font-medium">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                    <CalendarRange className="w-4 h-4 text-teal-600" strokeWidth={2} />
                  </div>
                  <span>{t("banner.btnPeriodos", "Periodos")}</span>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </Link>

            {/* Vista del Tablero (resumen cursos/matrículas por período) */}
            <Link to="/admin/periodo/resumen" className="inline-flex no-underline">
              <button className="bg-white text-gray-700 px-6 py-3 min-w-[260px] rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-between font-sans font-medium">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                    <PieChart className="w-4 h-4 text-amber-600" strokeWidth={2} />
                  </div>
                  <span>{t("banner.btnTablero", "Tablero")}</span>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </Link>
          </>
        ) : isProfessor ? (
          <>
            {/* Cursos (Profesor) */}
            <Link to="/profesor/licencias" className="inline-flex no-underline">
              <button className="bg-white text-gray-700 px-6 py-3 min-w-[260px] rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-between font-sans font-medium">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <GraduationCap className="w-4 h-4 text-orange-500" strokeWidth={2} />
                  </div>
                  <span>{t("banner.btnAlumnos", "Alumnos")}</span>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </Link>

            {/* Regularidad académica (Profesor) */}
            <Link to="/profesor/regularidad" className="inline-flex no-underline">
              <button className="bg-white text-gray-700 px-6 py-3 min-w-[260px] rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-between font-sans font-medium">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CalendarCheck className="w-4 h-4 text-green-600" strokeWidth={2} />
                  </div>
                  <span>{t("banner.btnRegularidad", "Regularidad académica")}</span>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </Link>
          </>
        ) : isSecretary ? (
          <>
            {/* Secretaría: Licencias por revisar */}
            <Link to="/licencias-por-revisar" className="inline-flex no-underline">
              <button className="bg-white text-gray-700 px-6 py-3 min-w-[260px] rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-between font-sans font-medium">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span>{t("banner.btnManage")}</span>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </Link>

            {/* Secretaría: Historial */}
            <Link to="/historial" className="inline-flex no-underline">
              <button className="bg-white text-gray-700 px-6 py-3 min-w-[260px] rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-between font-sans font-medium">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span>{t("banner.btnHistory")}</span>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </Link>
          </>
        ) : (
          <>
            {/* Estudiante (u otros): Generar revisión */}
            <Link to="/generar-revision" className="inline-flex no-underline">
              <button className="bg-white text-gray-700 px-6 py-3 min-w-[260px] rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-between font-sans font-medium">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span>{t("banner.btnGenerate")}</span>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </Link>

            {/* Estudiante (u otros): Mis licencias / resultados */}
            <Link to="/mis-licencias" className="inline-flex no-underline">
              <button className="bg-white text-gray-700 px-6 py-3 min-w-[260px] rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-between font-sans font-medium">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span>{t("banner.btnResults")}</span>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </Link>

            <Link to="/estudiante/mis-matriculas" className="inline-flex no-underline">
              <button className="bg-white text-gray-700 px-6 py-3 min-w-[260px] rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-between font-sans font-medium">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <UsersRound className="w-4 h-4 text-purple-600" strokeWidth={2} />
                  </div>
                  <span>{t("banner.btnMatriculas", "Matrículas")}</span>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </Link>
          </>
        )}
      </div>
    </>
  );
};

export default BannerSection;