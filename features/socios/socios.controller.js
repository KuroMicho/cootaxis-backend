import { AuditoriaModel, extractResponsable } from "../auditoria/auditoria.model.js";
import { SocioModel } from "./socios.model.js";

export const SocioController = {
  /** Registra un nuevo socio */
  async createSocio(req, res) {
    try {
      const { cedula_nit, cupo, nombres_apellidos, placa } = req.body;

      if (!cedula_nit || !nombres_apellidos || !cupo || !placa) {
        return res.status(400).json({
          error: "Cédula, Nombres, Cupo y Placa son datos obligatorios.",
        });
      }

      const nuevoId = await SocioModel.create(req.body);

      const { responsable_nombre, responsable_rol } = extractResponsable(req.body);
      await AuditoriaModel.registrar({
        accion: "CREAR",
        descripcion: `Registro inicial en el sistema de ${nombres_apellidos} (Cupo #${cupo})`,
        entidad_id: nuevoId,
        modulo: "SOCIOS",
        responsable_nombre,
        responsable_rol,
      });

      return res.status(201).json({
        id: nuevoId,
        message: "Socio registrado con éxito en el sindicato.",
      });
    } catch (error) {
      console.error("Error en createSocio:", error.message);

      if (error.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
          error:
            "Conflicto: La cédula, el cupo o la placa ya se encuentran asignados a otro vehículo.",
        });
      }
      return res.status(500).json({ error: "Error al guardar el nuevo socio." });
    }
  },

  /** Elimina un socio por su número de cupo */
  async deleteSocio(req, res) {
    try {
      const cupo = Number(req.params.cupo);
      const socio = await SocioModel.findByCupo(cupo);

      if (!socio) {
        return res.status(404).json({ error: "El cupo solicitado no existe o ya fue removido." });
      }

      const exito = await SocioModel.deleteByCupo(cupo);

      if (!exito) {
        return res.status(404).json({ error: "El cupo solicitado no existe o ya fue removido." });
      }

      const { responsable_nombre, responsable_rol } = extractResponsable(req.body);
      await AuditoriaModel.registrar({
        accion: "ELIMINAR",
        descripcion: `Se eliminó el registro del Cupo #${cupo}`,
        entidad_id: socio.id,
        modulo: "SOCIOS",
        responsable_nombre,
        responsable_rol,
      });

      return res.json({ message: "Socio eliminado del sistema de control." });
    } catch (error) {
      console.error("Error en deleteSocio:", error.message);

      if (error.code === "ER_ROW_IS_REFERENCED_2") {
        return res.status(400).json({
          error:
            "No se puede eliminar: El vehículo vinculado posee préstamos y liquidaciones activas en cartera.",
        });
      }
      return res.status(500).json({ error: "Fallo al procesar la remoción física del registro." });
    }
  },

  /** Obtiene la lista completa de socios */
  async getAllSocios(req, res) {
    try {
      const socios = await SocioModel.findAll();
      return res.json(socios);
    } catch (error) {
      console.error("Error en getAllSocios:", error.message);
      return res.status(500).json({ error: "Error al recuperar los socios de la base de datos." });
    }
  },

  /** Localiza un socio por su número de cupo */
  async getSocioByCupo(req, res) {
    try {
      const cupo = Number(req.params.cupo);
      const socio = await SocioModel.findByCupo(cupo);

      if (!socio) {
        return res.status(404).json({ error: "El número de cupo solicitado no está registrado." });
      }
      return res.json(socio);
    } catch (error) {
      console.error("Error en getSocioByCupo:", error.message);
      return res.status(500).json({ error: "Error interno al buscar el expediente." });
    }
  },

  /** Modifica los datos de un socio por su número de cupo */
  async updateSocio(req, res) {
    try {
      const cupo = Number(req.params.cupo);
      const socio = await SocioModel.findByCupo(cupo);

      if (!socio) {
        return res.status(404).json({ error: "No se encontró el número de cupo para actualizar." });
      }

      const exito = await SocioModel.updateByCupo(cupo, req.body);

      if (!exito) {
        return res.status(404).json({ error: "No se encontró el número de cupo para actualizar." });
      }

      const { responsable_nombre, responsable_rol } = extractResponsable(req.body);
      await AuditoriaModel.registrar({
        accion: "ACTUALIZAR",
        descripcion: `Se actualizaron datos de contacto del Cupo #${cupo}`,
        entidad_id: socio.id,
        modulo: "SOCIOS",
        responsable_nombre,
        responsable_rol,
      });

      return res.json({ message: "Expediente de asociado modificado correctamente." });
    } catch (error) {
      console.error("Error en updateSocio:", error.message);
      return res.status(500).json({ error: "Error al actualizar los datos en XAMPP." });
    }
  },
};
