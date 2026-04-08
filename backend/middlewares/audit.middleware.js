// backend/middlewares/audit.middleware.js
import LogAuditoria from '../src/models/LogAuditoria.js'

// Debe coincidir EXACTO con el ENUM de la tabla `logauditoria`
const ACCIONES_PERMITIDAS = new Set([
  'crear cuenta',
  'actualizar cuenta',
  'recuperar contraseña',
  'emitir licencia',
  'aceptar licencia',
  'rechazar licencia',
])

const ACCIONES_SALTARSE = new Set(['iniciar sesion', 'iniciar sesión', 'login'])

const RECURSOS_NORMALIZADOS = new Map([
  ['usuario', 'usuario'],
  ['usuarios', 'usuario'],
  ['autenticacion', 'autenticación'],
  ['autenticación', 'autenticación'],
  ['licencia', 'licencia'],
  ['licenciamedica', 'licencia'],
  ['licencias', 'licencia']
])

function _normalizeText(text) {
  return String(text || '').trim().toLowerCase()
}

function _normalizePayload(payload) {
  if (payload === null || payload === undefined) return {}
  if (typeof payload === 'string') {
    try {
      const parsed = JSON.parse(payload)
      if (typeof parsed === 'object' && parsed !== null) return parsed
      return { value: parsed }
    } catch {
      return { value: payload }
    }
  }
  if (typeof payload === 'object') {
    if (Array.isArray(payload)) return { items: payload }
    return payload
  }
  return { value: payload }
}

/**
 * Middleware que adjunta req.audit(accion, recurso, payload?)
 * y registra en la tabla `logauditoria`.
 */
export function attachAudit() {
  return (req, _res, next) => {
    req.audit = async (accion, recurso, payload = null, opts = {}) => {
      try {
        // Guard: si se pasa opts.userId úsalo, sino obtener de req.user (compatibilidad)
        const id_usuario = opts?.userId ?? req.user?.id_usuario ?? req.user?.id ?? null

        // Si no hay usuario, no intentar insertar (evita FK violation)
        if (!id_usuario) {
          console.log('[audit] skip -> no valid user id to satisfy FK')
          return
        }

        const actionNorm = _normalizeText(accion)
        if (ACCIONES_SALTARSE.has(actionNorm)) {
          console.log(`[audit] skip -> acción excluida: "${accion}"`)
          return
        }

        const actionForDb = actionNorm === 'recuperar contrasena' ? 'recuperar contraseña' : actionNorm

        if (!ACCIONES_PERMITIDAS.has(actionForDb)) {
          console.warn(`[audit] ⚠️ Acción no incluida en ENUM: "${accion}" (normalizado: "${actionForDb}")`)
          return
        }

        const recursoNorm = _normalizeText(recurso)
        const recursoForDb = RECURSOS_NORMALIZADOS.get(recursoNorm) || recursoNorm || 'desconocido'

        // IP segura con fallback
        const xff = req.headers['x-forwarded-for']
        const ip = (Array.isArray(xff) ? xff[0] : (xff || '')).split(',')[0].trim() || req.ip || 'desconocida'

        const payloadObj = _normalizePayload(payload)

        await LogAuditoria.create({
          id_usuario,
          accion: actionForDb,
          recurso: recursoForDb,
          payload: Object.keys(payloadObj).length > 0 ? JSON.stringify(payloadObj) : null,
          ip,
          fecha: new Date(),
        })
      } catch (err) {
        console.error('[audit] Error registrando log:', err?.message || err)
      }
    }

    next()
  }
}
