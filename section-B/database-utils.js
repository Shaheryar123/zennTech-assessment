/**
 * Database Utilities for Property Import
 * Handles transactions and batch operations
 */

const { Sequelize, Property } = require('../models'); // Adjust based on your model structure

/**
 * Create database transaction for batch operations
 */
async function createDatabaseTransaction() {
  try {
    return await Sequelize.transaction({
      isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED
    });
  } catch (error) {
    throw new Error(`Failed to create database transaction: ${error.message}`);
  }
}

/**
 * Batch insert properties with transaction support
 */
async function batchInsertProperties(properties, transaction) {
  const errors = [];
  let successCount = 0;
  let failCount = 0;

  try {
    // Validate input
    if (!Array.isArray(properties) || properties.length === 0) {
      throw new Error('Properties array is required and cannot be empty');
    }

    // Prepare data for bulk insert
    const propertiesToInsert = properties.map(property => ({
      ...property,
      id: property.id || generateUUID(), // Ensure UUID if not provided
      createdAt: property.createdAt || new Date(),
      updatedAt: property.updatedAt || new Date()
    }));

    // Attempt bulk insert
    const insertedProperties = await Property.bulkCreate(propertiesToInsert, {
      transaction,
      validate: true,
      returning: true,
      ignoreDuplicates: false, // We want to know about conflicts
      updateOnDuplicate: ['price', 'title', 'description', 'updatedAt'] // Update these fields on conflict
    });

    successCount = insertedProperties.length;

    return {
      success: true,
      successCount,
      failCount: 0,
      errors: [],
      insertedIds: insertedProperties.map(p => p.id)
    };

  } catch (error) {
    // Handle bulk insert failure - try individual inserts
    if (error.name === 'SequelizeBulkRecordError' || error.name === 'SequelizeValidationError') {
      return await handleBulkInsertFailure(properties, transaction, error);
    }

    throw new Error(`Batch insert failed: ${error.message}`);
  }
}

/**
 * Handle bulk insert failures by processing records individually
 */
async function handleBulkInsertFailure(properties, transaction, originalError) {
  const errors = [];
  let successCount = 0;
  let failCount = 0;
  const insertedIds = [];

  for (const [index, property] of properties.entries()) {
    try {
      const inserted = await Property.create(property, { 
        transaction,
        validate: true 
      });
      
      successCount++;
      insertedIds.push(inserted.id);

    } catch (error) {
      failCount++;
      errors.push(`Property "${property.title}" (batch position ${index + 1}): ${error.message}`);
    }
  }

  return {
    success: successCount > 0,
    successCount,
    failCount,
    errors,
    insertedIds,
    originalError: originalError.message
  };
}

/**
 * Generate UUID for properties
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Check database connection health
 */
async function checkDatabaseHealth() {
  try {
    await Sequelize.authenticate();
    return { healthy: true, message: 'Database connection is healthy' };
  } catch (error) {
    return { healthy: false, message: `Database connection failed: ${error.message}` };
  }
}

/**
 * Clean up orphaned or invalid property records
 */
async function cleanupInvalidProperties(brokerId, dryRun = true) {
  try {
    const invalidProperties = await Property.findAll({
      where: {
        brokerId,
        [Sequelize.Op.or]: [
          { title: null },
          { title: '' },
          { price: null },
          { price: { [Sequelize.Op.lte]: 0 } },
          { projectId: null },
          { projectId: '' }
        ]
      }
    });

    if (dryRun) {
      return {
        invalidCount: invalidProperties.length,
        preview: invalidProperties.slice(0, 5).map(p => ({
          id: p.id,
          title: p.title,
          price: p.price,
          issues: getPropertyIssues(p)
        }))
      };
    }

    // Actually delete invalid properties
    const deletedCount = await Property.destroy({
      where: {
        id: invalidProperties.map(p => p.id)
      }
    });

    return {
      deletedCount,
      invalidProperties: invalidProperties.map(p => p.id)
    };

  } catch (error) {
    throw new Error(`Cleanup failed: ${error.message}`);
  }
}

/**
 * Identify issues with a property record
 */
function getPropertyIssues(property) {
  const issues = [];
  
  if (!property.title || property.title.trim() === '') {
    issues.push('Missing or empty title');
  }
  
  if (!property.price || property.price <= 0) {
    issues.push('Invalid or missing price');
  }
  
  if (!property.projectId || property.projectId.trim() === '') {
    issues.push('Missing project ID');
  }
  
  return issues;
}

/**
 * Get property import statistics for a broker
 */
async function getImportStatistics(brokerId, timeframe = '30 days') {
  try {
    const timeframeDays = parseInt(timeframe.match(/\d+/)[0]);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeframeDays);

    const stats = await Property.findAll({
      where: {
        brokerId,
        createdAt: {
          [Sequelize.Op.gte]: startDate
        }
      },
      attributes: [
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'totalProperties'],
        [Sequelize.fn('AVG', Sequelize.col('price')), 'averagePrice'],
        [Sequelize.fn('MIN', Sequelize.col('price')), 'minPrice'],
        [Sequelize.fn('MAX', Sequelize.col('price')), 'maxPrice'],
        [Sequelize.fn('DATE', Sequelize.col('createdAt')), 'importDate']
      ],
      group: [Sequelize.fn('DATE', Sequelize.col('createdAt'))],
      order: [[Sequelize.fn('DATE', Sequelize.col('createdAt')), 'DESC']]
    });

    return {
      timeframe,
      statistics: stats,
      summary: {
        totalImports: stats.length,
        totalProperties: stats.reduce((sum, stat) => sum + parseInt(stat.dataValues.totalProperties), 0)
      }
    };

  } catch (error) {
    throw new Error(`Failed to get import statistics: ${error.message}`);
  }
}

module.exports = {
  createDatabaseTransaction,
  batchInsertProperties,
  handleBulkInsertFailure,
  generateUUID,
  checkDatabaseHealth,
  cleanupInvalidProperties,
  getImportStatistics
}; 