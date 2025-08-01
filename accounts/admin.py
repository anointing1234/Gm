from django.contrib import admin
from unfold.admin import ModelAdmin, StackedInline
from django.utils.html import format_html
from django.utils import timezone
from django import forms
from .models import Account, Balance, Investment, InvestmentHistory
import logging


logger = logging.getLogger(__name__)

# Inline for Balance (one-to-one with Account)
class BalanceInline(StackedInline):
    model = Balance
    can_delete = False
    extra = 0
    fields = ('Active_Initial_Investment', 'Total_Return', 'Total_Available_Withdrawal', 'investment_status')
    readonly_fields = ('user',)

# Inline for Investment (multiple per Account)
class InvestmentInline(StackedInline):
    model = Investment
    can_delete = True
    extra = 1
    fields = ('user', 'start_date', 'end_date', 'amount', 'status', 'daily_profit')
    readonly_fields = ()

    def get_formset(self, request, obj=None, **kwargs):
        formset = super().get_formset(request, obj, **kwargs)
        if obj:
            formset.form.base_fields['user'].initial = obj
        return formset

# Inline for InvestmentHistory (related to Investment)
class InvestmentHistoryInline(StackedInline):
    model = InvestmentHistory
    can_delete = True
    extra = 0  # Changed to 0 to prevent automatic empty forms
    fields = ('date', 'description', 'amount', 'status')
    readonly_fields = ('date',)

    def get_formset(self, request, obj=None, **kwargs):
        formset = super().get_formset(request, obj, **kwargs)
        if obj:
            # Only set initial if the fields exist
            if 'user' in formset.form.base_fields:
                formset.form.base_fields['user'].initial = obj.user
            if 'investment' in formset.form.base_fields:
                formset.form.base_fields['investment'].initial = obj
        return formset


    def save_formset(self, request, form, formset, change):
        # Only save valid InvestmentHistory entries
        instances = formset.save(commit=False)
        for instance in instances:
            if instance.amount is not None and instance.description:  # Ensure required fields
                instance.save()
        formset.save_m2m()

# Custom form for Investment to include transaction_description
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
        user = self.cleaned_data['user']
        if not user:
            raise forms.ValidationError("Please select a user for the investment.")
        return user

@admin.register(Account)
class AccountAdmin(ModelAdmin):
    list_display = ('profile_picture_thumbnail', 'email', 'username', 'fullname', 'phone', 'gender', 'currency', 'is_active', 'is_staff', 'is_admin', 'date_joined')
    list_filter = ('is_active', 'is_staff', 'is_admin', 'currency', 'gender')
    search_fields = ('email', 'username', 'fullname', 'phone', 'gender')
    readonly_fields = ('date_joined', 'last_login', 'username')
    fieldsets = (
        (None, {
            'fields': ('email', 'fullname', 'phone', 'gender', 'address', 'currency', 'profile_picture')
        }),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_admin', 'is_superuser', 'groups', 'user_permissions')
        }),
        ('Timestamps', {
            'fields': ('date_joined', 'last_login')
        }),
    )
    inlines = [BalanceInline, InvestmentInline]
    list_per_page = 25

    def profile_picture_thumbnail(self, obj):
        if obj.profile_picture and hasattr(obj, 'get_profile_picture_url'):
            return format_html('<img src="{}" width="50" height="50" style="object-fit: cover; border-radius: 5px;" />', obj.get_profile_picture_url())
        return "No Image"
    profile_picture_thumbnail.short_description = 'Profile Picture'

    def get_readonly_fields(self, request, obj=None):
        if obj:
            return self.readonly_fields + ('email', 'fullname', 'phone', 'gender', 'address', 'currency', 'profile_picture')
        return self.readonly_fields

@admin.register(Balance)
class BalanceAdmin(ModelAdmin):
    list_display = ('user', 'Active_Initial_Investment', 'Total_Return', 'Total_Available_Withdrawal', 'investment_status')
    list_filter = ('investment_status',)
    search_fields = ('user__email', 'user__username')
    readonly_fields = ('user',)
    fields = ('user', 'Active_Initial_Investment', 'Total_Return', 'Total_Available_Withdrawal', 'investment_status')
    list_per_page = 25



from decimal import Decimal

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
        super().save_model(request, obj, form, change)
        
        if not change:  # Only create history for new investments
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

            try:
                balance, created = Balance.objects.get_or_create(user=user)
                
                # 🛠️ Use Decimal math to prevent float rounding issues
                balance.Active_Initial_Investment = (
                    Decimal(balance.Active_Initial_Investment or 0) + Decimal(obj.amount)
                )
                
                balance.save()
                logger.info(f"Updated balance for user {user.email} with investment: {obj.amount}")
            except Exception as e:
                logger.error(f"Error updating balance for user {user.email}: {e}")
                raise ValueError(f"Could not update balance for user: {user}")

    def save_formset(self, request, form, formset, change):
        if formset.model == InvestmentHistory:
            instances = formset.save(commit=False)
            for instance in instances:
                if instance.amount is not None and instance.description:
                    instance.investment = form.instance
                    instance.user = form.instance.user
                    instance.save()
            formset.save_m2m()
        else:
            super().save_formset(request, form, formset, change)

    def get_readonly_fields(self, request, obj=None):
        if obj:
            return ('user',)
        return ()



@admin.register(InvestmentHistory)
class InvestmentHistoryAdmin(ModelAdmin):
    list_display = ('user', 'date', 'description', 'amount', 'status')
    list_filter = ('status', 'date')
    search_fields = ('user__email', 'user__username', 'description')
    readonly_fields = ('date', 'user')
    fields = ('user', 'investment', 'date', 'description', 'amount', 'status')
    date_hierarchy = 'date'
    list_per_page = 25