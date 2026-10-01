/* =========================================================
   CLASES DE PELÍCULA
   Visualización de resultados cualitativos
   ========================================================= */

"use strict";


/* =========================================================
   1. CONFIGURACIÓN
   ========================================================= */

const DATA_PATHS = {
    recorrido: "data/docentes-recorrido.json",
    trayectoria: "data/docentes-trayectoria.json"
};

const APP_DATA = {
    recorrido: null,
    trayectoria: null
};


/* =========================================================
   2. UTILIDADES
   ========================================================= */

function normalizeText(value = "") {
    return String(value)
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}


function getFirstValue(object, keys, fallback = "") {
    if (!object || typeof object !== "object") {
        return fallback;
    }

    for (const key of keys) {
        if (
            Object.prototype.hasOwnProperty.call(object, key) &&
            object[key] !== null &&
            object[key] !== undefined &&
            object[key] !== ""
        ) {
            return object[key];
        }
    }

    return fallback;
}


function escapeHTML(value = "") {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function formatNumber(value) {
    const number = Number(value);

    if (Number.isNaN(number)) {
        return value ?? "";
    }

    return new Intl.NumberFormat("es-CO").format(number);
}


function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================================================
   3. NAVEGACIÓN PRINCIPAL
   Inicio · Docentes · Acerca del estudio
   ========================================================= */

function showView(viewName, updateHash = true) {
    const panels = document.querySelectorAll("[data-view-panel]");
    const navLinks = document.querySelectorAll(".nav-link");

    panels.forEach((panel) => {
        const isActive = panel.dataset.viewPanel === viewName;

        panel.hidden = !isActive;
        panel.classList.toggle("active", isActive);
    });

    navLinks.forEach((link) => {
        const isActive = link.dataset.view === viewName;

        link.classList.toggle("active", isActive);

        if (isActive) {
            link.setAttribute("aria-current", "page");
        } else {
            link.removeAttribute("aria-current");
        }
    });

    if (updateHash) {
        history.replaceState(null, "", `#${viewName}`);
    }

    scrollToTop();
}


function initMainNavigation() {
    const viewLinks = document.querySelectorAll(".view-link");

    viewLinks.forEach((button) => {
        button.addEventListener("click", () => {
            const targetView = button.dataset.view;

            if (targetView) {
                showView(targetView);
            }
        });
    });

    const hash = window.location.hash.replace("#", "");
    const validViews = ["inicio", "docentes", "acerca"];

    if (validViews.includes(hash)) {
        showView(hash, false);
    } else {
        showView("inicio", false);
    }
}


/* =========================================================
   4. SELECTOR DE EJERCICIOS DE DOCENTES
   ========================================================= */

function showExercise(exerciseName) {
    const tabs = document.querySelectorAll(".exercise-tab");
    const panels = document.querySelectorAll(
        "[data-exercise-panel]"
    );

    tabs.forEach((tab) => {
        const isActive = tab.dataset.target === exerciseName;

        tab.classList.toggle("active", isActive);
        tab.setAttribute(
            "aria-selected",
            String(isActive)
        );
    });

    panels.forEach((panel) => {
        const isActive =
            panel.dataset.exercisePanel === exerciseName;

        panel.hidden = !isActive;
        panel.classList.toggle("active", isActive);
    });
}


function initExerciseNavigation() {
    const tabs = document.querySelectorAll(".exercise-tab");

    tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            showExercise(tab.dataset.target);
        });
    });

    showExercise("recorrido");
}


/* =========================================================
   5. CARGA DE DATOS
   ========================================================= */

async function loadJSON(path) {
    const response = await fetch(path);

    if (!response.ok) {
        throw new Error(
            `No fue posible cargar ${path}. Código ${response.status}.`
        );
    }

    return response.json();
}


async function loadData() {
    try {
        const [recorrido, trayectoria] = await Promise.all([
            loadJSON(DATA_PATHS.recorrido),
            loadJSON(DATA_PATHS.trayectoria)
        ]);

        APP_DATA.recorrido = recorrido;
        APP_DATA.trayectoria = trayectoria;

        initRecorrido();
        initTrayectoria();

    } catch (error) {
        console.error(
            "Error al cargar los datos:",
            error
        );

        showDataError(
            "No fue posible cargar los datos de la visualización. " +
            "Verifica que los archivos JSON estén dentro de la carpeta data."
        );
    }
}


function showDataError(message) {
    const containers = [
        document.getElementById("recorrido-detail"),
        document.getElementById("trayectoria-detail"),
        document.getElementById("projection-detail")
    ];

    containers.forEach((container) => {
        if (!container) {
            return;
        }

        container.innerHTML = `
            <div class="data-message">
                <p>${escapeHTML(message)}</p>
            </div>
        `;
    });
}


