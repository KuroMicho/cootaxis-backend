import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  apis: ["./features/**/*.yaml"], // 🚀 Escanea todos los archivos de documentación YAML
  definition: {
    info: {
      description:
        "Consola de pruebas interactiva y documentación automática del servidor local CooTaxis Mocoa.",
      title: "API Contable CooTaxis Mocoa",
      version: "1.0.0",
    },
    openapi: "3.0.0",
    servers: [
      {
        description: "Servidor XAMPP Local Central",
        url: "http://localhost:5000",
      },
    ],
  },
};

const swaggerSpec = swaggerJSDoc(options);

/**
 * Inyecta la pasarela gráfica de Swagger UI en la instancia del servidor Express.
 * @param {import("express").Express} app - Instancia de la aplicación Express.
 */
export const setupSwagger = (app) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.warn("Documentación interactiva Swagger en: http://localhost:5000/api-docs");
};
