#!/bin/bash

# Recipe Finder Deployment Script for OpenStack
# This script prepares and deploys the application to an OpenStack server

# Exit on error
set -e

echo "Starting Recipe Finder deployment..."

# Build the Angular client
echo "Building Angular client..."
cd client
npm install
npm run build --prod
cd ..

# Install server dependencies
echo "Installing server dependencies..."
npm install --production

# Setup environment variables if not already set
if [ ! -f .env ]; then
  echo "Creating .env file..."
  echo "NODE_ENV=production" > .env
  echo "PORT=3000" >> .env
  echo "MONGO_URI=mongodb://localhost:27017/recipe-finder" >> .env
  echo "JWT_SECRET=e5e82ef2192396fc7285a5fd8cccdd90af3326afeaaf67f9e395bb93bbdfb0d418773edf18495b105e6d13a291e848fcdda5a3fa5f1792c8e2be134dcb2a17717dec7b4b228c095ca2f2900865209bacf4f019e3fc2edad30b79ae99009c859eacad10de1fc6788275b9a7e878d2fc6c3952b612053c86e7f826ac0bca6d6a09f2943030717791c92375309ef44cbfa6b520c5b3e3bf64130cde800b50f092e07e1a8cc0ed6407656410443635b756dee68ba36258e2af0451359f9ffad2116b2d261bdf79fdaa7c0075f7ebeec61b55f6ad9b7e2cf9b15bfd45d80d9f27904498f93a6ffabd4672eb25448a2ce68dd2d4b623499621f55803d619d5ab9ce350" >> .env
  echo "EDAMAM_APP_ID=89fcb55f" >> .env
  echo "EDAMAM_APP_KEY=64c8f45e180e57c28b83b2261865c78c" >> .env
fi

# Start the application with PM2 (install if not present)
echo "Setting up PM2 process manager..."
if ! command -v pm2 &> /dev/null; then
  npm install -g pm2
fi

# Stop any existing instance
pm2 stop recipe-finder 2>/dev/null || true

# Start the application
echo "Starting the application with PM2..."
pm2 start server/server.js --name "recipe-finder" --env production

# Setup PM2 to start on system boot
echo "Setting up PM2 startup..."
pm2 startup
pm2 save

echo "Deployment completed! The application is running on port 3000."
echo "Make sure MongoDB is installed and running on your system."