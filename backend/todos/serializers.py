from rest_framework import serializers
from .models import Todo

class TodoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Todo
        fields = ['id', 'title', 'description', 'due_date', 'due_time', 'priority', 'completed', 'pinned', 'created_at']
        read_only_fields = ['id', 'created_at']
