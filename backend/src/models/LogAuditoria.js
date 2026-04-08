// backend/src/models/logauditoria.js
import { DataTypes, Model } from 'sequelize'
import sequelize from '../../db/sequelize.js'

class LogAuditoria extends Model {}

LogAuditoria.init(
  {
    id_log: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_usuario: { type: DataTypes.INTEGER, allowNull: true },

    // Debe coincidir EXACTO con tu tabla MySQL (con espacios y tilde)
    accion: {
      type: DataTypes.ENUM(
        'crear cuenta',
        'actualizar cuenta',
        'iniciar sesion',
        'recuperar contraseña',
        'emitir licencia',
        'aceptar licencia',
        'rechazar licencia'
      ),
      allowNull: false
    },

    recurso: { type: DataTypes.STRING(50), allowNull: false },
    payload: { type: DataTypes.TEXT, allowNull: true }, // guarda JSON.stringify(...)
    ip: { type: DataTypes.STRING(50), allowNull: true },
    fecha: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  },
  {
    sequelize,
    tableName: 'logauditoria',
    timestamps: false,
    freezeTableName: true,
    indexes: [
      { fields: ['id_usuario', 'fecha'] },
      { fields: ['accion', 'fecha'] }
    ]
  }
)

export default LogAuditoria
