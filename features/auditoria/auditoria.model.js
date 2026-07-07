import db from "../../config/db.js";

/**
 * @typedef {Object} AuditoriaInput
 * @property {'SOCIOS' | 'PRESTAMOS'} modulo - Módulo de origen del evento.
 * @property {string} responsable_nombre - Nombre del operador que ejecutó la acción.
 * @property {string} responsable_rol - Rol o cargo del operador.
 * @property {string} descripcion - Narrativa legible del cambio registrado.
 * @property {'CREAR' | 'ACTUALIZAR' | 'ELIMINAR' | 'CAMBIO_ESTADO'} accion - Tipo de operación.
 * @property {number} [entidad_id] - ID del socio o préstamo afectado.
 */

/**
 * Extrae el responsable del body de la petición con valores por defecto.
 * @param {Object} body - Cuerpo de la solicitud HTTP.
 * @returns {{ responsable_nombre: string, responsable_rol: string }}
 */
export function extractResponsable(body) {
  return {
    responsable_nombre: body.responsable_nombre ?? "Sistema",
    responsable_rol: body.responsable_rol ?? "Operador",
  };
}

/**
 * Formatea un valor monetario al estilo colombiano para descripciones de auditoría.
 * @param {number} valor - Monto a formatear.
 * @returns {string}
 */
export function formatImporte(valor) {
  return new Intl.NumberFormat("es-CO", {
    currency: "COP",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(valor);
}

export const AuditoriaModel = {
  /**
   * Recupera el historial de auditoría con filtros opcionales.
   * @param {{ modulo?: string, limit?: number, offset?: number }} filtros
   */
  async findAll({ limit = 50, modulo, offset = 0 } = {}) {
    const params = [];
    let where = "";

    if (modulo && ["SOCIOS", "PRESTAMOS"].includes(modulo)) {
      where = "WHERE modulo = ?";
      params.push(modulo);
    }

    const [countRows] = await db.query(`SELECT COUNT(*) AS total FROM auditoria ${where}`, params);
    const total = countRows[0].total;

    const [rows] = await db.query(
      `SELECT id, accion, descripcion, entidad_id, fecha_hora, modulo, responsable_nombre, responsable_rol
       FROM auditoria ${where}
       ORDER BY fecha_hora DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );

    const registros = rows.map((row) => ({
      accion: row.accion,
      descripcion: row.descripcion,
      entidad_id: row.entidad_id,
      fecha_hora: row.fecha_hora,
      id: row.id,
      modulo: row.modulo,
      responsable: {
        nombre: row.responsable_nombre,
        rol: row.responsable_rol,
      },
    }));

    return { registros, total };
  },

  /**
   * Inserta un nuevo registro inmutable en el historial de auditoría.
   * @param {AuditoriaInput} entrada
   */
  async registrar(entrada) {
    const { accion, descripcion, entidad_id, modulo, responsable_nombre, responsable_rol } =
      entrada;

    await db.query(
      `INSERT INTO auditoria (modulo, responsable_nombre, responsable_rol, descripcion, accion, entidad_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [modulo, responsable_nombre, responsable_rol, descripcion, accion, entidad_id ?? null]
    );
  },
};
