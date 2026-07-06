import mysql from "mysql2/promise";

/**
 * Pool de conexiones inmutable de MySQL/MariaDB optimizado para XAMPP.
 * @type {import("mysql2/promise").Pool}
 */
const pool = mysql.createPool({
  connectionLimit: 10, // Capacidad para solicitudes simultáneas en la oficina
  database: "cootaxis",
  host: "localhost",
  password: "", // Vacío por defecto en entornos locales de XAMPP
  queueLimit: 0,
  user: "root",
  waitForConnections: true,
});

// Verificación asíncrona de enlace con la base de datos local de CooTaxis
pool
  .getConnection()
  .then((connection) => {
    console.warn("¡Conectado exitosamente a MySQL en XAMPP (cootaxis)");
    connection.release(); // Libera el hilo de inmediato para mantener el rendimiento del pool
  })
  .catch((err) => {
    console.error("Error crítico conectando a MySQL en XAMPP:", err.message);
  });

export default pool;
