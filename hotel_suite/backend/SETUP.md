# Quick Setup Guide

## Step 1: Install PostgreSQL

1. Download and install PostgreSQL from https://www.postgresql.org/download/
2. Remember your PostgreSQL password (default username is usually `postgres`)

## Step 2: Create Database

Open PostgreSQL command line or pgAdmin and run:

```sql
CREATE DATABASE hotel_db;
```

## Step 3: Configure Application

Edit `src/main/resources/application.properties`:

```properties
# Update these with your PostgreSQL credentials
spring.datasource.url=jdbc:postgresql://localhost:5432/hotel_db
spring.datasource.username=postgres
spring.datasource.password=YOUR_PASSWORD_HERE
```

## Step 4: Build and Run

### Using Maven:

```bash
# Build the project
mvn clean install

# Run the application
mvn spring-boot:run
```

### Using IDE:

1. Import as Maven project
2. Run `HotelManagementApplication.java`

## Step 5: Verify

The application should start on `http://localhost:8080`

Test the login endpoint:

```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

## Default Admin Credentials

- Username: `admin`
- Password: `admin123`

**Important**: Change the default password in production!

## Troubleshooting

### Port 8080 already in use?

Change the port in `application.properties`:
```properties
server.port=8081
```

### Database connection error?

1. Ensure PostgreSQL is running
2. Verify database name is `hotel_db`
3. Check username and password in `application.properties`
4. Ensure PostgreSQL is listening on port 5432

### JWT errors?

Make sure the JWT secret in `application.properties` is at least 32 characters long.

