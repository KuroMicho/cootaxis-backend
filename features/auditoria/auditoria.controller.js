import { AuditoriaModel } from "./auditoria.model.js";

export const AuditoriaController = {
  /** Obtiene el historial cronológico de operaciones registradas */
  async getHistorial(req, res) {
    try {
      const { limit, modulo, offset } = req.query;

      if (modulo && !["SOCIOS", "PRESTAMOS"].includes(modulo)) {
        return res.status(400).json({
          error: "El módulo debe ser SOCIOS o PRESTAMOS.",
        });
      }

      const resultado = await AuditoriaModel.findAll({
        limit: limit ? Number(limit) : 50,
        modulo,
        offset: offset ? Number(offset) : 0,
      });

      return res.json(resultado);
    } catch (error) {
      console.error("Error en getHistorial:", error.message);
      return res.status(500).json({ error: "Error al recuperar el historial de auditoría." });
    }
  },
};
