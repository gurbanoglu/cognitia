from django.db import models


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