/* =========================================================
   6. DATOS DEL RECORRIDO PEDAGÓGICO
   ========================================================= */

function getRecorridoRecords() {
    const data = APP_DATA.recorrido;

    if (!data) {
        return [];
    }

    if (Array.isArray(data)) {
        return data;
    }

    const possibleArrays = [
        data.datos,
        data.data,
        data.registros,
        data.resultados,
        data.temas,
        data.items
    ];

    return possibleArrays.find(Array.isArray) || [];
}


function getRecorridoMoment(record) {
    return getFirstValue(
        record,
        [
            "submomento",
            "Submomento",
            "momento",
            "Momento",
            "etapa",
            "Etapa"
        ]
    );
}


function getThemeName(record) {
    return getFirstValue(
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
        "Tema identificado"
    );
}


function getReading(record) {
    return getFirstValue(
        record,
        [
            "lectura",
            "Lectura",
            "interpretacion",
            "Interpretación",
            "interpretación",
            "descripcion",
            "Descripción",
            "descripcion_tema",
            "sintesis",
            "Síntesis"
        ]
    );
}


function getQuote(record) {
    return getFirstValue(
        record,
        [
            "cita",
            "Cita",
            "cita_representativa",
            "Cita representativa",
            "citaRepresentativa",
            "transcripcion",
            "Transcripción",
            "texto"
        ]
    );
}


function getFrequency(record) {
    return getFirstValue(
        record,
        [
            "frecuencia",
            "Frecuencia",
            "frecuencia_tema",
            "Frecuencia del tema",
            "aportes",
            "Aportes",
            "n_aportes"
        ],
        ""
    );
}


function getTeachers(record) {
    return getFirstValue(
        record,
        [
            "docentes",
            "Docentes",
            "numero_docentes",
            "N.º docentes",
            "N° docentes",
            "n_docentes",
            "cantidad_docentes"
        ],
        ""
    );
}


/* =========================================================
   7. AGRUPACIÓN POR TEMA
   ========================================================= */

function groupRecordsByTheme(records) {
    const groups = new Map();

    records.forEach((record) => {
        const theme = getThemeName(record);
        const key = normalizeText(theme);

        if (!groups.has(key)) {
            groups.set(key, {
                tema: theme,
                lectura: getReading(record),
                cita: getQuote(record),
                frecuencia: getFrequency(record),
                docentes: getTeachers(record),
                records: []
            });
        }

        const group = groups.get(key);

        group.records.push(record);

        if (!group.lectura) {
            group.lectura = getReading(record);
        }

        if (!group.cita) {
            group.cita = getQuote(record);
        }

        if (!group.frecuencia) {
            group.frecuencia = getFrequency(record);
        }

        if (!group.docentes) {
            group.docentes = getTeachers(record);
        }
    });

    return Array.from(groups.values());
}


/* =========================================================
   8. CARTOGRAFÍA DEL RECORRIDO PEDAGÓGICO
   ========================================================= */

const RECORRIDO_MOMENTS = [
    {
        key: "antes",
        label: "Antes",
        number: "01"
    },
    {
        key: "durante",
        label: "Durante",
        number: "02"
    },
    {
        key: "despues",
        label: "Después",
        number: "03"
    },
    {
        key: "permanece",
        label: "Permanece",
        number: "04"
    }
];

let activeRecorridoMoment = "antes";
let activeRecorridoTheme = 0;


function initRecorrido() {
    renderRecorridoNavigation();
    renderRecorridoMoment(activeRecorridoMoment);
}


function renderRecorridoNavigation() {
    const container =
        document.getElementById("recorrido-navigation");

    if (!container) {
        return;
    }

    container.innerHTML = RECORRIDO_MOMENTS
        .map((moment) => {
            const isActive =
                moment.key === activeRecorridoMoment;

            return `
                <button
                    class="journey-step ${
                        isActive ? "active" : ""
                    }"
                    type="button"
                    data-moment="${moment.key}"
                    aria-pressed="${isActive}"
                >
                    <span class="journey-dot">
                        ${moment.number}
                    </span>

                    <span class="journey-label">
                        ${escapeHTML(moment.label)}
                    </span>
                </button>
            `;
        })
        .join("");

    const buttons =
        container.querySelectorAll(".journey-step");

    buttons.forEach((button) => {
        button.addEventListener("click", () => {
            activeRecorridoMoment =
                button.dataset.moment;

            activeRecorridoTheme = 0;

            renderRecorridoNavigation();
            renderRecorridoMoment(
                activeRecorridoMoment
            );
        });
    });
}


