#!/bin/bash
set -e

echo "Starting Django application..."
echo "DATABASE_URL is: ${DATABASE_URL:0:50}..."

echo "Running database migrations..."
python manage.py migrate --noinput

echo "Migrations complete!"
echo "Tables after migration:"
python -c "
from django.db import connection
cursor = connection.cursor()
cursor.execute(\"SELECT table_name FROM information_schema.tables WHERE table_schema='public'\")
tables = [row[0] for row in cursor.fetchall()]
print(f'Found {len(tables)} tables: {tables[:10]}')
"

echo "Starting gunicorn..."
exec gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --threads 2 --timeout 120
