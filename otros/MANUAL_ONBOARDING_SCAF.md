# SCAF — Manual de Onboarding del Sistema
## Sistema de Control de Activos Fijos
**Versión:** 1.0 | **Última Actualización:** Abril 2026

---

## ÍNDICE

1. [Introducción General](#1-introducción-general)
2. [Acceso al Sistema (Login)](#2-acceso-al-sistema)
3. [Dashboard Ejecutivo](#3-dashboard-ejecutivo)
4. [Módulo de Inventario de Activos](#4-módulo-de-inventario-de-activos)
5. [Módulo de Mantenimientos](#5-módulo-de-mantenimientos)
6. [Módulo de Proveedores](#6-módulo-de-proveedores)
7. [Calendario de Mantenimiento](#7-calendario-de-mantenimiento)
8. [Mi Agenda Diaria (Operadores)](#8-mi-agenda-diaria)
9. [Gestión de Usuarios y Roles (RBAC)](#9-gestión-de-usuarios-y-roles)
10. [Catálogos de Selección (Ficheros)](#10-catálogos-de-selección-ficheros)
11. [Auditoría y Trazabilidad](#11-auditoría-y-trazabilidad)
12. [Configuración de Empresa](#12-configuración-de-empresa)
13. [Glosario de Términos](#13-glosario-de-términos)

---

## 1. Introducción General

**SCAF** (Sistema de Control de Activos Fijos) es una plataforma web diseñada para gestionar de forma integral el ciclo de vida de los activos fijos de una organización: desde su registro e ingreso al inventario, pasando por la programación y ejecución de mantenimientos preventivos y correctivos, hasta su trazabilidad completa mediante auditorías automáticas.

### 1.1 Arquitectura del Sistema

| Componente | Tecnología |
|---|---|
| Frontend (Interfaz) | React.js con diseño responsivo |
| Backend (Servidor API) | Node.js + Express |
| Base de Datos | Microsoft SQL Server |
| Autenticación | JWT (JSON Web Tokens) con BCrypt |
| Permisos | RBAC granular por módulo |

### 1.2 Requisitos Mínimos

- Navegador web moderno (Chrome, Edge, Firefox).
- Conexión de red al servidor donde está instalado SCAF.
- Credenciales de acceso proporcionadas por el Administrador del sistema.

### 1.3 Barra Lateral de Navegación

La barra lateral izquierda (Sidebar) es el menú principal de navegación. Los módulos visibles dependen de los permisos asignados a su rol. El indicador inferior muestra el estado de conexión con la base de datos SQL Server (**SQL Online** en verde o **SQL Offline** en rojo).

---

## 2. Acceso al Sistema

### 2.1 Inicio de Sesión

Para acceder al sistema:

1. Abra su navegador e ingrese la URL proporcionada por su administrador.
2. Se presentará la pantalla de **Login**.
3. Introduzca su **correo electrónico** y **contraseña**.
4. Presione el botón **"Iniciar Sesión"**.

> **Nota:** Las contraseñas están cifradas con algoritmo BCrypt. Si olvida su contraseña, solicite al Administrador que la restablezca desde el módulo de Usuarios.

### 2.2 Cierre de Sesión

Para cerrar sesión, haga clic en el botón **"Cerrar Sesión"** ubicado en la parte inferior de la barra lateral. Esto eliminará su token de acceso del navegador y lo redirigirá a la pantalla de Login.

### 2.3 Seguridad de Sesión

- Su sesión se autentica mediante un **token JWT** almacenado localmente.
- Si el token expira o es inválido, será redirigido automáticamente al Login.
- Cada acción que realice queda registrada en el módulo de Auditoría con su nombre de usuario.

---

## 3. Dashboard Ejecutivo

**Ruta:** `/dashboard` | **Permiso requerido:** `dashboard`

El Dashboard es la pantalla de inicio del sistema. Presenta un resumen ejecutivo del estado general de los activos de la empresa.

### 3.1 Indicadores Principales (KPIs)

| Indicador | Descripción |
|---|---|
| **Valor de Adquisición Total** | Suma total del costo de compra de todos los activos registrados, expresado en USD. |
| **Valor Neto Estimado** | Valor actual de los activos considerando depreciación. Muestra la diferencia con el valor de adquisición. |
| **Total Activos Registrados** | Cantidad de activos en el inventario, indicando cuántos están en estado "Activo". |
| **Equipos en Mantenimiento** | Número de activos que actualmente se encuentran en proceso de mantenimiento. |

### 3.2 Panel de Alertas de Mantenimiento

Muestra una lista de activos cuya fecha límite de mantenimiento está próxima o ya se ha vencido, permitiendo al usuario tomar acción inmediata programando la revisión correspondiente.

### 3.3 Actividad Reciente

Línea de tiempo que muestra las últimas acciones realizadas en el sistema (asignaciones, registros nuevos, cierres de mes).

---

## 4. Módulo de Inventario de Activos

**Ruta:** `/inventory` | **Permisos:** `inventory_view`, `inventory_create`, `inventory_edit`, `inventory_delete`

Este módulo gestiona el catálogo completo de activos fijos de la organización.

### 4.1 Lista de Activos

La vista principal muestra una tabla con todos los activos registrados. Funcionalidades disponibles:

- **Búsqueda:** Filtre por código, nombre, categoría o serial.
- **Ordenamiento:** Haga clic en cualquier encabezado de columna para ordenar ascendente/descendente.
- **Paginación:** Navegue entre páginas si el inventario supera 8 registros.
- **Exportar Excel:** Genera un archivo `.xlsx` con todos los datos del inventario.

### 4.2 Registrar un Nuevo Activo

**Permiso requerido:** `inventory_create`

1. Presione el botón **"+ Registrar Activo"** en la esquina superior derecha.
2. Complete los campos obligatorios del formulario (marcados con *):

| Sección | Campos |
|---|---|
| **Información Principal** | Nombre del Activo*, Cargado Por, Descripción |
| **Clasificación Estratégica** | Categoría*, Familia, Sublínea (vincula al Plan de Mantenimiento), Proveedor*, Marca*, Serial* |
| **Adquisición y Estado** | Valor USD*, Fecha de Ingreso*, Estado (Activo, En Mantenimiento, etc.) |
| **Estructura Organizativa** | Sede Física*, Departamento, Área Receptora, Custodio |
| **Archivos Adjuntos** | Factura PDF, Foto del Activo |

3. Presione **"Guardar Activo"**.

> **Vinculación Automática con Planes de Mantenimiento:** Al seleccionar una Sublínea que coincida con un Plan de Mantenimiento existente, el sistema mostrará un indicador verde: *"✓ Protocolo de Mantenimiento Detectado"*. Esto significa que al crear tickets de mantenimiento para este activo, el protocolo se aplicará automáticamente.

### 4.3 Editar un Activo

**Permiso requerido:** `inventory_edit`

Haga clic en el ícono de lápiz (✏️) en la columna de acciones del activo deseado. Se abrirá el mismo formulario con los datos precargados para su modificación.

### 4.4 Eliminar un Activo

**Permiso requerido:** `inventory_delete`

Haga clic en el ícono de papelera (🗑️). Se mostrará un cuadro de confirmación indicando que la eliminación es permanente e incluirá el historial de mantenimiento asociado.

### 4.5 Código QR

Cada activo puede generar una **etiqueta QR** imprimible. Al hacer clic en el ícono de QR en la fila del activo, se desplegará una vista previa que:

- Muestra el nombre, ID, marca y modelo del activo.
- Genera un código QR que, al ser escaneado, abre la ficha técnica del activo en cualquier dispositivo.
- Permite **imprimir la etiqueta** directamente.

---

## 5. Módulo de Mantenimientos

### 5.1 Lista General de Tareas

**Ruta:** `/maintenances` | **Permisos:** `maintenances_view`, `maintenances_create`, `maintenances_edit`, `maintenances_delete`, `maintenances_status`

Vista principal de todos los tickets de mantenimiento del sistema.

**Funcionalidades:**
- **Filtro por Estado:** Seleccione entre Todos, Pendiente, En Progreso, Completado o Cancelado.
- **Búsqueda:** Por ticket, serie, activo o cualquier campo.
- **Cambio de Estado Rápido:** Los usuarios con permiso `maintenances_status` pueden cambiar el estado directamente desde el selector desplegable en la tabla, sin necesidad de abrir el formulario de edición.

**Estados disponibles (Semáforo):**

| Estado | Color | Significado |
|---|---|---|
| 🔴 PENDIENTE | Rojo | Tarea creada pero no iniciada |
| 🟡 EN PROGRESO | Amarillo | Trabajo en ejecución |
| 🟢 COMPLETADO | Verde | Trabajo finalizado satisfactoriamente |
| ⚫ CANCELADO | Gris | Tarea descartada |

### 5.2 Registrar una Tarea de Mantenimiento

**Permiso requerido:** `maintenances_create`

1. Presione **"+ Registrar Tarea"**.
2. Complete el formulario:

| Campo | Descripción |
|---|---|
| Título / Descriptivo | Nombre de la tarea (ej: "Cambio de bujías") |
| Tipo de Mantenimiento | Preventivo, Correctivo, u otro tipo definido en Ficheros |
| Activo Objetivo | Busque y seleccione el activo por código o nombre. El sistema detectará automáticamente si existe un protocolo de mantenimiento asociado |
| Estado | Semáforo inicial de la tarea |
| Técnico Asignado | Persona responsable de ejecutar el mantenimiento |
| Proveedor | Personal Interno o proveedor externo |
| Fechas | Inicio y fin estimado |
| Inversión | Costo estimado en USD |

### 5.3 Programación de Rutinas

**Ruta:** `/maintenances/routines`

Gestión de **Planes de Mantenimiento Preventivo** (protocolos reutilizables). Cada plan define un conjunto de tareas tipo checklist que se aplican a una categoría de activos.

**Acciones disponibles:**
- **Nuevo Plan** (`maintenances_create`): Crear un nuevo protocolo de mantenimiento.
- **Importar Excel** (`maintenances_create`): Carga masiva de planes desde un archivo `.xlsx` con las pestañas "Plan de Mantenimiento" y "Detalle de Mantenimiento".
- **Ver Checklist:** Expanda cualquier plan para ver la lista de tareas y sus frecuencias.
- **Editar Plan** (`maintenances_edit`): Modificar el protocolo existente.
- **Eliminar Plan** (`maintenances_delete`): Borrar el plan y todas sus tareas asociadas.
- **Programar** (`maintenances_create`): Genera automáticamente tickets de mantenimiento para un activo específico basándose en el plan seleccionado.

### 5.4 Planes en Marcha (Work Orders)

**Ruta:** `/maintenances/work-orders`

Vista de supervisión de los planes generales en ejecución. Muestra:

- **Progreso visual** (barra de porcentaje) basado en tareas completadas vs. totales.
- **Fechas** de inicio y fin del plan.
- **Responsable** asignado.
- **Estado** automático: se marca como COMPLETADO cuando todas las sub-tareas están finalizadas.

### 5.5 Cronograma (Timeline)

**Ruta:** `/maintenances/timeline`

Vista Gantt simplificada que muestra la distribución temporal de todos los mantenimientos activos. Permite visualizar solapamientos y carga de trabajo.

### 5.6 Vista de Detalle de Tarea

Al hacer clic sobre cualquier tarea en la lista o en el calendario, se abre la **ficha completa de la tarea** con toda su información en modo lectura (no edición).

---

## 6. Módulo de Proveedores

**Ruta:** `/suppliers` | **Permisos:** `suppliers_view`, `suppliers_create`, `suppliers_edit`, `suppliers_delete`

Directorio centralizado de los proveedores de la empresa.

### 6.1 Lista de Proveedores

Tabla con búsqueda, ordenamiento y paginación. Columnas: Código, Proveedor, Contacto, Teléfono, Correo.

### 6.2 Registrar un Proveedor

**Permiso requerido:** `suppliers_create`

Campos del formulario:

| Sección | Campos |
|---|---|
| Información Principal | Razón Social / Nombre*, RIF / CUIT / ID Fiscal |
| Contacto Corporativo | Persona de Contacto, Teléfono |
| Facturación e Impuestos | Correo Electrónico, Forma de Pago (cargada desde Ficheros) |
| Localización | Dirección Física Corporativa |

### 6.3 Exportar a Excel

Genera un archivo `.xlsx` con todos los proveedores registrados para uso externo o respaldo.

---

## 7. Calendario de Mantenimiento

**Ruta:** `/calendar` | **Permiso requerido:** `calendar`

Vista mensual estilo calendario que muestra todas las tareas de mantenimiento programadas.

### 7.1 Características

- **Navegación mensual:** Botones de avance/retroceso y botón "Hoy".
- **Indicadores de color:** Cada tarea tiene un borde lateral que indica su estado (rojo = pendiente, amarillo = en progreso, verde = completado).
- **Vista rápida:** Haga clic en una tarea para ver su ficha de detalle (modo lectura).
- **Desbordamiento:** Si un día tiene más de 2 tareas, se muestra un enlace "+X eventos más" que abre un modal con la lista completa.

---

## 8. Mi Agenda Diaria

**Ruta:** `/maintenances/daily`

Pantalla personalizada para **operadores y técnicos** que muestra únicamente las tareas asignadas al usuario activo.

### 8.1 Vistas Disponibles

| Vista | Descripción |
|---|---|
| **Hoy** | Solo tareas programadas para la fecha actual |
| **Semana** | Tareas de la semana en curso (lunes a domingo) |
| **Mes** | Todas las tareas del mes calendario actual |
| **Siguientes** | Tareas programadas más allá del mes actual |

### 8.2 Checklist Interactivo

Cada tarea se muestra como una tarjeta expandida con su **lista de verificación** (checklist). El operador puede:

1. Hacer clic en cada ítem del checklist para marcarlo como **completado** (✅) o desmarcarlo.
2. Ver el **progreso general** en la barra de porcentaje ubicada en la esquina superior derecha.
3. Acceder a los **detalles completos** de la tarea mediante el botón "Detalles".

> **Importante:** Los Administradores ven todas las tareas del sistema. Los Operadores solo ven las tareas asignadas a su nombre.

---

## 9. Gestión de Usuarios y Roles

**Ruta:** `/users` | **Permisos:** `users_view`, `users_create`, `users_edit`

### 9.1 Usuarios Registrados

Tabla que muestra todos los usuarios del sistema con su nombre, correo, rol asignado y estado (Activo/Inactivo).

**Crear un nuevo usuario** (`users_create`):
1. Presione **"+ Nuevo Usuario"**.
2. Complete: Nombre, Correo Electrónico, Contraseña y Rol asignado.
3. Guarde el registro.

### 9.2 Configuración de Roles

Los roles definen qué acciones puede realizar cada usuario en cada módulo del sistema. SCAF utiliza un modelo de **"Denegar todo, permitir solo lo asignado"**.

### 9.3 Matriz de Permisos

Al crear o editar un rol, se presenta una **matriz visual de permisos** agrupada por módulos:

| Módulo | Permisos Disponibles |
|---|---|
| **Sistema** | `all` (Acceso Total), `dashboard`, `settings`, `audit` |
| **Inventario (Activos)** | `inventory_view`, `inventory_create`, `inventory_edit`, `inventory_delete`, `inventory_status` |
| **Mantenimientos y Tareas** | `maintenances_view`, `maintenances_create`, `maintenances_edit`, `maintenances_delete`, `maintenances_status` |
| **Proveedores** | `suppliers_view`, `suppliers_create`, `suppliers_edit`, `suppliers_delete` |
| **Usuarios y Roles** | `users_view`, `users_create`, `users_edit`, `users_delete` |
| **Otros Módulos** | `calendar`, `assignments`, `files` |

### 9.4 Ejemplos de Configuración de Roles

**Rol: Administrador**
- Permiso `all` activado → acceso total a todos los módulos.

**Rol: Supervisor**
- `dashboard`, `inventory_view`, `inventory_edit`, `maintenances_view`, `maintenances_create`, `maintenances_edit`, `maintenances_status`, `suppliers_view`, `calendar`.
- Puede ver, crear y editar, pero **no puede eliminar** nada.

**Rol: Operador**
- `dashboard`, `maintenances_view`, `maintenances_status`, `calendar`.
- Solo puede **ver** tareas de mantenimiento y **cambiar su estado** (de Pendiente a En Progreso a Completado). No puede crear, editar ni eliminar registros.

> **Nota Crítica:** Los cambios de permisos surten efecto después de que el usuario **cierre sesión y vuelva a iniciar sesión**.

---

## 10. Catálogos de Selección (Ficheros)

**Ruta:** `/files` | **Permiso requerido:** `files`

Editor visual para gestionar las **clasificaciones jerárquicas** que alimentan los menús desplegables de todo el sistema.

### 10.1 Catálogos Disponibles

| Pestaña | Uso en el Sistema |
|---|---|
| **Categorías de Inventario** | Alimenta el campo "Categoría" al registrar activos (ej: Equipos de Cómputo → Laptops → Gaming) |
| **Organización (Sedes y Deptos)** | Estructura de ubicaciones: Sede → Departamento → Área (ej: Sede Principal → Administración → Recepción) |
| **Tipos de Mantenimiento** | Tipos disponibles al crear un ticket (ej: Preventivo, Correctivo, Predictivo) |
| **Estados de Activo** | Lista de estados posibles de un activo (ej: Activo, En Mantenimiento, Dado de Baja) |
| **Formas de Pago** | Opciones de pago para proveedores (ej: Transferencia, Efectivo, Crédito 30 días) |

### 10.2 Operaciones Disponibles

- **Crear clasificación raíz:** Botón "+ Crear [Categoría/Sede/etc.]" al final del árbol.
- **Crear sub-nivel:** Botón "+ Sub-Nivel" en cada nodo existente.
- **Editar nombre:** Ícono de lápiz (✏️) en cada nodo.
- **Eliminar:** Ícono de papelera (🗑️). Si el fichero está vinculado a un activo existente, el sistema **impedirá la eliminación** mostrando un error de integridad.
- **Expandir/Contraer Todo:** Botones para visualización rápida.

---

## 11. Auditoría y Trazabilidad

**Ruta:** `/audit` | **Permiso requerido:** `audit`

Registro inalterable y cronológico de **todas las operaciones** realizadas en el sistema.

### 11.1 Información Registrada

Cada entrada de auditoría contiene:

| Campo | Descripción |
|---|---|
| Fecha y Hora | Marca temporal exacta (UTC) del evento |
| Usuario/Autor | Nombre del usuario que realizó la acción |
| Acción | CREACIÓN (POST), MODIFICACIÓN (PUT) o BORRADO (DELETE) |
| Módulo Afectado | Entidad sobre la que se actuó (Activos, Mantenimientos, Proveedores, etc.) |
| Ticket/ID Afectado | Código único del registro modificado |
| Descripción | Detalle textual de la operación realizada |

### 11.2 Filtrado

- Barra de búsqueda para filtrar por usuario, módulo o descripción.
- Ordenamiento por cualquier columna.
- Paginación inteligente (12 registros por página con navegación numérica).

---

## 12. Configuración de Empresa

**Ruta:** `/settings` | **Permiso requerido:** `settings`

Panel de configuración global del sistema reservado para administradores.

### 12.1 Información Fiscal

Configure el nombre comercial que aparecerá en la barra superior del sistema, razón social y número de identificación fiscal (RUC/NIT/RFC).

### 12.2 Conexión a Base de Datos

Permite configurar los parámetros de conexión a SQL Server:

| Campo | Ejemplo |
|---|---|
| Servidor / IP | `192.168.1.100` o `localhost\SQLEXPRESS` |
| Usuario | `sa` |
| Contraseña | `••••••••` |
| Base de Datos | `SCAF_DB` |

- **Probar Conexión:** Verifica que los datos son correctos antes de guardar.
- **Guardar Conexión:** Persiste la configuración. Requiere reiniciar el servicio backend.

### 12.3 Zona de Peligro — Puesta en Marcha

Botón **"Inicializar Software a 0"** que resetea completamente el sistema eliminando todos los datos de prueba. Solo accesible para el rol de Super Administrador.

> **⚠️ ADVERTENCIA:** Esta acción es irreversible. Borrará todos los activos, mantenimientos, proveedores y registros de auditoría. Solo se conservará la cuenta del Super Administrador.

---

## 13. Glosario de Términos

| Término | Definición |
|---|---|
| **Activo Fijo** | Bien tangible de la empresa con vida útil superior a un año (equipos, mobiliario, vehículos, maquinaria) |
| **Ticket / TKT** | Identificador único de una tarea de mantenimiento (ej: TKT-1001) |
| **Plan de Mantenimiento** | Protocolo predefinido con checklist de tareas aplicable a una categoría de activos |
| **Work Order** | Orden de trabajo generada a partir de un Plan de Mantenimiento para un activo y periodo específico |
| **Checklist** | Lista de verificación de sub-tareas dentro de un ticket de mantenimiento |
| **Fichero** | Catálogo jerárquico que alimenta los menús desplegables del sistema |
| **RBAC** | Control de Acceso Basado en Roles (Role-Based Access Control) |
| **Custodio** | Persona responsable del resguardo de un activo |
| **Sublínea** | Clasificación terciaria de un activo que vincula automáticamente con Planes de Mantenimiento |
| **JWT** | Token de autenticación cifrado que valida la sesión del usuario |
| **Factory Reset** | Reinicio completo del sistema a su estado inicial (sin datos) |
| **Semáforo** | Sistema visual de estados por colores (Rojo-Amarillo-Verde-Gris) |

---

**Documento elaborado para uso interno de la organización.**
**SCAF v1.0 — Sistema de Control de Activos Fijos © 2026**
