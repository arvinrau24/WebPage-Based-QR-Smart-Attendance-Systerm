from django.core.management.base import BaseCommand
from attendance.models import Course
from alerts.kml_parser import parse_kml_polygon


class Command(BaseCommand):
    help = 'Load geofence polygon from KML file for a course'

    def add_arguments(self, parser):
        parser.add_argument('--course', type=str, required=True, help='Course code')
        parser.add_argument('--kml', type=str, required=True, help='Path to KML file')

    def handle(self, *args, **options):
        course_code = options['course']
        kml_path = options['kml']

        try:
            course = Course.objects.get(code=course_code)
        except Course.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'Course {course_code} not found'))
            return

        try:
            polygon = parse_kml_polygon(kml_path)
            course.geofence_polygon = polygon
            course.save(update_fields=['geofence_polygon'])
            self.stdout.write(
                self.style.SUCCESS(
                    f'Loaded {len(polygon)} coordinates for {course_code} from {kml_path}'
                )
            )
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error loading KML: {str(e)}'))
