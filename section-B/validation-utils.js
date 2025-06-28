/**
 * Property Data Validation and Sanitization Utilities
 */

const validator = require('validator');
const DOMPurify = require('isomorphic-dompurify');

/**
 * Comprehensive property data validation
 */
function validatePropertyData(record, rowIndex = 0) {
  const errors = [];
  const sanitizedData = {};

  try {
    // Title validation
    if (!record.title || typeof record.title !== 'string') {
      errors.push(`Row ${rowIndex}: Title is required and must be a string`);
    } else {
      const title = record.title.trim();
      if (title.length < 3) {
        errors.push(`Row ${rowIndex}: Title must be at least 3 characters long`);
      } else if (title.length > 300) {
        errors.push(`Row ${rowIndex}: Title must be less than 300 characters`);
      } else {
        sanitizedData.title = sanitizeInput(title);
      }
    }

    // Price validation
    if (!record.price) {
      errors.push(`Row ${rowIndex}: Price is required`);
    } else {
      const price = parseFloat(record.price.toString().replace(/[^0-9.-]/g, ''));
      if (isNaN(price)) {
        errors.push(`Row ${rowIndex}: Price must be a valid number`);
      } else if (price <= 0) {
        errors.push(`Row ${rowIndex}: Price must be greater than 0`);
      } else if (price > 1000000000) { // 1 billion limit
        errors.push(`Row ${rowIndex}: Price exceeds maximum allowed value`);
      } else {
        sanitizedData.price = price;
      }
    }

    // Project ID validation
    if (!record.projectId || typeof record.projectId !== 'string') {
      errors.push(`Row ${rowIndex}: Project ID is required and must be a string`);
    } else {
      const projectId = record.projectId.trim();
      if (!/^[a-zA-Z0-9_-]{3,50}$/.test(projectId)) {
        errors.push(`Row ${rowIndex}: Project ID must be 3-50 characters and contain only letters, numbers, hyphens, and underscores`);
      } else {
        sanitizedData.projectId = projectId;
      }
    }

    // Optional: Property Type validation
    if (record.propertyType) {
      const validTypes = ['apartment', 'villa', 'townhouse', 'office', 'retail', 'land'];
      const propertyType = record.propertyType.toLowerCase().trim();
      if (!validTypes.includes(propertyType)) {
        errors.push(`Row ${rowIndex}: Property type must be one of: ${validTypes.join(', ')}`);
      } else {
        sanitizedData.propertyType = propertyType;
      }
    }

    // Optional: Bedrooms validation
    if (record.bedrooms) {
      const bedrooms = parseInt(record.bedrooms);
      if (isNaN(bedrooms) || bedrooms < 0 || bedrooms > 20) {
        errors.push(`Row ${rowIndex}: Bedrooms must be a number between 0 and 20`);
      } else {
        sanitizedData.bedrooms = bedrooms;
      }
    }

    // Optional: Bathrooms validation
    if (record.bathrooms) {
      const bathrooms = parseFloat(record.bathrooms);
      if (isNaN(bathrooms) || bathrooms < 0 || bathrooms > 20) {
        errors.push(`Row ${rowIndex}: Bathrooms must be a number between 0 and 20`);
      } else {
        sanitizedData.bathrooms = bathrooms;
      }
    }

    // Optional: Area validation
    if (record.area || record.areaSqft) {
      const area = parseFloat(record.area || record.areaSqft);
      if (isNaN(area) || area <= 0 || area > 100000) {
        errors.push(`Row ${rowIndex}: Area must be a positive number less than 100,000`);
      } else {
        sanitizedData.areaSqft = area;
      }
    }

    // Optional: Description validation
    if (record.description) {
      const description = record.description.trim();
      if (description.length > 2000) {
        errors.push(`Row ${rowIndex}: Description must be less than 2000 characters`);
      } else {
        sanitizedData.description = sanitizeInput(description);
      }
    }

    // Optional: Location fields validation
    if (record.city) {
      const city = record.city.trim();
      if (city.length < 2 || city.length > 100) {
        errors.push(`Row ${rowIndex}: City must be between 2 and 100 characters`);
      } else {
        sanitizedData.city = sanitizeInput(city);
      }
    }

    if (record.address) {
      const address = record.address.trim();
      if (address.length > 500) {
        errors.push(`Row ${rowIndex}: Address must be less than 500 characters`);
      } else {
        sanitizedData.address = sanitizeInput(address);
      }
    }

    // Optional: Coordinates validation
    if (record.latitude) {
      const lat = parseFloat(record.latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        errors.push(`Row ${rowIndex}: Latitude must be a valid number between -90 and 90`);
      } else {
        sanitizedData.latitude = lat;
      }
    }

    if (record.longitude) {
      const lng = parseFloat(record.longitude);
      if (isNaN(lng) || lng < -180 || lng > 180) {
        errors.push(`Row ${rowIndex}: Longitude must be a valid number between -180 and 180`);
      } else {
        sanitizedData.longitude = lng;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: errors.length === 0 ? sanitizedData : null
    };

  } catch (error) {
    return {
      isValid: false,
      errors: [`Row ${rowIndex}: Validation error - ${error.message}`],
      sanitizedData: null
    };
  }
}

/**
 * Sanitize input to prevent XSS and injection attacks
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return input;
  }

  // Remove HTML tags and potential scripts
  let sanitized = DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });

  // Additional sanitization for database safety
  sanitized = sanitized
    .replace(/[<>]/g, '') // Remove any remaining angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();

  // Escape SQL-like patterns (additional safety)
  sanitized = sanitized.replace(/(['";\\])/g, '\\$1');

  return sanitized;
}

/**
 * Validate business rules for property data
 */
function validateBusinessRules(propertyData, brokerId) {
  const warnings = [];
  const errors = [];

  try {
    // Check for suspicious pricing
    if (propertyData.price < 50000) {
      warnings.push('Property price seems unusually low - please verify');
    }

    if (propertyData.price > 50000000) {
      warnings.push('Property price is very high - additional verification may be required');
    }

    // Validate bedroom/bathroom ratio
    if (propertyData.bedrooms && propertyData.bathrooms) {
      if (propertyData.bathrooms > propertyData.bedrooms * 2) {
        warnings.push('Bathroom count seems high relative to bedrooms');
      }
    }

    // Validate area vs. price relationship
    if (propertyData.areaSqft && propertyData.price) {
      const pricePerSqft = propertyData.price / propertyData.areaSqft;
      if (pricePerSqft < 100) {
        warnings.push('Price per square foot seems low - please verify');
      } else if (pricePerSqft > 5000) {
        warnings.push('Price per square foot seems high - please verify');
      }
    }

    // Location coordinate validation for Dubai (if provided)
    if (propertyData.latitude && propertyData.longitude) {
      const dubaiLatRange = [24.8, 25.4];
      const dubaiLngRange = [54.8, 55.6];
      
      if (propertyData.latitude < dubaiLatRange[0] || propertyData.latitude > dubaiLatRange[1] ||
          propertyData.longitude < dubaiLngRange[0] || propertyData.longitude > dubaiLngRange[1]) {
        warnings.push('Coordinates appear to be outside Dubai area');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };

  } catch (error) {
    return {
      isValid: false,
      errors: [`Business rule validation error: ${error.message}`],
      warnings: []
    };
  }
}

/**
 * Check for potential duplicate properties
 */
async function checkForDuplicates(propertyData, brokerId, existingProperties = []) {
  try {
    // Simple duplicate detection based on title and price similarity
    const potentialDuplicates = existingProperties.filter(existing => {
      const titleSimilarity = calculateStringSimilarity(
        propertyData.title.toLowerCase(), 
        existing.title.toLowerCase()
      );
      
      const priceDifference = Math.abs(propertyData.price - existing.price) / existing.price;
      
      return titleSimilarity > 0.85 && priceDifference < 0.05; // 85% title similarity and 5% price difference
    });

    return {
      isDuplicate: potentialDuplicates.length > 0,
      duplicates: potentialDuplicates,
      duplicateScore: potentialDuplicates.length > 0 ? 
        Math.max(...potentialDuplicates.map(d => calculateStringSimilarity(
          propertyData.title.toLowerCase(), 
          d.title.toLowerCase()
        ))) : 0
    };

  } catch (error) {
    return {
      isDuplicate: false,
      duplicates: [],
      duplicateScore: 0,
      error: error.message
    };
  }
}

/**
 * Calculate string similarity using Levenshtein distance
 */
function calculateStringSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

module.exports = {
  validatePropertyData,
  sanitizeInput,
  validateBusinessRules,
  checkForDuplicates,
  calculateStringSimilarity
}; 