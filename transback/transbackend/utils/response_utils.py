from django.http import JsonResponse

def json_response(message=None, error=None, status=200):
    if error:
        return JsonResponse({"error": error}, status=status)
    return JsonResponse({"message": message}, status=status) 