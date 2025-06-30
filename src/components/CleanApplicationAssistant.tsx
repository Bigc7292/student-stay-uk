import React, { useState } from 'react';
import { FileText, Upload, CheckCircle, Clock, MessageSquare, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

// Simple Progress component
const Progress = ({ value, className }: { value: number; className?: string }) => (
  <div className={`bg-gray-200 rounded-full overflow-hidden ${className || 'h-2'}`}>
    <div 
      className="bg-blue-600 h-full transition-all duration-300"
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
);

const CleanApplicationAssistant: React.FC = () => {
  const [activeTab, setActiveTab] = useState('application');
  const [applicationData, setApplicationData] = useState({
    personalInfo: { name: '', email: '', phone: '', nationality: '' },
    documents: { passport: false, bankStatement: false, studentLetter: false, references: false },
    status: 'draft'
  });
  const [chatMessages, setChatMessages] = useState([
    { type: 'ai', message: 'Hi! I\'m your AI application assistant. How can I help you with your accommodation application today?' }
  ]);
  const [newMessage, setNewMessage] = useState('');

  // Mock application progress data
  const applicationProgress = [
    { step: 'Personal Information', completed: true, current: false },
    { step: 'Document Upload', completed: false, current: true },
    { step: 'Reference Checks', completed: false, current: false },
    { step: 'Application Review', completed: false, current: false },
    { step: 'Offer Decision', completed: false, current: false }
  ];

  // Pre-defined Q&A for chatbot
  const predefinedAnswers = {
    'documents': 'For UK student accommodation, you typically need: 1) Valid passport/ID, 2) Bank statements (3-6 months), 3) University acceptance letter, 4) Two references (academic or professional), 5) Guarantor form (if required).',
    'guarantor': 'A guarantor is someone who agrees to pay your rent if you cannot. Usually a UK resident earning 2.5-3x the annual rent. International students often need guarantors or can use guarantor services.',
    'deposit': 'Typical deposits range from 1-6 weeks rent. In England/Wales, deposits must be protected in a government-approved scheme (DPS, MyDeposits, or TDS) within 30 days.',
    'tenancy': 'Common tenancy types: Assured Shorthold Tenancy (AST) - most common, fixed-term usually 12 months. Joint tenancy means all tenants are responsible for full rent.',
    'rights': 'Key tenant rights: Safe, habitable property; deposit protection; 24-hour notice for landlord visits; protection from unfair eviction; right to challenge excessive charges.'
  };

  const handlePersonalInfoChange = (field: string, value: string) => {
    setApplicationData(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value }
    }));
  };

  const handleDocumentUpload = (doc: string) => {
    setApplicationData(prev => ({
      ...prev,
      documents: { ...prev.documents, [doc]: true }
    }));
  };

  const handleChatSend = () => {
    if (!newMessage.trim()) return;

    const userMessage = { type: 'user', message: newMessage };
    setChatMessages(prev => [...prev, userMessage]);

    // Simple keyword matching for AI responses
    let aiResponse = "I understand your question. Let me help you with that.";
    
    const lowerMessage = newMessage.toLowerCase();
    if (lowerMessage.includes('document') || lowerMessage.includes('paperwork')) {
      aiResponse = predefinedAnswers.documents;
    } else if (lowerMessage.includes('guarantor')) {
      aiResponse = predefinedAnswers.guarantor;
    } else if (lowerMessage.includes('deposit')) {
      aiResponse = predefinedAnswers.deposit;
    } else if (lowerMessage.includes('tenancy') || lowerMessage.includes('contract')) {
      aiResponse = predefinedAnswers.tenancy;
    } else if (lowerMessage.includes('rights') || lowerMessage.includes('legal')) {
      aiResponse = predefinedAnswers.rights;
    }

    setTimeout(() => {
      const aiMessage = { type: 'ai', message: aiResponse };
      setChatMessages(prev => [...prev, aiMessage]);
    }, 1000);

    setNewMessage('');
  };

  const calculateProgress = () => {
    const personalComplete = Object.values(applicationData.personalInfo).every(val => val !== '');
    const docsComplete = Object.values(applicationData.documents).filter(Boolean).length;
    return (personalComplete ? 25 : 0) + (docsComplete * 15);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Application Assistant</h1>
        <p className="text-gray-600 mb-4">Streamlined application process with AI guidance for international students</p>
        
        {/* Progress Bar */}
        <div className="bg-white rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Application Progress</span>
            <span className="text-sm text-gray-600">{calculateProgress()}% Complete</span>
          </div>
          <Progress value={calculateProgress()} className="mb-3" />
          <div className="flex justify-between text-xs text-gray-600">
            {applicationProgress.map((step, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full mb-1 ${
                  step.completed ? 'bg-green-500' : step.current ? 'bg-blue-500' : 'bg-gray-300'
                }`}></div>
                <span className="text-center max-w-16">{step.step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        {[
          { id: 'application', label: 'Application Form', icon: FileText },
          { id: 'documents', label: 'Documents', icon: Upload },
          { id: 'chat', label: 'AI Assistant', icon: MessageSquare },
          { id: 'status', label: 'Status', icon: Clock }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
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

      {/* Application Form Tab */}
      {activeTab === 'application' && (
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <Input
                  placeholder="Enter your full name"
                  value={applicationData.personalInfo.name}
                  onChange={(e) => handlePersonalInfoChange('name', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email Address</label>
                <Input
                  type="email"
                  placeholder="your.email@university.ac.uk"
                  value={applicationData.personalInfo.email}
                  onChange={(e) => handlePersonalInfoChange('email', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Phone Number</label>
                <Input
                  placeholder="+44 7XXX XXXXXX"
                  value={applicationData.personalInfo.phone}
                  onChange={(e) => handlePersonalInfoChange('phone', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Nationality</label>
                <Input
                  placeholder="e.g., British, International"
                  value={applicationData.personalInfo.nationality}
                  onChange={(e) => handlePersonalInfoChange('nationality', e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Additional Information</label>
              <Textarea
                placeholder="Any special requirements, medical needs, or other information we should know..."
                rows={4}
              />
            </div>

            <Button className="w-full">Save Application</Button>
          </CardContent>
        </Card>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Required Documents</CardTitle>
              <p className="text-sm text-gray-600">Upload all required documents to complete your application</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { key: 'passport', label: 'Passport/ID', required: true, description: 'Valid government-issued ID' },
                  { key: 'bankStatement', label: 'Bank Statement', required: true, description: 'Last 3-6 months' },
                  { key: 'studentLetter', label: 'University Letter', required: true, description: 'Acceptance or enrollment letter' },
                  { key: 'references', label: 'References', required: false, description: 'Academic or professional references' }
                ].map((doc) => (
                  <div key={doc.key} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        applicationData.documents[doc.key as keyof typeof applicationData.documents] 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        {applicationData.documents[doc.key as keyof typeof applicationData.documents] 
                          ? <CheckCircle className="w-5 h-5" />
                          : <Upload className="w-5 h-5" />
                        }
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{doc.label}</span>
                          {doc.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                        </div>
                        <p className="text-sm text-gray-600">{doc.description}</p>
                      </div>
                    </div>
                    <Button
                      variant={applicationData.documents[doc.key as keyof typeof applicationData.documents] ? "outline" : "default"}
                      onClick={() => handleDocumentUpload(doc.key)}
                    >
                      {applicationData.documents[doc.key as keyof typeof applicationData.documents] ? 'Uploaded' : 'Upload'}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-800">Document Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-blue-700">
                <li>• Documents should be clear, high-quality scans or photos</li>
                <li>• Bank statements must show sufficient funds (typically 9-12 months of rent)</li>
                <li>• International students may need certified translations</li>
                <li>• Keep original documents safe - you may need to present them</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI Chat Tab */}
      {activeTab === 'chat' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5" />
              <span>AI Application Assistant</span>
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
                placeholder="Ask about documents, tenancy rights, or application process..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleChatSend()}
              />
              <Button onClick={handleChatSend}>Send</Button>
            </div>

            {/* Quick Questions */}
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Quick Questions:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  'What documents do I need?',
                  'Do I need a guarantor?',
                  'How much deposit is typical?',
                  'What are my tenant rights?'
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

      {/* Status Tab */}
      {activeTab === 'status' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Application Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {applicationProgress.map((step, index) => (
                  <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      step.completed ? 'bg-green-500 text-white' : 
                      step.current ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'
                    }`}>
                      {step.completed ? <CheckCircle className="w-5 h-5" /> : <span>{index + 1}</span>}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{step.step}</h4>
                      <p className="text-sm text-gray-600">
                        {step.completed ? 'Completed' : step.current ? 'In Progress' : 'Pending'}
                      </p>
                    </div>
                    {step.current && (
                      <Badge variant="default">Current</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-yellow-50 border-yellow-200">
            <CardHeader>
              <CardTitle className="text-yellow-800 flex items-center space-x-2">
                <AlertCircle className="w-5 h-5" />
                <span>Next Steps</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-yellow-700">
                Complete your document upload to proceed to the next stage. 
                Our team will review your application within 2-3 business days.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CleanApplicationAssistant;
