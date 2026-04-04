# 🏡 La Abuela Beba — Sistema de Gestión de Turismo Regenerativo

> Plataforma web para la gestión integral de un hostel autogestivo y cultural en Chapadmalal, Buenos Aires.  
> Combina una landing page pública, sistema de reservas con selección visual de camas, chatbot informativo, panel de administración y portal para socios fundadores.

---

## 📐 Arquitectura General

```
┌──────────────────────────────────────────────────────────┐
│                    USUARIO / NAVEGADOR                    │
│                                                          │
│  localhost:5173 (dev)  ←→  localhost:8080 (API + prod)   │
└──────────────┬────────────────────────┬──────────────────┘
               │                        │
      ┌────────▼────────┐      ┌───────▼────────┐
      │    FRONTEND     │      │    BACKEND      │
      │   React + Vite  │      │    Go (Chi)     │
      │   TypeScript    │      │    REST API     │
      │   TailwindCSS   │      │    JWT Auth     │
      └────────┬────────┘      └───────┬────────┘
               │                        │
               │              ┌────────▼────────┐
               │              │   PostgreSQL 15  │
               │              │   (Docker o      │
               │              │    local)        │
               └──────────────┴─────────────────┘
```

---

## 🛠️ Stack Tecnológico

### Frontend
| Tecnología | Versión | Uso |
|---|---|---|
| **React** | 18.2 | Framework UI |
| **TypeScript** | 5.3 | Tipado estático |
| **Vite** | 5.1 | Bundler + dev server (HMR) |
| **TailwindCSS** | 3.4 | Estilos utilitarios |
| **React Router DOM** | 7.13 | Navegación SPA |
| **React DatePicker** | 9.1 | Selección de fechas en reservas |
| **Lucide React** | 0.344 | Iconografía SVG |

### Backend
| Tecnología | Versión | Uso |
|---|---|---|
| **Go** | 1.25 | Lenguaje del servidor |
| **Chi** | 5.2 | Router HTTP (REST API) |
| **Chi CORS** | 1.2 | Manejo de CORS |
| **lib/pq** | 1.11 | Driver PostgreSQL |
| **golang-jwt** | 5.3 | Autenticación JWT |
| **google/uuid** | 1.6 | Generación de UUIDs |
| **bcrypt** | (crypto) | Hash de contraseñas |

### Base de Datos
| Tecnología | Versión | Uso |
|---|---|---|
| **PostgreSQL** | 15 Alpine | Base de datos relacional |
| **Docker Compose** | 3.8 | Orquestación de contenedores |

---

## 📁 Estructura del Proyecto

```
La Beba/
├── frontend/                    # Aplicación React (SPA)
│   ├── src/
│   │   ├── components/
│   │   │   ├── LandingPage.tsx       # Página principal pública
│   │   │   ├── BookingModal.tsx       # Flujo de reserva (5 pasos)
│   │   │   ├── BedMap.tsx             # Croquis visual de camas
│   │   │   ├── ChatBot.tsx            # Chatbot "Beba" con FAQ
│   │   │   ├── AdminDashboard.tsx     # Panel de administración
│   │   │   ├── AdminBedManager.tsx    # Gestión de camas (admin)
│   │   │   ├── MemberProfile.tsx      # Portal de socios fundadores
│   │   │   ├── LoginPage.tsx          # Login con JWT
│   │   │   ├── RegisterPage.tsx       # Registro + verificación email
│   │   │   ├── TokenPage.tsx          # Sistema de tokens/membresía
│   │   │   ├── MediaSlider.tsx        # Slider de imágenes
│   │   │   └── BookingWidget.tsx      # Widget rápido de reserva
│   │   ├── App.tsx                    # Rutas principales
│   │   └── index.css                  # Estilos globales
│   ├── vite.config.ts                 # Configuración Vite + proxy
│   ├── tailwind.config.js             # Configuración Tailwind
│   └── package.json
│
├── backend/                     # API REST en Go
│   ├── cmd/
│   │   ├── main.go                    # Punto de entrada del servidor
│   │   ├── force_admin/               # Script: crear/resetear admin
│   │   ├── create_test_user/          # Script: crear usuario de prueba
│   │   ├── list_users/                # Script: listar usuarios
│   │   ├── inspect_db/                # Script: inspeccionar DB
│   │   └── ...                        # Otros scripts utilitarios
│   ├── internal/
│   │   ├── api/
│   │   │   ├── auth.go                # Login, Register, JWT
│   │   │   ├── handlers.go            # Handlers principales
│   │   │   └── beds.go                # Handlers de camas
│   │   ├── models/
│   │   │   └── models.go              # Structs (User, Bed, etc.)
│   │   ├── repository/
│   │   │   └── repository.go          # Queries SQL + migraciones
│   │   ├── logic/                     # Lógica de negocio (hash, etc.)
│   │   ├── email/                     # Envío de emails
│   │   └── csv/                       # Importación de CSV
│   ├── database/
│   │   └── schema.sql                 # Schema inicial
│   └── go.mod
│
├── database/                    # Scripts SQL adicionales
├── img/                         # Assets (logos, fotos)
├── docker-compose.yml           # PostgreSQL + App containerizada
├── Dockerfile                   # Build del backend
├── iniciar_sistema.bat          # Script de inicio Windows
└── .env                         # Variables de entorno
```

