/**
 * AI-Powered Property Marketing Description Generator
 * Uses Claude (Anthropic) API for true AI-assisted marketing copy generation
 *
 * This script demonstrates real AI integration for property marketing,
 * using Claude AI API to generate compelling descriptions dynamically.
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Anthropic = require("@anthropic-ai/sdk");

const app = express();
const PORT = process.env.PORT || 3003;

// Initialize Claude (Anthropic) client
let anthropic = null;
try {
  if (process.env.ANTHROPIC_API_KEY) {
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    console.log("✅ Claude (Anthropic) client initialized successfully");
  } else {
    console.log("⚠️ Running in demo mode - no Claude API key provided");
  }
} catch (error) {
  console.error("❌ Failed to initialize Claude client:", error.message);
}

// Middleware
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(express.static("public"));

/**
 * AI Prompt Engineering for Property Marketing
 * Crafts intelligent prompts based on property characteristics
 */
function createPropertyPrompt(propertyData) {
  const {
    bedrooms,
    bathrooms,
    size,
    location,
    price,
    propertyType,
    amenities = [],
  } = propertyData;

  // Determine property tier for prompt customization
  const numericPrice = parseInt(price.replace(/[^0-9]/g, ""));
  const pricePerSqFt = numericPrice / size;

  let marketTier = "standard";
  let targetAudience = "families and professionals";

  if (pricePerSqFt > 500 || numericPrice > 800000) {
    marketTier = "luxury";
    targetAudience = "discerning buyers seeking premium lifestyle";
  } else if (pricePerSqFt < 200 || numericPrice < 300000) {
    marketTier = "budget-friendly";
    targetAudience = "first-time buyers and smart investors";
  }

  // Create informational prompt that works with Claude
  const prompt = `You are creating detailed property information for a real estate database.

Property Information:
- Type: ${propertyType}
- Bedrooms: ${bedrooms}
- Bathrooms: ${bathrooms}
- Size: ${size} sq ft
- Location: ${location}
- Price: ${price}
- Features: ${amenities.join(", ") || "Standard amenities"}

Write a detailed, informative property description (50-70 words) that includes:
1. Complete property specifications and layout details
2. Notable features and amenities with context
3. Location benefits and area characteristics for ${location}
4. Quality and style appropriate for ${marketTier} properties
5. Practical information buyers would want to know

IMPORTANT: Start your response directly with the property description. Do not include any introductory phrases like "Here is", "This is", "Draft:", or similar. Begin immediately with words describing the property itself.`;

  return prompt;
}

/**
 * AI-Powered Marketing Description Generator
 * Uses OpenAI GPT to generate compelling property descriptions
 */
async function generateAIMarketingDescription(propertyData) {
  try {
    const { bedrooms, bathrooms, size, location, price, propertyType } =
      propertyData;

    // Validate required fields
    if (!bedrooms || !bathrooms || !size || !location || !price) {
      throw new Error("Missing required property data");
    }

    // Check if running in demo mode (no API key or client failed to initialize)
    if (!anthropic || !process.env.ANTHROPIC_API_KEY) {
      console.log("🔄 Using demo mode for description generation");
      return generateDemoDescription(propertyData);
    }

    // Create intelligent prompt for AI
    const prompt = createPropertyPrompt(propertyData);

    console.log("🤖 Sending prompt to Claude (Anthropic)...");

    // Call Claude API (v0.9.1 syntax)
    const completion = await anthropic.completions.create({
      model: process.env.AI_MODEL || "claude-2.1",
      max_tokens_to_sample: parseInt(process.env.MAX_TOKENS) || 250,
      temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.7,
      prompt: `\n\nHuman: ${prompt}\n\nAssistant: `,
    });

    let aiGeneratedDescription = completion.completion?.trim();

    if (!aiGeneratedDescription) {
      throw new Error("AI failed to generate description");
    }

    // Clean up any preambles Claude might have added
    aiGeneratedDescription = cleanDescription(aiGeneratedDescription);

    // Generate alternative variations using AI
    const variations = await generateAIVariations(
      propertyData,
      aiGeneratedDescription
    );

    // Calculate metrics
    const wordCount = aiGeneratedDescription.split(" ").length;
    const readabilityScore = calculateReadabilityScore(aiGeneratedDescription);
    const tier = classifyPropertyTier(propertyData);

    return {
      success: true,
      data: {
        primaryDescription: aiGeneratedDescription,
        tier: tier,
        enhancedAmenities:
          propertyData.amenities?.join(", ") || "Standard amenities",
        variations: variations,
        wordCount: wordCount,
        readabilityScore: readabilityScore,
                 aiModel: process.env.AI_MODEL || "claude-2.1",
        generatedBy: "Claude (Anthropic) API - Property Information Generator",
      },
    };
  } catch (error) {
    console.error("AI Generation Error:", error);

    // Fallback to demo mode if API fails
    if (
      error.code === "insufficient_quota" ||
      error.code === "invalid_api_key"
    ) {
      console.log("🔄 Falling back to demo mode...");
      return generateDemoDescription(propertyData);
    }

    return {
      success: false,
      error: `AI generation failed: ${error.message}`,
    };
  }
}