function getRecordsForMoment(momentKey) {
    const records = getRecorridoRecords();

    return records.filter((record) => {
        const recordMoment =
            normalizeText(
                getRecorridoMoment(record)
            );

        return recordMoment ===
            normalizeText(momentKey);
    });
}


function renderRecorridoMoment(momentKey) {
    const records =
        getRecordsForMoment(momentKey);

    const themes =
        groupRecordsByTheme(records);

    const momentConfig =
        RECORRIDO_MOMENTS.find(
            (item) => item.key === momentKey
        );

    const title =
        document.getElementById(
            "recorrido-title"
        );

    const count =
        document.getElementById(
            "recorrido-count"
        );

    if (title) {
        title.textContent =
            momentConfig?.label || momentKey;
    }

    if (count) {
        count.textContent =
            themes.length === 1
                ? "1 tema identificado"
                : `${themes.length} temas identificados`;
    }

    const selectTheme = (index) => {
        activeRecorridoTheme = index;

        renderRecorridoMoment(momentKey);
    };

    renderThemeList(
        "recorrido-themes",
        themes,
        activeRecorridoTheme,
        selectTheme
    );

    if (themes.length > 0) {
        const selectedTheme =
            themes[activeRecorridoTheme] ||
            themes[0];

        renderFinding(
            "recorrido-detail",
            selectedTheme,
            "Hallazgo del recorrido"
        );
    } else {
        renderEmptyFinding(
            "recorrido-detail"
        );
    }
}


/* =========================================================
   9. LISTA DE TEMAS
   ========================================================= */

function renderThemeList(
    containerId,
    themes,
    activeIndex,
    onSelect
) {
    const container =
        document.getElementById(containerId);

    if (!container) {
        return;
    }

    if (!themes.length) {
        container.innerHTML = `
            <div class="data-message">
                <p>
                    No se identificaron temas
                    para esta sección.
                </p>
            </div>
        `;

        return;
    }

    container.innerHTML = themes
        .map((theme, index) => {
            const isActive =
                index === activeIndex;

            return `
                <button
                    class="theme-button ${
                        isActive ? "active" : ""
                    }"
                    type="button"
                    data-theme-index="${index}"
                    aria-pressed="${isActive}"
                >
                    ${escapeHTML(theme.tema)}
                </button>
            `;
        })
        .join("");

    const buttons =
        container.querySelectorAll(
            ".theme-button"
        );

    buttons.forEach((button) => {
        button.addEventListener(
            "click",
            () => {
                const index = Number(
                    button.dataset.themeIndex
                );

                onSelect(index);
            }
        );
    });
}


/* =========================================================
   10. DETALLE DEL HALLAZGO
   ========================================================= */

function renderFinding(
    containerId,
    theme,
    label = "Hallazgo"
) {
    const container =
        document.getElementById(containerId);

    if (!container) {
        return;
    }

    if (!theme) {
        renderEmptyFinding(containerId);
        return;
    }

    const metadata = [];

    const frequency = theme.frecuencia;
    const teachers = theme.docentes;

    if (
        frequency !== "" &&
        frequency !== null &&
        frequency !== undefined
    ) {
        metadata.push(`
            <span class="meta-pill">
                ${formatNumber(frequency)}
                ${
                    Number(frequency) === 1
                        ? "aporte"
                        : "aportes"
                }
            </span>
        `);
    }

    if (
        teachers !== "" &&
        teachers !== null &&
        teachers !== undefined
    ) {
        metadata.push(`
            <span class="meta-pill">
                ${formatNumber(teachers)}
                ${
                    Number(teachers) === 1
                        ? "docente"
                        : "docentes"
                }
            </span>
        `);
    }

    container.innerHTML = `
        <p class="detail-label">
            ${escapeHTML(label)}
        </p>

        <h4>
            ${escapeHTML(theme.tema)}
        </h4>

        ${
            theme.lectura
                ? `
                    <p class="detail-reading">
                        ${escapeHTML(
                            theme.lectura
                        )}
                    </p>
                `
                : ""
        }

        ${
            metadata.length
                ? `
                    <div class="detail-meta">
                        ${metadata.join("")}
                    </div>
                `
                : ""
        }

        ${
            theme.cita
                ? `
                    <blockquote
                        class="detail-quote"
                    >
                        ${escapeHTML(
                            theme.cita
                        )}
                    </blockquote>
                `
                : ""
        }
    `;
}


