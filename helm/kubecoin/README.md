<div align="center">

<h1>KubeCoin Helm Chart</h1>

<p><strong>Application chart for frontend, backend, and PostgreSQL primary/replica topology</strong></p>

![Chart](https://img.shields.io/badge/Chart-kubecoin-0ea5e9?style=for-the-badge)
![Backend](https://img.shields.io/badge/Backend-Deployment-2563eb?style=for-the-badge)
![Frontend](https://img.shields.io/badge/Frontend-Deployment-1d4ed8?style=for-the-badge)
![Database](https://img.shields.io/badge/Database-StatefulSet%20Primary%2FReplica-4338ca?style=for-the-badge)

</div>

---

## What Gets Deployed

- `backend` Deployment + Service
- `frontend` Deployment + Service (NodePort)
- `postgres-master` StatefulSet (1 primary)
- `postgres-replica` StatefulSet (`database.replicas - 1` replicas)
- `database-primary-svc` for writes
- `database-replica-svc` for reads
- headless service for StatefulSet DNS
- init/replication ConfigMaps
- PVC templates for DB data

## Install

```bash
helm upgrade --install kubecoin . -n kubecoin --create-namespace
```

## Verify

```bash
kubectl get deploy,sts,svc,pods,pvc,pv -n kubecoin
```

## Key Values

| Key | Default |
|---|---|
| `backend.replicas` | `2` |
| `frontend.replicas` | `2` |
| `database.replicas` | `2` |
| `database.persistence.storageClass` | `local-path` |
| `database.persistence.size` | `8Gi` |

## Scale Example

```bash
helm upgrade kubecoin . -n kubecoin \
  --set backend.replicas=3 \
  --set frontend.replicas=3 \
  --set database.replicas=2
```

## Important

- Keep one primary only (handled by chart design).
- Replicas are read-only followers bootstrapped from primary.
- Use a StorageClass that supports dynamic provisioning.
