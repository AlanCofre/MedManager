import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BannerSection from "../components/BannerSection";
import Announcement from "../components/Announcement";
import LoadingSpinner from "../components/LoadingSpinner";

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState(null);

  // Datos de ejemplo si se requieren más adelante (se eliminó SummaryCards)
  const lastLicense = {
    type: "Licencia médica por gripe",
    date: "2024-03-15",
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        // Simular carga de datos
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setData({ loaded: true });
      } catch (error) {
        console.error("Error loading dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // ✅ LOADING PANTALLA COMPLETA - Solo spinner
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100 dark:bg-app dark:bg-none">
        <LoadingSpinner size="large" text="Cargando dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-blue-100 dark:bg-app dark:bg-none">
      <Navbar />

      <main id="main-content" className="flex-1">
        <BannerSection />

        {/* Espacio para contenido principal */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <Announcement />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}