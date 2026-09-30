// Lógica de la visualización Clases de Película
/* =========================================================
   CLASES DE PELÍCULA
   Visualización de resultados cualitativos
   ========================================================= */

"use strict";


/* ---------------------------------------------------------
   1. Configuración
   --------------------------------------------------------- */

const DATA_PATHS = {
    recorrido: "data/docentes-recorrido.json",
    trayectoria: "data/docentes-trayectoria.json"
};

const ORDEN_RECORRIDO = [
    "Antes",
    "Durante",
    "Después",
    "Permanece"
];

const ORDEN_PROYECCION = [
    "Mantener",
    "Transformar",
    "Explorar"
];

let datosRecorrido = [];
let datosTrayectoria = [];


/* ---------------------------------------------------------
   2. Inicialización
   --------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", iniciarAplicacion);

async function iniciarAplicacion() {
    configurarSelectorEjercicios();
    configurarNavegacionPrincipal();

    try {
        await cargarDatos();

        renderizarNavegacionRecorrido();
        renderizarMomentoRecorrido(ORDEN_RECORRIDO[0]);

        renderizarNavegacionTrayectoria();
        renderizarPrimerComponenteTrayectoria();

        renderizarProyeccion();

    } catch (error) {
        console.error("No fue posible cargar los datos:", error);
        mostrarErrorDatos();
    }
}


/* ---------------------------------------------------------
   3. Carga de datos
   --------------------------------------------------------- */

async function cargarDatos() {
    const [respuestaRecorrido, respuestaTrayectoria] =
        await Promise.all([
            fetch(DATA_PATHS.recorrido),
            fetch(DATA_PATHS.trayectoria)
        ]);

    if (!respuestaRecorrido.ok || !respuestaTrayectoria.ok) {
        throw new Error("Error al cargar los archivos de datos.");
    }

    datosRecorrido = await respuestaRecorrido.json();
    datosTrayectoria = await respuestaTrayectoria.json();
}


/* ---------------------------------------------------------
   4. Selector de ejercicios
   --------------------------------------------------------- */

function configurarSelectorEjercicios() {
    const botones = document.querySelectorAll(".exercise-tab");
    const paneles = document.querySelectorAll(".exercise-panel");

    botones.forEach((boton) => {
        boton.addEventListener("click", () => {
            const objetivo = boton.dataset.target;

            botones.forEach((item) => {
                const activo = item === boton;

                item.classList.toggle("active", activo);
                item.setAttribute("aria-selected", activo);
            });

            paneles.forEach((panel) => {
                const esObjetivo = panel.id === `panel-${objetivo}`;

                panel.classList.toggle("active", esObjetivo);
                panel.hidden = !esObjetivo;
            });
        });
    });
}


/* ---------------------------------------------------------
   5. Cartografía del recorrido pedagógico
   --------------------------------------------------------- */

function renderizarNavegacionRecorrido() {
    const contenedor = document.getElementById("recorrido-navigation");

    if (!contenedor) return;

    contenedor.innerHTML = "";

    ORDEN_RECORRIDO.forEach((momento, indice) => {
        const boton = document.createElement("button");

        boton.type = "button";
        boton.className = "journey-step";

        if (indice === 0) {
            boton.classList.add("active");
        }

        boton.dataset.momento = momento;

        boton.innerHTML = `
            <span class="journey-dot">
                ${String(indice + 1).padStart(2, "0")}
            </span>

            <span class="journey-label">
                ${escaparHTML(momento)}
            </span>
        `;

        boton.addEventListener("click", () => {
            document
                .querySelectorAll(".journey-step")
                .forEach((item) => item.classList.remove("active"));

            boton.classList.add("active");

            renderizarMomentoRecorrido(momento);
        });

        contenedor.appendChild(boton);
    });
}


function renderizarMomentoRecorrido(momento) {
    const contenedor = document.getElementById("recorrido-content");

    if (!contenedor) return;

    const hallazgos = datosRecorrido.filter(
        (item) => normalizarTexto(item.submomento) === normalizarTexto(momento)
    );

    if (!hallazgos.length) {
        contenedor.innerHTML = crearMensajeVacio(
            "No se encontraron hallazgos para este momento."
        );
        return;
    }

    const tarjetas = hallazgos
        .map((item) => crearTarjetaRecorrido(item))
        .join("");

    contenedor.innerHTML = `
        <div class="visualization-header">
            <div>
                <p class="section-label">Momento del recorrido</p>
                <h4>${escaparHTML(momento)}</h4>
            </div>

            <p>
                ${hallazgos.length}
                ${hallazgos.length === 1 ? "tema identificado" : "temas identificados"}
            </p>
        </div>

        <div class="findings-grid">
            ${tarjetas}
        </div>
    `;
}


