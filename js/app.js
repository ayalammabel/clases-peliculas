/* =========================================================
   CLASES DE PELÍCULA
   Visualización cualitativa
========================================================= */


/* =========================================================
   01. CONFIGURACIÓN
========================================================= */

const DATA_PATHS = {
    recorrido: "data/docentes-recorrido.json",
    trayectoria: "data/docentes-trayectoria.json"
};


const MOMENTOS_RECORRIDO = [
    {
        key: "Antes",
        number: "01",
        intro: "La experiencia comienza antes de llegar a la sala."
    },
    {
        key: "Durante",
        number: "02",
        intro: "El encuentro con el cine activa experiencias, emociones, conversaciones y nuevas formas de participación."
    },
    {
        key: "Después",
        number: "03",
        intro: "La experiencia continúa cuando lo vivido vuelve al aula y se convierte en conversación, reflexión y creación."
    },
    {
        key: "Permanece",
        number: "04",
        intro: "Algunos aprendizajes, intereses y vínculos con el cine permanecen más allá de la experiencia inmediata."
    }
];


const ETAPAS_TRAYECTORIA = [
    "Punto de partida",
    "Descubrimientos",
    "Lo que moviliza",
    "Lo que genera",
    "Lo que transforma",
    "Lo que permanece"
];


const ETAPAS_PROYECCION = [
    "Mantener",
    "Transformar",
    "Explorar"
];


/* =========================================================
   02. ESTADO
========================================================= */

let recorridoData = [];
let trayectoriaData = [];

let recorridoMomentIndex = 0;
let recorridoThemeIndex = 0;

let trayectoriaMode = "trayectoria";
let trayectoriaStageIndex = 0;
let projectionStageIndex = 0;


/* =========================================================
   03. UTILIDADES
========================================================= */

function normalizeText(value) {
    return String(value ?? "")
        .trim()
        .toLocaleLowerCase("es");
}


function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function firstValue(object, keys, fallback = "") {

    for (const key of keys) {

        if (
            Object.prototype.hasOwnProperty.call(object, key) &&
            object[key] !== null &&
            object[key] !== undefined &&
            String(object[key]).trim() !== ""
        ) {
            return object[key];
        }

    }

    return fallback;
}


function firstNonEmpty(values) {

    return values.find(
        value =>
            value !== null &&
            value !== undefined &&
            String(value).trim() !== ""
    ) ?? "";

}


function unique(values) {

    return [
        ...new Set(
            values.filter(
                value =>
                    value !== null &&
                    value !== undefined &&
                    String(value).trim() !== ""
            )
        )
    ];

}


function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent = value ?? "";
    }

}


/* =========================================================
   04. NORMALIZACIÓN DE DATOS
========================================================= */

function normalizeRecord(record) {

    return {

        raw: record,

        momento: firstValue(
             record,
             [
                 "momento",
                 "Momento",
                 "submomento",
                 "Submomento",
                 "etapa",
                 "Etapa",
                 "componente",
                 "Componente",
                 "categoria",
                 "Categoría"
             ]
         ),

        tema: firstValue(
            record,
            [
                "tema",
                "Tema",
                "tema_principal",
                "Tema principal",
                "temaPrincipal",
                "hallazgo",
                "Hallazgo"
            ],
            "Hallazgo"
        ),

        lectura: firstValue(
             record,
             [
                 "lectura",
                 "Lectura",
                 "lecturaInterpretativa",
                 "interpretacion",
                 "Interpretación",
                 "descripcion",
                 "Descripción",
                 "sintesis",
                 "Síntesis",
                 "analisis",
                 "Análisis"
             ]
         ),

        cita: firstValue(
            record,
            [
                "cita",
                "Cita",
                "cita_representativa",
                "Cita representativa",
                "citaRepresentativa",
                "transcripcion",
                "Transcripción",
                "ejemplo",
                "Ejemplo"
            ]
        ),

        frecuencia: firstValue(
            record,
            [
                "frecuencia",
                "Frecuencia",
               "frecuenciaGrupos",
                "aportes",
                "Aportes",
                "numero_aportes",
                "Número de aportes",
                "n_aportes"
            ]
        ),

        docentes: firstValue(
            record,
            [
                "docentes",
                "Docentes",
                "numero_docentes",
                "Número de docentes",
                "N.º docentes",
                "N° docentes",
                "n_docentes"
            ]
        )

    };

}