/**
 * Generate AI-powered description variations
 * Creates multiple versions for A/B testing
 */
async function generateAIVariations(propertyData, originalDescription) {
  try {
    if (
      !anthropic ||
      !process.env.ANTHROPIC_API_KEY ||
      process.env.ANTHROPIC_API_KEY === "demo-mode"
    ) {
      return generateDemoVariations(propertyData);
    }

    const variationPrompt = `Based on this property description: "${originalDescription}"

Create 2 alternative detailed property descriptions with:
1. Different professional tone/style (more formal vs more descriptive)
2. Different feature emphasis while remaining accurate
3. Same length (50-70 words)
4. Equally informative but distinct presentation

Property: ${propertyData.bedrooms}BR/${propertyData.bathrooms}BA ${propertyData.propertyType} in ${propertyData.location}

Return ONLY the 2 alternative descriptions separated by "|||" - no introduction, no preamble, just the descriptions.`;

    const completion = await anthropic.completions.create({
      model: "claude-2.1",
      max_tokens_to_sample: 300,
      temperature: 0.8,
      prompt: `\n\nHuman: ${variationPrompt}\n\nAssistant: `,
    });

    const response = completion.completion?.trim();
    const variations = response
      ? response
          .split("|||")
          .map((v) => cleanDescription(v.trim()))
          .filter((v) => v)
      : [];

    return variations.slice(0, 2); // Return max 2 variations
  } catch (error) {
    console.error("Variation generation failed:", error);
    return generateDemoVariations(propertyData);
  }
}

/**
 * Demo mode fallback (when no API key provided)
 * Provides working examples without requiring paid API access
 */
function generateDemoDescription(propertyData) {
  const {
    bedrooms,
    bathrooms,
    size,
    location,
    price,
    propertyType,
    amenities = [],
  } = propertyData;

  // Detailed demo description for testing
  const demoDescription = `This spacious ${bedrooms}-bedroom, ${bathrooms}-bathroom ${propertyType} in ${location} spans ${size.toLocaleString()} square feet of contemporary living space. The residence features modern finishes throughout, with ${
    amenities.join(", ") || "premium amenities"
  }. Located in the desirable ${location} area, residents enjoy convenient access to dining, shopping, and entertainment. Priced at ${price}, this well-appointed property offers an excellent opportunity for discerning buyers.`;

  return {
    success: true,
    data: {
      primaryDescription: demoDescription,
      tier: classifyPropertyTier(propertyData),
      enhancedAmenities: amenities.join(", ") || "Standard amenities",
      variations: generateDemoVariations(propertyData),
      wordCount: demoDescription.split(" ").length,
      readabilityScore: 85,
      aiModel: "Demo Mode",
      generatedBy: "Demo Template (Add Claude API key for AI-generated property summaries)",
    },
  };
}

/**
 * Demo variations generator
 */
function generateDemoVariations(propertyData) {
  const { bedrooms, bathrooms, propertyType, location, price, size, amenities = [] } = propertyData;

  return [
    `This elegant ${bedrooms}-bedroom, ${bathrooms}-bathroom ${propertyType} in ${location} features ${size.toLocaleString()} square feet of refined living space. Premium amenities include ${amenities.slice(0,2).join(" and ")}, while the prime location provides easy access to local attractions and transportation. Thoughtfully designed interiors complement the vibrant neighborhood lifestyle. Listed at ${price}.`,
    `Contemporary ${bedrooms}-bedroom, ${bathrooms}-bathroom ${propertyType} situated in the heart of ${location}, offering ${size.toLocaleString()} square feet of sophisticated urban living. Building amenities feature ${amenities.slice(0,2).join(" and ")}, creating an ideal residential environment. The property combines modern comfort with convenient access to dining, shopping, and business districts. Priced at ${price} for immediate availability.`,
  ];
}

/**
 * Clean up common preambles from Claude responses
 */
