import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BannerSection from "../components/BannerSection";
import signo from "../assets/SignoPregunta.png";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import LoadingSpinner from "../components/LoadingSpinner";

export default function ComoUsar() {
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { t } = useTranslation();

  const role = String(user?.role || "").toLowerCase();
  const isSecretary = role === "secretaria" || role === "secretary" || role === "funcionario";
  const isTeacher = role === "profesor" || role === "teacher";
  const isAdmin =
    role === "admin" || role === "administrador" || role === "administrator";

  useEffect(() => {
    const loadContent = async () => {
      setIsLoading(true);
      try {
        // Simular carga de contenido
        await new Promise((resolve) => setTimeout(resolve, 800));
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, []);

  // ✅ LOADING PANTALLA COMPLETA - Solo spinner
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <LoadingSpinner size="large" text="Cargando guía..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-blue-100 dark:bg-app dark:bg-none">
      <Navbar />

      {/* Banner reutilizado */}
      <BannerSection />

      <main className="flex-1 container mx-auto px-8 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-3">
            <div className="lg:col-span-2 p-12 lg:p-16">
              {isSecretary ? (
                <>
                  <h1 className="text-3xl lg:text-4xl font-bold mb-6">
                    {t("comoUsar.secretary.title")}
                  </h1>

                  <h2 className="text-lg font-semibold mb-3">
                    {t("comoUsar.secretary.objectiveTitle")}
                  </h2>
                  <p className="mb-4 text-gray-700">
                    {t("comoUsar.secretary.objectiveText")}
                  </p>

                  <h2 className="text-lg font-semibold mb-3">
                    {t("comoUsar.secretary.stepsTitle")}
                  </h2>
                  <ol className="list-decimal pl-6 space-y-3 text-gray-700 mb-6">
                    <li>{t("comoUsar.secretary.step1")}</li>
                    <li>{t("comoUsar.secretary.step2")}</li>
                    <li>{t("comoUsar.secretary.step3")}</li>
                    <li>{t("comoUsar.secretary.step4")}</li>
                    <li>{t("comoUsar.secretary.step5")}</li>
                  </ol>

                  <p className="mt-6 text-sm text-gray-500">
                    {t("comoUsar.secretary.footerNote")}
                  </p>
                </>
              ) : isTeacher ? (
                <>
                  <h1 className="text-3xl lg:text-4xl font-bold mb-6">
                    {t("comoUsar.teacher.title")}
                  </h1>

                  <h2 className="text-lg font-semibold mb-3">
                    {t("comoUsar.teacher.objectiveTitle")}
                  </h2>
                  <p className="mb-4 text-gray-700">
                    {t("comoUsar.teacher.objectiveText")}
                  </p>

                  <h2 className="text-lg font-semibold mb-3">
                    {t("comoUsar.teacher.stepsTitle")}
                  </h2>
                  <ol className="list-decimal pl-6 space-y-3 text-gray-700 mb-6">
                    <li>{t("comoUsar.teacher.step1")}</li>
                    <li>{t("comoUsar.teacher.step2")}</li>
                    <li>{t("comoUsar.teacher.step3")}</li>
                    <li>{t("comoUsar.teacher.step4")}</li>
                  </ol>

                  <p className="mt-6 text-sm text-gray-500">
                    {t("comoUsar.teacher.footerNote")}
                  </p>
                </>
              ) : isAdmin ? (
                <>
                  <h1 className="text-3xl lg:text-4xl font-bold mb-6">
                    {t("comoUsar.admin.title")}
                  </h1>

                  <h2 className="text-lg font-semibold mb-3">
                    {t("comoUsar.admin.objectiveTitle")}
                  </h2>
                  <p className="mb-4 text-gray-700">
                    {t("comoUsar.admin.objectiveText")}
                  </p>

                  <h2 className="text-lg font-semibold mb-3">
                    {t("comoUsar.admin.stepsTitle")}
                  </h2>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                    <li>{t("comoUsar.admin.step1")}</li>
                    <li>{t("comoUsar.admin.step2")}</li>
                    <li>{t("comoUsar.admin.step3")}</li>
                    <li>{t("comoUsar.admin.step4")}</li>
                  </ul>

                  <p className="mt-6 text-sm text-gray-500">
                    {t("comoUsar.admin.footerNote")}
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-3xl lg:text-4xl font-bold mb-6">
                    {t("comoUsar.default.title")}
                  </h1>

                  <p className="mb-4 text-gray-700">
                    {t("comoUsar.default.intro")}
                  </p>

                  <h2 className="text-lg font-semibold mb-3">
                    {t("comoUsar.default.stepsTitle")}
                  </h2>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li>{t("comoUsar.default.step1")}</li>
                    <li>{t("comoUsar.default.step2")}</li>
                    <li>{t("comoUsar.default.step3")}</li>
                    <li>{t("comoUsar.default.step4")}</li>
                  </ul>

                  <p className="mt-6 text-sm text-gray-500">
                    {t("comoUsar.default.footerNote")}
                  </p>
                </>
              )}
            </div>

            <div className="lg:col-span-1 flex items-center justify-center p-8 lg:p-12 bg-[var(--blue-50)]">
              <img
                src={signo}
                alt={t("comoUsar.common.imgAlt")}
                className="w-48 h-48 lg:w-56 lg:h-56 object-contain"
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
