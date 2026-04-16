import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { changeUserRole } from "../services/userService";

export default function TestRoleAssign() {
  const { user } = useAuth();
  const [targetId, setTargetId] = useState(2);
  const [newRole, setNewRole] = useState("funcionario");
  const [log, setLog] = useState("");
  const append = (t) => setLog((s) => `${new Date().toISOString()} - ${t}\n${s}`);

  const makeAdmin = () => {
    const u = { id_usuario: 1, nombre: "Admin Test", role: "admin" };
    localStorage.setItem("user", JSON.stringify(u));
    localStorage.setItem("token", "dummy-admin-token");
    append("LocalStorage set to ADMIN (reload page to see effect)");
  };

  const makeStudent = () => {
    const u = { id_usuario: 99, nombre: "Student Test", role: "estudiante" };
    localStorage.setItem("user", JSON.stringify(u));
    localStorage.setItem("token", "dummy-student-token");
    append("LocalStorage set to STUDENT (reload page to see effect)");
  };

  const handleChangeRole = async () => {
    try {
      append(`Intentando cambiar rol del usuario ${targetId} → ${newRole} (cliente)`);
      const res = await changeUserRole(user, targetId, newRole);
      append(`Respuesta exitosa: ${JSON.stringify(res)}`);
    } catch (err) {
      append(`Error: ${err?.message || String(err)}`);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Test: Asignar Rol (frontend guard)</h2>

      <div className="mb-4">
        <div className="text-sm text-gray-600">Usuario actual (localStorage):</div>
        <pre className="bg-gray-100 p-3 rounded">{JSON.stringify(user, null, 2)}</pre>
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={makeAdmin} className="px-3 py-2 bg-green-600 text-white rounded">Set Admin</button>
        <button onClick={makeStudent} className="px-3 py-2 bg-blue-600 text-white rounded">Set Student</button>
        <button onClick={() => location.reload()} className="px-3 py-2 bg-gray-300 rounded">Reload</button>
      </div>

      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-2">
        <input type="number" value={targetId} onChange={(e)=>setTargetId(e.target.value)} className="p-2 border" />
        <input value={newRole} onChange={(e)=>setNewRole(e.target.value)} className="p-2 border" />
        <button onClick={handleChangeRole} className="px-3 py-2 bg-indigo-600 text-white rounded">Intentar Cambiar Rol</button>
      </div>

      <div>
        <h3 className="font-medium">Log</h3>
        <textarea readOnly value={log} rows={12} className="w-full mt-2 p-2 border rounded bg-black/5"></textarea>
      </div>
    </div>
  );
}
