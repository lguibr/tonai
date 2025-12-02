import React, { useState } from 'react';
import {
  User,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Check,
  Copy,
  Pencil,
  Trash2,
  RefreshCw,
  X,
  Save,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ChatMessageProps {
  message: Message;
  onEdit?: (id: string, newContent: string) => void;
  onDelete?: (id: string) => void;
  onRerun?: (id: string) => void;
}

const CodeBlock = ({ inline, className, children, ...props }: any) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const content = String(children).replace(/\n$/, '');
  const isLong = content.split('\n').length > 5;

  if (inline) {
    return (
      <code
        className={cn('bg-black/20 px-1 py-0.5 rounded font-mono text-sm', className)}
        {...props}
      >
        {children}
      </code>
    );
  }

  if (!isLong) {
    return (
      <div className="my-2 rounded-md overflow-hidden border border-white/10 bg-black/30">
        <div className="px-3 py-1.5 bg-white/5 border-b border-white/5 text-xs text-zinc-400 font-mono flex justify-between">
          <span>{match?.[1] || 'text'}</span>
        </div>
        <pre className="p-3 overflow-x-auto text-sm font-mono scrollbar-hide">
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      </div>
    );
  }

  return (
    <div className="my-2 border border-white/10 rounded-lg overflow-hidden bg-black/30">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-2 bg-white/5 hover:bg-white/10 transition-colors text-xs text-zinc-400"
      >
        <span className="flex items-center gap-2">
          <Check size={12} className="text-green-500" />
          {match?.[1] || 'Code'} Generated
        </span>
        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {isExpanded && (
        <pre className="p-3 text-sm overflow-x-auto font-mono bg-black/50 border-t border-white/10 scrollbar-hide">
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      )}
    </div>
  );
};

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onEdit, onDelete, onRerun }) => {
  const isUser = message.role === 'user';
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  // Parse content for <thinking> tags
  let thinkingContent = '';
  let mainContent = message.content;

  const thinkingMatch = message.content.match(/<thinking>([\s\S]*?)<\/thinking>/);
  if (thinkingMatch) {
    thinkingContent = thinkingMatch[1].trim();
    mainContent = message.content.replace(/<thinking>[\s\S]*?<\/thinking>/, '').trim();
  } else if (message.content.startsWith('<thinking>')) {
    // Streaming partial thinking tag
    thinkingContent = message.content.replace('<thinking>', '').trim();
    mainContent = '';
  }

  // If message is empty (just started streaming), show loading state inside bubble
  const isEmpty = !thinkingContent && !mainContent;

  const handleSaveEdit = () => {
    if (onEdit && editContent.trim() !== message.content) {
      onEdit(message.id, editContent);
    }
    setIsEditing(false);
  };

  return (
    <div
      className={cn(
        'group flex w-full gap-3 py-2 px-1 transition-opacity animate-in fade-in slide-in-from-bottom-2',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <div className="shrink-0 mt-auto flex flex-col gap-2 items-center">
        {isUser ? (
          <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-900/20">
            <User size={16} className="text-white" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 shadow-lg">
            <Sparkles size={16} className="text-purple-400" />
          </div>
        )}
      </div>

      <div className="flex flex-col max-w-[85%] gap-1">
        <div
          className={cn(
            'relative px-4 py-3 shadow-md pb-6', // Added pb-6 for timestamp space
            isUser
              ? 'bg-purple-600 text-white rounded-2xl rounded-br-sm'
              : 'bg-zinc-800 text-zinc-100 rounded-2xl rounded-bl-sm border border-zinc-700'
          )}
        >
          {isEmpty && !isUser && (
            <div className="flex items-center gap-2 text-zinc-400 italic text-sm">
              <span className="animate-pulse">Thinking...</span>
            </div>
          )}

          {thinkingContent && (
            <div className="mb-3 border-l-2 border-purple-500/30 pl-3">
              <button
                onClick={() => setIsThinkingExpanded(!isThinkingExpanded)}
                className="flex items-center gap-2 text-xs font-medium text-purple-400 hover:text-purple-300 transition-colors mb-1"
              >
                <span>Thinking Process</span>
                {isThinkingExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
              {isThinkingExpanded && (
                <div className="text-xs text-zinc-500 italic whitespace-pre-wrap leading-relaxed animate-in fade-in slide-in-from-top-1">
                  {thinkingContent}
                </div>
              )}
            </div>
          )}

          {isEditing ? (
            <div className="flex flex-col gap-2 min-w-[250px] md:min-w-[350px]">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full bg-black/20 text-white rounded p-2 text-sm min-h-[100px] outline-none border border-white/10 focus:border-purple-500/50"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-1 hover:bg-white/10 rounded"
                >
                  <X size={14} />
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="p-1 hover:bg-white/10 rounded text-green-400"
                >
                  <Save size={14} />
                </button>
              </div>
            </div>
          ) : (
            mainContent && (
              <div className="text-sm leading-relaxed prose prose-invert prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code: CodeBlock,
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    ul: ({ children }) => (
                      <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>
                    ),
                    a: ({ href, children }) => (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        {children}
                      </a>
                    ),
                  }}
                >
                  {mainContent}
                </ReactMarkdown>
              </div>
            )
          )}

          <span
            className={cn(
              'text-[10px] absolute bottom-1 opacity-50',
              isUser ? 'left-2 text-purple-200' : 'right-2 text-zinc-500'
            )}
          >
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        {/* Action Buttons */}
        <div
          className={cn(
            'flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity px-2',
            isUser ? 'flex-row-reverse' : 'flex-row'
          )}
        >
          <button
            onClick={() => navigator.clipboard.writeText(message.content)}
            className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-md transition-colors"
            title="Copy Message"
          >
            <Copy size={12} />
          </button>
          {isUser && onEdit && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-md transition-colors"
              title="Edit"
            >
              <Pencil size={12} />
            </button>
          )}
          {onRerun && (
            <button
              onClick={() => onRerun(message.id)}
              className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-md transition-colors"
              title="Rerun from here"
            >
              <RefreshCw size={12} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(message.id)}
              className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-md transition-colors"
              title="Delete"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
