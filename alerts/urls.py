from django.urls import path
from . import views

urlpatterns = [
    path('alerts/', views.alert_list),
    path('courses/<int:course_id>/run-alerts/', views.run_alert_check),
]