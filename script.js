/* ============================================
   LÓGICA GENERAL: Autenticación, Navegación y LocalStorage
   ============================================ */

const CLAVE_USUARIOS = "mis-cuentas-usuarios";
const CLAVE_SESION_ACTIVA = "mis-cuentas-sesion-activa";

const usuarioActivoEmail = localStorage.getItem(CLAVE_SESION_ACTIVA);

// Actualizar nombre y estado en la barra de navegación superior en cualquier página
document.addEventListener("DOMContentLoaded", () => {
  const nombreNav = document.getElementById("nombre-usuario-nav");
  const btnAuthNav = document.getElementById("btn-auth-nav");
  const btnCerrarSesion = document.getElementById("btn-cerrar-sesion");

  if (usuarioActivoEmail) {
    const usuarios = obtenerUsuarios();
    const actual = usuarios.find(u => u.email === usuarioActivoEmail);
    if (actual && nombreNav) {
      nombreNav.textContent = actual.nombre;
    }
  }

  // Manejar cierre de sesión desde cualquier vista protegida
  if (btnCerrarSesion) {
    btnCerrarSesion.addEventListener("click", () => {
      localStorage.removeItem(CLAVE_SESION_ACTIVA);
      window.location.href = "index.html";
    });
  }

  // Si se hace clic en el avatar sin sesión en el index, abre el modal de login
  if (btnAuthNav && !usuarioActivoEmail) {
    btnAuthNav.addEventListener("click", abrirModalAuth);
  }
});

// ============================================
// 1. LÓGICA DE LA LANDING / INICIO (index.html)
// ============================================
const btnIngresarGestor = document.getElementById("btn-ingresar-gestor");
const modalAuth = document.getElementById("modal-auth");
const cerrarModal = document.getElementById("cerrar-modal");

if (btnIngresarGestor) {
  btnIngresarGestor.addEventListener("click", () => {
    if (usuarioActivoEmail) {
      // Si ya está logueado, va directo a Detalle (calculadora)
      window.location.href = "calculadora.html";
    } else {
      // Si no está logueado, abre el modal de autenticación
      abrirModalAuth();
    }
  });
}

// Proteger enlaces del menú superior que requieren login
document.querySelectorAll(".link-protegido").forEach(link => {
  link.addEventListener("click", (e) => {
    if (!usuarioActivoEmail) {
      e.preventDefault();
      abrirModalAuth();
    }
  });
});

function abrirModalAuth() {
  if (modalAuth) modalAuth.classList.remove("oculto");
}

if (cerrarModal) {
  cerrarModal.addEventListener("click", () => {
    modalAuth.classList.add("oculto");
  });
}

// Intercambio de formularios en el modal (Login <-> Registro)
const irARegistro = document.getElementById("ir-a-registro");
const irALogin = document.getElementById("ir-a-login");
const seccionLogin = document.getElementById("seccion-login");
const seccionRegistro = document.getElementById("seccion-registro");

if (irARegistro) {
  irARegistro.addEventListener("click", (e) => {
    e.preventDefault();
    seccionLogin.classList.add("oculto");
    seccionRegistro.classList.remove("oculto");
  });
}

if (irALogin) {
  irALogin.addEventListener("click", (e) => {
    e.preventDefault();
    seccionRegistro.classList.add("oculto");
    seccionLogin.classList.remove("oculto");
  });
}

// Registro y Login submit handlers
const formLogin = document.getElementById("form-login");
const formRegistro = document.getElementById("form-registro");

if (formRegistro) {
  formRegistro.addEventListener("submit", (e) => {
    e.preventDefault();
    const nombre = document.getElementById("reg-nombre").value.trim();
    const email = document.getElementById("reg-email").value.trim().toLowerCase();
    const password = document.getElementById("reg-password").value;
    const errorRegistro = document.getElementById("error-registro");

    let usuarios = obtenerUsuarios();
    if (usuarios.some(u => u.email === email)) {
      errorRegistro.textContent = "Ya existe una cuenta con este correo.";
      return;
    }

    usuarios.push({ nombre, email, password });
    localStorage.setItem(CLAVE_USUARIOS, JSON.stringify(usuarios));
    localStorage.setItem(CLAVE_SESION_ACTIVA, email);
    window.location.href = "calculadora.html";
  });
}

if (formLogin) {
  formLogin.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim().toLowerCase();
    const password = document.getElementById("login-password").value;
    const errorLogin = document.getElementById("error-login");

    let usuarios = obtenerUsuarios();
    const encontrado = usuarios.find(u => u.email === email && u.password === password);

    if (!encontrado) {
      errorLogin.textContent = "Credenciales incorrectas.";
      return;
    }

    localStorage.setItem(CLAVE_SESION_ACTIVA, email);
    window.location.href = "calculadora.html";
  });
}

