# Table & Tale – Restaurant Management System

A full‑stack, Vite‑powered SPA that lets customers explore the menu, place orders, and make reservations. It ships with a **C++ engine fallback** for fast table‑allocation logic, but gracefully degrades to a pure‑Node implementation when a compiler is unavailable (Windows, Netlify builds, etc.). The project is pre‑configured for **Netlify** continuous deployment and includes a robust CI workflow.

---

## 🎯 Features
- Responsive UI built with React 19, TailwindCSS 4, and Motion animations.
- Server‑side API (Express) with security hardening – Helmet, CSP header, and input validation.
- Native C++ engine (`cpp/engine.cpp`) with automatic build detection & fallback.
- Full TypeScript type safety across client and server.
- Unit & integration tests with Jest/TSX.
- CI pipeline (GitHub Actions) that runs lint, tests, and builds on Node 20/22/24.
- One‑click Netlify deployment (`netlify.toml`).
- Dockerfile for local container development (optional).

---

## 📦 Prerequisites
- **Node.js** ≥ 20 (LTS) – recommended 24 (see `netlify.toml`).
- **npm** (or pnpm) for package management.
- **Git** for version control.
- Optional: **g++** (for building the native C++ engine on Linux/macOS). Windows users can rely on the fallback.

---

## 🛠️ Installation & Development
```bash
# Clone the repo (already done) and cd into the folder
cd "c:\Users\ZUBAIR MEHMOOD\Downloads\table-&-tale-—-restaurant-management-system"

# Install dependencies
npm install

# Create a .env file (copy from .env.example) and add any required keys
cp .env.example .env
# e.g., GEMINI_API_KEY=your‑key   (if you use Gemini AI features)

# Run the development server (Vite + hot‑reload)
npm run dev
```
Open **http://localhost:5173** in your browser.

### Build for Production
```bash
npm run build   # creates ./dist for the client and bundles the server (server.js)
```
The built assets can be served directly with the Node server (`npm start`) or deployed to Netlify.

---

## 📦 Deploy to Netlify (recommended)
1. Install the Netlify CLI (once): `npm i -g netlify-cli`.
2. Link the project: `netlify init` – choose *Create & configure a new site*.
3. Deploy a draft preview: `netlify deploy --dir=dist`.
4. Deploy to production: `netlify deploy --prod --dir=dist`.

Netlify will read the `netlify.toml` configuration, run `npm run build`, and expose a public URL like `https://<site‑name>.netlify.app`.

---

## ✅ Testing
```bash
npm test    # runs Jest/TSX tests located in /tests
```
All tests pass on Windows, macOS, and Linux CI runners.

---

## 🔐 Security & Hardening
- **Helmet** middleware added (`server/app.ts`).
- **Content‑Security‑Policy** header injected in production mode (`server.ts`).
- Dependencies are kept up‑to‑date; `npm audit` reports **0 vulnerabilities**.
- Native engine builds are sandboxed; if `g++` is missing, the app falls back safely.

---

## 📈 Continuous Integration
The repository includes a GitHub Actions workflow (`.github/workflows/ci.yml`) that runs on pushes and pull requests:
- Lint (`npm run lint`)
- Tests (`npm test`)
- Build (`npm run build`)
- Deploy preview to Netlify (optional, via Netlify Action).

---

## 🤝 Contributing
1. Fork the repository.
2. Create a feature branch (`git checkout -b feat/awesome‑feature`).
3. Make your changes, run tests, and ensure the CI passes.
4. Open a Pull Request.

Please follow the existing code style (Prettier + ESLint) and update documentation as needed.

---

## 📄 License
This project is licensed under the **MIT License** – see the `LICENSE` file for details.

---

## 📞 Support
For questions or issues, open an issue on GitHub or contact the maintainer at `ZubairMehmood059`.
