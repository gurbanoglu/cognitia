import logging
from django.core.mail import EmailMessage
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework import status
from django.contrib.auth import get_user_model
from core.models import ActivationToken
from datetime import timedelta
from django.utils import timezone
from google.oauth2 import id_token
from google.auth.transport import requests
import secrets
import requests
from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import login
from django.views.decorators.http import require_GET
from django.middleware.csrf import get_token
from django.views.decorators.cache import never_cache

logger = logging.getLogger(__name__)

def create_activation_token_obj(user, activation_token):
	# Create the ActivationToken object.
	ActivationToken.objects.create(
		user=user,
		activation_token=activation_token,
		expires_at=timezone.now() + timedelta(hours=24),
		# Default setting.
		used=False
	)
	print('Activation token object created.')

User = get_user_model()

def create_user_if_not_exists(email_address, activation_token):
	# Try to find the user
	user = User.objects.filter(email_address=email_address).first()

	if user:
		if user.is_active:
			print('The user already exists and has an active account.')
			return
		else:
			print('The user exists, but their account is not active.')
	else:
		print('New User object created')

		# Create a new user if not found
		user = User.objects.create_user(
			email_address=email_address
		)

		user.save()

	# Only reach here if user is not active (either found or just created)
	create_activation_token_obj(user, activation_token)

# Nonce
def generate_activation_token():
  # Generates a URL-safe, 32-byte random token
	# (can adjust length).
  return secrets.token_urlsafe(32)

@api_view(['POST'])
@permission_classes([AllowAny])
def send_verification_code(request):
	"""
	Endpoint to send a verification email to the user.
	Expects JSON payload with 'emailAddress' key.
	"""

	activation_token = str(generate_activation_token())

	try:
		data = request.data

		email_address = data.get('emailAddress')

		if not email_address:
			logger.warning("Verification email request missing 'email' field.")

			return JsonResponse(
				{'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST
			)

		email_body = (
			f'<p style="font-size: 1.2rem;">'
			f'Click on the subsequent link to confirm your Cognitia sign up: <br>'
			f'http://localhost:5173/confirm-email/{activation_token}'
			f'</p>'
		)

		# Compose the email.
		email = EmailMessage(
			subject='Sign in to Cognitia',
			body=email_body,
			from_email='team.cognitia.ai@gmail.com',
			to=[email_address],
			headers={'X-Custom-Header': 'CognitiaVerification'}
		)

		# This way the font size of values assigned
		# to body can be larger.
		email.content_subtype = "html"

		# Send the email asynchronously in production
		# (example: using Celery).
		email.send(fail_silently=False)

		create_user_if_not_exists(email_address, activation_token)

		logger.info(f"Sent verification email to {email_address}")

		return JsonResponse(
			{'message': 'Verification email sent successfully'},
			status=status.HTTP_200_OK
		)

	except Exception as exc:
		logger.error(f"Error sending verification email: {exc}", exc_info=True)

		return JsonResponse(
			{'error': 'Internal server error. Please try again later.'},
			status=status.HTTP_500_INTERNAL_SERVER_ERROR
		)

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_token(request):
	activation_token = request.data.get('activationToken')

	try:
		activation_token_obj = ActivationToken.objects.get(
			activation_token=activation_token
		)
	except ActivationToken.DoesNotExist:
		return JsonResponse({"message": "Token doesn't exist"}, status=400)

	if activation_token_obj.used:
		return JsonResponse({"message": "Token already used"}, status=400)

	if activation_token_obj.is_expired():
		return JsonResponse({"message": "Token expired"}, status=400)

	# Activate user account
	user = activation_token_obj.user
	user.is_active = True
	user.save()

	# Mark token as used.
	activation_token_obj.mark_used()

	return JsonResponse(
		{"message": "Account activated successfully"},
		status=200
	)

@api_view(['POST'])
@permission_classes([AllowAny])
def check_if_active(request):
	email_address = request.data.get('emailAddress')

	# Get the user from the database.
	user = User.objects.filter(email_address=email_address).first()

	# An active user shouldn't need to click on a link
	# sent to their email everytime they attempt to sign
	# in on the same device.
	if user:
		if user.is_active:
			return JsonResponse(
				{"message": "Active user already exists in the database"},
				status=200
			)
	else:
		return JsonResponse(
			{"message": "Account not activated."},
			status=200
		)
	
@api_view(['POST'])
@permission_classes([AllowAny])
def login_with_email(request):
	try:
		email_address = request.data.get('emailAddress')

		# Get the user from the database.
		user = User.objects.filter(email_address=email_address).first()

		'''
		Authenticates the user by storing the user's ID
		and the authentication backend path in the session
		data tied to the current request.
		
		Django sets a session cookie in the browser. This
		cookie is sent with every subsequent request to
		the server.

		Django uses this cookie to retrieve the session and
		identify the user, making request.user an authenticated
		user object instead of AnonymousUser.'''
		login(request, user)

		return JsonResponse(
			{"message": "Login successful."},
			status=200
		)
	except:
		return JsonResponse(
			{"message": "Login failed."},
			status=400
		)


class GoogleAuthView(APIView):
	def post(self, request):
		token = request.data.get('token')

		# Verify the token with Google
		google_response = requests.get(
			'https://oauth2.googleapis.com/tokeninfo',
			params={'id_token': token}
		)

		if google_response.status_code != 200:
			return Response(
				{'error': 'Invalid token'},
				status=status.HTTP_400_BAD_REQUEST
			)

		user_info = google_response.json()

		email_address = user_info['email_address']

		# get_or_create() ensures the user is saved
		# if they do not already exist.
		user, create = User.objects.get_or_create(
			email_address=email_address,
			defaults={'email_address': email_address}
		)

		return Response({'success': True, 'user_id': user.id})

@require_GET
@never_cache
def get_csrf_token(request):
	csrfToken = get_token(request)

	return JsonResponse({'csrfToken': csrfToken})