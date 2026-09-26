# Nexus Board

![Full Stack](https://img.shields.io/badge/Full%20Stack-Express%20%2B%20SQLite-2f6b66)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=nodedotjs&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-better--sqlite3-003B57?logo=sqlite&logoColor=white)
![Zod](https://img.shields.io/badge/validation-Zod-3E67B1)
![License](https://img.shields.io/badge/license-MIT-blue)

**App full-stack completa**: API REST + base SQLite + UI moderna en el mismo repo.

Ideal para portfolios: demuestra arquitectura real (capa API, persistencia, validación y frontend consumiendo JSON).

## Arquitectura
```
nexus-board/
├── server/          # Express + better-sqlite3 + Zod
├── public/          # UI vanilla (HTML/CSS/JS)
├── data/            # SQLite (gitignore)
└── examples.http    # Colección de requests
```

## Features
- Proyectos con color y progreso (hechas / total)
- Tareas con estado (`todo` / `doing` / `done`) y prioridad
- Stats agregados (`/api/stats`)
- Validación de payloads con **Zod**
- Seed de datos de demo
- UI responsive dark

## Arranque
```bash
npm install
npm run seed
npm start
```
Abre http://localhost:4090

## API (resumen)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/health` | Healthcheck |
| GET/POST | `/api/projects` | Listar / crear |
| DELETE | `/api/projects/:id` | Eliminar |
| GET/POST | `/api/tasks` | Listar / crear |
| PATCH/DELETE | `/api/tasks/:id` | Actualizar / borrar |
| GET | `/api/stats` | Métricas |

## Autora
**Juliana Chantre Astudillo** · Ingeniera Informática · [GitHub](https://github.com/jchantre-jpg)
