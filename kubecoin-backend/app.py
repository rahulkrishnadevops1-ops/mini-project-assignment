"""
KubeCoin Backend - The Broker
A Flask application for the KubeCoin crypto exchange simulator.
Designed for Kubernetes deployment and teaching.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
import psycopg2.pool
from psycopg2 import sql
import os
import socket
import hashlib

app = Flask(__name__)
CORS(app)

# Global state for liveness probe demo
IS_HEALTHY = True

# Database configuration from environment variables
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_NAME = os.getenv('DB_NAME', 'kubecoin')
DB_USER = os.getenv('DB_USER', 'postgres')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'password')

# Connection Pool (Global)
# Min 1 connection, Max 10 connections
try:
    db_pool = psycopg2.pool.SimpleConnectionPool(
        1, 10,
        host=DB_HOST,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )
    print("✅ Database connection pool created")
except Exception as e:
    print(f"❌ Failed to create database connection pool: {e}")
    # We don't exit here to allow the pod to start and demonstrate Init Containers
    # (if the DB isn't ready, requests will fail)
    db_pool = None

def get_db_connection():
    """
    Get a connection from the pool.
    """
    if db_pool is None:
        # Try to reconnect or fail
        raise psycopg2.OperationalError("Database pool is not initialized")
    
    return db_pool.getconn()

def put_db_connection(conn):
    """
    Return connection to the pool.
    """
    if db_pool and conn:
        db_pool.putconn(conn)


def ensure_user_exists(cursor, wallet_id):
    """Create user if they don't exist, return their current stats."""
    # Check if user exists
    cursor.execute(
        "SELECT balance, coins FROM wallets WHERE id = %s",
        (wallet_id,)
    )
    result = cursor.fetchone()
    
    if result is None:
        # Create new user with default balance
        cursor.execute(
            "INSERT INTO wallets (id, balance, coins) VALUES (%s, %s, %s)",
            (wallet_id, 1000.00, 0.00)
        )
        return 1000.00, 0.00
    
    return result[0], result[1]


# ============================================
# API ENDPOINTS
# ============================================

