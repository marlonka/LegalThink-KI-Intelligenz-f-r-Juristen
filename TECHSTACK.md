# Tech Stack | LegalThink

This document outlines the core technologies and libraries used in the development of **LegalThink**, a specialized AI intelligence platform for legal professionals.

## 🏗️ Core Architecture
- **Framework:** [React 19](https://react.dev/) - Modern UI library with advanced hook support and concurrent rendering.
- **Language:** [TypeScript 5.8](https://www.typescriptlang.org/) - Strong typing for enhanced developer productivity and code reliability.
- **Build Tool:** [Vite 6](https://vitejs.dev/) - Next-generation frontend tooling for lightning-fast development and builds.

## 🧠 AI & Intelligence
- **AI Engine:** [Google Generative AI (@google/genai)](https://ai.google.dev/) - Integration with Gemini models for high-speed, accurate legal analysis and processing.
- **Markdown Processing:** 
  - `react-markdown` & `remark-gfm` - For rendering rich text and legal tables.
  - `marked` - High-performance markdown compiler.

## 🎨 UI & Design System
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework for rapid UI development and consistent design tokens.
  - *Utilities:* `tailwind-merge` & `clsx` for dynamic class management.
- **Animations:** [Framer Motion](https://www.framer.com/motion/) - Professional micro-interactions, spring animations, and layout transitions.
- **Icons:** [Lucide React](https://lucide.dev/) - Consistent, lightweight, and scalable vector icons.

## 📂 Project Structure
```text
LegalThink-KI-Intelligenz-f-r-Juristen/
├── components/          # Reusable UI components
│   ├── Layout/          # Navigation, Header, Footers
│   └── ...              # Domain-specific components
├── contexts/            # Global state management (Theme, Auth, App)
├── services/            # API and AI service integrations
├── views/               # Main page layouts and screens
├── types.ts             # Shared TypeScript interfaces
├── schemas.ts           # Data validation and structures
└── App.tsx              # Application entry point & Routing
```

## 🛠️ Development Tools
- **Environment:** Node.js
- **Package Manager:** npm
- **Linting & Formatting:** ESLint & Prettier (standard config)

---
*Last Updated: February 2026*
