from django.http import JsonResponse, HttpResponse
from .models import User  # Kullanıcı modelinizi içe aktarın

def hello_world(request):
    return HttpResponse("Hello, World!")

def register(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        email = request.POST.get('email')
        password = request.POST.get('password')

        if username and email and password:
            user = User(username=username, email=email)
            user.set_password(password)
            user.save()

            return JsonResponse({"message": "Registration successful!"}, status=201)
        else:
            return JsonResponse({"error": "All fields are required."}, status=400)

    return JsonResponse({"error": "Invalid request method."}, status=405)