/* =========================================================
   05. CARGA DE DATOS
========================================================= */

async function loadJSON(path) {

    const response = await fetch(path);

    if (!response.ok) {
        throw new Error(
            `No fue posible cargar ${path}`
        );
    }

    return response.json();

}


function extractArray(data) {

    if (Array.isArray(data)) {
        return data;
    }

    const possibleKeys = [
        "data",
        "datos",
        "resultados",
        "recorrido",
        "trayectoria",
        "items"
    ];

    for (const key of possibleKeys) {

        if (Array.isArray(data?.[key])) {
            return data[key];
        }

    }

    return [];
}


async function loadData() {

    try {

        const [recorridoRaw, trayectoriaRaw] =
            await Promise.all([
                loadJSON(DATA_PATHS.recorrido),
                loadJSON(DATA_PATHS.trayectoria)
            ]);


        recorridoData =
            extractArray(recorridoRaw)
                .map(normalizeRecord);


        trayectoriaData =
            extractArray(trayectoriaRaw)
                .map(normalizeRecord);


        initializeRecorrido();
        initializeTrayectoria();

    }

    catch (error) {

        console.error(
            "Error cargando los datos:",
            error
        );

        renderDataError();

    }

}


function renderDataError() {

    const recorridoDetail =
        document.getElementById(
            "recorrido-detail"
        );

    if (recorridoDetail) {

        recorridoDetail.innerHTML = `
            <h3>No fue posible cargar los resultados</h3>

            <p>
                Revisa que los archivos JSON se encuentren
                dentro de la carpeta <strong>data</strong>.
            </p>
        `;

    }

}


/* =========================================================
   06. NAVEGACIÓN PRINCIPAL
========================================================= */
function initializeMainNavigation() {

    const links = document.querySelectorAll(".view-link");

    const dropdown = document.querySelector(".nav-dropdown");
    const trigger = document.querySelector(".nav-dropdown-trigger");
    const menu = document.getElementById("docentes-submenu");

    function closeDropdown() {
        if (!dropdown || !trigger || !menu) return;

        dropdown.classList.remove("is-open");
        trigger.setAttribute("aria-expanded", "false");
        menu.hidden = true;
    }

    links.forEach(link => {

        link.addEventListener("click", () => {

            // El botón Docentes abre o cierra el submenú
            if (link.classList.contains("nav-dropdown-trigger")) {

                const isOpen = !menu.hidden;

                if (isOpen) {
                    closeDropdown();
                } else {
                    menu.hidden = false;
                    dropdown.classList.add("is-open");
                    trigger.setAttribute("aria-expanded", "true");
                }

                return;
            }

            // Inicio y Acerca del estudio conservan su funcionamiento
            const target = link.dataset.view;

            closeDropdown();
            showView(target);

            window.location.hash = target;

        });

    });

    // Cerrar al hacer clic fuera del menú
    document.addEventListener("click", event => {

        if (dropdown && !dropdown.contains(event.target)) {
            closeDropdown();
        }

    });

    // Cerrar con Escape
    document.addEventListener("keydown", event => {

        if (event.key === "Escape") {
            closeDropdown();
            trigger?.focus();
        }

    });

}

function showExercise(target) {

    document
        .querySelectorAll("[data-exercise-panel]")
        .forEach(panel => {

            const active =
                panel.dataset.exercisePanel === target;

            panel.hidden = !active;

            panel.classList.toggle("active", active);

        });

}


