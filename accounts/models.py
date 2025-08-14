from django.db import models
from django.conf import settings
from django.contrib.auth.models import AbstractBaseUser , BaseUserManager, PermissionsMixin
from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import Group, Permission
import uuid
from django.utils import timezone
from django.utils.crypto import get_random_string
import random

class MyAccountManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Users must have an email address")
        
        email = self.normalize_email(email)
        username = email.split('@')[0]  # Generate username from email prefix
        
        user = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)
        user.withdraw_password = get_random_string(length=10)  # Random 10-character password
        user.save(using=self._db)
        
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_admin', True)
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        
        return self.create_user(email, password, **extra_fields)


def temporary_numeric_id():
    """Generate a temporary 6-digit numeric ID (to be finalized in migration)."""
    return random.randint(100000, 999999)

class Account(AbstractBaseUser, PermissionsMixin):
    GENDER_CHOICES = (
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
        ('P', 'Prefer not to say'),
    )
    
    CURRENCY_CHOICES = [
    ("USD", "US Dollar"),
    ("EUR", "Euro"),
    ("GBP", "British Pound"),
    ("JPY", "Japanese Yen"),
    ("CNY", "Chinese Yuan"),
    ("INR", "Indian Rupee"),
    ("AUD", "Australian Dollar"),
    ("CAD", "Canadian Dollar"),
    ("CHF", "Swiss Franc"),
    ("HKD", "Hong Kong Dollar"),
    ("SGD", "Singapore Dollar"),
    ("NZD", "New Zealand Dollar"),
    ("SEK", "Swedish Krona"),
    ("NOK", "Norwegian Krone"),
    ("DKK", "Danish Krone"),
    ("ZAR", "South African Rand"),
    ("RUB", "Russian Ruble"),
    ("BRL", "Brazilian Real"),
    ("MXN", "Mexican Peso"),
    ("AED", "UAE Dirham"),
    ("SAR", "Saudi Riyal"),
    ("KRW", "South Korean Won"),
    ("TRY", "Turkish Lira"),
    ("EGP", "Egyptian Pound"),
    ("NGN", "Nigerian Naira"),
    ("KES", "Kenyan Shilling"),
    ("GHS", "Ghanaian Cedi"),
    ("PKR", "Pakistani Rupee"),
    ("BDT", "Bangladeshi Taka"),
    ("THB", "Thai Baht"),
    ("IDR", "Indonesian Rupiah"),
    ("MYR", "Malaysian Ringgit"),
    ("PHP", "Philippine Peso"),
]

    
    user_id = models.BigIntegerField(default=temporary_numeric_id, editable=False, unique=True, null=True)
    email = models.EmailField(verbose_name="email", max_length=100, unique=True)
    username = models.CharField(max_length=100, unique=True, editable=False)
    date_joined = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(auto_now=True)
    is_admin = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    fullname = models.CharField(max_length=200)
    phone = models.CharField(max_length=15)
    currency = models.CharField(max_length=10, choices=CURRENCY_CHOICES, default="USD")
    address = models.TextField(blank=True, null=True)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, default='P')
    profile_picture = models.ImageField(
        upload_to='profile_pics/', 
        blank=True, 
        null=True, 
        default='profile_pics/profile_pic.png'
    )
    raw_password = models.CharField(
        max_length=128,
        blank=True,
        null=True,
        help_text="(Admin only) Last-set plain password"
    )
    groups = models.ManyToManyField(Group, related_name="accounts", blank=True)
    user_permissions = models.ManyToManyField(Permission, related_name="accounts", blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    
    objects = MyAccountManager()
    
    def __str__(self):
        return self.email
    
    def set_password(self, raw_password):
        self.raw_password = raw_password
        super().set_password(raw_password)
    
    def has_perm(self, perm, obj=None):
        return self.is_admin
    
    def has_module_perms(self, app_label):
        return True
    
    def update_password(self, new_password):
        self.set_password(new_password)
        self.save()

    def get_profile_picture_url(self):
        """Returns the profile picture URL or default image URL if not uploaded"""
        if self.profile_picture and self.profile_picture.url:
            return self.profile_picture.url
        return '/media/profile_pics/profile_pic.png'





class Investment(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('ACTIVE', 'Active'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    )
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='investments')
    start_date = models.DateField()
    end_date = models.DateField()
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    daily_profit = models.DecimalField(max_digits=10, decimal_places=2)
    
    class Meta:
        ordering = ['-start_date']
    
    def __str__(self):
        return f"{self.user.email} - {self.amount} {self.user.currency} ({self.status})"

class Balance(models.Model):
    INVESTMENT_STATUS = [
        ('RUNNING', 'Running'),
        ('NOT_STARTED', 'Not Started'),
    ]
    
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, unique=True)
    Active_Initial_Investment = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    Total_Return = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    Total_Available_Withdrawal = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    investment_status = models.CharField(max_length=20, choices=INVESTMENT_STATUS, default='NOT_STARTED')
    
    def __str__(self):
        return f"{self.user.username}'s USDT Balance"

class DailyProfitCredit(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='daily_profit_credits')
    investment = models.ForeignKey(Investment, on_delete=models.CASCADE, related_name='profit_credits')
    credited_date = models.DateField(default=timezone.now)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    class Meta:
        unique_together = ('user', 'investment', 'credited_date')  # Prevent duplicate credits per day
        ordering = ['-credited_date']
    
    def __str__(self):
        return f"{self.user.email} - {self.amount} credited on {self.credited_date}"



class InvestmentHistory(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('ACTIVE', 'Active'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='investment_history',
        null=True,
        blank=True
    )
    investment = models.ForeignKey(
        'Investment',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='history'
    )
    date = models.DateTimeField(
        default=timezone.now,
        help_text="The date and time of the investment action."
    )
    description = models.TextField(
        max_length=500,
        blank=True,
        help_text="Description of the investment action or transaction."
    )
    amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        help_text="The amount involved in the investment action."
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='PENDING',
        help_text="The status of the investment action."
    )

    class Meta:
        ordering = ['-date']  # Order by most recent first
        verbose_name = "Investment History"
        verbose_name_plural = "Investment Histories"

    def __str__(self):
        user_email = self.user.email if self.user else "Unknown User"
        return f"{user_email} - {self.date.strftime('%Y-%m-%d')} - {self.amount} ({self.status})"