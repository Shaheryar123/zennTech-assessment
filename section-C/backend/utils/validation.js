/**
 * Validation utilities for property data
 */

/**
 * Validate property data
 */
function validatePropertyData(data) {
  const errors = [];
  const { projectId, title, size, price, handoverDate } = data;

  // Project ID validation
  if (!projectId || typeof projectId !== 'string' || projectId.trim() === '') {
    errors.push('Project ID is required');
  }

  // Title validation
  if (!title || typeof title !== 'string' || title.trim() === '') {
    errors.push('Title is required');
  } else if (title.trim().length < 3) {
    errors.push('Title must be at least 3 characters long');
  } else if (title.trim().length > 100) {
    errors.push('Title must be less than 100 characters');
  }

  // Size validation
  if (!size && size !== 0) {
    errors.push('Size is required');
  } else if (typeof size !== 'number' || isNaN(size)) {
    errors.push('Size must be a valid number');
  } else if (size <= 0) {
    errors.push('Size must be a positive number');
  } else if (size > 100000) {
    errors.push('Size seems unreasonably large (max 100,000 sq ft)');
  }

  // Price validation
  if (!price && price !== 0) {
    errors.push('Price is required');
  } else if (typeof price !== 'number' || isNaN(price)) {
    errors.push('Price must be a valid number');
  } else if (price <= 0) {
    errors.push('Price must be a positive number');
  } else if (price > 1000000000) {
    errors.push('Price seems unreasonably high (max $1B)');
  }

  // Handover date validation
  if (!handoverDate || typeof handoverDate !== 'string') {
    errors.push('Handover date is required');
  } else {
    const handoverDateObj = new Date(handoverDate);
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Reset time to beginning of day
    
    if (isNaN(handoverDateObj.getTime())) {
      errors.push('Please enter a valid date');
    } else if (handoverDateObj <= currentDate) {
      errors.push('Handover date must be in the future');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize property data
 */
function sanitizePropertyData(data) {
  return {
    projectId: data.projectId?.toString().trim(),
    title: data.title?.toString().trim(),
    size: Number(data.size),
    price: Number(data.price),
    handoverDate: data.handoverDate?.toString().trim()
  };
}

/**
 * Validate UUID format
 */
function isValidUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

module.exports = {
  validatePropertyData,
  sanitizePropertyData,
  isValidUUID
}; 