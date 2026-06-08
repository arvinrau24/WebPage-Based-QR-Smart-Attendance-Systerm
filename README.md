# Smart Attendance System

A Django-based REST API for managing student attendance using QR codes, GPS verification, and digital excuse submissions.

## Overview

Smart Attendance is a comprehensive attendance management system designed for educational institutions. It leverages QR code scanning, GPS geofencing, and digital documentation to automate and verify attendance tracking for courses and lectures.

## Tech Stack

### Backend
- **Framework**: Django 5.2.13
- **API**: Django REST Framework 3.17.1
- **Database**: PostgreSQL (via psycopg2)
- **Server**: Gunicorn 23.0.0
- **Static Files**: WhiteNoise 6.9.0

### Key Libraries
- **CORS**: django-cors-headers 4.9.0
- **Email**: django-anymail with Brevo backend
- **Document Processing**: 
  - openpyxl 3.1.5 (Excel)
  - pdfplumber 0.11.9 (PDF)
  - PyMuPDF 1.27.2.3 (PDF)
  - python-docx 1.2.0 (Word)
- **QR Codes**: qrcode 8.2
- **Images**: Pillow 12.2.0
- **AI**: Groq 1.2.0 (for intelligent processing)
- **Environment**: python-dotenv 1.2.2

### Deployment
- **Hosting**: Railway
- **Database URL**: Environment variable based

## Project Structure

```
smart-attendance/
├── core/                      # Django project configuration
│   ├── settings.py           # Global settings & configuration
│   ├── urls.py               # URL routing
│   ├── wsgi.py               # WSGI application
│   └── asgi.py               # ASGI application
│
├── accounts/                 # User authentication & management
│   ├── models.py            # User model with role-based access
│   ├── views.py             # Authentication views
│   └── urls.py              # Authentication endpoints
│
├── attendance/              # Core attendance tracking
│   ├── models.py            # Course, Session, QRToken, AttendanceRecord, StudentProfile
│   ├── views.py             # Attendance management views
│   └── urls.py              # Attendance endpoints
│
├── alerts/                  # Attendance alerts & excuses
│   ├── models.py            # Alert and excuse models
│   ├── views.py             # Alert management views
│   └── urls.py              # Alert endpoints
│
├── media/                   # User-uploaded files (excuses, documents)
├── staticfiles/             # Static files (served by WhiteNoise)
├── manage.py                # Django management script
├── requirements.txt         # Python dependencies
└── .env                     # Environment variables (not in git)
```

## Key Features

### 1. **User Management**
- Role-based access control (Lecturer, Student)
- Token-based authentication (DRF TokenAuthentication)
- Custom User model with student ID and phone fields

### 2. **Course Management**
- Create and manage courses with sections
- Define semester dates (start/end)
- Geofence polygon support for location-based verification

### 3. **Attendance Tracking**
- Session creation with start/end times
- QR token generation with expiration
- Attendance status: Present, Absent, Excused, Pending Approval
- GPS verification with latitude/longitude tracking
- Unique attendance records per student per session

### 4. **QR Code System**
- Automatic QR token generation for sessions
- Expiration-based token management
- Unique token per session for security

### 5. **Digital Excuses**
- Students can submit excuses with supporting documents
- Allowed file types: PDF, JPG, JPEG, PNG, GIF, WEBP, DOC, DOCX
- Maximum file size: 10MB per submission
- Email notifications for excuse submissions

### 6. **Alerts & Notifications**
- Automated attendance alerts
- Email notifications via Brevo API
- Student profile management with contact information

## Data Models

### **User** (accounts.models.User)
```
- username, email, password (inherited from AbstractUser)
- role: lecturer | student
- student_id: Optional student identifier
- phone: Contact number
```

### **Course** (attendance.models.Course)
```
- name: Course name
- code: Unique course code
- section: Course section/group
- lecturer: ForeignKey to User
- students: M2M relationship to User
- semester_start: Start date
- semester_end: End date
- geofence_polygon: GeoJSON coordinates for location verification
```

### **Session** (attendance.models.Session)
```
- course: ForeignKey to Course
- date: Session date
- start_time: Start time
- end_time: End time
- is_finalized: Marks session as complete
- created_at: Timestamp
```

### **QRToken** (attendance.models.QRToken)
```
- session: ForeignKey to Session
- token: UUID (unique identifier)
- created_at: Generation timestamp
- expires_at: Expiration datetime
- is_active: Current status
```

