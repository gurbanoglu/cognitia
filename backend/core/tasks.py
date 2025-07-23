from celery import shared_task
from core import models
from django.contrib.auth import get_user_model
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

@shared_task
def handle_ai_request_job(ai_request_id):
  models.AiRequest.objects.get(id=ai_request_id).handle()

@shared_task
def hello_task(name):
  print(f"Hello {name}. You have {len(name)} characters in your name.")

@shared_task
def async_edit_user_message(session_id, user_id, message_index, updated_message):
  User = get_user_model()

  user = User.objects.get(pk=user_id)

  session = models.AiChatSession.objects.get(session_id=session_id, user=user)

  new_messages = session.edit_user_message(message_index, updated_message)

  # Notify via WebSocket
  channel_layer = get_channel_layer()
  async_to_sync(channel_layer.group_send)(
    # Same as group name in consumer.
    session_id,
    {
      "type": "send_update",
      # You can serialize as needed.
      "messages": new_messages
    }
  )
  return new_messages