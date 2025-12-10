# E-Commerce Platform

A full-stack e-commerce platform with admin panel, user authentication, payment integration, and comprehensive order management system.

## Tech Stack

### Frontend

**Framework & Core:**
- Next.js 16.0.7 (React Framework with App Router)
- React 19.2.0
- React DOM 19.2.0
- TypeScript 5

**Styling:**
- Tailwind CSS 4
- PostCSS (@tailwindcss/postcss)

**UI Libraries & Icons:**
- Lucide React 0.555.0 (Icon library)
- React Hot Toast 2.6.0 (Toast notifications)

**Data Visualization:**
- Recharts 3.5.1 (Charts and graphs)

**HTTP Client:**
- Axios 1.13.2 (API requests)

**Utilities:**
- date-fns 4.1.0 (Date formatting and manipulation)

**Development Tools:**
- ESLint 9 (Code linting)
- eslint-config-next 16.0.7 (Next.js ESLint config)
- TypeScript types (@types/node, @types/react, @types/react-dom)

### Backend

**Runtime & Framework:**
- Node.js with ES Modules (type: module)
- Express.js 4.18.2 (Web framework)

**Database:**
- Supabase (@supabase/supabase-js 2.86.2)
- PostgreSQL (via Supabase)

**Authentication:**
- JSON Web Tokens (jsonwebtoken 9.0.2)
- bcryptjs 2.4.3 (Password hashing)
- Passport.js 0.7.0 (Authentication middleware)
- passport-google-oauth20 2.0.0 (Google OAuth)

**Payment Integration:**
- Razorpay 2.9.6 (Payment gateway)

**File Upload:**
- Multer 2.0.2 (Multipart/form-data handling)

**Security & Utilities:**
- CORS 2.8.5 (Cross-origin resource sharing)
- express-rate-limit 8.2.1 (Rate limiting)
- dotenv 16.3.1 (Environment variables)

**Development Tools:**
- Nodemon 3.1.11 (Auto-restart server)
- Supabase CLI 2.65.8

## Environment Variables

### Frontend (.env.local)

```env
# API Endpoints
NEXT_PUBLIC_API_URL=http://localhost:5000/api/admin
NEXT_PUBLIC_USER_API_URL=http://localhost:5000/api/user

# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### Backend (.env)

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database (Supabase)
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_service_role_key_here

# JWT Configuration
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=7d

# CORS Configuration
APP_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Razorpay Payment Gateway
RAZORPAY_KEY_ID=your_razorpay_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:5000/api/user/auth/google/callback

# Frontend URLs
FRONTEND_URL=http://localhost:3000
FRONTEND_URL_PROD=https://yourdomain.com
```

## Features

### User Features
- **Authentication & Authorization**
  - User registration and login
  - Google OAuth integration
  - JWT-based authentication
  - Password encryption with bcryptjs

- **Product Browsing**
  - Browse products by categories
  - Product search and filtering
  - Product details with images
  - Deals and special offers section

- **Shopping Cart**
  - Add/remove items from cart
  - Update quantities
  - Real-time cart updates

- **Wishlist**
  - Save favorite products
  - Move items to cart from wishlist

- **Checkout & Payments**
  - Secure checkout process
  - Razorpay payment integration
  - Order success/failure pages
  - Multiple payment options

- **Order Management**
  - Order tracking
  - Order history
  - Order returns and replacements
  - Real-time order status updates

- **User Account**
  - Profile management
  - Address management
  - Order history
  - Wishlist management

- **Reviews & Ratings**
  - Product reviews
  - Rating system

- **Coupons & Discounts**
  - Apply coupon codes
  - View available deals

### Admin Features
- **Dashboard**
  - Analytics and statistics
  - Sales charts (Recharts)
  - Order overview
  - Customer insights

- **Product Management**
  - Add/edit/delete products
  - Product image upload
  - Category management
  - Inventory tracking

- **Order Management**
  - View all orders
  - Update order status
  - Process returns and replacements
  - Order fulfillment

- **Customer Management**
  - View customer list
  - Customer details
  - Order history per customer

- **Category Management**
  - Create/edit/delete categories
  - Category organization

- **Deals & Coupons**
  - Create promotional deals
  - Coupon code management
  - Discount configuration

- **Payment Management**
  - View payment transactions
  - Razorpay integration
  - Payment webhooks

- **Authentication**
  - Secure admin login
  - Role-based access control

### Security Features
- Rate limiting to prevent abuse
- CORS protection
- JWT token authentication
- Password hashing
- Secure payment processing
- Environment-based configuration

## Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Supabase account
- Razorpay account (for payments)
- Google OAuth credentials (optional)

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
# Update .env.local with your credentials
npm run dev
```

Frontend will run on `http://localhost:3000`

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Update .env with your credentials
npm run dev
```

Backend will run on `http://localhost:5000`

## Project Structure

```
Ecommerce/
├── frontend/
│   ├── app/              # Next.js App Router pages
│   │   ├── admin/        # Admin panel
│   │   ├── auth/         # Authentication pages
│   │   ├── cart/         # Shopping cart
│   │   ├── checkout/     # Checkout flow
│   │   ├── product/      # Product pages
│   │   ├── account/      # User account
│   │   └── ...
│   ├── components/       # Reusable components
│   ├── contexts/         # React contexts
│   └── lib/              # Utility functions
│
└── backend/
    ├── config/           # Configuration files
    ├── controllers/      # Route controllers
    ├── routes/           # API routes
    │   ├── admin/        # Admin routes
    │   └── user/         # User routes
    ├── middlewares/      # Custom middlewares
    ├── services/         # Business logic
    ├── database/         # Database schemas
    └── utils/            # Utility functions
```

## API Endpoints

### User Routes
- `/api/user/auth` - Authentication
- `/api/user/products` - Product browsing
- `/api/user/cart` - Cart management
- `/api/user/wishlist` - Wishlist
- `/api/user/orders` - Order management
- `/api/user/payment` - Payment processing
- `/api/user/reviews` - Product reviews
- `/api/user/coupons` - Coupon validation

### Admin Routes
- `/api/admin/auth` - Admin authentication
- `/api/admin/dashboard` - Dashboard analytics
- `/api/admin/products` - Product management
- `/api/admin/categories` - Category management
- `/api/admin/orders` - Order management
- `/api/admin/customers` - Customer management
- `/api/admin/deals` - Deal management
- `/api/admin/coupons` - Coupon management
- `/api/admin/payment` - Payment management

## Scripts

### Frontend
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Backend
```bash
npm run dev      # Start with nodemon (auto-restart)
npm start        # Start production server
```

## License

ISC

## Author

Sarv Sampan Enterprises