@app.route('/api/data/<wallet_id>', methods=['GET'])
def get_data(wallet_id):
    """
    Fetch user stats and identify the serving pod.
    Creates user if they don't exist.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        balance, coins = ensure_user_exists(cursor, wallet_id)
        conn.commit()
        
        return jsonify({
            'balance': float(balance),
            'coins': float(coins),
            'pod_id': socket.gethostname()
        })
    finally:
        cursor.close()
        put_db_connection(conn)


@app.route('/api/buy', methods=['POST'])
def buy():
    """
    Buy KubeCoins with USD.
    Uses dynamic price from frontend.
    """
    data = request.get_json()
    wallet_id = data.get('id')
    amount = float(data.get('amount', 0))  # Number of coins to buy
    price = float(data.get('price', 10))   # Price per coin (default $10)
    
    if amount <= 0:
        return jsonify({'status': 'error', 'message': 'Invalid amount'}), 400
    
    if price <= 0:
        return jsonify({'status': 'error', 'message': 'Invalid price'}), 400
    
    # Calculate total cost
    total_cost = amount * price
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Get current balance
        cursor.execute(
            "SELECT balance FROM wallets WHERE id = %s",
            (wallet_id,)
        )
        result = cursor.fetchone()
        
        if result is None:
            return jsonify({'status': 'error', 'message': 'User not found'}), 404
        
        current_balance = float(result[0])
        
        if current_balance < total_cost:
            return jsonify({'status': 'error', 'message': f'Insufficient balance. Need ${total_cost:.2f}, have ${current_balance:.2f}'}), 400
        
        # Update balance and coins
        cursor.execute(
            "UPDATE wallets SET balance = balance - %s, coins = coins + %s WHERE id = %s",
            (total_cost, amount, wallet_id)
        )
        conn.commit()
        
        return jsonify({
            'status': 'success',
            'message': f'Purchased {amount:.2f} coins for ${total_cost:.2f} @ ${price:.2f}/coin',
            'pod_id': socket.gethostname()
        })
    finally:
        cursor.close()
        put_db_connection(conn)


@app.route('/api/sell', methods=['POST'])
def sell():
    """
    Sell KubeCoins for USD.
    Uses dynamic price from frontend.
    """
    data = request.get_json()
    wallet_id = data.get('id')
    amount = float(data.get('amount', 0))  # Amount in coins
    price = float(data.get('price', 10))   # Price per coin (default $10)
    
    if amount <= 0:
        return jsonify({'status': 'error', 'message': 'Invalid amount'}), 400
    
    if price <= 0:
        return jsonify({'status': 'error', 'message': 'Invalid price'}), 400
    
    # Calculate total revenue
    total_revenue = amount * price
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Get current coins
        cursor.execute(
            "SELECT coins FROM wallets WHERE id = %s",
            (wallet_id,)
        )
        result = cursor.fetchone()
        
        if result is None:
            return jsonify({'status': 'error', 'message': 'User not found'}), 404
        
        current_coins = float(result[0])
        
        if current_coins < amount:
            return jsonify({'status': 'error', 'message': f'Insufficient coins. Have {current_coins:.2f}, tried to sell {amount:.2f}'}), 400
        
        # Update coins and balance
        cursor.execute(
            "UPDATE wallets SET coins = coins - %s, balance = balance + %s WHERE id = %s",
            (amount, total_revenue, wallet_id)
        )
        conn.commit()
        
        return jsonify({
            'status': 'success',
            'message': f'Sold {amount:.2f} coins for ${total_revenue:.2f} @ ${price:.2f}/coin',
            'pod_id': socket.gethostname()
        })
    finally:
        cursor.close()
        put_db_connection(conn)


@app.route('/api/mine', methods=['POST'])
def mine():
    """
    CPU-intensive mining operation.
    Used to demonstrate K8s resource limits and autoscaling.
    """
    data = request.get_json()
    wallet_id = data.get('id')
    
    # CPU-heavy loop: Calculate 1,000,000 SHA256 hashes
    for i in range(1000000):
        hashlib.sha256(str(i).encode()).hexdigest()
    
    # Reward user with 1 coin
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute(
            "UPDATE wallets SET coins = coins + 1 WHERE id = %s",
            (wallet_id,)
        )
        conn.commit()
        
        return jsonify({
            'status': 'success',
            'message': 'Mining complete! Earned 1 KubeCoin',
            'pod_id': socket.gethostname()
        })
    finally:
        cursor.close()
        put_db_connection(conn)


@app.route('/api/reset', methods=['POST'])
def reset():
    """
    Emergency bailout - Reset user to default state.
    """
    data = request.get_json()
    wallet_id = data.get('id')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute(
            "UPDATE wallets SET balance = 1000, coins = 0 WHERE id = %s",
            (wallet_id,)
        )
        conn.commit()
        
        return jsonify({
            'status': 'success',
            'message': 'Account reset to default',
            'pod_id': socket.gethostname()
        })
    finally:
        cursor.close()
        put_db_connection(conn)


@app.route('/health', methods=['GET'])
def health():
    """
    Liveness probe endpoint for Kubernetes.
    Returns 200 if healthy, 500 if not.
    """
    global IS_HEALTHY
    
    if IS_HEALTHY:
        return jsonify({'status': 'healthy', 'pod_id': socket.gethostname()}), 200
    else:
        return jsonify({'status': 'unhealthy', 'pod_id': socket.gethostname()}), 500


@app.route('/kill', methods=['POST'])
def kill():
    """
    Sabotage endpoint - Makes the pod fail liveness checks.
    Used by instructors to demonstrate K8s pod restart behavior.
    """
    global IS_HEALTHY
    IS_HEALTHY = False
    
    return jsonify({
        'status': 'success',
        'message': 'Pod marked as unhealthy. K8s will restart it soon.',
        'pod_id': socket.gethostname()
    })


# ============================================
# MAIN
# ============================================

if __name__ == '__main__':
    print(f"🚀 KubeCoin Backend starting on Pod: {socket.gethostname()}")
    print(f"📊 Database: {DB_HOST}/{DB_NAME}")
    print("⚠️ WARNING: Running with Flask development server. Use Gunicorn for production.")
    
    # Run on 0.0.0.0 for container access (Development only)
    app.run(host='0.0.0.0', port=5000, debug=True)
