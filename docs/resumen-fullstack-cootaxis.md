# CooTaxis Mocoa — Resumen Fullstack

**Sistema contable** para la cooperativa de taxistas CooTaxis LTDA, Mocoa (Colombia).

Generado: 6 de julio de 2026 | Backend: Express + MySQL | Frontend: React + Vite

---

## 1. Visión general

La aplicación es un **sistema contable de oficina** para gestionar socios (conductores de taxi), préstamos con amortización francesa, informes financieros y un historial de auditoría inmutable. Diseñada para red local con **XAMPP** (MySQL) y Node.js en el puerto 5000.

```
React + Vite (5173)  ←→  Express API (5000)  ←→  MySQL cootaxis (XAMPP)
```

---

## 2. Backend (cootaxis-backend)

### Stack

| Componente | Tecnología             |
| ---------- | ---------------------- |
| Runtime    | Node.js ES Modules     |
| Framework  | Express 5              |
| BD         | MySQL/MariaDB (mysql2) |
| Docs       | Swagger en /api-docs   |
| Puerto     | 5000                   |

### Arquitectura feature-first

- `features/socios/` — CRUD de asociados
- `features/prestamos/` — Cartera, simulación, cambio de estado
- `features/auditoria/` — Log inmutable de cambios
- `config/db.js` — Pool MySQL
- `database/schema.sql` — Esquema

### Tablas MySQL

| Tabla     | Propósito                                                          |
| --------- | ------------------------------------------------------------------ |
| socios    | Taxistas: cédula, cupo, placa, celular, domicilio, estado          |
| prestamos | Créditos: importe, tasa, cuotas, interés, total, estado, FK→socios |
| auditoria | Log: módulo, acción, descripción, responsable, fecha               |

### Endpoints API

| Método | Ruta                      | Descripción                          |
| ------ | ------------------------- | ------------------------------------ |
| GET    | /api/health               | Estado del servidor                  |
| GET    | /api/socios               | Listar socios                        |
| GET    | /api/socios/:cupo         | Buscar por cupo                      |
| POST   | /api/socios               | Crear socio                          |
| PUT    | /api/socios/:cupo         | Actualizar                           |
| DELETE | /api/socios/:cupo         | Eliminar                             |
| GET    | /api/prestamos            | Listar (JOIN socio)                  |
| GET    | /api/prestamos/:id        | Detalle + amortización               |
| POST   | /api/prestamos            | Crear (cálculo francés)              |
| POST   | /api/prestamos/simular    | Simular sin guardar                  |
| PUT    | /api/prestamos/:id/estado | Cambiar estado                       |
| GET    | /api/auditoria            | Historial (?modulo, ?limit, ?offset) |

### Lógica destacada

- **Sistema Francés**: cuota fija calculada en servidor
- **Auditoría automática** en CREATE/UPDATE/DELETE socios y CREATE/CAMBIO_ESTADO préstamos
- Campos opcionales `responsable_nombre` y `responsable_rol` (default: Sistema/Operador)

---

## 3. Frontend (React + Vite)

### Stack

| Componente | Tecnología                 |
| ---------- | -------------------------- |
| UI         | React 19 + Vite 8          |
| Estilos    | Tailwind CSS 4             |
| Routing    | React Router 7             |
| Estado     | Zustand (auth + zoom UI)   |
| HTTP       | Axios → localhost:5000/api |
| Excel      | read/write-excel-file      |

### Login mock (sin backend)

| Usuario | Clave     | Rol      | Nombre    |
| ------- | --------- | -------- | --------- |
| fabio   | fabio2026 | gerente  | Don Fabio |
| clara   | clara2026 | contador | Clara M.  |

### Permisos por ruta

| Ruta        | Gerente | Contador |
| ----------- | ------- | -------- |
| / Dashboard | ✓       | ✓        |
| /socios     | ✓       | ✗        |
| /prestamos  | ✓       | ✓        |
| /informes   | ✓       | ✗        |
| /historial  | ✓       | ✗        |

### Módulos UI

**Panel de Inicio** — KPIs estáticos (no conectados al API), permisos por rol.

**Socios** — Tabla paginada, búsqueda, filtro estado, CRUD modal, import/export Excel, actividad reciente.

**Préstamos** — KPIs dinámicos, filtros fecha/estado, simulación francesa, desembolso, detalle amortización.

**Informes** — Métricas financieras, exportación Excel (Administrador / Contador / Socio).

**Historial** — Tabla auditoría con filtro módulo (usa datos mock si API falla).

---

## 4. Brechas de integración

| Área              | Detalle                                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------- |
| Historial ↔ API   | Frontend llama `/auditoria/logs`; backend expone `/api/auditoria`                                       |
| Formato respuesta | Backend: `{total, registros}` con `fecha_hora` y `responsable{nombre,rol}`; frontend espera array plano |
| Responsable       | Frontend no envía responsable en operaciones → logs "Sistema/Operador"                                  |
| Dashboard         | KPIs hardcodeados en Home.jsx                                                                           |
| Auth              | Solo mock client-side, sin JWT                                                                          |
| Sidebar           | Contador ve enlaces Informes/Historial pero rutas bloqueadas                                            |

---

## 5. Cómo ejecutar

1. Importar `database/schema.sql` en phpMyAdmin
2. Backend: `cd backend && pnpm install && pnpm dev`
3. Frontend: `cd frontend && pnpm install && pnpm dev`
4. Swagger: http://localhost:5000/api-docs
5. Login: fabio/fabio2026 o clara/clara2026

---

_CooTaxis Mocoa — Uso interno de la cooperativa_
