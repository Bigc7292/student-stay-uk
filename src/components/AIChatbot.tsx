import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Bot, User, Loader2, BookOpen, Home, PoundSterling, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  category?: string;
}

const AIChatbot = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hello! I'm your AI assistant for UK student accommodation. I can help you with finding housing, understanding tenancy rights, budgeting, application processes, and much more. What would you like to know?",
      isUser: false,
      timestamp: new Date(),
      category: 'general'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Quick action suggestions
  const quickActions = [
    { text: "How much should I budget for accommodation?", category: "budget", icon: PoundSterling },
    { text: "What documents do I need for applications?", category: "documents", icon: FileText },
    { text: "Tell me about tenancy rights in the UK", category: "legal", icon: BookOpen },
    { text: "How do I find safe accommodation?", category: "safety", icon: Home }
  ];

  // Comprehensive knowledge base
  const knowledgeBase = {
    budget: {
      keywords: ['budget', 'cost', 'price', 'money', 'afford', 'expensive', 'cheap', 'rent'],
      responses: [
        "For UK student accommodation, budget around £400-800/month depending on location. London is typically £600-1200/month, while northern cities like Manchester or Liverpool range £300-600/month.",
        "Remember to factor in additional costs: utilities (£50-100/month), internet (£20-40/month), contents insurance (£5-15/month), and council tax (usually exempt for full-time students).",
        "Consider shared accommodation to reduce costs - a shared house typically costs £400-600/month compared to £600-1000/month for a studio apartment."
      ]
    },
    documents: {
      keywords: ['documents', 'application', 'paperwork', 'forms', 'ID', 'proof', 'requirements'],
      responses: [
        "Essential documents for UK student accommodation applications: Valid passport/ID, university acceptance letter, proof of income/student finance, bank statements (3-6 months), references from previous landlords or employers.",
        "International students also need: Visa documentation, ATAS certificate (if required), proof of English language proficiency, and sometimes a UK-based guarantor or deposit guarantee scheme.",
        "Prepare digital copies of all documents - most applications are now online. Ensure documents are recent (within 3 months) and officially translated if not in English."
      ]
    },
    legal: {
      keywords: ['rights', 'legal', 'tenancy', 'contract', 'lease', 'deposit', 'eviction', 'landlord'],
      responses: [
        "UK tenancy rights: You have the right to a written tenancy agreement, receipt for deposits, 24-hour notice for landlord visits, and protection from unfair eviction.",
        "Your deposit must be protected in a government-approved scheme (DPS, MyDeposits, or TDS) within 30 days. You should receive information about which scheme protects your deposit.",
        "Common tenancy types: Assured Shorthold Tenancy (AST) is most common, usually 6-12 months. Always read contracts carefully and understand break clauses, rent increase terms, and maintenance responsibilities."
      ]
    },
    safety: {
      keywords: ['safe', 'security', 'dangerous', 'crime', 'area', 'neighborhood', 'scam'],
      responses: [
        "Safety checklist: Research crime rates using police.uk, visit properties in person, check for working smoke/carbon monoxide alarms, secure locks, and well-lit entrances.",
        "Red flags to avoid: Landlords asking for money before viewing, prices significantly below market rate, no proper tenancy agreement, unwillingness to provide references or deposit protection details.",
        "Use reputable sources: University accommodation services, established letting agents (check they're registered with a professional body), and verified platforms like SpareRoom or Rightmove."
      ]
    },
    international: {
      keywords: ['international', 'visa', 'overseas', 'foreign', 'guarantor', 'bank account'],
      responses: [
        "International students: Open a UK bank account ASAP (you'll need your passport, visa, university enrollment letter, and proof of address). Consider Monzo, Starling, or HSBC for student-friendly options.",
        "If you can't get a UK guarantor, look for properties that accept international guarantors or use services like Housing Hand or Global Guarantor for guarantee schemes.",
        "Arrive early if possible - viewing properties in person is crucial. If not possible, use video calls and ask for virtual tours. Never send money without seeing official contracts."
      ]
    },
    areas: {
      keywords: ['area', 'location', 'neighborhood', 'transport', 'commute', 'shops', 'nightlife'],
      responses: [
        "Research areas thoroughly: Check transport links to your university, nearby amenities (supermarkets, pharmacies, banks), and student population density for community feel.",
        "Use online tools: Check commute times on Citymapper, explore areas on Google Street View, read local Facebook groups and Reddit communities for honest reviews.",
        "Consider: Proximity to campus vs. cost trade-off, noise levels (avoid main roads if you're a light sleeper), and access to essential services within walking distance."
      ]
    },
    viewing: {
      keywords: ['viewing', 'visit', 'inspection', 'see', 'tour', 'check'],
      responses: [
        "Property viewing checklist: Test water pressure, check heating/hot water, inspect for damp/mold, test all appliances, check internet speed, and assess natural light.",
        "Ask important questions: When was the property last renovated? Who handles maintenance? Are there any upcoming works? What's included in rent? How do you report issues?",
        "Take photos/videos during viewing (with permission) and don't feel pressured to decide immediately. A good landlord will give you time to consider."
      ]
    },
    maintenance: {
      keywords: ['maintenance', 'repair', 'broken', 'fix', 'heating', 'plumbing', 'landlord responsibility'],
      responses: [
        "Landlord responsibilities: Structural repairs, heating/hot water systems, electrical safety, gas safety certificates, and keeping exterior/common areas in good condition.",
        "Tenant responsibilities: Minor repairs, changing light bulbs, keeping property clean, reporting issues promptly, and not causing damage through negligence.",
        "Report issues in writing (email is fine) and keep records. For urgent repairs (no heating/hot water), landlords must respond within 24-48 hours."
      ]
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Find matching category
    for (const [category, data] of Object.entries(knowledgeBase)) {
      if (data.keywords.some(keyword => lowerMessage.includes(keyword))) {
        const responses = data.responses;
        return responses[Math.floor(Math.random() * responses.length)];
      }
    }
    
    // General responses for unmatched queries
    const generalResponses = [
      "I'd be happy to help with that! Could you be more specific about what aspect of student accommodation you're interested in?",
      "That's a great question! For the most accurate information, I'd recommend checking with your university's accommodation services as well. What specific details can I help you with?",
      "I can help you with accommodation budgeting, legal rights, application processes, area research, and safety tips. What would you like to know more about?",
      "For complex legal or financial matters, I recommend consulting with your university's student support services or Citizens Advice Bureau. Is there a specific accommodation concern I can help address?"
    ];
    
    return generalResponses[Math.floor(Math.random() * generalResponses.length)];
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const response = generateResponse(inputMessage);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        isUser: false,
        timestamp: new Date(),
        category: 'response'
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000);
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

  return (
    <div className="space-y-6">
      <Card className="h-[600px] flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2">
            <Bot className="w-6 h-6 text-blue-600" />
            <span>AI Student Housing Assistant</span>
            <Badge variant="secondary" className="ml-2">24/7 Available</Badge>
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
                      <p className={`text-xs mt-1 ${
                        message.isUser ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
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

      {/* Knowledge Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-green-600" />
            <span>What I Can Help With</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Budgeting & Costs</h4>
              <p className="text-sm text-blue-700">Rent prices, hidden costs, money-saving tips, and financial planning</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">Legal Rights</h4>
              <p className="text-sm text-green-700">Tenancy agreements, deposit protection, and landlord responsibilities</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <h4 className="font-semibold text-purple-800 mb-2">Applications</h4>
              <p className="text-sm text-purple-700">Required documents, guarantors, and application processes</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <h4 className="font-semibold text-orange-800 mb-2">Safety & Areas</h4>
              <p className="text-sm text-orange-700">Safe neighborhoods, red flags to avoid, and area research tips</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIChatbot;
