# 🍺 Hop Registry API

A secure Django REST API for managing hop grower memberships, yield tracking, and admin oversight.

---

## Features

- **JWT Authentication** — secure token-based login
- **Member self-service** — view/edit own profile (name, email, phone, hop varieties)
- **Membership number protection** — members cannot edit their own membership number
- **Admin panel** — full user management, yield entry, user deletion
- **Role-based access** — strict separation between member and admin endpoints

---

## Tech Stack

- Python 3.10+
- Django 4.2+
- Django REST Framework
- `djangorestframework-simplejwt` for JWT auth
- `django-cors-headers` for CORS support
- SQLite (default, easily swappable for PostgreSQL)

---

## Setup

### 1. Install dependencies

```bash
pip install -r requirements.txt
```

### 2. Apply migrations

```bash
python manage.py migrate
```

### 3. Create a superuser (admin)

```bash
python manage.py createsuperuser
```

### 4. (Optional) Load sample data

```bash
python manage.py seed_data
```

### 5. Run the server

```bash
python manage.py runserver
```

---

## API Endpoints

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register/` | Register a new member |
| POST | `/api/auth/login/` | Login — returns JWT tokens |
| POST | `/api/auth/token/refresh/` | Refresh access token |

---

### Member (authenticated users only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/member/me/` | View own profile |
| PATCH | `/api/member/me/` | Edit own profile (not membership number) |
| GET | `/api/member/me/hop-varieties/` | List own hop varieties |
| POST | `/api/member/me/hop-varieties/` | Add a hop variety |
| DELETE | `/api/member/me/hop-varieties/{id}/` | Remove a hop variety |
| GET | `/api/member/me/yields/` | View own yield records |

---

### Admin (staff/superuser only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/members/` | List all members |
| GET | `/api/admin/members/{id}/` | View specific member |
| PATCH | `/api/admin/members/{id}/` | Edit any member's details |
| DELETE | `/api/admin/members/{id}/` | Delete a member |
| GET | `/api/admin/members/{id}/yields/` | View member's yields |
| POST | `/api/admin/members/{id}/yields/` | Add yield to a member |
| PATCH | `/api/admin/yields/{id}/` | Edit a yield record |
| DELETE | `/api/admin/yields/{id}/` | Delete a yield record |

---

## Example Requests

### Register
```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "securepassword123",
    "first_name": "John",
    "last_name": "Doe",
    "telephone": "07700900000"
  }'
```

### Login
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "john_doe", "password": "securepassword123"}'
```

Response:
```json
{
  "access": "<JWT_ACCESS_TOKEN>",
  "refresh": "<JWT_REFRESH_TOKEN>",
  "user": { "id": 1, "username": "john_doe", ... }
}
```

### View own profile
```bash
curl http://localhost:8000/api/member/me/ \
  -H "Authorization: Bearer <JWT_ACCESS_TOKEN>"
```

### Add a hop variety
```bash
curl -X POST http://localhost:8000/api/member/me/hop-varieties/ \
  -H "Authorization: Bearer <JWT_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Cascade", "description": "Floral and citrusy aroma hops"}'
```

### Admin: Add yield to a member
```bash
curl -X POST http://localhost:8000/api/admin/members/1/yields/ \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "hop_variety": 1,
    "harvest_date": "2025-09-15",
    "quantity_kg": 120.5,
    "notes": "Excellent quality this year"
  }'
```

---

## Security Notes

- All endpoints (except register/login) require a valid JWT `Authorization: Bearer <token>` header
- Members can only access their own data — attempting to access others' returns 403
- `membership_number` is auto-generated on registration and is read-only for members
- Admin endpoints require `is_staff=True` on the user account
- Passwords are hashed with Django's PBKDF2 by default

---

## Django Admin UI

Visit `http://localhost:8000/admin/` and log in with your superuser credentials for a full admin interface.
