from django.shortcuts import render,get_object_or_404, redirect
from django.contrib.auth.models import User
from decimal import Decimal
from django.core.mail import EmailMessage
from django.utils.html import strip_tags
from django.contrib.auth import login,authenticate,get_user_model 
from django.contrib import messages
from django.urls import reverse
from django.utils import timezone
from django.core.mail import EmailMultiAlternatives
from django.contrib.auth import logout as auth_logout,login as auth_login,authenticate
from django.contrib.auth.decorators import login_required
from django.db.models.signals import post_save
from django.http import JsonResponse
from django.contrib.admin.views.decorators import staff_member_required
from django.contrib.auth.hashers import check_password
from django.views.decorators.csrf import csrf_protect
import json
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password,check_password
from django.utils.decorators import method_decorator
from django.core.mail import send_mail
import os
from email.mime.image import MIMEImage
from django.conf import settings
import shutil
from django.utils.timezone import now
from requests.exceptions import ConnectionError
import requests 
import uuid
from uuid import uuid4
import traceback
import random
from django.utils.crypto import get_random_string
from django.utils.timezone import now, timedelta
from django.contrib.admin.views.decorators import staff_member_required
from django.contrib.admin import AdminSite
from django.utils.translation import gettext_lazy as _
from django.utils.safestring import mark_safe
from django.template.loader import render_to_string
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import update_session_auth_hash
from django.contrib.auth.hashers import check_password
from .models import Account, Balance, Investment, InvestmentHistory
import logging
from datetime import date


User = get_user_model()
logger = logging.getLogger(__name__)

@login_required
def home_view(request):
    user = request.user

    # Ensure balance exists
    balance, created = Balance.objects.get_or_create(user=user)
    if created:
        logger.info(f"Created balance for user {user.email}: {balance.Active_Initial_Investment}")

    # Get the latest investment
    investment = user.investments.order_by('-start_date').first()

    if not investment:
        logger.info(f"No investments found for user {user.email}")

    # Get all investment history
    investment_history = InvestmentHistory.objects.filter(user=user).order_by('-date')

    # Get all investments
    investments = user.investments.all().order_by('-start_date')

    context = {
        'balance': balance,
        'investment': investment,
        'investments': investments,
        'investment_history': investment_history,
    }

    return render(request, 'home/index.html', context)




def login_view(request):
    return render(request,'auth/client_login.html')


def signup_view(request):
    return render(request,'auth/client_signup.html')




def signup_view(request):
    if request.method == 'POST':
        email = request.POST.get('email', '')
        fullname = request.POST.get('fullname', '')
        phone = request.POST.get('phone', '')
        gender = request.POST.get('gender', 'P')
        password = request.POST.get('password', '')
        address = request.POST.get('address','')

        # Check if email already exists
        if Account.objects.filter(email=email).exists():
            return JsonResponse({
                'status': 'error',
                'message': 'Email already registered.'
            })

        # Create new user
        try:
            user = Account.objects.create_user(
                email=email,
                fullname=fullname,
                phone=phone,
                gender=gender,
                password=password,
                address=address
            )
            # login(request, user)  # Log in the user automatically

            # Create balance for the user
            Balance.objects.create(user=user)

            # Return success response without immediate redirect
            return JsonResponse({
                'status': 'success',
                'message': 'Registration successful! Welcome to Goldman.com.'
            })
        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'message': f'Error during registration: {str(e)}'
            })

    return render(request, 'auth/client_signup.html')



def login_view(request):
    if request.method == 'POST':
        identifier = request.POST.get('identifier', '').strip()  # Can be email or user_id
        password = request.POST.get('password', '')

        # Try authenticating with identifier as email or user_id
        user = None
        try:
            # First, try as email
            user = authenticate(request, username=identifier, password=password)
            
            # If email fails, try as user_id
            if user is None:
                try:
                    numeric_user_id = int(identifier)
                    account = Account.objects.get(user_id=numeric_user_id)
                    user = authenticate(request, username=account.email, password=password)
                except (ValueError, Account.DoesNotExist):
                    pass
            # Invalid UUID or user_id not found

            if user is not None:
                login(request, user)
                return JsonResponse({
                    'status': 'success',
                    'message': 'Login successful! Redirecting...'
                })
            else:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Invalid email/user ID or password.'
                })
        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'message': f'Error during login: {str(e)}'
            })

    return render(request, 'auth/client_login.html')



def upload_profile_picture(request):
    if request.method == 'POST' and request.FILES.get('profile_picture'):
        profile_pic = request.FILES['profile_picture']
        user = request.user
        user.profile_picture = profile_pic
        user.save()
        return JsonResponse({'success': True})
    return JsonResponse({'success': False}, status=400)





def get_days_count(request):
    if request.user.is_authenticated:
        investment = Investment.objects.filter(user=request.user, status='active').first()
        if investment:
            today = date.today()
            days_count = (today - investment.start_date).days + 1  # Add 1 to include the start day
            return JsonResponse({'days_count': days_count})
        else:
            return JsonResponse({'days_count': 0})
    return JsonResponse({'error': 'Unauthorized'}, status=401)



def logout_view(request):
    """Logs out the user and redirects to the login page."""
    if request.method == "POST":
        auth_logout(request)
        request.session.flush()
        return redirect("home") 
    return redirect("home") 