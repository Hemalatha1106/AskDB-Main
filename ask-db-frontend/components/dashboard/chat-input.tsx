'use client';

import { Button } from '@/components/ui/button';
import { useState, useRef, useEffect } from 'react';

interface ChatInputProps {
  onSubmit?: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSubmit, disabled = false }: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && onSubmit) {
      onSubmit(input);
      setInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-border/40 bg-card p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex gap-3">
          <div className="flex-1 flex flex-col bg-secondary/50 rounded-xl border border-border/40 p-3 focus-within:ring-2 focus-within:ring-primary/50 transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your database..."
              disabled={disabled}
              rows={1}
              className="resize-none bg-transparent text-sm focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  handleSubmit(e as any);
                }
              }}
            />
            <div className="flex items-center justify-between gap-2 pt-2 mt-2 border-t border-border/40">
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  title="Attach file"
                >
                  📎
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  title="Voice input"
                >
                  🎤
                </Button>
              </div>
              <Button
                type="submit"
                size="sm"
                disabled={!input.trim() || disabled}
                className="h-8 px-4"
              >
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
