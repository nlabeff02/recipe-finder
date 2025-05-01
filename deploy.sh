#!/bin/bash

# Complete Deployment Script for Recipe Finder on OpenStack
# IP Address: 138.49.184.134

# Exit on error
set -e

echo "===== Starting Recipe Finder Deployment ====="

# Update system packages
echo "Updating system packages..."
sudo apt update
sudo apt upgrade -y

# Install necessary prerequisites
echo "Installing Node.js..."
curl -fsSL https://www.mongodb.org/static/pgp/server-6.0.asc | sudo gpg --dearmor -o /usr/share/keyrings/mongodb-archive-keyring.gpg
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-archive-keyring.gpg ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

echo "Installing MongoDB, Nginx, and other dependencies..."
sudo apt update
sudo apt install -y nodejs mongodb-org nginx build-essential

# Start and enable MongoDB
echo "Starting MongoDB service..."
sudo systemctl start mongod
sudo systemctl enable mongod

# Clone the repository if not already present
echo "Cloning recipe-finder repository..."
if [ ! -d "recipe-finder" ]; then
  git clone https://github.com/yourusername/recipe-finder.git
fi

cd recipe-finder

# Create .env file for environment variables
echo "Setting up environment variables..."
cat > .env << EOL
NODE_ENV=production
PORT=3000
MONGO_URI=mongodb://localhost:27017/recipe-finder
JWT_SECRET=e5e82ef2192396fc7285a5fd8cccdd90af3326afeaaf67f9e395bb93bbdfb0d418773edf18495b105e6d13a291e848fcdda5a3fa5f1792c8e2be134dcb2a17717dec7b4b228c095ca2f2900865209bacf4f019e3fc2edad30b79ae99009c859eacad10de1fc6788275b9a7e878d2fc6c3952b612053c86e7f826ac0bca6d6a09f2943030717791c92375309ef44cbfa6b520c5b3e3bf64130cde800b50f092e07e1a8cc0ed6407656410443635b756dee68ba36258e2af0451359f9ffad2116b2d261bdf79fdaa7c0075f7ebeec61b55f6ad9b7e2cf9b15bfd45d80d9f27904498f93a6ffabd4672eb25448a2ce68dd2d4b623499621f55803d619d5ab9ce350
EDAMAM_APP_ID=89fcb55f
EDAMAM_APP_KEY=64c8f45e180e57c28b83b2261865c78c
EOL

# Update Angular API URL to match server IP
echo "Updating Angular environment configuration..."
cat > client/src/environments/environment.prod.ts << EOL
export const environment = {
  production: true,
  apiUrl: 'http://138.49.184.134/api'
};
EOL

# Install server dependencies
echo "Installing server dependencies..."
npm install

# Build the Angular client
echo "Building Angular client..."
cd client
npm install
npm run build --prod
cd ..

# Install PM2 globally
echo "Installing PM2 process manager..."
sudo npm install -g pm2

# Setup Nginx configuration
echo "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/recipe-finder > /dev/null << EOL
server {
    listen 80;
    server_name 138.49.184.134;

    location / {
        root /home/ubuntu/recipe-finder/client/dist/client;
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOL

# Enable the site and disable default
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/recipe-finder /etc/nginx/sites-enabled/

# Test Nginx configuration
echo "Testing Nginx configuration..."
sudo nginx -t

# Restart Nginx
echo "Restarting Nginx..."
sudo systemctl restart nginx

# Start the application with PM2
echo "Starting the application with PM2..."
pm2 stop recipe-finder 2>/dev/null || true
pm2 start server/server.js --name "recipe-finder" --env production

# Setup PM2 to start on system boot
echo "Setting up PM2 startup..."
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu
pm2 save

# Seed the database with initial users (if needed)
echo "Do you want to seed the database with 5000 test users? (y/n)"
read seed_db
if [ "$seed_db" = "y" ]; then
  echo "Seeding database..."
  node server/scripts/seedUsers.js
fi

echo "===== Deployment Complete ====="
echo "Recipe Finder should now be accessible at: http://138.49.184.134"
echo "MongoDB is running on localhost:27017"
echo "Node.js API server is running on localhost:3000"