function obtenerUsuarios() {
  const data = localStorage.getItem(CLAVE_USUARIOS);
  return data ? JSON.parse(data) : [];
}


// ============================================
// 2. LÓGICA DE DETALLE / CALCULADORA (calculadora.html)
// ============================================
const formGasto = document.getElementById("form-gasto");
if (formGasto) {
  if (!usuarioActivoEmail) {
    window.location.href = "index.html";
  }

  const CLAVE_GASTOS = `mis-cuentas-gastos-${usuarioActivoEmail}`;
  let gastos = cargarGastos(CLAVE_GASTOS);

  const inputConcepto = document.getElementById("concepto");
  const inputCategoria = document.getElementById("categoria");
  const inputMonto = document.getElementById("monto");
  const listaGastos = document.getElementById("lista-gastos");
  const listaVacia = document.getElementById("lista-vacia");
  const filtroCategoria = document.getElementById("filtro-categoria");
  const totalGastadoEl = document.getElementById("total-gastado");
  const cantidadRegistrosEl = document.getElementById("cantidad-registros");
  const categoriaTopEl = document.getElementById("categoria-top");

  renderizarGastos();

  formGasto.addEventListener("submit", (e) => {
    e.preventDefault();
    const concepto = inputConcepto.value.trim();
    const categoria = inputCategoria.value;
    const monto = parseFloat(inputMonto.value);

    if (!concepto || !categoria || isNaN(monto) || monto <= 0) return;

    const nuevoGasto = { id: Date.now(), concepto, categoria, monto };
    gastos.push(nuevoGasto);
    guardarGastos(CLAVE_GASTOS, gastos);
    renderizarGastos();

    formGasto.reset();
    inputConcepto.focus();
  });

  if (filtroCategoria) {
    filtroCategoria.addEventListener("change", renderizarGastos);
  }

  if (listaGastos) {
    listaGastos.addEventListener("click", (e) => {
      const boton = e.target.closest(".gasto__borrar");
      if (!boton) return;
      const id = Number(boton.dataset.id);
      gastos = gastos.filter(g => g.id !== id);
      guardarGastos(CLAVE_GASTOS, gastos);
      renderizarGastos();
    });
  }

  function renderizarGastos() {
    const catFiltro = filtroCategoria ? filtroCategoria.value : "todas";
    const filtrados = catFiltro === "todas" ? gastos : gastos.filter(g => g.categoria === catFiltro);

    if (listaGastos) {
      listaGastos.innerHTML = "";
      if (filtrados.length === 0) {
        if (listaVacia) listaVacia.style.display = "block";
      } else {
        if (listaVacia) listaVacia.style.display = "none";
        filtrados.slice().reverse().forEach(g => {
          listaGastos.appendChild(crearItemGasto(g));
        });
      }
    }
    actualizarResumen(gastos, totalGastadoEl, cantidadRegistrosEl, categoriaTopEl);
  }
}


// ============================================
// 3. LÓGICA DE HISTORIAL (historial.html)
// ============================================

