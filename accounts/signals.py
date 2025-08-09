from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Account, Balance

@receiver(post_save, sender=Account)
def create_user_balance(sender, instance, created, **kwargs):
    if created:  # Check if the user is newly created
        Balance.objects.create(user=instance)