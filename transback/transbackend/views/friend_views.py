from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.template.response import TemplateResponse
from django.http import JsonResponse
from transbackend.models import User, Friendship
from transbackend.serializers import FriendshipSerializer
from django.db.models import Q

class FriendListView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        user = request.user
        friends = Friendship.objects.filter(
            (Q(sender=user) | Q(receiver=user)) & Q(status=Friendship.ACCEPTED)
        )
        pending_requests = Friendship.objects.filter(receiver=user, status=Friendship.PENDING)
        
        return TemplateResponse(
            request, 
            'friends.html',
            {
                "friends": friends,
                "pending_requests": pending_requests
            }
        )

class FriendRequestView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def post(self, request):
        receiver_username = request.data.get('username')
        try:
            receiver = User.objects.get(username=receiver_username)
            
            # Check if friendship already exists
            if Friendship.objects.filter(
                (Q(sender=request.user, receiver=receiver) | 
                 Q(sender=receiver, receiver=request.user))
            ).exists():
                return JsonResponse({"error": "Friendship request already exists"}, status=400)
            
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
        request_id = request.data.get('request_id')
        action = request.data.get('action')  # 'accept' or 'reject'
        
        try:
            friendship = Friendship.objects.get(
                id=request_id,
                receiver=request.user,
                status=Friendship.PENDING
            )
            
            if action == 'accept':
                friendship.status = Friendship.ACCEPTED
            elif action == 'reject':
                friendship.status = Friendship.REJECTED
            else:
                return JsonResponse({"error": "Invalid action"}, status=400)
                
            friendship.save()
            return JsonResponse({"message": f"Friend request {action}ed"}, status=200)
            
        except Friendship.DoesNotExist:
            return JsonResponse({"error": "Friend request not found"}, status=404) 