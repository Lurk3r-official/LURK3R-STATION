
const STORAGE_KEY = "lurk3r_projects";

let projects = [];

const projectsList = document.getElementById("projectsList");
const projectModal = document.getElementById("projectModal");
const projectForm = document.getElementById("projectForm");
const projectFilter = document.getElementById("projectFilter");

const createProjectBtn = document.getElementById("createProjectBtn");
const closeModal = document.getElementById("closeModal");

const totalProjects = document.getElementById("totalProjects");
const activeProjects = document.getElementById("activeProjects");
const completedProjects = document.getElementById("completedProjects");

const taskModal = document.getElementById("taskModal");
const taskForm = document.getElementById("taskForm");
const closeTaskModal = document.getElementById("closeTaskModal");

function loadProjects() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const data = saved ? JSON.parse(saved) : [];

        projects = Array.isArray(data) ? data : [];

        projects.forEach(project => {
            if (!Array.isArray(project.tasks)) {
                project.tasks = [];
            }
        });

    } catch (error) {
        console.error("Project loading error:", error);
        projects = [];
    }

    renderProjects();
}

function saveProjects() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

function calculateProgress(project) {
    const tasks = project.tasks || [];

    if (tasks.length === 0) {
        return project.status === "completed" ? 100 : 0;
    }

    const completedTasks = tasks.filter(task => task.completed).length;

    return Math.round((completedTasks / tasks.length) * 100);
}

function openModal(project = null) {
    projectForm.reset();

    document.getElementById("projectId").value = project
        ? String(project.id)
        : "";

    document.getElementById("modalTitle").textContent = project
        ? "EDIT PROJECT"
        : "NEW PROJECT";

    document.getElementById("projectName").value =
        project ? project.name : "";

    document.getElementById("projectDescription").value =
        project ? project.description : "";

    document.getElementById("projectCategory").value =
        project ? project.category : "";

    document.getElementById("projectStatus").value =
        project ? project.status : "planning";

    projectModal.classList.remove("hidden");
}

function hideModal() {
    projectModal.classList.add("hidden");
}

function openTaskModal(projectId, task = null) {
    taskForm.reset();

    document.getElementById("taskProjectId").value = String(projectId);
    document.getElementById("taskId").value = task ? String(task.id) : "";

    document.getElementById("taskModalTitle").textContent =
        task ? "EDIT TASK" : "NEW TASK";

    document.getElementById("taskName").value =
        task ? task.name : "";

    document.getElementById("taskSubmitBtn").textContent =
        task ? "SAVE CHANGES" : "ADD TASK";

    taskModal.classList.remove("hidden");
}

function hideTaskModal() {
    taskModal.classList.add("hidden");
}

function createProject(name, description, category, status) {
    return {
        id: Date.now(),
        name,
        description,
        category,
        status,
        progress: status === "completed" ? 100 : 0,
        tasks: [],
        createdAt: new Date().toISOString()
    };
}

const editTask = document.createElement("button");
editTask.type = "button";
editTask.className = "edit-task";
editTask.textContent = "EDIT";

editTask.addEventListener("click", () => {
    openTaskModal(project.id, task);
});

