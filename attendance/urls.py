from django.urls import path
from . import views

urlpatterns = [
    path('courses/', views.course_list),
    path('courses/<int:course_id>/sessions/', views.session_list),
    path('sessions/<int:session_id>/generate-qr/', views.generate_qr),
    path('sessions/<int:session_id>/attendance/', views.session_attendance),
    path('mark/', views.mark_attendance),
    path('upload-timetable/', views.upload_timetable),
    path('courses/<int:course_id>/delete/', views.delete_course),
    path('sessions/<int:session_id>/delete/', views.delete_session),
    path('sessions/today/', views.todays_sessions),
    path('courses/<int:course_id>/edit/', views.edit_course),
    path('sessions/<int:session_id>/export/', views.export_attendance_excel),
    path('upload-student-list/', views.upload_student_list),
    path('courses/<int:course_id>/upload-students/', views.upload_student_list),
    path('courses/<int:course_id>/students/', views.get_student_list),
    path('reset-semester/', views.reset_semester),
    path('sessions/<int:session_id>/finalize/', views.finalize_session),
     
     # Student enrollment management - NEW
    path('courses/<int:course_id>/students/', views.get_enrolled_students, name='get_enrolled_students'),
    path('courses/<int:course_id>/students/add/', views.add_student_manual, name='add_student_manual'),
    path('courses/<int:course_id>/students/<int:student_id>/remove/', views.remove_student_from_course, name='remove_student'),
    path('courses/<int:course_id>/students/clear/', views.clear_all_enrollments, name='clear_enrollments'),
    
    path('courses/<int:course_id>/upload-students/', views.upload_student_list, name='upload_student_list'),
    # Sessions...
    path('courses/<int:course_id>/sessions/', views.get_sessions, name='get_sessions'),

    
]