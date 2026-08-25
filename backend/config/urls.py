from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from todos.views import TodoViewSet, register_user, login_user

router = DefaultRouter()
router.register(r'todos', TodoViewSet, basename='todo')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/register/', register_user),
    path('api/auth/login/', login_user),
    path('api/', include(router.urls)),
]
