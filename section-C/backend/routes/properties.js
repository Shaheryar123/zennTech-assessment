const express = require('express');
const router = express.Router();
const { 
  createProperty, 
  getAllProperties, 
  getPropertyById, 
  deleteProperty 
} = require('../controllers/propertyController');
const { authenticateApiKey } = require('../middleware/auth');

/**
 * Property Routes
 * All routes are prefixed with /api/properties
 */

// Apply authentication middleware to all property routes
router.use(authenticateApiKey);

/**
 * @route   POST /api/properties
 * @desc    Create a new property
 * @access  Private (requires API key)
 */
router.post('/', createProperty);

/**
 * @route   GET /api/properties
 * @desc    Get all properties
 * @access  Private (requires API key)
 */
router.get('/', getAllProperties);

/**
 * @route   GET /api/properties/:id
 * @desc    Get property by ID
 * @access  Private (requires API key)
 */
router.get('/:id', getPropertyById);

/**
 * @route   DELETE /api/properties/:id
 * @desc    Delete property by ID
 * @access  Private (requires API key)
 */
router.delete('/:id', deleteProperty);

module.exports = router; 