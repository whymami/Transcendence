from rest_framework.response import Response

def json_response(data=None, message=None, error=None, status=200):
    response_data = {}
    
    if data is not None:
        response_data.update(data)
    
    if message is not None:
        response_data['message'] = message
        
    if error is not None:
        # If error is a serializer.errors dict
        if isinstance(error, dict) and 'non_field_errors' in error:
            response_data['error'] = error['non_field_errors'][0]
        elif isinstance(error, dict) and error:
            # Get the first error message from any field
            response_data['error'] = next(iter(error.values()))[0]
        else:
            # If it's already a string or any other type
            response_data['error'] = str(error)
            
    return Response(response_data, status=status) 