function cleanDescription(description) {
  if (!description) return description;
  
  // Remove common preambles
  const preambles = [
    /^Here is a?\s?(draft\s?)?(\d+-word\s?)?property\s?(description|summary)[^:]*:\s*/i,
    /^Here's a?\s?(draft\s?)?(\d+-word\s?)?property\s?(description|summary)[^:]*:\s*/i,
    /^This is a?\s?(draft\s?)?(\d+-word\s?)?property\s?(description|summary)[^:]*:\s*/i,
    /^Draft\s?(property\s?)?(description|summary)[^:]*:\s*/i,
    /^Property\s?(description|summary)[^:]*:\s*/i,
    /^Here is a?\s?(\d+-word\s?)?description[^:]*:\s*/i,
    /^Here's a?\s?(\d+-word\s?)?description[^:]*:\s*/i
  ];
  
  let cleaned = description;
  for (const preamble of preambles) {
    cleaned = cleaned.replace(preamble, '');
  }
  
  return cleaned.trim();
}

/**
 * Property classification for prompt customization
 */
function classifyPropertyTier(propertyData) {
  const { price, size, amenities = [] } = propertyData;
  const numericPrice = parseInt(price.replace(/[^0-9]/g, ""));
  const pricePerSqFt = numericPrice / size;

  const luxuryIndicators = ["pool", "gym", "security", "view", "balcony"];
  const luxuryScore = amenities.filter((amenity) =>
    luxuryIndicators.some((indicator) =>
      amenity.toLowerCase().includes(indicator)
    )
  ).length;

  if (pricePerSqFt > 500 || luxuryScore >= 3 || numericPrice > 800000) {
    return "luxury";
  } else if (pricePerSqFt > 200 || luxuryScore >= 1 || numericPrice > 300000) {
    return "standard";
  } else {
    return "budget";
  }
}

/**
 * Simple readability score calculator
 */
function calculateReadabilityScore(text) {
  const words = text.split(" ").length;
  const sentences = text.split(/[.!?]+/).length;
  const avgWordsPerSentence = words / sentences;

  let score = 100;
  if (avgWordsPerSentence > 25) score -= 20;
  if (avgWordsPerSentence < 10) score -= 10;
  if (words < 30) score -= 15;
  if (words > 100) score -= 10;

  return Math.max(0, Math.min(100, score));
}

// API Endpoints

/**
 * Health check endpoint
 */
app.get("/health", (req, res) => {
  const hasApiKey = !!(
    anthropic &&
    process.env.ANTHROPIC_API_KEY &&
    process.env.ANTHROPIC_API_KEY !== "demo-mode"
  );

  res.json({
    success: true,
    message: "AI Property Marketing Generator is running",
    mode: hasApiKey ? "AI-Powered (Claude/Anthropic)" : "Demo Mode",
    anthropicClientStatus: anthropic ? "initialized" : "not initialized",
    timestamp: new Date().toISOString(),
  });
});

/**
 * Main AI-powered description generation endpoint
 */
app.post("/generate-description", async (req, res) => {
  console.log("🏠 AI-Powered description generation request:", req.body);

  const result = await generateAIMarketingDescription(req.body);

  if (result.success) {
    console.log("✅ AI description generated successfully");
  } else {
    console.log("❌ AI generation error:", result.error);
  }

  res.json(result);
});

/**
 * Batch processing endpoint for multiple properties
 */
app.post("/generate-batch", async (req, res) => {
  const { properties } = req.body;

  if (!Array.isArray(properties)) {
    return res.status(400).json({
      success: false,
      error: "Properties must be an array",
    });
  }

  console.log(`🔄 Processing ${properties.length} properties with AI...`);

  const results = [];
  for (let i = 0; i < properties.length; i++) {
    const result = await generateAIMarketingDescription(properties[i]);
    results.push({
      index: i,
      ...result,
    });
  }

  res.json({
    success: true,
    data: {
      processed: results.length,
      successful: results.filter((r) => r.success).length,
      results: results,
    },
  });
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    const hasApiKey = !!(
      anthropic &&
      process.env.ANTHROPIC_API_KEY &&
      process.env.ANTHROPIC_API_KEY !== "demo-mode"
    );

    console.log(`🤖 AI Property Marketing Generator running on port ${PORT}`);
    console.log(`🌐 Demo interface: http://localhost:${PORT}`);
    console.log(
      `🔗 API endpoint: http://localhost:${PORT}/generate-description`
    );
    console.log(
      `⚡ Mode: ${hasApiKey ? "AI-Powered (Claude/Anthropic)" : "Demo Mode"}`
    );

    if (!hasApiKey) {
      console.log(
        `💡 Add ANTHROPIC_API_KEY to .env file for full AI functionality`
      );
    }
  });
}

module.exports = { generateAIMarketingDescription, app };
