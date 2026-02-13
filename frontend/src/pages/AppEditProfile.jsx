// frontend/src/pages/AppEditProfile.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMiPerfil, updateMiPerfil } from "../services/perfilService";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import LoadingSpinner from "../components/LoadingSpinner";
import SkeletonLoader from "../components/SkeletonLoader";

function EditarPerfil() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [cargando, setCargando] = useState(false);
  const [fotoPerfil, setFotoPerfil] = useState(null);
  const [preview, setPreview] = useState(null);

  const [datos, setDatos] = useState({
    nombre: "",
    correoInstitucional: "",
    correoAlternativo: "",
    telefono: "",
    direccion: "",
    contrasenaActual: "",
    contrasenaNueva: "",
    confirmarContrasena: "",
  });

  const [errores, setErrores] = useState({});
  const [mensajeExito, setMensajeExito] = useState("");

  // Cargar datos iniciales
  useEffect(() => {
    const cargar = async () => {
      try {
        const json = await getMiPerfil();
        if (!json || !json.ok) throw new Error(json?.error || "Error al obtener perfil");

        const usuario = json.data;
        const perfil = usuario?.perfil ?? null;

        setDatos((prev) => ({
          ...prev,
          nombre: usuario?.nombre ?? prev.nombre,
          // 👇 Cambio aplicado: autocompletar con `correo_usuario`
          correoInstitucional: usuario?.correoInstitucional ?? prev.correoInstitucional,
          correoAlternativo: perfil?.email_alt ?? prev.correoAlternativo,
          telefono: perfil?.numero_telef ?? prev.telefono,
          direccion: perfil?.direccion ?? prev.direccion,
        }));

        if (perfil?.foto_url) setPreview(perfil.foto_url);
      } catch (err) {
        console.error("cargar perfil:", err);
        setErrores((prev) => ({
          ...prev,
          general: err.message || "No se pudo cargar perfil",
        }));
      }
    };
    cargar();
  }, []);


  // Manejo de inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setDatos((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errores[name]) {
      setErrores((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Manejo de imagen
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      setFotoPerfil(file);
    }
  };

  const validarFormulario = () => {
    const nuevosErrores = {};

    if (datos.correoAlternativo && !/\S+@\S+\.\S+/.test(datos.correoAlternativo)) {
      nuevosErrores.correoAlternativo = "El correo alternativo no es válido";
    }

    if (datos.contrasenaNueva && !datos.contrasenaActual) {
      nuevosErrores.contrasenaActual = "Ingresa tu contraseña actual para cambiarla";
    }
    if (datos.contrasenaNueva && datos.contrasenaNueva.length < 6) {
      nuevosErrores.contrasenaNueva = "La nueva contraseña debe tener al menos 6 caracteres";
    }
    if (datos.contrasenaNueva && datos.contrasenaNueva !== datos.confirmarContrasena) {
      nuevosErrores.confirmarContrasena = "Las contraseñas no coinciden";
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;
    setCargando(true);
    setMensajeExito("");
    try {
      const payload = {
        correoAlternativo: datos.correoAlternativo || null,
        telefono: datos.telefono || null,
        direccion: datos.direccion || null,
      };
      if (datos.contrasenaActual && datos.contrasenaNueva) {
        payload.contrasenaActual = datos.contrasenaActual;
        payload.contrasenaNueva = datos.contrasenaNueva;
      }
      const updated = await updateMiPerfil(payload, fotoPerfil);
      if (!updated || !updated.ok) throw new Error(updated?.error || "Error guardando perfil");
      setMensajeExito("Perfil actualizado correctamente");
      setDatos((prev) => ({
        ...prev,
        contrasenaActual: "",
        contrasenaNueva: "",
        confirmarContrasena: "",
      }));
      if (updated.data?.foto_url) setPreview(updated.data.foto_url);
    } catch (error) {
      console.error("Error al actualizar:", error);
      setErrores({
        general: error.message || "Error al actualizar el perfil. Intenta nuevamente.",
      });
    } finally {
      setCargando(false);
    }
  };

  const handleCancelar = () => {
    navigate(-1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100 dark:bg-app dark:bg-none">
        <LoadingSpinner size="large" text="Cargando perfil..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Volver y título */}
          <div className="mb-6">
            <button
              onClick={handleCancelar}
              className="flex items-center text-blue-600 hover:text-blue-800 transition-colors mb-4"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Volver
            </button>
            <h1 className="text-3xl font-bold text-gray-800">Editar Perfil</h1>
            <p className="text-gray-600 mt-2">Actualiza tu información personal y preferencias</p>
          </div>

          {/* Foto de perfil */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-32 h-32 rounded-full bg-gray-200 overflow-hidden">
              {preview ? (
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">Foto</div>
              )}
            </div>
            <input type="file" accept="image/*" onChange={handleImageChange} className="mt-4 text-sm" />
          </div>

          {/* Mensajes */}
          {mensajeExito && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800">{mensajeExito}</p>
            </div>
          )}
          {errores.general && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{errores.general}</p>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleGuardar} className="space-y-8">
            {/* Información Personal */}
            <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Información Personal</h2>

              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium mb-2">Nombre</label>
                <input
                  type="text"
                  name="nombre"
                  value={datos.nombre}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
                />
                {errores.nombre && <p className="text-sm text-red-600">{errores.nombre}</p>}
              </div>

              {/* Correo institucional (solo lectura) */}
              <div>
                <label className="block text-sm font-medium mb-2">Correo institucional</label>
                <input
                  type="email"
                  name="correoInstitucional"
                  value={datos.correoInstitucional}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
                />
              </div>

              {/* Correo alternativo */}
              <div>
                <label className="block text-sm font-medium mb-2">Correo alternativo</label>
                <input
                  type="email"
                  name="correoAlternativo"
                  value={datos.correoAlternativo}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg ${
                    errores.correoAlternativo ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="correo@ejemplo.com"
                />
                {errores.correoAlternativo && (
                  <p className="text-sm text-red-600">{errores.correoAlternativo}</p>
                )}
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-sm font-medium mb-2">Teléfono</label>
                <input
                  type="tel"
                  name="telefono"
                  value={datos.telefono}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="+56 9 1234 5678"
                />
              </div>

              {/* Dirección */}
              <div>
                <label className="block text-sm font-medium mb-2">Dirección</label>
                <input
                  type="text"
                  name="direccion"
                  value={datos.direccion}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Calle, número, ciudad"
                />
              </div>
            </div>

            {/* Recuperar contraseña */}
            <div className="py-5">
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="w-full p-5 bg-gradient-to-r from-blue-500 to-blue-400 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
              >
                Cambiar / Recuperar contraseña
              </button>
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={handleCancelar}
                className="px-6 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={cargando}
                className={`w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium transition ${
                  cargando ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
                }`}
              >
                {cargando ? (
                  <div className="flex items-center justify-center gap-2">
                    <LoadingSpinner size="small" color="white" />
                    Guardando...
                  </div>
                ) : (
                  "Guardar cambios"
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default EditarPerfil;
