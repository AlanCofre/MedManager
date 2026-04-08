import { DataTypes, Model } from 'sequelize';
import  sequelize from '../../db/sequelize.js';
class LogAuditoria extends Model {}

LogAuditoria.init(
  {
    id_log: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_usuario: { type: DataTypes.INTEGER, allowNull: true },
    accion: {
      type: DataTypes.ENUM(
        'crear cuenta',
        'actualizar cuenta',
        'recuperar contraseña',
        'emitir licencia',
        'aceptar licencia',
        'rechazar licencia'
      ),
      allowNull: false
    },
    recurso: { type: DataTypes.STRING(50), allowNull: false }, // ej: usuario, licencia, autenticación
    payload: { type: DataTypes.TEXT, allowNull: true },        // ampliado para guardar más info
    ip: { type: DataTypes.STRING(50), allowNull: true },
    fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  },
  { sequelize, tableName: 'logauditoria', timestamps: false }
);

export default LogAuditoria;
