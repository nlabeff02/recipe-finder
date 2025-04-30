const fetch = require('node-fetch');
const Recipe = require('../models/Recipe');
const config = require('../config/default');

// @desc    Search recipes from Edamam API
// @route   GET /api/recipes/search
// @access  Private
const searchRecipes = async (req, res) => {
  try {
    const { query, diet, health, mealType, cuisineType, page = 0, limit = 12 } = req.query;
    
    if (!query && !diet && !health && !mealType && !cuisineType) {
      return res.status(400).json({ message: 'At least one search parameter is required' });
    }

    // Build query parameters
    const params = new URLSearchParams({
      app_id: config.edamamApiId,
      app_key: config.edamamApiKey,
      type: 'public'
    });

    if (query) params.append('q', query);
    
    // Handle diet labels (vegetarian, vegan, etc.)
    if (diet) {
      if (Array.isArray(diet)) {
        diet.forEach(d => params.append('diet', d));
      } else {
        params.append('diet', diet);
      }
    }
    
    // Handle health labels (gluten-free, dairy-free, etc.)
    if (health) {
      if (Array.isArray(health)) {
        health.forEach(h => params.append('health', h));
      } else {
        params.append('health', health);
      }
    }
    
    // Handle meal type (breakfast, lunch, dinner, etc.)
    if (mealType) {
      if (Array.isArray(mealType)) {
        mealType.forEach(m => params.append('mealType', m));
      } else {
        params.append('mealType', mealType);
      }
    }
    
    // Handle cuisine type (American, Asian, etc.)
    if (cuisineType) {
      if (Array.isArray(cuisineType)) {
        cuisineType.forEach(c => params.append('cuisineType', c));
      } else {
        params.append('cuisineType', cuisineType);
      }
    }
    
    // Calculate pagination (_cont token will be used for "next page")
    if (page > 0) {
      params.append('_cont', req.query._cont);
    }
    params.append('random', 'false'); // Ensure consistent results for pagination
    
    // Make request to Edamam API
    const response = await fetch(`${config.edamamBaseUrl}${config.edamamEndpoint}?${params.toString()}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Edamam API error:', errorData);
      return res.status(response.status).json({ 
        message: 'Error fetching recipes from external API',
        details: errorData
      });
    }
    
    const data = await response.json();
    
    // Transform the response to a more client-friendly format
    const recipes = data.hits.map(hit => {
      const recipe = hit.recipe;
      return {
        recipeId: extractRecipeId(recipe.uri),
        title: recipe.label,
        image: recipe.image,
        source: recipe.source,
        sourceUrl: recipe.url,
        ingredients: recipe.ingredientLines,
        calories: Math.round(recipe.calories),
        totalTime: recipe.totalTime,
        servings: recipe.yield,
        dietLabels: recipe.dietLabels,
        healthLabels: recipe.healthLabels,
        cautions: recipe.cautions,
        nutrients: {
          protein: Math.round(recipe.totalNutrients.PROCNT?.quantity || 0),
          fat: Math.round(recipe.totalNutrients.FAT?.quantity || 0),
          carbs: Math.round(recipe.totalNutrients.CHOCDF?.quantity || 0),
          fiber: Math.round(recipe.totalNutrients.FIBTG?.quantity || 0),
          sugar: Math.round(recipe.totalNutrients.SUGAR?.quantity || 0)
        }
      };
    });
    
    res.json({
      recipes,
      _links: data._links,
      count: data.count,
      from: data.from,
      to: data.to
    });
  } catch (error) {
    console.error('Recipe search error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get saved recipes for current user
// @route   GET /api/recipes/saved
// @access  Private
const getSavedRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find({ userId: req.user._id })
      .sort({ savedAt: -1 });
    
    res.json(recipes);
  } catch (error) {
    console.error('Get saved recipes error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get saved recipe by ID
// @route   GET /api/recipes/saved/:id
// @access  Private
const getSavedRecipeById = async (req, res) => {
  try {
    const recipe = await Recipe.findOne({ 
      _id: req.params.id,
      userId: req.user._id 
    });
    
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }
    
    res.json(recipe);
  } catch (error) {
    console.error('Get saved recipe error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Save a recipe
// @route   POST /api/recipes/saved
// @access  Private
const saveRecipe = async (req, res) => {
  try {
    const { 
      recipeId, title, image, source, sourceUrl, ingredients,
      calories, totalTime, dietLabels, healthLabels, nutrients 
    } = req.body;
    
    if (!recipeId || !title) {
      return res.status(400).json({ message: 'Recipe ID and title are required' });
    }
    
    // Check if recipe already saved
    const existingRecipe = await Recipe.findOne({ 
      userId: req.user._id,
      recipeId: recipeId
    });
    
    if (existingRecipe) {
      return res.status(400).json({ message: 'Recipe already saved' });
    }
    
    // Create new saved recipe
    const recipe = new Recipe({
      userId: req.user._id,
      recipeId,
      title,
      image,
      source,
      sourceUrl,
      ingredients,
      calories,
      totalTime,
      dietLabels,
      healthLabels,
      nutrients
    });
    
    const savedRecipe = await recipe.save();
    res.status(201).json(savedRecipe);
  } catch (error) {
    console.error('Save recipe error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete saved recipe
// @route   DELETE /api/recipes/saved/:id
// @access  Private
const deleteSavedRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findOne({ 
      _id: req.params.id,
      userId: req.user._id 
    });
    
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }
    
    await recipe.deleteOne();
    res.json({ message: 'Recipe removed' });
  } catch (error) {
    console.error('Delete recipe error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Helper function to extract recipe ID from URI
const extractRecipeId = (uri) => {
  if (!uri) return '';
  const parts = uri.split('#recipe_');
  return parts.length > 1 ? parts[1] : '';
};

module.exports = {
  searchRecipes,
  getSavedRecipes,
  getSavedRecipeById,
  saveRecipe,
  deleteSavedRecipe
};