# TonAI

<img
  src="https://raw.githubusercontent.com/lguibr/tonai/main/public/logo.png"
  alt="logo"
  width="400"
/>

**The Context-Aware Generative Audio Workstation.**

TonAI is a cutting-edge web application that empowers you to create, refine, and visualize music and soundscapes using the power of **Generative AI** and **Tone.js**. Unlike standard chatbots, TonAI is **context-aware**—it references a vast internal library of audio engineering knowledge to write precise, high-quality audio code in real-time.

---

## ✨ Features

### 🧠 RAG-Powered Intelligence

TonAI doesn't just guess; it knows. Using **Retrieval Augmented Generation (RAG)**, the system consults a comprehensive knowledge base of:

- **Tone.js Technical Interfaces**: Exact parameter ranges and method signatures.
- **Compositional Heuristics**: Rules for genres like Techno, Ambient, and Rockabilly.
- **Safety Protocols**: Prevents ear-piercing feedback loops and volume spikes.

### 💭 Transparent Thinking Process

Watch the AI think. Before writing a single line of code, TonAI displays its **Thinking Process**, breaking down the user's request into musical parameters (BPM, Key, Instruments) and a step-by-step composition plan.

### 📚 Smart Source Citations

Trust but verify. Every generated track includes a **collapsible "Referenced Sources" section**, showing you exactly which documentation chunks the AI used to craft your sound.

### 🌊 Live Glassmorphic Visualizer

See your sound. The application features a stunning, **real-time frequency visualizer** built on a glassmorphic canvas, providing immediate visual feedback on the audio spectrum.

### ⚡ Real-Time Streaming

Experience zero latency. The AI streams its response token-by-token, allowing you to read the plan and see the code being written in real-time.

### 🎛️ Studio-Grade Controls

- **Playback**: Play, Pause, Stop, and Seek.
- **Mixing**: Master Volume control with logarithmic scaling.
- **Recording**: Capture your sessions as high-quality **WebM** audio files.
- **Library**: Save and load your favorite scripts using local **IndexedDB**.

---

## 🚀 Quick Start Presets

Jump right in with our curated genre presets:

1.  **🔵 Cozy Lo-Fi Retro**: Relaxing 16-bit vibes for coding.
2.  **🔴 Rhythmic Cyberpunk**: High-energy drums and marked bass.
3.  **🟡 Hard Rock Rockabilly**: Raw, rebellious, slapback echo guitars.
4.  **🟢 Ambient Nature**: Gentle pads and calming atmosphere.

---

## 🏗️ Architecture

TonAI is built with a modern, performance-focused stack:

- **Frontend**: React 18 + Vite (Lightning-fast performance).
- **Styling**: Tailwind CSS + shadcn/ui (Sleek, dark-mode aesthetic).
- **Audio Engine**: [Tone.js](https://tonejs.github.io/) (Web Audio API abstraction).
- **AI Orchestration**:
  - **LangChain**: For managing the RAG pipeline and chat history.
  - **Google Gemini**: The core LLM (Gemini 3 Pro / 2.5 Flash).
  - **Vector Store**: In-memory vector search for context retrieval.
- **Markdown Rendering**: `react-markdown` + `rehype-raw` for rich text and HTML support.

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
