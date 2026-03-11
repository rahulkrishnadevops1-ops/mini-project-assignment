<div align="center">

<h1>KubeCoin Backend API</h1>

<p><strong>Flask + PostgreSQL microservice for wallet operations and demo trading actions</strong></p>

![Python](https://img.shields.io/badge/Python-3.x-0ea5e9?style=for-the-badge)
![Flask](https://img.shields.io/badge/Flask-API-2563eb?style=for-the-badge)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Data%20Store-1d4ed8?style=for-the-badge)
![Kubernetes](https://img.shields.io/badge/Kubernetes-Ready-4338ca?style=for-the-badge)

</div>

---

## Features

- wallet bootstrap on first request
- buy/sell/mine/reset endpoints
- DB connection pooling (`psycopg2.pool.SimpleConnectionPool`)
- pod identity included in responses (`pod_id`)
- health demo endpoints (`/health`, `/kill`) for liveness testing

## API Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/data/<wallet_id>` | Fetch wallet data (auto-create user) |
| `POST` | `/api/buy` | Buy coins |
| `POST` | `/api/sell` | Sell coins |
| `POST` | `/api/mine` | CPU-intensive mining demo |
| `POST` | `/api/reset` | Reset account to defaults |
| `GET` | `/health` | Liveness check |
| `POST` | `/kill` | Force unhealthy state |

## Environment Variables

| Name | Default |
|---|---|
| `DB_HOST` | `localhost` |
| `DB_NAME` | `kubecoin` |
| `DB_USER` | `postgres` |
| `DB_PASSWORD` | `password` |

## Local Run

```bash
python -m venv .venv
source .venv/bin/activate  # Linux/macOS
pip install -r requirements.txt
python app.py
```

## Production Suggestion

Use Gunicorn instead of Flask dev server:

```bash
gunicorn -w 2 -b 0.0.0.0:5000 app:app
```

## Tech Stack

- Flask
- Flask-CORS
- Psycopg2
- Gunicorn

## CI/CD Note

- Jenkins pipelines build and push Docker images using the Jenkins credential `docker-creds`.
- Helm image values are updated from CI and pushed back to Git using `git-creds`.
- Image updates target `kubecoin-helm-charts/kubecoin/values.yaml`.
