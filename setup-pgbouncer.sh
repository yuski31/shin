#!/bin/bash

echo "🚀 Setting up PgBouncer for PostgreSQL connection pooling..."

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo "❌ This script should not be run as root"
   exit 1
fi

# Install PgBouncer
echo "📦 Installing PgBouncer..."
sudo apt-get update
sudo apt-get install -y pgbouncer

# Create PgBouncer configuration directory
echo "📁 Creating PgBouncer configuration..."
sudo mkdir -p /etc/pgbouncer
sudo cp pglbouncer.ini /etc/pgbouncer/

# Set proper permissions
sudo chown -R postgres:postgres /etc/pgbouncer
sudo chmod 640 /etc/pgbouncer/pglbouncer.ini

# Create log directory
sudo mkdir -p /var/log/pgbouncer
sudo chown postgres:postgres /var/log/pgbouncer

# Create PgBouncer user list
echo "👤 Creating PgBouncer user list..."
sudo sh -c 'echo "\"shintstuff317_db_user\" \"your_password_here\"" > /etc/pgbouncer/userlist.txt'
sudo chown postgres:postgres /etc/pgbouncer/userlist.txt
sudo chmod 600 /etc/pgbouncer/userlist.txt

# Update PgBouncer configuration with actual database details
echo "⚙️ Updating PgBouncer configuration..."
sudo sed -i 's/your_password_here/'$DB_PASSWORD'/g' /etc/pgbouncer/pglbouncer.ini
sudo sed -i 's/cluster0.ki7he68.mongodb.net/shin_ai/g' /etc/pgbouncer/pglbouncer.ini

# Start PgBouncer service
echo "▶️ Starting PgBouncer service..."
sudo systemctl enable pgbouncer
sudo systemctl start pgbouncer

# Check service status
echo "📊 Checking PgBouncer status..."
sudo systemctl status pgbouncer --no-pager

echo "✅ PgBouncer setup completed!"
echo "💡 PgBouncer is now running on port 6432"
echo "💡 You can connect to your database through PgBouncer using:"
echo "   postgresql://shintstuff317_db_user:your_password@localhost:6432/shin_ai"