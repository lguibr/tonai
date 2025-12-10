# TonAI

<img
  src="https://raw.githubusercontent.com/lguibr/tonai/main/public/logo.png"
  alt="logo"
  width="400"
/>

**Create music from text.**

[Live Demo](https://tonai.luisguilher.me)

TonAI is a simple web app that lets you create and visualize music using a chat interface. Just describe what you want to hear, and it plays it for you.

---

## ✨ Features

- **Integration with Google Gemini Models** — including Gemini 2.0 Flash Lite & Experimental.
- **Chat Interface** — with Edit / Delete / Regenerate / Branching history.
- **Streaming** — thoughts, outputs, and code stream in real-time.
- **Automatic Auto-Fix** — One-click fix for runtime audio errors.
- **Secure Client-Side** — Your API key never leaves your browser.
- **Export & Share** — Copy code, download .ts files, or record .webm audio snippets.
- **Full Code Editor** — TypeScript editor with Monaco (VS Code) engine and autocomplete.

---

## 🎹 Visual Showcase

**"Create music from text."**

1.  **Describe it**: "Make a retro lo-fi track..."
2.  **See it**: Watch the code and thoughts stream in.
3.  **Hear it**: Instant playback with Tone.js.
4.  **Feel it**: Glassmorphic visualizer reacting to every beat.

> **TonAI — Your music, generated.**

## 🚀 Quick Start Presets

Not sure what to type? Try one of these:

1.  **🔵 Cozy Lo-Fi Retro**: Relaxing 16-bit vibes.
2.  **🔴 Rhythmic Cyberpunk**: High-energy drums and bass.
3.  **🟡 Hard Rock Rockabilly**: Raw, slapback echo guitars.
4.  **🟢 Ambient Nature**: Gentle pads and atmosphere.

---

## 🏗️ Architecture

TonAI is built with:

- **Frontend**: React 18 + Vite.
- **Styling**: Tailwind CSS + shadcn/ui.
- **Audio Engine**: [Tone.js](https://tonejs.github.io/).
- **AI**: Google Gemini.

---

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+
- A Google Gemini API Key

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/yourusername/tonai.git
    cd tonai
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Start the development server:**

    ```bash
    npm run dev
    ```

4.  **Open the App:**
    Visit `http://localhost:5173` in your browser.

5.  **Configure API Key:**
    Click the **Settings** (gear icon) in the sidebar and enter your Gemini API Key.

---

## 🤝 Contributing

Contributions are welcome! Whether it's a new feature, a bug fix, or a documentation improvement, feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
