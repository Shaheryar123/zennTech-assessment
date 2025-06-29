const express = require('express');
const router = express.Router();

// Import route modules
const projectRoutes = require('./projects');
const propertyRoutes = require('./properties');

/**
 * Main API Routes
 * Combines all route modules
 */

/**
 * @route   GET /health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Property Management API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

/**
 * @route   /api/projects
 * @desc    All project-related routes
 * @access  Private (API key required)
 */
router.use('/api/projects', projectRoutes);

/**
 * @route   /api/properties
 * @desc    All property-related routes
 * @access  Private (API key required)
 */
router.use('/api/properties', propertyRoutes);

/**
 * @route   *
 * @desc    404 handler for undefined routes
 * @access  Public
 */
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `Route ${req.method} ${req.originalUrl} does not exist`,
    availableEndpoints: {
      health: 'GET /health',
      projects: 'GET /api/projects',
      properties: 'POST /api/properties, GET /api/properties'
    }
  });
});

module.exports = router; 