from channels.generic.websocket import AsyncWebsocketConsumer
from core.models import AiChatSession
from core.serializers import AiChatSessionSerializer
from asgiref.sync import sync_to_async
import json

def serialize_session(session):
	serializer = AiChatSessionSerializer(session)
	return serializer.data


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

		print('backend/core/consumers.py receive() text_data:', text_data)

		print('data[\'message\']:', data['message'])

		session_id = data.get('session_id')
		message = data.get('message')

		if not session_id or not message:
			await self.send(text_data=json.dumps({
				'error': 'session_id and message are required'
			}))
			return

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

		# Call the same logic as your POST view
		await sync_to_async(session.send)(message)

		# Serialize updated session (just like your POST view)
		# serializer = await sync_to_async(AiChatSessionSerializer)(session)
		# print('serializer:', serializer)
		# print('End')
		# data = await sync_to_async(serializer.data.copy)()

		data = await sync_to_async(serialize_session)(session)

		await self.send(text_data=json.dumps(data))

		sessions = await sync_to_async(list)(AiChatSession.objects.all())

		for session in sessions:
			print(f"Session: {session.title or session.session_id}")
			messages = await sync_to_async(session.get_all_messages)()
			for m in messages:
				print(f"  - {m['role']}: {m['content']}")