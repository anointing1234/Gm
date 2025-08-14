from django.contrib import admin
from unfold.admin import ModelAdmin, StackedInline
from django.utils.html import format_html
from django.utils import timezone
from django import forms
from django.contrib.auth import authenticate, login
from django.http import JsonResponse
from django.shortcuts import render
from django.contrib.admin.views.decorators import staff_member_required
from django.urls import path
from .models import Account, Balance, Investment, InvestmentHistory
import logging
from decimal import Decimal

logger = logging.getLogger(__name__)

# Custom form for admin user creation
class AccountCreationForm(forms.ModelForm):
    password = forms.CharField(
        widget=forms.PasswordInput,
        required=True,
        label="Password",
        help_text="Enter a secure password for the user."
    )

    class Meta:
        model = Account
        fields = ('email', 'fullname', 'phone', 'address', 'gender', 'profile_picture', 'password', 'currency')

    def clean_email(self):
        email = self.cleaned_data['email']
        if Account.objects.filter(email=email).exclude(pk=self.instance.pk).exists():
            raise forms.ValidationError("This email is already registered.")
        return email

    def save(self, commit=True):
        user = super().save(commit=False)
        # Auto-generate username if not set
        if not user.username:
            email_prefix = user.email.split('@')[0]
            base_username = email_prefix[:100]  # Ensure within max_length
            user.username = base_username
            counter = 1
            # Ensure username is unique
            while Account.objects.filter(username=user.username).exclude(pk=user.pk).exists():
                user.username = f"{base_username}_{counter}"
                counter += 1
        user.set_password(self.cleaned_data['password'])
        if commit:
            user.save()
            Balance.objects.get_or_create(user=user)
        return user

class InvestmentForm(forms.ModelForm):
    transaction_description = forms.CharField(
        max_length=500,
        required=False,
        label="Transaction Description",
        help_text="Description for the investment history entry (optional).",
        widget=forms.Textarea(attrs={'rows': 2})
    )

    class Meta:
        model = Investment
        fields = ('user', 'start_date', 'end_date', 'amount', 'status', 'daily_profit')

    def clean_user(self):
        user = self.cleaned_data.get('user')
        if not user:
            raise forms.ValidationError("Please select a user for the investment.")
        return user

# -------------------------
# Inlines (use unfold's StackedInline)
# -------------------------
class BalanceInline(StackedInline):
    model = Balance
    can_delete = False
    extra = 0
    fields = ('Active_Initial_Investment', 'Total_Return', 'Total_Available_Withdrawal', 'investment_status')
    readonly_fields = ('user',)

class InvestmentHistoryInline(StackedInline):
    model = InvestmentHistory
    can_delete = True
    extra = 0
    fields = ('date', 'description', 'amount', 'status')
    readonly_fields = ('date',)

    def get_formset(self, request, obj=None, **kwargs):
        formset = super().get_formset(request, obj, **kwargs)
        if obj:
            if 'user' in formset.form.base_fields:
                formset.form.base_fields['user'].initial = getattr(obj, 'user', None)
            if 'investment' in formset.form.base_fields:
                formset.form.base_fields['investment'].initial = obj
        return formset

    def save_formset(self, request, form, formset, change):
        instances = formset.save(commit=False)
        for instance in instances:
            if getattr(instance, 'investment', None) is None and hasattr(form.instance, 'id'):
                instance.investment = form.instance
            if getattr(instance, 'user', None) is None and getattr(instance, 'investment', None):
                instance.user = instance.investment.user
            if instance.amount is not None and instance.description:
                instance.save()
        formset.save_m2m()

class InvestmentInline(StackedInline):
    model = Investment
    can_delete = True
    extra = 1
    fields = ('user', 'start_date', 'end_date', 'amount', 'status', 'daily_profit')

    def get_formset(self, request, obj=None, **kwargs):
        formset = super().get_formset(request, obj, **kwargs)
        if obj:
            if 'user' in formset.form.base_fields:
                formset.form.base_fields['user'].initial = obj
        return formset

