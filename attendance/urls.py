from django.urls import path
from . import views

urlpatterns = [
    # Courses
    path('courses/', views.course_list),
    path('courses/create/', views.create_course_manual),
    path('courses/<int:course_id>/edit/', views.edit_course),
    path('courses/<int:course_id>/delete/', views.delete_course),

    # Student enrollment
    path('courses/<int:course_id>/students/', views.get_student_list),
    path('courses/<int:course_id>/students/add/', views.add_student_manual),
    path('courses/<int:course_id>/students/clear/', views.clear_all_enrollments),
    path('courses/<int:course_id>/students/<int:student_id>/remove/', views.remove_student_from_course),
    path('courses/<int:course_id>/upload-students/', views.upload_student_list),

    # Sessions
    path('courses/<int:course_id>/sessions/', views.session_list),
    path('courses/<int:course_id>/sessions/past/', views.past_sessions_for_course),
    path('sessions/today/', views.todays_sessions),
    path('sessions/past/', views.past_sessions_all),
    path('sessions/<int:session_id>/generate-qr/', views.generate_qr),
    path('sessions/<int:session_id>/attendance/', views.session_attendance),
    path('sessions/<int:session_id>/excuse/', views.session_excuse_student),
    path('sessions/<int:session_id>/export/', views.export_attendance_excel),
    path('sessions/<int:session_id>/finalize/', views.finalize_session),
    path('sessions/<int:session_id>/delete/', views.delete_session),

    # Other
    path('mark/', views.mark_attendance),
    path('upload-timetable/', views.upload_timetable),
    path('upload-student-list/', views.upload_student_list),
    path('reset-semester/', views.reset_semester),
]