# TonAI Project Improvement Proposal

This document outlines two proposed improvements to enhance the scalability, stability, and maintainability of the TonAI application.

## 1. Architecture Refactor: State Management & Decoupling

### Problem

The current `App.tsx` file has grown to over 700 lines, taking on multiple responsibilities including:

- **UI Layout**: Managing the complex panel resizing and responsive design.
- **State Management**: Handling chat history, audio playback state, user settings, and temporary variables.
- **Business Logic**: Integrating directly with `GeminiService`, `AudioEngine`, and other utilities.

This "God Component" pattern makes the application difficult to test, debug, and extend. Any change to the audio logic risks breaking the UI, and vice versa.

### Proposal

Migrate the application state to a lightweight state management library like **Zustand** or use strictly typed **React Contexts** with custom hooks.

**Key Changes:**

1.  **Create a `useStore` (Zustand) or `AudioContext`**: Move `playState`, `currentTime`, `isRecording`, and `volume` into a dedicated store.
2.  **Extract `useChat` Hook**: Encapsulate all chat-related logic (sending messages, integrating with RAG, handling streams) into `hooks/useChat.ts`.
3.  **Modularize `App.tsx`**: The main component should only handle the high-level layout. Child components like `ChatPanel`, `EditorPanel`, and `VisualizerPanel` should connect to the store independently.

**Benefits:**

- **Maintainability**: Smaller, focused files are easier to understand.
- **Performance**: Components only re-render when their specific slice of state changes, reducing unnecessary renders in the heavy `App` component.
- **Testability**: Logic extracted into hooks/stores can be unit tested without mounting the entire React tree.

---

## 2. Advanced Code Validation & AST Sanitization

### Problem

The application currently executes AI-generated code directly in the user's browser. While convenient, this poses significant risks:

- **Infinite Loops**: A simple `while(true)` loop in the generated code will freeze the entire browser tab, forcing the user to reload the page and potentially lose progress.
- **Security Check**: Although client-side execution is generally sandboxed by the browser, we want to prevent malicious usage or accidental access to global objects we don't want exposed.

### Proposal

Implement a pre-execution validation step using an AST (Abstract Syntax Tree) parser (e.g., typically via `acorn` or `babel-parser`).

**Key Features:**

1.  **Loop Protection**: Automatically inject "watchdog" counters into `for`, `while`, and `do-while` loops. If a loop exceeds a certain execution time or iteration count, it throws an error to break the cycle, keeping the UI responsive.
2.  **Safety Linting**: Analyze the code for forbidden globals or potentially harmful patterns before passing it to the execution engine.
3.  **Graceful Recovery**: Enhance the `try-catch` block around `eval/Function` to provide more user-friendly error messages that can be fed back into the AI for auto-correction (building on the current "Auto Fix" feature).

**Benefits:**

- **Stability**: Prevents the application from crashing/freezing due to bad AI code.
- **User Trust**: Users can experiment with complex generation prompts without fear of losing their work.
- **AI Feedback Loop**: Better runtime error analysis allows for more precise self-correction prompts to the Gemini model.
