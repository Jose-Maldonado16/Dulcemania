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

DulceMania es una plataforma web ligera que permite a los clientes:
- Ver el menú de productos en tiempo real.
- Personalizar pedidos (sin azúcar, ingredientes extra, mensajes).
- Programar la hora de recojo.
- Pagar con QR, tarjeta o efectivo.
- Hacer seguimiento del estado del pedido.

Y al personal interno:
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

**Sin dependencias externas. Sin `node_modules`. Sin build. Peso total: < 200 KB.**

---

## 📁 Estructura del proyecto
dulcemania/
├── server.js # Backend completo (Node puro)
├── db.json # "Base de datos" en JSON
├── README.md # Este archivo
└── public/
├── index.html # Login
├── registro.html # Registro de clientes
├── admin.html # Panel de administración
├── usuarios.html # CRUD de usuarios
├── styles.css # Estilos (modo oscuro premium)
└── app.js # Lógica del frontend

---

## 🚀 Cómo ejecutar

### Requisitos
- Node.js v18 o superior.
- Un navegador moderno (Chrome, Firefox, Edge).

### Pasos

1. **Clonar o descargar el proyecto:**
   ```bash
   cd dulcemania

2.  **Iniciar el servidor:**
    ```bash
   node server.js

2.  **Abrir en el navegador**
    ```http://localhost:4000

Credenciales de prueba (ADMIN):

Email: admin@dulcemania.com

Password: admin123

Registrar un cliente:

Ir a http://localhost:4000/registro.html

Crear una cuenta nueva.