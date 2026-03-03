# Sweat-X 🏋️‍♂️

![Sweat-X Banner](https://img.shields.io/badge/Status-Active-brightgreen)
![React Native](https://img.shields.io/badge/React--Native-v0.81.5-blue)
![Expo](https://img.shields.io/badge/Expo-v54-black)
![Node.js](https://img.shields.io/badge/Node.js-v20-green)
![Gemini AI](https://img.shields.io/badge/Gemini-2.5--Flash-orange)

**Sweat-X** is a premium, AI-powered fitness and nutrition tracking app built with React Native and Expo. Designed with a sleek OLED-optimized aesthetic, it empowers users to take full control of their physical transformation through data-driven insights, customized training plans, and AI-powered food recognition.

---

## 🌟 Key Features

### 📊 Tactical Dashboard
- **Calorie & Macro Tracking**: Real-time visualization of Protein, Carbs, Fats, and Fiber
- **Hydration Monitor**: Track water intake with visual progress indicators
- **Motivational Core**: Rotating daily quotes and status badges

### 🏋️ Advanced Workout Engine
- **Custom Training Splits**: Push/Pull/Legs, Upper/Lower, and more
- **Session Tracking**: Live workout timer, rest intervals, and exercise history
- **Exercise Library**: Detailed instructions for a wide range of movements

### 🍎 Smart Nutrition Management
- **AI Food Scanner**: Snap a photo of any meal and get instant nutritional breakdown powered by **Gemini 2.5 Flash**
- **Auto-Grow Database**: Unknown foods are automatically identified by AI and saved to the database
- **Meal Logging**: Searchable database with Indian cuisine support
- **Custom Recipes**: Create and save multi-ingredient meals

### 🤖 CoreCoach AI
- **Instant Guidance**: Ask questions about exercise form, nutrition, or recovery
- **Progress Reviews**: Automated analysis with actionable feedback
- Powered by Google Gemini 2.5 Flash with 10-key rotation for high availability

### 🛡️ Admin Portal
- Restricted access for authorized administrators
- Real-time monitoring of user engagement and system health
- Collapsible active users panel with live status

---

## 🛠️ Tech Stack

### Frontend (App)
| Technology | Purpose |
|---|---|
| React Native + Expo | Cross-platform mobile framework |
| React Navigation v7 | Navigation & routing |
| React Context API | State management |
| Expo Image Picker | Camera & gallery for AI food scanning |
| Custom Theme System | OLED-optimized Dark/Light modes |

### Backend (Server) — [TrueFit-Server Repo](https://github.com/Ishan-Gupta1012/TrueFit-server)
| Technology | Purpose |
|---|---|
| Node.js + Express.js | REST API server |
| MongoDB + Mongoose | Database & ODM |
| Google Gemini 2.5 Flash | AI food recognition & text generation |
| Vercel Serverless | Cloud hosting with cached DB connections |
| bcryptjs | Secure password hashing |

---

## 📂 Project Structure

```text
├── assets/             # App icons, splash screens, hero images
├── src/                # React Native Frontend
│   ├── components/     # Reusable UI elements (Buttons, Cards, Modals)
│   ├── context/        # User and Theme contexts
│   ├── navigation/     # App Navigation configuration
│   ├── screens/        # Full-page screen components
│   ├── services/       # API abstraction layer
│   └── constants/      # Theme and spacing tokens
├── server/             # Node.js/Express Backend
│   ├── models/         # Mongoose Schemas (User, Workout, Food, etc.)
│   ├── routes/         # API Routes (Auth, Users, Admin, Foods, AI)
│   ├── services/       # AI service with Gemini integration
│   ├── utils/          # API key rotation utility
│   └── server.js       # Server entry point
├── App.js              # Root App component
├── app.json            # Expo configuration
└── eas.json            # EAS Build configuration
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Expo Go app on your mobile device
- MongoDB Atlas instance

### 1. Clone & Install
```bash
git clone https://github.com/Ishan-Gupta1012/Sweat-X.git
cd Sweat-X
npm install
```

### 2. Setup Environment
Create a `.env` file in the project root:
```env
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
```

### 3. Run Locally
```bash
npm start
# Scan the QR code with Expo Go
```

### 4. Backend Setup
The backend is deployed on **Vercel** at `https://true-fit-server-ten.vercel.app`. For local development:
```bash
cd server
npm install
# Create server/.env with MongoDB URI and Gemini API keys
npm run dev
```

---

## 📦 Build APK

```bash
eas build -p android --profile preview
```

---

## 🔑 Environment Variables (Backend - Vercel)

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `GEMINI_API_KEY` | Primary Gemini API key |
| `GEMINI_API_KEY_2` to `_10` | Additional keys for rate limit rotation |
| `RAPIDAPI_KEY` | RapidAPI key (optional) |

---

## 📜 License
This project is private and proprietary. All rights reserved.

---

*Built with passion by Ishan Gupta.*