function showView(target) {

    const panels =
        document.querySelectorAll(
            "[data-view-panel]"
        );


    panels.forEach(panel => {

        const active =
            panel.dataset.viewPanel === target;

        panel.hidden = !active;

        panel.classList.toggle(
            "active",
            active
        );

    });


    document
        .querySelectorAll(".nav-link")
        .forEach(link => {

            link.classList.toggle(
                "active",
                link.dataset.view === target
            );

        });


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}

function showDocentesExercise(target) {

    document
        .querySelectorAll("[data-exercise-panel]")
        .forEach(panel => {

            const active =
                panel.dataset.exercisePanel === target;

            panel.hidden = !active;

            panel.classList.toggle("active", active);

        });

    showView("docentes");

}

/* =========================================================
   07. SELECTOR DE EJERCICIOS
========================================================= */

function initializeExerciseNavigation() {

    const tabs =
        document.querySelectorAll(
            ".exercise-tab"
        );


    tabs.forEach(tab => {

        tab.addEventListener(
            "click",
            () => {

                const target =
                    tab.dataset.target;


                tabs.forEach(item => {

                    const active =
                        item === tab;

                    item.classList.toggle(
                        "active",
                        active
                    );

                    item.setAttribute(
                        "aria-selected",
                        active
                    );

                });


                document
                    .querySelectorAll(
                        "[data-exercise-panel]"
                    )
                    .forEach(panel => {

                        const active =
                            panel.dataset.exercisePanel
                            === target;

                        panel.hidden =
                            !active;

                        panel.classList.toggle(
                            "active",
                            active
                        );

                    });

            }
        );

    });

}

function initializeDocentesDropdown() {

    const options = document.querySelectorAll(
        "#docentes-submenu .nav-dropdown-item"
    );

    options.forEach(option => {

        option.addEventListener("click", () => {

            const target = option.dataset.exercise;

            // Mostrar la vista Docentes
            showView("docentes");

            window.location.hash = "docentes";

            // Mostrar únicamente el resultado seleccionado
            document.querySelectorAll(
                "[data-exercise-panel]"
            ).forEach(panel => {
            
                const active =
                    panel.dataset.exercisePanel === target;
            
                panel.hidden = !active;
            
                panel.classList.toggle(
                    "active",
                    active
                );
            
            });
          
           // Actualizar opción seleccionada
            options.forEach(item => {
                item.classList.toggle(
                    "active",
                    item === option
                );
            });

            // Cerrar el desplegable
            const dropdown = document.querySelector(".nav-dropdown");
            const trigger = document.querySelector(".nav-dropdown-trigger");
            const menu = document.getElementById("docentes-submenu");

            dropdown?.classList.remove("is-open");

            if (trigger) {
                trigger.setAttribute("aria-expanded", "false");
            }

            if (menu) {
                menu.hidden = true;
            }

        });

    });

}

/* =========================================================
   08. CARTOGRAFÍA DEL RECORRIDO
========================================================= */

function initializeRecorrido() {

    recorridoMomentIndex = 0;
    recorridoThemeIndex = 0;

    renderRecorridoNavigation();
    renderRecorrido();

    initializeStoryControls();

}


/* =========================================================
   09. NAVEGACIÓN DE MOMENTOS
========================================================= */