function crearTarjetaRecorrido(item) {
    const frecuencia = Number(item.frecuencia) || 0;
    const numeroDocentes = Number(item.numeroDocentes) || 0;

    const cita = item.citaRepresentativa
        ? `
            <div class="finding-quote">
                “${escaparHTML(item.citaRepresentativa)}”
            </div>
        `
        : "";

    return `
        <article class="finding-card">
            <h5>${escaparHTML(item.tema)}</h5>

            <p>
                ${escaparHTML(item.lectura)}
            </p>

            <div class="finding-meta">
                <span class="meta-pill">
                    ${frecuencia} ${frecuencia === 1 ? "aporte" : "aportes"}
                </span>

                <span class="meta-pill">
                    ${numeroDocentes}
                    ${numeroDocentes === 1 ? "docente" : "docentes"}
                </span>
            </div>

            ${cita}
        </article>
    `;
}


/* ---------------------------------------------------------
   6. Mapa de trayectoria
   --------------------------------------------------------- */

function obtenerComponentesTrayectoria() {
    const componentes = datosTrayectoria
        .filter(
            (item) =>
                normalizarTexto(item.tipo) === normalizarTexto("Trayectoria")
        )
        .sort(
            (a, b) =>
                Number(a.ordenComponente) - Number(b.ordenComponente)
        )
        .map((item) => ({
            nombre: item.componente,
            orden: Number(item.ordenComponente)
        }));

    const unicos = new Map();

    componentes.forEach((item) => {
        const clave = normalizarTexto(item.nombre);

        if (!unicos.has(clave)) {
            unicos.set(clave, item);
        }
    });

    return [...unicos.values()].sort(
        (a, b) => a.orden - b.orden
    );
}


function renderizarNavegacionTrayectoria() {
    const contenedor = document.getElementById(
        "trayectoria-navigation"
    );

    if (!contenedor) return;

    const componentes = obtenerComponentesTrayectoria();

    contenedor.innerHTML = "";

    componentes.forEach((componente, indice) => {
        const boton = document.createElement("button");

        boton.type = "button";
        boton.className = "trajectory-step";

        if (indice === 0) {
            boton.classList.add("active");
        }

        boton.dataset.componente = componente.nombre;
        boton.textContent = componente.nombre;

        boton.addEventListener("click", () => {
            document
                .querySelectorAll(".trajectory-step")
                .forEach((item) => item.classList.remove("active"));

            boton.classList.add("active");

            renderizarComponenteTrayectoria(componente.nombre);
        });

        contenedor.appendChild(boton);
    });
}


function renderizarPrimerComponenteTrayectoria() {
    const componentes = obtenerComponentesTrayectoria();

    if (!componentes.length) {
        const contenedor = document.getElementById(
            "trayectoria-content"
        );

        if (contenedor) {
            contenedor.innerHTML = crearMensajeVacio(
                "No se encontraron componentes de trayectoria."
            );
        }

        return;
    }

    renderizarComponenteTrayectoria(componentes[0].nombre);
}


function renderizarComponenteTrayectoria(componente) {
    const contenedor = document.getElementById(
        "trayectoria-content"
    );

    if (!contenedor) return;

    const hallazgos = datosTrayectoria.filter(
        (item) =>
            normalizarTexto(item.tipo) === normalizarTexto("Trayectoria") &&
            normalizarTexto(item.componente) === normalizarTexto(componente)
    );

    if (!hallazgos.length) {
        contenedor.innerHTML = crearMensajeVacio(
            "No se encontraron hallazgos para este componente."
        );
        return;
    }

    const tarjetas = hallazgos
        .map((item) => crearTarjetaTrayectoria(item))
        .join("");

    contenedor.innerHTML = `
        <div class="visualization-header">
            <div>
                <p class="section-label">Componente</p>
                <h4>${escaparHTML(componente)}</h4>
            </div>

            <p>
                ${hallazgos.length}
                ${hallazgos.length === 1 ? "hallazgo" : "hallazgos"}
            </p>
        </div>

        <div class="findings-grid">
            ${tarjetas}
        </div>
    `;
}


