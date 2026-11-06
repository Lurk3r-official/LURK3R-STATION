
console.log("LURK3R STATION initialized.");

const WORKER_URL = "https://lurk3r-ai-engine.bsupercell705.workers.dev";
const STORAGE_KEY = "lurk3r_chat_history";
const ACCESS_STORAGE_KEY = "lurk3r_access_key";
const MAX_MESSAGES = 500;

function initializeExportChat() {
    const exportButton = document.getElementById("exportChat");


    if (!exportButton) return;


    exportButton.addEventListener("click", () => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            const conversation = saved ? JSON.parse(saved) : [];


            if (!Array.isArray(conversation) || conversation.length === 0) {
                alert("No chat history to export.");
                return;
            }


            const content = conversation.map(item => {
                const sender = item.role === "user" ? "YOU" : "LURK3R AI";
                return `${sender}:\n${item.content}`;
            }).join("\n\n-------------------------\n\n");


            const file = new Blob(
                [content],
                { type: "text/plain;charset=utf-8" }
            );


            const url = URL.createObjectURL(file);
            const link = document.createElement("a");


            link.href = url;
            link.download = "LURK3R_CHAT_HISTORY.txt";


            document.body.appendChild(link);
            link.click();
            link.remove();


            setTimeout(() => URL.revokeObjectURL(url), 1000);


        } catch (error) {
            console.error("Export error:", error);
            alert("Chat export failed.");
        }
    });
}

function initializeClearChat() {
    const clearButton = document.getElementById("clearChat");
    const chatContent = document.querySelector(".chat-content");

    if (!clearButton || !chatContent) return;

    clearButton.addEventListener("click", () => {
        if (!confirm("Are you sure you want to clear the chat history?")) {
            return;
        }

        localStorage.removeItem(STORAGE_KEY);

        const messages = chatContent.querySelectorAll(
            ".ai-message, .user-message, .ai-loading"
        );

        messages.forEach(message => message.remove());

        const welcome = document.createElement("div");
        welcome.className = "ai-message";

        const title = document.createElement("strong");
        title.textContent = "LURK3R AI";

        const paragraph = document.createElement("p");
        paragraph.textContent = "Conversation cleared. How can I assist you?";

        welcome.append(title, paragraph);
        chatContent.appendChild(welcome);

        chatContent.scrollTop = chatContent.scrollHeight;
    });
}

