import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BannerSection from "../components/BannerSection";
import Announcement from "../components/Announcement";
import NotificacionesSecretaria from "../components/NotificacionesSecretaria";
import LoadingSpinner from "../components/LoadingSpinner";
import SkeletonLoader from "../components/SkeletonLoader";

export default function DashboardSecretary() {
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Simular carga de datos secretaría
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setDashboardData({
        licenciasPendientes: 8,
        licenciasRevisadas: 25,
        alertas: 3,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100">
        <LoadingSpinner size="large" text="Cargando panel de secretaría..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-blue-100 dark:bg-app dark:bg-none">
      <Navbar />

      <main id="main-content" className="flex-1">
        {/* Banner (igual que en el inicio de alumno) */}
        <BannerSection />

        {/* Franja de botones / contenido y anuncio centrado como en la imagen */}
        <div className="container mx-auto px-8 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Mantengo el Announcement grande centrado */}
            <Announcement />
          </div>
        </div>
      </main>
      <NotificacionesSecretaria />
      <Footer />
    </div>
  );
}