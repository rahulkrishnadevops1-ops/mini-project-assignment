<div align="center">

<h1>KubeCoin Frontend</h1>

<p><strong>React + Vite interface for KubeCoin wallet, trading, and cluster demos</strong></p>

![React](https://img.shields.io/badge/React-18-0ea5e9?style=for-the-badge)
![Vite](https://img.shields.io/badge/Vite-5-2563eb?style=for-the-badge)
![Tailwind](https://img.shields.io/badge/TailwindCSS-3-1d4ed8?style=for-the-badge)
![Nginx](https://img.shields.io/badge/Nginx-Container%20Runtime-4338ca?style=for-the-badge)

</div>

---

## Features

- dashboard-style wallet and price views
- backend API integration via `BACKEND_URL`
- Vite-based fast local development
- containerized static hosting via Nginx

## Scripts

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Environment

Frontend expects backend endpoint through runtime env:

- `BACKEND_URL` (example: `http://backend-svc.kubecoin.svc.cluster.local:5000`)

## Project Structure

| Path | Purpose |
|---|---|
| `src/components` | UI components |
| `src/api/api.js` | API client functions |
| `src/App.jsx` | app shell |
| `Dockerfile` | production build image |
| `nginx.conf.template` | Nginx routing |

## Build for Production

```bash
npm ci
npm run build
```

## CI/CD Note

- Jenkins pipelines build and push Docker images using the Jenkins credential `docker-creds`.
- Helm image values are updated from CI and pushed back to Git using `git-creds`.
- Image updates target `kubecoin-helm-charts/kubecoin/values.yaml`.
