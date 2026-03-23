// =============================================================================
// RUTAS DE PROPIEDADES - Module 3: RealEstate Hub API
// =============================================================================

import { Router } from 'express';
import {
  getAllProperties,
  getPropertyById,
  getPropertyStats,
  createProperty,
  updateProperty,
  deleteProperty,
} from '../controllers/propertyController.js';

const router = Router();

// =============================================================================
// RUTAS CRUD
// =============================================================================

/**
 * GET /api/properties
 * Lista todas las propiedades con filtros y paginación.
 */
router.get('/', (req, res) => {
  void getAllProperties(req, res);
});

/**
 * GET /api/properties/stats
 * Devuelve estadísticas agregadas de las propiedades.
 *
 * ⚠️ IMPORTANTE: Debe ir ANTES de /:id
 * Si fuera después, Express interpretaría "stats" como un ID.
 */
router.get('/stats', (req, res) => {
  void getPropertyStats(req, res);
});

/**
 * GET /api/properties/:id
 * Obtiene una propiedad específica por su ID.
 */
router.get('/:id', (req, res) => {
  void getPropertyById(req, res);
});

/**
 * POST /api/properties
 * Crea una nueva propiedad.
 */
router.post('/', (req, res) => {
  void createProperty(req, res);
});

/**
 * PUT /api/properties/:id
 * Actualiza una propiedad existente.
 */
router.put('/:id', (req, res) => {
  void updateProperty(req, res);
});

/**
 * DELETE /api/properties/:id
 * Elimina una propiedad.
 */
router.delete('/:id', (req, res) => {
  void deleteProperty(req, res);
});

export default router;