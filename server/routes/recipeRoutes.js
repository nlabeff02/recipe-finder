const express = require('express');
const router = express.Router();
const { 
  searchRecipes, 
  getSavedRecipes, 
  getSavedRecipeById,
  saveRecipe,
  deleteSavedRecipe
} = require('../controllers/recipeController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected
router.get('/search', protect, searchRecipes);

router.route('/saved')
  .get(protect, getSavedRecipes)
  .post(protect, saveRecipe);

router.route('/saved/:id')
  .get(protect, getSavedRecipeById)
  .delete(protect, deleteSavedRecipe);

module.exports = router;