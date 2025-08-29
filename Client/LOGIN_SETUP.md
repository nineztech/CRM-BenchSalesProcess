# Login System Setup Guide

## Installation Commands

Run these commands in your Client directory:

```bash
npm install axios react-hook-form @hookform/resolvers yup lucide-react
npm install -D @types/node
```

## Environment Configuration

Create a `.env` file in your Client directory with:

```env
VITE_API_URL=http://localhost:3000/api
```

## Project Structure

```
src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx      # Login form component
│   │   └── ProtectedRoute.tsx # Route protection
│   └── Router.tsx             # Main router
├── contexts/
│   └── AuthContext.tsx        # Authentication context
├── pages/
│   ├── LoginPage.tsx          # Login page
│   └── Dashboard.tsx          # Dashboard after login
├── services/
│   └── authService.ts         # API service
├── types/
│   └── auth.ts                # TypeScript types
└── App.tsx                    # Main app component
```

## Features

- ✅ Professional login form with validation
- ✅ Modern UI with Tailwind CSS
- ✅ Form validation with Yup and React Hook Form
- ✅ API integration with Axios
- ✅ Authentication context management
- ✅ Protected routes
- ✅ Responsive design
- ✅ Loading states and error handling
- ✅ Remember me functionality
- ✅ Password visibility toggle
- ✅ Professional dashboard after login

## API Integration

The login form integrates with `/api/clientusers/login` endpoint:

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "User Name",
      "role": "client"
    }
  }
}
```

## Usage

1. Install dependencies
2. Configure environment variables
3. Start the development server: `npm run dev`
4. Navigate to the login page
5. Enter credentials and submit

## Customization

- Modify colors in `tailwind.config.js`
- Update API endpoints in `authService.ts`
- Customize form validation in `LoginForm.tsx`
- Modify dashboard content in `Dashboard.tsx`

## Security Features

- JWT token storage
- Automatic token refresh
- Protected route handling
- Secure logout functionality
- Input validation and sanitization


