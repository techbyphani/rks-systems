# PostgreSQL Setup and Backend Run Guide

## Step 1: Download and Install PostgreSQL

### For Windows:

1. **Download PostgreSQL**
   - Go to: https://www.postgresql.org/download/windows/
   - Click "Download the installer"
   - Download the latest version (e.g., PostgreSQL 16.x)

2. **Run the Installer**
   - Double-click the downloaded `.exe` file
   - Click "Next" through the setup wizard
   - **Important**: Remember the password you set for the `postgres` superuser account
   - Keep the default port `5432` (unless you have a conflict)
   - Keep the default installation directory
   - Complete the installation

3. **Verify Installation**
   - Open Command Prompt or PowerShell
   - Run: `psql --version`
   - You should see the PostgreSQL version number

## Step 2: Start PostgreSQL Service

### Option A: Using Services (Recommended)
1. Press `Win + R`, type `services.msc`, press Enter
2. Find "postgresql-x64-16" (or your version)
3. Right-click → Start (if not already running)
4. Set it to "Automatic" so it starts on boot

### Option B: Using Command Line
```powershell
# Start PostgreSQL service
net start postgresql-x64-16
```

## Step 3: Create the Database

### Method 1: Using pgAdmin (GUI - Recommended for beginners)

1. **Open pgAdmin**
   - Search for "pgAdmin 4" in Start Menu
   - It will open in your web browser

2. **Connect to Server**
   - Enter the password you set during installation
   - You'll see "PostgreSQL 16" server in the left panel

3. **Create Database**
   - Right-click on "Databases" → "Create" → "Database"
   - Name: `hotel_db`
   - Click "Save"

### Method 2: Using Command Line (psql)

1. **Open Command Prompt or PowerShell**

2. **Connect to PostgreSQL**
   ```powershell
   psql -U postgres
   ```
   - Enter your password when prompted

3. **Create Database**
   ```sql
   CREATE DATABASE hotel_db;
   ```

4. **Verify Database Created**
   ```sql
   \l
   ```
   - You should see `hotel_db` in the list

5. **Exit psql**
   ```sql
   \q
   ```

## Step 4: Configure Application Properties

1. **Open** `src/main/resources/application.properties`

2. **Update Database Configuration**:
   ```properties
   # Update these lines with your PostgreSQL credentials
   spring.datasource.url=jdbc:postgresql://localhost:5432/hotel_db
   spring.datasource.username=postgres
   spring.datasource.password=YOUR_POSTGRES_PASSWORD_HERE
   ```

   **Replace `YOUR_POSTGRES_PASSWORD_HERE` with the password you set during PostgreSQL installation**

## Step 5: Build and Run the Backend

### Prerequisites Check:
1. **Java 17+ installed?**
   ```powershell
   java -version
   ```
   - Should show version 17 or higher
   - If not installed: Download from https://www.oracle.com/java/technologies/downloads/

2. **Maven installed?**
   ```powershell
   mvn -version
   ```
   - Should show Maven version
   - If not installed: Download from https://maven.apache.org/download.cgi

### Run the Application:

#### Option 1: Using Maven Command Line

1. **Open PowerShell or Command Prompt**
2. **Navigate to project directory** (if not already there):
   ```powershell
   cd C:\Users\LENOVO\Downloads\backend_hotel
   ```

3. **Build the project**:
   ```powershell
   mvn clean install
   ```

4. **Run the application**:
   ```powershell
   mvn spring-boot:run
   ```

#### Option 2: Using IDE (IntelliJ IDEA / Eclipse / VS Code)

1. **Import Project**
   - Open your IDE
   - File → Open → Select the `backend_hotel` folder
   - Wait for Maven to download dependencies

2. **Run Application**
   - Find `HotelManagementApplication.java` in `src/main/java/com/hotel/`
   - Right-click → Run 'HotelManagementApplication'
   - Or click the green play button

## Step 6: Verify Everything Works

### Check Application Started:
- Look for this message in console:
  ```
  Started HotelManagementApplication in X.XXX seconds
  ```

### Test the API:

1. **Open PowerShell or Command Prompt**

2. **Test Login Endpoint**:
   ```powershell
   curl -X POST http://localhost:8080/auth/login -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"password\":\"admin123\"}"
   ```

   **Expected Response**:
   ```json
   {
     "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "role": "admin"
   }
   ```

3. **Or use a tool like Postman**:
   - URL: `http://localhost:8080/auth/login`
   - Method: POST
   - Body (JSON):
     ```json
     {
       "username": "admin",
       "password": "admin123"
     }
     ```

## Troubleshooting

### Problem: "Connection refused" or "Connection to localhost:5432 refused"

**Solution**:
- PostgreSQL service is not running
- Start it using Services (see Step 2)
- Or check if port 5432 is blocked by firewall

### Problem: "FATAL: password authentication failed"

**Solution**:
- Check the password in `application.properties`
- Make sure it matches the PostgreSQL `postgres` user password
- Try resetting password in pgAdmin

### Problem: "database 'hotel_db' does not exist"

**Solution**:
- Create the database (see Step 3)
- Verify database name in `application.properties` matches

### Problem: "Port 8080 already in use"

**Solution**:
- Change port in `application.properties`:
  ```properties
  server.port=8081
  ```

### Problem: Maven build fails

**Solution**:
- Check internet connection (Maven needs to download dependencies)
- Try: `mvn clean install -U` (force update)
- Check Java version is 17+

### Problem: "JWT secret key too short"

**Solution**:
- The JWT secret in `application.properties` must be at least 32 characters
- Current secret should work, but if you change it, make sure it's long enough

## Quick Reference Commands

```powershell
# Check PostgreSQL is running
Get-Service postgresql*

# Start PostgreSQL
net start postgresql-x64-16

# Connect to PostgreSQL
psql -U postgres

# Create database (inside psql)
CREATE DATABASE hotel_db;

# List databases
\l

# Exit psql
\q

# Build Spring Boot app
mvn clean install

# Run Spring Boot app
mvn spring-boot:run

# Check if app is running
curl http://localhost:8080/auth/login
```

## Default Credentials

- **PostgreSQL**: 
  - Username: `postgres`
  - Password: (the one you set during installation)

- **Application Admin**:
  - Username: `admin`
  - Password: `admin123`

## Next Steps

Once the backend is running:
1. Test all API endpoints using Postman or curl
2. The database tables will be created automatically on first run
3. Default admin user will be created from `data.sql`
4. Start making API calls to test the system

## Need Help?

- Check application logs in the console
- Verify PostgreSQL is running in Services
- Check `application.properties` configuration
- Ensure all prerequisites (Java, Maven) are installed

