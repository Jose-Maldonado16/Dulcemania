const API = 'http://localhost:4000/api';

/* ============================================================
   SISTEMA DE NOTIFICACIONES (TOAST)
   ============================================================ */
function toast(mensaje, tipo = 'info') {
  let contenedor = document.getElementById('toast-container');
  if (!contenedor) {
    contenedor = document.createElement('div');
    contenedor.id = 'toast-container';
    contenedor.className = 'toast-container';
    document.body.appendChild(contenedor);
  }

  const t = document.createElement('div');
  t.className = `toast toast-${tipo}`;
  t.textContent = mensaje;
  contenedor.appendChild(t);

  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 300);
  }, 3000);
}

/* ============================================================
   LOGIN
   ============================================================ */
const formLogin = document.getElementById('formLogin');
if (formLogin) {
  formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('error');
    errorEl.textContent = '';

    if (!email || !password) {
      errorEl.textContent = 'Completa todos los campos';
      return;
    }

    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión');

      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario', JSON.stringify(data.usuario));
      window.location.href = 'admin.html';
    } catch (err) {
      errorEl.textContent = err.message;
    }
  });
}

/* ============================================================
   REGISTRO DE CLIENTES
   ============================================================ */
const formRegistro = document.getElementById('formRegistro');
if (formRegistro) {
  formRegistro.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById('error');
    errorEl.textContent = '';

    const nombre = document.getElementById('rNombre').value.trim();
    const email = document.getElementById('rEmail').value.trim();
    const password = document.getElementById('rPassword').value;
    const password2 = document.getElementById('rPassword2').value;

    if (nombre.length < 3) {
      errorEl.textContent = 'El nombre debe tener al menos 3 caracteres';
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errorEl.textContent = 'Correo electrónico inválido';
      return;
    }
    if (password.length < 6) {
      errorEl.textContent = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }
    if (password !== password2) {
      errorEl.textContent = 'Las contraseñas no coinciden';
      return;
    }

    try {
      const res = await fetch(`${API}/auth/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al registrar');

      toast('✅ Cuenta creada. Redirigiendo al login...', 'success');
      setTimeout(() => (window.location.href = 'index.html'), 1500);
    } catch (err) {
      errorEl.textContent = err.message;
    }
  });
}

/* ============================================================
   VERIFICAR SESIÓN EN PÁGINAS PRIVADAS
   ============================================================ */
const esPaginaPrivada = document.querySelector('.admin-body');
if (esPaginaPrivada) {
  const token = localStorage.getItem('token');
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

  // Si no hay sesión, redirigir al login
  if (!token || !usuario.rol) {
    window.location.href = 'index.html';
  } else {
    // Mostrar nombre del usuario
    const userNameEl = document.getElementById('userName');
    if (userNameEl) userNameEl.textContent = usuario.nombre || 'Usuario';

    // Mostrar link de Usuarios SOLO para ADMIN
    const navUsuarios = document.getElementById('navUsuarios');
    if (navUsuarios && usuario.rol === 'ADMIN') {
      navUsuarios.style.display = '';
    }

    // Si NO es admin e intenta entrar a usuarios.html, redirigir
    const estaEnUsuarios = window.location.pathname.includes('usuarios.html');
    if (estaEnUsuarios && usuario.rol !== 'ADMIN') {
      toast('No tienes permiso para ver esta sección', 'error');
      setTimeout(() => (window.location.href = 'admin.html'), 800);
    }

    // Botón de logout
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
      btnLogout.addEventListener('click', async () => {
        try {
          await fetch(`${API}/auth/logout`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch {}
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        window.location.href = 'index.html';
      });
    }
  }
}
/* ============================================================
   PÁGINA DE PRODUCTOS (admin.html)
   ============================================================ */
const listaProductos = document.getElementById('listaProductos');
if (listaProductos) {
  const token = localStorage.getItem('token');
  const usuarioLogueado = JSON.parse(localStorage.getItem('usuario') || '{}');
  const esAdmin = usuarioLogueado.rol === 'ADMIN';
  let productosCache = [];

  /* ---- Ajustar vista según rol ---- */
  const vistaAdmin = document.getElementById('vistaAdmin');
  const vistaCatalogo = document.getElementById('vistaCatalogo');
  const tituloPanel = document.getElementById('tituloPanel');
  const subtituloPanel = document.getElementById('subtituloPanel');

  if (esAdmin) {
    vistaAdmin.style.display = '';
    vistaCatalogo.style.display = 'none';
    tituloPanel.textContent = 'Panel de Administración';
    subtituloPanel.textContent = 'Gestiona el catálogo, inventario y pedidos';
  } else {
    vistaAdmin.style.display = 'none';
    vistaCatalogo.style.display = '';
    tituloPanel.textContent = 'Catálogo DulceMania';
    subtituloPanel.textContent = 'Consulta el menú disponible';
  }

  /* ---- Utilidades ---- */
  const claseTag = (cat) => {
    const c = cat.toLowerCase();
    if (c.includes('bebida')) return 'tag bebida';
    if (c.includes('pan')) return 'tag pan';
    if (c.includes('pastel')) return 'tag pastel';
    return 'tag helado';
  };

  const stockBadge = (stock) => {
    if (stock === 0) return '<span class="stock-badge stock-agotado">Agotado</span>';
    if (stock <= 5) return `<span class="stock-badge stock-bajo">Últimas ${stock}</span>`;
    return `<span class="stock-badge stock-ok">Disponible</span>`;
  };

  /* ---- Cargar productos ---- */
  const cargarProductos = async () => {
    const res = await fetch(`${API}/productos`);
    const productos = await res.json();
    productosCache = productos;

    // Stats (solo para admin)
    const statProductos = document.getElementById('statProductos');
    if (statProductos) statProductos.textContent = productos.length;
    const badgeCount = document.getElementById('badgeCount');
    if (badgeCount) badgeCount.textContent = productos.length;

    if (esAdmin) renderizarTabla(productos);
    else renderizarCatalogo(productos);
  };

  /* ============================================================
     RENDERIZADO - VISTA ADMIN (tabla)
     ============================================================ */
  const renderizarTabla = (productos) => {
    listaProductos.innerHTML = productos
      .map(
        (p) => `
        <tr>
          <td><img class="prod-img" src="${p.imagen || ''}" onerror="this.src='https://via.placeholder.com/48/FFD6E0/FF7AA2?text=🍦'"></td>
          <td class="prod-name">${p.nombre}</td>
          <td><span class="${claseTag(p.categoria)}">${p.categoria}</span></td>
          <td><strong>Bs. ${p.precio}</strong></td>
          <td>${p.stock}</td>
          <td>
            <div class="actions">
              <button class="btn-icon btn-edit" title="Editar" onclick="abrirEditar(${p.id})">✏️</button>
              <button class="btn-icon btn-trash" title="Eliminar" onclick="eliminarProducto(${p.id})">🗑️</button>
            </div>
          </td>
        </tr>`
      )
      .join('');
  };

  /* ============================================================
     RENDERIZADO - VISTA CATÁLOGO (tarjetas)
     ============================================================ */
  const renderizarCatalogo = (productos) => {
    const contenedor = document.getElementById('catalogoProductos');
    if (!productos.length) {
      contenedor.innerHTML = `<div class="catalogo-vacio">😕 No hay productos disponibles</div>`;
      return;
    }

    contenedor.innerHTML = productos
      .map(
        (p) => `
        <div class="catalogo-card">
          <div class="catalogo-img-wrapper">
            <img src="${p.imagen || ''}" onerror="this.src='https://via.placeholder.com/300x200/1F1530/FF7AA2?text=🍦'">
            <span class="catalogo-categoria ${claseTag(p.categoria).replace('tag ', '')}">${p.categoria}</span>
            ${stockBadge(p.stock)}
          </div>
          <div class="catalogo-info">
            <h3>${p.nombre}</h3>
            <div class="catalogo-footer">
              <span class="catalogo-precio">Bs. ${p.precio}</span>
            </div>
          </div>
        </div>`
      )
      .join('');
  };

  /* ---- Filtros del catálogo ---- */
  const inputBuscar = document.getElementById('buscarCatalogo');
  const selectCategoria = document.getElementById('filtroCategoria');

  const aplicarFiltrosCatalogo = () => {
    const texto = (inputBuscar?.value || '').toLowerCase().trim();
    const categoria = selectCategoria?.value || '';

    let filtrados = productosCache;
    if (texto) filtrados = filtrados.filter((p) => p.nombre.toLowerCase().includes(texto));
    if (categoria) filtrados = filtrados.filter((p) => p.categoria === categoria);

    renderizarCatalogo(filtrados);
  };

  if (inputBuscar) inputBuscar.addEventListener('input', aplicarFiltrosCatalogo);
  if (selectCategoria) selectCategoria.addEventListener('change', aplicarFiltrosCatalogo);

  /* ============================================================
     CRUD - Solo ADMIN
     ============================================================ */
  window.eliminarProducto = async (id) => {
    const prod = productosCache.find((p) => p.id === id);
    if (!confirm(`¿Eliminar "${prod?.nombre}"?`)) return;
    const res = await fetch(`${API}/productos/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) toast('🗑️ Producto eliminado', 'success');
    else toast('Error al eliminar', 'error');
    cargarProductos();
  };

  const modal = document.getElementById('modalEditar');

  window.abrirEditar = (id) => {
    const p = productosCache.find((x) => x.id === id);
    if (!p) return;
    document.getElementById('editId').value = p.id;
    document.getElementById('editNombre').value = p.nombre;
    document.getElementById('editPrecio').value = p.precio;
    document.getElementById('editStock').value = p.stock;
    document.getElementById('editCategoria').value = p.categoria;
    document.getElementById('editImagen').value = p.imagen || '';
    modal.classList.add('active');
  };

  const cerrarModal = () => modal.classList.remove('active');
  document.getElementById('btnCerrarModal').addEventListener('click', cerrarModal);
  document.getElementById('btnCancelarEdicion').addEventListener('click', cerrarModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) cerrarModal(); });

  document.getElementById('formEditar').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('editId').value;
    const actualizado = {
      nombre: document.getElementById('editNombre').value.trim(),
      precio: parseFloat(document.getElementById('editPrecio').value),
      stock: parseInt(document.getElementById('editStock').value),
      categoria: document.getElementById('editCategoria').value,
      imagen: document.getElementById('editImagen').value.trim(),
    };

    if (actualizado.nombre.length < 3) return toast('El nombre es muy corto', 'error');
    if (actualizado.precio <= 0) return toast('El precio debe ser mayor a 0', 'error');
    if (actualizado.stock < 0) return toast('El stock no puede ser negativo', 'error');

    const res = await fetch(`${API}/productos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(actualizado),
    });
    if (res.ok) toast('✅ Producto actualizado', 'success');
    else toast('Error al actualizar', 'error');
    cerrarModal();
    cargarProductos();
  });

  document.getElementById('formProducto').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nuevo = {
      nombre: document.getElementById('nombre').value.trim(),
      precio: parseFloat(document.getElementById('precio').value),
      categoria: document.getElementById('categoria').value,
      stock: parseInt(document.getElementById('stock').value),
      imagen: document.getElementById('imagen').value.trim(),
    };

    if (nuevo.nombre.length < 3) return toast('El nombre es muy corto', 'error');
    if (nuevo.precio <= 0) return toast('El precio debe ser mayor a 0', 'error');
    if (nuevo.stock < 0) return toast('El stock no puede ser negativo', 'error');

    const res = await fetch(`${API}/productos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(nuevo),
    });
    if (res.ok) toast('✅ Producto agregado', 'success');
    else toast('Error al agregar', 'error');
    e.target.reset();
    cargarProductos();
  });

  cargarProductos();
}
/* ============================================================
   PÁGINA DE USUARIOS (usuarios.html)
   ============================================================ */
