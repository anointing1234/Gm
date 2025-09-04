from django.urls import path,include,re_path
from django.conf import settings
from django.conf.urls.static import static
from . import views
from django.views.static import serve 
from django.contrib.auth.views import LogoutView





urlpatterns = [
    path('',views.home_view,name='home'),
     path('home/',views.home_view,name='home'),
     path('client_login/',views.login_view,name='client_login'),
     path('client_signup/',views.signup_view,name='client_signup'),
     path('signup/',views.signup_view,name='signup'),
     path('login/', views.login_view, name='login'),
     path('investment/days-count/', views.get_days_count, name='investment_days_count'),
     path('upload_profile_picture/', views.upload_profile_picture, name='upload_profile_picture'),
      path('logout/', views.logout_view, name='logout'),
    re_path(r'^media/(?P<path>.*)$', serve,{'document_root': settings.MEDIA_ROOT}),
    re_path(r'^static/(?P<path>.*)$', serve,{'document_root': settings.STATIC_ROOT}),
]
