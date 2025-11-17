# Personal Project Management Tool

A personalized project management application built with Next.js 16, Prisma, and PostgreSQL. This tool treats your daily life as a project and helps you manage everything in one place.

## Features

- ✅ Custom green color palette (#2E6F40, #CFFFDC, #68BA7F, #253D2C)
- ✅ Responsive dashboard layout with sidebar navigation
- ✅ Single superuser authentication system
- ✅ Dashboard home page with stats
- ✅ User management page
- ✅ Settings page
- ✅ Mobile-responsive design

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS v4
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** Custom session-based auth
- **TypeScript:** Full type safety

## Project Structure

```
personal-pm-tool/
├── src/
│   ├── app/
│   │   ├── api/auth/          # Authentication API routes
│   │   ├── dashboard/         # Dashboard page
│   │   ├── login/             # Login page
│   │   ├── settings/          # Settings page
│   │   ├── user-management/   # User management page
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home (redirects to login)
│   ├── components/
│   │   └── layout/            # Layout components (Header, SideNav, MobileMenu)
│   ├── lib/                   # Utility functions
│   │   ├── auth.ts            # Authentication utilities
│   │   └── prisma.ts          # Prisma client
│   ├── styles/
│   │   └── globals.css        # Global styles with custom colors
│   └── middleware.ts          # Route protection middleware
├── prisma/
│   └── schema.prisma          # Database schema
└── package.json
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Database

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/personal_pm"
NODE_ENV="development"
```

### 3. Generate Prisma Client and Sync Database

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations to create database schema
npx prisma migrate dev --name init
```

### 4. Create Initial User

Run the seed script to create your superuser:

```bash
# Install tsx if not already installed
npm install -D tsx

# Run seed
npx tsx prisma/seed.ts
```

**Default Credentials:**
- Email: `admin@personal-pm.com`
- Password: `changeme123`

⚠️ **Important:** Change the password after first login!

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

**For detailed setup instructions, see [SETUP.md](./SETUP.md)**

## Color Palette

The application uses a custom green color palette:

- **Primary Dark:** #2E6F40
- **Primary Light:** #CFFFDC
- **Primary Medium:** #68BA7F
- **Primary Darker:** #253D2C

## Authentication

The app uses a custom session-based authentication system:

- Passwords are hashed using bcryptjs
- Sessions are stored in the database
- Middleware protects routes
- Session cookies last 30 days

## Pages

### Dashboard (`/dashboard`)
- Overview of projects and tasks
- Stats cards
- Recent activity

### User Management (`/user-management`)
- Profile information
- Avatar management
- Bio editing

### Settings (`/settings`)
- General settings
- Email notifications toggle
- Dark mode toggle
- Password change

### Login (`/login`)
- Email/password authentication
- Remember me option
- Redirects to dashboard on success

## Next Steps

1. Install bcryptjs: `npm install bcryptjs @types/bcryptjs`
2. Setup your PostgreSQL database
3. Run `npx prisma migrate dev`
4. Create your superuser account
5. Start building features!

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## License

Personal use only.

