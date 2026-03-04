# How to Run the Lab Management System

## Prerequisites

1. **Node.js** (v18 or higher)
2. **MySQL** (v8.0 or higher)
3. **Git** (for cloning the repository)

## Initial Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Setup

#### MySQL Configuration
- Make sure MySQL is running on your system
- Create a database named `labmanagement`
- Update the `.env` file if your MySQL credentials are different:

```env
DATABASE_URL="mysql://username:password@localhost:3306/labmanagement"
```

#### Run Database Migrations
```bash
npx prisma migrate dev
```

#### Seed the Database (Optional - for initial data)
```bash
npx prisma db seed
```

## Running the Project

### Option 1: Run Both Frontend and Backend Together
```bash
npm run dev:all
```

### Option 2: Run Separately (Recommended for Development)

#### Terminal 1 - Frontend (React + Vite)
```bash
npm run dev
```
- Frontend will run on: http://localhost:5173

#### Terminal 2 - Backend (Node.js + Express)
```bash
npm run server:dev
```
- Backend API will run on: http://localhost:3001

## Default Login Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Instructor | instructor | instructor123 |
| Student | student | student123 |

## Project Structure

```
DYCICLMS4/
├── src/                 # React frontend source code
├── server/              # Node.js backend source code
├── prisma/              # Database schema and migrations
├── public/              # Static assets
├── electron/            # Electron app configuration
└── .env                 # Environment variables
```

## Available Scripts

- `npm run dev` - Start frontend development server
- `npm run server:dev` - Start backend development server with nodemon
- `npm run dev:all` - Start both frontend and backend simultaneously
- `npm run build` - Build for production
- `npm run db:migrate` - Run Prisma database migrations
- `npm run db:seed` - Seed database with initial data
- `npm run electron` - Run Electron desktop app
- `npm run lint` - Run ESLint

## Database Management

### Reset Database (Warning: This will delete all data)
```bash
npx prisma migrate reset --force
```

### View Database
```bash
npx prisma studio
```
- Opens Prisma Studio at http://localhost:5555

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure MySQL is running
   - Check DATABASE_URL in .env file
   - Verify database exists: `CREATE DATABASE labmanagement;`

2. **Migration Conflicts**
   - Reset database: `npx prisma migrate reset --force`
   - Then run migrations again: `npx prisma migrate dev`

3. **Port Already in Use**
   - Frontend (5173) or Backend (3001) might be in use
   - Kill processes or change ports in configuration

4. **Node Modules Issues**
   - Delete node_modules folder and package-lock.json
   - Run `npm install` again

### Environment Variables

Make sure your `.env` file contains:
```env
VITE_API_URL="http://localhost:3001"
VITE_SOCKET_URL="http://localhost:3001"
DATABASE_URL="mysql://root:@localhost:3306/labmanagement"
```

## Features

- **User Management**: Admin, Instructor, and Student roles
- **Laboratory Management**: Schedule and manage computer labs
- **Computer Inventory**: Track computer specifications and status
- **Real-time Messaging**: Chat system with Socket.io
- **Class Groups**: Organize students by class sections
- **Electron App**: Desktop application support

## Development Tips

- Frontend uses React with Vite, TailwindCSS, and Radix UI components
- Backend uses Express.js with JWT authentication
- Database uses Prisma ORM with MySQL
- Real-time features powered by Socket.io
- Hot reload enabled for both frontend and backend during development

## Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Ensure all prerequisites are installed
3. Verify database connection and migrations
4. Check terminal output for specific error messages
