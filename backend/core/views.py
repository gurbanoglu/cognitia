import json
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from core.models import AiChatSession
from core.serializers import AiChatSessionSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.utils.text import slugify
from .models import AiChatSession, AiRequest
from rest_framework.exceptions import NotFound
import uuid
from rest_framework.views import APIView

@api_view(['GET', 'POST'])
def create_chat_session(request):
  """Create a new chat session."""

  if request.user:
    user = request.user

    session = AiChatSession.objects.create(user=user)
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

  # The first message that an end user sends
  # in a chat session.
  message = request.data.get('message')

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
  sessions = AiChatSession.objects.filter(user=request.user)
  serializer = AiChatSessionSerializer(sessions, many=True)

  # AiChatSession.objects.all().delete()

  print('sessions:', sessions)

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
  
@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def update_user_message(request, session_id: str, message_index: int):
  updated_message = request.data.get("updated_message")

  if not updated_message:
    return Response({"error": "No new content provided."}, status=400)

  try:
    session = AiChatSession.objects.get(session_id=session_id, user=request.user)
    new_request = session.edit_user_message(message_index, updated_message)

    print('new_request.messages:', new_request.messages)

    return Response({
      "status": "ok",
      "messages": new_request.messages,
      "response": new_request.response
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