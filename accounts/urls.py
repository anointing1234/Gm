from django.urls import path,include,re_path
from django.conf import settings
from django.conf.urls.static import static
from . import views
from django.views.static import serve 
from django.contrib.auth.views import LogoutView





urlpatterns = [
    path('',views.home_view,name='home_view'),
    path('home_view/',views.home_view,name='home_view'),
     path('home/',views.home_view,name='home'),
     path('client_login/',views.login_view,name='client_login'),
     path('client_signup/',views.signup_view,name='client_signup'),
     path('signup/',views.signup_view,name='signup'),
     path('login/', views.login_view, name='login'),
     path('investment/days-count/', views.get_days_count, name='investment_days_count'),
     path('upload_profile_picture/', views.upload_profile_picture, name='upload_profile_picture'),
     path('logout/', views.logout_view, name='logout'),


    #  homepage pages urls
    path('investment_banking/', views.investment_banking, name='investment_banking'),
    path('assets_management/', views.assets_management, name='assets_management'),
    path('GlobalInvestmentResearch/', views.GlobalInvestmentResearch, name='GlobalInvestmentResearch'),
    path('Exchanges/', views.Exchanges, name='Exchanges'),
    path('The_Market/', views.The_Market, name='The_Market'),
    path('about/', views.about, name='about'),
    path('Our_People_and_Leadership/', views.Our_People_and_Leadership, name='Our_People_and_Leadership'),
    path('community_impact/', views.community_impact, name='community_impact'),
    path('students/', views.students, name='students'),
    path('life_at_gs/', views.life_at_gs, name='life_at_gs'),
    path('Benefits/', views.Benefits, name='Benefits'),


    re_path(r'^media/(?P<path>.*)$', serve,{'document_root': settings.MEDIA_ROOT}),
    re_path(r'^static/(?P<path>.*)$', serve,{'document_root': settings.STATIC_ROOT}),
]