# -------------------------
# Account admin (inherits unfold.admin.ModelAdmin)
# -------------------------
@admin.register(Account)
class AccountAdmin(ModelAdmin):
    list_display = (
        'user_id', 'profile_picture_thumbnail', 'email', 'username',
        'fullname', 'phone', 'gender', 'currency',
        'is_active', 'is_staff', 'is_admin', 'date_joined'
    )
    list_filter = ('is_active', 'is_staff', 'is_admin', 'currency', 'gender')
    search_fields = ('user_id', 'email', 'username', 'fullname', 'phone', 'gender')
    readonly_fields = ('user_id', 'date_joined', 'last_login', 'username')

    fieldsets = (
        (None, {
            'fields': (
                'user_id', 'email', 'fullname', 'phone', 'password',
                'gender', 'address', 'currency', 'profile_picture'
            )
        }),
        ('Timestamps', {
            'fields': ('date_joined', 'last_login')
        }),
    )
    inlines = [BalanceInline, InvestmentInline]
    list_per_page = 25
    form = AccountCreationForm

    def profile_picture_thumbnail(self, obj):
        if obj.profile_picture:
            return format_html(
                '<img src="{}" width="50" height="50" style="object-fit: cover; border-radius: 5px;" />',
                obj.get_profile_picture_url()
            )
        return "No Image"
    profile_picture_thumbnail.short_description = 'Profile Picture'

    def get_readonly_fields(self, request, obj=None):
        if obj:
            return self.readonly_fields + (
                'email', 'fullname', 'phone', 'gender',
                'address', 'currency', 'profile_picture'
            )
        return self.readonly_fields

    def save_model(self, request, obj, form, change):
        if not change and not obj.username:
            email_prefix = obj.email.split('@')[0]
            base_username = email_prefix[:100]  # Ensure within max_length
            obj.username = base_username
            counter = 1
            while Account.objects.filter(username=obj.username).exclude(pk=obj.pk).exists():
                obj.username = f"{base_username}_{counter}"
                counter += 1
        super().save_model(request, obj, form, change)

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('create-user/', staff_member_required(self.admin_create_user_view), name='admin_create_user'),
        ]
        return custom_urls + urls

    def admin_create_user_view(self, request):
        if request.method == 'POST':
            form = AccountCreationForm(request.POST, request.FILES)
            if form.is_valid():
                try:
                    user = form.save()
                    logger.info(f"Admin created user: {user.email}")
                    return JsonResponse({'status': 'success', 'message': 'User created successfully!'})
                except Exception as e:
                    logger.exception("Error creating user via admin_create_user_view")
                    return JsonResponse({'status': 'error', 'message': str(e)})
            else:
                return JsonResponse({'status': 'error', 'message': 'Invalid form data.', 'errors': form.errors})
        form = AccountCreationForm()
        return render(request, 'auth/admin_create_user.html', {'form': form})

# -------------------------
# Other admin registrations
# -------------------------
@admin.register(Balance)
class BalanceAdmin(ModelAdmin):
    list_display = ('user', 'Active_Initial_Investment', 'Total_Return', 'Total_Available_Withdrawal', 'investment_status')
    list_filter = ('investment_status',)
    search_fields = ('user__email', 'user__username')
    readonly_fields = ('user',)
    fields = ('user', 'Active_Initial_Investment', 'Total_Return', 'Total_Available_Withdrawal', 'investment_status')
    list_per_page = 25

@admin.register(Investment)
class InvestmentAdmin(ModelAdmin):
    list_display = ('user', 'start_date', 'end_date', 'amount', 'status', 'daily_profit')
    list_filter = ('status', 'start_date')
    search_fields = ('user__email', 'user__username')
    fields = ('user', 'start_date', 'end_date', 'amount', 'status', 'daily_profit')
    inlines = [InvestmentHistoryInline]
    list_per_page = 25
    form = InvestmentForm

    def save_model(self, request, obj, form, change):
        if not obj.user:
            logger.error("Attempted to save Investment without a user")
            raise ValueError("Investment must have a user associated")
        
        # Check if investment is valid and active
        is_active = obj.status == 'ACTIVE'
        is_valid_investment = (
            obj.user and
            obj.start_date and
            obj.end_date and
            obj.amount is not None and
            obj.daily_profit is not None
        )

        super().save_model(request, obj, form, change)

        # Update InvestmentHistory
        is_new = not change
        if is_new:
            user = obj.user
            description = form.cleaned_data.get('transaction_description') or f"New investment of {obj.amount} created on {timezone.now().date()}"

            if not InvestmentHistory.objects.filter(investment=obj).exists():
                InvestmentHistory.objects.create(
                    user=user,
                    investment=obj,
                    date=timezone.now(),
                    description=description,
                    amount=obj.amount,
                    status=obj.status
                )
                logger.info(f"Created InvestmentHistory for user {user.email} with investment: {obj.amount}")
            else:
                logger.warning(f"InvestmentHistory entry already exists for investment {obj.id}")

        # Update Balance
        try:
            balance, created = Balance.objects.get_or_create(user=obj.user)
            if is_new:
                current = Decimal(balance.Active_Initial_Investment or 0)
                balance.Active_Initial_Investment = current + Decimal(obj.amount)
            # Set investment_status to RUNNING if investment is ACTIVE and valid
            if is_active and is_valid_investment:
                balance.investment_status = 'RUNNING'
            balance.save()
            logger.info(f"Updated balance for user {obj.user.email} with investment: {obj.amount}, status: {balance.investment_status}")
        except Exception as e:
            logger.exception("Error updating balance after saving investment")
            raise ValueError(f"Could not update balance for user: {obj.user}")

@admin.register(InvestmentHistory)
class InvestmentHistoryAdmin(ModelAdmin):
    list_display = ('user', 'date', 'description', 'amount', 'status')
    list_filter = ('status', 'date')
    search_fields = ('user__email', 'user__username', 'description')
    readonly_fields = ('date', 'user')
    fields = ('user', 'investment', 'date', 'description', 'amount', 'status')
    date_hierarchy = 'date'
    list_per_page = 25