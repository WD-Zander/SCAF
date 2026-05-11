# SCAF - Manual Completo del Sistema

**Sistema de Control de Activos Fijos**
Version 1.0 | Mayo 2026

---

## Tabla de Contenido

1. [Descripcion General](#1-descripcion-general)
2. [Arquitectura del Sistema](#2-arquitectura-del-sistema)
3. [Instalacion y Puesta en Marcha](#3-instalacion-y-puesta-en-marcha)
4. [Modulos del Sistema](#4-modulos-del-sistema)
5. [Ficheros (Catalogos)](#5-ficheros-catalogos)
6. [Inventario de Activos](#6-inventario-de-activos)
7. [Mantenimiento](#7-mantenimiento)
8. [Proveedores](#8-proveedores)
9. [Empleados](#9-empleados)
10. [Movimientos](#10-movimientos)
11. [Usuarios y Roles](#11-usuarios-y-roles)
12. [Auditoria](#12-auditoria)
13. [Configuracion de Empresa](#13-configuracion-de-empresa)
14. [Estructura de Base de Datos](#14-estructura-de-base-de-datos)
15. [API REST](#15-api-rest)
16. [Estructura de Archivos](#16-estructura-de-archivos)
17. [Preguntas Frecuentes](#17-preguntas-frecuentes)

---

## 1. Descripcion General

SCAF es un sistema ERP especializado en la gestion integral de activos fijos, con enfoque en:

- **Inventario**: Registro, clasificacion y seguimiento de todos los activos de la organizacion.
- **Mantenimiento**: Planificacion preventiva y correctiva con calendario, ordenes de trabajo y checklists.
- **Trazabilidad**: Historial completo de movimientos, cambios de estado y reprogramaciones.
- **Auditoria**: Registro inmutable de todas las acciones realizadas en el sistema.

### Caracteristicas Principales

| Caracteristica | Descripcion |
|---|---|
| Multiusuario | Roles y permisos granulares (SUPERADMIN, GESTOR, AUDITOR, etc.) |
| Modulos de Mantenimiento | Segmentacion por alcance: Area, Habitaciones, Activos |
| Calendario Visual | Vista mensual con ordenes de trabajo y tickets |
| Checklist por Ticket | Tareas verificables dentro de cada mantenimiento |
| Auto-completado | Al completar todas las tareas del checklist, el ticket se cierra automaticamente |
| PWA Ready | Accesible desde dispositivos moviles en red local |
| Archivos Adjuntos | Fotos de activos y facturas PDF |
| Codigos QR | Generacion automatica para identificacion rapida |

---

## 2. Arquitectura del Sistema

```
+-------------------+        +-------------------+        +------------------+
|    Frontend       |  HTTP  |    Backend         |  SQL   |   SQL Server     |
|    React 19       | -----> |    Express 5       | -----> |   Base: SCAF     |
|    Vite 8         |  :5173 |    Node.js         |  :1433 |                  |
|    React Router 7 |        |    JWT Auth        |        |                  |
+-------------------+        +-------------------+        +------------------+
```

### Stack Tecnologico

**Frontend:**
- React 19 + React Router 7
- Vite 8 (bundler y dev server)
- Lucide React (iconos)
- CSS puro con variables CSS (sin framework CSS)
- react-qr-code (codigos QR)

**Backend:**
- Node.js + Express 5
- mssql (driver SQL Server)
- bcryptjs (hashing de contrasenas)
- jsonwebtoken (autenticacion JWT)
- multer (subida de archivos)
- xlsx (importacion/exportacion Excel)

**Base de Datos:**
- Microsoft SQL Server 2019+
- Esquema relacional 3NF
- 20+ tablas con indices optimizados

---

## 3. Instalacion y Puesta en Marcha

### Requisitos Previos

1. **Node.js** v18+ instalado ([nodejs.org](https://nodejs.org))
2. **SQL Server** 2019+ (Express Edition es suficiente)
3. **SQL Server Management Studio (SSMS)** para ejecutar scripts SQL
4. **Git** (opcional, para clonar el repositorio)

### Paso 1: Crear la Base de Datos

1. Abrir SSMS y conectarse al servidor SQL Server
2. Abrir el archivo `Instaladores/SCAF_SCHEMA_COMPLETO.sql`
3. Ejecutar el script completo (F5)
4. Verificar que la base de datos `SCAF` fue creada con todas las tablas

### Paso 2: Configurar la Conexion

1. Navegar a la carpeta `backend/`
2. Crear un archivo `.env` con el siguiente contenido:

```env
SQL_SERVER=localhost
SQL_USER=sa
SQL_PASSWORD=TuPasswordAqui
SQL_DATABASE=SCAF
SQL_PORT=1433
JWT_SECRET=una_clave_secreta_larga_y_aleatoria
PORT=5000
CORS_ORIGINS=http://localhost:5173,http://localhost:4173
```

> Ajusta `SQL_SERVER`, `SQL_USER` y `SQL_PASSWORD` segun tu instalacion de SQL Server.

### Paso 3: Instalar Dependencias

```bash
npm install
```

### Paso 4: Crear el Super Administrador

```bash
cd backend
node create-superadmin.js
```

Esto crea el usuario inicial:
- **Usuario:** `admin`
- **Contrasena:** `Admin2026`

### Paso 5: Iniciar el Sistema

**Opcion A - Desarrollo (2 terminales):**
```bash
# Terminal 1: Backend
npm start

# Terminal 2: Frontend
npm run dev
```

**Opcion B - Produccion (Windows, un solo clic):**
```bash
# Doble clic en SCAF_INIT.bat
```

El `.bat` compila el frontend, inicia el backend en puerto 5000 y sirve la app en puerto 4173.

### Paso 6: Acceder al Sistema

- **Local:** http://localhost:5173 (dev) o http://localhost:4173 (produccion)
- **Red local:** http://TU_IP:4173 (accesible desde otros dispositivos)
- Iniciar sesion con `admin` / `Admin2026`

---

## 4. Modulos del Sistema

El sidebar izquierdo organiza todos los modulos:

| Icono | Modulo | Ruta | Descripcion |
|---|---|---|---|
| Dashboard | Panel Principal | `/dashboard` | Resumen de KPIs, alertas y estadisticas |
| Inventario | Inventario | `/inventory` | Gestion de activos fijos |
| Mantenimiento | Mantenimiento | `/maintenances` | Hub de mantenimiento segmentado por scope |
| Calendario | Calendario | `/calendar` | Vista mensual de tickets programados |
| Movimientos | Movimientos | `/movements` | Historial de traslados y cambios de estado |
| Proveedores | Proveedores | `/suppliers` | Gestion de contratistas y proveedores |
| Empleados | Empleados | `/employees` | Registro de personal |
| Ficheros | Ficheros | `/files` | Catalogos del sistema (categorias, organizacion, tipos) |
| Usuarios | Usuarios | `/users` | Gestion de usuarios y roles |
| Auditoria | Auditoria | `/audit` | Bitacora de todas las acciones |
| Ajustes | Configuracion | `/settings` | Datos de empresa y preferencias |

---

## 5. Ficheros (Catalogos)

Los Ficheros son los catalogos base que alimentan todo el sistema. Se gestionan desde `/files` y tienen **3 secciones en pestanas**:

### 5.1 Categorias de Activos

Arbol jerarquico para clasificar activos. Ejemplo:

```
Equipos Mayores           ← Categoria raiz (Nivel 1)
  ├── Secadoras           ← Familia (Nivel 2)
  │     ├── Secadora Industrial
  │     └── Secadora Domestica
  ├── Lavadoras
  └── Planchas

Equipos Menores
  ├── Herramientas
  └── Utensilios
```

**Vinculacion con Modulos de Mantenimiento:**
Cada categoria raiz puede vincularse a un modulo (scope) de mantenimiento:
- Al asignar "Equipos Mayores" al scope "Area", todos los activos de esa categoria apareceran en "Mantenimiento de Area".
- El dropdown de scope aparece junto a cada nodo raiz en la pestana de categorias.

**Como crear una categoria:**
1. Ir a Ficheros > Pestana "Categorias"
2. Clic en "Agregar Raiz" para crear una categoria principal
3. Clic en el boton "+" junto a una categoria para agregar hijos (familias)
4. Para vincular a un modulo de mantenimiento, seleccionar el scope en el dropdown

### 5.2 Estructura Organizacional

Arbol de 3 niveles que define donde se ubican los activos:

```
Area de Servicios         ← Area (Nivel 1)
  ├── Comedor de Personal ← Ubicacion (Nivel 2)
  │     ├── Cocina        ← Departamento (Nivel 3)
  │     └── Salon
  └── Lavanderia
        ├── Zona Lavado
        └── Zona Secado
```

**Como crear:**
1. Ir a Ficheros > Pestana "Organizacion"
2. "Agregar Raiz" = Area
3. "+" sobre un area = Ubicacion
4. "+" sobre una ubicacion = Departamento

### 5.3 Tipos de Mantenimiento

Arbol jerarquico de tipos de mantenimiento:

```
Mantenimiento Preventivo Base de Activos Fijos
Mantenimiento Correctivo Programado
Mantenimiento Correctivo
```

Estos tipos determinan si un ticket es preventivo o correctivo. Al crear una orden de trabajo directa solo se muestran los tipos correctivos. Al programar desde un plan, solo se muestra el tipo preventivo.

---

## 6. Inventario de Activos

### 6.1 Ver Lista de Activos

Ruta: `/inventory`

La vista principal muestra una tabla con todos los activos registrados. Incluye:
- Busqueda por nombre, ID, serial, marca
- Filtro por estado (Activo, Inactivo, En Mantenimiento, etc.)
- Filtro por categoria
- Exportacion a Excel
- Boton para generar codigo QR

### 6.2 Registrar un Nuevo Activo

Ruta: `/inventory/new`

El formulario tiene las siguientes secciones:

**Informacion Principal:**
- Nombre del Activo (obligatorio) — Ej: "Secadora Industrial S-01"
- Cargado Por — Usuario que registra
- Descripcion — Texto libre

**Clasificacion Estrategica:**
- Categoria (obligatorio) — Selecciona del arbol de Ficheros
- Familia — Sub-clasificacion dentro de la categoria
- Sublinea — Texto libre para vincular con planes de mantenimiento
- Proveedor Asignado — Selecciona de la lista de proveedores
- Marca — Ej: "Whirlpool"
- Modelo — Ej: "AWG 1212"
- Serial — Numero de serie de fabrica

> Al seleccionar una categoria, el sistema muestra automaticamente a que modulo de mantenimiento pertenece el activo (Area, Habitaciones o Activos).

**Adquisicion y Estado:**
- Valor USD (obligatorio) — Costo de adquisicion
- Fecha de Ingreso — Fecha en que se registro el activo
- Estado — Activo, Inactivo, En Revision, etc.

**Estructura Organizativa:**
- Area (obligatorio) — Primer nivel del arbol organizacional
- Ubicacion — Segundo nivel
- Departamento — Tercer nivel
- Custodio — Empleado asignado como responsable

**Archivos Adjuntos:**
- Foto del Activo — Imagen JPG/PNG
- Factura de Compra — Archivo PDF

### 6.3 Ver Detalle de un Activo

Ruta: `/inventory/view/:id`

Muestra la ficha tecnica completa del activo con:
- Foto del activo
- Todos los datos registrados
- Codigo QR generado automaticamente
- Historial de mantenimientos del activo
- Boton para ver historial de movimientos

### 6.4 Historial de un Activo

Ruta: `/inventory/history/:id`

Linea de tiempo con todos los eventos del activo:
- Movimientos de ubicacion
- Cambios de estado
- Mantenimientos realizados

---

## 7. Mantenimiento

El modulo de mantenimiento es el nucleo del sistema. Esta segmentado por **modulos (scopes)** que agrupan los activos segun su categoria raiz.

### 7.1 Selector de Modulo

Ruta: `/maintenances`

Al entrar a Mantenimiento, el sistema muestra los modulos disponibles:

| Modulo | Slug | Descripcion |
|---|---|---|
| Mantenimientos de Area | `area` | Activos de areas comunes (equipos mayores, etc.) |
| Mantenimiento de Habitaciones | `habitacion` | Activos de habitaciones |
| Mantenimiento de Activos | `activo` | Activos generales/individuales |

Cada modulo tiene un color e icono propio. Al seleccionar uno, se filtra toda la informacion de mantenimiento a ese alcance.

### 7.2 Lista de Tickets

Ruta: `/maintenances/list/:scope`

Muestra todos los tickets de mantenimiento del modulo seleccionado, con:
- Filtros por estado (PENDIENTE, EN PROGRESO, COMPLETADO)
- Busqueda por nombre de activo o titulo
- Boton "Nueva Orden de Trabajo" — Crea una OT correctiva directa
- Boton "Nuevo Plan" — Acceso a programacion de planes

### 7.3 Crear un Ticket de Mantenimiento (Correctivo Directo)

Ruta: `/maintenances/new?scope=area`

Formulario para registrar un mantenimiento puntual:

1. **Titulo** — Descripcion breve del mantenimiento
2. **Activo** — Buscador con autocompletado (filtra por nombre, ID, serial)
3. **Tipo** — Solo muestra correctivos si es orden directa
4. **Proveedor** — Opcional, contratista externo
5. **Responsable** — Empleado asignado
6. **Fechas** — Inicio y fin estimado
7. **Descripcion** — Detalle del problema o trabajo
8. **Tarea** — Se agrega automaticamente una tarea al checklist

Al guardar, el ticket aparece en la lista del modulo correspondiente al scope.

### 7.4 Ver Detalle de un Ticket

Ruta: `/maintenances/view/:id`

Vista completa del ticket con:
- Informacion del activo intervenido (nombre, ubicacion, departamento)
- Estado actual con posibilidad de cambiar (PENDIENTE → EN PROGRESO → COMPLETADO)
- Checklist de tareas con checkbox interactivo
- **Auto-completado:** Cuando todas las tareas del checklist se marcan como completadas, el ticket cambia automaticamente a COMPLETADO
- Historial de reprogramaciones
- Boton para reprogramar (cambiar fechas con motivo)

### 7.5 Planes de Mantenimiento

Ruta: `/maintenances/routines?scope=area`

Los planes son plantillas reutilizables para mantenimiento preventivo.

**Crear un Plan:**
1. Ir a Programacion > "Nuevo Plan"
2. Llenar:
   - Codigo — Identificador unico (Ej: PLAN-SEC-001)
   - Descripcion — Que se hace (Ej: "Mantenimiento Preventivo Secadoras")
   - Categoria — Filtra por el scope actual
   - Familia — Sub-clasificacion
   - Frecuencia — Cada cuanto se repite (Mensual, Trimestral, etc.)
3. Agregar **Tareas del Plan** — Lista de actividades a realizar:
   - Descripcion de la tarea
   - Frecuencia individual de la tarea
4. Guardar

**Ejemplo de Plan:**
```
Codigo: PLAN-SEC-001
Descripcion: Mantenimiento Preventivo Secadoras
Categoria: Equipos Mayores
Familia: Secadoras
Frecuencia: Mensual

Tareas:
  1. Revisar filtros de aire (Mensual)
  2. Lubricar rodamientos (Trimestral)
  3. Calibrar sensores de temperatura (Semestral)
  4. Inspeccion general de ductos (Anual)
```

### 7.6 Programar un Plan (Generar Tickets)

Ruta: `/maintenances/routines/schedule/:planId`

Desde la lista de planes, al hacer clic en "Programar":

1. Seleccionar activos elegibles (filtrados por categoria/familia del plan)
2. Definir rango de fechas (inicio - fin del periodo)
3. El sistema genera automaticamente los tickets segun la frecuencia de cada tarea

**Ejemplo:** Un plan mensual programado de Enero a Diciembre genera 12 tickets.

### 7.7 Planificador de Ordenes de Trabajo

Ruta: `/maintenances/planner` o `/maintenances/planner/:planId`

El Planificador es la herramienta mas completa para crear ordenes de trabajo:

**Desde un Plan (Preventivo):**
- El nombre y tareas se cargan del plan
- Solo muestra tipo "Preventivo"
- Los activos se filtran por la categoria/familia del plan
- Boton "Auto-Programar" genera todas las ocurrencias segun frecuencia

**Orden Directa (Correctivo):**
- El usuario define nombre, activo, fechas
- Solo muestra tipos "Correctivo" y "Correctivo Programado"
- Agrega tareas manualmente

**Componentes del Planificador:**
1. **Panel izquierdo** — Formulario con nombre, fechas, buscador de activo, tipo, responsable
2. **Panel derecho** — Mini calendario mensual que muestra visualmente las tareas
3. **Tabla inferior** — Lista de tareas especificas con fecha programada y notas
4. **Acciones** — Guardar como Plantilla, Copiar a Otro Activo, Guardar Orden

**Buscador de Activos:**
- Campo de busqueda por nombre, ID o serial
- Muestra resultados con icono, nombre, ID, serial, area y ubicacion
- Al seleccionar, muestra una tarjeta con el activo elegido

### 7.8 Planes en Marcha (Ordenes de Trabajo)

Ruta: `/maintenances/work-orders?scope=area`

Listado de ordenes de trabajo activas con:
- Nombre del plan
- Activo asignado
- Progreso (tareas completadas / total)
- Barra de progreso visual
- Fechas de inicio y fin

### 7.9 Calendario

Ruta: `/calendar`

Vista mensual del calendario de mantenimiento:
- Cada dia muestra etiquetas de colores con los modulos que tienen tickets ese dia
- Al hacer clic en un dia, se abre un modal con dos pasos:
  1. **Paso 1:** Muestra las tarjetas de cada modulo con estadisticas (total tickets, completados, pendientes)
  2. **Paso 2:** Al seleccionar un modulo, muestra la lista de tickets de ese dia filtrados por modulo

### 7.10 Cronograma (Timeline)

Ruta: `/maintenances/timeline?scope=area`

Vista anual tipo Gantt que muestra todos los mantenimientos en una linea de tiempo horizontal.

### 7.11 Agenda Diaria del Operador

Ruta: `/maintenances/daily?scope=area`

Vista optimizada para tecnicos/operadores que muestra solo las tareas asignadas para el dia actual.

### 7.12 Reprogramados

Ruta: `/maintenances/rescheduled?scope=area`

Historial de todos los tickets que fueron reprogramados, con motivo y fechas originales vs nuevas.

---

## 8. Proveedores

### 8.1 Lista de Proveedores

Ruta: `/suppliers`

Tabla con todos los proveedores/contratistas registrados.

### 8.2 Registrar un Proveedor

Ruta: `/suppliers/new`

Campos:
- ID (generado o manual) — Ej: "PROV-001"
- Nombre de la Empresa
- RIF/NIT
- Contacto (nombre de persona)
- Telefono
- Correo
- Direccion
- Forma de Pago — Selecciona del catalogo (Efectivo, Transferencia, etc.)

### 8.3 Ver Proveedor

Ruta: `/suppliers/view/:id`

Ficha del proveedor con historial de mantenimientos realizados por el.

---

## 9. Empleados

Ruta: `/employees`

Registro del personal de la organizacion:
- Nombre y Apellido
- Cedula (unica)
- Departamento
- Cargo
- Estado (Activo/Inactivo)

Los empleados aparecen como opciones de "Responsable" al crear tickets y ordenes de trabajo.

---

## 10. Movimientos

### 10.1 Lista de Movimientos

Ruta: `/movements`

Historial de todos los movimientos de activos (traslados, cambios de estado, bajas).

### 10.2 Registrar un Movimiento

Ruta: `/movements/new`

Campos:
- Activo — Buscar y seleccionar
- Motivo — Seleccionar del catalogo (Cambio de Ubicacion, Dado de Baja, etc.)
- Nueva Ubicacion / Departamento / Area
- Nuevo Estado
- Observacion

El movimiento guarda un snapshot del estado anterior y el nuevo, creando trazabilidad completa.

---

## 11. Usuarios y Roles

Ruta: `/users`

### 11.1 Roles del Sistema

El sistema maneja roles con permisos granulares:

| Rol | Permisos Tipicos |
|---|---|
| SUPERADMIN | Acceso total, gestion de usuarios, reset del sistema |
| GESTOR | Inventario, mantenimiento, proveedores |
| AUDITOR | Solo lectura de inventario, auditoria |
| Personalizado | El admin define los permisos por modulo |

**Permisos disponibles:**
- `dashboard` — Ver panel principal
- `inventory` / `inventory_create` / `inventory_edit` / `inventory_delete` — Inventario
- `suppliers` — Proveedores
- `maintenances` — Mantenimiento
- `assignments` — Asignaciones
- `files` — Ficheros
- `settings` — Configuracion
- `users` — Gestion de usuarios
- `audit` — Auditoria

### 11.2 Crear un Usuario

1. Ir a Usuarios
2. Clic en "Nuevo Usuario"
3. Llenar: Nombre, Username, Correo, Rol
4. El sistema genera una contrasena temporal

---

## 12. Auditoria

Ruta: `/audit`

Registro inmutable de todas las acciones realizadas en el sistema:
- Fecha y hora
- Usuario que realizo la accion
- Tipo de accion (POST, PUT, DELETE, RESET)
- Entidad afectada (Activos, Mantenimiento, etc.)
- Descripcion detallada
- Cambios realizados (JSON)

Filtros disponibles por:
- Rango de fechas
- Entidad
- Usuario
- Tipo de accion

---

## 13. Configuracion de Empresa

Ruta: `/settings`

### 13.1 Datos de la Empresa
- Nombre de la empresa
- NIT/RIF
- Correo corporativo
- Telefono
- Direccion
- Moneda (USD, etc.)

### 13.2 Preferencias del Sistema
- Dias de alerta para mantenimiento (default: 15)
- Items por pagina en tablas (default: 50)
- Simbolo de moneda ($, Bs, etc.)
- Permitir borrado de registros (Si/No)

### 13.3 Conexion a Base de Datos
- Probar conexion con nuevos parametros
- Guardar configuracion de conexion

### 13.4 Reset del Sistema
- Solo disponible para SUPERADMIN
- Elimina todos los datos excepto el usuario admin
- Util para puesta en marcha en nuevo entorno

---

## 14. Estructura de Base de Datos

### Diagrama de Tablas

```
CONFIG_EMP (1 fila)
ROL ──────────────── USUARIO
                        │
CATEGORIA ──────────── ACTIVO ─────── MOVIMIENTO
    │                   │   │            │
    │ (ID_SCOPE)        │   │         MOTIVO_MOVIMIENTO
    ▼                   │   │
SCOPE_MANT              │   └──── PROVEEDOR ── FORMA_PAGO
    │                   │
    ▼                   │
PLAN_MANT ───── TAREA_PLAN
    │
    ▼
ORDEN_TRAB
    │
    ▼
TICKET_MANT ──── TAREA_TICKET
    │
    ▼
REPROGRAMACION

ESTADO_ACTIVO
UNIDAD_ORG (arbol)
TIPO_MANT (arbol)
FRECUENCIA_PLAN
EMPLEADO
AUDITORIA
```

### Tablas Principales

| Tabla | PK | Descripcion |
|---|---|---|
| CONFIG_EMP | INT (1) | Configuracion de la empresa |
| ROL | VARCHAR(50) | Roles del sistema con permisos JSON |
| USUARIO | VARCHAR(50) | Usuarios con hash bcrypt |
| CATEGORIA | VARCHAR(50) | Arbol de categorias de activos |
| UNIDAD_ORG | VARCHAR(50) | Arbol organizacional (Sede>Depto>Area) |
| TIPO_MANT | VARCHAR(50) | Tipos de mantenimiento jerarquicos |
| ESTADO_ACTIVO | INT IDENTITY | Estados posibles de un activo |
| FORMA_PAGO | INT IDENTITY | Formas de pago para proveedores |
| PROVEEDOR | VARCHAR(50) | Proveedores y contratistas |
| SCOPE_MANT | INT IDENTITY | Modulos de mantenimiento (Area, Habitacion, Activo) |
| FRECUENCIA_PLAN | INT IDENTITY | Frecuencias de planificacion |
| MOTIVO_MOVIMIENTO | INT IDENTITY | Catalogo de motivos de traslado |
| EMPLEADO | INT IDENTITY | Personal de la organizacion |
| ACTIVO | VARCHAR(50) | Inventario principal de activos |
| MOVIMIENTO | INT IDENTITY | Historial de movimientos |
| PLAN_MANT | VARCHAR(50) | Planes maestros de mantenimiento |
| TAREA_PLAN | VARCHAR(50) | Tareas plantilla de cada plan |
| ORDEN_TRAB | VARCHAR(50) | Ordenes de trabajo |
| TICKET_MANT | VARCHAR(50) | Tickets de mantenimiento |
| TAREA_TICKET | INT IDENTITY | Checklist de cada ticket |
| REPROGRAMACION | INT IDENTITY | Historial de reprogramaciones |
| AUDITORIA | INT IDENTITY | Bitacora inmutable |

---

## 15. API REST

El backend expone las siguientes rutas. Todas (excepto `/api/auth`) requieren token JWT en el header `Authorization: Bearer <token>`.

### Autenticacion
| Metodo | Ruta | Descripcion |
|---|---|---|
| POST | `/api/auth/login` | Iniciar sesion (retorna JWT) |

### Activos
| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | `/api/assets` | Listar todos los activos |
| GET | `/api/assets/:id` | Detalle de un activo |
| POST | `/api/assets` | Crear activo |
| PUT | `/api/assets/:id` | Actualizar activo |
| DELETE | `/api/assets/:id` | Eliminar activo (borrado logico) |
| POST | `/api/assets/batch` | Crear multiples activos |
| POST | `/api/assets/:id/files` | Subir foto/factura |

### Mantenimientos
| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | `/api/maintenances` | Listar tickets |
| GET | `/api/maintenances/:id` | Detalle de ticket |
| POST | `/api/maintenances` | Crear ticket |
| PUT | `/api/maintenances/:id` | Actualizar ticket |
| DELETE | `/api/maintenances/:id` | Eliminar ticket |
| PUT | `/api/maintenances/:id/status` | Cambiar estado |
| GET | `/api/maintenances/:id/tasks` | Listar tareas del checklist |
| PUT | `/api/maintenances/tasks/:taskId` | Marcar/desmarcar tarea |
| POST | `/api/maintenances/:id/reschedule` | Reprogramar |

### Planes de Mantenimiento
| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | `/api/maintenance-plans` | Listar planes |
| POST | `/api/maintenance-plans/batch` | Crear/actualizar plan con tareas |
| POST | `/api/maintenance-plans/generate` | Generar tickets desde plan |

### Ordenes de Trabajo
| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | `/api/work-orders` | Listar ordenes |
| POST | `/api/work-orders` | Crear orden |
| DELETE | `/api/work-orders/:id` | Eliminar orden |

### Proveedores
| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | `/api/suppliers` | Listar proveedores |
| GET | `/api/suppliers/:id` | Detalle |
| POST | `/api/suppliers` | Crear |
| PUT | `/api/suppliers/:id` | Actualizar |
| DELETE | `/api/suppliers/:id` | Eliminar |

### Ficheros
| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | `/api/files/categories` | Arbol de categorias |
| POST | `/api/files/categories` | Crear categoria |
| PUT | `/api/files/categories/:id` | Actualizar (incluye scope) |
| DELETE | `/api/files/categories/:id` | Eliminar |
| GET | `/api/files/organization` | Arbol organizacional |
| POST | `/api/files/organization` | Crear nodo |
| GET | `/api/files/maintenanceTypes` | Arbol de tipos |
| POST | `/api/files/maintenanceTypes` | Crear tipo |
| GET | `/api/files/assetStatuses` | Estados de activo |
| GET | `/api/files/paymentMethods` | Formas de pago |

### Movimientos
| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | `/api/movements` | Listar movimientos |
| POST | `/api/movements` | Registrar movimiento |

### Empleados
| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | `/api/employees` | Listar empleados |
| POST | `/api/employees` | Crear |
| PUT | `/api/employees/:id` | Actualizar |
| DELETE | `/api/employees/:id` | Eliminar |

### Usuarios y Roles
| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | `/api/users` | Listar usuarios |
| POST | `/api/users` | Crear usuario |
| PUT | `/api/users/:id` | Actualizar |
| GET | `/api/roles` | Listar roles |
| POST | `/api/roles` | Crear rol |
| PUT | `/api/roles/:id` | Actualizar rol |

### Modulos de Mantenimiento
| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | `/api/maintenance-scopes` | Listar modulos |

### Sistema
| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | `/api/settings` | Obtener configuracion |
| PUT | `/api/settings` | Guardar configuracion |
| POST | `/api/test-db` | Probar conexion BD |
| POST | `/api/save-db` | Guardar config de conexion |
| POST | `/api/factory-reset` | Reset del sistema (SUPERADMIN) |

### Dashboard
| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | `/api/dashboard/stats` | Estadisticas generales |

### Auditoria
| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | `/api/audit` | Listar registros de auditoria |

---

## 16. Estructura de Archivos

```
SCAF_Test/
├── backend/                    # Servidor Express
│   ├── controllers/            # Logica de negocio
│   │   ├── assets.controller.js
│   │   ├── auth.controller.js
│   │   ├── audit.controller.js
│   │   ├── dashboard.controller.js
│   │   ├── employees.controller.js
│   │   ├── files.controller.js
│   │   ├── maintenancePlans.controller.js
│   │   ├── maintenances.controller.js
│   │   ├── maintenanceScopes.controller.js
│   │   ├── movements.controller.js
│   │   ├── roles.controller.js
│   │   ├── suppliers.controller.js
│   │   ├── system.controller.js
│   │   ├── upload.controller.js
│   │   ├── users.controller.js
│   │   └── workOrders.controller.js
│   ├── routes/                 # Definicion de rutas Express
│   │   └── (16 archivos .routes.js)
│   ├── middleware/
│   │   └── auth.js             # Middleware JWT
│   ├── utils/
│   │   └── auditLogger.js      # Utilidad de auditoria
│   ├── uploads/                # Archivos subidos (fotos, PDFs)
│   ├── db.js                   # Conexion a SQL Server
│   ├── server.js               # Punto de entrada del backend
│   ├── create-superadmin.js    # Script para crear admin
│   ├── loadEnv.js              # Carga variables de entorno
│   └── .env                    # Variables de entorno (NO se sube a git)
│
├── src/                        # Frontend React
│   ├── pages/                  # Vistas/paginas
│   │   ├── Auth/Login.jsx
│   │   ├── Dashboard/Dashboard.jsx
│   │   ├── Inventory/          # InventoryList, InventoryForm, InventoryView, AssetHistory
│   │   ├── Maintenance/        # 13 componentes de mantenimiento
│   │   ├── Movements/          # MovementsList, MovementForm
│   │   ├── Suppliers/          # SuppliersList, SupplierForm, SupplierView
│   │   ├── Employees/          # EmployeesList, EmployeeForm
│   │   ├── Files/Files.jsx     # Ficheros (3 pestanas)
│   │   ├── Users/UsersList.jsx
│   │   ├── Audit/AuditLogs.jsx
│   │   ├── Companies/ConfigEmpresa.jsx
│   │   └── Assignments/Assignments.jsx
│   ├── components/
│   │   ├── Layout/             # MainLayout, Sidebar, Header
│   │   ├── Common/             # Componentes reutilizables
│   │   ├── Maintenance/        # ScopeGate (filtro de modulo)
│   │   └── PWA/                # Componentes PWA
│   ├── context/
│   │   └── AppContext.jsx      # Estado global de la app
│   ├── api.js                  # Cliente HTTP (fetch wrapper)
│   ├── App.jsx                 # Enrutamiento principal
│   ├── App.css                 # Estilos globales
│   ├── index.css               # Variables CSS
│   └── mobile.css              # Estilos responsive
│
├── Instaladores/               # Todo para migrar el proyecto
│   ├── SCAF_SCHEMA_COMPLETO.sql
│   └── MANUAL_SCAF.md
│
├── SCAF_INIT.bat               # Script de inicio Windows
├── package.json                # Dependencias Node.js
├── vite.config.js              # Configuracion Vite
└── index.html                  # HTML raiz
```

---

## 17. Preguntas Frecuentes

### No veo los tickets en el modulo correcto
Verificar que la categoria raiz del activo tenga asignado el scope correcto en Ficheros > Categorias. El dropdown de scope aparece junto a cada categoria raiz.

### El sistema muestra "Sin tipos configurados"
Ir a Ficheros > Tipos de Mantenimiento y crear al menos los tipos base: Preventivo, Correctivo, Correctivo Programado.

### Como cambiar la contrasena del admin
Ir a Usuarios > seleccionar el usuario admin > Editar > cambiar contrasena.

### El calendario no muestra tickets
Verificar que los tickets tengan fechas asignadas dentro del mes visible. Los tickets sin fecha de inicio no aparecen en el calendario.

### Como acceder desde otro dispositivo en la red
1. Ejecutar `SCAF_INIT.bat`
2. El script muestra la IP de red (ej: `http://192.168.1.100:4173`)
3. Abrir esa URL desde cualquier navegador en la misma red

### El buscador de activos no muestra resultados
Verificar que:
1. El scope del modulo actual corresponde a la categoria del activo
2. El activo tiene estado "Activo"
3. El activo no esta dado de baja (BORRADO = 0)

### Como respaldar la base de datos
Usar SSMS: Click derecho en la BD SCAF > Tasks > Back Up. Guardar el archivo .bak en una ubicacion segura.

### Como restaurar en otro equipo
1. Instalar SQL Server en el nuevo equipo
2. Ejecutar `SCAF_SCHEMA_COMPLETO.sql` para crear las tablas
3. Copiar la carpeta del proyecto
4. Configurar el `.env` con los datos del nuevo servidor
5. Ejecutar `npm install`
6. Ejecutar `node backend/create-superadmin.js`
7. Ejecutar `SCAF_INIT.bat`

---

*Documento generado para SCAF v1.0 - Mayo 2026*
