# KubeCoin Backend - Python Flask Application
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY app.py .

# Expose port 5000
EXPOSE 5000

# Run the Flask application
CMD ["python", "app.py"]