function initializeChat() {
    const chatContent = document.querySelector(".chat-content");
    const input = document.querySelector(".chat-input input");
    const button = document.querySelector(".chat-input button");
    const notice = document.querySelector(".api-notice");

    if (!chatContent || !input || !button) return;

    let sending = false;
    let conversation = [];

    let accessKey = sessionStorage.getItem(ACCESS_STORAGE_KEY);

    if (!accessKey) {
        accessKey = window.prompt("LURK3R ACCESS KEY:");

        if (accessKey && accessKey.trim()) {
            accessKey = accessKey.trim();
            sessionStorage.setItem(ACCESS_STORAGE_KEY, accessKey);
        } else {
            accessKey = "";
        }
    }

    if (!accessKey) {
        input.disabled = true;
        button.disabled = true;

        if (notice) notice.textContent = "ACCESS DENIED";
        return;
    }

    async function apiRequest(path, options = {}) {
        const response = await fetch(`${WORKER_URL}${path}`, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                "X-Lurk3r-Key": accessKey,
                ...(options.headers || {})
            }
        });

        const raw = await response.text();
        let data;

        try {
            data = JSON.parse(raw);
        } catch {
            throw new Error(`Invalid response (HTTP ${response.status})`);
        }

        if (!response.ok) {
            throw new Error(data.error || `HTTP ${response.status}`);
        }

        return data;
    }

    function saveHistory() {
        try {
            conversation = conversation.slice(-MAX_MESSAGES);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(conversation));
        } catch (error) {
            console.error("History save error:", error);
        }
    }

    function addMessage(sender, text, className = "ai-message") {
        const message = document.createElement("div");
        message.className = className;

        const title = document.createElement("strong");
        title.textContent = sender;

        const paragraph = document.createElement("p");
        paragraph.textContent = text;

        message.append(title, paragraph);
        chatContent.appendChild(message);
        chatContent.scrollTop = chatContent.scrollHeight;

        return message;
    }

    function loadHistory() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (!saved) return;

            const parsed = JSON.parse(saved);
            if (!Array.isArray(parsed)) return;

            conversation = parsed
                .filter(item =>
                    item &&
                    ["user", "assistant"].includes(item.role) &&
                    typeof item.content === "string"
                )
                .slice(-MAX_MESSAGES);

            conversation.forEach(item => {
                if (item.role === "user") {
                    addMessage("YOU", item.content, "user-message");
                } else {
                    addMessage("LURK3R AI", item.content, "ai-message");
                }
            });
        } catch (error) {
            console.error("History load error:", error);
            conversation = [];
        }
    }

    // MEMORY CONTROL

    function initializeMemoryPanel() {
        const list = document.getElementById("memoryList");
        const count = document.getElementById("memoryCount");
        const filter = document.getElementById("memoryFilter");
        const refresh = document.getElementById("refreshMemories");
        const clear = document.getElementById("clearMemories");
        const memoryNotice = document.getElementById("memoryNotice");

        if (!list || !count || !filter || !refresh || !clear) return;

        let memories = [];
        let editingId = null;

        function setNotice(message) {
            if (memoryNotice) {
                memoryNotice.textContent = message;
            }
        }

        function createButton(label, className, callback) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.textContent = label;
            btn.className = className;
            btn.addEventListener("click", callback);
            return btn;
        }

        function renderMemories() {
            list.replaceChildren();

            const selectedCategory = filter.value;

            const visible = memories.filter(memory =>
                selectedCategory === "all" ||
                memory.category === selectedCategory
            );

            count.textContent = `${visible.length} RECORDS`;

            if (visible.length === 0) {
                const empty = document.createElement("p");
                empty.className = "memory-empty";
                empty.textContent = "NO MEMORIES FOUND.";
                list.appendChild(empty);
                return;
            }

            visible.forEach(memory => {
                const card = document.createElement("article");
                card.className = "memory-item";

                if (editingId === memory.id) {
                    renderEditor(card, memory);
                } else {
                    renderCard(card, memory);
                }

                list.appendChild(card);
            });
        }

        function renderCard(card, memory) {
            const top = document.createElement("div");
            top.className = "memory-item-top";

            const category = document.createElement("span");
            category.className = "memory-category";
            category.textContent = String(memory.category || "general").toUpperCase();

            const actions = document.createElement("div");
            actions.className = "memory-actions";

            actions.append(
                createButton("EDIT", "memory-edit", () => {
                    editingId = memory.id;
                    renderMemories();
                }),
                createButton("DELETE", "memory-delete", async () => {
                    if (!confirm("Delete this memory?")) return;

                    try {
                        await apiRequest(`/api/memories/${memory.id}`, {
                            method: "DELETE"
                        });

                        setNotice("MEMORY DELETED.");
                        await loadMemories();
                    } catch (error) {
                        setNotice(`ERROR: ${error.message}`);
                    }
                })
            );

            top.append(category, actions);

            const content = document.createElement("p");
            content.textContent = memory.content;

            card.append(top, content);
        }

        function renderEditor(card, memory) {
            const textarea = document.createElement("textarea");
            textarea.className = "memory-edit-area";
            textarea.value = memory.content;
            textarea.maxLength = 500;

            const select = document.createElement("select");
            select.className = "memory-category-select";

            const categories = [
                ["preference", "PREFERENCE"],
                ["project", "PROJECT"],
                ["goal", "GOAL"],
                ["interest", "INTEREST"],
                ["general", "GENERAL"]
            ];

            categories.forEach(([value, label]) => {
                const option = document.createElement("option");
                option.value = value;
                option.textContent = label;
                select.appendChild(option);
            });

            select.value = memory.category || "general";

            const actions = document.createElement("div");
            actions.className = "memory-actions";

            actions.append(
                createButton("SAVE", "memory-edit", async () => {
                    const content = textarea.value.trim();

                    if (!content) {
                        setNotice("MEMORY CANNOT BE EMPTY.");
                        return;
                    }

                    try {
                        await apiRequest(`/api/memories/${memory.id}`, {
                            method: "PUT",
                            body: JSON.stringify({
                                content,
                                category: select.value
                            })
                        });

                        editingId = null;
                        setNotice("MEMORY UPDATED.");
                        await loadMemories();
                    } catch (error) {
                        setNotice(`ERROR: ${error.message}`);
                    }
                }),
                createButton("CANCEL", "memory-delete", () => {
                    editingId = null;
                    renderMemories();
                })
            );

            card.append(textarea, select, actions);
        }

        async function loadMemories() {
            list.replaceChildren();

            const loading = document.createElement("p");
            loading.className = "memory-empty";
            loading.textContent = "LOADING MEMORIES...";
            list.appendChild(loading);

            try {
                const data = await apiRequest("/api/memories");

                memories = Array.isArray(data)
                    ? data
                    : Array.isArray(data.memories)
                        ? data.memories
                        : [];

                editingId = null;
                renderMemories();
                setNotice("MEMORY SYSTEM: ONLINE");
            } catch (error) {
                memories = [];
                count.textContent = "0 RECORDS";
                list.replaceChildren();

                const message = document.createElement("p");
                message.className = "memory-empty";
                message.textContent = `FAILED TO LOAD: ${error.message}`;
                list.appendChild(message);

                setNotice("MEMORY SYSTEM: ERROR");
            }
        }

        filter.addEventListener("change", renderMemories);
        refresh.addEventListener("click", loadMemories);

        clear.addEventListener("click", async () => {
            if (memories.length === 0) {
                setNotice("NO MEMORIES TO DELETE.");
                return;
            }

            if (!confirm("WARNING: DELETE ALL MEMORIES?")) return;

            try {
                await apiRequest("/api/memories", {
                    method: "DELETE"
                });

                editingId = null;
                setNotice("ALL MEMORIES DELETED.");
                await loadMemories();
            } catch (error) {
                setNotice(`ERROR: ${error.message}`);
            }
        });

        loadMemories();
    }

    input.disabled = false;
    button.disabled = false;

    if (notice) notice.textContent = "ACCESS KEY ENTERED";

    loadHistory();

    const newChatButton = document.getElementById("newChat");


    if (newChatButton) {
        newChatButton.addEventListener("click", () => {
            if (!confirm("Start a new chat? Current conversation will be archived.")) {
                return;
            }


            try {
                const saved = localStorage.getItem(STORAGE_KEY);
                const currentMessages = saved ? JSON.parse(saved) : [];


                if (Array.isArray(currentMessages) && currentMessages.length > 0) {
                    const archiveKey = "lurk3r_chat_archives";


                    const oldArchives = JSON.parse(
                        localStorage.getItem(archiveKey) || "[]"
                    );


                    const archives = Array.isArray(oldArchives)
                        ? oldArchives
                        : [];


                    archives.unshift({
                        id: Date.now(),
                        createdAt: new Date().toISOString(),
                        messages: currentMessages
                    });


                    localStorage.setItem(
                        archiveKey,
                        JSON.stringify(archives.slice(0, 50))
                    );
                }


                conversation = [];
                saveHistory();


                chatContent.replaceChildren();


                addMessage(
                    "LURK3R AI",
                    "New conversation started. How can I assist you?",
                    "ai-message"
                );


            } catch (error) {
                console.error("New chat error:", error);
                alert("Unable to create a new chat. Your current conversation was preserved.");
            }
        });
    }

    function initializeArchivePanel() {
        const archiveList = document.getElementById("archiveList");
        const archiveCount = document.getElementById("archiveCount");
        const refreshButton = document.getElementById("refreshArchives");


        if (!archiveList || !archiveCount) return;


        const archiveKey = "lurk3r_chat_archives";


        function getArchives() {
            try {
                const saved = localStorage.getItem(archiveKey);
                const archives = saved ? JSON.parse(saved) : [];
                return Array.isArray(archives) ? archives : [];
            } catch (error) {
                console.error("Archive loading error:", error);
                return [];
            }
        }


        function renderArchives() {
            const archives = getArchives();


            const searchTerm = document.getElementById("archiveSearch")
                ?.value.trim().toLowerCase() || "";


            const filteredArchives = archives
                .map((archive, index) => ({ archive, index }))
                .filter(({ archive }) => {
                    const name = (archive.name || "").toLowerCase();


                    const content = (Array.isArray(archive.messages) ? archive.messages : [])
                        .map(message => message.content || "")
                        .join(" ")
                        .toLowerCase();


                    return name.includes(searchTerm) || content.includes(searchTerm);
                });


            archiveList.replaceChildren();
            archiveCount.textContent = `${filteredArchives.length} ARCHIVES`;


            if (filteredArchives.length === 0) {
                const empty = document.createElement("p");
                empty.className = "archive-empty";
                empty.textContent = searchTerm
                    ? "NO RESULTS FOUND"
                    : "NO ARCHIVES FOUND";
                archiveList.appendChild(empty);
                return;
            }


            filteredArchives.forEach(({ archive, index }, displayIndex) => {
                const item = document.createElement("div");
                item.className = "archive-item";


                const top = document.createElement("div");
                top.className = "archive-item-top";


                const title = document.createElement("span");
                title.className = "archive-item-title";
                title.textContent = archive.name || `ARCHIVE #${index + 1}`;


                const meta = document.createElement("p");
                meta.className = "archive-meta";


                const date = new Date(archive.createdAt);
                const dateText = isNaN(date.getTime())
                    ? "UNKNOWN DATE"
                    : date.toLocaleString();


                const messages = Array.isArray(archive.messages)
                    ? archive.messages
                    : [];


                meta.textContent =
                    `${dateText} · ${messages.length} MESSAGES`;


                top.appendChild(title);
                item.append(top, meta);


                const actions = document.createElement("div");
                actions.className = "archive-actions";


                const openButton = document.createElement("button");
                openButton.type = "button";
                openButton.textContent = "OPEN";


                openButton.addEventListener("click", () => {
                    if (messages.length === 0) {
                        alert("This archive is empty.");
                        return;
                    }


                    if (!confirm(
                        "Open this archive? Your current conversation will be archived first."
                    )) {
                        return;
                    }


                    try {
                        const currentMessages = Array.isArray(conversation)
                            ? JSON.parse(JSON.stringify(conversation))
                            : [];


                        const updatedArchives = getArchives();


                        if (currentMessages.length > 0) {
                            updatedArchives.unshift({
                                id: Date.now(),
                                createdAt: new Date().toISOString(),
                                messages: currentMessages
                            });
                        }


                        localStorage.setItem(
                            archiveKey,
                            JSON.stringify(updatedArchives.slice(0, 50))
                        );


                        conversation = JSON.parse(
                            JSON.stringify(messages)
                        );


                        saveHistory();
                        chatContent.replaceChildren();


                        conversation.forEach(message => {
                            addMessage(
                                message.role === "user" ? "YOU" : "LURK3R AI",
                                message.content,
                                message.role === "user"
                                    ? "user-message"
                                    : "ai-message"
                            );
                        });


                        renderArchives();


                    } catch (error) {
                        console.error("Archive open error:", error);
                        alert("Unable to open this archive.");
                    }
                });


                const deleteButton = document.createElement("button");
                deleteButton.type = "button";
                deleteButton.className = "archive-delete";
                deleteButton.textContent = "DELETE";

                const renameButton = document.createElement("button");
                renameButton.type = "button";
                renameButton.textContent = "RENAME";


                renameButton.addEventListener("click", () => {
                    const currentName = archive.name || `ARCHIVE #${index + 1}`;


                    const newName = prompt(
                        "Enter a new archive name:",
                        currentName
                    );


                    if (newName === null) return;


                    const cleanName = newName.trim();


                    if (!cleanName) {
                        alert("Archive name cannot be empty.");
                        return;
                    }


                    if (cleanName.length > 40) {
                        alert("Archive name must be 40 characters or less.");
                        return;
                    }


                    const updatedArchives = getArchives();
                    const targetArchive = updatedArchives.find(
                        item => item.id === archive.id
                    );


                    if (!targetArchive) {
                        alert("Archive not found.");
                        return;
                    }


                    targetArchive.name = cleanName;


                    localStorage.setItem(
                        archiveKey,
                        JSON.stringify(updatedArchives)
                    );


                    renderArchives();
                });


                deleteButton.addEventListener("click", () => {
                    if (!confirm("Delete this archive permanently?")) {
                        return;
                    }


                    const updatedArchives = getArchives();
                    updatedArchives.splice(index, 1);


                    localStorage.setItem(
                        archiveKey,
                        JSON.stringify(updatedArchives)
                    );


                    renderArchives();
                });


                actions.append(openButton, renameButton, deleteButton);
                item.appendChild(actions);
                archiveList.appendChild(item);
            });
        }


        if (refreshButton) {
            refreshButton.addEventListener("click", renderArchives);
        }


        const archiveSearch = document.getElementById("archiveSearch");


        if (archiveSearch) {
            archiveSearch.addEventListener("input", renderArchives);
        }


        renderArchives();
    }

    initializeClearChat();
    initializeExportChat();
    initializeMemoryPanel();
    initializeArchivePanel();

    async function sendMessage() {
        const message = input.value.trim();

        if (!message || sending) return;

        sending = true;

        conversation.push({
            role: "user",
            content: message
        });

        saveHistory();
        addMessage("YOU", message, "user-message");

        input.value = "";
        input.disabled = true;
        button.disabled = true;

        let loading = null;

        try {
            loading = addMessage(
                "LURK3R AI",
                "Processing request...",
                "ai-loading"
            );

            const data = await apiRequest("/api/chat", {
                method: "POST",
                body: JSON.stringify({
                    message,
                    history: conversation.slice(-MAX_MESSAGES)
                })
            });

            if (typeof data.reply !== "string" || !data.reply.trim()) {
                throw new Error("AI returned an empty response.");
            }

            conversation.push({
                role: "assistant",
                content: data.reply
            });

            saveHistory();
            addMessage("LURK3R AI", data.reply, "ai-message");

        } catch (error) {
            console.error("LURK3R AI error:", error);

            addMessage(
                "SYSTEM ERROR",
                error.message || "Connection failed.",
                "ai-message"
            );
        } finally {
            if (loading && loading.parentNode) loading.remove();

            sending = false;
            input.disabled = false;
            button.disabled = false;
            input.focus();
        }
    }

    button.addEventListener("click", sendMessage);

    input.addEventListener("keydown", event => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    });

    console.log("LURK3R AI and Memory Control initialized.");
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeChat);
} else {
    initializeChat();
}
