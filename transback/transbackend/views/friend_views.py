from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.template.response import TemplateResponse
from django.http import JsonResponse
from transbackend.models import User, Friendship
from transbackend.serializers import FriendshipSerializer
from django.db.models import Q
from transbackend.utils.response_utils import json_response

class FriendListView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        user = request.user
        friends = Friendship.objects.filter(
            (Q(sender=user) | Q(receiver=user)) & Q(status=Friendship.ACCEPTED)
        )
        pending_requests = Friendship.objects.filter(receiver=user, status=Friendship.PENDING)
        
        friendsList = [friend.sender if friend.receiver == user else friend.receiver for friend in friends]
        pendingRequestsList = [friend.sender for friend in pending_requests]
        return TemplateResponse(
            request, 
            'friends.html',
            {
                "friends": friendsList,
                "pending_requests": pendingRequestsList
            }
        )

class FriendRequestView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def post(self, request):
        receiver_username = request.data.get('username')
        try:
            receiver = User.objects.get(username=receiver_username)
            existing_friendship = Friendship.objects.filter(
                (Q(sender=request.user, receiver=receiver) | 
                 Q(sender=receiver, receiver=request.user))
            ).first()

            if existing_friendship:
                if existing_friendship.status == Friendship.ACCEPTED:
                    return JsonResponse({"error": "You are already friends with this user"}, status=400)
                elif existing_friendship.status == Friendship.PENDING:
                    return JsonResponse({"error": "A friend request is already pending"}, status=400)
                elif existing_friendship.status == Friendship.REJECTED:
                    existing_friendship.delete()
                
            Friendship.objects.create(
                sender=request.user,
                receiver=receiver
            )
            
            return JsonResponse({"message": "Friend request sent successfully"}, status=201)
        except User.DoesNotExist:
            return JsonResponse({"error": "User not found"}, status=404)

class FriendRequestResponseView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def post(self, request):
        username = request.data.get('username')
        action = request.data.get('action')
        
        try:
            target_user = User.objects.get(username=username)
            self_user = request.user
            friendship = Friendship.objects.filter(
                (Q(sender=target_user, receiver=self_user) |
                 Q(sender=self_user, receiver=target_user))
            ).first()

            if not friendship:
                return json_response(error="Friend request not found", status=404)

            if action == 'accept':
                friendship.status = Friendship.ACCEPTED
                friendship.save()
                return json_response(message="Friend request accepted")
            elif action == 'reject':
                friendship.delete()
                return json_response(message="Friend request rejected")
            elif action == 'remove':
                friendship.delete()
                return json_response(message="Friend removed")
            else:
                return json_response(error="Invalid action", status=400)

        except User.DoesNotExist:
            return json_response(error="User not found", status=404)
