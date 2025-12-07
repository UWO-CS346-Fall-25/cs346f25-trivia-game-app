# CS346 Semester Project Template

A teaching template for building secure web applications with Node.js, Express, EJS, and PostgreSQL.

## Features

- 🚀 **Node.js 20** + **Express 4** - Modern JavaScript backend
- 🎨 **EJS** - Server-side templating
- 🗄️ **PostgreSQL** - Reliable relational database
- 🔒 **Security First** - Helmet, CSRF protection, secure sessions
- 📝 **Clean Code** - ESLint, Prettier, best practices
- 🎓 **Educational** - Well-documented, instructional code

##  Current Summary of the project

The app is currently functional. A user will be prompted to either log in or register for a new account upon entering the site. Once signed in, they will be directed to the homepage. If no games are currently in the database, eight games will be created by default using random questions provided by calling a trivia games API. Users can play these games or create their own games. Games can be deleted by the user who created them; default games cannot be deleted by users. The leaderboard at the bottom of the homepage displays the top five users who have answered the most questions correctly. The profile page shows more detailed game stats, such as right-to-wrong answer ratio and the top three most played games, and allows a user to delete their account. When a user logs out, their session is cleared and they return to the login/register phase. Their accounts are saved so they can log back in later. When a user creates an account, it will inform them about the strength of their password, but there are no restrictions on what password they can set. Usernames and emails must be unique. Changes made by a user are visible across all users’ sites, such as newly created games and updates to the leaderboard.

## Technical Architecture
MVC is an architecture pattern that is broken into three parts: The model (the data and database layer), the view (what the user sees), and the controller (the logic that connects them). This project uses MVC by keeping all data operations inside Supabase queries (Model), placing all user-facing HTML inside EJS templates (View), and handling all application logic inside the Express controllers (Controller). Each request is routed to a controller, which interacts with the database, processes data, and then passes that data to an EJS file that renders the final page for the user.


## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/UWO-CS346-Fall-25/cs346f25-trivia-game-app.git
   cd cs346f25-trivia-game-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create & Set up PostgreSQL database**
   ```bash
   Create database 
   Run the code found in /db/schema.sql in Supabase to create the needed tables
   ```

4. **Set up environment variables**
   ```bash
   Create a .env by copying .env.example
   Edit .env with your database credentials
   ```

5. **Start the application**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   ```
   http://localhost:3000
   ```

## Error Handling 

1. Database -> The app expects database insert, update, delete, and fetch errors, and handles them by wrapping every Supabase call in try/catch so the app logs the issue and safely redirects or renders a fallback page instead of crashing.

2. External API Calls -> The app expects the OpenTDB API to occasionally fail or return bad data, and handles this by catching API exceptions and skipping default-game creation without exposing any technical errors to the user.

3. Authentication -> The app expects missing or invalid sessions and protects routes by checking req.session.user so that unauthorized users are redirected instead of causing a crash.

4. Form Validation -> The app expects invalid input (like short passwords, invalid emails, or incorrect login credentials) and handles these by re-rendering the form with user-friendly messages rather than failing the request.

## Project Structure

```
├── src/
│   ├── server.js           # Server entry point
│   ├── app.js              # Express app configuration
│   ├── routes/             # Route definitions
│   ├── controllers/        # Request handlers
│   ├── models/             # Database models
│   ├── views/              # EJS templates
│   └── public/             # Static files (CSS, JS, images)
├── db/
│   ├── migrations/         # Database migrations
│   ├── seeds/              # Database seeds
│   ├── migrate.js          # Migration runner
│   ├── seed.js             # Seed runner
│   └── reset.js            # Database reset script
├── docs/                   # Documentation
│   ├── README.md           # Documentation overview
│   ├── SETUP.md            # Setup guide
│   └── ARCHITECTURE.md     # Architecture details
├── .env.example            # Environment variables template
├── .eslintrc.json          # ESLint configuration
├── .prettierrc.json        # Prettier configuration
└── package.json            # Dependencies and scripts
```

## Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload
- `npm run migrate` - Run database migrations
- `npm run seed` - Seed database with sample data
- `npm run reset` - Reset database (WARNING: deletes all data!)
- `npm run lint` - Check code for linting errors
- `npm run lint:fix` - Fix linting errors automatically
- `npm run format` - Format code with Prettier

## Security Features

- **Helmet**: Sets security-related HTTP headers
- **express-session**: Secure session management with httpOnly cookies
- **csurf**: Cross-Site Request Forgery (CSRF) protection
- **Parameterized SQL**: SQL injection prevention with prepared statements
- **Environment Variables**: Sensitive data kept out of source code

## Documentation

Comprehensive documentation is available in the `docs/` folder:

- [docs/README.md](docs/README.md) - Documentation overview
- [docs/SETUP.md](docs/SETUP.md) - Detailed setup instructions
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - Architecture and design patterns

## Technology Stack

- **Runtime**: Node.js 20
- **Framework**: Express 4
- **Templating**: EJS
- **Database**: PostgreSQL (with pg driver)
- **Security**: Helmet, express-session, csurf
- **Development**: ESLint, Prettier, Nodemon

## Learning Resources

- [Express.js Documentation](https://expressjs.com/)
- [EJS Documentation](https://ejs.co/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Node.js Documentation](https://nodejs.org/docs/)
- [OWASP Security Guide](https://owasp.org/)

## Contributing

This is a teaching template. Feel free to:
- Report issues
- Suggest improvements
- Submit pull requests
- Use it for your own projects

## License

ISC