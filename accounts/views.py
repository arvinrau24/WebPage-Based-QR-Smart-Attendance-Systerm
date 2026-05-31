from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.db import IntegrityError
from .serializers import RegisterSerializer, UserSerializer


def _first_error_message(errors):
    if not isinstance(errors, dict):
        return str(errors)
    for messages in errors.values():
        if isinstance(messages, list) and messages:
            return str(messages[0])
        if isinstance(messages, dict):
            nested = _first_error_message(messages)
            if nested:
                return nested
        if messages:
            return str(messages)
    return 'Request failed.'


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    role = request.data.get('role', 'lecturer')
    if role != 'lecturer':
        return Response(
            {'error': 'Only lecturer accounts can be created from this page.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    password = request.data.get('password', '')
    confirm = request.data.get('password_confirm', '')
    if password != confirm:
        return Response(
            {'error': 'Passwords do not match.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    payload = {k: v for k, v in request.data.items() if k != 'password_confirm'}
    payload['role'] = 'lecturer'
    serializer = RegisterSerializer(data=payload)
    if not serializer.is_valid():
        return Response(
            {'error': _first_error_message(serializer.errors)},
            status=status.HTTP_400_BAD_REQUEST,
        )
    try:
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
    except IntegrityError:
        return Response(
            {'error': 'Username or email is already in use.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    except Exception:
        return Response(
            {'error': 'Could not create account. Please try again.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
    return Response(
        {'token': token.key, 'user': UserSerializer(user).data},
        status=status.HTTP_201_CREATED,
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(request, username=username, password=password)
    if not user:
        return Response({'error': 'Invalid username or password'}, status=status.HTTP_401_UNAUTHORIZED)
    if user.role != 'lecturer':
        return Response(
            {'error': 'This portal is for lecturers only. Students mark attendance via the scan page.'},
            status=status.HTTP_403_FORBIDDEN,
        )
    token, _ = Token.objects.get_or_create(user=user)
    return Response({'token': token.key, 'user': UserSerializer(user).data})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    request.user.auth_token.delete()
    return Response({'message': 'Logged out successfully'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(UserSerializer(request.user).data)
