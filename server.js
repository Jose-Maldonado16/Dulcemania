const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = 4000;
const DB_PATH = path.join(__dirname, 'db.json');
const PUBLIC_PATH = path.join(__dirname, 'public');

// Tokens activos en memoria (se borran al reiniciar el server)
const sesiones = {};

// ===== Helpers generales =====
const leerDB = () => JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
const guardarDB = (data) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

const enviarJSON = (res, status, data) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
};

const leerBody = (req) =>
  new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try { resolve(JSON.parse(body || '{}')); }
      catch { resolve({}); }
    });
  });

// ===== Validaciones reutilizables =====
const emailValido = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const ROLES_VALIDOS = ['ADMIN', 'CLIENTE', 'COCINA', 'CAJERO'];

// ===== Seguridad: hashing con crypto nativo (scrypt) =====
const generarHash = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
};

const verificarPassword = (password, hashGuardado) => {
  try {
    const [, salt, hash] = hashGuardado.split('$');
    const hashCalculado = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(hashCalculado, 'hex'));
  } catch {
    return false;
  }
};

// ===== Auto-seed: crear admin si no existe =====
const inicializarAdmin = () => {
  const db = leerDB();
  const existeAdmin = db.usuarios.find((u) => u.email === 'admin@dulcemania.com');
  if (!existeAdmin) {
    db.usuarios.push({
      id: 1,
      nombre: 'Administrador',
      email: 'admin@dulcemania.com',
      password: generarHash('admin123'),
      rol: 'ADMIN',
      activo: true,
      creadoEn: new Date().toISOString(),
    });
    guardarDB(db);
    console.log('✅ Admin creado: admin@dulcemania.com / admin123');
  }
};
inicializarAdmin();

// ===== Middlewares =====
const autenticar = (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token || !sesiones[token]) {
    enviarJSON(res, 401, { error: 'No autenticado' });
    return null;
  }
  return sesiones[token];
};

const soloAdmin = (req, res) => {
  const sesion = autenticar(req, res);
  if (!sesion) return null;
  if (sesion.rol !== 'ADMIN') {
    enviarJSON(res, 403, { error: 'Acceso solo para administradores' });
    return null;
  }
  return sesion;
};

// ===== Servir archivos estáticos =====
const servirArchivo = (res, filePath) => {
  const ext = path.extname(filePath);
  const tipos = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
  };
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('No encontrado');
      return;
    }
    res.writeHead(200, { 'Content-Type': tipos[ext] || 'application/octet-stream' });
    res.end(data);
  });
};

