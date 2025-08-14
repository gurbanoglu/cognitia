from rest_framework import serializers
from core.models import AiChatSession, CustomUser, ChatMessage


class AiChatSessionMessageSerializer(serializers.Serializer):
  role = serializers.CharField()
  content = serializers.CharField()


class UserSerializer(serializers.ModelSerializer):
  class Meta:
    model = CustomUser
    fields = ['id', 'email_address']


# Serializes an AiChatSession object into JSON, specifically
# formatting the session's metadata and chat messages for
# use in API responses or WebSocket messages.
class AiChatSessionSerializer(serializers.ModelSerializer):
  # The AiChatSession model has a messages() method or
  # property that returns a list of dictionaries like:
  # {"role": "user", "content": "Hi!"}
  messages = AiChatSessionMessageSerializer(many=True)

  # messages = serializers.SerializerMethodField()

  user = UserSerializer(read_only=True)

  # .data will invoke this method.
  def to_representation(self, instance):
    representation = super().to_representation(instance)
    representation['messages'] = [
      msg for msg in representation['messages']
      if msg['role'] != 'system'
    ]
    return representation

  def get_messages(self, obj):
    return [msg for msg in obj.messages() if msg['role'] != 'system']

  class Meta:
    model = AiChatSession
    fields = ['session_id', 'user', 'title', 'slug', 'messages']
    read_only_fields = ['messages', 'user']


class ChatMessageSerializer(serializers.ModelSerializer):
  class Meta:
    model = ChatMessage
    fields = ("id", "role", "content", "created_at")


class SessionSerializer(serializers.ModelSerializer):
  messages = ChatMessageSerializer(many=True, source="chat_messages", read_only=True)

  class Meta:
    model = AiChatSession
    fields = ("session_id", "title", "slug", "messages")