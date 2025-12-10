# Hotel Management System - Frontend

A modern, responsive frontend for the Hotel Management System built with Next.js, TypeScript, and Tailwind CSS.

## Features

### Guest Website
- **Homepage** - Hero section with hotel overview
- **Rooms** - Room categories and pricing
- **Gallery** - Hotel image gallery
- **Restaurant** - Dining information and menu
- **Events** - Event spaces and services
- **Contact** - Contact form and information

### Admin Dashboard
- **Dashboard** - Overview and statistics
- **Bookings** - Manage reservations
- **Rooms** - Room management
- **Guests** - Guest profiles
- **Bills** - Billing and payments
- **Feedback** - Guest feedback
- **Gallery** - Image management
- **Offers** - Promotional offers
- **Users** - User management

### Reception Dashboard
- **Dashboard** - Daily operations overview
- **Bookings** - Create and manage bookings
- **Check-In/Out** - Guest check-in and check-out
- **Guests** - Guest information
- **Room Status** - Real-time room status
- **Bills** - Billing operations
- **Feedback** - Collect feedback

## Technology Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **State Management**: React Hooks
- **Authentication**: JWT with cookies
- **Forms**: React Hook Form
- **Notifications**: React Hot Toast
- **Icons**: Lucide React

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Install dependencies**:
```bash
npm install
# or
yarn install
```

2. **Set up environment variables**:
```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_APP_NAME=Hotel Management System
```

3. **Run the development server**:
```bash
npm run dev
# or
yarn dev
```

4. **Open your browser**:
Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
frontend/
├── components/           # Reusable components
│   ├── layout/          # Layout components
│   ├── ui/              # UI components
│   └── forms/           # Form components
├── pages/               # Next.js pages
│   ├── admin/           # Admin dashboard pages
│   ├── reception/       # Reception dashboard pages
│   └── ...              # Guest website pages
├── utils/               # Utility functions
│   └── api/             # API client and functions
├── types/               # TypeScript type definitions
├── styles/              # Global styles
└── public/              # Static assets
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## API Integration

The frontend integrates with the Spring Boot backend API:

- **Base URL**: `http://localhost:8080`
- **Authentication**: JWT Bearer tokens
- **Error Handling**: Automatic token refresh and logout
- **Type Safety**: Full TypeScript support

## Authentication Flow

1. User logs in via `/login`
2. JWT token stored in secure cookies
3. Token automatically included in API requests
4. Role-based routing (admin/reception)
5. Automatic logout on token expiry

## Responsive Design

- **Mobile-first** approach
- **Tailwind CSS** for styling
- **Responsive navigation** with mobile menu
- **Grid layouts** that adapt to screen size
- **Touch-friendly** interface elements

## Development Guidelines

### Component Structure
- Use functional components with hooks
- Implement proper TypeScript typing
- Follow consistent naming conventions
- Keep components small and focused

### Styling
- Use Tailwind CSS utility classes
- Follow consistent spacing and colors
- Implement responsive design patterns
- Use semantic HTML elements

### API Integration
- Use the provided API client
- Implement proper error handling
- Show loading states
- Cache data when appropriate

## Deployment

### Build for Production
```bash
npm run build
npm run start
```

### Environment Variables
Set the following in production:
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_APP_NAME` - Application name

## Contributing

1. Follow the existing code style
2. Add TypeScript types for new features
3. Test on multiple screen sizes
4. Update documentation as needed

## License

This project is for educational/demonstration purposes.





