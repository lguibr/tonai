import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import {
  Code2,
  AlertCircle,
  FileDown,
  Save,
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  Copy,
  FileText,
  GripVertical,
  GripHorizontal,
} from 'lucide-react';
import * as Tone from 'tone';
import * as Dialog from '@radix-ui/react-dialog';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { cn } from '@/lib/utils';
import { useMediaQuery } from './hooks/use-media-query';
import AudioVisualizer from './components/AudioVisualizer';

import {
  generateMusicCode,
  refineMusicCode,
  chatWithAI,
  streamChatWithAI,
  getApiKey,
  setApiKey as saveApiKey,
  DEFAULT_MODEL,
} from './services/geminiService';
import {
  executeCode,
  stopTransport,
  forceStop,
  startTransport,
  initializeAudio,
  setMasterVolume,
  startRecording,
  stopRecording,
} from './utils/audioEngine';
import Controls from './components/Controls';
import ChatInterface from './components/ChatInterface';
import { PlayState, GenerationState, Message } from './types';
import ApiKeyDialog from './components/ApiKeyDialog';
import LibraryDialog from './components/LibraryDialog';
import { Button } from '@/components/ui/button';
import CodeEditor from './components/CodeEditor';
import initialMusic from './initialMusic';
import Navbar from './components/Navbar';
// Default starter code
const DEFAULT_CODE = initialMusic;

