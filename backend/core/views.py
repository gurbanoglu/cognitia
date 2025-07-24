from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from core.models import AiChatSession
from core.serializers import AiChatSessionSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.utils.text import slugify
from .models import AiChatSession, CustomUser
from rest_framework.exceptions import NotFound
from celery import shared_task
import uuid
from rest_framework.views import APIView
from django.core.cache import cache
import time

@api_view(['GET', 'POST'])
def create_chat_session(request):
  """Create a new chat session."""

  if request.user:
    user = request.user

    session = AiChatSession.objects.create(user=user)

    print('views.py: create_chat_session invoked')
  else:
    # If an end user isn't signed in.
    session = AiChatSession.objects.create()

  serializer = AiChatSessionSerializer(session)

  return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def chat_session_detail(request, slug):
  session = get_object_or_404(
    AiChatSession, slug=slug, user=request.user
  )

  messages = session.get_all_messages()

  return Response({
    'id': session.session_id,
    'slug': session.slug,
    'title': session.title,
    'messages': messages
  })

def generate_unique_slug(base_slug: str):
  slug = base_slug
  num = 1

  while AiChatSession.objects.filter(slug=slug).exists():
    slug = f"{base_slug}-{num}"
    num += 1
  return slug

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_chat_session(request):
  # Establish a session ID, title, slug, and save
  # the messages.

  # The first input that an end user sends
  # in a chat session.
  message = request.data.get('input')

  print('backend/core/views.py save_chat_session message:', message)

  # The title of a chat session can be fifty
  # characters at most.
  title = message[:50]

  session_id = uuid.uuid4()

  base_slug = slugify(title) or "chat"

  slug = generate_unique_slug(base_slug)

  if request.user:
    user = request.user

    session = AiChatSession.objects.create(
      user=user,
      session_id=session_id
    )

    AiChatSessionSerializer(session)

    print('AiChatSession was serialised.')

  return Response({
    'session_id': session_id,
    'slug': slug,
    'title': title,
    'messages': message
  })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_sessions(request):
  # AiChatSession.objects.all().delete()

  # print('all sessions after delete:', list(AiChatSession.objects.all()))

  sessions = AiChatSession.objects.filter(user=request.user)
  serializer = AiChatSessionSerializer(sessions, many=True)

  # print('user:', request.user)
  # print('user sessions after delete:', list(sessions))

  return Response({
    "sessions": serializer.data
  })

@api_view(['GET', 'POST', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def chat_session(request, session_id):
  try:
    session = AiChatSession.objects.get(
      session_id=session_id, user=request.user
    )
  except AiChatSession.DoesNotExist:
    raise NotFound("Chat session not found.")

  if request.method == 'GET':
    serializer = AiChatSessionSerializer(session)
    return Response(serializer.data)
  elif request.method == 'POST':
    message = request.data.get('message')

    if not message:
      return Response(
        {'error': 'Message is required'},
        status=status.HTTP_400_BAD_REQUEST
      )

    session.send(message)

    serializer = AiChatSessionSerializer(session)
    return Response(serializer.data)
  elif request.method == 'PUT':
    title = request.data.get('title')

    if not title:
      return Response(
        {'error': 'Title is required'},
        status=status.HTTP_400_BAD_REQUEST
      )

    session.title = title
    session.slug = generate_unique_slug(slugify(title))
    session.save()
    serializer = AiChatSessionSerializer(session)
    return Response(serializer.data)
  elif request.method == 'DELETE':
    session.delete()

    return Response(
      {"message": "Session deleted successfully."},
      status=status.HTTP_200_OK
    )

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_edit_result(request, task_id: str):
  result = cache.get(f"edit_result_{task_id}")
  if result:
    return Response({"status": "done", "messages": result})
  else:
    return Response({"status": "pending"})

@shared_task
def async_edit_user_message(session_id, user_id, message_index, updated_message):
  user = CustomUser.objects.get(pk=user_id)
  session = AiChatSession.objects.get(session_id=session_id, user=user)
  result = session.edit_user_message(message_index, updated_message)

  # Store result in cache or DB for polling (example using Django cache)
  cache.set(f"edit_result_{async_edit_user_message.request.id}", result, timeout=3600)
  return result

@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def update_user_message(request, session_id: str, message_index: int):
  updated_message = request.data.get("updated_message")

  if not updated_message:
    return Response({"error": "No new content provided."}, status=400)

  try:
    start = time.time()
    # new_request = session.edit_user_message(message_index, updated_message)
    print('update_user_message invoked')

    # Queue the Celery task in the API. Include a unique
    # task/session ID if you want to track it.
    task = async_edit_user_message.delay(
      session_id,
      request.user.id,
      message_index,
      updated_message
    )

    end = time.time()

    print(f"edit_user_message took {end - start:.2f} seconds")

    # Return a response with the task ID
    return Response({
      "status": "pending",
      "task_id": task.id,
      "detail": "Your update is being processed."
    })
  except Exception as e:
    return Response({"error": str(e)}, status=400)

# class EditMessageAndRegenerate(APIView):
#   def put(self, request, session_id):
#     try:
#       index = request.data.get("index")
#       updated_question = request.data.get("updated_question")

#       if index is None or updated_question is None:
#         return Response(
#           {"error": "Missing index or updated_question."},
#           status=status.HTTP_400_BAD_REQUEST
#         )

#       session = get_object_or_404(AiChatSession, session_id=session_id)

#       last_request = session.get_last_request()

#       if not last_request:
#         return Response(
#           {"error": "No messages in this session."},
#           status=status.HTTP_400_BAD_REQUEST
#         )

#       messages = session.get_all_messages()

#       if index < 0 or index >= len(messages) or messages[index]["role"] != "user":
#         return Response(
#           {"error": "Invalid message index."},
#           status=status.HTTP_400_BAD_REQUEST
#         )

#       messages[index]["content"] = updated_question

#       print('190 messages:', messages)

#       # Send the updated question to OpenAI.
#       session.send(updated_question)

#       serializer = AiChatSessionSerializer(session)

#       # if index + 1 < len(messages) and messages[index + 1]["role"] == "assistant":
#       #   print('index + 1:', index + 1)
#       #   # messages[index + 1]["content"] = 

#       # AiRequest.objects.create(
#       #   session=session,
#       #   messages=messages
#       # )

#       print('206 messages:', messages)

#       return Response({
#         "status": "ok",
#         "message": "Message edited. New AI response is being generated.",
#         "messages": messages
#       })
#     except Exception as e:
#       return Response(
#         {"error": str(e)},
#         status=status.HTTP_500_INTERNAL_SERVER_ERROR
#       )