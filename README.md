# 🔨 BuildConnect

> **Secure Client & Worker Management Platform**

BuildConnect is a full-stack MERN application that connects homeowners and clients with verified construction professionals and contractors. It streamlines hiring, project tracking, milestone escrow payments, and communication into a single, responsive platform.

---

## ✨ Features

- 🛡️ **Milestone Escrow Protection** – Secure payment milestones held in escrow, releasing funds only upon client inspection & approval.
- 💬 **Real-Time Communication** – Socket.io powered instant messaging between clients and workers with attachments and status updates.
- 📱 **Mobile-First Responsive Layout** – Adaptive interface featuring an app-style bottom navigation bar with role-based routing.
- 🔐 **Authentication & Security** – JWT authentication with cookie storage, OTP email verification, and Google Sign-In integration.
- 👷 **Dual Role Portals**:
  - **Client Portal**: Post projects, browse worker profiles, request site visits, review quotes, and approve milestones.
  - **Worker Portal**: Manage leads, submit itemized quotes, request milestone approvals, and set up payout accounts.
- ⚖️ **Contract Agreements & Verification**: Digital service agreements, KYC document verification, and dispute resolution workflows.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Socket.io-client, Axios, React Router v6
- **Backend**: Node.js, Express.js, MongoDB (Mongoose), Socket.io, JWT, Multer
- **Database**: MongoDB

---

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/GoutamKayala/BuildConnect.git
cd BuildConnect
```

### 2. Configure Backend
```bash
cd backend
npm install
cp .env.example .env
# Update .env with your MongoDB URI and JWT secrets
npm run dev
```

### 3. Configure Frontend
```bash
cd ../frontend
npm install
cp .env.example .env
npm run dev
```

The application will be running at:
- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`

---

## 📄 License
This project is licensed under the MIT License.
