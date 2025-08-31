
# 🎓 Proyecto de Título: Biblioteca Escolar CRA

Este proyecto forma parte de la titulación en Ingeniería en Informática. Es un sistema de gestión de biblioteca completo, desarrollado con el stack **MERN** (MongoDB, Express, React, Node.js), diseñado para administrar préstamos, reservas e inventario de libros y recursos del Centro de Recursos para el Aprendizaje (CRA).

> **Última actualización:** 2025-08-31

---

## 📑 Índice

- [✨ Características y Funcionalidades](#-características-y-funcionalidades)
- [⚖️ Reglas de Negocio](#️-reglas-de-negocio)
- [📂 Estructura del Proyecto](#-estructura-del-proyecto)
- [🌐 Tecnologías Utilizadas](#-tecnologías-utilizadas)
- [🚀 Guía Rápida (Dev con Yarn)](#-guía-rápida-dev-con-yarn)
- [🧪 Rutas de Pruebas en Postman](#-rutas-de-pruebas-en-postman)
- [🌱 Seed de Datos de Prueba](#-seed-de-datos-de-prueba)
- [👑 Crear Usuario Administrador](#-crear-usuario-administrador)
- [🧭 Configuración de Entornos](#-configuración-de-entornos)
- [🔐 Seguridad (JWT, Roles, Rate Limit, CORS)](#-seguridad-jwt-roles-rate-limit-cors)
- [🛠️ Detalles de API y Endpoints Útiles](#️-detalles-de-api-y-endpoints-útiles)
- [🚀 Despliegue en VPS (Clouding.io) + Nginx + PM2](#-despliegue-en-vps-cloudingio--nginx--pm2)
- [🤖 CI/CD con GitHub Actions](#-cicd-con-github-actions)
- [🧯 Troubleshooting](#-troubleshooting)
- [🧭 Roadmap y Buenas Prácticas](#-roadmap-y-buenas-prácticas)
- [📜 Licencia](#-licencia)
- [👨‍💻 Autor](#-autor)

---

## ✨ Características y Funcionalidades

### 👤 Panel de Administrador
- **Dashboard estadístico**: préstamos del día, reservas, atrasos, sanciones e ítems con atención.
- **Gestión de usuarios (CRUD)** con roles (`admin`, `profesor`, `alumno`, `personal`, `visitante`).
- **Gestión de catálogo (CRUD)** de **libros** y **recursos CRA**; manejo de **ejemplares/instancias** con estados por copia.
- **Transacciones**: creación de préstamos, confirmación de reservas, renovaciones y devoluciones con control de estados.
- **Inventario**: deteriorados/extraviados/mantenimiento; **dar de baja** con reglas para última copia.
- **Reportes**: filtros por fecha, estado, usuario/curso/libro; exportación (PDF/tabla).

### 👨‍🎓 Panel de Usuario (Alumno / Profesor)
- **Catálogo** con vista diferenciada (recursos para profesores).
- **Reservas**: desde el catálogo.
- **Mis préstamos** y **mis reservas**: vistas con acciones (cancelar, renovar si aplica).

### 🔐 Seguridad y Rendimiento
- **JWT** + roles, **rate limiting** en `/api`, validación de entradas y prevención de NoSQL injection.

### 🌈 UX
- **React + Tailwind** responsive, **tema oscuro/claro** persistente.

---

## ⚖️ Reglas de Negocio

> Resumen basado en controladores, modelos y `utils/validationUtils.js`.

**Estados y transiciones**
- **Préstamo** solo sobre ítem `disponible`. Al crear → `Loan.estado = 'enCurso'` y la copia pasa a `prestado`.
- **Devolución**: setea `fechaDevolucion` y `estado = 'devuelto'`; la copia vuelve a `disponible`.
- **Atraso**: `enCurso` con `fechaVencimiento < hoy` se considera atrasado (cálculo en listados).
- **Reserva**: sobre ítem `disponible`; crea `pendiente`, setea `expiraEn = addBusinessDays(hoy, 2)` y copia `reservado`. Confirmar → préstamo; cancelar/expirar → copia `disponible`.

**Inventario**
- Copias con `deteriorado/extraviado/mantenimiento` aparecen en “atención inventario”.
- Dar de baja la **última copia** puede eliminar el **Book/ResourceCRA** base (según conteo restante).

**Sanciones**
- `User.sancionHasta` bloquea **reservas/préstamos** hasta esa fecha. Se puede actualizar por atraso o manualmente (admin).

**Límites/validaciones**
- No se permite tener **más de una copia** del **mismo base** (Book/ResourceCRA) simultáneamente entre reservas y préstamos.
- **Alumnos**: préstamos de **libros** (`Exemplar`). **Profesores/personal**: libros y recursos (`ResourceInstance`).
- Centraliza cupos/limitantes en `validationUtils.checkBorrowingLimits` (e.g., máximos por rol).

---

## 📂 Estructura del Proyecto

```
Proyecto_Titulo/
├─ .github/
│  └─ workflows/
│     ├─ deploy-backend.yml
│     └─ deploy-frontend.yml
├─ backend/
│  ├─ .yarn/
│  │  └─ install-state.gz
│  ├─ controllers/
│  │  ├─ bookController.js
│  │  ├─ dashboardController.js
│  │  ├─ importController.js
│  │  ├─ inventoryController.js
│  │  ├─ loanController.js
│  │  ├─ publicController.js
│  │  ├─ reportController.js
│  │  ├─ reservationController.js
│  │  ├─ resourceController.js
│  │  ├─ searchController.js
│  │  └─ userController.js
│  ├─ middleware/
│  │  ├─ authMiddleware.js
│  │  ├─ roleMiddleware.js
│  │  └─ uploadMiddleware.js
│  ├─ models/
│  │  ├─ Book.js
│  │  ├─ Exemplar.js
│  │  ├─ Loan.js
│  │  ├─ Reservation.js
│  │  ├─ ResourceCRA.js
│  │  ├─ ResourceInstance.js
│  │  └─ User.js
│  ├─ routes/
│  │  ├─ authRoutes.js
│  │  ├─ bookRoutes.js
│  │  ├─ dashboardRoutes.js
│  │  ├─ importRoutes.js
│  │  ├─ inventoryRoutes.js
│  │  ├─ loanRoutes.js
│  │  ├─ publicRoutes.js
│  │  ├─ reportRoutes.js
│  │  ├─ reservationRoutes.js
│  │  ├─ resourceRoutes.js
│  │  ├─ searchRoutes.js
│  │  └─ userRoutes.js
│  ├─ uploads/
│  ├─ utils/
│  │  ├─ dateUtils.js
│  │  └─ validationUtils.js
│  ├─ .editorconfig
│  ├─ .env
│  ├─ .gitattributes
│  ├─ .yarnrc.yml
│  ├─ DEPLOY_TRIGGER.txt
│  ├─ package.json
│  ├─ seed_transactions.js
│  ├─ server.js
│  └─ yarn.lock
├─ frontend/
│  ├─ public/
│  │  ├─ images/
│  │  │  └─ logo_colegio.png
│  │  ├─ templates/
│  │  │  ├─ plantilla_libros.xlsx
│  │  │  ├─ plantilla_recursos.xlsx
│  │  │  └─ plantilla_usuarios.xlsx
│  │  ├─ favicon.ico
│  │  ├─ index.html
│  │  ├─ logo192.png
│  │  ├─ logo512.png
│  │  ├─ manifest.json
│  │  └─ robots.txt
│  ├─ src/
│  │  ├─ components/
│  │  │  ├─ BookDetails.js
│  │  │  ├─ BookForm.js
│  │  │  ├─ CreateLoanForm.js
│  │  │  ├─ Footer.js
│  │  │  ├─ Header.js
│  │  │  ├─ ImportComponent.js
│  │  │  ├─ index.js
│  │  │  ├─ MobileSidebar.js
│  │  │  ├─ Modal.js
│  │  │  ├─ MyLoansComponent.js
│  │  │  ├─ MyReservationsComponent.js
│  │  │  ├─ Notification.js
│  │  │  ├─ RenewLoanForm.js
│  │  │  ├─ ResourceDetails.js
│  │  │  ├─ ResourceForm.js
│  │  │  ├─ ReturnLoanForm.js
│  │  │  ├─ Sidebar.js
│  │  │  ├─ StatusBadge.js
│  │  │  ├─ UserDetails.js
│  │  │  ├─ UserForm.js
│  │  │  └─ UserSidebar.js
│  │  ├─ context/
│  │  │  ├─ AuthContext.js
│  │  │  ├─ index.js
│  │  │  └─ ThemeContext.js
│  │  ├─ hooks/
│  │  │  ├─ index.js
│  │  │  ├─ useAuth.js
│  │  │  └─ useNotification.js
│  │  ├─ layouts/
│  │  │  ├─ AuthenticatedLayout.js
│  │  │  ├─ DashboardLayout.js
│  │  │  ├─ index.js
│  │  │  ├─ PublicLayout.js
│  │  │  └─ UserLayout.js
│  │  ├─ pages/
│  │  │  ├─ BookManagementPage.js
│  │  │  ├─ CatalogPage.js
│  │  │  ├─ DashboardPage.js
│  │  │  ├─ index.js
│  │  │  ├─ InventoryManagementPage.js
│  │  │  ├─ LoanManagementPage.js
│  │  │  ├─ LoginPage.js
│  │  │  ├─ MyLoansPage.js
│  │  │  ├─ MyReservationsPage.js
│  │  │  ├─ OverdueLoansPage.js
│  │  │  ├─ ReportsPage.js
│  │  │  ├─ ReservationsPage.js
│  │  │  ├─ ResourceManagementPage.js
│  │  │  ├─ SanctionsPage.js
│  │  │  └─ UserManagementPage.js
│  │  ├─ services/
│  │  │  └─ api.js
│  │  ├─ styles/
│  │  │  └─ commonStyles.js
│  │  ├─ App.js
│  │  ├─ index.css
│  │  ├─ index.js
│  │  └─ reportWebVitals.js
│  ├─ .env.development
│  ├─ .env.production
│  ├─ DEPLOY_TRIGGER
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ postcss.config.js
│  ├─ tailwind.config.js
│  └─ yarn.lock
├─ .gitignore
└─ README.md

```

---

## 🌐 Tecnologías Utilizadas

**Backend**: Node.js 20, Express 5, Mongoose 8, JWT, bcryptjs, cors, dotenv, express-rate-limit, **multer** (uploads), **xlsx** (import).  
**Frontend**: React (CRA), Axios, TailwindCSS, PostCSS, Autoprefixer, Heroicons, jsPDF + autotable.  
> Ver versiones exactas en `backend/package.json` y `frontend/package.json`.

---

## 🚀 Guía Rápida (Dev con Yarn)

> Estándar: **Yarn 1.x (classic)**. Aunque `backend/package.json` tenga `packageManager: yarn@4`, usamos **Yarn classic** con Corepack para todo.

```bash
# 1) Habilitar Yarn classic
corepack enable
corepack prepare yarn@1.22.19 --activate

# 2) Backend
cd backend
yarn install
yarn start     # http://localhost:5000

# 3) Frontend (otra terminal)
cd ../frontend
yarn install
yarn start     # http://localhost:3000
```

**Healthcheck**: `GET http://localhost:5000/api/health`

---

## 🧪 Rutas de Pruebas en Postman

> Colección y environments ya listos para importar:

- **Collection**: [Postman_Proyecto_Titulo_collection.json](sandbox:/mnt/data/Postman_Proyecto_Titulo_collection.json)  
- **Environment (local)**: [Postman_Proyecto_Titulo_environment.json](sandbox:/mnt/data/Postman_Proyecto_Titulo_environment.json)  
- **Environment (producción)**: [Postman_Proyecto_Titulo_environment_prod.json](sandbox:/mnt/data/Postman_Proyecto_Titulo_environment_prod.json)

### Flujos sugeridos (resumen)
0. **Health** → `GET /api/health`  
1. **Login (admin)** → `POST /api/auth/login` → guarda `{{TOKEN}}`  
2. **Usuarios** → crear/listar/me/quitar sanción/eliminar  
3. **Libros & Ejemplares** → crear libro → añadir/listar ejemplares → actualizar/eliminar  
4. **Recursos & Instancias** → crear → añadir/listar → actualizar/eliminar  
5. **Búsquedas** → users/items/copia disponible/all-books/students  
6. **Reserva → Confirmar → Préstamo → Renovar → Devolver**  
7. **Catálogo** (público/usuario)  
8. **Inventario** (atención, dar de baja)  
9. **Reportes** (filtros y export)  
10. **Importación XLSX** (form‑data `file` con plantillas)

> En la sección “Rutas de pruebas en Postman (flujos y tests)” del README anterior dejamos **bodies y tests** listos para copiar/pegar. En la colección puedes reemplazar IDs por variables (`{{BOOK_ID}}`, etc.).

---

## 🌱 Seed de Datos de Prueba

Script: `backend/seed_transactions.js` — genera préstamos devueltos/atrasados/en curso, reservas, copias en mantenimiento y sanciones realistas.

**Precondición**: ya deben existir **usuarios** (alumno/prof/personal) y **ítems disponibles** (Exemplar/ResourceInstance). Puedes cargarlos con **importación XLSX**.

**Ejecutar**:
```bash
cd backend
node seed_transactions.js
```
> ⚠️ El seed limpia **préstamos, reservas y sanciones** antes de generar datos.

---

## 👑 Crear Usuario Administrador

Como `POST /api/users` exige admin, el **primer admin** se crea por script.

**Login con Postman**
```http
POST {{BASE_URL}}/api/auth/login
{ "correo": "admin@colegio.cl", "password": "TuPassFuerte!" }
# Guarda token en {{TOKEN}} y úsalo en header x-auth-token
```

---

## 🧭 Configuración de Entornos

**Backend (`backend/.env`)**
```ini
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/proyecto_titulo_dev
JWT_SECRET=un-secreto-largo-y-aleatorio
RATE_LIMIT_MAX=100
APP_ORIGIN=http://localhost:3000
```

**Frontend (`frontend/.env.development` / `.env.production`)**
```ini
REACT_APP_API_URL=http://localhost:5000/api
# o en prod: https://tu-dominio.cl/api
```

El **axios** del frontend agrega `x-auth-token` automáticamente si existe en `localStorage`.

---

## 🔐 Seguridad (JWT, Roles, Rate Limit, CORS)

- **JWT** en `x-auth-token` (middleware `authMiddleware.js`).
- **Roles** en `roleMiddleware.js` (`admin`, `profesor`, `alumno`, `personal`, `visitante`).
- **Rate limiting**: 15 min · `RATE_LIMIT_MAX` en `/api`.
- **CORS** recomendado (ajusta `APP_ORIGIN`):
```js
const allowed = [process.env.APP_ORIGIN || 'https://tu-dominio.cl', 'http://localhost:3000'];
app.use(cors({
  origin: (origin, cb) => !origin || allowed.includes(origin) ? cb(null, true) : cb(new Error('Not allowed by CORS')),
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','x-auth-token'],
  maxAge: 86400
}));
```

---

## 🛠️ Detalles de API y Endpoints Útiles

> **Base**: `{{BASE_URL}}` = `http://localhost:5000` (dev) o `https://tu-dominio.cl` (prod).

**Usuarios (admin)**
- `POST /api/users` crear
- `GET /api/users` listar
- `GET /api/users/me` perfil
- `PUT /api/users/:id/remove-sanction`
- `DELETE /api/users/:id` (valida que no tenga préstamos activos/atrasados)

**Libros / Ejemplares**
- `POST /api/books` crear libro
- `POST /api/books/:id/exemplars` añadir copias
- `GET /api/books/:id/exemplars` listar
- `PUT /api/books/exemplars/:exemplarId` actualizar estado
- `DELETE /api/books/exemplars/:exemplarId` eliminar copia

**Recursos CRA / Instancias**
- `POST /api/resources` crear
- `POST /api/resources/:id/instances` añadir
- `GET /api/resources/:id/instances` listar
- `PUT /api/resources/instances/:instanceId` actualizar
- `DELETE /api/resources/instances/:instanceId` eliminar

**Préstamos**
- `POST /api/loans` crear (admin)
- `POST /api/loans/return/:loanId` devolver
- `PUT /api/loans/:loanId/renew` renovar
- `GET /api/loans/my-loans` mis préstamos
- `GET /api/loans/overdue` atrasados

**Reservas**
- `POST /api/reservations` crear (auth)
- `POST /api/reservations/:id/confirm` confirmar (admin)
- `POST /api/reservations/:id/cancel` cancelar (admin)
- `GET /api/reservations/my-reservations` mis reservas
- `DELETE /api/reservations/:id` cancelar mi reserva

**Catálogo & Búsqueda**
- `GET /api/public/catalog?search=&page=1&limit=16`
- `GET /api/public/user-catalog/books`
- `GET /api/public/user-catalog/resources`
- `GET /api/search/users?q=ana`
- `GET /api/search/items?q=matemática`
- `GET /api/search/find-available-copy/Exemplar/:bookId` (o `ResourceCRA/:resourceId`)
- `GET /api/search/all-books`
- `GET /api/search/students?q=perez`

**Dashboard / Inventario / Reportes**
- `GET /api/dashboard/stats`
- `GET /api/inventory/attention`
- `DELETE /api/inventory/item/:itemModel/:itemId`
- `GET /api/reports/loans?startDate=...&endDate=...&status=...&course=...&export=true`

**Importación (XLSX)**
- `POST /api/import/users` (form‑data `file: plantilla_usuarios.xlsx`)
- `POST /api/import/books` (form‑data `file: plantilla_libros.xlsx`)
- `POST /api/import/resources` (form‑data `file: plantilla_recursos.xlsx`)
> Plantillas en `frontend/public/templates/`.

---

## 🚀 Despliegue en VPS (Clouding.io) + Nginx + PM2

**Rutas en VPS**
- Frontend (estático): `/var/www/Proyecto_Titulo`
- Backend (PM2): `/opt/Proyecto_Titulo/backend` → proceso `proyecto-titulo-backend`

**Nginx** (ejemplo)
```nginx
server {
  listen 80;
  server_name tu-dominio.cl www.tu-dominio.cl;
  root /var/www/Proyecto_Titulo;
  index index.html;
  location / { try_files $uri /index.html; }
  location /api/ {
    proxy_pass http://127.0.0.1:5000/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
  location ~* \.(?:css|js|jpg|jpeg|gif|png|svg|ico|woff2?|ttf)$ { expires 7d; access_log off; }
}
```

**PM2*
```bash
cd /opt/Proyecto_Titulo/backend
pm2 start ecosystem.config.js
pm2 save && pm2 startup
```

---

## 🤖 CI/CD con GitHub Actions

**Secrets requeridos**: `SSH_HOST`, `SSH_USER`, `SSH_KEY`, `BACKEND_MONGODB_URI`, `BACKEND_JWT_SECRET`, `BACKEND_RATE_LIMIT_MAX`.

**Frontend**: build con Yarn + rsync al VPS + `nginx -t && systemctl reload nginx`.  
**Backend**: `git fetch/reset` en VPS + `yarn install` + `pm2 reload` + healthcheck.

> Los `workflows` de ejemplo se llaman **“Deploy Frontend to VPS”** y **“Deploy Backend to VPS”**.

---

## 🧯 Troubleshooting

- **CORS**: “Not allowed by CORS” → revisa `APP_ORIGIN` (sin `/` final). Añade `http://localhost:3000` en dev.
- **401**: token ausente/expirado → re‑login; header `x-auth-token`.
- **Mongo**: revisa `MONGODB_URI`, whitelist (Atlas), credenciales/puerto.
- **PM2**: `pm2 logs proyecto-titulo-backend --lines 200` para ver errores de arranque.
- **Uploads XLSX**: valida mimetypes/size en `uploadMiddleware` y usa plantillas.
- **Import**: nombres de columnas/hojas coincidan con plantillas; evita caracteres BOM.
- **Yarn**: si `packageManager` marca `yarn@4`, ignóralo y fuerza Yarn classic con Corepack.

---

## 🧭 Roadmap de Mejoras Futuras (Biblioteca → Aula Virtual)

- Lista de espera (waitlist) por título/base
Cuando no haya ejemplares/instancias disponibles, permitir unirse a una cola con posición. Al liberarse stock, se crea una reserva automática para la persona en primer lugar con expiración corta.
Impl.: modelo WaitlistEntry (baseModel/baseId, usuario, posición, estado, expiración), disparadores en devolución/alta de ejemplar, notificación in-app.
Criterio: el 100% de devoluciones/altas ofrecen ítems automáticamente al siguiente en la cola.

- Jobs programados internos
Cron para: expirar reservas, avanzar waitlist, marcar atrasos, recordatorios de vencimiento (in-app).
Impl.: node-cron o BullMQ (si usas Redis).
Criterio: reservas vencidas y atrasos se reflejan antes de las 08:00 del día siguiente.

- Políticas de préstamo configurables (por rol y tipo)
Días hábiles por tipo (libro/recurso), cupos por rol, simultaneidad por base, ventana de renovación.
Impl.: colección Policies, cache en memoria con invalidación; validationUtils lee dinámicamente.
Criterio: cambios en Policies aplican sin reiniciar servidor.

- Escaneo de códigos (browser)
Lectura de ISBN/QR/barcode desde la cámara del navegador para alta rápida y check-in/out.
Impl.: getUserMedia + lib de decodificación (JS puro).
Criterio: flujo de préstamo/devolución vía escaneo en < 10 s.

- Biblioteca digital (préstamo de PDFs/ePub)
Subida de archivos por título con licencia “n concurrente” (por cupos). Visualización en visor integrado y marca de agua dinámica.
Impl.: almacenamiento de ficheros, URLs firmadas, control de concurrencia por licencia, registro de evento de lectura.
Criterio: bloqueo de acceso cuando se exceden los cupos y expiración automática del préstamo digital.

- Gestión de cursos y secciones
Estructura de cursos, asignaturas, secciones y matrículas para vincular préstamos/recursos y reportes por curso.
Impl.: modelos Curso, Seccion, Matricula; vistas y filtros en reportes.
Criterio: todos los reportes pueden filtrarse por curso/sección.

- Repositorio de recursos didácticos
Carpeta por asignatura/unidad/semana, con roles de lectura/escritura para docentes y lectura para estudiantes.
Impl.: jerarquía en DB + tags; control de permisos por rol/curso.
Criterio: búsqueda por palabra clave, asignatura y tag < 300 ms p95.

- Auditoría y trazabilidad
Historial por entidad (préstamos, reservas, estados de ejemplar, políticas).
Impl.: AuditLog con before/after y actor.
Criterio: cada cambio crítico deja un rastro consultable.

- Aula Virtual (MVP interno)
Tareas y entregas por curso/sección con fechas y adjuntos.
Rúbricas y calificaciones básicas exportables.
Mensajería/Foro por curso con moderación.
Asistencia y registro de participación.
Impl.: modelos Tarea, Entrega, Rúbrica, Calificación, Mensaje, Asistencia. Vistas por rol (docente/estudiante).
Criterio: cursos operan de forma autónoma sin herramientas externas.

- Cierre anual y rollover
Archivado de transacciones, reseteo de sanciones, promoción de estudiantes a nuevo curso, preservando históricos.
Impl.: scripts idempotentes con respaldo; reportes “año anterior”.
Criterio: proceso repetible en < 1 h (base mediana) sin inconsistencias.

---

## 📜 Licencia

📜 Licencia

Código (backend & frontend): PolyForm Noncommercial 1.0.0 — [texto completo](https://polyformproject.org/licenses/noncommercial/1.0.0/)

Documentación y assets (README, guías, plantillas, imágenes): Creative Commons BY-NC-SA 4.0 — [texto completo](https://creativecommons.org/licenses/by-nc-sa/4.0/)

Resumen rápido
Permitido (no comercial): uso académico/estudiantil, modificación y redistribución no comercial con atribución.
Prohibido: venta, uso con fines comerciales o como servicio de pago, retirar avisos de copyright/licencia.
Obligatorio: mantener avisos y licencias; en docs/assets, compartir derivados con la misma licencia y con atribución.

NOTICE sugerido
```bash
© 2025 Daniel Carreño. Código licenciado bajo PolyForm Noncommercial 1.0.0.
Documentación y assets bajo CC BY-NC-SA 4.0.
```

---

## 👨‍💻 Autor

**Daniel Carreño** — Proyecto de Título 2025  
GitHub: [@Aldariz94](https://github.com/Aldariz94)
