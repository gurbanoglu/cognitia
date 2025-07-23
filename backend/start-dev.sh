# export DJANGO_SETTINGS_MODULE=backend.settings

# # Wait for the database to be ready
# # echo "Waiting for database to be ready..."
# # ./wait-for-it.sh db:5432 --timeout=60 --strict -- echo "Database is ready"

# echo "Checking Redis connection..."
# python -c "import channels.layers; print(channels.layers.get_channel_layer())"

# echo "Applying migrations..."
# python manage.py makemigrations
# python manage.py migrate

# echo "Starting Daphne with autoreload using watchgod..."
# watchgod run_daphne.run backend