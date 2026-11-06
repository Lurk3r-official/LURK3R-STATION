"use strict";

const workspace = document.getElementById("workspace");

const STORAGE_KEY = "lurk3r_music_library";
const LYRICS_KEY = "lurk3r_saved_lyrics";

/* =====================================
   GENERAL FUNCTIONS
===================================== */

function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text)
            .then(() => alert("Copied successfully."))
            .catch(() => fallbackCopy(text));
    } else {
        fallbackCopy(text);
    }
}

function fallbackCopy(text) {
    const field = document.createElement("textarea");
    field.value = text;
    field.style.position = "fixed";
    field.style.opacity = "0";

    document.body.appendChild(field);
    field.select();

    try {
        document.execCommand("copy");
        alert("Copied successfully.");
    } catch {
        alert("Copy failed.");
    }

    field.remove();
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function activateWorkspace() {
    workspace.classList.add("workspace-active");

    const closeButton = document.createElement("button");
    closeButton.className = "workspace-close";
    closeButton.type = "button";
    closeButton.textContent = "×";
    closeButton.setAttribute("aria-label", "Close workspace");

    closeButton.addEventListener("click", () => {
        workspace.classList.remove("workspace-active");

        workspace.innerHTML = `
            <p class="workspace-placeholder">
                SELECT A MODULE TO INITIALIZE WORKSPACE
            </p>
        `;
    });

    workspace.prepend(closeButton);
}

/* =====================================
   SUNO
===================================== */

function openSuno() {
    window.open("https://suno.com", "_blank");
}

/* =====================================
   LYRICS STUDIO
===================================== */

function getSavedLyrics() {
    try {
        const data = JSON.parse(localStorage.getItem(LYRICS_KEY));
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
}

function saveLyricsData(data) {
    localStorage.setItem(LYRICS_KEY, JSON.stringify(data));
}

function openLyrics() {
    workspace.innerHTML = `
        <h2>LYRICS STUDIO</h2>
        <p>Write, edit and save your lyrics.</p>

        <input id="lyricsId" type="hidden">

        <input id="lyricsTitle"
            placeholder="SONG TITLE">

        <textarea id="lyricsText"
            placeholder="[Verse 1]&#10;Write your lyrics here..."
            rows="12"></textarea>

        <button class="primary-action" id="saveLyrics">
            SAVE LYRICS
        </button>

        <button class="primary-action" id="copyLyrics">
            COPY LYRICS
        </button>

        <h3 style="margin-top:30px;">SAVED LYRICS</h3>
        <div id="savedLyricsList"></div>
    `;

    const titleInput = document.getElementById("lyricsTitle");
    const textInput = document.getElementById("lyricsText");
    const idInput = document.getElementById("lyricsId");
    const list = document.getElementById("savedLyricsList");

    function renderLyrics() {
        list.innerHTML = "";

        const songs = getSavedLyrics();

        if (!songs.length) {
            list.textContent = "No saved lyrics yet.";
            return;
        }

        songs.forEach(song => {
            const item = document.createElement("div");
            item.className = "library-item";

            const title = document.createElement("strong");
            title.textContent = song.title;

            const openButton = document.createElement("button");
            openButton.className = "primary-action";
            openButton.textContent = "OPEN";

            openButton.onclick = () => {
                idInput.value = song.id;
                titleInput.value = song.title;
                textInput.value = song.text;
            };

            const deleteButton = document.createElement("button");
            deleteButton.className = "delete-music";
            deleteButton.textContent = "DELETE";

            deleteButton.onclick = () => {
                const updated = getSavedLyrics().filter(
                    entry => entry.id !== song.id
                );

                saveLyricsData(updated);
                renderLyrics();
            };

            item.append(title, openButton, deleteButton);
            list.appendChild(item);
        });
    }

    document.getElementById("saveLyrics").onclick = () => {
        const title = titleInput.value.trim();
        const text = textInput.value.trim();

        if (!title || !text) {
            alert("Song title and lyrics are required.");
            return;
        }

        const songs = getSavedLyrics();
        const existingId = idInput.value;

        if (existingId) {
            const song = songs.find(
                entry => String(entry.id) === String(existingId)
            );

            if (song) {
                song.title = title;
                song.text = text;
            }
        } else {
            songs.push({
                id: Date.now(),
                title,
                text
            });
        }

        saveLyricsData(songs);

        idInput.value = "";
        titleInput.value = "";
        textInput.value = "";

        renderLyrics();
        alert("Lyrics saved.");
    };

    document.getElementById("copyLyrics").onclick = () => {
        if (!textInput.value.trim()) {
            alert("There are no lyrics to copy.");
            return;
        }

        copyText(textInput.value);
    };

    renderLyrics();
    activateWorkspace();
}

/* =====================================
   PROMPT ENGINEER 2.0
===================================== */

function openPrompt() {

    const DATA = window.PROMPT_DATA;

if (!DATA || !["genre", "mood", "vocals", "instruments", "production"]
    .every(key => Array.isArray(DATA[key]))) {
    workspace.innerHTML = `
        <p style="color:#ff5555">
            Prompt verileri yüklenemedi. prompt-data.js dosyasını kontrol et.
        </p>
    `;
    activateWorkspace();
    return;
}

    /* EXTERNAL PROMPT DATA */

    const config = window.LURK3R_PROMPT_CONFIG;

    if (config && config.modifiers && config.targets) {
        Object.keys(DATA).forEach(category => {

            const base = [...new Set(DATA[category])];
            const expanded = [...base];
            const existing = new Set(expanded);

            const modifiers = config.modifiers[category] || [];
            const target = Number(config.targets[category]) || expanded.length;

            for (const modifier of modifiers) {
                for (const item of base) {
                    const option = `${item} — ${modifier}`;

                    if (!existing.has(option)) {
                        expanded.push(option);
                        existing.add(option);
                    }

                    if (expanded.length >= target) break;
                }

                if (expanded.length >= target) break;
            }

            DATA[category] = expanded.slice(0, target);
        });
    }

    /* WORKSPACE */

    workspace.innerHTML = `
        <h2>PROMPT ENGINEER
            <span style="color:#a855f7">2.0</span>
        </h2>

        <p>Select multiple options from each category.</p>

        <div id="promptControls"></div>

        <div class="prompt-group">
            <label>BPM / TEMPO</label>
            <input id="promptBpm"
                type="number"
                min="30"
                max="300"
                placeholder="Enter BPM (e.g. 140)">
        </div>

        <div class="prompt-group">
            <label>ADDITIONAL CREATIVE DIRECTION</label>

            <textarea id="promptNotes"
                rows="4"
                placeholder="Describe the sound, atmosphere, structure or special details..."></textarea>
        </div>

        <button class="primary-action" id="generatePrompt">
            GENERATE PROMPT
        </button>

        <h3>GENERATED PROMPT</h3>

        <textarea id="generatedPrompt"
            rows="10"
            placeholder="Your music prompt will appear here..."></textarea>

        <button class="primary-action" id="copyGeneratedPrompt">
            COPY PROMPT
        </button>
    `;

    const controls = document.getElementById("promptControls");

    const selected = {
        genre: [],
        mood: [],
        vocals: [],
        instruments: [],
        production: []
    };

    const labels = {
        genre: "GENRE / SUBGENRE",
        mood: "MOOD / ATMOSPHERE",
        vocals: "VOCAL STYLE",
        instruments: "INSTRUMENTS",
        production: "PRODUCTION STYLE"
    };

    /* CATEGORY RENDERING */

    function renderCategories() {
        controls.innerHTML = "";

        Object.keys(DATA).forEach(category => {

            const group = document.createElement("div");
            group.className = "prompt-group";

            const heading = document.createElement("button");
            heading.type = "button";
            heading.className = "primary-action";
            heading.style.width = "100%";
            heading.style.textAlign = "left";

            const panel = document.createElement("div");
            panel.style.display = "none";
            panel.style.marginTop = "10px";

            const search = document.createElement("input");
            search.placeholder = "Search " + category + "...";

            const options = document.createElement("div");
            options.style.display = "grid";
            options.style.gridTemplateColumns =
                "repeat(auto-fit,minmax(140px,1fr))";
            options.style.gap = "7px";
            options.style.marginTop = "10px";

            function updateHeading() {
                heading.textContent =
                    labels[category] +
                    " (" + selected[category].length + ") ▼";
            }

            function renderOptions(filter = "") {
                options.innerHTML = "";

                const filtered = DATA[category].filter(item =>
                    item.toLowerCase().includes(filter.toLowerCase())
                );

                filtered.forEach(item => {

                    const option = document.createElement("button");
                    option.type = "button";

                    const isSelected =
                        selected[category].includes(item);

                    option.textContent =
                        (isSelected ? "✓ " : "+ ") + item;

                    option.className = "primary-action";
                    option.style.textAlign = "left";
                    option.style.margin = "0";

                    option.style.background = isSelected
                        ? "rgba(168,85,247,0.3)"
                        : "rgba(168,85,247,0.08)";

                    option.onclick = () => {

                        if (selected[category].includes(item)) {
                            selected[category] =
                                selected[category].filter(
                                    value => value !== item
                                );
                        } else {
                            selected[category].push(item);
                        }

                        updateHeading();
                        renderOptions(search.value);
                    };

                    options.appendChild(option);
                });

                if (!filtered.length) {
                    const empty = document.createElement("p");
                    empty.textContent = "No matching options.";
                    options.appendChild(empty);
                }
            }

            heading.onclick = () => {
                panel.style.display =
                    panel.style.display === "none"
                        ? "block"
                        : "none";
            };

            search.oninput = () => {
                renderOptions(search.value);
            };

            updateHeading();
            renderOptions();

            panel.append(search, options);
            group.append(heading, panel);
            controls.appendChild(group);
        });
    }

    /* GENERATE PROMPT */

    document.getElementById("generatePrompt").onclick = () => {

        const bpm = document.getElementById("promptBpm").value.trim();
        const notes = document.getElementById("promptNotes").value.trim();

        if (bpm && (
            !Number.isInteger(Number(bpm)) ||
            Number(bpm) < 30 ||
            Number(bpm) > 300
        )) {
            alert("BPM must be an integer between 30 and 300.");
            return;
        }

        const parts = [];

        if (selected.genre.length) {
            parts.push("Genres: " + selected.genre.join(", "));
        }

        if (selected.mood.length) {
            parts.push(
                "Mood and atmosphere: " +
                selected.mood.join(", ")
            );
        }

        if (bpm) {
            parts.push("Tempo: " + bpm + " BPM");
        }

        if (selected.vocals.length) {
            parts.push(
                "Vocal style: " +
                selected.vocals.join(", ")
            );
        }

        if (selected.instruments.length) {
            parts.push(
                "Instrumentation: " +
                selected.instruments.join(", ")
            );
        }

        if (selected.production.length) {
            parts.push(
                "Production: " +
                selected.production.join(", ")
            );
        }

        if (notes) {
            parts.push(
                "Additional creative direction: " + notes
            );
        }

        if (!parts.length) {
            alert("Select at least one option or enter a BPM.");
            return;
        }

        parts.push(
            "Create a cohesive, professionally arranged track. " +
            "Maintain musical consistency, clear structure, " +
            "balanced mixing and high-quality sound design."
        );

        document.getElementById("generatedPrompt").value =
            parts.join(". ") + ".";
    };

    /* COPY PROMPT */

    document.getElementById("copyGeneratedPrompt").onclick = () => {

        const prompt =
            document.getElementById("generatedPrompt").value;

        if (!prompt.trim()) {
            alert("Generate a prompt first.");
            return;
        }

        copyText(prompt);
    };

    renderCategories();
    activateWorkspace();
}

/* =====================================
   MUSIC LIBRARY
===================================== */

function getLibrary() {
    try {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
}

function saveLibrary(library) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
}

function openLibrary() {

    workspace.innerHTML = `
        <h2>MUSIC LIBRARY</h2>
        <p>Store your music projects and links.</p>

        <input id="musicTitle"
            placeholder="SONG / PROJECT TITLE">

        <input id="musicLink"
            placeholder="MUSIC LINK (OPTIONAL)">

        <button class="primary-action" id="saveMusic">
            SAVE PROJECT
        </button>

        <div id="libraryList"></div>
    `;

    const list = document.getElementById("libraryList");

    function renderLibrary() {

        const items = getLibrary();
        list.innerHTML = "";

        if (!items.length) {
            list.textContent = "No saved projects yet.";
            return;
        }

        items.forEach((item, index) => {

            const container = document.createElement("div");
            container.className = "library-item";

            const title = document.createElement("strong");
            title.textContent = item.title;

            container.appendChild(title);

            if (item.link) {
                const link = document.createElement("a");

                link.href = item.link;
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                link.textContent = "OPEN LINK ↗";

                container.appendChild(link);
            }

            const deleteButton = document.createElement("button");
            deleteButton.className = "delete-music";
            deleteButton.textContent = "DELETE";

            deleteButton.onclick = () => {
                const current = getLibrary();
                current.splice(index, 1);

                saveLibrary(current);
                renderLibrary();
            };

            container.appendChild(deleteButton);
            list.appendChild(container);
        });
    }

    document.getElementById("saveMusic").onclick = () => {

        const title =
            document.getElementById("musicTitle").value.trim();

        const link =
            document.getElementById("musicLink").value.trim();

        if (!title) {
            alert("Project title is required.");
            return;
        }

        if (link) {
            try {
                const url = new URL(link);

                if (!["http:", "https:"].includes(url.protocol)) {
                    throw new Error();
                }
            } catch {
                alert("Enter a valid HTTP or HTTPS link.");
                return;
            }
        }

        const items = getLibrary();

        items.push({
            title,
            link
        });

        saveLibrary(items);

        document.getElementById("musicTitle").value = "";
        document.getElementById("musicLink").value = "";

        renderLibrary();
    };

    renderLibrary();
    activateWorkspace();
}

/* =====================================
   EVENT LISTENERS
===================================== */

document.addEventListener("DOMContentLoaded", () => {
    const suno = document.getElementById("openSuno");
    const lyrics = document.getElementById("openLyrics");
    const prompt = document.getElementById("openPrompt");
    const library = document.getElementById("openLibrary");

    if (suno) {
        suno.addEventListener("click", openSuno);
    }

    if (lyrics) {
        lyrics.addEventListener("click", openLyrics);
    }

    if (prompt) {
        prompt.addEventListener("click", openPrompt);
    }

    if (library) {
        library.addEventListener("click", openLibrary);
    }
});

/* =====================================
   INITIALIZATION
===================================== */

if (document.readyState !== "loading") {
    const suno = document.getElementById("openSuno");
    const lyrics = document.getElementById("openLyrics");
    const prompt = document.getElementById("openPrompt");
    const library = document.getElementById("openLibrary");

    if (suno) suno.addEventListener("click", openSuno);
    if (lyrics) lyrics.addEventListener("click", openLyrics);
    if (prompt) prompt.addEventListener("click", openPrompt);
    if (library) library.addEventListener("click", openLibrary);
}