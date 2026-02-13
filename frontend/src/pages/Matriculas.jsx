import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ConfirmModal from "../components/ConfirmModal";
import {
  Calendar as CalendarIcon,
  BookOpen,
  Users,
  Search,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import SkeletonLoader from "../components/SkeletonLoader";

// false con backend
const USE_MOCK = false;

// Base del backend (SIN /api al final)
const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") ||
  "http://localhost:3000";

/** ========= API LAYER =========
 * Endpoints backend reales:
 * GET    /api/periodos
 * GET    /api/cursos?periodo_id=:id
 * GET    /api/matriculas?id_curso=:id
 * GET    /api/estudiantes/buscar?q=:query
 * POST   /api/matriculas                body: {id_usuario, id_curso}
 * DELETE /api/matriculas/:id_matricula
 */

async function apiRequest(path, opts = {}) {
  if (USE_MOCK) return mockApi(path, opts);

  const token = localStorage.getItem("token") || "";

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(opts.headers || {}),
  };

  const res = await fetch(`${API_BASE}/api${path}`, {
    credentials: "include",
    ...opts,
    headers,
  });

  const ct = res.headers.get("content-type") || "";
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const err = new Error(text || "request_failed");
    err.status = res.status;
    throw err;
  }

  if (ct.includes("application/json")) {
    return res.json();
  }
  return res.blob();
}

