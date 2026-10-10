# 🎓 CampusConnect — College Event Management System

CampusConnect is a web-based college event management platform designed to help students discover campus events, register for activities, and receive QR-code entry passes. It also provides administrative tools for managing college events.

🔗 **Live Website:** https://campus-connect-delta-one.vercel.app/  
🔗 **Backend API:** https://campusconnect-hraj.onrender.com/  
📦 **GitHub Repository:** https://github.com/abdullahkhan-ai/CampusConnect

---

## ✨ Features

### 🎉 Event Management
- Browse and explore college events.
- View event descriptions, dates, times, venues, and registration status.
- Create, edit, and delete events through Admin Mode.
- Search events by title, category, and venue.

### 🎟️ Student Registration
- Register for events without creating an account.
- Submit student details through the registration form.
- Generate a unique QR-code entry pass after successful registration.
- View registration and event details on the pass.

### 🔐 Admin Mode
- Protected admin access using an admin key.
- Manage event information.
- Control event registration status.

### 📢 Event Updates and Announcements
- Dedicated navigation for Event Updates and Announcements.
- Placeholder pages for future announcement publishing functionality.

### 🖼️ Photo Gallery
- Dedicated Photo Gallery navigation and placeholder page for future campus event photos.

### 📊 Dashboard
- View total events, registrations, and upcoming events.
- Explore recently added campus events.

---

## 🛠️ Tech Stack

**Frontend**
- React
- Vite
- JavaScript
- CSS
- Lucide React
- `qrcode.react`

**Backend**
- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JSON Web Token (JWT)
- Multer for image uploads

**Deployment**
- Vercel — Frontend
- Render — Backend
- MongoDB Atlas — Database

---

## 🏗️ Project Structure

```text
CampusConnect/
├── backend/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── uploads/
│   ├── server.js
│   ├── package.json
│   └── .env
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── index.html
├── .gitignore
└── README.md
```

---

## 🚀 Run Locally

### Prerequisites
- Node.js and npm
- Git
- MongoDB Atlas account

### 1. Clone the repository

```bash
git clone https://github.com/abdullahkhan-ai/CampusConnect.git
cd CampusConnect
```

### 2. Configure the backend

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` directory:

```env
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secret_at_least_32_characters_long
ADMIN_KEY=your_private_admin_key
PORT=5000
```

Use your own credentials. **Never commit your `.env` file or publish your secrets.**

Start the backend:

```bash
npm run dev
```

The backend should run at `http://localhost:5000`.

### 3. Configure the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Vite should display the local frontend URL, usually `http://localhost:5173`.

Ensure the frontend API configuration points to your local backend when developing locally, or to the deployed backend for production.

---

## 🌐 Deployment

- **Frontend:** [Vercel](https://vercel.com/)
- **Backend:** [Render](https://render.com/)
- **Database:** [MongoDB Atlas](https://www.mongodb.com/atlas)

Configure the production environment variables in Render and ensure the backend allows requests from the deployed Vercel domain.

---

## 🔒 Security Notes

- Keep MongoDB credentials, JWT secrets, and admin keys private.
- Do not commit `.env` files.
- Configure CORS for trusted frontend origins.
- Protect administrative operations on the backend.
- Use HTTPS for production deployments.

---

## 🗺️ Future Improvements

- Functional announcement publishing and management.
- Event-specific photo gallery with persistent image storage.
- Improved student registration management.
- Event check-in using QR passes.
- Enhanced event analytics and reporting.

---

## 👨‍💻 Author

**Abdullah Khan**

GitHub: [@abdullahkhan-ai](https://github.com/abdullahkhan-ai)

---

## 📄 License

This project is available for educational and portfolio purposes. Add a license file if you intend to specify formal reuse and distribution terms.
