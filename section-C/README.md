# ZennTech Property Management System

A modern, full-stack property management tool built with Next.js and Express.js, featuring real-time form validation and live preview functionality.

## 🚀 Features

### Backend (Express.js)
- ✅ **REST API** with authentication via API key
- ✅ **POST /api/properties** - Create new properties with validation
- ✅ **GET /api/projects** - Fetch hardcoded project list
- ✅ **In-memory storage** - No database required
- ✅ **Comprehensive validation** - Server-side data validation
- ✅ **CORS enabled** - Cross-origin resource sharing
- ✅ **Security headers** - Helmet.js integration
- ✅ **Error handling** - Global error handling middleware

### Frontend (Next.js + Tailwind CSS)
- ✅ **Property Form** - All required fields with validation
- ✅ **Live Preview Card** - Real-time updates as user types
- ✅ **Form Validation** - Client-side validation with error messages
- ✅ **Date Formatting** - Display dates in "27 April 2025" format
- ✅ **Save Button Control** - Disabled until all validations pass
- ✅ **Loading States** - Visual feedback during API calls
- ✅ **Success/Error Messages** - User feedback for form submissions

## 🛠️ Tech Stack

**Backend:**
- Node.js + Express.js
- CORS, Helmet for security
- UUID for unique IDs
- In-memory data storage

**Frontend:**
- Next.js 14 with App Router
- TypeScript
- Tailwind CSS
- Axios for API calls
- Lucide React for icons
- date-fns for date handling

## 📋 Requirements Met

### API Security
- ✅ Static API key authentication
- ✅ Header: `X-API-Key: zenntech-property-api-key-2025`

### Backend Endpoints
- ✅ `POST /api/properties` - Create property
- ✅ `GET /api/projects` - Get projects list

### Frontend Features
- ✅ Project dropdown (fetched from backend)
- ✅ Property Title input
- ✅ Size input (sq. ft.)
- ✅ Price input (USD)
- ✅ Handover Date picker
- ✅ Live Preview Card
- ✅ Form validation (all requirements)
- ✅ Date display format: "27 April 2025"
- ✅ Save button disabled until valid

### Validation Rules
- ✅ No required field can be blank
- ✅ Price and Size must be positive numbers
- ✅ Handover date must be in the future
- ✅ Save button disabled until all validations pass

## 🚦 Quick Start

### 1. Clone & Setup

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd frontend
npm install
```

### 2. Environment Configuration (Optional)

**Backend** (Create `backend/.env`):
```env
PORT=3001
API_KEY=zenntech-property-api-key-2025
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

**Frontend** (Create `frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_API_KEY=zenntech-property-api-key-2025
```

### 3. Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Server runs on http://localhost:3001
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# App runs on http://localhost:3000
```

### 4. Test the Application

1. Open [http://localhost:3000]
2. Fill in the property form
3. Watch the live preview update in real-time
4. Submit the form to create a property

## 🔧 API Documentation

### Authentication
All API endpoints require the `X-API-Key` header:
```
X-API-Key: zenntech-property-api-key-2025
```
