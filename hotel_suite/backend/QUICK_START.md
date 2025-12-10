# Quick Start Guide - PostgreSQL & Backend Setup

## 🚀 Quick Setup (5 Steps)

### Step 1: Install PostgreSQL
1. Download: https://www.postgresql.org/download/windows/
2. Run installer, set a password (remember it!)
3. Keep default port: 5432

### Step 2: Create Database
**Option A - Using pgAdmin (Easier):**
- Open pgAdmin from Start Menu
- Enter your password
- Right-click "Databases" → Create → Database
- Name: `hotel_db` → Save

**Option B - Using Command Line:**
```powershell
psql -U postgres
# Enter password, then:
CREATE DATABASE hotel_db;
\q
```

### Step 3: Update Configuration
Open `src/main/resources/application.properties` and change line 8:
```properties
spring.datasource.password=YOUR_POSTGRES_PASSWORD
```
Replace `YOUR_POSTGRES_PASSWORD` with the password you set during PostgreSQL installation.

### Step 4: Run Backend
**Option A - Using Batch Script (Easiest):**
```powershell
.\run-backend.bat
```

**Option B - Using Maven:**
```powershell
mvn clean install
mvn spring-boot:run
```

**Option C - Using IDE:**
- Open project in IntelliJ/Eclipse/VS Code
- Run `HotelManagementApplication.java`

### Step 5: Test It Works
Open browser or Postman:
```
POST http://localhost:8080/auth/login
Body (JSON):
{
  "username": "admin",
  "password": "admin123"
}
```

## ✅ Verification Checklist

- [ ] PostgreSQL installed
- [ ] PostgreSQL service running (check in Services)
- [ ] Database `hotel_db` created
- [ ] Password updated in `application.properties`
- [ ] Application starts without errors
- [ ] Login endpoint returns JWT token

## 🆘 Common Issues

**"Connection refused"**
→ Start PostgreSQL service: `net start postgresql-x64-16`

**"Password authentication failed"**
→ Check password in `application.properties` matches PostgreSQL password

**"Database does not exist"**
→ Create database: `CREATE DATABASE hotel_db;`

**"Port 8080 in use"**
→ Change port in `application.properties`: `server.port=8081`

## 📝 Default Credentials

- **PostgreSQL**: `postgres` / (your password)
- **App Admin**: `admin` / `admin123`

## 📚 Full Documentation

See `POSTGRESQL_SETUP.md` for detailed instructions.

