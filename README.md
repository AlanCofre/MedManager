# MedManager

MedManager es un sistema para la **gestión de licencias médicas de estudiantes**, permitiendo que estudiantes, secretarias y funcionarios gestionen, revisen y verifiquen licencias de manera digital y eficiente.

---

## Descripción general

El proyecto surge de la necesidad de **automatizar el proceso de revisión y verificación de licencias médicas**. Antes, este proceso era manual y propenso a errores o retrasos. Con MedManager:

- Los estudiantes pueden subir sus licencias médicas.
- Las secretarias revisan y verifican o rechazan las licencias.
- Los funcionarios pueden consultar el estado de las licencias de sus estudiantes.

El sistema busca **agilizar la gestión**, reducir errores y centralizar la información en un solo lugar.

---

## Características principales

- Registro y autenticación de usuarios (Estudiante, Secretaria, Funcionario) mediante JWT.
- Subida de licencias médicas en formato PDF por parte de los estudiantes.
- Revisión y verificación de licencias por secretarias.
- Consulta de licencias verificadas por funcionarios.
- Interfaz intuitiva y responsiva con React y TailwindCSS.
- Historial de licencias revisadas y verificadas.

---

## Arquitectura general

- **Frontend:** React.js con TailwindCSS.
- **Backend:** Node.js con Express.js.
- **Base de datos:** MySQL y Supabase.
- **Seguridad:** JWT para autenticación.
- **Gestión de ramas:** 
  - `frontend` y `backend` en ramas separadas.
  - Integración en `develop` antes de fusionar a `main`.

---

## Pruebas

- Subir una licencia desde la cuenta de estudiante.
- Revisar la licencia desde la cuenta de secretaria y marcarla como verificada o rechazada.
- Verificar que la licencia aparezca correctamente en la vista de funcionario.
- Revisar historial y notificaciones.

---

Integrantes

| Nombre             | Rol                    | Correo institucional                                                    |
| ------------------ | ---------------------- | ----------------------------------------------------------------------- |
| Alan Cofre         | Scrum Master / Backend | [acofre2019@alu.uct.cl](mailto:acofre2019@alu.uct.cl)                   |
| Fabian Sanchez     | Backend                | [fsanchez2024@alu.uct.cl](mailto:fsanchez2024@alu.uct.cl)               |
| Victor Gonzales    | Backend                | [victor.gonzales2024.alu.uct.cl](mailto:victor.gonzales2024.alu.uct.cl) |
| Matias Crisosto    | Backend                | [mcrisosto2024.alu.uct.cl](mailto:mcrisosto2024.alu.uct.cl)             |
| Franco Araya       | Backend                | [franco.araya2024.alu.uct.cl](mailto:franco.araya2024.alu.uct.cl)       |
| Amanda Garcia      | Frontend               | [amanda.garcia2024.alu.uct.cl](mailto:amanda.garcia2024.alu.uct.cl)     |
| Vicente Flores     | Frontend               | [vflores2024.alu.uct.cl](mailto:vflores2024.alu.uct.cl)                 |
| José Cifuentes     | Frontend               | [jcifuentes2024.alu.uct.cl](mailto:jcifuentes2024.alu.uct.cl)           |

---

## Estado del proyecto

[En pausa momentaneamente]
---

## Licencia / Uso académico

Este proyecto es académico y fue desarrollado con fines educativos en el contexto universitario. No se pretende uso comercial.
