from channels.generic.websocket import AsyncWebsocketConsumer
import json


class NotificationConsumer(AsyncWebsocketConsumer):
	async def connect(self):
		print('NotificationConsumer connected!')
		await self.accept()

	async def disconnect(self, close_code):
		print('NotificationConsumer disconnected!')
		await super().disconnect(close_code)

	async def receive(self, text_data):
		data = json.loads(text_data)

		print('text_data:', text_data)

		print('data[\'message\']:', data['message'])

		await self.send(text_data=json.dumps({
			'message': data['message'] + 'Az'
		}))