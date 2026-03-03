# Sweat-X (TrueFit) 🚀

![Sweat-X Banner](https://img.shields.io/badge/Status-Active-brightgreen)
![React Native](https://img.shields.io/badge/React--Native-v0.81.5-blue)
![Expo](https://img.shields.io/badge/Expo-v54-black)
![Node.js](https://img.shields.io/badge/Node.js-v20-green)

**Sweat-X** (internally known as **TrueFit**) is a premium, high-performance fitness and nutrition tracking ecosystem. Designed with a sleek "Tactical" aesthetic, it empowers users to take full control of their physical transformation through data-driven insights, customized training plans, and AI-powered guidance.

---

## 🌟 Key Features

### 📊 Tactical Dashboard
A central command center for your daily progress.
- **Calorie & Macro Tracking**: Real-time visualization of Protein, Carbs, Fats, and Fiber.
- **Hydration Monitor**: Track water intake with a tactical progress bar.
- **Motivational Core**: Rotating daily quotes and status badges to keep you disciplined.

### 🏋️ Advanced Workout Engine
Precision tracking for every rep and set.
- **Custom Training Splits**: Support for various splits (Push/Pull/Legs, Upper/Lower, etc.).
- **Session Tracking**: Live workout timer, rest intervals, and exercise history.
- **Exercise Library**: Detailed instructions and tracking for a wide range of movements.

### 🍎 Smart Nutrition Management
Comprehensive tools for dietary control.
- **Meal Logging**: Searchable database and history for quick logging.
- **Custom Recipes**: Create and save your own multi-ingredient meals.
- **Nutrition Analytics**: Deep dives into your daily and weekly consumption trends.

### 🤖 CoreCoach AI
Your personal fitness strategist, powered by industry-leading AI models.
- **Instant Guidance**: Ask questions about exercise form, nutrition stats, or recovery.
- **Progress Reviews**: Automated analysis of your logged data to provide actionable feedback.

### 🛡️ Admin Portal
A secure interface for platform management.
- Restricted access for authorized administrators.
- Monitoring of user engagement and system health.

---

## 🛠️ Tech Stack

### Frontend (App)
- **Framework**: [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/)
- **Navigation**: [React Navigation v7](https://reactnavigation.org/)
- **State Management**: React Context API
- **Theming**: Custom Theme System (High-contrast Dark/Light modes)
- **UI Components**: Custom-built premium tactical components

### Backend (Server)
- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)
- **Authentication**: JWT-based secure auth with bcrypt hashing

---

## 📂 Project Structure

```text
├── server/             # Node.js/Express Backend
│   ├── models/         # Mongoose Schemas (User, Workout, Meal, etc.)
│   ├── routes/         # API Routes (Auth, Users, Admin, Workouts)
│   ├── services/       # External integrations
│   └── server.js       # Server entry point
├── src/                # React Native Frontend
│   ├── components/     # Reusable UI elements (Buttons, Cards, Modals)
│   ├── context/        # User and Theme contexts
│   ├── navigation/     # App Navigation configuration
│   ├── screens/        # Full-page screen components
│   ├── services/       # API abstraction layer
│   └── constants/      # Theme and spacing tokens
├── App.js              # Root App component
└── app.json            # Expo configuration
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Expo Go app on your mobile device (for local testing)
- MongoDB instance (Local or Atlas)

### 1. Clone the Repositories
```bash
git clone https://github.com/Ishan-Gupta1012/Sweat-X.git
# Note: Backend code is also mirrored in TrueFit-server
```

### 2. Setup Backend
```bash
cd server
npm install
# Create a .env file with:
# PORT=3001
# MONGO_URI=your_mongodb_connection_string
# JWT_SECRET=your_secret
npm run dev
```

### 3. Setup Frontend
```bash
cd ..
npm install
# Update API URL in src/services/api.js to your local IP
npm start
```

---

## 🛠️ Deployment & Builds
The project uses **EAS (Expo Application Services)** for building production-ready APKs and IPAs.

**Build Command:**
```bash
eas build -p android --profile preview
```

---

## 📜 License
This project is private and proprietary. All rights reserved.

---
*Built with passion by Ishan Gupta.*
