
from rest_framework.views import APIView
from django.template.response import TemplateResponse
from rest_framework.permissions import AllowAny

class NotFoundView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return  TemplateResponse(request, '404.html')
