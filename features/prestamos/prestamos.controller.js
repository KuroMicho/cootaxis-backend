import { AuditoriaModel, extractResponsable, formatImporte } from "../auditoria/auditoria.model.js";
import { PrestamoModel } from "./prestamos.model.js";

/**
 * Liquida matemáticamente una proyección de amortización bajo el Sistema Francés.
 * Propiedades del objeto interno ordenadas alfabéticamente para perfectionist.
 * @param {number} principal - Capital solicitado.
 * @param {number} tasa - Porcentaje de interés mensual (Ej: 2.5).
 * @param {number} plazo - Cantidad total de cuotas.
 * @returns {Object} Contiene la cuota calculada, interés acumulado y la matriz desglosada.
 */
function liquidarSistemaFrances(principal, tasa, plazo) {
  const r = tasa / 100;
  const n = plazo;

  const cuotaFija =
    r === 0 ? principal / n : (principal * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1);

  const tabla = [];
  let saldoRemanente = principal;
  let interesTotalAcumulado = 0;

  for (let i = 1; i <= n; i++) {
    const interesPeriodo = saldoRemanente * r;
    const capitalPeriodo = cuotaFija - interesPeriodo;
    saldoRemanente -= capitalPeriodo;

    interesTotalAcumulado += interesPeriodo;

    // Llaves internas en estricto orden alfabético para el formateador
    tabla.push({
      abono_capital: Math.round(capitalPeriodo),
      abono_interes: Math.round(interesPeriodo),
      numero_cuota: i,
      saldo_restante: Math.max(0, Math.round(saldoRemanente)),
      valor_cuota: Math.round(cuotaFija),
    });
  }

  return {
    cuotaFija: Math.round(cuotaFija),
    interesTotal: Math.round(interesTotalAcumulado),
    lineas: tabla,
    totalPagar: Math.round(principal + interesTotalAcumulado),
  };
}

