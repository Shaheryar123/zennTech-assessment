/**
 * API Key Authentication Middleware
 */
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const expectedApiKey = process.env.API_KEY || 'zenntech-property-api-key-2025';
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API key is required',
      message: 'Please include X-API-Key header.'
    });
  }
  
  if (apiKey !== expectedApiKey) {
    return res.status(403).json({
      success: false,
      error: 'Invalid API key',
      message: 'The provided API key is not valid.'
    });
  }
  
  // Log successful authentication
  console.log(`✅ API Key authenticated for ${req.method} ${req.path}`);
  next();
};

module.exports = {
  authenticateApiKey
}; 