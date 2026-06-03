# 🫀 CardioAI – Real-Time Patient Monitoring Platform

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-React-blue" />
  <img src="https://img.shields.io/badge/Backend-Node.js-green" />
  <img src="https://img.shields.io/badge/Database-MongoDB-success" />
  <img src="https://img.shields.io/badge/Deployment-Vercel%20%7C%20Render-black" />
  <img src="https://img.shields.io/badge/Status-Live-success" />
</p>

<p align="center">
  <strong>Real-Time Healthcare Monitoring System with Live Vitals, Risk Assessment, Alerts, and Analytics</strong>
</p>

---

## 🌐 Live Demo

🚀 **Frontend:** https://cardio-ai-vn4a.vercel.app

⚙️ **Backend API:** https://cardioai-1-tz52.onrender.com

---

## 📖 Overview

CardioAI is a full-stack healthcare monitoring platform that simulates a modern hospital patient monitoring environment.

The system enables healthcare professionals to:

✅ Monitor patients in real time

✅ Track heart rate, SpO₂, temperature, and blood pressure

✅ Receive critical alerts

✅ Assess patient risk levels

✅ Visualize historical health trends

✅ Manage patients through a secure dashboard

---

## ✨ Key Features

### 🔐 Authentication & Security

* JWT Authentication
* Secure Login & Registration
* Protected Routes
* Role-Based Access Control

### 👨‍⚕️ Patient Management

* Add/Edit Patients
* Search & Filter Patients
* View Detailed Patient Records
* Ward-Based Organization

### 📡 Real-Time Monitoring

* Live Vital Streaming
* Socket.IO Integration
* Instant Dashboard Updates
* Continuous Monitoring Simulation

### 🚨 Alert System

* Critical Condition Detection
* Warning Alerts
* Risk Classification
* Status Monitoring

### 📊 Analytics & Visualization

* Historical Vitals Charts
* Trend Analysis
* Patient Health Overview

### 📱 Responsive Design

* Mobile Optimized
* Tablet Support
* Desktop Dashboard
* Adaptive Navigation

---

## 🏗️ System Architecture

```text
                    ┌───────────────────┐
                    │     Frontend      │
                    │      React        │
                    │      Vercel       │
                    └─────────┬─────────┘
                              │
                              │ HTTPS / REST API
                              ▼
                    ┌───────────────────┐
                    │      Backend      │
                    │  Node + Express   │
                    │      Render       │
                    └─────────┬─────────┘
                              │
               ┌──────────────┴──────────────┐
               ▼                             ▼

      ┌─────────────────┐        ┌─────────────────┐
      │   MongoDB Atlas │        │   Socket.IO     │
      │   Database      │        │ Real-Time Layer │
      └─────────────────┘        └─────────────────┘
```

---

## ⚡ Real-Time Workflow

```text
Patient Simulator
       │
       ▼
Socket.IO Server
       │
       ▼
Connected Clients
       │
       ▼
Live Dashboard Updates
```

---

## 🛠️ Tech Stack

| Category                | Technologies                     |
| ----------------------- | -------------------------------- |
| Frontend                | React, Vite, Tailwind CSS, Axios |
| Backend                 | Node.js, Express.js              |
| Database                | MongoDB Atlas                    |
| Authentication          | JWT                              |
| Real-Time Communication | Socket.IO                        |
| Validation              | Joi                              |
| Deployment              | Vercel, Render                   |

---


## 🚀 Local Setup

### Clone Repository

```bash
git clone https://github.com/sanvi-nahar/CardioAI.git
cd CardioAI
```

### Backend Setup

```bash
cd backend
npm install
```

Create `.env`

```env
MONGO_URI=your_connection_string
JWT_SECRET=your_secret_key
FRONTEND_URL=http://localhost:5173
```

Run:

```bash
npm run dev
```

---

### Frontend Setup

```bash
cd frontend
npm install
```

Create `.env`

```env
VITE_API_BASE=http://localhost:5000/api
```

Run:

```bash
npm run dev
```

---

## 🎯 Future Enhancements

* AI-Based Risk Prediction
* Wearable Device Integration
* Doctor Notes & Reports
* Push Notifications
* Multi-Hospital Support
* Audit Logging

---

## 👨‍💻 Author

**Sanvi Nahar**

GitHub: https://github.com/sanvi-nahar

---

⭐ If you like this project, consider starring the repository.