function renderRecorridoNavigation() {

    const container =
        document.getElementById(
            "recorrido-navigation"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    MOMENTOS_RECORRIDO.forEach(
        (momento, index) => {

            const button =
                document.createElement("button");

            button.type = "button";


            /* ---------------------------------------------
               ESTADO DEL MOMENTO
            --------------------------------------------- */

            if (index < recorridoMomentIndex) {

                button.className = "completed";

            }

            else if (index === recorridoMomentIndex) {

                button.className = "active";

            }

            else {

                button.className = "upcoming";

            }


            button.innerHTML = `
                <span>
                    ${escapeHTML(momento.number)}
                </span>

                <span>
                    ${escapeHTML(momento.key)}
                </span>
            `;


            button.setAttribute(
                "aria-label",
                `Ir al momento ${momento.key}`
            );


            if (index === recorridoMomentIndex) {

                button.setAttribute(
                    "aria-current",
                    "step"
                );

            }


            button.addEventListener(
                "click",
                () => {

                    recorridoMomentIndex =
                        index;

                    recorridoThemeIndex =
                        0;

                    renderRecorridoNavigation();

                    renderRecorrido();

                    scrollStoryIntoView();

                }
            );


            container.appendChild(
                button
            );

        }
    );

}


/* =========================================================
   10. OBTENER REGISTROS Y TEMAS
========================================================= */

function getRecorridoRecords(momentKey) {

    return recorridoData.filter(
        record =>
            normalizeText(
                record.momento
            ) ===
            normalizeText(
                momentKey
            )
    );

}


function getRecorridoThemes(momentKey) {

    const records =
        getRecorridoRecords(
            momentKey
        );


    const themeNames =
        unique(
            records.map(
                record =>
                    record.tema
            )
        );


    const themes =
        themeNames.map(
            themeName => {

                const matching =
                    records.filter(
                        record =>
                            normalizeText(
                                record.tema
                            ) ===
                            normalizeText(
                                themeName
                            )
                    );


                return combineThemeRecords(
                    themeName,
                    matching
                );

            }
        );


    themes.sort(
        (a, b) => {

            const aportesA =
                Number(a.frecuencia) || 0;

            const aportesB =
                Number(b.frecuencia) || 0;

            return aportesB - aportesA;

        }
    );


    return themes;

}

/* =========================================================
   11. AGRUPAR REGISTROS POR TEMA
========================================================= */

function combineThemeRecords(
    themeName,
    records
) {

    if (!records.length) {

        return {
            tema: themeName,
            lectura: "",
            cita: "",
            frecuencia: "",
            docentes: ""
        };

    }


    const principal =
        records[0];


    const lectura =
        firstNonEmpty(
            records.map(
                record =>
                    record.lectura
            )
        );


    const cita =
        firstNonEmpty(
            records.map(
                record =>
                    record.cita
            )
        );


    let frecuencia =
        firstNonEmpty(
            records.map(
                record =>
                    record.frecuencia
            )
        );


    if (
        frecuencia === "" &&
        records.length > 1
    ) {
        frecuencia =
            records.length;
    }


    const docentes =
        firstNonEmpty(
            records.map(
                record =>
                    record.docentes
            )
        );


    return {
        tema: themeName,
        lectura,
        cita,
        frecuencia,
        docentes,
        raw: principal.raw
    };

}


/* =========================================================
   12. RENDER GENERAL DEL CAPÍTULO
========================================================= */

function renderRecorrido() {

    const momento =
        MOMENTOS_RECORRIDO[
            recorridoMomentIndex
        ];


    const themes =
        getRecorridoThemes(
            momento.key
        );


    if (
        recorridoThemeIndex >=
        themes.length
    ) {
        recorridoThemeIndex = 0;
    }


    updateStoryChapterHeader(
        momento,
        themes.length
    );


    renderStoryThemeIndex(
        themes
    );


    if (!themes.length) {

        renderEmptyRecorrido(
            momento
        );

        updateStoryControls(
            0
        );

        updateNextMoment(
            momento
        );

        return;
    }


    const selectedTheme =
        themes[
            recorridoThemeIndex
        ];


    renderStoryFinding(
        selectedTheme
    );


    updateStoryControls(
        themes.length
    );


    updateNextMoment(
        momento
    );

}


/* =========================================================
   13. ENCABEZADO DEL CAPÍTULO
========================================================= */

function updateStoryChapterHeader(
    momento,
    themeCount
) {

    /* ---------------------------------------------
       NÚMERO DEL MOMENTO
       Ejemplo: 02 / 04
    --------------------------------------------- */

    setText(
        "story-step-number",
        momento.number
    );


    setText(
        "story-step-total",
        String(
            MOMENTOS_RECORRIDO.length
        ).padStart(2, "0")
    );


    /* ---------------------------------------------
       NOMBRE DEL MOMENTO
       Ejemplo: DURANTE
    --------------------------------------------- */

    setText(
        "story-moment-label",
        momento.key
    );


    /* ---------------------------------------------
       INTRODUCCIÓN NARRATIVA
    --------------------------------------------- */

    setText(
        "story-introduction",
        momento.intro
    );


    /* ---------------------------------------------
       NÚMERO DE TEMAS
    --------------------------------------------- */

    const count =
        document.getElementById(
            "recorrido-count"
        );


    if (count) {

        count.textContent =
            themeCount === 1
                ? "1 tema"
                : `${themeCount} temas`;

    }

}

/* =========================================================
   14. HALLAZGO ACTIVO
========================================================= */

function renderStoryFinding(theme) {

    const container =
        document.getElementById(
            "recorrido-detail"
        );


    if (!container) {
        return;
    }


    const stats = [];


    if (
        theme.frecuencia !== "" &&
        theme.frecuencia !== null &&
        theme.frecuencia !== undefined
    ) {

        stats.push(
            `<span>${escapeHTML(theme.frecuencia)} aportes</span>`
        );

    }


    if (
        theme.docentes !== "" &&
        theme.docentes !== null &&
        theme.docentes !== undefined
    ) {

        stats.push(
            `<span>${escapeHTML(theme.docentes)} docentes</span>`
        );

    }


    const readingHTML =
        theme.lectura
            ? `
                <p class="finding-text">
                    ${escapeHTML(theme.lectura)}
                </p>
            `
            : "";


    const statsHTML =
        stats.length
            ? `
                <div class="story-stats">
                    ${stats.join("")}
                </div>
            `
            : "";


    const quoteHTML =
        theme.cita
            ? `
                <blockquote>
                    <p>
                        “${escapeHTML(theme.cita)}”
                    </p>
                </blockquote>
            `
            : "";


    container.innerHTML = `

        <p class="finding-kicker">
            Hallazgo del recorrido
        </p>

        <h4>
            ${escapeHTML(theme.tema)}
        </h4>

        ${readingHTML}

        ${statsHTML}

        ${quoteHTML}

    `;

}


/* =========================================================
   15. ESTADO SIN TEMAS
========================================================= */

function renderEmptyRecorrido(
    momento
) {

    const container =
        document.getElementById(
            "recorrido-detail"
        );


    if (!container) {
        return;
    }


    container.innerHTML = `

        <p class="finding-kicker">
            ${escapeHTML(momento.key)}
        </p>

        <h4>
            No se encontraron hallazgos
        </h4>

        <p class="finding-text">
            No hay registros asociados a este momento
            en el archivo de datos.
        </p>

    `;

}


/* =========================================================
   16. ÍNDICE NAVEGABLE DE TEMAS
========================================================= */

function renderStoryThemeIndex(
    themes
) {

    const container =
        document.getElementById(
            "recorrido-themes"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    themes.forEach(
        (theme, index) => {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.textContent =
                theme.tema;


            if (
                index ===
                recorridoThemeIndex
            ) {

                button.classList.add(
                    "active"
                );

                button.setAttribute(
                    "aria-current",
                    "true"
                );

            }


            button.setAttribute(
                "aria-label",
                `Ver hallazgo: ${theme.tema}`
            );


            button.addEventListener(
                "click",
                () => {

                    recorridoThemeIndex =
                        index;

                    renderRecorrido();

                }
            );


            container.appendChild(
                button
            );

        }
    );

}


/* =========================================================
   17. CONTROLES ANTERIOR / SIGUIENTE
========================================================= */

function initializeStoryControls() {

    const previous =
        document.getElementById(
            "story-prev-theme"
        );

    const next =
        document.getElementById(
            "story-next-theme"
        );

    const nextMoment =
        document.getElementById(
            "story-next-moment"
        );


    if (previous) {

        previous.addEventListener(
            "click",
            () => {

                if (
                    recorridoThemeIndex > 0
                ) {

                    recorridoThemeIndex--;

                    renderRecorrido();

                }

            }
        );

    }


    if (next) {

        next.addEventListener(
            "click",
            () => {

                const momento =
                    MOMENTOS_RECORRIDO[
                        recorridoMomentIndex
                    ];


                const themes =
                    getRecorridoThemes(
                        momento.key
                    );


                if (
                    recorridoThemeIndex <
                    themes.length - 1
                ) {

                    recorridoThemeIndex++;

                    renderRecorrido();

                }

            }
        );

    }


    if (nextMoment) {

        nextMoment.addEventListener(
            "click",
            () => {

                if (
                    recorridoMomentIndex <
                    MOMENTOS_RECORRIDO.length - 1
                ) {

                    recorridoMomentIndex++;

                    recorridoThemeIndex = 0;

                    renderRecorridoNavigation();
                    renderRecorrido();

                    scrollStoryIntoView();

                }

            }
        );

    }

}


/* =========================================================
   18. ACTUALIZAR CONTROLES
========================================================= */

function updateStoryControls(
    totalThemes
) {

    const previous =
        document.getElementById(
            "story-prev-theme"
        );

    const next =
        document.getElementById(
            "story-next-theme"
        );


    if (previous) {

        previous.disabled =
            totalThemes === 0 ||
            recorridoThemeIndex === 0;

    }


    if (next) {

        next.disabled =
            totalThemes === 0 ||
            recorridoThemeIndex >=
            totalThemes - 1;

    }


    setText(
        "story-theme-current",
        totalThemes
            ? recorridoThemeIndex + 1
            : 0
    );


    setText(
        "story-theme-total",
        totalThemes
    );

}


/* =========================================================
   19. SIGUIENTE MOMENTO
========================================================= */

function updateNextMoment() {

    const button =
        document.getElementById(
            "story-next-moment"
        );

    const label =
        document.getElementById(
            "story-next-moment-label"
        );

    const description =
        document.getElementById(
            "story-next-description"
        );


    if (!button) {
        return;
    }


    const nextIndex =
        recorridoMomentIndex + 1;


    if (
        nextIndex <
        MOMENTOS_RECORRIDO.length
    ) {

        const nextMoment =
            MOMENTOS_RECORRIDO[
                nextIndex
            ];


        button.hidden = false;


        if (label) {
            label.textContent =
                nextMoment.key;
        }


        if (description) {

            const descriptions = {
                "Durante":
                    "Continúa hacia durante y explora cómo la experiencia toma forma en el encuentro con el cine.",

                "Después":
                    "Avanza hacia después y descubre cómo lo vivido continúa en el aula.",

                "Permanece":
                    "Continúa hacia permanece y explora los aprendizajes, intereses y vínculos que trascienden la experiencia."
            };


            description.textContent =
                descriptions[
                    nextMoment.key
                ] ||
                `Continúa hacia ${nextMoment.key.toLowerCase()} y explora cómo evoluciona la experiencia.`;

        }

    }

    else {

        button.hidden = true;


        if (description) {

            description.textContent =
                "Has llegado al cierre de este recorrido pedagógico.";

        }

    }

}


/* =========================================================
   20. SCROLL DEL STORYMAP
========================================================= */

function scrollStoryIntoView() {

    const chapter =
        document.getElementById(
            "story-chapter"
        );


    if (!chapter) {
        return;
    }


    const reducedMotion =
        window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;


    chapter.scrollIntoView({
        behavior:
            reducedMotion
                ? "auto"
                : "smooth",

        block: "start"
    });

}


/* =========================================================
   21. EJERCICIO 02 · INICIALIZACIÓN
========================================================= */

function initializeTrayectoria() {

    initializeTrajectoryModes();

    trayectoriaStageIndex = 0;
    projectionStageIndex = 0;

    renderTrayectoriaNavigation();
    renderProjectionNavigation();

    renderTrayectoriaStage();
    renderProjectionStage();

}


/* =========================================================
   22. TRAYECTORIA / PROYECCIÓN
========================================================= */

function initializeTrajectoryModes() {

    const buttons =
        document.querySelectorAll(
            ".mode-button"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const mode =
                        button.dataset.mode;


                    trayectoriaMode =
                        mode;


                    buttons.forEach(
                        item => {

                            item.classList.toggle(
                                "active",
                                item === button
                            );

                        }
                    );


                    const trajectoryView =
                        document.getElementById(
                            "trajectory-view"
                        );

                    const projectionView =
                        document.getElementById(
                            "projection-view"
                        );


                    if (
                        trajectoryView &&
                        projectionView
                    ) {

                        const isTrajectory =
                            mode ===
                            "trayectoria";


                        trajectoryView.hidden =
                            !isTrajectory;

                        projectionView.hidden =
                            isTrajectory;


                        trajectoryView.classList.toggle(
                            "active",
                            isTrajectory
                        );

                        projectionView.classList.toggle(
                            "active",
                            !isTrajectory
                        );

                    }

                }
            );

        }
    );

}


