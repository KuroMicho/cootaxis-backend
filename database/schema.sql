-- 1. Asegurar la existencia y el juego de caracteres de la base de datos
CREATE DATABASE IF NOT EXISTS cootaxis CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cootaxis;

-- 2. Eliminar tablas previas en orden estricto debido a las restricciones de llaves foráneas
DROP TABLE IF EXISTS auditoria;
DROP TABLE IF EXISTS prestamos;
DROP TABLE IF EXISTS socios;

-- 2.1. Registro inmutable de auditoría contable
CREATE TABLE auditoria (
  id INT AUTO_INCREMENT PRIMARY KEY,
  accion ENUM('CREAR', 'ACTUALIZAR', 'ELIMINAR', 'CAMBIO_ESTADO') NOT NULL,
  descripcion VARCHAR(500) NOT NULL,
  entidad_id INT NULL,
  fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  modulo ENUM('SOCIOS', 'PRESTAMOS') NOT NULL,
  responsable_nombre VARCHAR(100) NOT NULL,
  responsable_rol VARCHAR(50) NOT NULL
) ENGINE=InnoDB;

-- 3. Crear Tabla de Asociados / Socios
CREATE TABLE socios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cedula_nit VARCHAR(20) NOT NULL UNIQUE,
  celular VARCHAR(20) NOT NULL,
  cupo INT NOT NULL UNIQUE,
  domicilio VARCHAR(150) NOT NULL,
  estado ENUM('ACTIVO', 'INACTIVO') DEFAULT 'ACTIVO',
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  nombres_apellidos VARCHAR(150) NOT NULL,
  placa VARCHAR(10) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- 4. Crear Tabla de Préstamos y Cartera Financiera
CREATE TABLE prestamos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  estado ENUM('PENDIENTE', 'PAGADO', 'MORA') DEFAULT 'PENDIENTE',
  fecha_desembolso DATE NOT NULL,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  importe_credito DECIMAL(12, 2) NOT NULL,
  importe_cuota DECIMAL(12, 2) NOT NULL,
  interes_generado DECIMAL(12, 2) NOT NULL,
  modalidad VARCHAR(30) DEFAULT 'Mensual',
  numero_cuotas INT NOT NULL,
  socio_id INT NOT NULL,
  tasa_interes DECIMAL(5, 2) NOT NULL,
  total_pagar DECIMAL(12, 2) NOT NULL,
  total_abonado DECIMAL(12, 2) DEFAULT 0.00,
  FOREIGN KEY (socio_id) REFERENCES socios(id) ON DELETE RESTRICT
) ENGINE=InnoDB;