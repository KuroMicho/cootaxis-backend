import { Router } from "express";

import { SocioController } from "./socios.controller.js";

const router = Router();

// Mapeo semántico del CRUD contable
router.get("/", SocioController.getAllSocios);
router.get("/:cupo", SocioController.getSocioByCupo);
router.post("/", SocioController.createSocio);
router.put("/:cupo", SocioController.updateSocio);
router.delete("/:cupo", SocioController.deleteSocio);

export default router;