const api = {
  // Periodos → [{id, nombre}]
  getPeriodos: () =>
    apiRequest("/periodos").then((r) => {
      console.log("[Matriculas] /api/periodos respuesta cruda =", r);
      const arr = Array.isArray(r?.data) ? r.data : [];
      return arr.map((p) => ({
        id: String(p.id_periodo),
        nombre: p.codigo,
        raw: p,
      }));
    }),

  // Cursos → [{id, codigo, nombre}]
  getCursos: (periodoId) =>
    apiRequest(`/cursos?periodo_id=${encodeURIComponent(periodoId)}`).then(
      (r) => {
        console.log("[Matriculas] /api/cursos respuesta cruda =", r);
        const arr = Array.isArray(r?.data) ? r.data : [];
        return arr.map((c) => ({
          id: String(c.id_curso),
          codigo: c.codigo,
          nombre: c.nombre_curso,
          raw: c,
        }));
      }
    ),

  // Matrículas de un curso → [{id, estudiante:{id,nombre,email}}]
  getMatriculas: (cursoId) =>
    apiRequest(
      `/matriculas?id_curso=${encodeURIComponent(cursoId)}`
    ).then((r) => {
      console.log("[Matriculas] /api/matriculas respuesta cruda =", r);
      const arr = Array.isArray(r?.data) ? r.data : [];
      return arr.map((m) => ({
        id: String(m.id_matricula),
        estudiante: {
          id: String(m.id_usuario),
          nombre: m.nombre,
          email: m.correo_usuario,
        },
        raw: m,
      }));
    }),

  // Buscar estudiantes POR EMAIL → [{id, nombre, email}]
  searchEstudiantes: (email) =>
    (async () => {
      console.log("[Matriculas] buscando estudiante por email:", email);

      const emailTrimmed = (email || "").trim().toLowerCase();

      // Validar que sea un email válido
      const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed);
      if (!isValidEmail) {
        console.warn("[Matriculas] email inválido:", emailTrimmed);
        return [];
      }

      // Intentar múltiples rutas que el backend podría exponer
      const endpoints = [
        `/estudiantes?email=${encodeURIComponent(emailTrimmed)}`,
        `/estudiantes/email/${encodeURIComponent(emailTrimmed)}`,
        `/estudiantes/buscar?email=${encodeURIComponent(emailTrimmed)}`,
        `/admin/estudiantes?email=${encodeURIComponent(emailTrimmed)}`,
        `/admin/estudiantes/email/${encodeURIComponent(emailTrimmed)}`,
      ];

      let lastErr = null;

      for (const endpoint of endpoints) {
        try {
          console.log("[Matriculas] intentando:", endpoint);
          const res = await apiRequest(endpoint);
          console.log("[Matriculas] respuesta:", res);

          // Normalizar respuesta (puede ser array o object con .data)
          const data = res?.data ?? res;
          const arr = Array.isArray(data) ? data : data ? [data] : [];

          // Mapear campos
          const normalized = arr
            .map((e) => ({
              id: String(e.id_usuario ?? e.id ?? ""),
              nombre: e.nombre ?? e.nombre_completo ?? e.name ?? "",
              email: (e.correo_usuario ?? e.email ?? e.correo ?? "").toLowerCase(),
              raw: e,
            }))
            .filter((x) => x.id && x.email);

          if (normalized.length > 0) {
            console.log("[Matriculas] encontrado:", normalized);
            return normalized;
          }
        } catch (err) {
          lastErr = err;
          console.warn("[Matriculas] endpoint falló:", endpoint, err.message);
          // continuar al siguiente
        }
      }

      // Si ningún endpoint funcionó, retornar vacío
      console.warn("[Matriculas] ningún endpoint funcionó, última excepción:", lastErr);
      return [];
    })(),

  // Crear matrícula: intenta con {id_usuario,id_curso} y, si falla, con {estudiante_id,curso_id}
  crearMatricula: (estudiante_id, curso_id) =>
    (async () => {
      const bodyVariants = [
        { id_usuario: estudiante_id, id_curso: curso_id },
        { estudiante_id: estudiante_id, curso_id: curso_id },
        { id: estudiante_id, curso: curso_id },
      ];
      let lastErr = null;
      for (const body of bodyVariants) {
        try {
          const r = await apiRequest(`/matriculas`, {
            method: "POST",
            body: JSON.stringify(body),
            headers: { "Content-Type": "application/json" },
          });
          console.log("[Matriculas] POST /api/matriculas respuesta cruda =", r);
          const m = r?.data ?? r;
          if (!m) return null;
          return {
            id: String(m.id_matricula ?? m.id_matricula ?? m.id ?? m.id_matricula_new ?? ""),
            estudiante: {
              id: String(m.id_usuario ?? m.id ?? m.estudiante_id ?? ""),
              nombre: m.nombre ?? m.nombre_usuario ?? m.nombre_estudiante ?? m.name ?? "",
              email: m.correo_usuario ?? m.email ?? m.correo ?? "",
            },
            raw: m,
          };
        } catch (err) {
          lastErr = err;
          // si es error de validación intentar siguiente variante
          if (err && err.status && [400, 422, 409].includes(err.status)) {
            console.warn("[Matriculas] intento crear matrícula con body", body, "falló:", err.message || err);
            continue;
          }
          throw err;
        }
      }
      const e = new Error(lastErr?.message || "No se pudo crear matrícula");
      e.status = lastErr?.status;
      throw e;
    })(),

  eliminarMatricula: (matricula_id) =>
    apiRequest(`/matriculas/${matricula_id}`, { method: "DELETE" }).then(
      (r) => {
        console.log(
          "[Matriculas] DELETE /api/matriculas/:id respuesta cruda =",
          r
        );
        return r;
      }
    ),
};

