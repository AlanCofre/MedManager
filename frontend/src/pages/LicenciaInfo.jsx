import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BannerSection from "../components/BannerSection";
import { CheckCircle, XCircle, Clock, Calendar, User, Search, Eye } from "lucide-react";
import { licenciasRealService } from "../services/licenciasRealService";

export default function HistorialLicencias() {
  const { t } = useTranslation();

  const [licencias, setLicencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

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
        const response = await licenciasRealService.getLicenciasResueltas();
        const licenciasData = response.data || [];
        const normalizadas = licenciasData.map(normalizeItem).filter(Boolean);
        setLicencias(normalizadas);
      } catch (e) {
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
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>{t("historialLicencias.loading")}</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (err) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md">
            <h2>{t("historialLicencias.errorTitle")}</h2>
            <p className="text-red-600 mb-4">{err}</p>
            <button onClick={() => window.location.reload()}>
              {t("historialLicencias.retry")}
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <BannerSection />

      <main className="flex-1 w-full">
        <div className="container mx-auto py-10">

          <h1>{t("historialLicencias.title")}</h1>
          <p>{t("historialLicencias.subtitle")}</p>

          {/* filtros */}
          <input
            type="text"
            placeholder={t("historialLicencias.filters.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <button onClick={() => setSortAsc(p => !p)}>
            {sortAsc
              ? t("historialLicencias.filters.asc")
              : t("historialLicencias.filters.desc")}
          </button>

          <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)}>
            <option value="">{t("historialLicencias.filters.all")}</option>
            <option value="Verificada">{t("historialLicencias.filters.verified")}</option>
            <option value="Rechazada">{t("historialLicencias.filters.rejected")}</option>
          </select>

          <button onClick={() => {
            setSearchTerm("");
            setSortAsc(false);
            setFilterDate("");
            setFilterEstado("");
          }}>
            {t("historialLicencias.filters.clear")}
          </button>

          {/* tabla */}
          {licenciasFiltradas.length === 0 ? (
            <div>
              <h2>{t("historialLicencias.empty.title")}</h2>
              <p>{t("historialLicencias.empty.subtitle")}</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>{t("historialLicencias.table.student")}</th>
                  <th>{t("historialLicencias.table.dates")}</th>
                  <th>{t("historialLicencias.table.status")}</th>
                  <th>{t("historialLicencias.table.detail")}</th>
                </tr>
              </thead>
              <tbody>
                {licenciasFiltradas.map((lic) => (
                  <tr key={lic.id}>
                    <td>
                      {lic.estudiante} ({t("historialLicencias.table.id")}: {lic.id})
                    </td>
                    <td>
                      {t("historialLicencias.table.emission")}: {lic.fechaEmision}
                      <br />
                      {t("historialLicencias.table.start")}: {lic.fechaInicioReposo}
                      <br />
                      {t("historialLicencias.table.end")}: {lic.fechaFinReposo}
                    </td>
                    <td>
                      {lic.estado === "Verificada"
                        ? t("historialLicencias.filters.verified")
                        : t("historialLicencias.filters.rejected")}
                    </td>
                    <td>
                      <button onClick={() => navigate(`/licencias-evaluadas/${lic.id}`)}>
                        {t("historialLicencias.table.viewDetail")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}