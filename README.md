# Stremini — implement

# AI Projects Ecosystem

Welcome to the **AI Projects Ecosystem** repository. This monorepo is a collection of diverse, full‑stack Artificial Intelligence applications targeting different industries: Fashion Tech (**STYFI‑AI**), EdTech/Scholarships (**Scholira‑AI**), and Desktop Automation (**Zz‑AI**). 

Each project is designed with a modern, edge‑first architecture, utilizing serverless backends, responsive web dashboards, and cross‑platform mobile or desktop applications.

## Table of Contents

- [Projects Overview](#projects-overview)
  - [1. STYFI‑AI (Fashion Tech)](#1-styfi-ai)
  - [2. Scholira‑AI (EdTech)](#2-scholira-ai)
  - [3. Zz‑AI (Desktop Agent)](#3-zz-ai)
- [Project Structure](#project-structure)
- [Technology Stack](#technology-stack)
- [Detailed Features](#detailed-features)
  - [STYFI‑AI Features](#styfi-ai-features)
  - [Scholira‑AI Features](#scholira-ai-features)
  - [Zz‑AI Features](#zz-ai-features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Running STYFI‑AI](#running-styfi-ai)
  - [Running Scholira‑AI](#running-scholira-ai)
  - [Running Zz‑AI](#running-zz-ai)
- [Contributing](#contributing)
- [License](#license)

## Projects Overview

### 1. STYFI‑AI
A next‑generation fashion and styling platform powered by AI. It acts as a digital wardrobe, personal stylist, and marketplace. Users can enhance images, compose outfits, detect fashion trends, and virtually try on clothes. It includes a comprehensive web platform, a mobile app, and a robust edge‑computed backend.

### 2. Scholira‑AI
An AI‑driven educational platform designed to connect students with scholarships and courses. Utilizing advanced RAG (Retrieval‑Augmented Generation) pipelines, it features an intelligent consultancy chatbot that accurately guides students through application processes, profile building, and scholarship discovery.

### 3. Zz‑AI
A desktop‑native AI automation tool. Designed as a standalone desktop software (via Electron), it acts as an intelligent browser agent capable of assisting users with automated tasks, browsing integrations, and local software workflows.

## Project Structure

```text
.
├── STYFI-AI/
│   ├── Backend/                 # Cloudflare Workers (Fashion Trends API, Image Enhancer API)
│   ├── StyfiWebsite-main/       # React + Vite Web Application
│   └── styfi-mobileapp/         # Flutter Mobile Application
│
├── Scholira-AI/
│   ├── Backend/                 # Cloudflare Workers (AI Consultancy, Courses, RAG pipeline)
│   ├── Scholira--Mobile-app/    # Flutter Mobile Application
│   └── Website Code/            # React + Vite Web Dashboard
│
└── Zz-AI/
    ├── Desktop Software/        # Electron‑based Desktop Application
    └── Zz-AI-backend/           # Cloudflare Worker backend for the desktop agent
```

## Technology Stack

### Frontend (Web & Desktop)

- **Web:** React, TypeScript, Vite, Tailwind CSS
- **Desktop (Zz‑AI):** Electron, HTML/JS

### State Management
- Zustand (used in Scholira‑AI)

### Mobile

- **Framework:** Flutter & Dart
- **Platforms:** iOS & Android cross‑platform builds

### Backend & AI

- **Infrastructure:** Cloudflare Workers (Serverless Edge Computing)
- **Deployment:** Wrangler
- **AI Models:** Gemini API integrations, RAG (Retrieval‑Augmented Generation) Vectorization
- **Runtime:** Node.js / JavaScript / TypeScript

## Detailed Features

### STYFI‑AI Features

- **Virtual Try‑On:** AI models that allow users to virtually visualize clothing items on themselves.
- **Outfit Composer:** Intelligently mix and match wardrobe items to generate stylish outfits.
- **Image Enhancer:** Backend APIs dedicated to upscaling and improving the quality of fashion photography.
- **Trend Detector:** Scrapes and analyzes data to provide users with real‑time fashion trends.
- **Marketplace & Seller Dashboard:** A fully integrated C2C/B2C marketplace for buying and selling fashion items.

### Scholira‑AI Features

- **RAG‑Powered AI Consultant:** A sophisticated chat interface (Scholira rag) that uses vectorized institutional data to answer specific scholarship and course queries.
- **Scholarship Finder:** Browse, filter, and track applications for global scholarships.
- **Course Integrations:** Discover educational courses tailored to the user's profile.
- **Student Dashboard:** Manage profiles, track application statuses, and chat with the AI assistant.

### Zz‑AI Features

- **Desktop Browser Agent:** A native application (`main.js`, `preload.js`) that safely interacts with web environments.
- **Edge Backend Integration:** Communicates with a lightweight Cloudflare Worker backend for prompt processing and orchestration.

## Getting Started

### Prerequisites

Ensure you have the following installed:

- Node.js (v18+)
- npm or yarn
- Flutter SDK (for mobile apps)
- Cloudflare Wrangler CLI (`npm install -g wrangler`)

### Running STYFI‑AI

#### 1. Web Application

```bash
cd "STYFI-AI/StyfiWebsite-main"
npm install
npm run dev
```

#### 2. Mobile Application

```bash
cd "STYFI-AI/styfi-mobileapp"
flutter pub get
flutter run
```

#### 3. Backend APIs (Cloudflare Workers)

```bash
cd "STYFI-AI/Backend/fashion-trends-api" # or image-enhancer-api
npm install
wrangler dev
```

### Running Scholira‑AI

#### 1. Web Dashboard

```bash
cd "Scholira-AI/Website Code"
npm install
# Ensure you copy .env.example to .env and add your Gemini API keys
npm run dev
```

#### 2. Mobile Application

```bash
cd "Scholira-AI/Scholira--Mobile-app"
flutter pub get
flutter run
```

#### 3. Backend & RAG Pipeline

```bash
cd "Scholira-AI/Backend/Scholira rag"
npm install
wrangler dev
```

### Running Zz‑AI

#### 1. Desktop Software

```bash
cd "Zz-AI/Desktop Software"
npm install
npm start
```

#### 2. Backend Worker

```bash
cd "Zz-AI/Zz-AI-backend"
wrangler dev
```

## Contributing

Fork the Project

Create your Feature Branch (git checkout -b feature/AmazingFeature)

Commit your Changes (git commit -m 'Add some AmazingFeature')

Push to the Branch (git push origin feature/AmazingFeature)

Open a Pull Request

## License

Distributed under the MIT License. See LICENSE for more information.