// ======= MOCKS =======
async function mockApi(path, opts = {}) {
  await new Promise((r) => setTimeout(r, 350));
  const url = new URL("http://x" + path);

  if (!window.__MOCK__) {
    const periodos = [
      { id: "2025-1", nombre: "2025 - Semestre 1" },
      { id: "2025-2", nombre: "2025 - Semestre 2" },
      { id: "2026-1", nombre: "2026 - Semestre 1" },
    ];

    const cursos = {
      "2025-1": [
        { id: "INF-101", codigo: "INF-101", nombre: "Programación I" },
        { id: "INF-150", codigo: "INF-150", nombre: "Bases de Datos" },
        { id: "MAT-201", codigo: "MAT-201", nombre: "Tópicos de Matemáticas" },
        { id: "FIS-110", codigo: "FIS-110", nombre: "Física" },
      ],
      "2025-2": [
        { id: "INF-220", codigo: "INF-220", nombre: "Arquitectura de Hardware" },
        { id: "INF-240", codigo: "INF-240", nombre: "Desarrollo Web" },
        { id: "MAT-250", codigo: "MAT-250", nombre: "Álgebra" },
        { id: "DER-101", codigo: "DER-101", nombre: "Interfaces Gráficas" },
      ],
      "2026-1": [
        { id: "INF-300", codigo: "INF-300", nombre: "Diseño de Software" },
        { id: "INF-310", codigo: "INF-310", nombre: "Programación III" },
        { id: "MAT-310", codigo: "MAT-310", nombre: "Introducción al Cálculo" },
        {
          id: "INF-200",
          codigo: "INF-200",
          nombre: "Interconexión de Redes",
        }, // vacío para probar empty state
      ],
    };

    const estudiantes = [
      { id: "e1", nombre: "Rumencio González", email: "rumencio@alu.uct.cl" },
      { id: "e2", nombre: "Ana Martínez", email: "ana@alu.uct.cl" },
      { id: "e3", nombre: "Carlos Rodríguez", email: "carlos@alu.uct.cl" },
      { id: "e4", nombre: "Bárbara Núñez", email: "barbara@alu.uct.cl" },
      { id: "e5", nombre: "Sofía Pérez", email: "sofia@alu.uct.cl" },
      { id: "e6", nombre: "Tomás Riquelme", email: "tomas@alu.uct.cl" },
      { id: "e7", nombre: "Matías Herrera", email: "matias@alu.uct.cl" },
      { id: "e8", nombre: "Valentina Muñoz", email: "valentina@alu.uct.cl" },
      { id: "e9", nombre: "Javiera Araya", email: "javiera@alu.uct.cl" },
      { id: "e10", nombre: "Ignacio Torres", email: "ignacio@alu.uct.cl" },
      { id: "e11", nombre: "Camila Morales", email: "camila@alu.uct.cl" },
      { id: "e12", nombre: "Diego Fuentes", email: "diego@alu.uct.cl" },
      { id: "e13", nombre: "Francisca Reyes", email: "francisca@alu.uct.cl" },
      { id: "e14", nombre: "Joaquín Vega", email: "joaquin@alu.uct.cl" },
      { id: "e15", nombre: "Fernanda Castillo", email: "fernanda@alu.uct.cl" },
      { id: "e16", nombre: "Pablo Silva", email: "pablo@alu.uct.cl" },
      { id: "e17", nombre: "Martina Contreras", email: "martina@alu.uct.cl" },
      { id: "e18", nombre: "José Ramírez", email: "jose@alu.uct.cl" },
      { id: "e19", nombre: "Paula Figueroa", email: "paula@alu.uct.cl" },
      { id: "e20", nombre: "Ricardo Jiménez", email: "ricardo@alu.uct.cl" },
      { id: "e21", nombre: "Isidora Campos", email: "isidora@alu.uct.cl" },
      { id: "e22", nombre: "Sebastián Paredes", email: "sebastian@alu.uct.cl" },
      { id: "e23", nombre: "Antonia León", email: "antonia@alu.uct.cl" },
      { id: "e24", nombre: "Vicente Navarro", email: "vicente@alu.uct.cl" },
    ];

    const pick = (ids) =>
      ids.map((eid) => ({
        id: `m-${eid}-${Math.random().toString(36).slice(2, 7)}`,
        estudiante: structuredClone(estudiantes.find((e) => e.id === eid)),
      }));

    const matriculas = {
      // 2025-1
      "INF-101": pick(["e1", "e2", "e3", "e5", "e8", "e12"]),
      "INF-150": pick(["e4", "e6", "e7", "e9"]),
      "MAT-201": [], // vacío a propósito
      "FIS-110": pick(["e16", "e17", "e18"]),
      // 2025-2
      "INF-220": pick(["e2", "e3", "e4", "e19", "e20"]),
      "INF-240": pick(["e1", "e9", "e11", "e22", "e24"]),
      "MAT-250": pick(["e5", "e6", "e7", "e8", "e10"]),
      "DER-101": pick(["e12", "e13", "e14", "e21"]),
      // 2026-1
      "INF-300": pick(["e3", "e4", "e5", "e6"]),
      "INF-310": pick(["e1", "e2", "e7", "e8", "e9"]),
      "MAT-310": pick(["e10", "e11", "e15", "e16", "e17"]),
      "INF-200": [], // vacío a propósito
    };

    const seq = 100;
    window.__MOCK__ = { periodos, cursos, estudiantes, matriculas, seq };
  }

  const DB = window.__MOCK__;

  // --- Endpoints mock ---
  if (path.startsWith("/admin/periodos") && (!opts.method || opts.method === "GET")) {
    return structuredClone(DB.periodos);
  }
  if (path.startsWith("/admin/cursos") && (!opts.method || opts.method === "GET")) {
    const periodo_id = url.searchParams.get("periodo_id");
    return structuredClone(DB.cursos[periodo_id] || []);
  }
  if (path.startsWith("/admin/matriculas") && (!opts.method || opts.method === "GET")) {
    const curso_id = url.searchParams.get("curso_id");
    return structuredClone(DB.matriculas[curso_id] || []);
  }
  if (path.startsWith("/admin/estudiantes/buscar") && (!opts.method || opts.method === "GET")) {
    const q = (url.searchParams.get("q") || "").toLowerCase();
    return DB.estudiantes
      .filter(
        (e) => e.nombre.toLowerCase().includes(q) || e.email.toLowerCase().includes(q)
      )
      .slice(0, 10);
  }
  if (path === "/admin/matriculas" && opts.method === "POST") {
    const body = JSON.parse(opts.body || "{}");
    const { estudiante_id, curso_id } = body || {};
    if (!estudiante_id || !curso_id) {
      const e = new Error("unprocessable");
      e.status = 422;
      throw e;
    }
    const existe = (DB.matriculas[curso_id] || []).some(
      (m) => m.estudiante.id === estudiante_id
    );
    if (existe) {
      const e = new Error("duplicate");
      e.status = 409;
      throw e;
    }
    const est = DB.estudiantes.find((e) => e.id === estudiante_id);
    if (!est) {
      const e = new Error("unprocessable");
      e.status = 422;
      throw e;
    }
    const id = "m" + DB.seq++;
    const nuevo = { id, estudiante: structuredClone(est) };
    DB.matriculas[curso_id] ||= [];
    DB.matriculas[curso_id].push(nuevo);
    return structuredClone(nuevo);
  }
  if (path.startsWith("/admin/matriculas/") && opts.method === "DELETE") {
    const id = path.split("/").pop();
    for (const cid of Object.keys(DB.matriculas)) {
      const idx = DB.matriculas[cid].findIndex((m) => m.id === id);
      if (idx >= 0) {
        DB.matriculas[cid].splice(idx, 1);
        return { ok: true };
      }
    }
    const e = new Error("unprocessable");
    e.status = 422;
    throw e;
  }
  const e = new Error("not_implemented");
  e.status = 500;
  throw e;
}