---

## 🗄️ Base de Datos — Tablas Principales

| Tabla | Descripción |
|---|---|
| `users` | Usuarios registrados (socios, admins) |
| `tokens` | Tokens de membresía (30 exclusivos) |
| `reservations` | Reservas (modelo legacy) |
| `solicitudes_reserva` | Solicitudes de reserva públicas (flujo actual) |
| `beds` | 9 camas (8 compartidas + 1 privada) |
| `bed_blocks` | Bloqueos de camas por fecha (reserva o admin) |
| `impact_logs` | Índice de impacto regenerativo |
| `galerias` | Fotos de la galería |
| `huespedes_historicos` | Datos importados de CSV (2023-2026) |

---

## 🔌 API Endpoints

### Públicos
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/register` | Registro de usuario |
| POST | `/api/verify` | Verificación de email (OTP) |
| POST | `/api/login` | Login → JWT |
| GET | `/api/tokens/stats` | Estadísticas de tokens |
| POST | `/api/solicitudes` | Crear solicitud de reserva |
| GET | `/api/beds` | Listar camas |
| GET | `/api/beds/availability` | Disponibilidad por fechas |
| GET | `/api/gallery` | Galería de fotos |

### Admin (requiere rol ADMIN)
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/admin/stats` | Estadísticas del panel |
| GET | `/api/admin/users` | Listar usuarios |
| POST | `/api/admin/users/:id/approve` | Aprobar usuario |
| PUT | `/api/admin/users/:id/role` | Cambiar rol |
| GET | `/api/admin/solicitudes` | Ver solicitudes de reserva |
| PUT | `/api/admin/solicitudes/:id` | Confirmar/Rechazar reserva |
| POST | `/api/admin/beds/:id/block` | Bloquear cama (por fecha) |
| DELETE | `/api/admin/beds/:id/block` | Desbloquear cama |
| GET | `/api/admin/beds/blocks` | Ver bloqueos de camas |
| POST | `/api/admin/huespedes/import` | Importar CSV histórico |

---

## 🚀 Cómo Levantar el Sistema

### Requisitos
- **Node.js** >= 18
- **Go** >= 1.21
- **PostgreSQL** 15 (local o Docker)

### Opción 1: Docker (recomendado)
```bash
docker-compose up -d
# Backend en :8080 | PostgreSQL en :5432
```

### Opción 2: Manual (desarrollo)
```bash
# Terminal 1 — PostgreSQL (si no usás Docker)
# Asegurate de tener PostgreSQL corriendo con DB "labeba"

# Terminal 2 — Backend
cd backend
go run ./cmd/main.go
# Server en http://localhost:8080

# Terminal 3 — Frontend (dev con HMR)
cd frontend
npm install
npm run dev
# App en http://localhost:5173
```

### Script Windows
```
iniciar_sistema.bat    # Levanta todo automáticamente
```

---

## 🔐 Credenciales de Desarrollo

| Rol | Email | Password |
|---|---|---|
| Admin | `marcelo@lanubecomputacion.com` | `SuperAdmin2026!` |
| Huésped | `test@labeba.com` | `test1234` |

---

## 🏗️ Funcionalidades Principales

### 🌐 Landing Page
- Diseño dark premium con gradientes esmeralda
- Secciones: Hero, Habitaciones, Eco-Punto, Footer
- Botón "Reservar Ahora" → BookingModal

### 🛏️ Sistema de Reservas
- Flujo de 5 pasos: Habitación → Fechas + Cama + Datos → Reglamento → Confirmación → Pago
- **Croquis visual de camas** (4 cuchetas × arriba/abajo) para cabaña compartida
- Descuentos automáticos por estadía prolongada
- Detección de huéspedes recurrentes por DNI
- Pago por transferencia bancaria o Mercado Pago

### 🤖 Chatbot "Beba"
- Bot flotante con FAQ predefinido
- 10 categorías: Check-in, Recepción, Visitas, Cocina, Eventos, Surf, etc.
- Fallback a WhatsApp directo con Mailén

### 📊 Panel de Administración
- Resumen con estadísticas
- Gestión de socios (aprobar, cambiar rol)
- Solicitudes de reserva (confirmar/rechazar → bloquea camas automáticamente)
- Gestión visual de camas (bloquear/desbloquear por día)
- Galerías de fotos
- Importación de datos CSV

### 👤 Portal de Socios
- Manifiesto y pilares de acción
- Token de socio fundador
- Índice de impacto regenerativo
- Documentos descargables
- Galería de avances

---

## 📍 Datos del Establecimiento

- **Nombre:** La Abuela Beba
- **Ubicación:** Calle 0 e/ 815 y 817, Chapadmalal, Buenos Aires
- **WhatsApp:** +54 11 3482-6691 (Mailén)
- **Concepto:** Espacio autogestivo y cultural, turismo regenerativo
