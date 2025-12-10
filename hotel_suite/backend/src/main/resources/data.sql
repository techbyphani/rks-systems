-- Initial Data for Hotel Management System
-- Note: This will only run if spring.jpa.hibernate.ddl-auto is set to create or create-drop

-- Insert default admin user (password: admin123)
-- Password hash for "admin123" using BCrypt
INSERT INTO users (username, password_hash, role) VALUES 
('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iwK8pJwC', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Insert sample room types
INSERT INTO room_types (name, base_price, capacity) VALUES 
('Standard', 2000.00, 2),
('Deluxe', 3500.00, 2),
('Suite', 5000.00, 4),
('Presidential', 10000.00, 6)
ON CONFLICT DO NOTHING;

-- Insert sample rooms
INSERT INTO rooms (room_number, room_type_id, status, floor) VALUES 
('101', 1, 'available', 1),
('102', 1, 'available', 1),
('201', 2, 'available', 2),
('202', 2, 'available', 2),
('301', 3, 'available', 3),
('401', 4, 'available', 4)
ON CONFLICT (room_number) DO NOTHING;

