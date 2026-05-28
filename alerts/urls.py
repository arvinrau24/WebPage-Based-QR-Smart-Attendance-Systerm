from django.urls import path
from . import views

urlpatterns = [
    path('alerts/', views.alert_list),
    path('alerts/<int:alert_id>/', views.alert_detail),
    path('alerts/<int:alert_id>/send/', views.alert_send),
    path('courses/<int:course_id>/run-alerts/', views.run_alert_check),
]
