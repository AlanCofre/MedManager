import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BannerSection from "../components/BannerSection";
import signo from "../assets/SignoPregunta.png";
import { useAuth } from "../context/AuthContext";
import { changeUserRole } from "../services/userService";

export default function AssignRole() {
  const { user } = useAuth();
  const current = user || JSON.parse(localStorage.getItem("user") || "null");

  const [targetId, setTargetId] = useState(2);
  const [targetName, setTargetName] = useState("");
  const [newRole, setNewRole] = useState("funcionario");
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState("");

  const append = (t) => setLog((s) => `${new Date().toISOString()} - ${t}\n${s}`);

  const makeAdmin = () => {
    const u = { id_usuario: 1, nombre: "Admin Test", role: "admin" };
    localStorage.setItem("user", JSON.stringify(u));
    localStorage.setItem("token", "dummy-admin-token");
    append("LocalStorage seteado como ADMIN (recargar para ver efecto)");
  };

  const makeStudent = () => {
    const u = { id_usuario: 99, nombre: "Student Test", role: "estudiante" };
    localStorage.setItem("user", JSON.stringify(u));
    localStorage.setItem("token", "dummy-student-token");
    append("LocalStorage seteado como ESTUDIANTE (recargar para ver efecto)");
  };

  const handleAssign = async () => {
    if (!current || String(current.role).toLowerCase() !== "admin") {
      append("Acción denegada: solo administradores pueden asignar roles (frontend guard)");
      return;
    }
    setLoading(true);
    append(`Intentando asignar rol ${newRole} al usuario ${targetId} (${targetName || "sin nombre"})`);
    try {
      const res = await changeUserRole(current, targetId, newRole);
      append(`Respuesta: ${JSON.stringify(res)}`);
    } catch (err) {
      append(`Error: ${err?.message || String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-blue-100 dark:bg-app dark:bg-none">
      <Navbar />

      <BannerSection />

      <main className="container mx-auto px-8 py-12 flex-grow">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-3">
            <div className="lg:col-span-2 p-10 lg:p-16">
              <h2 className="text-3xl font-bold mb-6">Asignar Rol</h2>

              <div className="mb-4">
                <div className="text-sm text-gray-600">Usuario actual (localStorage / contexto):</div>
                <pre className="bg-gray-100 p-3 rounded mt-2 text-sm">{JSON.stringify(current, null, 2)}</pre>
              </div>

              <div className="flex gap-3 mb-6">
                <button onClick={makeAdmin} className="px-3 py-2 bg-green-600 text-white rounded shadow">Set Admin</button>
                <button onClick={makeStudent} className="px-3 py-2 bg-blue-600 text-white rounded shadow">Set Student</button>
                <button onClick={() => location.reload()} className="px-3 py-2 bg-gray-100 rounded border">Recargar</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                <input
                  type="number"
                  value={targetId}
                  onChange={(e) => setTargetId(Number(e.target.value))}
                  className="p-3 border rounded shadow-sm"
                  placeholder="ID usuario"
                />
                <input
                  value={targetName}
                  onChange={(e) => setTargetName(e.target.value)}
                  className="p-3 border rounded shadow-sm"
                  placeholder="Nombre (opcional)"
                />
                <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="p-3 border rounded shadow-sm">
                  <option value="admin">admin</option>
                  <option value="funcionario">funcionario</option>
                  <option value="estudiante">estudiante</option>
                  <option value="profesor">profesor</option>
                </select>
              </div>

              <div className="mb-6">
                <button
                  onClick={handleAssign}
                  disabled={loading}
                  className="px-5 py-3 bg-indigo-600 text-white rounded shadow hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? "Asignando..." : "Asignar Rol"}
                </button>
                {(!current || String(current.role).toLowerCase() !== "admin") && (
                  <div className="mt-3 text-sm text-red-600">Solo administradores pueden usar esta interfaz (cliente).</div>
                )}
              </div>

              <div>
                <h3 className="font-medium mb-2">Registro de acciones</h3>
                <pre className="w-full mt-2 p-3 border rounded bg-black/5 text-sm max-h-48 overflow-y-auto">{log || "—"}</pre>
              </div>
            </div>

            <div className="lg:col-span-1 flex items-center justify-center p-8 lg:p-12 bg-[var(--blue-50)]">
              <img src={signo} alt="help" className="w-56 h-56 object-contain" />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
