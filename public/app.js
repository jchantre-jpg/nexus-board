const API = "/api";
const projectList = document.getElementById("projectList");
const columns = document.getElementById("columns");
const taskForm = document.getElementById("taskForm");
const statsEl = document.getElementById("stats");
const STATUSES = [
  { id: "todo", label: "Por hacer" },
  { id: "doing", label: "En curso" },
  { id: "done", label: "Hecho" },
];

let projects = [];
let tasks = [];
let activeId = null;

async function api(path, options) {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ? JSON.stringify(data.error) : res.statusText);
  return data;
}

async function refresh() {
  projects = await api("/projects");
  const s = await api("/stats");
  statsEl.innerHTML = `
    <div><strong>${s.projects}</strong> proyectos</div>
    <div><strong>${s.tasks}</strong> tareas · <strong>${s.done}</strong> hechas</div>
  `;
  if (!activeId && projects[0]) activeId = projects[0].id;
  renderProjects();
  if (activeId) await loadTasks(activeId);
  else {
    document.getElementById("activeTitle").textContent = "Selecciona un proyecto";
    document.getElementById("activeMeta").textContent = "—";
    taskForm.hidden = true;
    columns.innerHTML = "";
  }
}

function renderProjects() {
  projectList.innerHTML = "";
  projects.forEach((p) => {
    const li = document.createElement("li");
    if (p.id === activeId) li.classList.add("active");
    li.innerHTML = `<span><i class="dot" style="background:${p.color}"></i>${p.name} <small style="color:#8aa39b">(${p.done_count}/${p.task_count})</small></span>`;
    const del = document.createElement("button");
    del.type = "button";
    del.textContent = "✕";
    del.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (!confirm(`¿Eliminar ${p.name}?`)) return;
      await api(`/projects/${p.id}`, { method: "DELETE" });
      if (activeId === p.id) activeId = null;
      await refresh();
    });
    li.appendChild(del);
    li.addEventListener("click", async () => {
      activeId = p.id;
      await refresh();
    });
    projectList.appendChild(li);
  });
}

async function loadTasks(projectId) {
  const p = projects.find((x) => x.id === projectId);
  document.getElementById("activeTitle").textContent = p?.name || "Proyecto";
  document.getElementById("activeMeta").textContent = `${p?.task_count || 0} tareas`;
  taskForm.hidden = false;
  tasks = await api(`/tasks?project_id=${projectId}`);
  columns.innerHTML = "";
  STATUSES.forEach((col) => {
    const section = document.createElement("section");
    section.className = "col";
    const list = tasks.filter((t) => t.status === col.id);
    section.innerHTML = `<h3>${col.label} · ${list.length}</h3>`;
    list.forEach((t) => {
      const card = document.createElement("article");
      card.className = "card";
      card.innerHTML = `<span class="badge ${t.priority}">${t.priority}</span><strong>${t.title}</strong>`;
      const row = document.createElement("div");
      row.className = "row";
      const statusSel = document.createElement("select");
      STATUSES.forEach((s) => {
        const o = document.createElement("option");
        o.value = s.id;
        o.textContent = s.label;
        if (s.id === t.status) o.selected = true;
        statusSel.appendChild(o);
      });
      statusSel.addEventListener("change", async () => {
        await api(`/tasks/${t.id}`, {
          method: "PATCH",
          body: JSON.stringify({ status: statusSel.value }),
        });
        await refresh();
      });
      const del = document.createElement("button");
      del.type = "button";
      del.textContent = "Borrar";
      del.addEventListener("click", async () => {
        await api(`/tasks/${t.id}`, { method: "DELETE" });
        await refresh();
      });
      row.append(statusSel, del);
      card.appendChild(row);
      section.appendChild(card);
    });
    columns.appendChild(section);
  });
}

document.getElementById("projectForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("projectName").value.trim();
  const color = document.getElementById("projectColor").value;
  const created = await api("/projects", {
    method: "POST",
    body: JSON.stringify({ name, color }),
  });
  document.getElementById("projectName").value = "";
  activeId = created.id;
  await refresh();
});

taskForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!activeId) return;
  const title = document.getElementById("taskTitle").value.trim();
  const priority = document.getElementById("taskPriority").value;
  await api("/tasks", {
    method: "POST",
    body: JSON.stringify({ project_id: activeId, title, priority }),
  });
  document.getElementById("taskTitle").value = "";
  await refresh();
});

refresh().catch((err) => {
  document.getElementById("activeTitle").textContent = "API no disponible";
  document.getElementById("activeMeta").textContent = "Ejecuta: npm install && npm run seed && npm start";
  console.error(err);
});