/* =========================================================
   23. NAVEGACIÓN DE TRAYECTORIA
========================================================= */

function renderTrayectoriaNavigation() {

    const container =
        document.getElementById(
            "trayectoria-navigation"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    ETAPAS_TRAYECTORIA.forEach(
        (stage, index) => {

            const button =
                document.createElement(
                    "button"
                );


            button.type = "button";

            button.textContent =
                stage;


            button.className =
                index === trayectoriaStageIndex
                    ? "active"
                    : "";


            button.addEventListener(
                "click",
                () => {

                    trayectoriaStageIndex =
                        index;

                    renderTrayectoriaNavigation();
                    renderTrayectoriaStage();

                }
            );


            container.appendChild(
                button
            );

        }
    );

}


/* =========================================================
   24. NAVEGACIÓN DE PROYECCIÓN
========================================================= */

function renderProjectionNavigation() {

    const container =
        document.getElementById(
            "projection-navigation"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    ETAPAS_PROYECCION.forEach(
        (stage, index) => {

            const button =
                document.createElement(
                    "button"
                );


            button.type = "button";

            button.textContent =
                stage;


            button.className =
                index === projectionStageIndex
                    ? "active"
                    : "";


            button.addEventListener(
                "click",
                () => {

                    projectionStageIndex =
                        index;

                    renderProjectionNavigation();
                    renderProjectionStage();

                }
            );


            container.appendChild(
                button
            );

        }
    );

}


/* =========================================================
   25. REGISTROS DEL EJERCICIO 02
========================================================= */

function getTrajectoryRecords(
    stage
) {

    return trayectoriaData.filter(
        record => {

            const value =
                normalizeText(
                    record.momento
                );


            const target =
                normalizeText(
                    stage
                );


            if (value === target) {
                return true;
            }


            const aliases = {

                "lo que genera": [
                    "genera",
                    "lo que genera",
                    "qué genera",
                    "que genera",
                    "clases de película genera en los estudiantes"
                ],

                "lo que moviliza": [
                    "moviliza",
                    "lo que moviliza"
                ],

                "lo que transforma": [
                    "transforma",
                    "lo que transforma"
                ],

                "lo que permanece": [
                    "permanece",
                    "lo que permanece"
                ],

                "punto de partida": [
                    "punto de partida",
                    "inicio"
                ],

                "descubrimientos": [
                    "descubrimientos",
                    "descubrimiento"
                ],

                "mantener": [
                    "mantener"
                ],

                "transformar": [
                    "transformar"
                ],

                "explorar": [
                    "explorar"
                ]

            };


            const possible =
                aliases[target] || [];


            return possible.some(
                alias =>
                    value ===
                    normalizeText(alias)
            );

        }
    );

}


/* =========================================================
   26. RENDER DE UNA ETAPA DEL EJERCICIO 02
========================================================= */

function renderTrayectoriaStage() {

    const stage =
        ETAPAS_TRAYECTORIA[
            trayectoriaStageIndex
        ];


    renderTrajectoryExplorer({
        stage,
        titleId:
            "trayectoria-title",
        countId:
            "trayectoria-count",
        themesId:
            "trayectoria-themes",
        detailId:
            "trayectoria-detail"
    });

}


function renderProjectionStage() {

    const stage =
        ETAPAS_PROYECCION[
            projectionStageIndex
        ];


    renderTrajectoryExplorer({
        stage,
        titleId:
            "projection-title",
        countId:
            "projection-count",
        themesId:
            "projection-themes",
        detailId:
            "projection-detail"
    });

}


/* =========================================================
   27. EXPLORADOR DEL EJERCICIO 02
========================================================= */

function renderTrajectoryExplorer({
    stage,
    titleId,
    countId,
    themesId,
    detailId
}) {

    const records =
        getTrajectoryRecords(
            stage
        );


    const themeNames =
        unique(
            records.map(
                record =>
                    record.tema
            )
        );


    const themes =
        themeNames.map(
            name =>
                combineThemeRecords(
                    name,
                    records.filter(
                        record =>
                            normalizeText(
                                record.tema
                            ) ===
                            normalizeText(
                                name
                            )
                    )
                )
        );


    setText(
        titleId,
        stage
    );


    setText(
        countId,
        themes.length === 1
            ? "1 hallazgo identificado"
            : `${themes.length} hallazgos identificados`
    );


    const themesContainer =
        document.getElementById(
            themesId
        );

    const detailContainer =
        document.getElementById(
            detailId
        );


    if (
        !themesContainer ||
        !detailContainer
    ) {
        return;
    }


    themesContainer.innerHTML = "";


    if (!themes.length) {

        detailContainer.innerHTML = `

            <h3>
                ${escapeHTML(stage)}
            </h3>

            <p>
                No se encontraron registros asociados
                a esta etapa.
            </p>

        `;

        return;
    }


    themes.forEach(
        (theme, index) => {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.textContent =
                theme.tema;


            button.className =
                index === 0
                    ? "active"
                    : "";


            button.addEventListener(
                "click",
                () => {

                    themesContainer
                        .querySelectorAll(
                            "button"
                        )
                        .forEach(
                            item =>
                                item.classList.remove(
                                    "active"
                                )
                        );


                    button.classList.add(
                        "active"
                    );


                    renderStandardFinding(
                        detailContainer,
                        theme
                    );

                }
            );


            themesContainer.appendChild(
                button
            );

        }
    );


    renderStandardFinding(
        detailContainer,
        themes[0]
    );

}


/* =========================================================
   28. HALLAZGO ESTÁNDAR DEL EJERCICIO 02
========================================================= */

function renderStandardFinding(
    container,
    theme
) {

    const stats = [];


    if (
        theme.frecuencia !== "" &&
        theme.frecuencia !== null &&
        theme.frecuencia !== undefined
    ) {

        stats.push(
            `<span>${escapeHTML(theme.frecuencia)} grupos</span>`
        );

    }


    if (
        theme.docentes !== "" &&
        theme.docentes !== null &&
        theme.docentes !== undefined
    ) {

        stats.push(
            `<span>${escapeHTML(theme.docentes)} docentes</span>`
        );

    }


    container.innerHTML = `

        <p class="section-label">
            Hallazgo
        </p>

        <h3>
            ${escapeHTML(theme.tema)}
        </h3>

        ${
            theme.lectura
                ? `
                    <p>
                        ${escapeHTML(theme.lectura)}
                    </p>
                `
                : ""
        }

        ${
            stats.length
                ? `
                    <div class="finding-stats">
                        ${stats.join("")}
                    </div>
                `
                : ""
        }

        ${
            theme.cita
                ? `
                    <blockquote>
                        “${escapeHTML(theme.cita)}”
                    </blockquote>
                `
                : ""
        }

    `;

}


/* =========================================================
   29. INICIALIZACIÓN GENERAL
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeMainNavigation();
        initializeExerciseNavigation();
        initializeDocentesDropdown();

        loadData();

    }
);
