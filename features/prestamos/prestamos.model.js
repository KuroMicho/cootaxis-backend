import db from "../../config/db.js";

/**
 * @typedef {Object} PrestamoInput
 * @property {string} fecha_desembolso - Fecha física del desembolso (AAAA-MM-DD).
 * @property {number} importe_credito - Capital neto prestado al asociado.
 * @property {number} importe_cuota - Valor monetario bruto de la cuota fija constante.
 * @property {number} interes_generado - Interés total acumulado sobre saldos decrecientes.
 * @property {string} [modalidad] - Frecuencia pactada de recaudo (Ej: Mensual, Diario).
 * @property {number} numero_cuotas - Plazo total expresado en número de períodos.
 * @property {number} socio_id - Llave foránea que conecta con el registro del socio.
 * @property {number} tasa_interes - Porcentaje de interés periódico aplicado (Ej: 2.5).
 * @property {number} total_pagar - Suma consolidada de capital más ganancias por interés.
 */

/**
 * Capa de Abstracción de Datos para el Control de Cartera de CooTaxis Mocoa.
 */
export const PrestamoModel = {
  /**
   * Registra un nuevo crédito calculado bajo el sistema francés en la base de datos.
   * @param {PrestamoInput} prestamo - Datos financieros previamente validados.
   * @returns {Promise<number>} ID autoincremental asignado por MySQL.
   */
  async create(prestamo) {
    const {
      fecha_desembolso,
      importe_credito,
      importe_cuota,
      interes_generado,
      modalidad,
      numero_cuotas,
      socio_id,
      tasa_interes,
      total_pagar,
    } = prestamo;

    const [result] = await db.query(
      `INSERT INTO prestamos (
        fecha_desembolso, 
        importe_credito, 
        importe_cuota, 
        interes_generado, 
        modalidad, 
        numero_cuotas, 
        socio_id, 
        tasa_interes, 
        total_pagar
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        fecha_desembolso,
        importe_credito,
        importe_cuota,
        interes_generado,
        modalidad || "Mensual",
        numero_cuotas,
        socio_id,
        tasa_interes,
        total_pagar,
      ]
    );

    return result.insertId;
  },

  /**
   * Recupera el histórico global de colocaciones de créditos.
   * Realiza un mapeo relacional (LEFT JOIN) para anexar datos de control del taxista.
   * @returns {Promise<Array<Object>>} Lista ordenada cronológicamente por registro.
   */
  async findAll() {
    const [rows] = await db.query(`
      SELECT 
        p.id,
        p.socio_id,
        s.nombres_apellidos AS socio_nombre,
        s.cupo AS socio_cupo,
        p.importe_credito,
        p.modalidad,
        p.tasa_interes,
        p.numero_cuotas,
        p.importe_cuota,
        p.interes_generado,
        p.total_pagar,
        p.total_abonado,
        p.fecha_desembolso,
        p.estado,
        p.fecha_registro
      FROM prestamos p
      LEFT JOIN socios s ON p.socio_id = s.id
      ORDER BY p.fecha_registro DESC
    `);
    return rows;
  },

  /**
   * Obtiene la sábana de datos detallada de un solo préstamo por su identificador único.
   * @param {number} id - Identificador único de la colocación.
   * @returns {Promise<Object|null>} El objeto del préstamo con datos del vehículo o null.
   */
  async findById(id) {
    const [rows] = await db.query(
      `
      SELECT 
        p.id,
        p.socio_id,
        s.nombres_apellidos AS socio_nombre,
        s.cupo AS socio_cupo,
        s.placa AS socio_placa,
        p.importe_credito,
        p.modalidad,
        p.tasa_interes,
        p.numero_cuotas,
        p.importe_cuota,
        p.interes_generado,
        p.total_pagar,
        p.total_abonado,
        p.fecha_desembolso,
        p.estado,
        p.fecha_registro
      FROM prestamos p
      LEFT JOIN socios s ON p.socio_id = s.id
      WHERE p.id = ?
    `,
      [id]
    );
    return rows.length ? rows[0] : null;
  },

  /**
   * Actualiza el estado del balance de un crédito específico.
   * @param {number} id - Identificador del préstamo en auditoría.
   * @param {'PENDIENTE' | 'PAGADO' | 'MORA'} estado - Nueva situación contable.
   * @returns {Promise<boolean>} Retorna true si el registro sufrió modificaciones físicas.
   */
  async updateEstado(id, estado) {
    const [result] = await db.query("UPDATE prestamos SET estado = ? WHERE id = ?", [estado, id]);
    return result.affectedRows > 0;
  },

  /**
   * Registra un abono acumulado y actualiza la situación del préstamo.
   * @param {number} id - Identificador del préstamo.
   * @param {number} total_abonado - Acumulado de pagos.
   * @param {string} estado - Nueva situación contable.
   * @returns {Promise<boolean>}
   */
  async updateAbono(id, total_abonado, estado) {
    const [result] = await db.query(
      "UPDATE prestamos SET total_abonado = ?, estado = ? WHERE id = ?",
      [total_abonado, estado, id]
    );
    return result.affectedRows > 0;
  },
};
