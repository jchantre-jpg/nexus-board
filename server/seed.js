const db = require("./db");

const count = db.prepare("SELECT COUNT(*) AS c FROM projects").get().c;
if (count > 0) {
  console.log("Already seeded");
  process.exit(0);
}

const insertProject = db.prepare("INSERT INTO projects (name, color) VALUES (?, ?)");
const insertTask = db.prepare(
  "INSERT INTO tasks (project_id, title, status, priority) VALUES (?, ?, ?, ?)"
);

const tx = db.transaction(() => {
  const a = insertProject.run("Portafolio GitHub", "#0f766e").lastInsertRowid;
  const b = insertProject.run("Maestría IA", "#c45c26").lastInsertRowid;
  insertTask.run(a, "Pulir README del perfil", "done", "high");
  insertTask.run(a, "Subir demos a Pages", "doing", "high");
  insertTask.run(a, "Grabar video corto YuweAI", "todo", "med");
  insertTask.run(b, "Repasar redes neuronales", "doing", "med");
  insertTask.run(b, "Entregar práctica NLP", "todo", "high");
});

tx();
console.log("Seed OK");
