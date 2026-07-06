import db from "../../config/db.js";

/**
 * @typedef {Object} SocioInput
 * @property {string} cedula_nit - Documento único de identidad o NIT.
 * @property {string} celular - Teléfono móvil de contacto.
 * @property {number} cupo - Número identificador de cupo del taxi (Único).
 * @property {string} domicilio - Dirección residencial en Mocoa.
 * @property {'ACTIVO' | 'INACTIVO'} [estado] - Situación administrativa.
 * @property {string} nombres_apellidos - Nombre completo del asociado.
 * @property {string} placa - Matrícula única del vehículo.
 */

export const SocioModel = {
  /** Inserta un nuevo asociado validando restricciones de unicidad */
  async create(socio) {
    const { cedula_nit, celular, cupo, domicilio, nombres_apellidos, placa } = socio;
    const [result] = await db.query(
      "INSERT INTO socios (cedula_nit, celular, cupo, domicilio, nombres_apellidos, placa) VALUES (?, ?, ?, ?, ?, ?)",
      [cedula_nit, celular, cupo, domicilio, nombres_apellidos, placa]
    );
    return result.insertId;
  },

  /** Remueve físicamente un registro utilizando el número de cupo */
  async deleteByCupo(cupo) {
    const [result] = await db.query("DELETE FROM socios WHERE cupo = ?", [cupo]);
    return result.affectedRows > 0;
  },

  /** Recupera la lista total de taxistas registrados */
  async findAll() {
    const [rows] = await db.query(
      "SELECT id, cedula_nit, celular, cupo, domicilio, estado, fecha_registro, nombres_apellidos, placa FROM socios ORDER BY nombres_apellidos ASC"
    );
    return rows;
  },

  /** Localiza un socio específico por su número de cupo único */
  async findByCupo(cupo) {
    const [rows] = await db.query("SELECT * FROM socios WHERE cupo = ?", [cupo]);
    return rows.length ? rows[0] : null;
  },

  /** Actualiza el expediente de un taxista utilizando su número de cupo */
  async updateByCupo(cupo, socio) {
    const { cedula_nit, celular, domicilio, estado, nombres_apellidos, placa } = socio;
    const [result] = await db.query(
      "UPDATE socios SET cedula_nit = ?, celular = ?, domicilio = ?, estado = ?, nombres_apellidos = ?, placa = ? WHERE cupo = ?",
      [cedula_nit, celular, domicilio, estado || "ACTIVO", nombres_apellidos, placa, cupo]
    );
    return result.affectedRows > 0;
  },
};
