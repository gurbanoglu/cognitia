from django.db import models
from openai import OpenAI
from core.tasks import handle_ai_request_job
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.conf import settings
from django.db import models
from django.utils import timezone
import base64
import os
from django.utils.text import slugify
import uuid


class CustomUserManager(BaseUserManager):
	def create_user(self, email_address):
		if not email_address:
			raise ValueError('An email address must be set')

		email_address = self.normalize_email(email_address)

		user = self.model(email_address=email_address)

		user.save(using=self._db)

		return user

	def create_superuser(self, email_address, password=None):
		user = self.create_user(email_address)
		user.is_superuser = True
		user.is_staff = True
		user.save(using=self._db)
		return user


class CustomUser(AbstractBaseUser, PermissionsMixin):
	email_address = models.EmailField(unique=True)
	is_active = models.BooleanField(default=True)
	is_staff = models.BooleanField(default=False)

	# In Django, USERNAME_FIELD tells the authentication
	# system which field should be used to uniquely
	# identify a user.
	USERNAME_FIELD = 'email_address'

	objects = CustomUserManager()

	def __str__(self):
		return self.email_address


class ActivationToken(models.Model):
	# OneToOneField links token to a single user.
	user = models.OneToOneField(
		settings.AUTH_USER_MODEL, on_delete=models.CASCADE
	)

	# The unique activation token.
	activation_token = models.CharField(max_length=64, unique=True)

	created_at = models.DateTimeField(auto_now_add=True)

	# expires_at defines token expiration time.
	expires_at = models.DateTimeField()

	# used flags whether token has been consumed.
	used = models.BooleanField(default=False)

	def is_expired(self):
		return timezone.now() > self.expires_at

	def mark_used(self):
		self.used = True
		self.save()

'''
The following class is a blueprint for a type
called "Recipe".

A blueprint defines the state and behaviour of
an object.

An object's state is the data is stores while its
behaviour is the methods that can be invoked on it.'''
class Recipe(models.Model):
	"""Represents a recipe in the system."""
	name = models.CharField(max_length=255)
	steps = models.TextField()

	def __str__(self):
		return self.name

def generate_session_id():
  # 16 random bytes = 128 bits of entropy
  random_bytes = os.urandom(16)

  # URL-safe Base64 encode (no +, /, or =)
  session_id = base64.urlsafe_b64encode(random_bytes).decode('utf-8')

  # Optionally strip trailing "=" padding
  return session_id.rstrip('=')


