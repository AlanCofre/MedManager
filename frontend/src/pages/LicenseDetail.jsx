import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import api from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import SkeletonLoader from "../components/SkeletonLoader";

export default function LicenseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [license, setLicense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewBlobUrls, setPreviewBlobUrls] = useState({});

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.fetchLicenseById(id)
      .then((res) => {
        if (!mounted) return;
        // adapt depending backend shape
        setLicense(res.data ?? res);
      })
      .catch((err) => {
        if (err.status === 403) setError({ code: 403, message: "No tienes permisos." });
        else if (err.status === 404) setError({ code: 404, message: "Licencia no encontrada." });
        else setError({ code: err.status || 500, message: err.message || "Error" });
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
      // revoke blob urls
      Object.values(previewBlobUrls).forEach((u) => URL.revokeObjectURL(u));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handlePreview(att) {
    try {
      const blob = await api.fetchAttachment(att.path || att.file);
      const url = URL.createObjectURL(blob);
      setPreviewBlobUrls((s) => ({ ...s, [att.path || att.file]: url }));
      // open preview in new tab for PDFs/images
      window.open(url, "_blank");
    } catch (err) {
      alert("Error al obtener el adjunto");
    }
  }

  async function handleDownload(att) {
    try {
      const blob = await api.fetchAttachment(att.path || att.file);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = att.name ?? att.filename ?? `attachment-${id}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Error al descargar el adjunto");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <SkeletonLoader type="detail" count={1} />
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="container mx-auto px-6 py-12">
          <div className="bg-red-50 p-6 rounded">{error.code}: {error.message}</div>
          <div className="mt-4">
            <button onClick={() => navigate(-1)} className="px-4 py-2 bg-white rounded shadow">Volver</button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-blue-100 dark:bg-app dark:bg-none">
      <Navbar />
      <main className="container mx-auto px-6 py-12 flex-grow">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2">{license.title ?? license.type ?? `Licencia #${license.id}`}</h1>
              <div className="text-sm text-gray-500 mb-4">Fecha: {license.date ?? license.created_at}</div>

              <div className="mb-4">
                <h3 className="font-semibold">Estado</h3>
                <div className="text-sm">{license.status}</div>
              </div>

              <div className="mb-4">
                <h3 className="font-semibold">Resumen</h3>
                <p className="text-sm text-gray-700">{license.summary ?? license.note}</p>
              </div>
            </div>

            <div className="w-48">
              <div className="text-xs text-gray-600 mb-2">Acciones</div>
              <button onClick={() => navigate(-1)} className="block w-full mb-2 px-3 py-2 bg-white rounded shadow">Volver</button>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold mb-3">Adjuntos</h3>
            {!(license.attachments && license.attachments.length) && <div className="text-gray-600">No hay adjuntos.</div>}
            <div className="space-y-3">
              {(license.attachments || []).map((att) => (
                <div key={att.id ?? att.path ?? att.file} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                  <div>
                    <div className="font-medium">{att.name ?? att.filename ?? att.file}</div>
                    <div className="text-xs text-gray-500">{att.type ?? att.mime}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handlePreview(att)} className="px-3 py-1 bg-white rounded shadow text-sm">Previsualizar</button>
                    <button onClick={() => handleDownload(att)} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">Descargar</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}