const listaUsuarios = document.getElementById('listaUsuarios');
if (listaUsuarios) {
  const token = localStorage.getItem('token');
  const usuarioActual = JSON.parse(localStorage.getItem('usuario') || '{}');
  let usuariosCache = [];

  const claseRol = (rol) => {
    const r = rol.toLowerCase();
    if (r === 'admin') return 'rol-badge rol-admin';
    if (r === 'cocina') return 'rol-badge rol-cocina';
    if (r === 'cajero') return 'rol-badge rol-cajero';
    return 'rol-badge rol-cliente';
  };

  const inicial = (nombre) => (nombre || '?').charAt(0).toUpperCase();

  const formatoFecha = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const renderizar = (usuarios) => {
    if (!usuarios.length) {
      listaUsuarios.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#9B8FB0; padding:30px;">No hay usuarios que coincidan</td></tr>`;
      return;
    }
    listaUsuarios.innerHTML = usuarios
      .map(
        (u) => `
        <tr>
          <td>
            <div class="user-cell">
              <div class="user-initial">${inicial(u.nombre)}</div>
              <span class="user-name-col">${u.nombre}${u.id === usuarioActual.id ? ' <small style="color:#FF85B3;">(tú)</small>' : ''}</span>
            </div>
          </td>
          <td><span class="user-email-col">${u.email}</span></td>
          <td><span class="${claseRol(u.rol)}">${u.rol}</span></td>
          <td><span class="estado ${u.activo ? 'activo' : 'inactivo'}">${u.activo ? 'Activo' : 'Inactivo'}</span></td>
          <td>${formatoFecha(u.creadoEn)}</td>
          <td>
            <div class="actions">
              <button class="btn-icon btn-edit" title="Editar" onclick="abrirEditarUsuario(${u.id})">✏️</button>
              <button class="btn-icon btn-trash" title="Eliminar" onclick="eliminarUsuario(${u.id})">🗑️</button>
            </div>
          </td>
        </tr>`
      )
      .join('');
  };

  const cargarUsuarios = async () => {
    const res = await fetch(`${API}/usuarios`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 401) {
      toast('Sesión expirada. Inicia sesión de nuevo.', 'error');
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      setTimeout(() => (window.location.href = 'index.html'), 1200);
      return;
    }

    if (res.status === 403) {
      toast('No tienes permiso para ver esta sección', 'error');
      setTimeout(() => (window.location.href = 'admin.html'), 1200);
      return;
    }

    if (!res.ok) {
      toast('Error al cargar usuarios', 'error');
      return;
    }

    usuariosCache = await res.json();
    aplicarFiltros();
  };

  const aplicarFiltros = () => {
    const texto = document.getElementById('buscador').value.toLowerCase().trim();
    const rol = document.getElementById('filtroRol').value;
    let filtrados = usuariosCache;
    if (texto) {
      filtrados = filtrados.filter(
        (u) => u.nombre.toLowerCase().includes(texto) || u.email.toLowerCase().includes(texto)
      );
    }
    if (rol) filtrados = filtrados.filter((u) => u.rol === rol);
    renderizar(filtrados);
  };

  document.getElementById('buscador').addEventListener('input', aplicarFiltros);
  document.getElementById('filtroRol').addEventListener('change', aplicarFiltros);

  /* ---- Modal ---- */
  const modal = document.getElementById('modalUsuario');
  const form = document.getElementById('formUsuario');
  const titulo = document.getElementById('modalTitulo');
  const passHint = document.getElementById('passHint');

  const abrirModal = (modo, usuario = null) => {
    form.reset();
    document.getElementById('userId').value = '';

    if (modo === 'editar' && usuario) {
      titulo.textContent = '✏️ Editar Usuario';
      document.getElementById('userId').value = usuario.id;
      document.getElementById('uNombre').value = usuario.nombre;
      document.getElementById('uEmail').value = usuario.email;
      document.getElementById('uRol').value = usuario.rol;
      document.getElementById('uActivo').value = usuario.activo ? 'true' : 'false';
      document.getElementById('uPassword').required = false;
      passHint.textContent = '(dejar en blanco para no cambiar)';
    } else {
      titulo.textContent = '➕ Nuevo Usuario';
      document.getElementById('uPassword').required = true;
      passHint.textContent = '(mínimo 6 caracteres)';
    }

    modal.classList.add('active');
  };

  const cerrarModal = () => modal.classList.remove('active');

  document.getElementById('btnNuevoUsuario').addEventListener('click', () => abrirModal('crear'));
  document.getElementById('btnCerrarModal').addEventListener('click', cerrarModal);
  document.getElementById('btnCancelar').addEventListener('click', cerrarModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) cerrarModal(); });

  window.abrirEditarUsuario = (id) => {
    const u = usuariosCache.find((x) => x.id === id);
    if (u) abrirModal('editar', u);
  };

  window.eliminarUsuario = async (id) => {
    const u = usuariosCache.find((x) => x.id === id);
    if (!confirm(`¿Eliminar al usuario "${u?.nombre}"?`)) return;
    const res = await fetch(`${API}/usuarios/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) return toast(data.error || 'Error al eliminar', 'error');
    toast('🗑️ Usuario eliminado', 'success');
    cargarUsuarios();
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('userId').value;
    const password = document.getElementById('uPassword').value;
    const nombre = document.getElementById('uNombre').value.trim();
    const email = document.getElementById('uEmail').value.trim();

    if (nombre.length < 3) return toast('El nombre debe tener al menos 3 caracteres', 'error');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast('Correo electrónico inválido', 'error');
    if (!id && password.length < 6) return toast('La contraseña debe tener al menos 6 caracteres', 'error');
    if (id && password && password.length < 6) return toast('La nueva contraseña debe tener al menos 6 caracteres', 'error');

    const payload = {
      nombre,
      email,
      rol: document.getElementById('uRol').value,
      activo: document.getElementById('uActivo').value === 'true',
    };
    if (password) payload.password = password;

    const url = id ? `${API}/usuarios/${id}` : `${API}/usuarios`;
    const method = id ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return toast(data.error || 'Error al guardar', 'error');

    toast(id ? '✅ Usuario actualizado' : '✅ Usuario creado', 'success');
    cerrarModal();
    cargarUsuarios();
  });

  cargarUsuarios();
} 