import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import Toast from "../components/toast";
import { useRequestReset } from "../hooks/usePasswordReset"; // Asegúrate de que la ruta sea correcta
import LoadingSpinner from "../components/LoadingSpinner";
import { useTranslation } from "react-i18next";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [toast, setToast] = useState(null); // { message, type }
  const navigate = useNavigate();
  const { requestReset, loading, error } = useRequestReset();
  const { t } = useTranslation();

  // Carga inicial
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 600));
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Temporizador para bloquear reenvío
  useEffect(() => {
    let countdown;
    if (timer > 0) {
      countdown = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(countdown);
  }, [timer]);

  // ✅ Loading pantalla completa
  if (isInitialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100 dark:bg-app dark:bg-none">
        <LoadingSpinner size="large" text="Cargando formulario..." />
      </div>
    );
  }

  // Función para validar formato de correo
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleRequestCode = async () => {
    if (!isValidEmail(email)) {
      setToast({
        message: t("forgotPassword.toastInvalidEmail"),
        type: "error",
      });
      return;
    }

    try {
      const result = await requestReset(email);
      
      setTimer(60);
      setToast({
        message: t("forgotPassword.toastCodeSent"),
        type: "success",
      });

      // Navega a ResetPassword pasando el email como estado
      setTimeout(() => navigate("/reset-password", { 
        state: { email } 
      }), 1000);
    } catch (err) {
      // El error ya se maneja automáticamente en el hook y se muestra en el useEffect
      console.error("Error al solicitar código:", err);
    }
  };

  const buttonLabel = loading
    ? t("forgotPassword.buttonSending")
    : timer > 0
    ? t("forgotPassword.buttonResendIn", { seconds: timer })
    : t("forgotPassword.buttonMain");

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow flex items-center justify-center px-4">
        <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {t("forgotPassword.title")}
          </h2>
          <p className="text-gray-600 mb-6">
            {t("forgotPassword.description")}
          </p>

          <input
            type="email"
            placeholder={t("forgotPassword.emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading || timer > 0}
            className="w-full px-4 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />

          <button
            onClick={handleRequestCode}
            disabled={loading || timer > 0}
            className={`w-full py-2 rounded-lg text-white font-semibold transition ${
              loading || timer > 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <LoadingSpinner size="small" color="white" />
                {t("forgotPassword.buttonSending")}
              </div>
            ) : (
              buttonLabel
            )}
          </button>
        </div>
      </main>

      <Footer />

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
