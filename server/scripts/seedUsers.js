const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
require('dotenv').config();

// Connect to database
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/recipe-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Function to generate random users
async function generateUsers(count) {
  try {
    // Clear existing users
    await User.deleteMany({});
    console.log('Existing users removed');
    
    const users = [];
    const defaultPassword = await bcrypt.hash('password123', 10);
    
    console.log(`Generating ${count} users...`);
    
    for (let i = 0; i < count; i++) {
      // Create admin users for first 5
      const role = i < 5 ? 'admin' : 'user';
      
      // Add some variety to dietary preferences
      const dietaryPrefs = [];
      if (i % 4 === 0) dietaryPrefs.push('Vegetarian');
      if (i % 6 === 0) dietaryPrefs.push('GlutenFree');
      if (i % 8 === 0) dietaryPrefs.push('Vegan');
      
      // Add some variety to allergies
      const allergies = [];
      if (i % 5 === 0) allergies.push('Peanuts');
      if (i % 7 === 0) allergies.push('Shellfish');
      if (i % 9 === 0) allergies.push('Dairy');
      
      users.push({
        username: `user${i}`,
        password: defaultPassword,
        email: `user${i}@example.com`,
        role: role,
        preferences: {
          dietaryPreferences: dietaryPrefs,
          allergies: allergies
        },
        active: true
      });
      
      // Insert in batches of 500 to avoid memory issues
      if (users.length === 500 || i === count - 1) {
        await User.insertMany(users);
        console.log(`Inserted batch of ${users.length} users`);
        users.length = 0; // Clear the array
      }
    }
    
    console.log(`Successfully added ${count} users to the database`);
  } catch (error) {
    console.error('Error seeding users:', error);
  } finally {
    mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
}

// Run the function to generate 5000 users
generateUsers(5000);