### **AttendanceRecord** (attendance.models.AttendanceRecord)
```
- session: ForeignKey to Session
- student: ForeignKey to User
- full_name: Student name
- matric_number: Student ID
- status: present | absent | excused | pending
- scanned_at: Scan timestamp
- latitude, longitude: GPS coordinates
- gps_verified: Location verification status
```

### **StudentProfile** (attendance.models.StudentProfile)
```
- course: ForeignKey to Course
- matric_number: Student ID
- full_name: Student name
- phone: Phone number
- email: Email address
- section: Course section
```

## API Endpoints

### Authentication (`/api/auth/`)
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/register` - User registration

### Attendance (`/api/`)
- `GET /api/courses/` - List courses
- `POST /api/courses/` - Create course (Lecturer only)
- `GET /api/sessions/` - List sessions
- `POST /api/sessions/` - Create session (Lecturer only)
- `POST /api/qr-tokens/` - Generate QR token
- `POST /api/attendance/` - Record attendance
- `GET /api/attendance/` - Get attendance records

### Alerts (`/api/`)
- `POST /api/excuses/` - Submit excuse
- `GET /api/excuses/` - List excuses
- `POST /api/notifications/` - Send notification

## Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,yourdomain.com

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/smart_attendance
# Or individual settings:
# DB_NAME=smart_attendance
# DB_USER=postgres
# DB_PASSWORD=password
# DB_HOST=localhost
# DB_PORT=5432

# Frontend
FRONTEND_URL=http://localhost:5173

# Email Configuration (Brevo)
BREVO_API_KEY=your-brevo-api-key
DEFAULT_FROM_EMAIL=smartattendance.utem@gmail.com
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@example.com
EMAIL_HOST_PASSWORD=your-password
EMAIL_USE_TLS=True

# Railway (if deploying)
RAILWAY_ENVIRONMENT=production
RAILWAY_PUBLIC_DOMAIN=your-railway-domain.railway.app
```

## Setup Instructions

### Local Development

1. **Clone the repository**
```bash
git clone <repository-url>
cd smart-attendance
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. **Run migrations**
```bash
python manage.py makemigrations
python manage.py migrate
```

6. **Create superuser**
```bash
python manage.py createsuperuser
```

7. **Run development server**
```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000`
Admin interface at `http://localhost:8000/admin`

### Production Deployment (Railway)

1. **Create Railway project** and connect your GitHub repository

2. **Add PostgreSQL service** in Railway:
   - Generate `DATABASE_URL` and add to service variables

3. **Set environment variables** in Railway dashboard:
   - `SECRET_KEY`: Generate a secure key
   - `DEBUG`: Set to `False`
   - `ALLOWED_HOSTS`: Include your Railway domain
   - `BREVO_API_KEY`: Your Brevo email API key
   - Other configuration variables

4. **Railway auto-deploys** on push to main branch

### Database Management

**Create migrations after model changes:**
```bash
python manage.py makemigrations
python manage.py migrate
```

**View migration status:**
```bash
python manage.py showmigrations
```

**Access database:**
```bash
# PostgreSQL CLI
psql -U postgres -d smart_attendance -h localhost
```

## Configuration Details

### CORS Settings
- **Development**: All origins allowed (when `DEBUG=True`)
- **Production**: Specific origins configured in `ALLOWED_HOSTS`
- **Frontend URLs**: 
  - `http://localhost:5173`
  - `https://web-page-based-qr-smart-attendance.vercel.app`

### Email Backend
- **Primary**: Brevo API (if `BREVO_API_KEY` set)
- **Fallback**: SMTP configuration
- **Sender**: Configurable via `DEFAULT_FROM_EMAIL`

### File Uploads
- **Allowed for excuses**: PDF, images (JPG, PNG, GIF, WEBP), documents (DOC, DOCX)
- **Max size**: 10MB
- **Storage**: Django FileSystemStorage (local) or S3 (production)

### Timezone
- **Default**: Asia/Kuala_Lumpur (UTC+8)

## API Authentication

All protected endpoints require:
```
Authorization: Token YOUR_API_TOKEN
```

Obtain token after login:
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user","password":"pass"}'
```

## Testing

Run tests:
```bash
python manage.py test
```

## Contributing

1. Create a feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

## License

[Specify your license here]

## Support

For issues or questions, please contact the development team or create an issue in the repository.
