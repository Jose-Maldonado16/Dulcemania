# 🍦 DulceMania — Sistema de Pedidos en Línea

**Proyecto:** Sistema web de pedidos en línea para la Cafetería y Heladería Sucre.  
**Materia:** SIS324 — Ingeniería de Software  
**Universidad:** Universidad Real y Pontificia de San Francisco Xavier de Chuquisaca  
**Estudiantes:** José Luis Maldonado Olmos · Milenka Antequera Peñafiel  
**Grupo:** 16  
**Docente:** Ing. Duran Quiroga Ramiro  
**Año:** 2026

---

## 📋 Descripción

DulceMania es una plataforma web ligera que permite a los **clientes**:
- Ver el menú de productos en tiempo real.
- Personalizar pedidos (sin azúcar, ingredientes extra, mensajes).
- Programar la hora de recojo.
- Pagar con QR, tarjeta o efectivo.
- Hacer seguimiento del estado del pedido.

Y al **personal interno**:
- Gestionar el catálogo e inventario.
- Administrar usuarios.
- Visualizar y priorizar pedidos.
- Generar reportes básicos.

---

## 🎯 Sprint 1 — Subsistema de Seguridad

**Objetivo:** Implementar el prototipo inicial del subsistema de Seguridad, incluyendo:
- Login de usuario.
- CRUD completo de usuarios.
- Registro público de clientes.

### ✅ Funcionalidades entregadas

| Funcionalidad | Estado |
|---------------|--------|
| Login con contraseña encriptada (scrypt + salt) | ✅ |
| Token de sesión generado con crypto | ✅ |
| Logout que invalida el token | ✅ |
| CRUD de usuarios (crear, listar, editar, eliminar) | ✅ |
| Registro público de clientes | ✅ |
| Protección por rol (solo ADMIN gestiona usuarios) | ✅ |
| Búsqueda y filtro por rol | ✅ |
| Validaciones de contraseña (mínimo 6 caracteres) | ✅ |
| Validaciones de email (formato correcto) | ✅ |
| Validaciones de nombre (mínimo 3 caracteres) | ✅ |
| No permite auto-desactivarse ni auto-cambiar de rol | ✅ |
| Sistema de notificaciones toast | ✅ |

---

## 🛠️ Tecnologías utilizadas

- **Backend:** Node.js puro (sin frameworks, sin dependencias externas).
- **Frontend:** HTML5 + CSS3 + JavaScript (Vanilla JS).
- **Base de datos:** archivo `db.json` (lectura/escritura con `fs`).
- **Seguridad:** `crypto` nativo de Node (scrypt para hashing, randomBytes para tokens).
- **Tipografías:** Poppins + Pacifico (Google Fonts).

> **Sin dependencias externas. Sin `node_modules`. Sin build. Peso total: < 200 KB.**

---

## 📁 Estructura del proyecto

```
dulcemania/
├── server.js              # Backend completo (Node puro)
├── db.json                # "Base de datos" en JSON
├── README.md              # Este archivo
└── public/
    ├── index.html         # Login
    ├── registro.html      # Registro de clientes
    ├── admin.html         # Panel de administración
    ├── usuarios.html      # CRUD de usuarios
    ├── styles.css         # Estilos (modo oscuro premium)
    └── app.js             # Lógica del frontend
```

---

## 🚀 Cómo ejecutar

### Requisitos

- Node.js v18 o superior.
- Un navegador moderno (Chrome, Firefox, Edge).

### Pasos

1. **Clonar o descargar el proyecto:**
   ```bash
   cd dulcemania
   ```

2. **Iniciar el servidor:**
   ```bash
   node server.js
   ```

3. **Abrir en el navegador:**
   ```
   http://localhost:4000
   ```

### Credenciales de prueba (ADMIN)

- **Email:** `admin@dulcemania.com`
- **Password:** `admin123`

### Registrar un cliente

1. Ir a `http://localhost:4000/registro.html`
2. Crear una cuenta nueva.

---

## 🔌 API — Endpoints del subsistema Seguridad

**Base URL:** `http://localhost:4000/api`

### Autenticación

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/auth/login` | Iniciar sesión | ❌ Público |
| POST | `/auth/registro` | Registrar cliente nuevo | ❌ Público |
| GET | `/auth/perfil` | Ver perfil del usuario logueado | ✅ Token |
| POST | `/auth/logout` | Cerrar sesión | ✅ Token |

### Usuarios (CRUD)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/usuarios` | Listar todos los usuarios | 🔒 ADMIN |
| GET | `/usuarios/:id` | Ver un usuario específico | 🔒 ADMIN |
| POST | `/usuarios` | Crear usuario | 🔒 ADMIN |
| PUT | `/usuarios/:id` | Actualizar usuario | 🔒 ADMIN |
| DELETE | `/usuarios/:id` | Eliminar usuario | 🔒 ADMIN |

### Ejemplo de request

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@dulcemania.com","password":"admin123"}'
```

### Ejemplo de response

```json
{
  "token": "a1b2c3d4e5f6...",
  "usuario": {
    "id": 1,
    "nombre": "Administrador",
    "email": "admin@dulcemania.com",
    "rol": "ADMIN"
  }
}
```

---

## 🗄️ Estructura de la "base de datos" (`db.json`)

```json
{
  "usuarios": [
    {
      "id": 1,
      "nombre": "Administrador",
      "email": "admin@dulcemania.com",
      "password": "scrypt$...",
      "rol": "ADMIN",
      "activo": true,
      "creadoEn": "2026-01-01T00:00:00.000Z"
    }
  ],
  "productos": [
    {
      "id": 1,
      "nombre": "Helado de Chocolate",
      "precio": 15,
      "categoria": "Helados",
      "stock": 20,
      "imagen": "https://..."
    }
  ],
  "pedidos": []
}
```

### Roles disponibles

| Rol | Descripción |
|-----|-------------|
| `ADMIN` | Acceso total al sistema. |
| `CLIENTE` | Puede registrarse y hacer pedidos. |
| `COCINA` | Visualiza órdenes de preparación. |
| `CAJERO` | Registra pagos en efectivo. |

---

## 🔒 Seguridad implementada

| Aspecto | Implementación |
|---------|----------------|
| Contraseñas | Encriptadas con `crypto.scryptSync` + salt aleatorio |
| Tokens | Generados con `crypto.randomBytes(24)` |
| Comparación de hashes | `crypto.timingSafeEqual` (evita timing attacks) |
| Validación de roles | Middleware `soloAdmin` en backend |
| Protección de rutas | Token en `Authorization: Bearer ...` |
| Validación de campos | Frontend + backend |
| Sesiones | En memoria (se pierden al reiniciar el server) |

---

## 📦 Próximos sprints

- **Sprint 2:** Catálogo público de productos para clientes.
- **Sprint 3:** Carrito de compras y checkout.
- **Sprint 4:** Gestión de pedidos (cocina, cajero).
- **Sprint 5:** Reportes y notificaciones en tiempo real.

---

## 📝 Notas

- La "base de datos" es un archivo JSON que se lee y escribe con `fs`. No requiere instalación de motores de base de datos.
- Los tokens de sesión viven en memoria, por lo que al reiniciar el servidor las sesiones activas se invalidan (los usuarios deben volver a iniciar sesión).
- El sistema no requiere `npm install` porque no usa dependencias externas.

---

## 📄 Licencia

Proyecto académico — Universidad Real y Pontificia de San Francisco Xavier de Chuquisaca, 2026.