import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { aiService } from '@/services/aiService';
import { BookOpen, Bot, FileText, Home, Key, Loader2, PoundSterling, Send, Settings, User } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  category?: string;
  confidence?: number;
  source?: 'openai' | 'local' | 'fallback';
}

const AIChatbot = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hello! I'm your AI assistant powered by OpenAI for UK student accommodation. I can help you with finding housing, understanding tenancy rights, budgeting, application processes, route planning, and much more. What would you like to know?",
      isUser: false,
      timestamp: new Date(),
      category: 'general',
      source: 'local'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Quick action suggestions
  const quickActions = [
    { text: "How much should I budget for accommodation?", category: "budget", icon: PoundSterling },
    { text: "What documents do I need for applications?", category: "documents", icon: FileText },
    { text: "Tell me about tenancy rights in the UK", category: "legal", icon: BookOpen },
    { text: "How do I find safe accommodation?", category: "safety", icon: Home }
  ];



  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateResponse = async (userMessage: string): Promise<void> => {
    try {
      // Get conversation history for context
      const conversationHistory = messages
        .slice(-10) // Last 10 messages for context
        .map(msg => msg.content);

      // Call AI service
      const aiResponse = await aiService.generateResponse(userMessage, conversationHistory);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse.content,
        isUser: false,
        timestamp: new Date(),
        category: 'response',
        confidence: aiResponse.confidence,
        source: aiResponse.source
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error generating AI response:', error);

      // Fallback response
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I apologize, but I'm having trouble processing your request right now. Please try again or contact support if the issue persists.",
        isUser: false,
        timestamp: new Date(),
        category: 'error',
        source: 'fallback'
      };

      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const currentMessage = inputMessage;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: currentMessage,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Generate AI response
    await generateResponse(currentMessage);
  };

  const handleQuickAction = (actionText: string) => {
    setInputMessage(actionText);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      aiService.setApiKey(apiKey.trim());
      setShowSettings(false);
      setApiKey('');

      // Add confirmation message
      const confirmMessage: Message = {
        id: Date.now().toString(),
        content: "Great! I've saved your OpenAI API key. I can now provide more intelligent and contextual responses using GPT-3.5. Try asking me something about student accommodation!",
        isUser: false,
        timestamp: new Date(),
        category: 'system',
        source: 'local'
      };
      setMessages(prev => [...prev, confirmMessage]);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <Card className="flex-1 flex flex-col min-h-0">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot className="w-6 h-6 text-blue-600" />
              <span>AI Student Housing Assistant</span>
              <Badge variant="secondary" className="ml-2">24/7 Available</Badge>
              <Badge
                variant={aiService.isAPIAvailable() ? "default" : "outline"}
                className="ml-2"
              >
                {aiService.isAPIAvailable() ? "Advanced AI" : "Basic AI"}
              </Badge>
            </div>
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <Key className="w-5 h-5" />
                    <span>AI Settings</span>
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-3">
                      {aiService.getAPISetupInstructions()}
                    </p>
                    <Input
                      type="password"
                      placeholder="Enter your OpenAI API key (optional - already configured)"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="mb-3"
                    />
                    <Button onClick={handleSaveApiKey} disabled={!apiKey.trim()}>
                      Save API Key
                    </Button>
                  </div>
                  <div className="text-xs text-gray-500">
                    <p>Current status: {aiService.isAPIAvailable() ? "Advanced AI enabled" : "Using basic AI responses"}</p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col min-h-0">
          {/* Messages Area */}
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`flex items-start space-x-2 max-w-[80%] ${
                      message.isUser ? 'flex-row-reverse space-x-reverse' : ''
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      message.isUser ? 'bg-blue-600' : 'bg-gray-600'
                    }`}>
                      {message.isUser ? (
                        <User className="w-4 h-4 text-white" />
                      ) : (
                        <Bot className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div
                      className={`rounded-lg px-4 py-2 ${
                        message.isUser
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <div className={`flex items-center justify-between text-xs mt-1 ${
                        message.isUser ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        <span>
                          {message.timestamp.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {!message.isUser && message.source && (
                          <div className="flex items-center space-x-1">
                            {message.source === 'openai' && (
                              <Badge variant="secondary" className="text-xs px-1 py-0">
                                🤖 OpenAI GPT
                              </Badge>
                            )}
                            {message.confidence && (
                              <span className="opacity-70">
                                {Math.round(message.confidence * 100)}%
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-2">
                    <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-gray-100 rounded-lg px-4 py-2">
                      <div className="flex space-x-1">
                        <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                        <span className="text-sm text-gray-500">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Quick Actions */}
          <div className="mt-4 mb-4">
            <p className="text-sm text-gray-600 mb-2">Quick questions:</p>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAction(action.text)}
                    className="text-xs flex items-center space-x-1"
                  >
                    <Icon className="w-3 h-3" />
                    <span>{action.text}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Input Area */}
          <div className="flex space-x-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about student accommodation..."
              className="flex-1"
              disabled={isTyping}
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!inputMessage.trim() || isTyping}
              className="px-3"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Knowledge Categories - Compact for modal */}
      <Card className="flex-shrink-0">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 mb-3">
            <BookOpen className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium">I can help with:</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="p-2 bg-blue-50 rounded text-center">
              <p className="text-xs font-medium text-blue-800">Budgeting</p>
            </div>
            <div className="p-2 bg-green-50 rounded text-center">
              <p className="text-xs font-medium text-green-800">Legal Rights</p>
            </div>
            <div className="p-2 bg-purple-50 rounded text-center">
              <p className="text-xs font-medium text-purple-800">Applications</p>
            </div>
            <div className="p-2 bg-orange-50 rounded text-center">
              <p className="text-xs font-medium text-orange-800">Safety</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIChatbot;
