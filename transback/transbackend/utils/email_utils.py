from django.core.mail import BadHeaderError, EmailMultiAlternatives
from django.template.loader import render_to_string

def send_verification_email(user, subject="Activate Your Account"):
    try:
        html_content = render_to_string("mail.html", {
            "verification_code": user.verification_code
        })
        
        email = EmailMultiAlternatives(
            subject, 
            "", # text_content
            "noreply@example.com", 
            [user.email]
        )
        email.attach_alternative(html_content, "text/html")
        email.send()
        return True, None
    except (BadHeaderError, Exception) as e:
        return False, str(e) 