function renderEmptyFinding(containerId) {
    const container =
        document.getElementById(containerId);

    if (!container) {
        return;
    }

    container.innerHTML = `
        <div class="data-message">
            <p>
                No hay información disponible
                para esta sección.
            </p>
        </div>
    `;
}


/* =========================================================
   11. DATOS DEL MAPA DE TRAYECTORIA
   ========================================================= */

function getTrayectoriaRecords() {
    const data = APP_DATA.trayectoria;

    if (!data) {
        return [];
    }

    if (Array.isArray(data)) {
        return data;
    }

    const possibleArrays = [
        data.datos,
        data.data,
        data.registros,
        data.resultados,
        data.temas,
        data.items
    ];

    return possibleArrays.find(Array.isArray) || [];
}


function getTrajectoryStage(record) {
    return getFirstValue(
        record,
        [
            "momento",
            "Momento",
            "etapa",
            "Etapa",
            "categoria",
            "Categoría",
            "categoria_principal",
            "trayectoria",
            "Trayectoria"
        ]
    );
}


/* =========================================================
   12. ETAPAS DEL MAPA DE TRAYECTORIA
   ========================================================= */

const TRAJECTORY_STAGES = [
    {
        key: "punto-de-partida",
        label: "Punto de partida",
        aliases: [
            "punto de partida"
        ]
    },
    {
        key: "descubrimientos",
        label: "Descubrimientos",
        aliases: [
            "descubrimientos"
        ]
    },
    {
        key: "lo-que-moviliza",
        label: "Lo que moviliza",
        aliases: [
            "lo que moviliza"
        ]
    },
    {
        key: "genera-estudiantes",
        label: "Lo que genera",
        aliases: [
            "clases de pelicula genera en los estudiantes",
            "lo que genera",
            "genera en los estudiantes"
        ]
    },
    {
        key: "lo-que-transforma",
        label: "Lo que transforma",
        aliases: [
            "lo que transforma"
        ]
    },
    {
        key: "lo-que-permanece",
        label: "Lo que permanece",
        aliases: [
            "lo que permanece"
        ]
    }
];


const PROJECTION_STAGES = [
    {
        key: "mantener",
        label: "Mantener",
        aliases: [
            "mantener"
        ]
    },
    {
        key: "transformar",
        label: "Transformar",
        aliases: [
            "transformar"
        ]
    },
    {
        key: "explorar",
        label: "Explorar",
        aliases: [
            "explorar"
        ]
    }
];


let activeTrajectoryStage =
    TRAJECTORY_STAGES[0].key;

let activeProjectionStage =
    PROJECTION_STAGES[0].key;

let activeTrajectoryTheme = 0;
let activeProjectionTheme = 0;


/* =========================================================
   13. INICIALIZACIÓN DEL MAPA DE TRAYECTORIA
   ========================================================= */

function initTrayectoria() {
    initTrajectoryModeSelector();

    renderTrajectoryNavigation(
        "trayectoria-navigation",
        TRAJECTORY_STAGES,
        activeTrajectoryStage,
        "trayectoria"
    );

    renderTrajectoryNavigation(
        "projection-navigation",
        PROJECTION_STAGES,
        activeProjectionStage,
        "proyeccion"
    );

    renderTrajectoryStage(
        activeTrajectoryStage,
        TRAJECTORY_STAGES,
        "trayectoria"
    );

    renderTrajectoryStage(
        activeProjectionStage,
        PROJECTION_STAGES,
        "proyeccion"
    );
}


/* =========================================================
   14. SELECTOR TRAYECTORIA / PROYECCIÓN
   ========================================================= */

function initTrajectoryModeSelector() {
    const buttons =
        document.querySelectorAll(
            ".mode-button"
        );

    buttons.forEach((button) => {
        button.addEventListener(
            "click",
            () => {
                const mode =
                    button.dataset.mode;

                buttons.forEach((item) => {
                    item.classList.toggle(
                        "active",
                        item.dataset.mode === mode
                    );
                });

                const trajectoryView =
                    document.getElementById(
                        "trajectory-view"
                    );

                const projectionView =
                    document.getElementById(
                        "projection-view"
                    );

                const showTrajectory =
                    mode === "trayectoria";

                if (trajectoryView) {
                    trajectoryView.hidden =
                        !showTrajectory;

                    trajectoryView.classList.toggle(
                        "active",
                        showTrajectory
                    );
                }

                if (projectionView) {
                    projectionView.hidden =
                        showTrajectory;

                    projectionView.classList.toggle(
                        "active",
                        !showTrajectory
                    );
                }
            }
        );
    });
}