const listaHistorial = document.getElementById("lista-historial");
if (listaHistorial) {
  if (!usuarioActivoEmail) {
    window.location.href = "index.html";
  }
  const CLAVE_GASTOS = `mis-cuentas-gastos-${usuarioActivoEmail}`;
  const gastosOriginales = cargarGastos(CLAVE_GASTOS);

  const filtroCatEl = document.getElementById("filtro-historial-cat");
  const filtroPeriodoEl = document.getElementById("filtro-historial-periodo");
  const totalFiltradoEl = document.getElementById("historial-total-filtrado");
  const cantidadHistorialEl = document.getElementById("historial-cantidad");
  const historialVacio = document.getElementById("historial-vacio");
  const desgloseCategoriasEl = document.getElementById("desglose-categorias");
  const desgloseVacioEl = document.getElementById("desglose-vacio");

  // Renderizar inicialmente con todos los datos
  aplicarFiltrosHistorial();

  // Escuchar cambios en los selectores de filtro
  if (filtroCatEl) filtroCatEl.addEventListener("change", aplicarFiltrosHistorial);
  if (filtroPeriodoEl) filtroPeriodoEl.addEventListener("change", aplicarFiltrosHistorial);

  function aplicarFiltrosHistorial() {
    const categoriaSeleccionada = filtroCatEl.value;
    const periodoSeleccionado = filtroPeriodoEl.value;

    const ahora = new Date();

    const gastosFiltrados = gastosOriginales.filter(gasto => {
      // 1. Filtro por categoría
      const coincideCat = (categoriaSeleccionada === "todas" || gasto.categoria === categoriaSeleccionada);
      if (!coincideCat) return false;

      // 2. Filtro por fecha (usamos gasto.id ya que almacena el timestamp Date.now() de creación)
      const fechaGasto = new Date(gasto.id);

      if (periodoSeleccionado === "semana") {
        const hace7Dias = new Date();
        hace7Dias.setDate(ahora.getDate() - 7);
        if (fechaGasto < hace7Dias) return false;
      } else if (periodoSeleccionado === "mes") {
        const esMismoMes = (fechaGasto.getMonth() === ahora.getMonth() && fechaGasto.getFullYear() === ahora.getFullYear());
        if (!esMismoMes) return false;
      }

      return true;
    });

    renderizarVistaHistorial(gastosFiltrados);
  }

  function renderizarVistaHistorial(gastosFiltrados) {
    listaHistorial.innerHTML = "";
    
    if (gastosFiltrados.length === 0) {
      if (historialVacio) historialVacio.style.display = "block";
    } else {
      if (historialVacio) historialVacio.style.display = "none";
      gastosFiltrados.slice().reverse().forEach(g => {
        listaHistorial.appendChild(crearItemGasto(g));
      });
    }

    // Calcular suma total y cantidad
    const totalSuma = gastosFiltrados.reduce((acc, g) => acc + g.monto, 0);
    if (totalFiltradoEl) totalFiltradoEl.textContent = "$" + totalSuma.toLocaleString("es-AR", { minimumFractionDigits: 2 });
    if (cantidadHistorialEl) cantidadHistorialEl.textContent = gastosFiltrados.length;

    // Calcular desglose de sumas por categoría
    renderizarDesgloseCategorias(gastosFiltrados);
  }

  function renderizarDesgloseCategorias(gastosFiltrados) {
    if (!desgloseCategoriasEl) return;
    desgloseCategoriasEl.innerHTML = "";

    if (gastosFiltrados.length === 0) {
      if (desgloseVacioEl) desgloseVacioEl.style.display = "block";
      return;
    }

    if (desgloseVacioEl) desgloseVacioEl.style.display = "none";

    // Agrupar sumas por categoría
    const sumasPorCat = {};
    gastosFiltrados.forEach(g => {
      sumasPorCat[g.categoria] = (sumasPorCat[g.categoria] || 0) + g.monto;
    });

    // Crear elementos de lista para el desglose
    for (const cat in sumasPorCat) {
      const li = document.createElement("li");
      li.className = "gasto"; // Reutilizamos estilo de línea limpia
      li.innerHTML = `
        <span class="gasto__concepto"><b>${escapar(cat)}</b></span>
        <span class="gasto__linea" aria-hidden="true"></span>
        <span class="gasto__monto">$${sumasPorCat[cat].toLocaleString("es-AR", { minimumFractionDigits: 2 })}</span>
      `;
      desgloseCategoriasEl.appendChild(li);
    }
  }
}

// ============================================
// UTILIDADES GENERALES
// ============================================
function cargarGastos(clave) {
  const data = localStorage.getItem(clave);
  return data ? JSON.parse(data) : [];
}

function guardarGastos(clave, gastos) {
  localStorage.setItem(clave, JSON.stringify(gastos));
}

function crearItemGasto(gasto) {
  const item = document.createElement("li");
  item.className = "gasto";
  item.innerHTML = `
    <span class="gasto__concepto">${escapar(gasto.concepto)}</span>
    <span class="gasto__categoria">${escapar(gasto.categoria)}</span>
    <span class="gasto__linea" aria-hidden="true"></span>
    <span class="gasto__monto">$${gasto.monto.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</span>
    <button class="gasto__borrar" data-id="${gasto.id}" aria-label="Eliminar">✕</button>
  `;
  return item;
}

function actualizarResumen(gastos, totalEl, cantEl, catTopEl) {
  const total = gastos.reduce((acc, g) => acc + g.monto, 0);
  if (totalEl) totalEl.textContent = "$" + total.toLocaleString("es-AR", { minimumFractionDigits: 2 });
  if (cantEl) cantEl.textContent = gastos.length;

  if (catTopEl) {
    if (gastos.length === 0) {
      catTopEl.textContent = "—";
    } else {
      const map = {};
      gastos.forEach(g => { map[g.categoria] = (map[g.categoria] || 0) + g.monto; });
      let top = "";
      let max = -1;
      for (const c in map) {
        if (map[c] > max) { max = map[c]; top = c; }
      }
      catTopEl.textContent = top;
    }
  }
}

function escapar(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}

