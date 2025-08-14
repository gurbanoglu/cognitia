import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from core.models import AiChatSession, ChatMessage, AiRequest
from core.serializers import AiChatSessionSerializer
from asgiref.sync import sync_to_async
from django.db import transaction
from core.tasks import handle_ai_request_job
import json

def serialize_session(session):
	serializer = AiChatSessionSerializer(session)
	return serializer.data

async def wait_for_assistant_message(session, timeout=None):
	while True:
		messages = await sync_to_async(session.messages)()

		for message in messages:
			if message["role"] == "assistant":
				return messages

		await asyncio.sleep(0.5)


class NotificationConsumer(AsyncWebsocketConsumer):
	async def connect(self):
		self.user = self.scope["user"]

		if self.user.is_anonymous:
			await self.close()
			print('NotificationConsumer not connected!')
		else:
			await self.accept()
			print('NotificationConsumer connected!')

	async def disconnect(self, close_code):
		print('NotificationConsumer disconnected!')
		await super().disconnect(close_code)

	async def receive(self, text_data):
		data = json.loads(text_data)

		session_id = data.get('session_id')
		message = data.get('message')

		if not session_id or not message:
			await self.send(text_data=json.dumps({
				'error': 'session_id and message are required'
			}))
			return
		print('consumers.py 52 message:', message)
		try:
			session = await sync_to_async(AiChatSession.objects.get)(
				session_id=session_id,
				user=self.scope["user"]
			)
		except AiChatSession.DoesNotExist:
			await self.send(text_data=json.dumps({
				'error': 'Chat session not found'
			}))
			return
		
		# Join the WebSocket group for this session
		await self.channel_layer.group_add(
			session_id,
			self.channel_name
		)

		# Enqueue the message for AI response
		# Create an AiRequest and queue the task
		# before the transaction commits.
		await sync_to_async(session.send)(message)

		# Get the most recent AI request
		last_request = await sync_to_async(session.get_last_request)()
		print('backend/core/consumers.py 77 last_request:', last_request)
		if last_request:
			# The subsequent line invokes session.messages().
			messages = await wait_for_assistant_message(session)

			# Print to console for debug
			print("consumers.py 83 all messages in session:")
			for msg in messages:
				print(f"{msg['role']}: {msg['content']}")

			print('consumers.py 87 messages:', messages)

			# Optionally, send messages over WebSocket
			await self.send(text_data=json.dumps({
				"type": "full_message_log",
				"messages": messages
			}))

	async def ai_response_ready(self, event):
		await self.send(text_data=json.dumps({
			"type": "ai_response_ready",
			"data": event["data"]
		}))


class SessionConsumer(AsyncJsonWebsocketConsumer):
	async def connect(self):
		self.session_id = self.scope["url_route"]["kwargs"]["session_id"]
		self.group_name = f"session_{self.session_id}"

		# TODO: check user owns session

		await self.channel_layer.group_add(self.group_name, self.channel_name)
		await self.accept()

	async def disconnect(self, code):
		await self.channel_layer.group_discard(self.group_name, self.channel_name)

	async def receive_json(self, content):
		"""
		Handles messages sent from the client over WebSocket.
		Expects content: {"type": "user.message", "data": {"text": "..."}}
		"""
		if content.get("type") != "user.message":
			return

		user_text = content["data"]["text"]

		# Persist the user message in the DB and enqueue AI request
		user_msg, ai_req = await sync_to_async(self._persist_user_message_and_enqueue)(user_text)

		# Optionally, send the user message back to all clients in the session
		await self.channel_layer.group_send(
			self.group_name,
			{
				"type": "chat.message",
				"payload": {
					"id": user_msg.id,
					"role": "user",
					"content": user_msg.content,
					"created_at": str(user_msg.created_at),
				},
			}
		)

	def _persist_user_message_and_enqueue(self, text):
		"""
		Runs in thread via sync_to_async. Uses a DB transaction to create the user message
		and the AiRequest row atomically.
		"""
		session = AiChatSession.objects.get(pk=self.session_id)

		with transaction.atomic():
			user_msg = ChatMessage.objects.create(
				session=session, role="user", content=text
			)

			ai_req = AiRequest.objects.create(
				session=session, user_message=user_msg, status="queued"
			)

			# enqueue Celery task
			handle_ai_request_job.delay(str(ai_req.id))

		return user_msg, ai_req

	async def chat_message(self, event):
		"""Broadcasts a message to the client."""
		await self.send_json({
			"type": "chat.message",
			"payload": event["payload"]
		})