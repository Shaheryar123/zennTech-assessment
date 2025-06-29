const express = require('express');
const router = express.Router();
const { getAllProjects, getProjectById } = require('../controllers/projectController');
const { authenticateApiKey } = require('../middleware/auth');

/**
 * Project Routes
 * All routes are prefixed with /api/projects
 */

// Apply authentication middleware to all project routes
router.use(authenticateApiKey);

/**
 * @route   GET /api/projects
 * @desc    Get all projects
 * @access  Private (requires API key)
 */
router.get('/', getAllProjects);

/**
 * @route   GET /api/projects/:id
 * @desc    Get project by ID
 * @access  Private (requires API key)
 */
router.get('/:id', getProjectById);

module.exports = router; 