import { Router } from "express";

import { AuditoriaController } from "./auditoria.controller.js";

const router = Router();

router.get("/", AuditoriaController.getHistorial);

export default router;