/* =========================================================
   15. NAVEGACIÓN DEL MAPA DE TRAYECTORIA
   ========================================================= */

function renderTrajectoryNavigation(
    containerId,
    stages,
    activeStage,
    mode
) {
    const container =
        document.getElementById(containerId);

    if (!container) {
        return;
    }

    container.innerHTML = stages
        .map((stage) => {
            const isActive =
                stage.key === activeStage;

            return `
                <button
                    class="trajectory-step ${
                        isActive ? "active" : ""
                    }"
                    type="button"
                    data-stage="${stage.key}"
                    aria-pressed="${isActive}"
                >
                    ${escapeHTML(stage.label)}
                </button>
            `;
        })
        .join("");

    const buttons =
        container.querySelectorAll(
            ".trajectory-step"
        );

    buttons.forEach((button) => {
        button.addEventListener(
            "click",
            () => {
                const stageKey =
                    button.dataset.stage;

                if (mode === "trayectoria") {
                    activeTrajectoryStage =
                        stageKey;

                    activeTrajectoryTheme = 0;

                    renderTrajectoryNavigation(
                        containerId,
                        stages,
                        activeTrajectoryStage,
                        mode
                    );

                    renderTrajectoryStage(
                        activeTrajectoryStage,
                        stages,
                        mode
                    );

                } else {
                    activeProjectionStage =
                        stageKey;

                    activeProjectionTheme = 0;

                    renderTrajectoryNavigation(
                        containerId,
                        stages,
                        activeProjectionStage,
                        mode
                    );

                    renderTrajectoryStage(
                        activeProjectionStage,
                        stages,
                        mode
                    );
                }
            }
        );
    });
}


/* =========================================================
   16. FILTRADO POR ETAPA
   ========================================================= */

function recordMatchesStage(record, stage) {
    const recordStage =
        normalizeText(
            getTrajectoryStage(record)
        );

    const aliases =
        stage.aliases.map(normalizeText);

    return aliases.includes(recordStage);
}


function getRecordsForTrajectoryStage(stage) {
    const records =
        getTrayectoriaRecords();

    return records.filter((record) =>
        recordMatchesStage(record, stage)
    );
}


/* =========================================================
   17. RENDER DE ETAPA DE TRAYECTORIA
   ========================================================= */

function renderTrajectoryStage(
    stageKey,
    stages,
    mode
) {
    const stage = stages.find(
        (item) => item.key === stageKey
    );

    if (!stage) {
        return;
    }

    const records =
        getRecordsForTrajectoryStage(stage);

    const themes =
        groupRecordsByTheme(records);

    const isTrajectory =
        mode === "trayectoria";

    const titleId = isTrajectory
        ? "trayectoria-title"
        : "projection-title";

    const countId = isTrajectory
        ? "trayectoria-count"
        : "projection-count";

    const themesId = isTrajectory
        ? "trayectoria-themes"
        : "projection-themes";

    const detailId = isTrajectory
        ? "trayectoria-detail"
        : "projection-detail";

    const title =
        document.getElementById(titleId);

    const count =
        document.getElementById(countId);

    if (title) {
        title.textContent =
            stage.label;
    }

    if (count) {
        count.textContent =
            themes.length === 1
                ? "1 tema identificado"
                : `${themes.length} temas identificados`;
    }

    const activeIndex = isTrajectory
        ? activeTrajectoryTheme
        : activeProjectionTheme;

    const selectTheme = (index) => {
        if (isTrajectory) {
            activeTrajectoryTheme = index;
        } else {
            activeProjectionTheme = index;
        }

        renderTrajectoryStage(
            stageKey,
            stages,
            mode
        );
    };

    renderThemeList(
        themesId,
        themes,
        activeIndex,
        selectTheme
    );

    if (themes.length > 0) {
        const selectedTheme =
            themes[activeIndex] ||
            themes[0];

        renderFinding(
            detailId,
            selectedTheme,
            isTrajectory
                ? "Hallazgo de la trayectoria"
                : "Proyección"
        );
    } else {
        renderEmptyFinding(
            detailId
        );
    }
}


/* =========================================================
   18. CAMBIOS EN EL HASH DEL NAVEGADOR
   ========================================================= */

window.addEventListener(
    "hashchange",
    () => {
        const hash =
            window.location.hash.replace(
                "#",
                ""
            );

        const validViews = [
            "inicio",
            "docentes",
            "acerca"
        ];

        if (validViews.includes(hash)) {
            showView(hash, false);
        }
    }
);


/* =========================================================
   19. INICIO DE LA APLICACIÓN
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {
        initMainNavigation();
        initExerciseNavigation();
        loadData();
    }
);