// ============= PAGE =============
export default function AdminMatriculas() {
  const [periodos, setPeriodos] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [matriculas, setMatriculas] = useState([]);

  const [loadingPeriodos, setLoadingPeriodos] = useState(true);
  const [loadingCursos, setLoadingCursos] = useState(false);
  const [loadingMatriculas, setLoadingMatriculas] = useState(false);

  const [periodoId, setPeriodoId] = useState("");
  const [cursoId, setCursoId] = useState("");

  // add panel
  const [addOpen, setAddOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // confirm remove
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toRemove, setToRemove] = useState(null);

  // alerts
  const [alert, setAlert] = useState(null); // {type: "error"|"success"|"info", msg: string}

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoadingPeriodos(true);
      try {
        const data = await api.getPeriodos();
        if (!alive) return;
        setPeriodos(data);
        // autoselect primero
        if (data?.length && !periodoId) setPeriodoId(data[0].id);
      } catch (e) {
        console.error(e);
        setAlert({ type: "error", msg: "No se pudieron cargar los periodos." });
      } finally {
        if (alive) setLoadingPeriodos(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!periodoId) {
      setCursos([]);
      setCursoId("");
      return;
    }
    let alive = true;
    (async () => {
      setLoadingCursos(true);
      try {
        const data = await api.getCursos(periodoId);
        if (!alive) return;
        setCursos(data);
        // reset curso cuando cambia el periodo
        setCursoId(data?.[0]?.id || "");
      } catch (e) {
        console.error(e);
        setAlert({
          type: "error",
          msg: "No se pudieron cargar los cursos del periodo.",
        });
      } finally {
        if (alive) setLoadingCursos(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [periodoId]);

  useEffect(() => {
    if (!cursoId) {
      setMatriculas([]);
      return;
    }
    let alive = true;
    (async () => {
      setLoadingMatriculas(true);
      try {
        const data = await api.getMatriculas(cursoId);
        if (!alive) return;
        setMatriculas(data);
      } catch (e) {
        console.error(e);
        setAlert({
          type: "error",
          msg: "No se pudieron cargar las matrículas del curso.",
        });
      } finally {
        if (alive) setLoadingMatriculas(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [cursoId]);

  const handleSearch = async (ev) => {
    ev?.preventDefault();
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const data = await api.searchEstudiantes(q.trim());
      setResults(data);
    } catch (e) {
      console.error(e);
      setAlert({ type: "error", msg: "No se pudo buscar estudiantes." });
    } finally {
      setSearching(false);
    }
  };

  const matriculadosIds = useMemo(
    () => new Set(matriculas.map((m) => m.estudiante.id)),
    [matriculas]
  );

  const handleAgregar = async (estudiante) => {
    if (!cursoId) return;
    // Unicidad en UI
    if (matriculadosIds.has(estudiante.id)) {
      setAlert({
        type: "info",
        msg: "El estudiante ya está inscrito en este curso.",
      });
      return;
    }
    const tempId = "tmp-" + estudiante.id;
    const snapshot = [...matriculas];
    setMatriculas((prev) => [{ id: tempId, estudiante }, ...prev]);
    try {
      const created = await api.crearMatricula(estudiante.id, cursoId);
      // swap temp por definitivo
      setMatriculas((prev) =>
        prev.map((m) => (m.id === tempId ? created : m))
      );
      setAlert({ type: "success", msg: "Estudiante inscrito correctamente." });
    } catch (e) {
      console.error(e);
      // revertir
      setMatriculas(snapshot);
      if (e.status === 409) {
        setAlert({
          type: "error",
          msg: "Duplicado: ya existe la matrícula (409).",
        });
      } else if (e.status === 422) {
        setAlert({
          type: "error",
          msg: "Datos inválidos: verifique referencias (422).",
        });
      } else {
        setAlert({
          type: "error",
          msg: "No se pudo inscribir al estudiante.",
        });
      }
    }
  };

  const askRemove = (m) => {
    setToRemove(m);
    setConfirmOpen(true);
  };

  const doRemove = async () => {
    const m = toRemove;
    if (!m) return;
    setConfirmOpen(false);
    setToRemove(null);
    const snapshot = [...matriculas];
    setMatriculas((prev) => prev.filter((x) => x.id !== m.id));
    try {
      await api.eliminarMatricula(m.id);
      setAlert({ type: "success", msg: "Matrícula eliminada." });
    } catch (e) {
      console.error(e);
      setMatriculas(snapshot);
      if (e.status === 422) {
        setAlert({
          type: "error",
          msg: "No se pudo eliminar: referencia inválida (422).",
        });
      } else {
        setAlert({
          type: "error",
          msg: "Error al eliminar la matrícula.",
        });
      }
    }
  };

  const cargarPeriodos = async () => {
    setLoadingPeriodos(true);
    try {
      const data = await api.getPeriodos();
      setPeriodos(data);
      // autoselect primero
      if (data?.length && !periodoId) setPeriodoId(data[0].id);
      await new Promise(resolve => setTimeout(resolve, 1000));
    } finally {
      setLoadingPeriodos(false);
    }
  };

  const cargarCursos = async () => {
    setLoadingCursos(true);
    try {
      const data = await api.getCursos(periodoId);
      setCursos(data);
      // reset curso cuando cambia el periodo
      setCursoId(data?.[0]?.id || "");
      await new Promise(resolve => setTimeout(resolve, 800));
    } finally {
      setLoadingCursos(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
    } finally {
      setSaving(false);
    }
  };

  if (loadingPeriodos) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100 dark:bg-app dark:bg-none">
        <LoadingSpinner size="large" text="Cargando matrículas..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 dark:bg-app dark:bg-none">
      <Navbar />

      <main className="flex-1 w-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Users className="h-7 w-7 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                    Matrículas
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Aquí puedes inscribir o dar de baja estudiantes por periodo
                    y curso.
                  </p>
                </div>
              </div>

              {/* Controles: periodo */}
              <div className="mt-4 flex flex-col md:flex-row items-stretch md:items-center gap-3">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-gray-500" />
                  <label
                    htmlFor="periodo"
                    className="text-sm text-gray-600"
                  >
                    Periodo
                  </label>
                </div>
                <select
                  id="periodo"
                  value={periodoId}
                  onChange={(e) => setPeriodoId(e.target.value)}
                  className="border border-gray-200 bg-white px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#048FD4]"
                >
                  {loadingPeriodos && <option>Cargando...</option>}
                  {!loadingPeriodos && periodos.length === 0 && (
                    <option>No hay periodos</option>
                  )}
                  {!loadingPeriodos &&
                    periodos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre}
                      </option>
                    ))}
                </select>

                <div className="hidden md:block text-gray-400">
                  <ChevronRight size={18} />
                </div>

                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-gray-500" />
                  <span className="text-sm text-gray-600">Cursos</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700">
                    {loadingCursos ? "..." : cursos.length}
                  </span>
                </div>

                <div className="ml-auto flex items-center gap-2">
                  <span className="text-sm text-gray-600">Inscritos</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-700">
                    {loadingMatriculas ? "..." : matriculas.length}
                  </span>
                </div>
              </div>

              {/* Alertas */}
              {alert && (
                <div
                  className={`mt-4 flex items-start gap-2 rounded-xl border px-3 py-2 text-sm ${
                    alert.type === "error"
                      ? "bg-red-50 border-red-200 text-red-800"
                      : alert.type === "success"
                      ? "bg-green-50 border-green-200 text-green-800"
                      : "bg-yellow-50 border-yellow-200 text-yellow-800"
                  }`}
                >
                  {alert.type === "error" ? (
                    <AlertCircle className="h-4 w-4 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mt-0.5" />
                  )}
                  <div className="flex-1">{alert.msg}</div>
                  <button
                    onClick={() => setAlert(null)}
                    className="text-xs underline decoration-dotted"
                  >
                    cerrar
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Layout principal */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Panel cursos */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Cursos del periodo
                    </h2>
                  </div>
                </div>
                <div className="p-4 max-h-[480px] overflow-y-auto">
                  {loadingCursos ? (
                    <div className="text-gray-500 text-sm">
                      Cargando cursos...
                    </div>
                  ) : cursos.length === 0 ? (
                    <div className="text-center text-gray-500 text-sm py-8">
                      No hay cursos para el periodo seleccionado.
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {cursos.map((c) => {
                        const active = c.id === cursoId;
                        return (
                          <li key={c.id}>
                            <button
                              onClick={() => setCursoId(c.id)}
                              className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                                active
                                  ? "bg-blue-600 text-white border-blue-700 shadow-md"
                                  : "bg-white text-gray-800 border-gray-200 hover:bg-blue-50"
                              }`}
                            >
                              <div className="text-sm font-semibold">
                                {c.nombre}
                              </div>
                              <div
                                className={`text-xs ${
                                  active ? "text-blue-100" : "text-gray-500"
                                }`}
                              >
                                {c.codigo || c.id}
                              </div>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            {/* Panel inscritos */}
            <div className="md:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Estudiantes inscritos
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setAddOpen(true)}
                      disabled={!cursoId}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm disabled:opacity-60"
                    >
                      <Plus className="h-4 w-4" />
                      Agregar estudiante
                    </button>
                  </div>
                </div>

                <div className="p-4">
                  {!cursoId ? (
                    <div className="text-center text-gray-500 text-sm py-16">
                      Selecciona un curso para ver sus inscritos.
                    </div>
                  ) : loadingMatriculas ? (
                    <div className="text-gray-500 text-sm">
                      Cargando estudiantes...
                    </div>
                  ) : matriculas.length === 0 ? (
                    <div className="text-center text-gray-500 text-sm py-16">
                      Aún no hay estudiantes inscritos en este curso.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                              Estudiante
                            </th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                              Email
                            </th>
                            <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">
                              Acción
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {matriculas.map((m) => (
                            <tr
                              key={m.id}
                              className="hover:bg-blue-50 transition-colors"
                            >
                              <td className="px-6 py-4">
                                <div className="text-sm font-semibold text-gray-900">
                                  {m.estudiante?.nombre}
                                </div>
                                <div className="text-xs text-gray-500">
                                  ID: {m.estudiante?.id}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-700">
                                {m.estudiante?.email}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <button
                                  onClick={() => askRemove(m)}
                                  className="inline-flex items-center gap-2 px-3 py-2 bg-white hover:bg-red-50 text-red-600 text-sm font-medium rounded-lg border border-red-200 transition-all shadow-sm"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Quitar
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Agregar (buscador) */}
        {addOpen && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-blue-600" />
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Agregar estudiante
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setAddOpen(false);
                    setResults([]);
                    setQ("");
                  }}
                  className="text-gray-600 hover:text-gray-900 text-sm"
                >
                  Cerrar
                </button>
              </div>

              <form onSubmit={handleSearch} className="p-4 flex items-center gap-2">
                <div className="flex-1 flex items-center w-full bg-white border border-gray-300 rounded-lg shadow-sm px-3 py-2">
                  <Search className="w-5 h-5 text-gray-400 mr-2" />
                  <input
                    type="email"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Ingresa correo electrónico del estudiante..."
                    className="flex-1 outline-none text-gray-700 placeholder-gray-400"
                  />
                </div>
                <button
                  disabled={searching || !q.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm disabled:opacity-60"
                >
                  {searching ? "Buscando..." : "Buscar"}
                </button>
              </form>

              <div className="px-4 pb-5 max-h-[360px] overflow-y-auto">
                {results.length === 0 ? (
                  <div className="text-center text-gray-500 text-sm py-10">
                    {q.trim()
                      ? "Sin resultados."
                      : "Ingresa un término para buscar estudiantes."}
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {results.map((e) => (
                      <li
                        key={e.id}
                        className="py-3 flex items-center justify-between"
                      >
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {e.nombre}
                          </div>
                          <div className="text-xs text-gray-500">{e.email}</div>
                        </div>
                        <button
                          onClick={() => handleAgregar(e)}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-white hover:bg-green-50 text-green-700 text-sm font-medium rounded-lg border border-green-200 transition-all shadow-sm"
                        >
                          <Plus className="h-4 w-4" />
                          Inscribir
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Confirmación mínima para quitar */}
        <ConfirmModal
          open={confirmOpen}
          title="Quitar matrícula"
          confirmLabel="Quitar"
          onClose={() => {
            setConfirmOpen(false);
            setToRemove(null);
          }}
          onConfirm={doRemove}
          loading={false}
        />
      </main>

      <Footer />
    </div>
  );
}
