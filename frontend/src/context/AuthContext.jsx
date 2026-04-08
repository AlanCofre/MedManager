// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import LoadingSpinner from "../components/LoadingSpinner";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Hidratación inicial desde localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      try {
        // Simular tiempo de verificación de sesión
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Leer usuario desde localStorage
        const rawUser = localStorage.getItem("user");
        if (rawUser) {
          try {
            setUser(JSON.parse(rawUser));
          } catch {
            localStorage.removeItem("user");
          }
        }

        // ✅ LEER TOKEN desde localStorage
        const savedToken = localStorage.getItem("token");
        if (savedToken) {
          console.log("[AuthContext] Token encontrado en localStorage");
          setToken(savedToken);
        }
      } catch (error) {
        console.error("Error inicializando auth:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (userData, tokenData) => {
    setIsAuthenticating(true);
    try {
      // Simular autenticación en backend
      await new Promise((resolve) => setTimeout(resolve, 500));

      setUser(userData);
      setToken(tokenData); // ✅ GUARDAR token en estado

      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", tokenData); // ✅ GUARDAR en localStorage

      console.log("[AuthContext] Login exitoso, token guardado");
    } catch (error) {
      console.error("[AuthContext] Error en login:", error);
      throw error;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    console.log("[AuthContext] Logout completado");
  };

  // Mostrar loading inicial mientras se verifica la sesión
  if (isLoading) {
    return (
      <LoadingSpinner
        fullScreen
        size="large"
        text="Verificando sesión..."
      />
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        // helper boolean to check admin privileges on the frontend
        isAdmin: String(user?.role || user?.rol || user?.id_rol || "").toLowerCase() === "admin" ||
                 String(user?.role || user?.rol || user?.id_rol || "").toLowerCase() === "administrador",
        loading: isAuthenticating,
        isAuthenticated: !!user && !!token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
};
