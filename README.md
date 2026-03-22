# NEU Library Visitor Log System

A web-based library visitor logging system for New Era University built with HTML, CSS, JavaScript, and Supabase.

## Live Application
🔗 [Live App](https://liblog-system.vercel.app)

## GitHub Repository
🔗 [GitHub](https://github.com/zymoncuatriz/LiblogSystem-)

## Tech Stack
HTML / CSS / JavaScript
Supabase (Database + Authentication)
Vercel (Deployment)
Google OAuth 2.0

## Features

### Visitor (Student)
Sign in with Google account
Log library visit with reason selection
Automatic redirect back to login after visit
Blocked accounts cannot log in

### Admin
Separate admin portal login via Google
View visitor statistics dashboard
Filter visitors by date, reason, college, and type
View charts — visitors per day, by reason, by college, student vs employee ratio
Manage users — add, block, unblock, delete, reset password

## Account Roles

| Role | Email | Access |
|------|-------|--------|
| Admin | jcesperanza.admin@neu.edu.ph | Admin Dashboard |
| Admin | zymon.cuatriz@neu.edu.ph | Admin Dashboard |
| Student | jcesperanza@neu.edu.ph | Visitor Log |
| Student | zymon.cuatriz@neu.edu.ph | Visitor Log |

## Pages

| Page | Description |
|------|-------------|
| index.html | Visitor login page with Google auth |
| admin-login.html | Admin portal login with Google auth |
| log-visit.html | Student visit logging page |
| admin.html | Admin dashboard with stats and charts |
| manage-users.html | Admin user management page |
| register.html | Registration page for new Google users |

## Database Tables

| Table | Description |
|-------|-------------|
| students | Student records with login credentials |
| library_visits | Visit logs with reason and timestamp |
| user_roles | Role assignments per email |

## Setup Instructions

### Prerequisites
VS Code
Node.js
Git
Supabase account
Google Cloud Console account
Vercel account

### Installation
1. Clone the repository:
   git clone https://github.com/zymoncuatriz/LiblogSystem-.git
2. Open the project in VS Code
3. Update supabase.js with your Supabase URL and API key
4. Open with Live Server for local testing

### Deployment
The project is deployed on Vercel and automatically updates when changes are pushed to the main branch.

## Developer
**Zymon Cuatriz** — zymoncuatriz
**New Era University** — CIT223
