const { v4: uuidv4 } = require('uuid');
const { propertiesModel, projectsModel } = require('../models/dataAccess');
const { validatePropertyData, sanitizePropertyData, isValidUUID } = require('../utils/validation');

/**
 * Create a new property
 */
async function createProperty(req, res) {
  try {
    console.log('🏠 Creating new property...');
    
    // Sanitize input data
    const sanitizedData = sanitizePropertyData(req.body);
    console.log('📝 Sanitized data:', sanitizedData);
    
    // Validate input data
    const validation = validatePropertyData(sanitizedData);
    if (!validation.isValid) {
      console.log('❌ Validation failed:', validation.errors);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.errors
      });
    }
    
    // Check if project exists
    const project = await projectsModel.findById(sanitizedData.projectId);
    if (!project) {
      console.log(`❌ Project not found: ${sanitizedData.projectId}`);
      return res.status(400).json({
        success: false,
        error: 'Invalid project ID',
        message: `Project with ID '${sanitizedData.projectId}' does not exist`
      });
    }
    
    // Create property object
    const newProperty = {
      id: uuidv4(),
      projectId: sanitizedData.projectId,
      projectName: project.name,
      title: sanitizedData.title,
      size: sanitizedData.size,
      price: sanitizedData.price,
      handoverDate: sanitizedData.handoverDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Save to JSON file
    const savedProperty = await propertiesModel.create(newProperty);
    
    if (!savedProperty) {
      console.log('❌ Failed to save property to file');
      return res.status(500).json({
        success: false,
        error: 'Failed to save property',
        message: 'Could not write property data to file'
      });
    }
    
    
    res.status(201).json({
      success: true,
      message: 'Property created successfully',
      data: savedProperty
    });
    
  } catch (error) {
    console.error('❌ Error creating property:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create property',
      message: error.message
    });
  }
}

/**
 * Get all properties
 */
async function getAllProperties(req, res) {
  try {
    console.log('🏠 Fetching all properties...');
    
    const properties = await propertiesModel.getAll();
    
    
    res.json({
      success: true,
      data: properties,
      count: properties.length,
      message: 'Properties fetched successfully'
    });
    
  } catch (error) {
    console.error('❌ Error fetching properties:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch properties',
      message: error.message
    });
  }
}

/**
 * Get property by ID
 */
async function getPropertyById(req, res) {
  try {
    const { id } = req.params;
    console.log(`🏠 Fetching property with ID: ${id}`);
    
    // Validate UUID format
    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid property ID format',
        message: 'Property ID must be a valid UUID'
      });
    }
    
    const property = await propertiesModel.findById(id);
    
    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Property not found',
        message: `No property found with ID: ${id}`
      });
    }
    
    
    res.json({
      success: true,
      data: property,
      message: 'Property fetched successfully'
    });
    
  } catch (error) {
    console.error('❌ Error fetching property:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch property',
      message: error.message
    });
  }
}

/**
 * Delete property by ID
 */
async function deleteProperty(req, res) {
  try {
    const { id } = req.params;
    console.log(`🗑️ Deleting property with ID: ${id}`);
    
    // Validate UUID format
    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid property ID format',
        message: 'Property ID must be a valid UUID'
      });
    }
    
    const deletedProperty = await propertiesModel.deleteById(id);
    
    if (!deletedProperty) {
      return res.status(404).json({
        success: false,
        error: 'Property not found',
        message: `No property found with ID: ${id}`
      });
    }
    
    
    res.json({
      success: true,
      message: 'Property deleted successfully',
      data: deletedProperty
    });
    
  } catch (error) {
    console.error('❌ Error deleting property:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete property',
      message: error.message
    });
  }
}

module.exports = {
  createProperty,
  getAllProperties,
  getPropertyById,
  deleteProperty
}; 