class AiChatSession(models.Model):
	"""Tracks an AI chat session."""

	user = models.ForeignKey(
		CustomUser,
		# Deletes sessions when user is deleted
		on_delete=models.CASCADE,
		# Allows user.chat_sessions.all()
		related_name='chat_sessions',
		null=True
  )

	# Initially when a chat session is created,
	# a session ID is not yet needed.
	session_id = models.CharField(max_length=36, null=True, blank=True)

	title = models.CharField(max_length=200, blank=True)

	slug = models.SlugField(
		max_length=260,
		unique=True,
		blank=True,
		null=True
	)

	def save(self, *args, **kwargs):
		if not self.slug and self.title:
			base = slugify(self.title)
			slug_suffix = self.session_id or str(uuid.uuid4())[:8]

			self.slug = f"{base}-{slug_suffix}"

		super().save(*args, **kwargs)

	def get_last_request(self):
		"""Return the most recent AiRequest or None."""
		return self.airequest_set.all().order_by('-created_at').first()

	def _create_message(self, message, role="user"):
		"""Create a message for the AI."""
		return {"role": role, "content": message}

	def create_first_message(self, message):
		"""Create the first message in the session."""
		return [
			self._create_message(message, "user")
		]

	def get_all_messages(self):
		"""Return messages in the conversation including the AI response."""
		all_messages = []
		request = self.get_last_request()

		if request:
			all_messages.extend(request.messages)
			try:
				all_messages.append(request.response["choices"][0]["message"])
			except (KeyError, TypeError, IndexError):
				pass

		return all_messages

	def send(self, message):
		"""Send a message to the AI."""

		if not self.title:
			self.title = message[:50]

			self.save()

		last_request = self.get_last_request()

		if not last_request:
			AiRequest.objects.create(
				session=self, messages=self.create_first_message(message))
		elif last_request.status in [AiRequest.COMPLETE, AiRequest.FAILED]:
			AiRequest.objects.create(
				session=self,
				messages=self.get_all_messages() + [
					self._create_message(message, "user")
				]
			)
		else:
			return
		
	def edit_user_message(self, message_index: int, new_content: str):
		"""
		Edit a specific user message and regenerate the response
		for just that point.

		Only messages[message_index] and messages[message_index + 1]
		will change.
		"""

		last_request = self.get_last_request()

		if not last_request:
			raise ValueError("No existing messages to edit.")

		# Copy the existing message history.
		messages = list(last_request.messages)

		if not (0 <= message_index < len(messages)):
			raise IndexError("Invalid message index.")

		# Make sure the edited message is from the user.
		if messages[message_index]["role"] != "user":
			raise ValueError("Only user messages can be edited.")

		# Update the user message content.
		messages[message_index]["content"] = new_content

		# Truncate messages after the user message
		# (remove old AI response + any later content)
		truncated = messages[:message_index + 1]

		client = OpenAI()

		try:
			# Regenerate the AI response for the new input
			response = client.chat.completions.create(
				model="gpt-4o-mini",
				messages=truncated
			)

			assistant_reply = response.choices[0].message.to_dict()

			# Reconstruct the messages list:
			new_messages = messages[:message_index + 1] + [assistant_reply]

			print('new messages:', new_messages)

			# Save a new AiRequest with updated messages.
			new_request = AiRequest.objects.create(
				session=self,
				messages=new_messages,
				response=response.to_dict(),
				status=AiRequest.COMPLETE
			)

			return new_request
		except Exception as e:
			print(f"Failed to regenerate answer: {e}")
			raise

	# Determines how the object will be outputted.
	def __str__(self):
		return self.title


class AiRequest(models.Model):
	"""Represents an AI request."""

	PENDING = 'pending'
	RUNNING = 'running'
	COMPLETE = 'complete'
	FAILED = 'failed'

	STATUS_OPTIONS = (
		(PENDING, 'Pending'),
		(RUNNING, 'Running'),
		(COMPLETE, 'Complete'),
		(FAILED, 'Failed')
	)

	status = models.CharField(
		choices=STATUS_OPTIONS,
		default=PENDING
	)

	# "session" is the ID of the session
	# that the AI request is part of.
	session = models.ForeignKey(
		AiChatSession,

		# Upon deleting a session, delete all
		# AI requests for that session.
		on_delete=models.CASCADE,

		null=True,
		blank=True
	)

	# The messages sent to the AI chatbot.
	messages = models.JSONField()

	response = models.JSONField(null=True, blank=True)

	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	# The leading underscore indicates that the
	# subsequent method is private. Thus, it shouldn't
	# be invoked outside of the class.
	def _queue_job(self):
		"""Add job to queue."""
		handle_ai_request_job(self.id)

	def handle(self):
		"""Handle request."""
		self.status = self.RUNNING
		self.save()

		client = OpenAI()

		try:
			completion = client.chat.completions.create(
				model="gpt-4o-mini",
				messages=self.messages
			)

			# The response from OpenAI.
			self.response = completion.to_dict()

			self.status = self.COMPLETE
		except Exception:
			self.status = self.FAILED

		self.save()

	# Only run an AI request the first time
	# the AI request is made.
	def save(self, **kwargs):
		is_new = self._state.adding

		super().save(**kwargs)

		if is_new:
			self._queue_job()