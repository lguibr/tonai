import React, { useRef, useEffect } from 'react';
import { Send, Loader2, StopCircle, Settings, Wrench } from 'lucide-react';
import ChatMessage, { Message } from './ChatMessage';
import { Button } from '@/components/ui/button';

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
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Messages Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-zinc-500 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center border border-zinc-800">
              <Send size={20} />
            </div>
            <div>
              <h3 className="text-zinc-300 font-medium mb-1">Welcome to TonAI</h3>
              <p className="text-sm">
                Describe the music you want to create, or ask for changes to the current code.
              </p>
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
      <div className="p-4 border-t border-zinc-800 bg-zinc-950 space-y-3">
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
        <div className="text-center">
          <p className="text-[10px] text-zinc-600">AI can make mistakes. Check the code.</p>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
