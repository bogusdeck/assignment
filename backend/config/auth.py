from django.contrib.auth.models import User
import jwt
from django.conf import settings
from rest_framework import authentication, exceptions


class JWTAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return None

        token = auth_header.split(' ')[1]
        try:
            payload = jwt.decode(token, settings.JWT_SECRET, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            raise exceptions.AuthenticationFailed('Token expired')
        except jwt.InvalidTokenError:
            raise exceptions.AuthenticationFailed('Invalid token')

        email = payload.get('email')
        if not email:
            raise exceptions.AuthenticationFailed('No email in token')

        user, _ = User.objects.get_or_create(email=email, defaults={'username': email})
        return (user, token)
