import bcrypt from "bcrypt";
import db from "../../../config/db.js";


// 🧩 REGISTRO
export const registerUser = async (req, res) => {
  try {
    const { correo_usuario, nombre, contrasena, id_rol } = req.body;

    // Verificar si el correo ya existe
    const [existingUser] = await db.query(
      "SELECT * FROM usuario WHERE correo_usuario = ?",
      [correo_usuario]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ error: "El correo ya está registrado" });
    }

    // Hashear la contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(contrasena, saltRounds);

    // Insertar nuevo usuario
    const [result] = await db.query(
      "INSERT INTO usuario (correo_usuario, nombre, contrasena, id_rol) VALUES (?, ?, ?, ?)",
      [correo_usuario, nombre, hashedPassword, id_rol || 2] // 2 = usuario normal
    );

    // Auditoría (si está montado)
    if (typeof req.audit === 'function') {
      try {
        await req.audit('crear cuenta', 'usuario', {
          id_usuario: result.insertId,
          email: correo_usuario,
          rol: id_rol === 1 ? 'profesor' : id_rol === 3 ? 'funcionario' : 'estudiante'
        });
      } catch (e) {
        console.warn('[audit] registerUser:', e?.message || e);
      }
    }

    res.json({ message: "Usuario registrado correctamente ✅" });
  } catch (error) {
    console.error("Error en registerUser:", error);
    res.status(500).json({ error: "Error al registrar usuario" });
  }
};

// 🔐 LOGIN
export const loginUser = async (req, res) => {
  try {
    const { correo_usuario, contrasena } = req.body;

    // Buscar usuario por correo
    const [rows] = await db.query("SELECT * FROM usuario WHERE correo_usuario = ?", [
      correo_usuario,
    ]);
    if (rows.length === 0) return res.status(404).json({ error: "Usuario no encontrado" });

    const user = rows[0];

    // Comparar contraseñas
    const isMatch = await bcrypt.compare(contrasena, user.contrasena);
    if (!isMatch) return res.status(401).json({ error: "Contraseña incorrecta" });

    // Si todo ok, puedes devolver los datos o un token JWT más adelante
    res.json({
      message: "Inicio de sesión exitoso 🎉",
      user: {
        id_usuario: user.id_usuario,
        nombre: user.nombre,
        correo_usuario: user.correo_usuario,
        id_rol: user.id_rol,
      },
    });
  } catch (error) {
    console.error("Error en loginUser:", error);
    res.status(500).json({ error: "Error en el inicio de sesión" });
  }
};