function crearTarjetaTrayectoria(item) {
    const frecuencia = Number(item.frecuenciaGrupos) || 0;

    const grupos = Array.isArray(item.grupos)
        ? item.grupos
        : [];

    const ideas = Array.isArray(item.ideasAsociadas)
        ? item.ideasAsociadas
        : [];

    const ideasHTML = ideas.length
        ? `
            <div class="finding-quote">
                <strong>Ideas asociadas:</strong>
                ${ideas.map((idea) => escaparHTML(idea)).join(" · ")}
            </div>
        `
        : "";

    return `
        <article class="finding-card">
            <h5>${escaparHTML(item.hallazgo)}</h5>

            <p>
                ${escaparHTML(item.lecturaInterpretativa)}
            </p>

            <div class="finding-meta">
                <span class="meta-pill">
                    ${frecuencia} de 4 grupos
                </span>

                ${
                    grupos.length
                        ? `
                            <span class="meta-pill">
                                ${grupos.map((grupo) => escaparHTML(grupo)).join(" · ")}
                            </span>
                        `
                        : ""
                }
            </div>

            ${ideasHTML}
        </article>
    `;
}


/* ---------------------------------------------------------
   7. Proyección: Mantener · Transformar · Explorar
   --------------------------------------------------------- */

function renderizarProyeccion() {
    const contenedor = document.getElementById(
        "projection-content"
    );

    if (!contenedor) return;

    const tarjetas = ORDEN_PROYECCION
        .map((componente) => {
            const hallazgos = datosTrayectoria.filter(
                (item) =>
                    normalizarTexto(item.tipo) ===
                        normalizarTexto("Proyección") &&
                    normalizarTexto(item.componente) ===
                        normalizarTexto(componente)
            );

            if (!hallazgos.length) return "";

            const elementos = hallazgos
                .map(
                    (item) => `
                        <li>
                            <strong>${escaparHTML(item.hallazgo)}</strong>
                            ${
                                item.lecturaInterpretativa
                                    ? `
                                        <span>
                                            ${escaparHTML(
                                                item.lecturaInterpretativa
                                            )}
                                        </span>
                                    `
                                    : ""
                            }
                        </li>
                    `
                )
                .join("");

            return `
                <article class="projection-card">
                    <h5>${escaparHTML(componente)}</h5>
                    <ul>${elementos}</ul>
                </article>
            `;
        })
        .join("");

    contenedor.innerHTML =
        tarjetas ||
        crearMensajeVacio(
            "No se encontraron hallazgos de proyección."
        );
}


/* ---------------------------------------------------------
   8. Navegación principal
   --------------------------------------------------------- */

function configurarNavegacionPrincipal() {
    const enlaces = document.querySelectorAll(".nav-link");

    enlaces.forEach((enlace) => {
        enlace.addEventListener("click", () => {
            enlaces.forEach((item) =>
                item.classList.remove("active")
            );

            enlace.classList.add("active");
        });
    });
}


/* ---------------------------------------------------------
   9. Mensajes de estado
   --------------------------------------------------------- */

function mostrarErrorDatos() {
    const contenedores = [
        document.getElementById("recorrido-content"),
        document.getElementById("trayectoria-content"),
        document.getElementById("projection-content")
    ];

    contenedores.forEach((contenedor) => {
        if (!contenedor) return;

        contenedor.innerHTML = `
            <div class="data-message">
                <strong>No fue posible cargar la información.</strong>
                <p>
                    Verifica que los archivos de datos estén disponibles
                    e intenta nuevamente.
                </p>
            </div>
        `;
    });
}


function crearMensajeVacio(mensaje) {
    return `
        <div class="data-message">
            <p>${escaparHTML(mensaje)}</p>
        </div>
    `;
}


/* ---------------------------------------------------------
   10. Utilidades
   --------------------------------------------------------- */

function normalizarTexto(valor = "") {
    return String(valor)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
}


function escaparHTML(valor = "") {
    const elemento = document.createElement("div");
    elemento.textContent = String(valor);
    return elemento.innerHTML;
}
