from celery import shared_task
from django.utils import timezone
from core import models
from django.contrib.auth import get_user_model
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from core.models import AiRequest, ChatMessage
from core.llm import call_llm

# @shared_task
# def handle_ai_request_job(ai_request_id):
#   from core.serializers import AiChatSessionSerializer

#   request = models.AiRequest.objects.get(id=ai_request_id)
#   request.handle()

#   if request.session:
#     serializer = AiChatSessionSerializer(request.session)
#     channel_layer = get_channel_layer()
#     async_to_sync(channel_layer.group_send)(
#       request.session.session_id,
#       {
#         "type": "ai_response_ready",
#         "data": serializer.data
#       }
#     )

@shared_task(bind=True, max_retries=3, soft_time_limit=60)
def handle_ai_request_job(self, ai_request_id: str):
  req = AiRequest.objects.select_related("session", "user_message").get(pk=ai_request_id)
  if req.status not in ("queued", "failed"):
    return  # idempotence guard

  req.status = "running"
  req.started_at = timezone.now()
  req.save(update_fields=["status", "started_at"])

  try:
    # Build prompt from persisted messages (not last request)
    history = list(ChatMessage.objects
                    .filter(session=req.session)
                    .order_by("created_at")
                    .values("role", "content"))

    # --- call your LLM here ---
    assistant_text = call_llm(history)  # returns a string

    # Persist assistant message
    assistant_msg = ChatMessage.objects.create(
      session=req.session,
      role="assistant",
      content=assistant_text
    )

    # (optional) save raw response for audit
    req.raw_response = {"text": assistant_text}
    req.status = "succeeded"
    req.finished_at = timezone.now()
    req.save(update_fields=["raw_response","status","finished_at"])

    # Push to clients (WebSocket broadcast)
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
      f"session_{req.session.pk}",
      {
        "type": "chat.message",
        "payload": {
          "id": assistant_msg.id,
          "role": "assistant",
          "content": assistant_msg.content,
          "created_at": assistant_msg.created_at.isoformat()
        }
      },
    )
  except Exception as e:
    req.status = "failed"
    req.finished_at = timezone.now()
    req.save(update_fields=["status","finished_at"])
    raise

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