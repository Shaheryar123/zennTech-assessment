const fs = require('fs').promises;
const path = require('path');

// Data file paths
const PROJECTS_FILE = path.join(__dirname, '../data/projects.json');
const PROPERTIES_FILE = path.join(__dirname, '../data/properties.json');

/**
 * Generic function to read JSON file
 */
async function readJsonFile(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return [];
  }
}

/**
 * Generic function to write JSON file
 */
async function writeJsonFile(filePath, data) {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Projects data access
 */
const projectsModel = {
  async getAll() {
    return await readJsonFile(PROJECTS_FILE);
  },

  async findById(id) {
    const projects = await this.getAll();
    return projects.find(project => project.id === id);
  }
};

/**
 * Properties data access
 */
const propertiesModel = {
  async getAll() {
    return await readJsonFile(PROPERTIES_FILE);
  },

  async create(propertyData) {
    try {
      const properties = await this.getAll();
      properties.push(propertyData);
      const success = await writeJsonFile(PROPERTIES_FILE, properties);
      return success ? propertyData : null;
    } catch (error) {
      console.error('Error creating property:', error.message);
      return null;
    }
  },

  async findById(id) {
    const properties = await this.getAll();
    return properties.find(property => property.id === id);
  },

  async deleteById(id) {
    try {
      const properties = await this.getAll();
      const initialLength = properties.length;
      const filteredProperties = properties.filter(property => property.id !== id);
      
      if (filteredProperties.length === initialLength) {
        return null; // Property not found
      }
      
      const success = await writeJsonFile(PROPERTIES_FILE, filteredProperties);
      return success ? properties.find(p => p.id === id) : null;
    } catch (error) {
      console.error('Error deleting property:', error.message);
      return null;
    }
  },

  async getCount() {
    const properties = await this.getAll();
    return properties.length;
  }
};

module.exports = {
  projectsModel,
  propertiesModel
}; 