# Module 3: RealEstate Hub API

Backend REST API para gestión de propiedades inmobiliarias construida con Node.js, Express, Prisma y SQLite.

## Tecnologías

- **Node.js** con TypeScript
- **Express 5** — Framework HTTP
- **Prisma 7** — ORM con SQLite
- **Zod** — Validación de datos

## Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/properties` | Listar propiedades con filtros y paginación |
| GET | `/api/properties/stats` | Estadísticas agregadas |
| GET | `/api/properties/:id` | Obtener propiedad por ID |
| POST | `/api/properties` | Crear propiedad |
| PUT | `/api/properties/:id` | Actualizar propiedad |
| DELETE | `/api/properties/:id` | Eliminar propiedad |

## Paginación

```
GET /api/properties?page=1&limit=10
```

Respuesta:
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "total": 6,
    "page": 1,
    "limit": 10,
    "pages": 1
  }
}
```

## Estadísticas

```
GET /api/properties/stats
```

Respuesta:
```json
{
  "success": true,
  "data": {
    "total": 6,
    "byType": {
      "apartamento": { "count": 2, "avgPrice": 225600 },
      "casa": { "count": 1, "avgPrice": 680000 }
    },
    "priceRange": { "min": 1200, "max": 680000 }
  }
}
```

## Instalación

```bash
cd backend
npm install
npm run db:push
npm run db:seed
npm run dev
```

El servidor corre en `http://localhost:3002`
