# AI Mock Interview Platform

This project is split into two main parts: frontend and backend.

## Project Structure

```
project/
├── frontend/                # React frontend application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts (Auth, etc.)
│   │   ├── pages/         # Page components
│   │   ├── lib/           # Shared types and utilities
│   │   ├── App.tsx        # Main App component
│   │   └── main.tsx       # Entry point
│   ├── package.json
│   └── tsconfig.json
│
└── backend/                # Express.js backend application
    ├── src/
    │   ├── lib/           # Database and models
    │   │   ├── db.ts      # Database connection
    │   │   └── models/    # Mongoose models
    │   ├── routes/        # API routes
    │   ├── middleware/    # Express middleware
    │   └── index.ts       # Entry point
    ├── package.json
    └── tsconfig.json
```

## Getting Started

### Frontend

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at http://localhost:5173

### Backend

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with the following variables:
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

4. Start the development server:
```bash
npm run dev
```

The backend API will be available at http://localhost:5000

## Features

- User authentication (signup/login) with role-based access (HR/Candidate)
- HR Dashboard for managing interviews
- Interview scheduling and room creation
- Real-time interview sessions
- MongoDB database for data persistence
- JWT-based authentication
- TypeScript support for both frontend and backend 