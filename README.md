# PrintStock 📦

PrintStock is a stock management dashboard built to help manage inventory operations, track stock movements, and organize client and producer information in one place.

## Features

- **Dashboard:** View and manage stock-related information.
- **Purchase Management:** Handle stock purchase records.
- **Usage Tracking:** Track stock usage and inventory movements.
- **Client Management:** Manage client information.
- **Producer Management:** Organize producer information.
- **History Tracking:** Access records of previous stock activities.
- **Authentication:** User authentication with password hashing.
- **Role-Based Access:** Support for admin and worker roles.
- **Active User Management:** Track active user accounts.

## Tech Stack

**Frontend**
- React
- JavaScript
- CSS

**Backend**
- Node.js
- Express.js
- REST APIs

**Database**
- MongoDB Atlas
- Mongoose

**Authentication & Security**
- bcrypt for password hashing
- Role-based access control

## Project Structure

```text
PrintStock/
├── frontend/
│   ├── src/
│   └── package.json
├── backend/
│   ├── models/
│   ├── routes/
│   ├── controllers/
│   ├── middleware/
│   ├── server.js
│   └── package.json
└── README.md
```

*Note: The folder structure above is illustrative; adjust it to match the actual project.*

## Getting Started

### Prerequisites

- Node.js and npm
- MongoDB Atlas account or a compatible MongoDB instance
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/tejuu27/PrintStock.git
cd PrintStock
```

### 2. Set Up the Backend

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory and configure the environment variables required by the application, including the MongoDB connection string and authentication settings.

Start the backend:

```bash
node server.js
```

### 3. Set Up the Frontend

Open another terminal in the project root:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL displayed by Vite in your terminal.

## Environment Variables

Keep environment variables and credentials private. Never commit your `.env` file or database credentials to GitHub.

## Future Improvements

- Deploy the frontend and backend.
- Improve inventory analytics and reporting.
- Add more stock monitoring features.
- Enhance the dashboard experience.

## Author

**Tejushree M.**

GitHub: [@tejuu27](https://github.com/tejuu27)
