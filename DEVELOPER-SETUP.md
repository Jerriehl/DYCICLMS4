# Lab Management System - Developer Setup Guide

## Prerequisites

### Required Software
1. **Node.js** (LTS version) - Download from https://nodejs.org/
2. **MySQL** - Download from https://dev.mysql.com/downloads/mysql/
3. **Git** - Download from https://git-scm.com/

### Database Setup
1. Install MySQL on your system
2. Create a database named `labmanagement`
3. Default MySQL credentials: `root` with no password (update .env if different)

## Installation Steps

```bash
# 1. Clone the repository
git clone <repository-url>
cd DYCICLMS4

# 2. Install all dependencies
npm install

# 3. Set up environment variables
# Copy the example .env files and update if needed
cp .env.example .env
cp server/.env.example server/.env

# 4. Run database migrations
npm run db:migrate

# 5. Seed the database with initial data
npm run db:seed

# 6. Generate Prisma client
npx prisma generate
```

## Running the Application

### Development Mode (Recommended for development)
```bash
# Start both frontend and backend concurrently
npm run dev:all
```

### Individual Services
```bash
# Start backend server only
npm run server:dev

# Start frontend only (in separate terminal)
npm run dev
```

### Production Build
```bash
# Build the application
npm run build

# Preview the production build
npm run preview
```

## Application URLs

- **Frontend**: http://localhost:5173 (or 5174 if 5173 is occupied)
- **Backend API**: http://localhost:3001
- **Database**: MySQL on localhost:3306

## Environment Variables

### Root .env file:
```env
VITE_API_URL="http://localhost:3001"
VITE_SOCKET_URL="http://localhost:3001"
DATABASE_URL="mysql://root:@localhost:3306/labmanagement"
```

### Server/.env file:
```env
DATABASE_URL="mysql://root:@localhost:3306/labmanagement"
JWT_SECRET="dyci-clms-super-secret-key-2024"
PORT=3001
CLIENT_URL="http://localhost:5173"
```

## Key Dependencies

### Frontend Dependencies
- **React 19.2.0** - UI framework
- **Vite 7.3.1** - Build tool and dev server
- **React Router DOM 7.13.0** - Client-side routing
- **Socket.io Client 4.8.3** - Real-time communication
- **Axios 1.13.5** - HTTP client
- **Tailwind CSS 4.2.0** - CSS framework
- **Prisma Client 5.22.0** - Database ORM
- **Lucide React 0.575.0** - Icon library

### Backend Dependencies
- **Express 4.18.2** - Web framework
- **Socket.io 4.8.3** - Real-time communication server
- **Prisma 5.22.0** - Database ORM
- **MySQL** - Database (system dependency)
- **JWT 9.0.2** - Authentication tokens
- **bcryptjs 2.4.3** - Password hashing
- **CORS 2.8.5** - Cross-origin resource sharing
- **dotenv 16.3.1** - Environment variable management

### Development Dependencies
- **Nodemon 3.1.14** - Auto-restart server on changes
- **Concurrently 9.2.1** - Run multiple scripts simultaneously
- **ESLint 9.39.1** - Code linting
- **Electron 40.6.0** - Desktop app framework (optional)

## Database Commands

```bash
# Create and apply migrations
npm run db:migrate

# Seed database with initial data
npm run db:seed

# Reset database (destructive)
npx prisma migrate reset

# View database in Prisma Studio
npx prisma studio
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: If ports 3001 or 5173 are occupied, the app will automatically try alternative ports
2. **Database connection**: Ensure MySQL is running and the `labmanagement` database exists
3. **Permission errors**: On Windows, you may need to run PowerShell as Administrator
4. **Node modules corruption**: Delete `node_modules` and run `npm install` again

### Useful Commands

```bash
# Check if ports are in use
netstat -ano | findstr :3001
netstat -ano | findstr :5173

# Kill processes on specific ports (Windows)
taskkill /PID <process-id> /F

# Clear npm cache
npm cache clean --force

# Rebuild node modules
rm -rf node_modules package-lock.json
npm install
```

## Project Structure

```
DYCICLMS4/
├── src/                    # Frontend React code
├── server/                 # Backend Express server
├── prisma/                 # Database schema and migrations
├── public/                 # Static assets
├── electron/               # Electron desktop app (optional)
├── .env                    # Frontend environment variables
├── server/.env            # Backend environment variables
└── package.json           # Project dependencies and scripts
```

## Default Login Credentials

After seeding the database, you can use these accounts:

- **Admin**: username: `admin`, password: `admin123`
- **Instructor**: username: `instructor`, password: `instructor123`  
- **Student**: username: `student`, password: `student123`

## Support

For issues or questions:
1. Check the console logs in browser and terminal
2. Verify all prerequisites are installed
3. Ensure database is running and accessible
4. Check that all environment variables are set correctly