// ============================================
// CIERRE DE SESIÓN GLOBAL
// ============================================
document.addEventListener("DOMContentLoaded", () => {
  const btnCerrarSesion = document.getElementById("btn-cerrar-sesion");
  const nombreNav = document.getElementById("nombre-usuario-nav");

  // Mostrar el nombre del usuario logueado en la barra superior
  const usuarioActivoEmail = localStorage.getItem(CLAVE_SESION_ACTIVA);
  if (usuarioActivoEmail) {
    const usuarios = obtenerUsuarios();
    const actual = usuarios.find(u => u.email === usuarioActivoEmail);
    if (actual && nombreNav) {
      nombreNav.textContent = actual.nombre;
    }
  }

  // Evento para cerrar sesión
  if (btnCerrarSesion) {
    btnCerrarSesion.addEventListener("click", () => {
      localStorage.removeItem(CLAVE_SESION_ACTIVA);
      window.location.href = "index.html"; // Redirige a la landing / login
    });
  }
});
/* ============================================
   CONTROL DEL MENÚ HAMBURGUESA
   ============================================ */
document.addEventListener("DOMContentLoaded", () => {
  const hamburguesaBtn = document.getElementById("hamburguesa-btn");
  const headerNav = document.querySelector(".header-nav");

  if (hamburguesaBtn && headerNav) {
    hamburguesaBtn.addEventListener("click", () => {
      headerNav.classList.toggle("menu-abierto");
    });
  }
});

// Funciones puras listas para pruebas
export function calcularTotalGastos(gastos) {
  return gastos.reduce((acc, g) => acc + g.monto, 0);
}

export function filtrarGastosPorPeriodo(gastos, periodo, referenciaFecha = new Date()) {
  if (periodo === 'todos') return gastos;

  return gastos.filter(gasto => {
    const fechaGasto = new Date(gasto.id); // Usamos el timestamp del ID
    if (periodo === 'semana') {
      const hace7Dias = new Date(referenciaFecha);
      hace7Dias.setDate(referenciaFecha.getDate() - 7);
      return fechaGasto >= hace7Dias;
    } else if (periodo === 'mes') {
      return (
        fechaGasto.getMonth() === referenciaFecha.getMonth() &&
        fechaGasto.getFullYear() === referenciaFecha.getFullYear()
      );
    }
    return true;
  });
}
// ============================================
// EXPORTAR HISTORIAL A JSON MEDIANTE FETCH
// ============================================
async function exportarHistorialJSONConFetch(usuarioEmail, gastos) {
  const btnExportar = document.getElementById("btn-exportar-json");
  
  try {
    if (btnExportar) {
      btnExportar.textContent = "Procesando exportación...";
      btnExportar.disabled = true;
    }

    if (!gastos || gastos.length === 0) {
      alert("No hay gastos registrados para exportar.");
      return;
    }

    const datosRespaldo = {
      usuario: usuarioEmail,
      fechaExportacion: new Date().toISOString(),
      totalRegistros: gastos.length,
      gastos: gastos
    };

    // 1. Convertimos los datos a un string JSON y creamos una URL de datos (data URI)
    const jsonString = JSON.stringify(datosRespaldo, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(jsonString)}`;

    // 2. Ejecutamos un fetch simulando la petición al "endpoint" del archivo JSON
    const respuestaFetch = await fetch(dataUri);
    
    if (!respuestaFetch.ok) {
      throw new Error("Error en la respuesta del servidor simulado.");
    }

    // 3. Obtenemos el blob resultante de la petición fetch
    const blobRespuesta = await respuestaFetch.blob();
    const urlBlob = URL.createObjectURL(blobRespuesta);

    // 4. Redirigimos la ejecución creando el enlace de descarga automática
    const enlaceDescarga = document.createElement('a');
    enlaceDescarga.href = urlBlob;
    enlaceDescarga.download = `respaldo-gastos-${usuarioEmail.replace('@', '_at_')}.json`;
    
    document.body.appendChild(enlaceDescarga);
    enlaceDescarga.click();
    
    document.body.removeChild(enlaceDescarga);
    URL.revokeObjectURL(urlBlob);

  } catch (error) {
    console.error("Error al exportar mediante fetch:", error);
    alert("Ocurrió un error al procesar la exportación.");
  } finally {
    if (btnExportar) {
      btnExportar.textContent = "Generar respaldo";
      btnExportar.disabled = false;
    }
  }
}

// Conectar el evento al botón dentro de la inicialización de historial
const btnExportarJson = document.getElementById("btn-exportar-json");
if (btnExportarJson) {
  // Asegurarnos de que no duplique el evento si ya existía
  btnExportarJson.replaceWith(btnExportarJson.cloneNode(true));
  const nuevoBtnExportar = document.getElementById("btn-exportar-json");

  nuevoBtnExportar.addEventListener("click", async () => {
    const CLAVE_GASTOS = `mis-cuentas-gastos-${usuarioActivoEmail}`;
    const gastosActuales = cargarGastos(CLAVE_GASTOS);
    await exportarHistorialJSONConFetch(usuarioActivoEmail, gastosActuales);
  });
}