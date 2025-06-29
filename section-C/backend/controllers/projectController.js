const { projectsModel } = require('../models/dataAccess');

/**
 * Get all projects
 */
async function getAllProjects(req, res) {
  try {
    console.log('📋 Fetching all projects...');
    
    const projects = await projectsModel.getAll();
    
    console.log(`✅ Found ${projects.length} projects`);
    
    res.json({
      success: true,
      data: projects,
      count: projects.length,
      message: 'Projects fetched successfully'
    });
    
  } catch (error) {
    console.error('❌ Error fetching projects:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch projects',
      message: error.message
    });
  }
}

/**
 * Get project by ID
 */
async function getProjectById(req, res) {
  try {
    const { id } = req.params;
    console.log(`📋 Fetching project with ID: ${id}`);
    
    const project = await projectsModel.findById(id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
        message: `No project found with ID: ${id}`
      });
    }
    
    console.log(`✅ Found project: ${project.name}`);
    
    res.json({
      success: true,
      data: project,
      message: 'Project fetched successfully'
    });
    
  } catch (error) {
    console.error('❌ Error fetching project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch project',
      message: error.message
    });
  }
}

module.exports = {
  getAllProjects,
  getProjectById
}; 