import cors from "cors";
import express from "express";

import { setupSwagger } from "./config/swagger.js";
import prestamosRoutes from "./features/prestamos/prestamos.routes.js";
import sociosRoutes from "./features/socios/socios.routes.js";

const app = express();

// Middlewares globales de control y parsing de payloads
app.use(cors());
app.use(express.json());

// Inicialización de la consola de documentación interactiva local offline
setupSwagger(app);

// Enrutadores modulares por características (Feature-First)
app.use("/api/prestamos", prestamosRoutes);
app.use("/api/socios", sociosRoutes);

/**
 * Ruta diagnóstica de salud operacional.
 * Mantiene sus claves ordenadas alfabéticamente para satisfacer la regla sort-objects.
 */
app.get("/api/health", (req, res) => {
  res.json({
    environment: "XAMPP Local Server",
    status: "online",
  });
});

const PORT = 5000;

// Escucha en la IP neutra '0.0.0.0' para dar acceso inmediato a laptops y dispositivos locales
app.listen(PORT, "0.0.0.0", () => {
  console.warn(`🚀 Backend de CooTaxis corriendo en el puerto: ${PORT}`);
});