function renderProjects() {
    const filter = projectFilter.value;

    const filtered = projects.filter(project => {
        return filter === "all" || project.status === filter;
    });

    totalProjects.textContent = projects.length;

    activeProjects.textContent = projects.filter(
        project => project.status === "in-progress"
    ).length;

    completedProjects.textContent = projects.filter(
        project => project.status === "completed"
    ).length;

    projectsList.replaceChildren();

    if (filtered.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty-state";

        const symbol = document.createElement("span");
        symbol.textContent = "◇";

        const title = document.createElement("h3");
        title.textContent = projects.length === 0
            ? "NO PROJECTS FOUND"
            : "NO MATCHING PROJECTS";

        const description = document.createElement("p");
        description.textContent = projects.length === 0
            ? "Create your first project to initialize your workspace."
            : "Try another project filter.";

        empty.append(symbol, title, description);
        projectsList.appendChild(empty);
        return;
    }

    filtered.forEach(project => {
        const card = document.createElement("article");
        card.className = "project-card";

        const category = document.createElement("span");
        category.className = "project-category";
        category.textContent = project.category || "GENERAL";

        const title = document.createElement("h3");
        title.textContent = project.name;

        const description = document.createElement("p");
        description.textContent =
            project.description || "No description provided.";

        const status = document.createElement("span");
        status.className = "project-status";

        const statusNames = {
            planning: "PLANNING",
            "in-progress": "IN PROGRESS",
            completed: "COMPLETED"
        };

        status.textContent = statusNames[project.status] || "PLANNING";

        const progressValue = calculateProgress(project);
        project.progress = progressValue;

        const progress = document.createElement("div");
        progress.className = "project-progress";

        const progressInfo = document.createElement("div");
        progressInfo.className = "progress-info";

        const progressLabel = document.createElement("span");
        progressLabel.textContent = "PROGRESS";

        const progressNumber = document.createElement("span");
        progressNumber.textContent = `${progressValue}%`;

        const track = document.createElement("div");
        track.className = "progress-track";

        const fill = document.createElement("div");
        fill.className = "progress-fill";
        fill.style.width = `${progressValue}%`;

        progressInfo.append(progressLabel, progressNumber);
        track.appendChild(fill);
        progress.append(progressInfo, track);

        // TASK SECTION
        const taskSection = document.createElement("div");
        taskSection.className = "task-section";

        const taskHeading = document.createElement("h4");
        taskHeading.textContent =
            `TASKS (${project.tasks.length})`;

        const taskList = document.createElement("div");
        taskList.className = "task-list";

        project.tasks.forEach(task => {
            const taskRow = document.createElement("div");
            taskRow.className = "task-item";

            const taskToggle = document.createElement("button");
            taskToggle.type = "button";
            taskToggle.className = "task-toggle";
            taskToggle.textContent = task.completed ? "✓" : "○";

            if (task.completed) {
                taskToggle.classList.add("task-done");
            }

            taskToggle.addEventListener("click", () => {
                task.completed = !task.completed;
                project.progress = calculateProgress(project);
                saveProjects();
                renderProjects();
            });

            const taskName = document.createElement("span");
            taskName.className = task.completed
                ? "task-name task-completed"
                : "task-name";

            taskName.textContent = task.name;

            const editTask = document.createElement("button");

            editTask.type = "button";
            editTask.className = "edit-task";
            editTask.textContent = "EDIT";

            editTask.addEventListener("click", () => {
            openTaskModal(project.id, task);
            });
          
            const deleteTask = document.createElement("button");
            deleteTask.type = "button";
            deleteTask.className = "delete-task";
            deleteTask.textContent = "×";
            deleteTask.setAttribute("aria-label", "Delete task");

            deleteTask.addEventListener("click", () => {
                if (!confirm(`Delete task "${task.name}"?`)) {
                    return;
                }

                project.tasks = project.tasks.filter(
                    item => item.id !== task.id
                );

                project.progress = calculateProgress(project);

                saveProjects();
                renderProjects();
            });

            taskRow.append(taskToggle, taskName, editTask, deleteTask);
            taskList.appendChild(taskRow);
        });

        const addTaskButton = document.createElement("button");
        addTaskButton.type = "button";
        addTaskButton.className = "add-task-btn";
        addTaskButton.textContent = "+ ADD TASK";

        addTaskButton.addEventListener("click", () => {
            openTaskModal(project.id);
        });

        taskSection.append(
            taskHeading,
            taskList,
            addTaskButton
        );

        // PROJECT ACTIONS
        const actions = document.createElement("div");
        actions.className = "project-actions";

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.textContent = "EDIT";

        editButton.addEventListener("click", () => {
            openModal(project);
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "delete-project";
        deleteButton.textContent = "DELETE";

        deleteButton.addEventListener("click", () => {
            if (!confirm(`Delete "${project.name}" permanently?`)) {
                return;
            }

            projects = projects.filter(
                item => item.id !== project.id
            );

            saveProjects();
            renderProjects();
        });

        actions.append(editButton, deleteButton);

        card.append(
            category,
            title,
            description,
            status,
            progress,
            taskSection,
            actions
        );

        projectsList.appendChild(card);
    });
}

// CREATE PROJECT
createProjectBtn.addEventListener("click", () => {
    openModal();
});

closeModal.addEventListener("click", hideModal);

projectModal.addEventListener("click", event => {
    if (event.target === projectModal) {
        hideModal();
    }
});

projectFilter.addEventListener("change", renderProjects);

projectForm.addEventListener("submit", event => {
    event.preventDefault();

    const id = document.getElementById("projectId").value;
    const name = document.getElementById("projectName").value.trim();
    const description = document.getElementById("projectDescription").value.trim();
    const category = document.getElementById("projectCategory").value.trim();
    const status = document.getElementById("projectStatus").value;

    if (!name) {
        alert("Project name is required.");
        return;
    }

    if (id) {
        const project = projects.find(
            item => item.id === Number(id)
        );

        if (!project) {
            alert("Project not found.");
            return;
        }

        project.name = name;
        project.description = description;
        project.category = category;
        project.status = status;

        if (project.tasks.length === 0) {
            project.progress = status === "completed" ? 100 : 0;
        }

    } else {
        projects.unshift(
            createProject(name, description, category, status)
        );
    }

    saveProjects();
    renderProjects();
    hideModal();
});

// ADD OR EDIT TASK
taskForm.addEventListener("submit", event => {
    event.preventDefault();

    const projectId = Number(
        document.getElementById("taskProjectId").value
    );

    const taskId = document.getElementById("taskId").value;
    const taskName = document.getElementById("taskName").value.trim();

    if (!taskName) {
        alert("Task name is required.");
        return;
    }

    const project = projects.find(
        item => item.id === projectId
    );

    if (!project) {
        alert("Project not found.");
        return;
    }

    if (taskId) {
        const task = project.tasks.find(
            item => item.id === Number(taskId)
        );

        if (!task) {
            alert("Task not found.");
            return;
        }

        task.name = taskName;

    } else {
        project.tasks.push({
            id: Date.now(),
            name: taskName,
            completed: false
        });
    }

    project.progress = calculateProgress(project);

    saveProjects();
    renderProjects();
    hideTaskModal();
});

closeTaskModal.addEventListener("click", hideTaskModal);

taskModal.addEventListener("click", event => {
    if (event.target === taskModal) {
        hideTaskModal();
    }
});

loadProjects();
