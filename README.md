# SmartCampus - Facility Booking System

A full-stack application for managing campus facility bookings with QR code verification.

## 🚀 Quick Start

### Local Development

1. **Start Backend** (Spring Boot)
   ```powershell
   cd backend
   ./gradlew bootRun
   ```

2. **Start Frontend** (Vite + React)
   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

3. **Access Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8080
   - Login: Click Admin/Student/Technician (no password needed in dev mode)

### MongoDB Setup

**Local Development:**
- MongoDB should be running on `mongodb://localhost:27017`
- Database name: `SmartCampus`

## ☁️ Cloud Deployment

For step-by-step cloud deployment instructions (MongoDB Atlas, Railway, Vercel), see [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

### Prerequisites
- GitHub account
- MongoDB Atlas (free tier)
- Railway account (free tier)
- Vercel account (free tier)

### Quick Deployment Steps

1. **Set up MongoDB Atlas** - Get your cloud database connection string
2. **Push to GitHub** - Initialize Git and push your code
3. **Deploy Backend to Railway** - Connect GitHub repo, set environment variables
4. **Deploy Frontend to Vercel** - Connect GitHub repo, set API URL
5. **Test** - QR codes will work from anywhere in the world! 🌍

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed instructions.

## 📱 Features

- **Resource Management**: Browse and book campus facilities
- **QR Code Verification**: Check-in with QR codes on mobile
- **Booking System**: Create and manage bookings
- **Ticket System**: Submit maintenance tickets with image uploads
- **Notifications**: Get updates about bookings and tickets
- **Role-Based Access**: Admin, Student, and Technician roles

## 🛠️ Tech Stack

### Backend
- Java 17
- Spring Boot 4.0.3
- MongoDB
- Spring Security
- Gradle

### Frontend
- React
- Vite
- Tailwind CSS
- Axios
- QR Code Generator

## 📦 Project Structure

```
PAF project/
├── backend/              # Spring Boot backend
│   ├── src/
│   │   └── main/
│   │       ├── java/
│   │       └── resources/
│   ├── build.gradle
│   └── .env.example
├── frontend/            # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   └── api/
│   ├── package.json
│   └── .env.example
└── DEPLOYMENT_GUIDE.md  # Cloud deployment guide
```

## 🔑 Environment Variables

### Backend (.env or Railway variables)
```
MONGODB_URI=mongodb://localhost:27017/SmartCampus
PORT=8080
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env or Vercel variables)
```
VITE_API_URL=http://localhost:8080
```

## 🧪 Development Features

- **Dev Mode Authentication**: Quick login without passwords
- **Auto-seeding**: Sample data automatically loaded
- **CORS Configured**: Works on network (mobile testing)
- **Hot Reload**: Both frontend and backend support hot reload

## 📄 License

MIT License - feel free to use this project for learning or production.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📞 Support

For deployment help, see [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

---

**Made with ❤️ for SmartCampus**
