'use client';

import { ChatInput } from '@/components/dashboard/chat-input';
import { ChatMessage } from '@/components/dashboard/chat-message';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sql?: string;
  plot?: string;
  timestamp: string;
}

export default function NewChatPage() {
  const router = useRouter();
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        "Hello! I'm AskDB, your AI-powered SQL assistant. I'm connected to your database and ready to help. What would you like to know about your data?",
      timestamp: '',
    },
  ]);

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === '1' && prev[0].timestamp === '') {
        return [
          {
            ...prev[0],
            timestamp: new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
          },
        ];
      }
      return prev;
    });
  }, []);

  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle auto-submitting query from URL query params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const queryParam = params.get('q');
      if (queryParam) {
        // Clear the query param from URL so refresh doesn't trigger it again
        window.history.replaceState(null, '', window.location.pathname);
        handleSubmit(queryParam);
      }
    }
  }, []);

  const handleSubmit = async (message: string) => {
    const timestamp = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    // 1. Add user message to UI
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: 'user',
        content: message,
        timestamp,
      },
    ]);

    setLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      // Generate a new chat session ID
      const activeChatId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      // Initialize the chat session in backend system DB
      await fetch('http://localhost:8000/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          chat_id: activeChatId,
          title: message.substring(0, 30) + (message.length > 30 ? '...' : '')
        })
      });

      // 2. Fetch query results from Python FastAPI server
      const response = await fetch('http://localhost:8000/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query: message, chat_id: activeChatId }),
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
        // Redirect client smoothly to the newly created chat history route
        router.push(`/dashboard/chat/${activeChatId}`);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `Execution failed: ${data.error || 'Unknown error occurred.'}`,
            sql: data.sql || undefined,
            timestamp: assistantTimestamp,
          },
        ]);
        setLoading(false);
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
          role: 'assistant',
          content: `Unable to connect to the backend server. Make sure your FastAPI backend is running on http://localhost:8000.\n\nError: ${error.message}`,
          timestamp: assistantTimestamp,
        },
      ]);
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              role={msg.role}
              content={msg.content}
              sql={msg.sql}
              plot={msg.plot}
              timestamp={msg.timestamp}
              messageId={msg.id}
            />
          ))}
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
      <ChatInput onSubmit={handleSubmit} disabled={loading} />
    </div>
  );
}
