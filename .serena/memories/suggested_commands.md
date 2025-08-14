# Suggested Development Commands

## Frontend Commands (from `/frontend` directory)
- `npm start` - Start development server (uses react-app-rewired)
- `npm run build` - Create production build
- `npm test` - Run tests with react-app-rewired
- `npm run eject` - Eject from react-app-rewired (not recommended)

## Backend Commands (from `/backend` directory)  
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon hot reload
- `npm run seed:locations` - Seed location data in database
- `npm test` - No tests configured (returns error)

## Root Level Commands
- No npm scripts configured at root level
- Tests should be run from individual frontend/backend directories

## Database Operations
- Backend uses MongoDB connection string from `.env` file
- Use Mongoose models in `/schemas/mongoose/` for data operations
- Seed data available via `npm run seed:locations` script

## Git Commands (standard)
- `git status` - Check working tree status
- `git add .` - Stage all changes
- `git commit -m "message"` - Commit staged changes
- `git push` - Push to remote repository
- `git pull` - Pull latest changes

## File System Commands (Linux)
- `ls` - List directory contents
- `cd <directory>` - Change directory
- `pwd` - Print working directory
- `find <path> -name "<pattern>"` - Find files by name pattern
- `grep -r "<pattern>" <path>` - Search for pattern in files