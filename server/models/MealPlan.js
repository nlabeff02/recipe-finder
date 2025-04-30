const mongoose = require('mongoose');

const mealPlanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  weekStartDate: { type: Date, required: true },
  days: [{
    day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
    breakfast: { type: String, ref: 'Recipe' },
    lunch: { type: String, ref: 'Recipe' },
    dinner: { type: String, ref: 'Recipe' }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Index for faster lookup of a user's meal plans
mealPlanSchema.index({ userId: 1, weekStartDate: 1 });

const MealPlan = mongoose.model('MealPlan', mealPlanSchema);

module.exports = MealPlan;