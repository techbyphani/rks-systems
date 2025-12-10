@echo off
echo ========================================
echo PostgreSQL Connection Check
echo ========================================
echo.

echo Checking if PostgreSQL service is running...
sc query postgresql-x64-16 | find "RUNNING" >nul
if %errorlevel% equ 0 (
    echo [OK] PostgreSQL service is running
) else (
    echo [WARNING] PostgreSQL service might not be running
    echo Try starting it from Services (services.msc)
)
echo.

echo Attempting to connect to PostgreSQL...
echo Please enter your PostgreSQL password when prompted:
psql -U postgres -c "SELECT version();"
if %errorlevel% equ 0 (
    echo [OK] PostgreSQL connection successful!
    echo.
    echo Checking if hotel_db exists...
    psql -U postgres -c "\l" | find "hotel_db" >nul
    if %errorlevel% equ 0 (
        echo [OK] Database 'hotel_db' exists
    ) else (
        echo [INFO] Database 'hotel_db' does not exist
        echo Creating database...
        psql -U postgres -c "CREATE DATABASE hotel_db;"
        if %errorlevel% equ 0 (
            echo [OK] Database 'hotel_db' created successfully
        ) else (
            echo [ERROR] Failed to create database
        )
    )
) else (
    echo [ERROR] Failed to connect to PostgreSQL
    echo Please check:
    echo 1. PostgreSQL is installed
    echo 2. PostgreSQL service is running
    echo 3. Password is correct
)
echo.
pause