export const PrestamoController = {
  /** Registra un abono parcial, disminuyendo el saldo total y recalculando */
  async registrarAbono(req, res) {
    try {
      const { monto } = req.body;
      const id = Number(req.params.id);

      if (!monto || Number(monto) <= 0) {
        return res.status(400).json({ error: "El monto del abono debe ser mayor que cero." });
      }

      const prestamo = await PrestamoModel.findById(id);
      if (!prestamo) {
        return res.status(404).json({ error: "El préstamo solicitado no está registrado." });
      }

      const totalPagar = Number(prestamo.total_pagar);
      const totalAbonadoActual = Number(prestamo.total_abonado ?? 0);
      const nuevoTotalAbonado = totalAbonadoActual + Number(monto);

      if (nuevoTotalAbonado > totalPagar) {
        return res.status(400).json({
          error: `El abono de ${formatImporte(Number(monto))} excede el saldo restante a pagar que es ${formatImporte(totalPagar - totalAbonadoActual)}.`,
        });
      }

      let nuevoEstado = prestamo.estado;
      if (Math.abs(nuevoTotalAbonado - totalPagar) < 0.01 || nuevoTotalAbonado >= totalPagar) {
        nuevoEstado = "PAGADO";
      }

      await PrestamoModel.updateAbono(id, nuevoTotalAbonado, nuevoEstado);

      const { responsable_nombre, responsable_rol } = extractResponsable(req.body);
      await AuditoriaModel.registrar({
        accion: "ACTUALIZAR",
        descripcion: `Registro de abono parcial de ${formatImporte(Number(monto))} para el Crédito #${id}. Saldo restante: ${formatImporte(totalPagar - nuevoTotalAbonado)}`,
        entidad_id: id,
        modulo: "PRESTAMOS",
        responsable_nombre,
        responsable_rol,
      });

      return res.json({
        message: "Abono parcial registrado con éxito en los libros contables.",
        saldo_pendiente: totalPagar - nuevoTotalAbonado,
        total_abonado: nuevoTotalAbonado,
      });
    } catch (error) {
      console.error("Error en registrarAbono:", error.message);
      return res.status(500).json({ error: "Error técnico al asentar el abono parcial." });
    }
  },

  /** Modifica la situación contable del préstamo (PENDIENTE, PAGADO, MORA) */
  async changeStatus(req, res) {
    try {
      const { estado } = req.body;
      if (!["PENDIENTE", "PAGADO", "MORA"].includes(estado)) {
        return res
          .status(400)
          .json({ error: "El estado proporcionado no es válido para los libros contables." });
      }

      const exito = await PrestamoModel.updateEstado(Number(req.params.id), estado);
      if (!exito) {
        return res.status(404).json({ error: "Crédito no localizado." });
      }

      const { responsable_nombre, responsable_rol } = extractResponsable(req.body);
      await AuditoriaModel.registrar({
        accion: "CAMBIO_ESTADO",
        descripcion: `Se modificó situación del Crédito #${req.params.id} a ${estado}`,
        entidad_id: Number(req.params.id),
        modulo: "PRESTAMOS",
        responsable_nombre,
        responsable_rol,
      });

      return res.json({ message: "Situación contable del préstamo actualizada correctamente." });
    } catch (error) {
      console.error("Error en changeStatus:", error.message);
      return res.status(500).json({ error: "Fallo al modificar el estado en la base de datos." });
    }
  },

  /** Consolida y asienta de manera definitiva un préstamo en la cartera */
  async createPrestamo(req, res) {
    try {
      const {
        fecha_desembolso,
        importe_credito,
        modalidad,
        numero_cuotas,
        socio_id,
        tasa_interes,
      } = req.body;

      if (!socio_id || !importe_credito || !tasa_interes || !numero_cuotas || !fecha_desembolso) {
        return res
          .status(400)
          .json({ error: "Faltan parámetros estructurales para consolidar el desembolso." });
      }

      // El servidor liquida internamente para blindarse de manipulaciones maliciosas del cliente
      const liquidacion = liquidarSistemaFrances(
        Number(importe_credito),
        Number(tasa_interes),
        Number(numero_cuotas)
      );

      const nuevoPrestamo = {
        fecha_desembolso,
        importe_credito: Number(importe_credito),
        importe_cuota: liquidacion.cuotaFija,
        interes_generado: liquidacion.interesTotal,
        modalidad: modalidad || "Mensual",
        numero_cuotas: Number(numero_cuotas),
        socio_id: Number(socio_id),
        tasa_interes: Number(tasa_interes),
        total_pagar: liquidacion.totalPagar,
      };

      const id = await PrestamoModel.create(nuevoPrestamo);

      const { responsable_nombre, responsable_rol } = extractResponsable(req.body);
      await AuditoriaModel.registrar({
        accion: "CREAR",
        descripcion: `Asentamiento definitivo del Crédito #${id} por ${formatImporte(Number(importe_credito))}`,
        entidad_id: id,
        modulo: "PRESTAMOS",
        responsable_nombre,
        responsable_rol,
      });

      return res.status(201).json({
        id,
        message: "Préstamo desembolsado y asentado en los libros contables con éxito.",
      });
    } catch (error) {
      console.error("Error en createPrestamo:", error.message);
      return res.status(500).json({ error: "Error crítico al registrar el crédito en XAMPP." });
    }
  },

  /** Obtiene la lista completa de créditos */
  async getAllPrestamos(req, res) {
    try {
      const prestamos = await PrestamoModel.findAll();
      return res.json(prestamos);
    } catch (error) {
      console.error("Error en getAllPrestamos:", error.message);
      return res.status(500).json({ error: "Fallo al recuperar la cartera contable." });
    }
  },

  /** Obtiene el extracto de un préstamo adjuntando su plan de pagos */
  async getPrestamoById(req, res) {
    try {
      const prestamo = await PrestamoModel.findById(Number(req.params.id));
      if (!prestamo) {
        return res.status(404).json({ error: "El préstamo consultado no está registrado." });
      }

      const proyeccion = liquidarSistemaFrances(
        Number(prestamo.importe_credito),
        Number(prestamo.tasa_interes),
        Number(prestamo.numero_cuotas)
      );

      return res.json({ ...prestamo, tabla_amortizacion: proyeccion.lineas });
    } catch (error) {
      console.error("Error en getPrestamoById:", error.message);
      return res.status(500).json({ error: "Error interno al procesar el extracto." });
    }
  },

  /** Simula la amortización al peso en tiempo real sin guardar en base de datos */
  async simulateAmortizacion(req, res) {
    try {
      const { importe_credito, numero_cuotas, tasa_interes } = req.body;
      if (!importe_credito || !tasa_interes || !numero_cuotas) {
        return res
          .status(400)
          .json({ error: "Se requieren Importe, Tasa y Plazo de Cuotas para simular." });
      }

      const proyeccion = liquidarSistemaFrances(
        Number(importe_credito),
        Number(tasa_interes),
        Number(numero_cuotas)
      );

      return res.json(proyeccion);
    } catch (error) {
      console.error("Error en simulateAmortizacion:", error.message);
      return res.status(500).json({ error: "Error al liquidar la simulación francesa." });
    }
  },
};
