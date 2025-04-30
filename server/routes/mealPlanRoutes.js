const express = require('express');
const router = express.Router();
const { 
  getMealPlans, 
  getMealPlanById, 
  createMealPlan, 
  updateMealPlan, 
  deleteMealPlan,
  getMealPlanRecipes
} = require('../controllers/mealPlanController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected
// Special route for recipes must come before /:id
router.get('/recipes', protect, getMealPlanRecipes);

router.route('/')
  .get(protect, getMealPlans)
  .post(protect, createMealPlan);

router.route('/:id')
  .get(protect, getMealPlanById)
  .put(protect, updateMealPlan)
  .delete(protect, deleteMealPlan);

module.exports = router;