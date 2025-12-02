import React, { useRef, useEffect } from 'react';
import { Send, Loader2, StopCircle, Settings, Wrench } from 'lucide-react';
import ChatMessage, { Message } from './ChatMessage';
import { Button } from '@/components/ui/button';
import TechBackground from './TechBackground';

interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  onStop?: () => void;
  error?: string | null;
  onQuickFix?: () => void;
  onEdit?: (id: string, newContent: string) => void;
  onDelete?: (id: string) => void;
  onRerun?: (id: string) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  isLoading,
  onSendMessage,
  onStop,
  error,
  onQuickFix,
  onEdit,
  onDelete,
  onRerun,
}) => {
  const [input, setInput] = React.useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput('');
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 relative overflow-hidden">
      <TechBackground />
      {/* Messages Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent relative z-10"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-zinc-500 space-y-8">
            <div className="space-y-6">
              <div className="flex justify-center">
                <img src="/logo.png" alt="TonAI" className="h-24 w-auto opacity-90" />
              </div>
              <p className="text-zinc-400 max-w-xs mx-auto">
                Welcome! Describe the music you want to create, or pick a starter below.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 w-full max-w-md">
              <button
                onClick={() =>
                  onSendMessage(
                    'Create a relaxing lo-fi track perfect for programming. Use 16-bit retro game elements, a slow cozy beat, and warm nostalgic chords.'
                  )
                }
                className="p-3 bg-zinc-900/50 hover:bg-blue-500/10 border border-zinc-800 hover:border-blue-500/50 rounded-xl text-left text-sm transition-all group"
              >
                <span className="block text-zinc-300 font-medium mb-1 group-hover:text-blue-400 transition-colors">
                  Cozy Lo-Fi Retro
                </span>
                <span className="text-zinc-500 text-xs group-hover:text-zinc-400">
                  Relaxing 16-bit vibes for coding
                </span>
              </button>

              <button
                onClick={() =>
                  onSendMessage(
                    'Generate a rhythmic Cyberpunk track with energetic drums, a marked bassline, and futuristic synth textures. Make it groovy and intense.'
                  )
                }
                className="p-3 bg-zinc-900/50 hover:bg-red-500/10 border border-zinc-800 hover:border-red-500/50 rounded-xl text-left text-sm transition-all group"
              >
                <span className="block text-zinc-300 font-medium mb-1 group-hover:text-red-400 transition-colors">
                  Rhythmic Cyberpunk
                </span>
                <span className="text-zinc-500 text-xs group-hover:text-zinc-400">
                  High energy drums and marked bass
                </span>
              </button>

              <button
                onClick={() =>
                  onSendMessage(
                    'Generate a high-energy Hard Rock Rockabilly track. Use a slapback echo guitar, a walking bassline, and a driving drum beat with a fast tempo. Make it raw and rebellious.'
                  )
                }
                className="p-3 bg-zinc-900/50 hover:bg-yellow-500/10 border border-zinc-800 hover:border-yellow-500/50 rounded-xl text-left text-sm transition-all group"
              >
                <span className="block text-zinc-300 font-medium mb-1 group-hover:text-yellow-400 transition-colors">
                  Hard Rock Rockabilly
                </span>
                <span className="text-zinc-500 text-xs group-hover:text-zinc-400">
                  Raw, rebellious, and high energy
                </span>
              </button>

              <button
                onClick={() =>
                  onSendMessage(
                    'Generate a calm Ambient Nature soundscape with gentle pads and bird sounds'
                  )
                }
                className="p-3 bg-zinc-900/50 hover:bg-green-500/10 border border-zinc-800 hover:border-green-500/50 rounded-xl text-left text-sm transition-all group"
              >
                <span className="block text-zinc-300 font-medium mb-1 group-hover:text-green-400 transition-colors">
                  Ambient Nature
                </span>
                <span className="text-zinc-500 text-xs group-hover:text-zinc-400">
                  Gentle pads and calming atmosphere
                </span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                onEdit={onEdit}
                onDelete={onDelete}
                onRerun={onRerun}
              />
            ))}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 backdrop-blur-md space-y-3 relative z-20">
        {error && onQuickFix && (
          <button
            onClick={onQuickFix}
            className="w-full py-2 bg-red-500/10 border border-red-500/50 text-red-400 hover:bg-red-500/20 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all animate-in slide-in-from-bottom-2"
          >
            <Wrench size={14} />
            Fix Runtime Error
          </button>
        )}

        <div className="relative flex items-end gap-2 bg-zinc-900/50 border border-zinc-800 rounded-xl p-2 focus-within:ring-2 focus-within:ring-purple-500/50 focus-within:border-purple-500/50 transition-all">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Describe your music..."
            className="flex-1 bg-transparent border-0 focus:ring-0 resize-none max-h-[200px] min-h-[24px] py-2 px-2 text-sm text-zinc-200 placeholder:text-zinc-500 leading-relaxed scrollbar-hide"
            rows={1}
          />
          <div className="pb-1 pr-1">
            {isLoading ? (
              <Button
                size="icon"
                variant="ghost"
                onClick={onStop}
                className="h-8 w-8 rounded-lg hover:bg-red-500/10 text-zinc-400 hover:text-red-400"
              >
                <StopCircle size={18} />
              </Button>
            ) : (
              <Button
                size="icon"
                onClick={() => handleSubmit()}
                disabled={!input.trim()}
                className="h-8 w-8 rounded-lg bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-50 disabled:bg-zinc-800 disabled:text-zinc-600"
              >
                <Send size={16} />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
