# 🎓 Proyecto de Título: Biblioteca Escolar CRA

&#x20;  &#x20;

Este proyecto forma parte de la titulación en Ingeniería en Informática. Es un sistema de gestión de biblioteca completo, desarrollado con el stack **MERN** (MongoDB, Express, React, Node.js), diseñado para administrar préstamos, reservas e inventario de libros y recursos del Centro de Recursos para el Aprendizaje (CRA).

---

## 📑 Índice

- [✨ Características y Funcionalidades](#-características-y-funcionalidades)
- [⚖️ Reglas de Negocio](#️-reglas-de-negocio)
- [📂 Estructura del Proyecto](#-estructura-del-proyecto)
- [🌐 Tecnologías Utilizadas](#-tecnologías-utilizadas)
- [🚀 Guía de Instalación y Ejecución](#-guía-de-instalación-y-ejecución)
  - [Configuración del Backend](#configuración-del-backend)
  - [Configuración del Frontend](#configuración-del-frontend)
- [🧪 Endpoints Principales de la API](#-endpoints-principales-de-la-api)
- [📜 Licencia](#-licencia)
- [👨‍💻 Autor](#-autor)

---

## ✨ Características y Funcionalidades

### 👤 Panel de Administrador

- **Dashboard Estadístico**: tarjetas en tiempo real con préstamos del día, reservas, ítems atrasados, usuarios sancionados e ítems que requieren atención.
- **Gestión de Usuarios (CRUD)**: creación, lectura, actualización y eliminación de usuarios con roles (admin, profesor, alumno).
- **Gestión de Catálogo (CRUD)**: administración de libros y recursos CRA, incluyendo instancias físicas (ejemplares) con estados individuales.
- **Gestión de Transacciones**: creación de préstamos, confirmación de reservas, renovaciones y flujo de devoluciones con registro de estado (disponible, deteriorado, extraviado).
- **Mantenimiento de Inventario**: sección para gestionar ítems deteriorados o extraviados, con opción de reintegrarlos o darlos de baja.
- **Reportes Avanzados**: generación de reportes filtrados por fecha, estado, usuario, curso o libro, con exportación a PDF.

### 👨‍🎓 Panel de Usuario (Alumno / Profesor)

- **Catálogo Personalizado**: vista del catálogo con recursos adicionales para profesores.
- **Sistema de Reservas**: reservas de ítems disponibles directamente desde el catálogo.
- **Mis Préstamos**: listado de préstamos activos y fechas de vencimiento.
- **Mis Reservas**: listado de reservas activas con opción de cancelación.

### 🔐 Seguridad y Rendimiento

- **Autenticación Segura**: JWT con roles de acceso.
- **Rate Limiting**: protección contra ataques de fuerza bruta y DoS.
- **Validación de Inputs**: sanitización y prevención de inyecciones NoSQL.

### 🌈 Experiencia de Usuario

- **Interfaz Moderna**: React + Tailwind CSS con diseño responsive.
- **Selector de Tema**: modo oscuro/claro con persistencia de preferencia.

---

## ⚖️ Reglas de Negocio

### Usuarios

- **Sanciones**: un usuario sancionado no puede solicitar nuevos préstamos ni reservas.

### Préstamos

- **Límites**:
  - Profesores: múltiples préstamos simultáneos.
  - Alumnos y otros roles: máximo 1 préstamo activo.
- **Condiciones**: no debe tener sanciones ni préstamos atrasados.
- **Vencimiento**:
  - Libros: 10 días hábiles.
  - Recursos CRA: mismo día a las 18:00.
- **Atrasos**: generan sanción equivalente a días de demora.

### Reservas

- **Límites**: mismas condiciones que préstamos.
- **Expiración**: 2 días hábiles si no se retiran.
- **Confirmación**: se formaliza como préstamo cuando un admin confirma el retiro.

---

## 📂 Estructura del Proyecto

El repositorio está organizado en dos carpetas principales: `backend` y `frontend`.

### Backend

| Carpeta / Archivo | Descripción                                   |
| ----------------- | --------------------------------------------- |
| `controllers/`    | Lógica de negocio de la API                   |
| `middleware/`     | Gestión de autenticación y roles de usuario   |
| `models/`         | Esquemas de datos con Mongoose                |
| `routes/`         | Definición de los endpoints REST              |
| `utils/`          | Funciones de utilidad (ej. cálculo de fechas) |
| `server.js`       | Punto de entrada del servidor Express         |
| `.env`            | Variables de entorno (no versionado)          |
| `package.json`    | Configuración de dependencias y scripts       |

### Frontend

| Carpeta / Archivo | Descripción                                            |
| ----------------- | ------------------------------------------------------ |
| `src/components/` | Componentes reutilizables (formularios, modales, etc.) |
| `src/context/`    | Manejo de estado global (Auth, Theme)                  |
| `src/hooks/`      | Hooks personalizados (ej. useAuth)                     |
| `src/layouts/`    | Plantillas de página (públicas, privadas)              |
| `src/pages/`      | Vistas principales de la aplicación                    |
| `src/services/`   | Configuración de Axios para la comunicación API        |
| `src/App.js`      | Componente raíz que orquesta las rutas y vistas        |
| `package.json`    | Configuración de dependencias y scripts                |

---

## 🌐 Tecnologías Utilizadas

- **Backend**:

  - Node.js >=14
  - Express v5.1.0
  - MongoDB (Mongoose v8.16.5)
  - JSON Web Token (jsonwebtoken v9.0.2)
  - bcryptjs v3.0.2
  - cors v2.8.5
  - dotenv v17.2.1
  - express-rate-limit v8.0.1

- **Frontend**:

  - React v19.1.0
  - React DOM v19.1.0
  - react-scripts v5.0.1
  - Axios v1.11.0
  - jsPDF v3.0.1
  - jsPDF-AutoTable v5.0.2
  - jwt-decode v4.0.0
  - Tailwind CSS v3.4.4
  - PostCSS v8.4.38
  - Autoprefixer v10.4.19
  - Heroicons

---

## 🚀 Guía de Instalación y Ejecución

### Configuración del Backend

1. Clona el repositorio:
   ```bash
   git clone https://github.com/Aldariz94/Proyect_Sophia.git
   cd Proyect_Sophia/backend
   ```
2. Instala dependencias:
   ```bash
   yarn install
   ```
3. Crea un archivo `.env` en `backend/` con:
   ```env
   PORT=5000
   MONGODB_URI=<tu_cadena_de_conexión>
   JWT_SECRET=<secreto_seguro>
   ```
4. Inicia el servidor:
   ```bash
   yarn start
   ```

### Configuración del Frontend

1. Abre otra terminal y navega a `frontend/`:
   ```bash
   cd ../frontend
   yarn install
   yarn start
   ```
2. Abre `http://localhost:3000`.

---

## 🧪 Endpoints Principales de la API

> **Requisito previo:** backend corriendo en `http://localhost:5000` y token de admin.

| Método | Ruta                       | Descripción                           | Rol         |
| ------ | -------------------------- | ------------------------------------- | ----------- |
| POST   | `/api/auth/login`          | Iniciar sesión y obtener token        | Público     |
| GET    | `/api/users/me`            | Obtener datos del usuario autenticado | Autenticado |
| POST   | `/api/users`               | Crear un usuario                      | Admin       |
| GET    | `/api/books`               | Listar libros                         | Público     |
| POST   | `/api/books`               | Añadir libro con ejemplares           | Admin       |
| POST   | `/api/loans`               | Crear préstamo                        | Admin       |
| POST   | `/api/reservations`        | Crear reserva                         | Autenticado |
| GET    | `/api/dashboard/stats`     | Obtener estadísticas del dashboard    | Admin       |
| GET    | `/api/inventory/attention` | Ítems que requieren mantenimiento     | Admin       |

---

## 🌱 Script de Seeding para Datos de Prueba

Este proyecto incluye un script de *seeding* (`backend/seed_transactions.js`) diseñado para poblar la base de datos con un historial de transacciones realista, ideal para demostraciones y pruebas.

⚠️ **Importante:** Cada vez que se ejecuta, este script **borra todos los préstamos, reservas y sanciones existentes** para crear un nuevo conjunto de datos de prueba desde cero.

### Funcionalidades del Script

El script simula la actividad de la biblioteca y genera automáticamente:

* Un historial de **préstamos ya devueltos**.
* **Usuarios Sancionados** (calculado a partir de un porcentaje de devoluciones con atraso).
* **Préstamos actualmente atrasados** para poblar la vista correspondiente.
* **Préstamos en curso** que aún no han vencido.
* Ítems en estado `deteriorado`, `extraviado` o `mantenimiento` para la página de **Mantenimiento de Inventario**.
* **Reservas activas** para diferentes usuarios.

### ¿Cómo Ejecutar el Script?

1.  **Prerrequisito:** Asegúrate de que tu base de datos ya contenga **usuarios, libros y recursos**. Puedes usar la funcionalidad de **Importación Masiva** para esto primero.
2.  Abre una terminal y navega a la carpeta del backend:
    ```bash
    cd backend
    ```
3.  Ejecuta el script con el siguiente comando:
    ```bash
    node seed_transactions.js
    ```
4.  Espera a que el script termine. Verás mensajes de progreso en la consola. Una vez que finalice, tu aplicación tendrá un historial de datos completo y listo para la demostración.

---

## 📜 Licencia

Distribuido bajo la Licencia MIT. Para más información, consulta la [MIT License](https://opensource.org/licenses/MIT).&#x20;

---

## 👨‍💻 Autor

**Daniel Carreño**\
Proyecto de Título 2025\
GitHub: [@Aldariz94](https://github.com/Aldariz94)

