import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

/**
 * Pool de conexiones inmutable de MySQL/MariaDB optimizado para XAMPP y Render.
 * @type {import("mysql2/promise").Pool}
 */
const pool = mysql.createPool({
  connectionLimit: 10, // Capacidad para solicitudes simultáneas en la oficina
  database: process.env.DB_NAME || "cootaxis",
  host: process.env.DB_HOST || "localhost",
  password: process.env.DB_PASSWORD || "", // Vacío por defecto en entornos locales de XAMPP
  port: Number(process.env.DB_PORT || 3306),
  queueLimit: 0,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  user: process.env.DB_USER || "root",
  waitForConnections: true,
});

// Verificación asíncrona de enlace con la base de datos local de CooTaxis
pool
  .getConnection()
  .then((connection) => {
    console.warn(`¡Conectado exitosamente a MySQL en (${process.env.DB_HOST || "localhost"})`);
    connection.release(); // Libera el hilo de inmediato para mantener el rendimiento del pool
  })
  .catch((err) => {
    console.error("Error crítico conectando a MySQL:", err.message);
  });

export default pool;