const TonAIApp: React.FC = () => {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [playState, setPlayState] = useState<PlayState>(PlayState.STOPPED);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [apiKeyOpen, setApiKeyOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryMode, setLibraryMode] = useState<'save' | 'load'>('load');
  const [selectedModel, setSelectedModel] = useState(() => {
    return localStorage.getItem('tonai_selected_model') || DEFAULT_MODEL;
  });

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    localStorage.setItem('tonai_selected_model', model);
  };

  // New State for Layout/UI
  const [apiKey, setApiKey] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isTablet = useMediaQuery('(min-width: 768px)');

  const isPlaying = playState === PlayState.PLAYING;

  useEffect(() => {
    // Check for API Key on load
    const key = getApiKey();
    if (key) {
      setApiKey(key);
    } else {
      const timer = setTimeout(() => setApiKeyOpen(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(Tone.Transport.seconds);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleSendMessage = async (text: string) => {
    if (!getApiKey()) {
      setApiKeyOpen(true);
      return;
    }

    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setIsLoading(true);
    setError(null);

    try {
      // Convert internal messages to service format
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      history.push({ role: 'user', content: text });

      // Create a placeholder message for the AI response
      const aiMsgId = (Date.now() + 1).toString();
      const newAiMsg: Message = {
        id: aiMsgId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, newAiMsg]);

      let fullContent = '';
      const stream = streamChatWithAI(history, code, selectedModel);

      for await (const chunk of stream) {
        fullContent += chunk;
        setMessages((prev) =>
          prev.map((m) => (m.id === aiMsgId ? { ...m, content: fullContent } : m))
        );

        // Real-time code extraction
        // Look for the start of a code block and capture everything until the end or current position
        const codeStartMatch = fullContent.match(/```(?:javascript|typescript)?\s*/);
        if (codeStartMatch && codeStartMatch.index !== undefined) {
          const startIndex = codeStartMatch.index + codeStartMatch[0].length;
          // Check if there is an end block
          const endMatch = fullContent.substr(startIndex).match(/```/);
          let extractedCode = '';

          if (endMatch && endMatch.index !== undefined) {
            // Complete block found
            extractedCode = fullContent.substr(startIndex, endMatch.index);
          } else {
            // Partial block - take everything so far
            extractedCode = fullContent.substr(startIndex);
          }

          if (extractedCode.trim().length > 10) {
            // arbitrary threshold to avoid noise
            let finalCode = extractedCode
              .replace(/```javascript/g, '')
              .replace(/```typescript/g, '')
              .replace(/```/g, '') // Extra cleanup just in case
              .trim();

            if (
              !finalCode.startsWith("import * as Tone from 'tone';") &&
              finalCode.includes('Tone.')
            ) {
              finalCode = `import * as Tone from 'tone';\n\n${finalCode}`;
            }

            // Only update if it looks like valid code (basic heuristic) and is different
            if (finalCode !== code) {
              setCode(finalCode);
            }
          }
        }
      }

      // Final Post-processing: Ensure we got the final clean code

      const codeMatch = fullContent.match(/```(?:javascript|typescript)?\s*([\s\S]*?)\s*```/);
      if (codeMatch) {
        const extractedCode = codeMatch[1]
          .replace(/```javascript/g, '')
          .replace(/```typescript/g, '')
          .replace(/```/g, '')
          .trim();

        let finalCode = extractedCode;
        if (!finalCode.startsWith("import * as Tone from 'tone';")) {
          finalCode = `import * as Tone from 'tone';\n\n${finalCode}`;
        }

        setCode(finalCode);

        // Optional: Clean up the chat message to hide the big code block
        const cleanText = fullContent.replace(
          /```(?:javascript|typescript)?\s*([\s\S]*?)\s*```/,
          '[Code updated in Editor]'
        );
        setMessages((prev) =>
          prev.map((m) => (m.id === aiMsgId ? { ...m, content: cleanText } : m))
        );
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message);
      const errorMsg: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: `Error: ${e.message}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlay = async () => {
    setError(null);
    try {
      await initializeAudio();

      if (playState === PlayState.PAUSED) {
        startTransport();
      } else {
        await executeCode(code);
      }
      setPlayState(PlayState.PLAYING);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Runtime Error in Code');
      setPlayState(PlayState.STOPPED);
      forceStop();
    }
  };

  const handlePause = () => {
    Tone.Transport.pause();
    setPlayState(PlayState.PAUSED);
  };

  const handleStop = () => {
    forceStop();
    setPlayState(PlayState.STOPPED);
    setIsRecording(false); // Stop recording if stopping playback
    setCurrentTime(0);
  };

  const handleVolumeChange = (val: number) => {
    setMasterVolume(val);
  };

  const handleToggleRecord = async () => {
    if (!isRecording) {
      // 1. Stop music going for initial state
      handleStop();

      // 2. Start recording
      await initializeAudio(); // Ensure context
      startRecording();
      setIsRecording(true);

      // 3. Execute the music from the start
      // Small delay to ensure recorder is ready
      setTimeout(() => {
        handlePlay();
      }, 100);
    } else {
      // 4. When user click on stop recording, the music will be paused
      handlePause();

      // 5. We will wait .5 seconds after the pause still recording
      setTimeout(async () => {
        // 6. We will finish the recording state and give the downloadable file for the user
        const blob = await stopRecording();
        setIsRecording(false);

        // Stop transport completely now that we're done
        handleStop();

        if (blob) {
          const url = URL.createObjectURL(blob);
          const anchor = document.createElement('a');
          anchor.download = `tonai-recording-${Date.now()}.webm`;
          anchor.href = url;
          anchor.click();
          URL.revokeObjectURL(url);
        }
      }, 500);
    }
  };

  const downloadCode = () => {
    const fileContent = `/**
 * Generated by TonAI
 * Chat Session
 */

${code}`;
    const blob = new Blob([fileContent], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'tonai.js';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleAutoFix = () => {
    const fixMsg = error
      ? `The code crashed with this error: "${error}". Please fix the code.`
      : 'The code crashed with a runtime error. Please fix it.';
    handleSendMessage(fixMsg);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlayback = async () => {
    if (isPlaying) {
      handlePause();
    } else {
      handlePlay();
    }
  };

  const handleSaveApiKey = () => {
    saveApiKey(apiKey);
    setApiKeyOpen(false);
  };

  const openLibrary = (mode: 'save' | 'load') => {
    setLibraryMode(mode);
    setLibraryOpen(true);
  };

  const handleEditMessage = (id: string, newContent: string) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, content: newContent } : msg))
    );
  };

  const handleDeleteMessage = (id: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
  };

  const handleRerun = async (id: string) => {
    const msgIndex = messages.findIndex((msg) => msg.id === id);
    if (msgIndex === -1) return;

    const targetMsg = messages[msgIndex];

    // If rerunning a user message: Keep it, remove everything after, trigger AI
    // If rerunning an AI message: Remove it, remove everything after, trigger AI

    const newHistory = messages.slice(0, msgIndex);
    let messageToProcess = '';

    if (targetMsg.role === 'user') {
      newHistory.push(targetMsg); // Keep the user message
      messageToProcess = targetMsg.content;
    } else {
      // For AI message, we need the *previous* user message to trigger generation
      const lastUserMsg = newHistory[newHistory.length - 1];
      if (lastUserMsg && lastUserMsg.role === 'user') {
        messageToProcess = lastUserMsg.content;
      } else {
        // Edge case: AI message without preceding user message? Should not happen in this flow.
        return;
      }
    }

    setMessages(newHistory);
    setIsLoading(true);
    setError(null);

    // Trigger AI generation
    // We need to reuse the logic from handleSendMessage but adapted for history
    // Ideally refactor handleSendMessage to separate "add user msg" from "call AI"
    // For now, I'll duplicate the AI call logic or call a shared function if I extract it.
    // Let's extract the core AI call logic.

    // Actually, handleSendMessage takes text.
    // I can just call streamChatWithAI directly here.

    try {
      const aiMsgId = Date.now().toString();
      const aiMsg: Message = {
        id: aiMsgId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, aiMsg]);

      let fullContent = '';
      const stream = streamChatWithAI(
        newHistory.map((m) => ({ role: m.role, content: m.content })),
        code,
        selectedModel
      );

      for await (const chunk of stream) {
        fullContent += chunk;
        setMessages((prev) =>
          prev.map((m) => (m.id === aiMsgId ? { ...m, content: fullContent } : m))
        );
      }

      // Extract code from the final content
      const codeMatch = fullContent.match(/```(?:javascript|typescript)?\s*([\s\S]*?)\s*```/);
      if (codeMatch) {
        const extractedCode = codeMatch[1];
        // Clean up the code (remove markdown, ensure imports)
        // We can reuse the cleanCode logic from geminiService if we export it,
        // or just trust the editor to handle it or simple cleanup here.
        // geminiService's cleanCode is not exported. Let's do a simple cleanup or rely on user to see it.
        // The previous logic in handleSendMessage used `chatWithAI` which returned code separately.
        // `streamChatWithAI` yields text.
        // We should probably update the editor with the code found.

        let cleanCode = extractedCode.trim();
        if (!cleanCode.startsWith("import * as Tone from 'tone';")) {
          cleanCode = `import * as Tone from 'tone';\n\n${cleanCode}`;
        }
        setCode(cleanCode);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to generate response');
      setMessages((prev) => prev.filter((m) => m.id !== Date.now().toString())); // Remove failed AI msg if possible, but ID is lost.
      // Actually we should remove the last message if it's empty or error?
      // For now just showing error is fine.
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-purple-500/30 overflow-hidden">
      <Navbar onSettingsClick={() => setApiKeyOpen(true)} />

      <div className="flex-1 flex overflow-hidden">
        <PanelGroup direction={isTablet ? 'horizontal' : 'vertical'}>
          {/* Left Sidebar (Chat) */}
          <Panel
            id="chat-panel"
            order={1}
            defaultSize={isDesktop ? 33 : 50}
            minSize={20}
            className="flex flex-col border-r border-zinc-800 bg-zinc-950"
          >
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              onStop={() => setIsLoading(false)}
              isLoading={isLoading}
              error={error}
              onQuickFix={handleAutoFix}
              onEdit={handleEditMessage}
              onDelete={handleDeleteMessage}
              onRerun={handleRerun}
              selectedModel={selectedModel}
              onModelChange={handleModelChange}
            />
          </Panel>

          {code.trim() && (
            <>
              <PanelResizeHandle
                className={cn(
                  'bg-zinc-800 hover:bg-purple-600 transition-colors flex items-center justify-center z-50',
                  isTablet ? 'w-1 cursor-col-resize' : 'h-1 cursor-row-resize'
                )}
              >
                <div className={cn('bg-zinc-600 rounded-full', isTablet ? 'h-8 w-1' : 'w-8 h-1')} />
              </PanelResizeHandle>

              {/* Right Main Area: Editor & Viz - Auto-calculated remaining space */}
              <Panel id="editor-panel" order={2} minSize={20}>
                <div className="flex flex-col h-full overflow-hidden bg-[#1e1e1e]">
                  {/* Code Editor Section */}
                  <div className="flex-1 relative bg-[#1e1e1e] flex flex-col min-h-0">
                    <div className="h-10 bg-[#1e1e1e] border-b border-[#2d2d2d] flex items-center justify-between px-4 shrink-0">
                      <div className="text-xs text-zinc-400 font-mono flex items-center gap-2">
                        <span className="text-purple-400">{'</>'}</span>
                        SCRIPT EDITOR (TS)
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigator.clipboard.writeText(code)}
                          className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-white transition-colors"
                          title="Copy Code"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          onClick={() => {
                            const blob = new Blob([code], { type: 'text/typescript' });
                            const url = URL.createObjectURL(blob);
                            const anchor = document.createElement('a');
                            anchor.href = url;
                            anchor.download = 'tonai-script.ts';
                            anchor.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-white transition-colors"
                          title="Download Script (.ts)"
                        >
                          <FileText size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 relative overflow-hidden">
                      <CodeEditor
                        value={code}
                        onChange={(val) => setCode(val || '')}
                        className="h-full pt-9"
                        isLoading={isLoading}
                      />
                    </div>
                  </div>

                  {/* Visualization / Controls Area (Bottom) */}
                  <div className="h-24 relative shrink-0 z-20 overflow-hidden">
                    {/* Visualizer Background */}
                    <div className="absolute inset-0 z-0">
                      <AudioVisualizer className="w-full h-full opacity-50" />
                    </div>

                    {/* Glassmorphic Overlay */}
                    <div className="absolute inset-0 z-10 bg-black/40 backdrop-blur-md border-t border-white/10" />

                    {/* Controls Content */}
                    <div className="relative z-20 h-full flex items-center px-6 gap-6">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={togglePlayback}
                          disabled={isLoading && !isPlaying}
                          className={cn(
                            'w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg backdrop-blur-sm',
                            isLoading && !isPlaying
                              ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-700'
                              : 'hover:scale-105 active:scale-95',
                            !isLoading &&
                              (isPlaying
                                ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                                : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white shadow-green-900/40 border border-green-400/20')
                          )}
                          title={isPlaying ? 'Pause' : 'Play'}
                        >
                          {isPlaying ? (
                            <Pause size={18} fill="currentColor" />
                          ) : (
                            <Play size={24} fill="currentColor" className="ml-1" />
                          )}
                        </button>

                        <button
                          onClick={handleStop}
                          className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-all border border-white/10 backdrop-blur-sm"
                          title="Stop"
                        >
                          <Square size={14} fill="currentColor" />
                        </button>

                        <button
                          onClick={handleToggleRecord}
                          className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center transition-all border backdrop-blur-sm',
                            isRecording
                              ? 'bg-red-500/20 border-red-500/50 text-red-500 animate-pulse'
                              : 'bg-white/5 border-white/10 text-zinc-400 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10'
                          )}
                          title={isRecording ? 'Stop Recording' : 'Record Audio'}
                        >
                          <div
                            className={cn(
                              'rounded-full bg-current',
                              isRecording ? 'w-3 h-3 rounded-sm' : 'w-3 h-3'
                            )}
                          />
                        </button>
                      </div>

                      <div className="flex-1 flex flex-col justify-center gap-1.5">
                        <div className="flex items-center justify-between text-xs text-zinc-400 font-mono tracking-wider">
                          <span className="flex items-center gap-1.5">
                            <div
                              className={cn(
                                'w-1.5 h-1.5 rounded-full',
                                isPlaying ? 'bg-green-500 animate-pulse' : 'bg-zinc-600'
                              )}
                            />
                            {isPlaying ? 'PLAYING' : 'READY'}
                          </span>
                          <span>{formatTime(currentTime)}</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                          {/* Progress bar could go here if we had total duration */}
                          <div className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 w-0" />
                        </div>
                      </div>

                      <div className="flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-full border border-white/5 backdrop-blur-sm">
                        {isMuted ? (
                          <VolumeX
                            size={16}
                            className="text-zinc-400 cursor-pointer hover:text-white transition-colors"
                            onClick={() => setIsMuted(false)}
                          />
                        ) : (
                          <Volume2
                            size={16}
                            className="text-zinc-400 cursor-pointer hover:text-white transition-colors"
                            onClick={() => setIsMuted(true)}
                          />
                        )}
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          defaultValue="0.8"
                          className="w-20 accent-blue-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                          onChange={(e) =>
                            Tone.getDestination().volume.rampTo(
                              Math.log10(parseFloat(e.target.value)) * 20,
                              0.1
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Panel>
            </>
          )}
        </PanelGroup>
      </div>

      {/* API Key Dialog */}
      <Dialog.Root open={apiKeyOpen} onOpenChange={setApiKeyOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-2xl z-50">
            <Dialog.Title className="text-lg font-semibold text-white mb-4">
              Gemini API Key
            </Dialog.Title>
            <div className="space-y-4">
              <p className="text-sm text-zinc-400">
                Enter your Google Gemini API key to use the AI features. Your key is stored locally
                in your browser.
              </p>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIza..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setApiKeyOpen(false)}
                  className="px-4 py-2 text-sm text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveApiKey}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-md text-sm font-medium"
                >
                  Save Key
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<TonAIApp />} />
      </Routes>
    </Router>
  );
};

export default App;
