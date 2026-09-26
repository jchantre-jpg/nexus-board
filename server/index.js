const express = require("express");
const cors = require("cors");
const path = require("path");
const { z } = require("zod");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 4090;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

const projectSchema = z.object({
  name: z.string().min(1).max(80),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

const taskSchema = z.object({
  project_id: z.number().int().positive(),
  title: z.string().min(1).max(160),
  status: z.enum(["todo", "doing", "done"]).optional(),
  priority: z.enum(["low", "med", "high"]).optional(),
});

const taskPatchSchema = z.object({
  title: z.string().min(1).max(160).optional(),
  status: z.enum(["todo", "doing", "done"]).optional(),
  priority: z.enum(["low", "med", "high"]).optional(),
});

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "nexus-board",
    stack: ["express", "sqlite", "zod"],
  });
});

app.get("/api/projects", (_req, res) => {
  const projects = db
    .prepare(
      `SELECT p.*,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) AS task_count,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'done') AS done_count
       FROM projects p ORDER BY p.id DESC`
    )
    .all();
  res.json(projects);
});

app.post("/api/projects", (req, res) => {
  const parsed = projectSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { name, color = "#2f6b66" } = parsed.data;
  const info = db.prepare("INSERT INTO projects (name, color) VALUES (?, ?)").run(name, color);
  const row = db.prepare("SELECT * FROM projects WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json(row);
});

app.delete("/api/projects/:id", (req, res) => {
  const info = db.prepare("DELETE FROM projects WHERE id = ?").run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: "Project not found" });
  res.status(204).end();
});

app.get("/api/tasks", (req, res) => {
  const { project_id, status } = req.query;
  let sql = "SELECT * FROM tasks WHERE 1=1";
  const params = [];
  if (project_id) {
    sql += " AND project_id = ?";
    params.push(Number(project_id));
  }
  if (status) {
    sql += " AND status = ?";
    params.push(status);
  }
  sql += " ORDER BY CASE priority WHEN 'high' THEN 0 WHEN 'med' THEN 1 ELSE 2 END, updated_at DESC";
  res.json(db.prepare(sql).all(...params));
});

app.post("/api/tasks", (req, res) => {
  const parsed = taskSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { project_id, title, status = "todo", priority = "med" } = parsed.data;
  const project = db.prepare("SELECT id FROM projects WHERE id = ?").get(project_id);
  if (!project) return res.status(404).json({ error: "Project not found" });
  const info = db
    .prepare(
      `INSERT INTO tasks (project_id, title, status, priority) VALUES (?, ?, ?, ?)`
    )
    .run(project_id, title, status, priority);
  res.status(201).json(db.prepare("SELECT * FROM tasks WHERE id = ?").get(info.lastInsertRowid));
});

app.patch("/api/tasks/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Task not found" });
  const parsed = taskPatchSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const next = { ...existing, ...parsed.data };
  db.prepare(
    `UPDATE tasks SET title = ?, status = ?, priority = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(next.title, next.status, next.priority, existing.id);
  res.json(db.prepare("SELECT * FROM tasks WHERE id = ?").get(existing.id));
});

app.delete("/api/tasks/:id", (req, res) => {
  const info = db.prepare("DELETE FROM tasks WHERE id = ?").run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: "Task not found" });
  res.status(204).end();
});

app.get("/api/stats", (_req, res) => {
  const byStatus = db
    .prepare(`SELECT status, COUNT(*) AS count FROM tasks GROUP BY status`)
    .all();
  const byPriority = db
    .prepare(`SELECT priority, COUNT(*) AS count FROM tasks GROUP BY priority`)
    .all();
  const totals = db
    .prepare(
      `SELECT
        (SELECT COUNT(*) FROM projects) AS projects,
        (SELECT COUNT(*) FROM tasks) AS tasks,
        (SELECT COUNT(*) FROM tasks WHERE status = 'done') AS done`
    )
    .get();
  res.json({ ...totals, byStatus, byPriority });
});

app.listen(PORT, () => {
  console.log(`Nexus Board → http://localhost:${PORT}`);
});
