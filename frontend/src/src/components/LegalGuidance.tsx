
import React, { useState } from 'react';
import { HelpCircle, FileText, Download, MessageSquare, Scale, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const LegalGuidance = () => {
  const [activeTab, setActiveTab] = useState('qa');
  const [searchQuery, setSearchQuery] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { type: 'ai', message: 'Hello! I\'m your AI legal assistant. I can help you understand UK tenancy law, your rights as a tenant, and guide you through common housing issues. What would you like to know?' }
  ]);
  const [newMessage, setNewMessage] = useState('');

  // Legal Q&A Database
  const legalQA = [
    {
      category: 'Deposits',
      question: 'How much can a landlord charge for a deposit?',
      answer: 'In England, since June 2019, deposits are capped at 5 weeks\' rent for annual rents under £50,000. In Wales, deposits are capped at 6 weeks\' rent. In Scotland, deposits are capped at 8 weeks\' rent.',
      keywords: ['deposit', 'security', 'amount', 'limit']
    },
    {
      category: 'Deposits',
      question: 'What is deposit protection?',
      answer: 'Landlords must protect your deposit in a government-approved scheme (DPS, MyDeposits, or TDS) within 30 days and provide you with prescribed information. This ensures fair dispute resolution.',
      keywords: ['deposit', 'protection', 'scheme', 'DPS', 'TDS']
    },
    {
      category: 'Tenancy Rights',
      question: 'Can my landlord enter my property without permission?',
      answer: 'No. Landlords must give at least 24 hours\' written notice and can only enter at reasonable times. Emergency situations are an exception. You have the right to quiet enjoyment of your home.',
      keywords: ['entry', 'privacy', 'notice', 'landlord', 'quiet enjoyment']
    },
    {
      category: 'Tenancy Rights',
      question: 'What is the minimum notice period for eviction?',
      answer: 'For Section 21 (no-fault) evictions: 2 months\' notice. For Section 8 (fault-based): 2 weeks to 2 months depending on grounds. Fixed-term tenancies cannot be ended early without specific grounds.',
      keywords: ['eviction', 'notice', 'section 21', 'section 8']
    },
    {
      category: 'Repairs',
      question: 'Who is responsible for repairs in rental property?',
      answer: 'Landlords are responsible for structural repairs, heating, hot water, and keeping the property in good condition. Tenants are responsible for minor maintenance and repairs caused by their actions.',
      keywords: ['repairs', 'maintenance', 'responsibility', 'landlord', 'tenant']
    },
    {
      category: 'Rent',
      question: 'Can my landlord increase my rent?',
      answer: 'During a fixed-term tenancy, rent can only increase if there\'s a rent review clause. For periodic tenancies, landlords must follow proper procedures and give appropriate notice (usually 1 month for monthly tenancies).',
      keywords: ['rent', 'increase', 'fixed-term', 'periodic', 'notice']
    },
    {
      category: 'International Students',
      question: 'Do I need a guarantor as an international student?',
      answer: 'Many landlords require international students to have a UK-based guarantor or use a guarantor service. The guarantor typically needs to earn 2.5-3 times the annual rent and pass credit checks.',
      keywords: ['guarantor', 'international', 'student', 'visa', 'credit']
    },
    {
      category: 'Disputes',
      question: 'How do I resolve a dispute with my landlord?',
      answer: 'Try to resolve issues directly first. If unsuccessful, contact your local council, Citizens Advice, or use dispute resolution services. For deposit disputes, use your deposit protection scheme\'s free service.',
      keywords: ['dispute', 'resolution', 'citizens advice', 'council']
    }
  ];

  // Legal document templates
  const documentTemplates = [
    {
      name: 'Tenancy Agreement Checklist',
      description: 'Essential points to check before signing your tenancy agreement',
      category: 'Contracts',
      downloadUrl: '#'
    },
    {
      name: 'Deposit Dispute Letter Template',
      description: 'Template letter for challenging unfair deposit deductions',
      category: 'Deposits',
      downloadUrl: '#'
    },
    {
      name: 'Repair Request Letter',
      description: 'Formal template for requesting essential repairs from landlord',
      category: 'Repairs',
      downloadUrl: '#'
    },
    {
      name: 'Moving In Checklist',
      description: 'Comprehensive checklist to document property condition',
      category: 'Move In',
      downloadUrl: '#'
    },
    {
      name: 'Know Your Rights Guide',
      description: 'Complete guide to UK tenant rights and responsibilities',
      category: 'Rights',
      downloadUrl: '#'
    }
  ];

  const filteredQA = legalQA.filter(item => 
    searchQuery === '' || 
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.keywords.some(keyword => keyword.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleChatSend = () => {
    if (!newMessage.trim()) return;

    const userMessage = { type: 'user', message: newMessage };
    setChatMessages(prev => [...prev, userMessage]);

    // Simple AI response logic
    let aiResponse = "I understand your question. Let me provide some guidance on this legal matter.";
    
    const lowerMessage = newMessage.toLowerCase();
    const matchedQA = legalQA.find(qa => 
      qa.keywords.some(keyword => lowerMessage.includes(keyword.toLowerCase()))
    );

    if (matchedQA) {
      aiResponse = `${matchedQA.answer}\n\nFor more detailed advice specific to your situation, I recommend consulting with a qualified legal professional or contacting Citizens Advice.`;
    } else if (lowerMessage.includes('emergency') || lowerMessage.includes('urgent')) {
      aiResponse = "For urgent legal matters, contact your local Citizens Advice immediately or call Shelter's emergency helpline at 0808 800 4444. If it's a safety issue, don't hesitate to contact local authorities.";
    }

    setTimeout(() => {
      const aiMessage = { type: 'ai', message: aiResponse };
      setChatMessages(prev => [...prev, aiMessage]);
    }, 1000);

    setNewMessage('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Legal Guidance & Tenant Rights</h1>
        <p className="text-gray-600 mb-4">AI-powered legal assistance for UK student accommodation issues</p>
        
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Legal Topics</p>
                  <p className="text-2xl font-bold">{legalQA.length}</p>
                </div>
                <Scale className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Templates</p>
                  <p className="text-2xl font-bold">{documentTemplates.length}</p>
                </div>
                <FileText className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">AI Assistance</p>
                  <p className="text-2xl font-bold">24/7</p>
                </div>
                <MessageSquare className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        {[
          { id: 'qa', label: 'Q&A Library', icon: HelpCircle },
          { id: 'chat', label: 'AI Assistant', icon: MessageSquare },
          { id: 'templates', label: 'Templates', icon: FileText }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === id ? 'bg-white text-blue-600 shadow' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Q&A Library Tab */}
      {activeTab === 'qa' && (
        <div className="space-y-4">
          {/* Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <HelpCircle className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Search legal topics (e.g., deposit, repairs, eviction...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardContent>
          </Card>

          {/* Categories Overview */}
          <div className="grid md:grid-cols-4 gap-4">
            {['Deposits', 'Tenancy Rights', 'Repairs', 'Rent'].map((category) => (
              <Card key={category} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-6 text-center">
                  <h3 className="font-semibold mb-2">{category}</h3>
                  <Badge variant="outline">
                    {legalQA.filter(qa => qa.category === category).length} topics
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Q&A Items */}
          <div className="space-y-4">
            {filteredQA.map((qa, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{qa.question}</CardTitle>
                    <Badge variant="outline">{qa.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{qa.answer}</p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {qa.keywords.slice(0, 3).map((keyword) => (
                      <Badge key={keyword} variant="secondary" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* AI Chat Tab */}
      {activeTab === 'chat' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5" />
              <span>AI Legal Assistant</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96 bg-gray-50 rounded-lg p-4 mb-4 overflow-y-auto">
              <div className="space-y-4">
                {chatMessages.map((msg, index) => (
                  <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      msg.type === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white text-gray-800 border'
                    }`}>
                      {msg.message}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Input
                placeholder="Ask about tenant rights, deposits, repairs, or any housing legal question..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleChatSend()}
              />
              <Button onClick={handleChatSend}>Send</Button>
            </div>

            {/* Quick Questions */}
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Common Questions:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  'Deposit protection rules',
                  'Landlord entry rights',
                  'Eviction notice periods',
                  'Repair responsibilities'
                ].map((question) => (
                  <Button
                    key={question}
                    variant="outline"
                    size="sm"
                    onClick={() => setNewMessage(question)}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {documentTemplates.map((template, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                    </div>
                    <Badge variant="outline">{template.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Download Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Emergency Contacts */}
      <Card className="bg-red-50 border-red-200">
        <CardHeader>
          <CardTitle className="text-red-800 flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Emergency Legal Support</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-semibold text-red-700">Shelter (Housing Charity)</div>
              <div className="text-red-600">Emergency Helpline: 0808 800 4444</div>
              <div className="text-xs text-red-500">Free housing advice and legal support</div>
            </div>
            <div>
              <div className="font-semibold text-red-700">Citizens Advice</div>
              <div className="text-red-600">National Helpline: 0800 144 8848</div>
              <div className="text-xs text-red-500">Free confidential advice on legal issues</div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-white rounded-lg">
            <p className="text-sm font-medium text-red-700">Disclaimer:</p>
            <p className="text-xs text-red-600">This AI assistant provides general information only and should not be considered as professional legal advice. For specific legal issues, always consult with qualified legal professionals.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LegalGuidance;
