import { Router } from "express";

import { PrestamoController } from "./prestamos.controller.js";

const router = Router();

// Endpoints semánticos del negocio contable
router.get("/", PrestamoController.getAllPrestamos);
router.get("/:id", PrestamoController.getPrestamoById);
router.post("/", PrestamoController.createPrestamo);
router.post("/simular", PrestamoController.simulateAmortizacion);
router.put("/:id/estado", PrestamoController.changeStatus);
router.post("/:id/abono", PrestamoController.registrarAbono);

export default router;
