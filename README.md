# TonAI

<img
  src="https://raw.githubusercontent.com/lguibr/tonai/main/logo.png"
  alt="logo"
  width="400"
/>

**The Generative Audio Workstation.**

TonAI is a cutting-edge web application that empowers you to create, refine, and visualize music and soundscapes using the power of Generative AI and Tone.js. Describe a sound, and TonAI writes the code to play it in real-time.

## ✨ Features

- **Generative Audio Engine**: Powered by Google's Gemini 3 Pro (and other models), TonAI translates natural language prompts into executable Tone.js code.
- **Real-time Refinement**: Iterate on your sound. Ask TonAI to "make it faster," "add reverb," or "fix the rhythm," and watch the code update instantly.
- **Live Visualization**: See your sound with a responsive, real-time frequency visualizer.
- **Studio Controls**: Play, pause, stop, and control master volume with precision.
- **Recording Studio**: Capture your generative sessions and download them as high-quality WebM audio files.
- **Library Management**: Save your favorite scripts to your local library (IndexedDB) and load them anytime.
- **Code Export**: Download the generated JavaScript code to use in your own web projects.
- **Auto-Fix**: If the AI generates buggy code, the Auto-Fix feature detects the runtime error and asks the AI to repair it automatically.

## 🏗️ Architecture

TonAI is built with a modern, performance-focused stack:

- **Frontend**: React 18 + Vite for a lightning-fast development and user experience.
- **Styling**: Tailwind CSS + shadcn/ui for a sleek, dark-mode-first aesthetic.
- **Audio Engine**: [Tone.js](https://tonejs.github.io/) for Web Audio API abstraction and scheduling.
- **Intelligence**: Google Gemini API (via `langchain`) for code generation and reasoning.
- **Storage**: IndexedDB (via `idb`) for persisting your music library locally.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A Google Gemini API Key

### Installation

1.  Clone the repository:

    ```bash
    git clone https://github.com/yourusername/tonai.git
    cd tonai
    ```

2.  Install dependencies:

    ```bash
    npm install
    ```

3.  Start the development server:

    ```bash
    npm run dev
    ```

4.  Open `http://localhost:5173` in your browser.

5.  Click the **Settings** (gear icon) in the sidebar and enter your Gemini API Key.

## 🎹 Usage

1.  **Select a Model**: Choose your preferred AI model from the dropdown (e.g., Gemini 3 Pro).
2.  **Describe**: Type a prompt like _"A cyberpunk bassline with a fast hi-hat rhythm"_ and click **New**.
3.  **Listen & Visualize**: The code will auto-execute. Watch the visualizer react to the sound.
4.  **Refine**: Want changes? Type _"Add a delay effect"_ and click **Refine**.
5.  **Save**: Click the **Save** icon to store the track in your library.
6.  **Record**: Hit the **REC** button to record your session and download the audio.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