// ===== Servidor =====
const server = http.createServer(async (req, res) => {
  const url = req.url.split('?')[0];
  const metodo = req.method;

  /* ============================================================
     SUBSISTEMA SEGURIDAD - AUTENTICACIÓN
     ============================================================ */

  // ===== POST /api/auth/login =====
  if (url === '/api/auth/login' && metodo === 'POST') {
    const { email, password } = await leerBody(req);

    if (!email || !password) {
      return enviarJSON(res, 400, { error: 'Email y contraseña son obligatorios' });
    }

    const db = leerDB();
    const usuario = db.usuarios.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());

    if (!usuario || !verificarPassword(password, usuario.password)) {
      return enviarJSON(res, 401, { error: 'Credenciales incorrectas' });
    }
    if (!usuario.activo) {
      return enviarJSON(res, 403, { error: 'Usuario desactivado. Contacta al administrador.' });
    }

    const token = crypto.randomBytes(24).toString('hex');
    sesiones[token] = { id: usuario.id, rol: usuario.rol, nombre: usuario.nombre };

    return enviarJSON(res, 200, {
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
      },
    });
  }

  // ===== POST /api/auth/registro (registro público de clientes) =====
  if (url === '/api/auth/registro' && metodo === 'POST') {
    const { nombre, email, password } = await leerBody(req);

    // Validaciones
    if (!nombre || !email || !password) {
      return enviarJSON(res, 400, { error: 'Todos los campos son obligatorios' });
    }
    if (nombre.trim().length < 3) {
      return enviarJSON(res, 400, { error: 'El nombre debe tener al menos 3 caracteres' });
    }
    if (!emailValido(email)) {
      return enviarJSON(res, 400, { error: 'Correo electrónico inválido' });
    }
    if (password.length < 6) {
      return enviarJSON(res, 400, { error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const db = leerDB();
    if (db.usuarios.find((u) => u.email.toLowerCase() === email.toLowerCase().trim())) {
      return enviarJSON(res, 409, { error: 'Este correo ya está registrado' });
    }

    const nuevo = {
      id: Date.now(),
      nombre: nombre.trim(),
      email: email.toLowerCase().trim(),
      password: generarHash(password),
      rol: 'CLIENTE',
      activo: true,
      creadoEn: new Date().toISOString(),
    };
    db.usuarios.push(nuevo);
    guardarDB(db);

    return enviarJSON(res, 201, {
      mensaje: 'Cuenta creada exitosamente',
      usuario: { id: nuevo.id, nombre: nuevo.nombre, email: nuevo.email, rol: nuevo.rol },
    });
  }

  // ===== GET /api/auth/perfil =====
  if (url === '/api/auth/perfil' && metodo === 'GET') {
    const sesion = autenticar(req, res);
    if (!sesion) return;
    const db = leerDB();
    const usuario = db.usuarios.find((u) => u.id === sesion.id);
    if (!usuario) return enviarJSON(res, 404, { error: 'Usuario no encontrado' });
    return enviarJSON(res, 200, {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
    });
  }

  // ===== POST /api/auth/logout =====
  if (url === '/api/auth/logout' && metodo === 'POST') {
    const token = req.headers['authorization']?.split(' ')[1];
    if (token) delete sesiones[token];
    return enviarJSON(res, 200, { mensaje: 'Sesión cerrada' });
  }

  /* ============================================================
     SUBSISTEMA SEGURIDAD - CRUD DE USUARIOS
     ============================================================ */

  // ===== GET /api/usuarios (listar todos) =====
  if (url === '/api/usuarios' && metodo === 'GET') {
    if (!soloAdmin(req, res)) return;
    const db = leerDB();
    const usuarios = db.usuarios.map((u) => ({
      id: u.id,
      nombre: u.nombre,
      email: u.email,
      rol: u.rol,
      activo: u.activo,
      creadoEn: u.creadoEn,
    }));
    return enviarJSON(res, 200, usuarios);
  }

  // ===== GET /api/usuarios/:id (ver uno) =====
  if (url.match(/^\/api\/usuarios\/\d+$/) && metodo === 'GET') {
    if (!soloAdmin(req, res)) return;
    const id = parseInt(url.split('/')[3]);
    const db = leerDB();
    const u = db.usuarios.find((x) => x.id === id);
    if (!u) return enviarJSON(res, 404, { error: 'Usuario no encontrado' });
    return enviarJSON(res, 200, {
      id: u.id, nombre: u.nombre, email: u.email, rol: u.rol, activo: u.activo,
    });
  }

  // ===== POST /api/usuarios (crear) =====
  if (url === '/api/usuarios' && metodo === 'POST') {
    if (!soloAdmin(req, res)) return;
    const { nombre, email, password, rol } = await leerBody(req);

    // Validaciones
    if (!nombre || !email || !password || !rol) {
      return enviarJSON(res, 400, { error: 'Todos los campos son obligatorios' });
    }
    if (nombre.trim().length < 3) {
      return enviarJSON(res, 400, { error: 'El nombre debe tener al menos 3 caracteres' });
    }
    if (!emailValido(email)) {
      return enviarJSON(res, 400, { error: 'Correo electrónico inválido' });
    }
    if (password.length < 6) {
      return enviarJSON(res, 400, { error: 'La contraseña debe tener al menos 6 caracteres' });
    }
    if (!ROLES_VALIDOS.includes(rol)) {
      return enviarJSON(res, 400, { error: 'Rol inválido' });
    }

    const db = leerDB();
    if (db.usuarios.find((u) => u.email.toLowerCase() === email.toLowerCase().trim())) {
      return enviarJSON(res, 409, { error: 'El email ya está registrado' });
    }

    const nuevo = {
      id: Date.now(),
      nombre: nombre.trim(),
      email: email.toLowerCase().trim(),
      password: generarHash(password),
      rol,
      activo: true,
      creadoEn: new Date().toISOString(),
    };
    db.usuarios.push(nuevo);
    guardarDB(db);

    return enviarJSON(res, 201, {
      id: nuevo.id, nombre: nuevo.nombre, email: nuevo.email, rol: nuevo.rol, activo: nuevo.activo,
    });
  }

  // ===== PUT /api/usuarios/:id (actualizar) =====
  if (url.match(/^\/api\/usuarios\/\d+$/) && metodo === 'PUT') {
    const sesion = soloAdmin(req, res);
    if (!sesion) return;
    const id = parseInt(url.split('/')[3]);
    const body = await leerBody(req);
    const db = leerDB();
    const index = db.usuarios.findIndex((u) => u.id === id);
    if (index === -1) return enviarJSON(res, 404, { error: 'Usuario no encontrado' });

    // Validaciones
    if (body.nombre !== undefined && body.nombre.trim().length < 3) {
      return enviarJSON(res, 400, { error: 'El nombre debe tener al menos 3 caracteres' });
    }
    if (body.email !== undefined) {
      if (!emailValido(body.email)) {
        return enviarJSON(res, 400, { error: 'Correo electrónico inválido' });
      }
      if (body.email.toLowerCase() !== db.usuarios[index].email.toLowerCase()) {
        if (db.usuarios.find((u) => u.email.toLowerCase() === body.email.toLowerCase())) {
          return enviarJSON(res, 409, { error: 'El email ya está en uso' });
        }
      }
    }
    if (body.password && body.password.length < 6) {
      return enviarJSON(res, 400, { error: 'La contraseña debe tener al menos 6 caracteres' });
    }
    if (body.rol && !ROLES_VALIDOS.includes(body.rol)) {
      return enviarJSON(res, 400, { error: 'Rol inválido' });
    }

    // No permitir auto-desactivarse ni auto-cambiarse el rol
    if (id === sesion.id) {
      if (body.activo === false) {
        return enviarJSON(res, 400, { error: 'No puedes desactivar tu propio usuario' });
      }
      if (body.rol && body.rol !== 'ADMIN') {
        return enviarJSON(res, 400, { error: 'No puedes cambiarte el rol a ti mismo' });
      }
    }

    const actualizado = { ...db.usuarios[index] };
    if (body.nombre) actualizado.nombre = body.nombre.trim();
    if (body.email) actualizado.email = body.email.toLowerCase().trim();
    if (body.rol) actualizado.rol = body.rol;
    if (typeof body.activo === 'boolean') actualizado.activo = body.activo;
    if (body.password) actualizado.password = generarHash(body.password);

    db.usuarios[index] = actualizado;
    guardarDB(db);

    return enviarJSON(res, 200, {
      id: actualizado.id, nombre: actualizado.nombre, email: actualizado.email,
      rol: actualizado.rol, activo: actualizado.activo,
    });
  }

  // ===== DELETE /api/usuarios/:id =====
  if (url.match(/^\/api\/usuarios\/\d+$/) && metodo === 'DELETE') {
    const sesion = soloAdmin(req, res);
    if (!sesion) return;
    const id = parseInt(url.split('/')[3]);

    if (id === sesion.id) {
      return enviarJSON(res, 400, { error: 'No puedes eliminar tu propio usuario' });
    }

    const db = leerDB();
    const existe = db.usuarios.find((u) => u.id === id);
    if (!existe) return enviarJSON(res, 404, { error: 'Usuario no encontrado' });

    db.usuarios = db.usuarios.filter((u) => u.id !== id);
    guardarDB(db);
    return enviarJSON(res, 200, { mensaje: 'Usuario eliminado' });
  }

  /* ============================================================
     PRODUCTOS
     ============================================================ */

  if (url === '/api/productos' && metodo === 'GET') {
    const db = leerDB();
    return enviarJSON(res, 200, db.productos);
  }

  if (url === '/api/productos' && metodo === 'POST') {
    if (!soloAdmin(req, res)) return;
    const body = await leerBody(req);
    if (!body.nombre || !body.precio || !body.categoria) {
      return enviarJSON(res, 400, { error: 'Nombre, precio y categoría son obligatorios' });
    }
    const db = leerDB();
    const nuevo = { id: Date.now(), ...body };
    db.productos.push(nuevo);
    guardarDB(db);
    return enviarJSON(res, 201, nuevo);
  }

  if (url.match(/^\/api\/productos\/\d+$/) && metodo === 'PUT') {
    if (!soloAdmin(req, res)) return;
    const id = parseInt(url.split('/')[3]);
    const body = await leerBody(req);
    const db = leerDB();
    const index = db.productos.findIndex((p) => p.id === id);
    if (index === -1) return enviarJSON(res, 404, { error: 'Producto no encontrado' });
    db.productos[index] = { ...db.productos[index], ...body, id };
    guardarDB(db);
    return enviarJSON(res, 200, db.productos[index]);
  }

  if (url.match(/^\/api\/productos\/\d+$/) && metodo === 'DELETE') {
    if (!soloAdmin(req, res)) return;
    const id = parseInt(url.split('/')[3]);
    const db = leerDB();
    db.productos = db.productos.filter((p) => p.id !== id);
    guardarDB(db);
    return enviarJSON(res, 200, { mensaje: 'Eliminado' });
  }

  /* ============================================================
     ARCHIVOS ESTÁTICOS
     ============================================================ */
  let filePath = url === '/' ? '/index.html' : url;
  servirArchivo(res, path.join(PUBLIC_PATH, filePath));
});

server.listen(PORT, () => {
  console.log(`🍦 DulceMania corriendo en http://localhost:${PORT}`);
  console.log(`📧 Login: admin@dulcemania.com / admin123`);
});