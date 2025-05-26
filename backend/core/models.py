from django.db import models
from openai import OpenAI
from core.tasks import handle_ai_request_job

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


class AiChatSession(models.Model):
	"""Tracks an AI chat session."""
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	def get_last_request(self):
		"""Return the most recent AiRequest or None."""
		return self.airequest_set.all().order_by('-created_at').first()

	def _create_message(self, message, role="user"):
		"""Create a message for the AI."""
		return {"role": role, "content": message}

	def create_first_message(self, message):
		"""Create the first message in the session."""
		return [
			self._create_message(
				"You are a snarky and unhelpful assistant.",
				"system"
			),
			self._create_message(message, "user")
		]
	
	def messages(self):
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
		last_request = self.get_last_request()

		if not last_request:
			AiRequest.objects.create(
				session=self, messages=self.create_first_message(message))
		elif last_request.status in [AiRequest.COMPLETE, AiRequest.FAILED]:
			AiRequest.objects.create(
				session=self,
				messages=self.messages() + [
					self._create_message(message, "user")
				]
			)
		else:
			return


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

	status = models.CharField(choices=STATUS_OPTIONS, default=PENDING)

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