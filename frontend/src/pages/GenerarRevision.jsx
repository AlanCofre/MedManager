import React, { useState, useRef, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BannerSection from "../components/BannerSection";
import { Upload } from "lucide-react";
import PreviewEnvio from "../components/PreviewEnvio";
import Toast from "../components/toast";
import LoadingSpinner from "../components/LoadingSpinner";
import { useTranslation } from "react-i18next";

const calcularHashSHA256 = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
};


export default function GenerarRevision() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);

  const initialForm = {
    folio: "",
    fechaEmision: "",
    fechaInicioReposo: "",
    fechaFinalReposo: "",
    motivoMedico: "",
  };
  const [formData, setFormData] = useState(initialForm);
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  // --- Validación de cursos seleccionados ---
  const [selectedCursos, setSelectedCursos] = useState([]);
  const [errorCursos, setErrorCursos] = useState(false);
  const cursosSelectorRef = useRef(null);

  // Validación motivo (tocado para mostrar errores)
  const [motivoTouched, setMotivoTouched] = useState(false);

  // Step: form | preview
  const [step, setStep] = useState("form");
  const [sending, setSending] = useState(false);

  // Toast state
  const [toast, setToast] = useState(null); // { message, type }

  // Confirmación antes de enviar
  const [showConfirm, setShowConfirm] = useState(false);
  const pendingFormRef = useRef(null);

  // Simulación de cursos activos (reemplaza por tu fuente real)
  const [cursosActivos, setCursosActivos] = useState([]);
  useEffect(() => {
    const cargarCursosMatriculados = async () => {
      const token = localStorage.getItem("token") || "";
      const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

      try {
        const res = await fetch(`${apiBase}/api/matriculas/mis-matriculas?flat=true`, {

          headers: { Authorization: `Bearer ${token}` }
        });

        const json = await res.json();
        if (res.ok && json.ok && Array.isArray(json.data)) {
          const cursos = json.data.map(c => ({
            codigo: c.codigo,
            nombre: c.nombre_curso,
            seccion: c.seccion
          }));
          setCursosActivos(cursos);
        } else {
          console.warn("No se pudieron cargar los cursos:", json);
          setCursosActivos([]);
        }
      } catch (err) {
        console.error("Error al cargar cursos:", err);
        setCursosActivos([]);
      }
    };

    cargarCursosMatriculados();
  }, []);


  // --- Helpers de validación ---
  const regexMotivo = /^[\p{L}\p{N}\s,-]{3,}$/u; // letras (con acentos), números, espacio, coma, guion; 3+ chars
  const isMotivoValid = (str) => regexMotivo.test((str || "").trim());

  // Manejo de inputs
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "folio" && !/^\d*$/.test(value)) {
      return;
    }
    if (name === "motivoMedico") {
      setFormData((prev) => ({ ...prev, [name]: value }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Manejo de archivo
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
    } else {
      setToast({
        message: t("studentGenerateRevision.errors.invalidPdf"),
        type: "error",
      });
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      setFile(droppedFile);
    } else {
      setToast({
        message: t("studentGenerateRevision.errors.onlyPdf"),
        type: "error",
      });
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Validar formulario
  const isFormValid =
    formData.folio.trim() !== "" &&
    formData.fechaEmision.trim() !== "" &&
    formData.fechaInicioReposo.trim() !== "" &&
    formData.fechaFinalReposo.trim() !== "" &&
    isMotivoValid(formData.motivoMedico) &&
    file !== null &&
    selectedCursos.length > 0;

  // Envío al backend -> abre modal de confirmación en vez de enviar directamente
  const handleSubmit = (e) => {
    e.preventDefault();

    if (selectedCursos.length === 0) {
      setErrorCursos(true);
      cursosSelectorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    
    // Show confirmation modal
    setShowConfirm(true);
    pendingFormRef.current = { formData, selectedCursos, file };
  };

  // Función que realiza el envío real (usada por PreviewEnvio)
  const sendData = async ({
    form = formData,
    cursos = selectedCursos,
    archivo = file,
  } = {}) => {
    if (!form || !archivo || cursos.length === 0) {
      throw new Error(
        t("studentGenerateRevision.errors.sendMissingData")
      );
    }
    if (!isMotivoValid(form.motivoMedico)) {
      throw new Error(
        t("studentGenerateRevision.errors.sendMotivoInvalid")
      );
    }
    setErrorCursos(false);
    setSending(true);

    try {
      // 🧠 Metadatos del archivo
      const hash = await calcularHashSHA256(archivo);
      const tipoMime = archivo.type;
      const tamano = archivo.size;
      const ruta_url = `https://storage.googleapis.com/tu-bucket/${archivo.name}`;

      const fd = new FormData();
      fd.append("archivo", archivo);
      fd.append("folio", form.folio);
      fd.append("fecha_emision", form.fechaEmision);
      fd.append("fecha_inicio", form.fechaInicioReposo);
      fd.append("fecha_fin", form.fechaFinalReposo);
      fd.append("cursos", JSON.stringify(cursos));

      fd.append("motivo_medico", form.motivoMedico?.trim() || "");
      fd.append("requiere_archivo", "true");
      fd.append("ruta_url", ruta_url);
      fd.append("tipo_mime", tipoMime);
      fd.append("hash", hash);
      fd.append("tamano", tamano);

      const token = localStorage.getItem("token") || "";
      const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

      const res = await fetch(`${apiBase}/api/licencias/crear`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: fd,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.mensaje || data?.error || "Error al enviar la licencia");
      }

      // ✅ Éxito
      setToast({ message: "Licencia enviada correctamente", type: "success" });
      setFormData(initialForm);
      setFile(null);
      setSelectedCursos([]);
      setErrorCursos(false);
      setMotivoTouched(false);
      setStep("form");
      setSending(false);
      return { ok: true };

    } catch (err) {
      console.error("Error al enviar licencia:", err);
      setToast({ 
        message: err.message || "Error al enviar la licencia. Intenta nuevamente.", 
        type: "error" 
      });
      setSending(false);
      throw err;
    }
  };

  // Cuando el usuario hace "Siguiente / Confirmar" en el formulario: validar y pasar a preview

  const handleFormNext = (e) => {
    e.preventDefault();
    if (selectedCursos.length === 0) {
      setErrorCursos(true);
      cursosSelectorRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }
    if (!isFormValid) {
      if (!isMotivoValid(formData.motivoMedico)) {
        alert(t("studentGenerateRevision.alerts.motivoInvalid"));
        return;
      }
      alert(t("studentGenerateRevision.alerts.missingFields"));
      return;
    }
    setErrorCursos(false);
    setStep("preview");
  };

  // Obtener fecha de hoy en formato YYYY-MM-DD para validación de fechaFinal
  const hoy = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 800));
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // ✅ Loading pantalla completa
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100 dark:bg-app dark:bg-none">
        <LoadingSpinner size="large" text="Preparando formulario..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-blue-100 dark:bg-app dark:bg-none">
      <Navbar />

      {/* Banner superior */}
      <BannerSection
        title={t("studentGenerateRevision.bannerTitle")}
      />

      {/* Contenido */}
      <main className="container mx-auto px-6 py-12 flex-grow">
        {step === "form" ? (
          <div className="bg-white rounded-lg shadow-lg p-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Formulario */}
            <form className="flex flex-col gap-6" onSubmit={handleFormNext}>
              <div>
                <label className="block text-gray-600 mb-1">
                  {t("studentGenerateRevision.folioLabel")}
                </label>
                <input
                  type="text"
                  name="folio"
                  value={formData.folio}
                  onChange={handleChange}
                  placeholder={t(
                    "studentGenerateRevision.folioPlaceholder"
                  )}
                  className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-1">
                  {t("studentGenerateRevision.fechaEmisionLabel")}
                </label>
                <input
                  type="date"
                  name="fechaEmision"
                  value={formData.fechaEmision}
                  onChange={handleChange}
                  className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <small className="text-gray-500">
                  {t("studentGenerateRevision.fechaEmisionHelp")}
                </small>
              </div>

              <div>
                <label className="block text-gray-600 mb-1">
                  {t("studentGenerateRevision.fechaInicioLabel")}
                </label>
                <input
                  type="date"
                  name="fechaInicioReposo"
                  value={formData.fechaInicioReposo}
                  onChange={handleChange}
                  className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-1">
                  {t("studentGenerateRevision.fechaFinLabel")}
                </label>
                <input
                  type="date"
                  name="fechaFinalReposo"
                  value={formData.fechaFinalReposo}
                  onChange={handleChange}
                  min={hoy}
                  className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* Motivo médico */}
              <div>
                <label className="block text-gray-600 mb-1">
                  {t("studentGenerateRevision.motivoLabel")}
                </label>
                <input
                  type="text"
                  name="motivoMedico"
                  value={formData.motivoMedico}
                  onChange={handleChange}
                  onBlur={() => setMotivoTouched(true)}
                  placeholder={t(
                    "studentGenerateRevision.motivoPlaceholder"
                  )}
                  aria-invalid={
                    motivoTouched &&
                    !isMotivoValid(formData.motivoMedico)
                  }
                  aria-describedby="motivoHelp motivoError"
                  className={`w-full p-3 border rounded focus:outline-none focus:ring-2 ${
                    motivoTouched &&
                    !isMotivoValid(formData.motivoMedico)
                      ? "border-red-500 focus:ring-red-400"
                      : "focus:ring-blue-400"
                  }`}
                />
                <div
                  id="motivoHelp"
                  className="text-xs text-gray-500 mt-1"
                >
                  {t("studentGenerateRevision.motivoHelp")}
                </div>
                {motivoTouched &&
                  !isMotivoValid(formData.motivoMedico) && (
                    <div
                      id="motivoError"
                      className="mt-1 text-red-600 text-sm"
                      role="alert"
                    >
                      {t("studentGenerateRevision.motivoError")}
                    </div>
                  )}
              </div>

              {/* Selector de cursos */}
              <div
                ref={cursosSelectorRef}
                className={`mb-4 p-4 rounded border transition
                  ${
                    errorCursos
                      ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                      : "border-gray-200 dark:border-app"
                  }
                `}
                aria-live="polite"
              >
                <label className="block font-medium mb-2">
                  {t("studentGenerateRevision.cursosLabel")}
                  <span
                    className="ml-2 text-gray-400 cursor-pointer"
                    tabIndex={0}
                    title={t(
                      "studentGenerateRevision.cursosHelpA11y"
                    )}
                    aria-label={t(
                      "studentGenerateRevision.cursosHelpA11y"
                    )}
                  >
                    <svg
                      className="inline w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        strokeWidth="2"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 16v-4m0-4h.01"
                      />
                    </svg>
                  </span>
                </label>
                <div className="space-y-2">
                  {cursosActivos.map((curso) => (
                    <label
                      key={curso.codigo}
                      className="flex items-center p-3 border rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="mr-3"
                        checked={selectedCursos.includes(curso.codigo)}
                        onChange={(e) =>
                          setSelectedCursos(
                            e.target.checked
                              ? [...selectedCursos, curso.codigo]
                              : selectedCursos.filter((c) => c !== curso.codigo)
                          )
                        }
                      />
                      <div>
                        <div className="font-medium">{curso.nombre}</div>
                        <div className="text-sm text-gray-500">
                          {curso.codigo} - Sección {curso.seccion}
                        </div>
                      </div>
                    </label>
                  ))}
                  {errorCursos && (
                    <div className="mt-2 text-red-600 text-sm font-medium" aria-live="polite">
                      Debes seleccionar al menos un curso
                    </div>
                  )}
                  <div className="mt-1 text-xs text-gray-400 dark:text-muted">
                    Solo verás cursos del periodo activo.
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setFormData(initialForm);
                    setFile(null);
                    setSelectedCursos([]);
                    setErrorCursos(false);
                    setMotivoTouched(false);
                  }}
                  className="px-6 py-3 rounded border text-sm"
                >
                  {t("studentGenerateRevision.actions.clear")}
                </button>

                <button
                  type="submit"
                  disabled={!isFormValid}
                  className={`px-6 py-3 rounded text-white transition ${
                    isFormValid
                      ? "bg-blue-500 hover:bg-blue-600 cursor-pointer"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
                >
                  {t("studentGenerateRevision.actions.next")}
                </button>
              </div>
            </form>

            {/* Upload */}
            <div
              className="border-2 border-dashed border-blue-400 rounded-lg flex flex-col items-center justify-center p-6 text-blue-500 cursor-pointer hover:bg-blue-50 transition"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={48} />
              <p className="mt-4 text-center">
                {t(
                  "studentGenerateRevision.upload.instructions"
                )}
              </p>
              {file && (
                <p className="mt-2 text-sm text-gray-600">
                  {t(
                    "studentGenerateRevision.upload.selectedFile"
                  )}{" "}
                  <span className="font-semibold">
                    {file.name}
                  </span>
                </p>
              )}
              <input
                type="file"
                ref={fileInputRef}
                accept="application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>
        ) : (
          // Preview step
          <div className="bg-white rounded-lg shadow-lg p-8">
            <PreviewEnvio
              formData={formData}
              selectedCursos={selectedCursos}
              file={file}
              onEdit={(section) => {
                setStep("form");
                if (section === "cursos") {
                  setTimeout(
                    () =>
                      cursosSelectorRef.current?.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      }),
                    100
                  );
                }
                if (section === "file") {
                  setTimeout(
                    () =>
                      fileInputRef.current?.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      }),
                    100
                  );
                }
              }}
              onSubmit={async ({
                formData: f,
                selectedCursos: sc,
                file: fl,
              }) => {
                try {
                  await sendData({
                    form: f,
                    cursos: sc,
                    archivo: fl,
                  });
                  setToast({
                    message: t(
                      "studentGenerateRevision.toast.success"
                    ),
                    type: "success",
                  });
                } catch (err) {
                  const msg =
                    err?.message || String(err || "");
                  setToast({
                    message: t(
                      "studentGenerateRevision.toast.errorPrefix",
                      { message: msg }
                    ),
                    type: "error",
                  });
                }
              }}
              apiBase={(import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "")}
            />
          </div>
        )}
      </main>

      {/* Modal de confirmación */}
      {showConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.4)",
            zIndex: 9999,
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            style={{
              width: 380,
              maxWidth: "90%",
              background: "#fff",
              padding: 20,
              borderRadius: 8,
              boxShadow: "0 6px 18px rgba(0,0,0,0.2)",
            }}
          >
            <h3 style={{ marginTop: 0 }}>¿Estás seguro de enviar la licencia?</h3>
            <p>Al confirmar, los datos serán considerados definitivos y se enviarán al sistema.</p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
              <button type="button" onClick={cancelSend} style={{ padding: "8px 12px" }}>
                No, volver
              </button>
              <button
                type="button"
                onClick={confirmSend}
                style={{ padding: "8px 12px", background: "#007bff", color: "#fff", border: "none", borderRadius: 4 }}
              >
                Sí, confirmar y enviar
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />

      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
