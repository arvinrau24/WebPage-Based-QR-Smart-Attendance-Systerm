from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from .serializers import RegisterSerializer, UserSerializer


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
    if serializer.is_valid():
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {'token': token.key, 'user': UserSerializer(user).data},
            status=status.HTTP_201_CREATED,
        )
    errors = serializer.errors
    if isinstance(errors, dict):
        first_key = next(iter(errors))
        first_msg = errors[first_key]
        if isinstance(first_msg, list):
            first_msg = first_msg[0]
        return Response({'error': str(first_msg)}, status=status.HTTP_400_BAD_REQUEST)
    return Response(errors, status=status.HTTP_400_BAD_REQUEST)


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
