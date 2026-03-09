# Backend API - Citizen Appeal Management System

This is the backend server for the Citizen Appeal Management System, built with Node.js, Express, and MongoDB.

## 📋 Prerequisites

Before you begin, make sure you have the following installed on your computer:

1. **Node.js** (version 14 or higher)
   - Download from: https://nodejs.org/
   - To check if installed: Open terminal/command prompt and type `node --version`

2. **MongoDB** (version 4.4 or higher)
   - **Option 1: Local MongoDB** - Download from: https://www.mongodb.com/try/download/community
   - **Option 2: MongoDB Atlas** (Cloud - Free) - Sign up at: https://www.mongodb.com/cloud/atlas
   - To check if installed: Open terminal and type `mongod --version`

3. **npm** (comes with Node.js)
   - To check if installed: Type `npm --version`

## 🚀 Installation Steps

### Step 1: Navigate to the server folder

Open your terminal/command prompt and navigate to the server directory:

```bash
cd server
```

### Step 2: Install dependencies

Install all required packages:

```bash
npm install
```

This will install:
- express (web framework)
- mongoose (MongoDB driver)
- bcryptjs (password hashing)
- jsonwebtoken (JWT authentication)
- dotenv (environment variables)
- cors (cross-origin resource sharing)
- multer (file uploads)

### Step 3: Set up environment variables

1. Copy the example environment file:
   ```bash
   copy .env.example .env
   ```
   (On Mac/Linux, use: `cp .env.example .env`)

2. Open the `.env` file and update the following:

   **For Local MongoDB:**
   ```
   MONGO_URI=mongodb://localhost:27017/citizen-appeal-system
   ```

   **For MongoDB Atlas (Cloud):**
   ```
   MONGO_URI=mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/citizen-appeal-system?retryWrites=true&w=majority
   ```

   **Important:** Change `JWT_SECRET` to a random string (e.g., `my-super-secret-key-12345`)

### Step 4: Create uploads folder

Create a folder for file uploads:

```bash
mkdir uploads
```

## 🏃 How to Run the Backend

### Step 1: Start MongoDB (if using local MongoDB)

**Windows:**
```bash
mongod
```

**Mac/Linux:**
```bash
sudo systemctl start mongod
# OR
mongod
```

**Note:** If using MongoDB Atlas (cloud), you can skip this step.

### Step 2: Start the server

**Development mode (with auto-restart):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

You should see:
```
MongoDB Connected: localhost:27017
Server running in development mode on port 5000
```

### Step 3: Test the server

Open your browser or use Postman and visit:
```
http://localhost:5000/api/health
```

You should see:
```json
{
  "success": true,
  "message": "Server is running"
}
```

## 📡 API Endpoints

### Authentication Routes

#### Register User
- **POST** `/api/auth/register`
- **Body:**
  ```json
  {
    "fullName": "John Doe",
    "nicNumber": "123456789V",
    "drivingLicense": "DL123456",
    "email": "john@example.com",
    "mobileNumber": "0771234567",
    "password": "password123"
  }
  ```

#### Login User
- **POST** `/api/auth/login`
- **Body:**
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **Response:** Returns a JWT token

#### Get Current User
- **GET** `/api/auth/me`
- **Headers:** `Authorization: Bearer <token>`

### Appeal Routes

#### Create Appeal
- **POST** `/api/appeals`
- **Headers:** `Authorization: Bearer <token>`
- **Body (form-data):**
  - `violationId`: String
  - `appealReason`: String (incorrect-speed-limit, wrong-vehicle, emergency-situation, technical-error, other)
  - `description`: String
  - `evidence`: File (optional - image or PDF)

#### Get My Appeals
- **GET** `/api/appeals`
- **Headers:** `Authorization: Bearer <token>`

#### Get Single Appeal
- **GET** `/api/appeals/:id`
- **Headers:** `Authorization: Bearer <token>`

#### Get All Appeals (Admin Only)
- **GET** `/api/appeals/admin/all`
- **Headers:** `Authorization: Bearer <token>`

#### Update Appeal Status (Admin Only)
- **PUT** `/api/appeals/:id/status`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
  ```json
  {
    "status": "approved",
    "adminNotes": "Appeal approved based on evidence"
  }
  ```

## 📁 Project Structure

```
server/
├── config/
│   └── db.js              # Database connection
├── controllers/
│   ├── authController.js  # Authentication logic
│   └── appealController.js # Appeal logic
├── middleware/
│   └── auth.js          # Authentication middleware
├── models/
│   ├── User.js           # User model
│   └── Appeal.js         # Appeal model
├── routes/
│   ├── authRoutes.js     # Authentication routes
│   └── appealRoutes.js   # Appeal routes
├── uploads/              # Uploaded files (created automatically)
├── .env                  # Environment variables (create from .env.example)
├── .env.example          # Example environment variables
├── .gitignore           # Git ignore file
├── package.json         # Dependencies
├── server.js            # Main server file
└── README.md           # This file
```

## 🔧 Troubleshooting

### MongoDB Connection Error
- Make sure MongoDB is running (if using local)
- Check your `MONGO_URI` in `.env` file
- For MongoDB Atlas, make sure your IP is whitelisted

### Port Already in Use
- Change `PORT` in `.env` file to a different number (e.g., 5001)

### Module Not Found Error
- Run `npm install` again in the server folder

### File Upload Error
- Make sure the `uploads/` folder exists
- Check file size (max 5MB)

## 🔐 Security Notes

- Never commit `.env` file to git
- Change `JWT_SECRET` to a strong random string in production
- Use environment variables for sensitive data
- In production, use HTTPS

## 📝 Next Steps

1. Connect your React frontend to this backend
2. Update frontend API calls to use `http://localhost:5000/api/...`
3. Store JWT token in localStorage or cookies
4. Add token to Authorization header in API requests

## 💡 Tips

- Use **Postman** or **Thunder Client** (VS Code extension) to test APIs
- Check server console for error messages
- Use `npm run dev` for development (auto-restarts on file changes)

