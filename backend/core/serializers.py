from rest_framework import serializers
from core.models import AiChatSession, CustomUser


class AiChatSessionMessageSerializer(serializers.Serializer):
  role = serializers.CharField()
  content = serializers.CharField()


class UserSerializer(serializers.ModelSerializer):
  class Meta:
    model = CustomUser
    fields = ['id', 'email_address']


class AiChatSessionSerializer(serializers.ModelSerializer):
  # messages = AiChatSessionMessageSerializer(many=True)

  messages = serializers.SerializerMethodField()

  user = UserSerializer(read_only=True)

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