import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  es: {
    translation: {
      acces: {
        title: "Accesibilidad",
        textSize: "Tamaño de Texto",
        current: "Actual",
        small: "Pequeña",
        normal: "Normal",
        large: "Grande",
        extraLarge: "Extra Grande",
        decrease: "Disminuir tamaño de texto",
        reset: "Restablecer tamaño normal de texto",
        increase: "Aumentar tamaño de texto",
        largeCursor: "Cursor Grande",
        state: "Estado",
        activated: "Activado",
        deactivated: "Desactivado",
        enable: "Activar",
        disable: "Desactivar",
        darkMode: "Modo Oscuro",
        upcoming: "Próximamente: Más opciones de accesibilidad",
        footer: "♿ Mejorando la accesibilidad para todos",
        openMenu: "Abrir menú de accesibilidad",
        closeMenu: "Cerrar menú",
        langSwitchTitle: "Cambiar a Inglés",
        langSwitchTitleEn: "Switch to Spanish",
        normalBtn: "Normal",
      },

      // 🧩 ConfirmModal
      confirmModal: {
        rejectMsg: "Escribe la razón del rechazo (obligatorio):",
        noteMsg: "Agrega una nota u observación (opcional):",
        rejectPlaceholder: "Motivo del rechazo...",
        notePlaceholder: "Notas (opcional)...",
        errorNote: "Debe ingresar una razón para rechazar.",
      },

      // 🧩 Botones comunes
      btn: {
        cancel: "Cancelar",
        submit: "Enviar",
        confirm: "Confirmar",
        reject: "Rechazar",
        loading: "Procesando...",
        delete: "Eliminar",
        close: "Cerrar",
      },

      toast: {
        close: "cerrar",
      },


      // 🧩 Evaluación
      evaluar: {
        title: "Evaluar solicitud",
      },

      // 🧩 Announcement
      announcement: {
        prefixSec: "Sec.",
        userFallback: "Usuario",
        secretaryTitle: "Bienvenida, {{name}}",
        secretaryParagraph1:
          "Este es tu panel de trabajo. Desde aquí puede revisar las licencias pendientes, generar revisiones cuando falte documentación y consultar el historial de acciones.",
        secretaryParagraph2:
          'Accede rápidamente a "Pendientes" para atender nuevos casos o a "Historial" para revisar gestiones anteriores. Usa "Generar Revisión" para solicitar información adicional.',
        teachTitle: "Bienvenido, Prof. {{name}}",
        teachParagraph1: "Aquí puede revisar las licencias médicas asignadas a tus estudiantes y consultar el historial de acciones realizadas.",
        teachParagraph2: 'Para mas informacion, entra a la pestaña "Como usar". Aqui se explica a detalle el funcionamiento del sistema.',
        adminTitle: "Bienvenido, Administrador {{name}}",
        adminParagraph1: "Panel de control administrativo. Gestiona periodos académicos, cursos, matrículas y supervisa el funcionamiento completo del sistema de licencias médicas.",
        adminParagraph2: 'Accede a "Cursos" y "Matrículas" para gestionar la estructura académica, "Periodos" para activar/desactivar ciclos, y "Tablero" para ver resúmenes estadísticos.',
        userTitleLine1: "La nueva manera de verificar",
        userTitleLine2: "tus licencias médicas.",
        userParagraph1:
          "Ahora puedes verificar el estado de tus licencias médicas. Gracias a esto, puedes saber si fueron validadas, rechazadas o si aún están en proceso de revisión.",
        userParagraph2:
          "Para más información, solo basta con darle click a este anuncio.",
        altText: "Verificación",

      },

      // 🧩 BannerSection
      banner: {
        titleLine1: "Gestión de licencias",
        titleLine2: "médicas",
        btnHowUse: "¿Cómo se usa?",
        btnManage: "Gestionar",
        btnGenerate: "Generar Revisión",
        btnHistory: "Historial",
        btnResults: "Verificar Resultados",
        btnMatriculas: "Mis Matrículas",
        enrollments: "Matrículas",
        btnRegularidad: "Regularidad académica",
        btnAlumnos: "Alumnos",
        btnTablero: "Tablero",
        btnPeriodos: "Periodos",
        btnCursos: "Cursos",
      },

      // 🧩 Footer
      footer: {
        contactTitle: "¿Necesitas ayuda?",
        contactText: "Contacta nuestro soporte:",
        emailLabel: "Enviar correo a soporte",
        phoneLabel: "Llamar a soporte",
        email: "Soporte@MedLeaveManager.com",
        phone: "+56 123 456 789",
        copy: "© {{year}} MedLeaveManager. Todos los derechos reservados."
      },

      // 🧩 Navbar
      user: {
        label: "Usuario",
        defaultName: "Usuario",
        guest: "Invitado",
      },
      prefix: {
        secretary: "Sec."
      },
      notifications: {
        empty: "No hay notificaciones disponibles.",
        read: "Leer",
        viewMore: "Ver más",
        newLicense: "Nueva licencia subida por {{name}}",
        newLicenseDesc: "Licencia médica nueva. Revisar documentos y confirmar recepción.",
        licensePending: "Licencia de {{name}} pendiente",
        licensePendingDesc: "Licencia médica requiere revisión.",
        allergyLicense: "Licencia de alergias en revisión",
        allergyLicenseDesc: "Tu solicitud de licencia está en proceso de evaluación.",
        covidAccepted: "Licencia Covid aceptada",
        covidAcceptedDesc: "Licencia revisada y aceptada. Tu ausencia queda registrada.",
        systemMaintenance: "Mantenimiento del sistema programado",
        systemMaintenanceDesc: "Habrá mantenimiento en el servidor mañana a las 22:00 hrs. El sistema no estará disponible durante una hora.",
        type: {
          pendiente: "Pendiente",
          revision: "En revisión",
          verificada: "Verificada",
          soporte: "Soporte",
        },
      },

      // 🧩 Login
      "roles.student": "Alumno",
      "roles.studentDesc": "Solicitar y gestionar licencias médicas",
      "roles.secretary": "Secretaria",
      "roles.secretaryDesc": "Gestionar licencias y asistir a usuarios",
      "roles.teacher": "Profesor",
      "roles.teacherDesc": "Gestionar licencias y consultar informes",
      "roles.admin": "Administrador",
      "roles.adminDesc": "Gestión completa del sistema",
      
      login: {
        selectUserType: "Selecciona el tipo de usuario con el que deseas ingresar",
        howAccess: "¿Cómo deseas acceder al sistema?",
        submit: "Ingresar al sistema",
        loading: "Ingresando...",
        bannerAlt: "Pantalla de inicio de sesión de MedManager",
      },

      // 🧩 Registro
      registro: {
        title: "Registro",
        nameLabel: "Nombre y Apellido:",
        namePlaceholder: "Ingresa tu nombre y apellido",

        emailLabel: "Correo Electrónico:",
        emailPlaceholder: "Ingresa tu correo electrónico",

        passLabel: "Contraseña:",
        passPlaceholder: "Ingresa tu contraseña",

        confirmPassLabel: "Confirmar Contraseña:",
        confirmPassPlaceholder: "Ingresa tu contraseña otra vez",

        errorNoMatch: "Las contraseñas no coinciden",
        errorServer: "Error de conexión con el servidor",
        errorRegister: "Error al registrar usuario",

        btnRegister: "Registrarse",
        btnRegisterLoading: "Registrando...",

        linkQuestion: "¿Ya tienes una cuenta?",
        linkLogin: "Inicia sesión aquí.",
        bannerAlt: "Pantalla de registro de MedManager",
      },

      // 🧩 ComoUsar
      comoUsar: {
        common: {
          imgAlt: "Ayuda",
        },
        secretary: {
          title: "Guía rápida — Secretaría",
          objectiveTitle: "Objetivo",
          objectiveText:
            "Gestionar eficientemente las licencias médicas recibidas: revisar, generar revisiones, validar o rechazar y mantener el historial actualizado.",
          stepsTitle: "Pasos recomendados",
          step1:
            'Inicia sesión con tu cuenta de secretaria. Verifica que el encabezado muestre "Sec. ...".',
          step2:
            'Accede a "Pendientes" desde el menú para ver las licencias nuevas. Usa filtros (fecha, facultad) para filtrar resultados.',
          step3:
            'Abre una licencia y utiliza "Generar Revisión" si falta documentación o deseas reasignarla.',
          step4:
            'Marca la licencia como "Verificada" o "Rechazada" según corresponda y agrega observaciones.',
          step5:
            'Consulta "Historial" para ver acciones pasadas y exportar comprobantes si es necesario.',
          footerNote:
            "Si necesitas más ayuda, contacta al soporte desde el pie de página.",
        },
        teacher: {
          title: "Guía rápida — Profesor",
          objectiveTitle: "Objetivo",
          objectiveText:
            "Aquí puedes revisar las licencias médicas presentadas por tus estudiantes, comprobar si fueron validadas o rechazadas, y ver cómo afectan la regularidad por curso-sección.",
          stepsTitle: "Pasos útiles",
          step1:
            'Entra a la vista del curso/sección desde el menú "Nombre Pendiente" para ver la lista de alumnos y su estado de regularidad.',
          step2:
            "Usa los filtros por periodo y estado para localizar alumnos afectados por licencias validadas.",
          step3:
            "Haz click en el badge de estado para ver la licencia asociada (folio, fechas y PDF). Función en progreso.",
          step4:
            "Si necesitas información adicional, solicita a Secretaría que genere una revisión desde la bandeja de pendientes. Función en progreso.",
          footerNote:
            'Para más información, presiona "¿Cómo se usa?" en el anuncio o en el header (disponible para profesores).',
        },
        admin: {
          title: "Guía rápida — Administrador",
          objectiveTitle: "Objetivo",
          objectiveText:
            "Supervisar la operación completa del gestor: revisar licencias, validar políticas de regularidad, gestionar usuarios y exportar reportes por periodo, curso y sección. Se tiene control total sobre las funciones del sistema. Se recomienda cuidado al hacer cambios en la configuración.",
          stepsTitle: "Tareas recomendadas",
          step1:
            "Revisa los reportes de regularidad por curso/periodo y ajusta políticas si es necesario.",
          step2:
            "Accede a la bandeja de Secretaría para auditar decisiones y validar procesos.",
          step3:
            "Configura periodos académicos y parámetros de expiración de licencias desde el panel de administración.",
          step4: "Modifica el personal y permisos de ser necesario.",
          footerNote:
            "Contacta al soporte para cambios en la configuración del sistema.",
        },
        default: {
          title: "¿Cómo se usa?",
          intro:
            'Esta sección explica los pasos básicos para usar el gestor de licencias desde una cuenta estándar. Inicia sesión, sube o selecciona tu licencia y utiliza "Verificar resultados" para conocer su estado.',
          stepsTitle: "Pasos",
          step1: "Inicia sesión con tu cuenta.",
          step2:
            'Ve a "Generar Revisión" para subir una nueva licencia o solicitar revisión.',
          step3:
            'Usa "Verificar Resultados" para ver el estado actual de tus licencias.',
          step4: "Consulta el historial para ver decisiones anteriores.",
          footerNote:
            "Si eres secretaria y necesitas la guía específica, inicia sesión con una cuenta de secretaria.",
        },
      },

      // 🧩 Admin Cursos
      adminCursos: {
        title: "Gestión de Cursos",
        subtitle: "Crea, edita y lista cursos por periodo y profesor.",

        filters: {
          period: "Periodo",
          professor: "Profesor",
          allProfessors: "Todos",
          results: "{{count}} resultados",
        },

        list: {
          loading: "Cargando cursos...",
          empty: "No hay cursos para los filtros seleccionados.",
        },

        table: {
          code: "Código",
          name: "Nombre",
          section: "Sección",
          semester: "Semestre",
          period: "Periodo",
          professor: "Profesor",
          action: "Acción",
        },

        actions: {
          create: "Crear curso",
          edit: "Editar",
          delete: "Eliminar",
        },

        modal: {
          createTitle: "Crear curso",
          editTitle: "Editar curso",
          fields: {
            codeLabel: "Código",
            codePlaceholder: "INF-101",
            nameLabel: "Nombre",
            namePlaceholder: "Introducción a la Programación",
            sectionLabel: "Sección",
            sectionPlaceholder: "001",
            semesterLabel: "Semestre (1..10)",
            periodLabel: "Periodo",
            professorLabel: "Profesor",
            selectPlaceholder: "Selecciona...",
          },
          cancel: "Cancelar",
          create: "Crear curso",
          saveChanges: "Guardar cambios",
          note:
            "* No se permite repetir Código + Sección en el mismo Periodo.",
        },

        toast: {
          loadPeriodsError: "No se pudieron cargar periodos/profesores.",
          loadCoursesError: "No se pudo cargar la oferta de cursos.",
          updateSuccess: "Curso actualizado correctamente.",
          createSuccess: "Curso creado correctamente.",
          duplicateError:
            "Duplicado: Código + Sección ya existe en ese Periodo (409).",
          invalidError:
            "Datos inválidos: verifica periodo/profesor/semestre (422).",
          saveError: "No se pudo guardar el curso.",
          deleteSuccess: "Curso eliminado.",
          deleteInvalid:
            "No se pudo eliminar: referencia inválida (422).",
          deleteError: "Error al eliminar el curso.",
        },

        confirm: {
          title: "Eliminar curso",
          message:
            "¿Seguro que deseas eliminar este curso? Esta acción no se puede deshacer.",
          cancel: "Cancelar",
          confirm: "Eliminar",
        },
      },
      // 🧩 Detalle Licencia
      licDetail: {
        loading: "Cargando licencia...",
        headerTitle: "Detalle de Licencia",
        headerId: "ID: {{id}}",
        backBtn: "← Volver a Licencias",

        studentSectionTitle: "Datos del Estudiante",
        student: {
          name: "Nombre:",
          studentId: "Legajo:",
          faculty: "Facultad:",
          email: "Email:",
        },

        licenseSectionTitle: "Datos de la Licencia",
        dates: {
          emission: "Fecha de emisión:",
          submitted: "Fecha enviada:",
          restStart: "Inicio de reposo:",
          restEnd: "Fin de reposo:",
        },

        attachmentSectionTitle: "Archivo Adjunto",
      },

      attachment: {
        none: "Sin archivo adjunto",
        pdf: "Documento PDF",
        image: "Imagen",
        other: "Archivo adjunto",
        preview: "Previsualizar",
        download: "Descargar",
        notPreviewableNote: "* Este tipo de archivo no se puede previsualizar",
      },

      // 🧩 Detalle Entrega Profesor
      profEntrega: {
        loading: "Cargando entrega...",
        notFoundTitle: "Entrega no encontrada",
        notFoundDesc: "La entrega {{id}} no existe o fue removida.",
        noAccessTitle: "No tienes acceso",
        noAccessDesc:
          "Esta entrega no pertenece a tus cursos. Si crees que es un error, contacta a Secretaría.",
        back: "Volver",

        headerTitle: "Entrega #{{id}}",
        headerSubtitle: "{{course}} · {{period}}",
        badgeSeen: "Visto",

        studentTitle: "Estudiante",
        datesTitle: "Fechas",
        dates: {
          emission: "Emisión",
          startRest: "Inicio reposo",
          endRest: "Fin reposo",
          sent: "Enviado",
        },

        secretaryObsTitle: "Observaciones de Secretaría",
        secretaryObsEmpty: "Sin observaciones por ahora.",

        download: {
          button: "Descargar documento",
          downloading: "Descargando...",
          lastUpdate: "Última actualización UI: ahora",
        },

        backToList: "Volver al listado",

        toast: {
          downloadStartedTitle: "Descarga iniciada",
          downloadStartedDesc:
            "Si el navegador bloquea la descarga, permite ventanas emergentes.",
          downloadErrorTitle: "No se pudo descargar",
          downloadErrorDesc:
            "Revisa tu conexión o vuelve a intentarlo.",
          retry: "Reintentar",
        },
      },
      
      // 🧩 Evaluar Licencia
      evaluarLicencia: {
        loading: "Cargando licencia...",

        headerTitle: "Evaluación de Licencia",
        headerId: "ID de licencia: {{id}}",
        backToInbox: "Volver a Bandeja",

        studentSectionTitle: "Datos del Estudiante",
        licenseSectionTitle: "Datos de la Licencia",
        attachmentSectionTitle: "Archivo Adjunto",

        student: {
          name: "Nombre",
          studentId: "Legajo",
          faculty: "Facultad",
          email: "Email",
        },

        licenseDates: {
          emission: "Fecha de emisión de licencia",
          submitted: "Fecha enviado",
          restStart: "Fecha inicio reposo",
          restEnd: "Fecha fin de reposo",
        },

        attachment: {
          noFile: "Sin archivo adjunto",
          pdfLabel: "Documento PDF",
          imageLabel: "Imagen",
          otherLabel: "Archivo adjunto",
          preview: "Previsualizar",
          download: "Descargar",
          notPreviewable: "* Este tipo de archivo no se puede previsualizar",
        },

        actions: {
          accept: "Aceptar Licencia",
          reject: "Rechazar Licencia",
        },

        infoNoteBold: "Nota:",
        infoNote:
          "Al aceptar o rechazar, podrás agregar comentarios que serán enviados al estudiante.",

        modal: {
          acceptTitle: "Confirmar Aceptación",
          rejectTitle: "Confirmar Rechazo",
          acceptConfirm: "Aceptar Licencia",
          rejectConfirm: "Rechazar Licencia",
        },

        toast: {
          rejectReasonRequired: "Debes indicar un motivo para rechazar",
          acceptedSuccess: "Licencia aceptada exitosamente.",
          rejectedSuccess: "Licencia rechazada exitosamente.",
        },
      },
      // 🧩 Estudiante Regularidad
      profRegularidad: {
        accessDeniedTitle: "Acceso denegado",
        accessDeniedBody:
          "Solo Profesores y Administradores pueden ver esta página.",
        accessDeniedBack: "Volver",

        notFoundTitle: "Estudiante no encontrado",
        notFoundBack: "Volver al listado",

        header: {
          badgeRisk: "En riesgo por asistencia",
          badgeRegular: "Regular",
          summary:
            "{{days}} días de licencia validados ({{percent}}%)",
          riskAlertTitle: "Atención: El estudiante ha excedido el umbral de faltas",
          riskAlertBody:
            "Según las licencias médicas validadas en el periodo activo, el estudiante ha perdido {{percent}}% de clases. Revisa el detalle y coordina con Secretaría si corresponde.",
        },

        licensesTitle: "Licencias",

        labels: {
          emission: "Emisión",
        },

        status: {
          validated: "Validada",
          rejected: "Rechazada",
        },

        actions: {
          view: "Ver",
          download: "Descargar",
          backToList: "Volver al listado",
        },

        // Fila de folio: permite override, pero da un texto por defecto
        licenseRowFolio: "Folio {{id}}",
      },

      // 🧩 ForgotPassword
      forgotPassword: {
        title: "Recuperar contraseña",
        description:
          "Ingresa tu correo y te enviaremos un código de verificación para restablecer tu contraseña.",
        emailPlaceholder: "Correo electrónico",
        buttonSending: "Enviando...",
        buttonMain: "Recuperar contraseña",
        buttonResendIn: "Reenviar en {{seconds}}s",
        toastInvalidEmail: "Por favor ingresa un correo válido",
        toastCodeSent: "Se envió un código a tu correo.",
      },

      // 🧩 Generar Revisón
      studentGenerateRevision: {
        bannerTitle: "Generar revisión de licencia",

        folioLabel: "Número de folio",
        folioPlaceholder: "Escribe el número de folio en la parte superior de tu documento.",

        fechaEmisionLabel: "Fecha de emisión",
        fechaEmisionHelp: "Fecha de creación de la licencia en el centro de salud.",

        fechaInicioLabel: "Fecha inicio reposo",
        fechaFinLabel: "Fecha final reposo",

        motivoLabel: "Motivo médico o patología (resumen)",
        motivoPlaceholder: "Ej: Bronquitis, COVID-19, Migraña",
        motivoHelp:
          "Requerido. Mínimo 3 caracteres. Sólo letras (incluye acentos), números, espacios, comas y guiones.",
        motivoError: "El motivo no es válido. Revisa el formato.",

        cursosLabel: "Cursos afectados por la licencia",
        cursosHelpA11y: "Ayuda: Solo verás cursos del periodo activo",
        cursosEmpty: "No hay cursos activos disponibles.",
        cursosError: "Debes seleccionar al menos un curso afectado por tu licencia.",
        cursosFootnote: "Solo verás cursos del periodo activo.",

        actions: {
          clear: "Limpiar",
          next: "Siguiente: Confirmar",
        },

        upload: {
          instructions: "Arrastra un documento PDF o haz clic para seleccionarlo.",
          selectedFile: "Archivo seleccionado:",
        },

        alerts: {
          motivoInvalid:
            "Motivo médico inválido. Debe tener al menos 3 caracteres y solo letras (incluye acentos), números, espacios, comas y guiones.",
          missingFields: "Completa todos los campos obligatorios antes de continuar.",
        },

        errors: {
          invalidPdf: "Por favor sube un archivo PDF válido.",
          onlyPdf: "Solo se permiten archivos PDF.",
          sendMissingData: "Faltan datos obligatorios para el envío.",
          sendMotivoInvalid:
            "El motivo médico no es válido (mín. 3 caracteres; sin caracteres especiales).",
        },

        toast: {
          success: "Licencia enviada correctamente.",
          errorPrefix: "Error al enviar: {{message}}",
        },
      },

    },
  },

  en: {
    translation: {
      acces: {
        title: "Accessibility",
        textSize: "Text Size",
        current: "Current",
        small: "Small",
        normal: "Normal",
        large: "Large",
        extraLarge: "Extra Large",
        decrease: "Decrease text size",
        reset: "Reset to normal text size",
        increase: "Increase text size",
        largeCursor: "Large Cursor",
        state: "State",
        activated: "Enabled",
        deactivated: "Disabled",
        enable: "Enable",
        disable: "Disable",
        darkMode: "Dark Mode",
        upcoming: "Coming soon: More accessibility options",
        footer: "♿ Improving accessibility for everyone",
        openMenu: "Open accessibility menu",
        closeMenu: "Close menu",
        langSwitchTitle: "Switch to English",
        langSwitchTitleEn: "Cambiar a Español",
        normalBtn: "Normal",
      },

      // 🧩 ConfirmModal
      confirmModal: {
        rejectMsg: "Please provide the reason for rejection (required):",
        noteMsg: "Add a note or observation (optional):",
        rejectPlaceholder: "Reason for rejection...",
        notePlaceholder: "Notes (optional)...",
        errorNote: "You must enter a reason to reject.",
      },

      // 🧩 Buttons
      btn: {
        cancel: "Cancel",
        submit: "Submit",
        confirm: "Confirm",
        reject: "Reject",
        loading: "Processing...",
        delete: "Delete",
        close: "Close",
      },

      toast: {
        close: "close",
      },

      // 🧩 Evaluation
      evaluar: {
        title: "Evaluate request",
      },

      // 🧩 Announcement
      announcement: {
        prefixSec: "Sec.",
        userFallback: "User",
        secretaryTitle: "Welcome, {{name}}",
        secretaryParagraph1:
          "This is your workspace. From here you can review pending licenses, generate reviews when documentation is missing, and consult the action history.",
        secretaryParagraph2:
          'Quickly access "Pending" to handle new cases or "History" to review previous actions. Use "Generate Review" to request additional information.',
        teachTitle: "Welcome Prof. {{name}}",
        teachParagraph1: "Here you can review the medical licenses assigned to your students and consult the history of actions taken.",
        teachParagraph2: 'For more information, go to the "How to use" tab. Here the system functionality is explained in detail.',
        adminTitle: "Welcome, Administrator {{name}}",
        adminParagraph1: "Administrative control panel. Manage academic periods, courses, enrollments and supervise the complete operation of the medical license system.",
        adminParagraph2: 'Access "Courses" and "Enrollments" to manage academic structure, "Periods" to activate/deactivate cycles, and "Dashboard" to view statistical summaries.',
        userTitleLine1: "The new way to verify",
        userTitleLine2: "your medical licenses.",
        userParagraph1:
          "Now you can check the status of your medical licenses. Thanks to this, you can know if they were validated, rejected, or are still under review.",
        userParagraph2:
          "For more information, just click on this announcement.",
        altText: "Verification",
      },

      // 🧩 BannerSection
        banner: {
        titleLine1: "Medical license",
        titleLine2: "management",
        btnHowUse: "How to use?",
        btnManage: "Manage",
        btnGenerate: "Generate Review",
        btnHistory: "History",
        btnResults: "Check Results",
        btnMatriculas: "My Enrollments",
        enrollments: "Enrollments",
        btnRegularidad: "Academic Regularity",
        btnAlumnos: "Students",
        btnTablero: "Dashboard",
        btnPeriodos: "Periods",
        btnCursos: "Courses",
      },

      // 🧩 Footer
      footer: {
        contactTitle: "Need help?",
        contactText: "Contact our support:",
        emailLabel: "Send email to support",
        phoneLabel: "Call support",
        email: "Soporte@MedLeaveManager.com",
        phone: "+56 123 456 789",
        copy: "© {{year}} MedLeaveManager. All rights reserved."
      },

      // 🧩 Navbar
      nav: {
        home: "Home",
      },
      user: {
        label: "User",
        defaultName: "User",
        guest: "Guest",
      },
      prefix: {
        secretary: "Sec."
      },
      notifications: {
        empty: "No notifications available.",
        read: "Mark as read",
        viewMore: "View more",
        newLicense: "New license uploaded by {{name}}",
        newLicenseDesc: "New medical license. Check documents and confirm receipt.",
        licensePending: "License from {{name}} pending",
        licensePendingDesc: "Medical license requires review.",
        allergyLicense: "Allergy license under review",
        allergyLicenseDesc: "Your license request is being evaluated.",
        covidAccepted: "Covid license accepted",
        covidAcceptedDesc: "License reviewed and accepted. Your absence is recorded.",
        systemMaintenance: "Scheduled system maintenance",
        systemMaintenanceDesc: "There will be server maintenance tomorrow at 10 PM. System unavailable for one hour.",
        type: {
          pendiente: "Pending",
          revision: "Under review",
          verificada: "Verified",
          soporte: "Support",
        },
      },
      // 🧩 Login
      "roles.teacher": "Teacher",
      "roles.teacherDesc": "Manage licenses and view reports",
      "roles.admin": "Administrator",
      "roles.adminDesc": "Full system management",
      "roles.student": "Student",
      "roles.studentDesc": "Request and manage medical licenses",
      "roles.secretary": "Secretary",
      "roles.secretaryDesc": "Manage licenses and assist users ",
      
      login: {
        selectUserType: "Select the type of user you want to log in as",
        howAccess: "How do you want to access the system?",
        submit: "Log in",
        loading: "Signing in...",
        bannerAlt: "MedManager login screen",
      },

      // 🧩 Registro
      registro: {
        title: "Sign Up",
        nameLabel: "Full Name:",
        namePlaceholder: "Enter your full name",

        emailLabel: "Email:",
        emailPlaceholder: "Enter your email",

        passLabel: "Password:",
        passPlaceholder: "Enter your password",

        confirmPassLabel: "Confirm Password:",
        confirmPassPlaceholder: "Re-enter your password",

        errorNoMatch: "Passwords do not match",
        errorServer: "Server connection error",
        errorRegister: "Error registering user",

        btnRegister: "Sign Up",
        btnRegisterLoading: "Registering...",

        linkQuestion: "Already have an account?",
        linkLogin: "Log in here.",
        bannerAlt: "MedManager registration screen",
      },

      // 🧩 ComoUsar
      comoUsar: {
        common: {
          imgAlt: "Help",
        },
        secretary: {
          title: "Quick Guide — Secretary",
          objectiveTitle: "Objective",
          objectiveText:
            "Efficiently manage received medical licenses: review, generate follow-ups, validate or reject them, and keep the history up to date.",
          stepsTitle: "Recommended steps",
          step1:
            'Log in with your secretary account. Check that the header shows "Sec. ...".',
          step2:
            'Go to "Pending" from the menu to see new licenses. Use filters (date, faculty) to refine results.',
          step3:
            'Open a license and use "Generate Review" if documentation is missing or you want to reassign it.',
          step4:
            'Mark the license as "Verified" or "Rejected" as appropriate and add comments.',
          step5:
            'Go to "History" to see past actions and export receipts if needed.',
          footerNote:
            "If you need more help, contact support from the footer section.",
        },
        teacher: {
          title: "Quick Guide — Teacher",
          objectiveTitle: "Objective",
          objectiveText:
            "Here you can review medical licenses submitted by your students, check whether they were validated or rejected, and see how they affect regularity per course-section.",
          stepsTitle: "Useful steps",
          step1:
            'Open the course/section view from the "Pending Name" menu to see the list of students and their regularity status.',
          step2:
            "Use filters by period and status to locate students affected by validated licenses.",
          step3:
            "Click the status badge to see the associated license (folio, dates and PDF). Feature in progress.",
          step4:
            "If you need more information, ask the Secretary to generate a review from the pending inbox. Feature in progress.",
          footerNote:
            'For more information, click "How to use?" in the announcement or in the header (available for teachers).',
        },
        admin: {
          title: "Quick Guide — Administrator",
          objectiveTitle: "Objective",
          objectiveText:
            "Oversee the complete operation of the manager: review licenses, validate regularity policies, manage users and export reports by period, course and section. You have full control over the system features, so configuration changes should be done carefully.",
          stepsTitle: "Recommended tasks",
          step1:
            "Review regularity reports by course/period and adjust policies if needed.",
          step2:
            "Access the Secretary inbox to audit decisions and validate processes.",
          step3:
            "Configure academic periods and license expiration parameters from the admin panel.",
          step4: "Update staff and permissions as needed.",
          footerNote:
            "Contact support for changes in the system configuration.",
        },
        default: {
          title: "How does it work?",
          intro:
            'This section explains the basic steps to use the license manager from a standard account. Log in, upload or select your license and use "Check results" to see its status.',
          stepsTitle: "Steps",
          step1: "Log in with your account.",
          step2:
            'Go to "Generate Review" to upload a new license or request a review.',
          step3:
            'Use "Check Results" to see the current status of your licenses.',
          step4: "Check the history to see past decisions.",
          footerNote:
            "If you are a secretary and need the specific guide, log in with a secretary account.",
        },
      },
      // 🧩 Admin Cursos
      adminCursos: {
        title: "Course Management",
        subtitle: "Create, edit, and list courses by period and teacher.",

        filters: {
          period: "Period",
          professor: "Teacher",
          allProfessors: "All",
          results: "{{count}} results",
        },

        list: {
          loading: "Loading courses...",
          empty: "No courses for the selected filters.",
        },

        table: {
          code: "Code",
          name: "Name",
          section: "Section",
          semester: "Semester",
          period: "Period",
          professor: "Teacher",
          action: "Action",
        },

        actions: {
          create: "Create course",
          edit: "Edit",
          delete: "Delete",
        },

        modal: {
          createTitle: "Create course",
          editTitle: "Edit course",
          fields: {
            codeLabel: "Code",
            codePlaceholder: "INF-101",
            nameLabel: "Name",
            namePlaceholder: "Introduction to Programming",
            sectionLabel: "Section",
            sectionPlaceholder: "001",
            semesterLabel: "Semester (1..10)",
            periodLabel: "Period",
            professorLabel: "Teacher",
            selectPlaceholder: "Select...",
          },
          cancel: "Cancel",
          create: "Create course",
          saveChanges: "Save changes",
          note:
            "* Code + Section cannot be repeated within the same Period.",
        },

        toast: {
          loadPeriodsError: "Could not load periods/teachers.",
          loadCoursesError: "Could not load course offerings.",
          updateSuccess: "Course updated successfully.",
          createSuccess: "Course created successfully.",
          duplicateError:
            "Duplicate: Code + Section already exists in that Period (409).",
          invalidError:
            "Invalid data: check period/teacher/semester (422).",
          saveError: "Could not save the course.",
          deleteSuccess: "Course deleted.",
          deleteInvalid:
            "Could not delete: invalid reference (422).",
          deleteError: "Error deleting course.",
        },

        confirm: {
          title: "Delete course",
          message:
            "Are you sure you want to delete this course? This action cannot be undone.",
          cancel: "Cancel",
          confirm: "Delete",
        },
      },

      // 🧩 License Detail
      licDetail: {
        loading: "Loading license...",
        headerTitle: "License Detail",
        headerId: "ID: {{id}}",
        backBtn: "← Back to Licenses",

        studentSectionTitle: "Student Information",
        student: {
          name: "Name:",
          studentId: "Student ID:",
          faculty: "Faculty:",
          email: "Email:",
        },

        licenseSectionTitle: "License Information",
        dates: {
          emission: "Issue date:",
          submitted: "Submitted on:",
          restStart: "Rest start:",
          restEnd: "Rest end:",
        },

        attachmentSectionTitle: "Attachment",
      },

      attachment: {
        none: "No attached file",
        pdf: "PDF document",
        image: "Image",
        other: "Attached file",
        preview: "Preview",
        download: "Download",
        notPreviewableNote: "* This file type cannot be previewed",
      },

      // 🧩 Detalle Entrega Profesor 
      profEntrega: {
        loading: "Loading delivery...",
        notFoundTitle: "Delivery not found",
        notFoundDesc: "Delivery {{id}} does not exist or was removed.",
        noAccessTitle: "You don't have access",
        noAccessDesc:
          "This delivery does not belong to your courses. If you think this is an error, contact the Secretary's office.",
        back: "Back",

        headerTitle: "Delivery #{{id}}",
        headerSubtitle: "{{course}} · {{period}}",
        badgeSeen: "Seen",

        studentTitle: "Student",
        datesTitle: "Dates",
        dates: {
          emission: "Issue date",
          startRest: "Rest start",
          endRest: "Rest end",
          sent: "Submitted",
        },

        secretaryObsTitle: "Secretary's notes",
        secretaryObsEmpty: "No notes yet.",

        download: {
          button: "Download document",
          downloading: "Downloading...",
          lastUpdate: "Last UI update: just now",
        },

        backToList: "Back to list",

        toast: {
          downloadStartedTitle: "Download started",
          downloadStartedDesc:
            "If the browser blocks the download, allow pop-ups.",
          downloadErrorTitle: "Could not download",
          downloadErrorDesc:
            "Check your connection or try again.",
          retry: "Retry",
        },
      },

      // 🧩 Evaluar
      evaluarLicencia: {
        loading: "Loading license...",

        headerTitle: "License Evaluation",
        headerId: "License ID: {{id}}",
        backToInbox: "Back to Inbox",

        studentSectionTitle: "Student Data",
        licenseSectionTitle: "License Data",
        attachmentSectionTitle: "Attachment",

        student: {
          name: "Name",
          studentId: "Student ID",
          faculty: "Faculty",
          email: "Email",
        },

        licenseDates: {
          emission: "License issue date",
          submitted: "Submitted date",
          restStart: "Rest start date",
          restEnd: "Rest end date",
        },

        attachment: {
          noFile: "No attachment",
          pdfLabel: "PDF document",
          imageLabel: "Image",
          otherLabel: "Attached file",
          preview: "Preview",
          download: "Download",
          notPreviewable: "* This file type cannot be previewed",
        },

        actions: {
          accept: "Accept license",
          reject: "Reject license",
        },

        infoNoteBold: "Note:",
        infoNote:
          "When accepting or rejecting, you can add comments that will be sent to the student.",

        modal: {
          acceptTitle: "Confirm acceptance",
          rejectTitle: "Confirm rejection",
          acceptConfirm: "Accept license",
          rejectConfirm: "Reject license",
        },

        toast: {
          rejectReasonRequired: "You must provide a reason to reject",
          acceptedSuccess: "License accepted successfully.",
          rejectedSuccess: "License rejected successfully.",
        },
      },

      // 🧩 Estudiante Regularidad
      profRegularidad: {
        accessDeniedTitle: "Access denied",
        accessDeniedBody:
          "Only Teachers and Administrators can view this page.",
        accessDeniedBack: "Go back",

        notFoundTitle: "Student not found",
        notFoundBack: "Back to list",

        header: {
          badgeRisk: "At risk due to attendance",
          badgeRegular: "Regular",
          summary:
            "{{days}} validated medical leave days ({{percent}}%)",
          riskAlertTitle: "Warning: Student exceeded absence threshold",
          riskAlertBody:
            "Based on validated medical licenses in the active period, the student has missed {{percent}}% of classes. Review the details and coordinate with the Secretary if applicable.",
        },

        licensesTitle: "Licenses",

        labels: {
          emission: "Issue date",
        },

        status: {
          validated: "Validated",
          rejected: "Rejected",
        },

        actions: {
          view: "View",
          download: "Download",
          backToList: "Back to list",
        },

        licenseRowFolio: "Folio {{id}}",
      },

      // 🧩 ForgotPassword
      forgotPassword: {
        title: "Recover Password",
        description:
          "Enter your email and we'll send you a verification code to reset your password.",
        emailPlaceholder: "Email",
        buttonSending: "Sending...",
        buttonMain: "Recover Password",
        buttonResendIn: "Resend in {{seconds}}s",
        toastInvalidEmail: "Please enter a valid email",
        toastCodeSent: "A verification code was sent to your email.",
      },


      // 🧩 Generar Revisón
            studentGenerateRevision: {
        bannerTitle: "Submit medical license review",

        folioLabel: "Folio number",
        folioPlaceholder: "Enter the folio number at the top of your document.",

        fechaEmisionLabel: "Issue date",
        fechaEmisionHelp: "Date when the license was created at the health center.",

        fechaInicioLabel: "Rest start date",
        fechaFinLabel: "Rest end date",

        motivoLabel: "Medical reason or condition (summary)",
        motivoPlaceholder: "E.g.: Bronchitis, COVID-19, Migraine",
        motivoHelp:
          "Required. Minimum 3 characters. Only letters (including accents), numbers, spaces, commas, and hyphens.",
        motivoError: "The reason is not valid. Check the format.",

        cursosLabel: "Courses affected by the license",
        cursosHelpA11y: "Help: You will only see courses from the active period.",
        cursosEmpty: "There are no active courses available.",
        cursosError: "You must select at least one course affected by your license.",
        cursosFootnote: "You will only see courses from the active period.",

        actions: {
          clear: "Clear",
          next: "Next: Confirm",
        },

        upload: {
          instructions: "Drag a PDF document here or click to select it.",
          selectedFile: "Selected file:",
        },

        alerts: {
          motivoInvalid:
            "Invalid medical reason. It must have at least 3 characters and only letters (including accents), numbers, spaces, commas and hyphens.",
          missingFields: "Please complete all required fields before continuing.",
        },

        errors: {
          invalidPdf: "Please upload a valid PDF file.",
          onlyPdf: "Only PDF files are allowed.",
          sendMissingData: "Missing required data to send.",
          sendMotivoInvalid:
            "The medical reason is not valid (min. 3 characters; no special characters).",
        },

        toast: {
          success: "License sent successfully.",
          errorPrefix: "Error when sending: {{message}}",
        },
      },

    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng:
    localStorage.getItem("lang") ||
    (navigator.language?.startsWith("en") ? "en" : "es"),
  fallbackLng: "es",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
