const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipeId: { type: String, required: true },
  title: { type: String, required: true },
  image: { type: String },
  source: { type: String },
  sourceUrl: { type: String },
  ingredients: [String],
  calories: Number,
  totalTime: Number,
  dietLabels: [String],
  healthLabels: [String],
  nutrients: {
    protein: Number,
    fat: Number,
    carbs: Number,
    // Additional nutrients as needed
  },
  savedAt: { type: Date, default: Date.now }
});

// Compound index to prevent duplicate saved recipes for a user
recipeSchema.index({ userId: 1, recipeId: 1 }, { unique: true });

const Recipe = mongoose.model('Recipe', recipeSchema);

module.exports = Recipe;