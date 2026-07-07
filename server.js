import dotenv from "dotenv";
import cors from "cors";
import express from "express";

import { setupSwagger } from "./config/swagger.js";
import auditoriaRoutes from "./features/auditoria/auditoria.routes.js";
import prestamosRoutes from "./features/prestamos/prestamos.routes.js";
import sociosRoutes from "./features/socios/socios.routes.js";

dotenv.config();

const app = express();

// Middlewares globales de control y parsing de payloads
const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:5173";
app.use(
  cors({
    origin: process.env.NODE_ENV === "production" ? allowedOrigin : "*",
    credentials: true,
  })
);
app.use(express.json());

// Inicialización de la consola de documentación interactiva local offline
setupSwagger(app);

// Enrutadores modulares por características (Feature-First)
app.use("/api/auditoria", auditoriaRoutes);
app.use("/api/prestamos", prestamosRoutes);
app.use("/api/socios", sociosRoutes);

/**
 * Ruta diagnóstica de salud operacional.
 * Mantiene sus claves ordenadas alfabéticamente para satisfacer la regla sort-objects.
 */
app.get("/api/health", (req, res) => {
  res.json({
    environment:
      process.env.NODE_ENV === "production" ? "Render Production Server" : "XAMPP Local Server",
    status: "online",
  });
});

const PORT = process.env.PORT || 5000;

// Escucha en la IP neutra '0.0.0.0' para dar acceso inmediato a laptops y dispositivos locales
app.listen(PORT, "0.0.0.0", () => {
  console.warn(`🚀 Backend de CooTaxis corriendo en el puerto: ${PORT}`);
});
