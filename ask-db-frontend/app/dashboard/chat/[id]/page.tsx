'use client';

import { ChatMessage } from '@/components/dashboard/chat-message';
import { ChatInput } from '@/components/dashboard/chat-input';
import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sql?: string;
  plot?: string;
  timestamp: string;
}

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat messages on mount
  useEffect(() => {
    const fetchChatHistory = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/auth/login');
        return;
      }
      
      try {
        const response = await fetch(`http://localhost:8000/api/chats/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages || []);
        } else if (response.status === 401) {
          localStorage.removeItem('authToken');
          router.push('/auth/login');
        } else {
          console.error('Failed to load chat history:', response.status);
        }
      } catch (err) {
        console.error('Error fetching chat history:', err);
      } finally {
        setFetchingHistory(false);
      }
    };

    fetchChatHistory();
  }, [id, router]);

  const handleSubmit = async (message: string) => {
    const userTimestamp = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    // 1. Add user message
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: 'user' as const,
        content: message,
        timestamp: userTimestamp,
      },
    ]);

    setLoading(true);
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      // 2. Fetch from Python FastAPI server
      const response = await fetch('http://localhost:8000/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query: message, chat_id: id }),
      });

      if (!response.ok) {
        throw new Error(`API returned HTTP status ${response.status}`);
      }

      const data = await response.json();
      
      const assistantTimestamp = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });

      if (data.success) {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant' as const,
            content: data.answer,
            sql: data.sql || undefined,
            plot: data.plot || undefined,
            timestamp: assistantTimestamp,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant' as const,
            content: `Execution failed: ${data.error || 'Unknown error occurred.'}`,
            sql: data.sql || undefined,
            timestamp: assistantTimestamp,
          },
        ]);
      }
    } catch (error: any) {
      console.error('Backend connection error:', error);
      const assistantTimestamp = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant' as const,
          content: `Unable to connect to the backend server. Make sure your FastAPI backend is running on http://localhost:8000.\n\nError: ${error.message}`,
          timestamp: assistantTimestamp,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          {fetchingHistory ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground animate-pulse text-sm">
              Loading conversation history...
            </div>
          ) : (
            messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                role={msg.role}
                content={msg.content}
                sql={msg.sql}
                plot={msg.plot}
                timestamp={msg.timestamp}
                messageId={msg.id}
              />
            ))
          )}
          {loading && (
            <div className="flex justify-start mb-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="flex gap-1 animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <div className="w-2 h-2 rounded-full bg-primary" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  AI is generating SQL & analyzing your database...
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Chat Input */}
      <ChatInput onSubmit={handleSubmit} disabled={loading || fetchingHistory} />
    </div>
  );
}
