-- Hotel Management System Database Schema
-- PostgreSQL Database Initialization Script

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'reception')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Room Types Table
CREATE TABLE IF NOT EXISTS room_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    capacity INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Room Type Amenities (for array storage)
CREATE TABLE IF NOT EXISTS room_type_amenities (
    room_type_id INTEGER REFERENCES room_types(id) ON DELETE CASCADE,
    amenity VARCHAR(100),
    PRIMARY KEY (room_type_id, amenity)
);

-- Rooms Table
CREATE TABLE IF NOT EXISTS rooms (
    id SERIAL PRIMARY KEY,
    room_number VARCHAR(10) UNIQUE NOT NULL,
    room_type_id INTEGER REFERENCES room_types(id),
    status VARCHAR(20) DEFAULT 'available'
        CHECK (status IN ('available', 'occupied', 'reserved', 'maintenance', 'dirty')),
    floor INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Room Images Table
CREATE TABLE IF NOT EXISTS room_images (
    id SERIAL PRIMARY KEY,
    room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Guests Table
CREATE TABLE IF NOT EXISTS guests (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    email VARCHAR(100),
    id_proof_type VARCHAR(50),
    id_proof_number VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Room Bookings Table
CREATE TABLE IF NOT EXISTS room_bookings (
    id SERIAL PRIMARY KEY,
    booking_id VARCHAR(20) UNIQUE NOT NULL,
    guest_id INTEGER REFERENCES guests(id),
    room_id INTEGER REFERENCES rooms(id),
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    actual_check_in TIMESTAMP,
    actual_check_out TIMESTAMP,
    adults INTEGER DEFAULT 1,
    children INTEGER DEFAULT 0,
    total_amount DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'confirmed'
        CHECK (status IN ('confirmed', 'checked_in', 'checked_out', 'cancelled')),
    booking_source VARCHAR(20) DEFAULT 'website'
        CHECK (booking_source IN ('website', 'phone', 'walk_in', 'chatbot')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bills Table
CREATE TABLE IF NOT EXISTS bills (
    id SERIAL PRIMARY KEY,
    bill_number VARCHAR(20) UNIQUE NOT NULL,
    room_booking_id INTEGER REFERENCES room_bookings(id),
    guest_id INTEGER REFERENCES guests(id),
    room_charges DECIMAL(10,2) DEFAULT 0,
    food_charges DECIMAL(10,2) DEFAULT 0,
    other_charges DECIMAL(10,2) DEFAULT 0,
    discount DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'pending'
        CHECK (payment_status IN ('pending', 'paid', 'partial')),
    payment_method VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bill Items Table
CREATE TABLE IF NOT EXISTS bill_items (
    id SERIAL PRIMARY KEY,
    bill_id INTEGER REFERENCES bills(id) ON DELETE CASCADE,
    item_type VARCHAR(20) NOT NULL
        CHECK (item_type IN ('room', 'food', 'service', 'other')),
    description VARCHAR(200) NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(8,2) NOT NULL,
    total_price DECIMAL(8,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Feedback Table
CREATE TABLE IF NOT EXISTS feedback (
    id SERIAL PRIMARY KEY,
    guest_id INTEGER REFERENCES guests(id),
    room_booking_id INTEGER REFERENCES room_bookings(id),
    room_rating INTEGER CHECK (room_rating BETWEEN 1 AND 5),
    service_rating INTEGER CHECK (service_rating BETWEEN 1 AND 5),
    overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
    comments TEXT,
    feedback_type VARCHAR(20) DEFAULT 'checkout'
        CHECK (feedback_type IN ('checkout', 'general')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Gallery Images Table
CREATE TABLE IF NOT EXISTS gallery_images (
    id SERIAL PRIMARY KEY,
    image_url TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_rooms_room_type ON rooms(room_type_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON room_bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_guest ON room_bookings(guest_id);
CREATE INDEX IF NOT EXISTS idx_bookings_room ON room_bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON room_bookings(check_in_date, check_out_date);
CREATE INDEX IF NOT EXISTS idx_guests_phone ON guests(phone);
CREATE INDEX IF NOT EXISTS idx_guests_email ON guests(email);

