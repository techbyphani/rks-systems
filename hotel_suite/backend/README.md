# Hotel Management System - Spring Boot Application

A comprehensive Hotel Management System built with Spring Boot and PostgreSQL, providing RESTful APIs for managing hotel operations including bookings, rooms, guests, billing, and feedback.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access (Admin, Reception)
- **Room Management**: Manage room inventory, types, status, and images
- **Booking Management**: Create, check-in, and check-out bookings
- **Guest Management**: Maintain guest profiles and information
- **Dashboard**: Real-time statistics and metrics
- **Billing System**: Track bills and bill items
- **Feedback System**: Collect and manage guest feedback
- **Gallery Management**: Manage hotel and room images

## Technology Stack

- **Framework**: Spring Boot 3.2.0
- **Database**: PostgreSQL
- **Security**: Spring Security with JWT
- **Build Tool**: Maven
- **Java Version**: 17

## Prerequisites

- Java 17 or higher
- Maven 3.6+
- PostgreSQL 12 or higher
- IDE (IntelliJ IDEA, Eclipse, or VS Code)

## Database Setup

1. **Install PostgreSQL** (if not already installed)
   - Download from: https://www.postgresql.org/download/

2. **Create Database**
   ```sql
   CREATE DATABASE hotel_db;
   ```

3. **Update Database Configuration**
   Edit `src/main/resources/application.properties`:
   ```properties
   spring.datasource.url=jdbc:postgresql://localhost:5432/hotel_db
   spring.datasource.username=your_username
   spring.datasource.password=your_password
   ```

## Running the Application

### Option 1: Using Maven

```bash
# Navigate to project directory
cd backend_hotel

# Build the project
mvn clean install

# Run the application
mvn spring-boot:run
```

### Option 2: Using IDE

1. Import the project as a Maven project
2. Run `HotelManagementApplication.java`
3. The application will start on `http://localhost:8080`

## API Endpoints

### Authentication

- `POST /auth/login` - Login and get JWT token
- `POST /auth/register` - Register new user (Admin only)

### Dashboard

- `GET /dashboard/stats` - Get hotel statistics

### Room Management

- `GET /rooms` - Get all rooms
- `PUT /rooms/{roomId}/status` - Update room status

### Booking Management

- `GET /bookings` - List all bookings (with optional filters: status, date, limit)
- `POST /bookings` - Create new booking
- `PUT /bookings/{bookingId}/checkin` - Check-in guest
- `PUT /bookings/{bookingId}/checkout` - Check-out guest

### Guest Management

- `GET /guests` - List all guests
- `POST /guests` - Create guest profile

### Gallery Management

- `GET /gallery` - Get all gallery images
- `POST /gallery` - Upload new image
- `DELETE /gallery/{imageId}` - Delete image

### Feedback

- `GET /feedback` - Get all feedback
- `POST /feedback` - Submit feedback

### Offers

- `GET /offers` - Get active offers
- `POST /offers` - Create new offer

## API Usage Examples

### 1. Login

```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

Response:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "admin"
}
```

### 2. Get Dashboard Stats

```bash
curl -X GET http://localhost:8080/dashboard/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Create Booking

```bash
curl -X POST http://localhost:8080/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "guestName": "John Doe",
    "guestPhone": "+911234567890",
    "roomTypeId": 2,
    "checkInDate": "2025-01-01",
    "checkOutDate": "2025-01-03",
    "adults": 2,
    "children": 1,
    "bookingSource": "website"
  }'
```

## Default Credentials

- **Username**: admin
- **Password**: admin123

**Note**: Change the default password in production!

## Database Schema

The application uses the following main entities:

- **Users**: Authentication and authorization
- **Room Types**: Room categories with pricing
- **Rooms**: Individual room instances
- **Room Images**: Multiple images per room
- **Guests**: Guest information
- **Room Bookings**: Booking records
- **Bills**: Billing information
- **Bill Items**: Itemized bill details
- **Feedback**: Guest feedback
- **Gallery Images**: Hotel gallery images

## Configuration

### JWT Configuration

Update `application.properties`:
```properties
jwt.secret=YourStrongSecretKeyAtLeast32CharactersLong
jwt.expiration=86400000  # 24 hours in milliseconds
```

### Database Configuration

The application uses Hibernate's `ddl-auto=update` which automatically creates/updates tables. For production, consider using:
- `spring.jpa.hibernate.ddl-auto=validate`
- Use migration tools like Flyway or Liquibase

## Security

- JWT tokens are required for most endpoints (except `/auth/login` and `/rooms`)
- Role-based access control (Admin, Reception)
- Password encryption using BCrypt

## Error Handling

The API returns standardized error responses:

```json
{
  "error": "ERROR_CODE",
  "message": "Human readable message",
  "details": {
    "field": "field name"
  },
  "timestamp": "2025-12-03T12:00:00"
}
```

## Development

### Project Structure

```
src/
├── main/
│   ├── java/com/hotel/
│   │   ├── controller/     # REST controllers
│   │   ├── service/        # Business logic
│   │   ├── repository/     # Data access
│   │   ├── entity/         # JPA entities
│   │   ├── dto/            # Data transfer objects
│   │   ├── security/       # Security configuration
│   │   └── HotelManagementApplication.java
│   └── resources/
│       ├── application.properties
│       ├── schema.sql      # Database schema
│       └── data.sql        # Initial data
└── test/
```

## Troubleshooting

### Database Connection Issues

1. Ensure PostgreSQL is running
2. Verify database credentials in `application.properties`
3. Check if database `hotel_db` exists

### Port Already in Use

Change the port in `application.properties`:
```properties
server.port=8081
```

### JWT Token Issues

Ensure the JWT secret is at least 32 characters long.

## Future Enhancements

- Inventory management
- Kitchen and restaurant order tracking
- Loyalty programs
- Multi-language support
- Real-time status updates
- File upload for images
- Email notifications

## License

This project is for educational/demonstration purposes.

## Support

For issues or questions, please refer to the API documentation or database design documents.

