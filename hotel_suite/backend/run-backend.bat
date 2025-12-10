@echo off
echo ========================================
echo Hotel Management System - Backend
echo ========================================
echo.

REM Change to backend directory (in case script is run from root)
cd /d "%~dp0"

echo Checking Java installation...
java -version
if %errorlevel% neq 0 (
    echo ERROR: Java is not installed or not in PATH
    echo Please install Java 17 or higher
    pause
    exit /b 1
)
echo.

echo Checking Maven installation...
mvn -version
if %errorlevel% neq 0 (
    echo ERROR: Maven is not installed or not in PATH
    echo Please install Maven
    pause
    exit /b 1
)
echo.

echo Building the project...
call mvn clean install -DskipTests
if %errorlevel% neq 0 (
    echo ERROR: Build failed
    pause
    exit /b 1
)
echo.

echo Starting the application...
echo Application will be available at: http://localhost:8080
echo Press Ctrl+C to stop the application
echo.
call mvn spring-boot:run

pause

