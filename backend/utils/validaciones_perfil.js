const REG_TEL = /^[+()\-\s\d]{6,20}$/;

export function validarPerfilPayload(body = {}) {
  const errores = [];
  const out = {};

  if (body.email_alt != null && body.email_alt !== '') {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email_alt)) errores.push('email_alt inválido');
    else out.email_alt = String(body.email_alt).trim();
  } else out.email_alt = null;

  if (body.numero_telef != null && body.numero_telef !== '') {
    if (!REG_TEL.test(body.numero_telef)) errores.push('numero_telefono inválido');
    else out.numero_telef = String(body.numero_telef).trim();
  } else out.numero_telef = null;

  out.direccion = body.direccion ? String(body.direccion).trim().slice(0, 255) : null;

  if (body.foto_url != null && body.foto_url !== '') {
    try { new URL(body.foto_url); out.foto_url = body.foto_url; }
    catch { errores.push('foto_url inválida'); }
  } else out.foto_url = null;

  return { valido: errores.length === 0, errores, data: out };
}
