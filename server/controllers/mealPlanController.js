const MealPlan = require('../models/MealPlan');
const Recipe = require('../models/Recipe');

// @desc    Get meal plans for current user
// @route   GET /api/meal-plans
// @access  Private
const getMealPlans = async (req, res) => {
  try {
    const mealPlans = await MealPlan.find({ userId: req.user._id })
      .sort({ weekStartDate: -1 });
    
    res.json(mealPlans);
  } catch (error) {
    console.error('Get meal plans error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get meal plan by ID
// @route   GET /api/meal-plans/:id
// @access  Private
const getMealPlanById = async (req, res) => {
  try {
    const mealPlan = await MealPlan.findOne({ 
      _id: req.params.id,
      userId: req.user._id 
    });
    
    if (!mealPlan) {
      return res.status(404).json({ message: 'Meal plan not found' });
    }
    
    res.json(mealPlan);
  } catch (error) {
    console.error('Get meal plan error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a meal plan
// @route   POST /api/meal-plans
// @access  Private
const createMealPlan = async (req, res) => {
  try {
    const { weekStartDate, days } = req.body;
    
    if (!weekStartDate || !days) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    
    // Check if a meal plan for this week already exists
    const existingMealPlan = await MealPlan.findOne({ 
      userId: req.user._id,
      weekStartDate: new Date(weekStartDate)
    });
    
    if (existingMealPlan) {
      return res.status(400).json({ message: 'A meal plan for this week already exists' });
    }
    
    // Create new meal plan
    const mealPlan = new MealPlan({
      userId: req.user._id,
      weekStartDate: new Date(weekStartDate),
      days
    });
    
    const savedMealPlan = await mealPlan.save();
    res.status(201).json(savedMealPlan);
  } catch (error) {
    console.error('Create meal plan error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update a meal plan
// @route   PUT /api/meal-plans/:id
// @access  Private
const updateMealPlan = async (req, res) => {
  try {
    const { weekStartDate, days } = req.body;
    
    const mealPlan = await MealPlan.findOne({ 
      _id: req.params.id,
      userId: req.user._id 
    });
    
    if (!mealPlan) {
      return res.status(404).json({ message: 'Meal plan not found' });
    }
    
    // Update fields
    if (weekStartDate) mealPlan.weekStartDate = new Date(weekStartDate);
    if (days) mealPlan.days = days;
    mealPlan.updatedAt = Date.now();
    
    const updatedMealPlan = await mealPlan.save();
    res.json(updatedMealPlan);
  } catch (error) {
    console.error('Update meal plan error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete a meal plan
// @route   DELETE /api/meal-plans/:id
// @access  Private
const deleteMealPlan = async (req, res) => {
  try {
    const mealPlan = await MealPlan.findOne({ 
      _id: req.params.id,
      userId: req.user._id 
    });
    
    if (!mealPlan) {
      return res.status(404).json({ message: 'Meal plan not found' });
    }
    
    await mealPlan.deleteOne();
    res.json({ message: 'Meal plan removed' });
  } catch (error) {
    console.error('Delete meal plan error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get recipes for meal planning with basic info
// @route   GET /api/meal-plans/recipes
// @access  Private
const getMealPlanRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find({ userId: req.user._id })
      .select('_id title image')
      .sort({ title: 1 });
    
    res.json(recipes);
  } catch (error) {
    console.error('Get meal plan recipes error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  getMealPlans,
  getMealPlanById,
  createMealPlan,
  updateMealPlan,
  deleteMealPlan,
  getMealPlanRecipes
};