import React, { useMemo, useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { Eye, FileDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import LoadingSpinner from "../components/LoadingSpinner";
import SkeletonLoader from "../components/SkeletonLoader";

// Reuse same mock dataset (duplicated for simplicity)
const studentsMock = [
  {
    id: "s1",
    name: "Rumencio González",
    legajo: "20201234",
    course: "INF101",
    section: "A",
    licenses: [
      {
        id: "123",
        estado: "validated",
        fechaEmision: "2025-09-27",
        inicio: "2025-10-01",
        fin: "2025-10-03",
      },
      {
        id: "124",
        estado: "rejected",
        fechaEmision: "2025-08-10",
        inicio: "2025-08-11",
        fin: "2025-08-12",
      },
    ],
  },
  {
    id: "s2",
    name: "Carlos Rodríguez",
    legajo: "20195678",
    course: "INF101",
    section: "A",
    licenses: [
      {
        id: "456",
        estado: "validated",
        fechaEmision: "2025-09-13",
        inicio: "2025-09-15",
        fin: "2025-09-16",
      },
    ],
  },
  {
    id: "s3",
    name: "Ana Martínez",
    legajo: "20221122",
    course: "DER201",
    section: "B",
    licenses: [
      {
        id: "789",
        estado: "validated",
        fechaEmision: "2025-10-01",
        inicio: "2025-09-01",
        fin: "2025-09-20",
      },
      {
        id: "790",
        estado: "validated",
        fechaEmision: "2025-10-05",
        inicio: "2025-10-01",
        fin: "2025-10-05",
      },
    ],
  },
];

function daysBetween(a, b) {
  const da = new Date(a);
  const db = new Date(b);
  if (isNaN(da) || isNaN(db)) return 0;
  return Math.max(0, Math.round((db - da) / (24 * 3600 * 1000)) + 1);
}

export default function EstudianteRegularidad() {
  const { studentId } = useParams();
  const { user } = useAuth?.() ?? {};
  const role = String(user?.role || "").toLowerCase();
  const isTeacher = role === "profesor" || role === "teacher";
  const isAdmin =
    role === "admin" ||
    role === "administrador" ||
    role === "administrator";
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(true);
  const [regularidadData, setRegularidadData] = useState(null);

  // Si quieres volver a habilitar la protección por rol, descomenta este bloque
  /*
  if (!isTeacher && !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="bg-white p-8 rounded-xl shadow text-center">
            <h2 className="text-xl font-bold">
              {t("profRegularidad.accessDeniedTitle")}
            </h2>
            <p className="text-gray-600 mt-2">
              {t("profRegularidad.accessDeniedBody")}
            </p>
            <button
              onClick={() => navigate(-1)}
              className="mt-4 px-4 py-2 rounded border bg-white"
            >
              {t("profRegularidad.accessDeniedBack")}
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  */

  const student = studentsMock.find((s) => s.id === studentId);

  useEffect(() => {
    loadRegularidadData();
  }, []);

  const loadRegularidadData = async () => {
    setIsLoading(true);
    try {
      // Simular carga de datos de regularidad
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setRegularidadData({
        asistencia: 85,
        cursos: ["Matemáticas", "Historia"],
        estado: "Regular",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-48"></div>
            </div>
          </div>
          <SkeletonLoader type="table" count={4} />
        </main>
        <Footer />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="bg-white p-8 rounded-xl shadow text-center">
            <h2 className="text-xl font-bold">
              {t("profRegularidad.notFoundTitle")}
            </h2>
            <Link
              to="/profesor/regularidad"
              className="mt-4 inline-block px-4 py-2 rounded border bg-white"
            >
              {t("profRegularidad.notFoundBack")}
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const validated = useMemo(
    () => student.licenses.filter((l) => l.estado === "validated"),
    [student]
  );
  const missedDays = useMemo(
    () => validated.reduce((sum, l) => sum + daysBetween(l.inicio, l.fin), 0),
    [validated]
  );
  const missedPercent = Math.min(100, Math.round((missedDays / 20) * 100));
  const atRisk = missedPercent >= 80;

  return (
    <div className="min-h-screen flex flex-col bg-blue-50">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-4xl">
        <div className="bg-white rounded-2xl shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{student.name}</h1>
              <div className="text-sm text-gray-600">
                {student.legajo} · {student.course} · {student.section}
              </div>
            </div>

            <div className="text-right">
              {/* badge centrado y con ancho mínimo para evitar corte */}
              <div
                className={`inline-flex items-center justify-center text-center min-w-[200px] px-4 py-2 rounded-full font-semibold ${
                  atRisk
                    ? "bg-red-100 text-red-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {atRisk
                  ? t("profRegularidad.header.badgeRisk")
                  : t("profRegularidad.header.badgeRegular")}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {t("profRegularidad.header.summary", {
                  days: missedDays,
                  percent: missedPercent,
                })}
              </div>
            </div>
          </div>

          {atRisk && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
              <div className="font-semibold text-red-700">
                {t("profRegularidad.header.riskAlertTitle")}
              </div>
              <div className="text-sm text-red-600 mt-1">
                {t("profRegularidad.header.riskAlertBody", {
                  percent: missedPercent,
                })}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">
            {t("profRegularidad.licensesTitle")}
          </h2>
          <div className="space-y-3">
            {student.licenses.map((l) => (
              <div
                key={l.id}
                className="p-3 border rounded flex items-center justify-between"
              >
                <div>
                  <div className="font-medium">
                    {t("profRegularidad.licenseRowFolio", {
                      id: l.id,
                      defaultValue: `Folio ${l.id}`,
                    })}{" "}
                    ·{" "}
                    {t(`profRegularidad.status.${l.estado}`, {
                      defaultValue: l.estado,
                    })}
                  </div>
                  <div className="text-sm text-gray-600">
                    {t("profRegularidad.labels.emission")}: {l.fechaEmision} ·{" "}
                    {l.inicio} → {l.fin}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="inline-flex items-center gap-2 px-3 py-1 rounded bg-white border">
                    {t("profRegularidad.actions.view")}
                    <Eye className="h-4 w-4" />
                  </button>
                  <button className="inline-flex items-center gap-2 px-3 py-1 rounded bg-white border">
                    {t("profRegularidad.actions.download")}
                    <FileDown className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/profesor/regularidad"
            className="inline-flex items-center px-4 py-2 bg-white border rounded"
          >
            {t("profRegularidad.actions.backToList")}
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
