
import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, MessageSquare, User, Settings, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  language: string;
}

interface Language {
  code: string;
  name: string;
  voice: string;
  flag: string;
}

const AvatarAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isAvatarActive, setIsAvatarActive] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const languages: Language[] = [
    { code: 'en', name: 'English', voice: 'en-US', flag: '🇺🇸' },
    { code: 'es', name: 'Spanish', voice: 'es-ES', flag: '🇪🇸' },
    { code: 'fr', name: 'French', voice: 'fr-FR', flag: '🇫🇷' },
    { code: 'de', name: 'German', voice: 'de-DE', flag: '🇩🇪' },
    { code: 'zh', name: 'Mandarin', voice: 'zh-CN', flag: '🇨🇳' },
    { code: 'pt', name: 'Portuguese', voice: 'pt-PT', flag: '🇵🇹' },
    { code: 'it', name: 'Italian', voice: 'it-IT', flag: '🇮🇹' },
  ];

  // Multilingual responses database
  const responses = {
    en: {
      greeting: "Hello! I'm your AI student accommodation assistant. I can help you in multiple languages with finding housing, understanding your rights, budgeting, and much more. How can I assist you today?",
      budget: "For UK student accommodation, budget around £400-800/month depending on location. London typically costs £600-1200/month, while northern cities like Manchester cost £300-600/month.",
      documents: "You'll need: passport/ID, university acceptance letter, bank statements (3-6 months), proof of income, and references. International students also need visa documentation.",
      legal: "Your rights include: written tenancy agreement, deposit protection, 24-hour notice for landlord visits, and protection from unfair eviction.",
    },
    es: {
      greeting: "¡Hola! Soy tu asistente de IA para alojamiento estudiantil. Puedo ayudarte en varios idiomas con la búsqueda de vivienda, entender tus derechos, presupuesto y mucho más. ¿Cómo puedo asistirte hoy?",
      budget: "Para alojamiento estudiantil en Reino Unido, presupuesta entre £400-800/mes dependiendo de la ubicación. Londres típicamente cuesta £600-1200/mes, mientras que ciudades del norte como Manchester cuestan £300-600/mes.",
      documents: "Necesitarás: pasaporte/ID, carta de aceptación universitaria, extractos bancarios (3-6 meses), prueba de ingresos y referencias. Estudiantes internacionales también necesitan documentación de visa.",
      legal: "Tus derechos incluyen: contrato de arrendamiento escrito, protección de depósito, aviso de 24 horas para visitas del propietario, y protección contra desalojo injusto.",
    },
    fr: {
      greeting: "Bonjour ! Je suis votre assistant IA pour le logement étudiant. Je peux vous aider dans plusieurs langues pour trouver un logement, comprendre vos droits, budgétiser et bien plus. Comment puis-je vous aider aujourd'hui ?",
      budget: "Pour le logement étudiant au Royaume-Uni, budgétez environ £400-800/mois selon l'emplacement. Londres coûte généralement £600-1200/mois, tandis que les villes du nord comme Manchester coûtent £300-600/mois.",
      documents: "Vous aurez besoin de : passeport/ID, lettre d'acceptation universitaire, relevés bancaires (3-6 mois), preuve de revenus et références. Les étudiants internationaux ont aussi besoin de documentation de visa.",
      legal: "Vos droits incluent : contrat de location écrit, protection du dépôt, préavis de 24 heures pour les visites du propriétaire, et protection contre l'expulsion injuste.",
    },
    de: {
      greeting: "Hallo! Ich bin Ihr KI-Assistent für Studentenunterkünfte. Ich kann Ihnen in mehreren Sprachen bei der Wohnungssuche, dem Verständnis Ihrer Rechte, der Budgetplanung und vielem mehr helfen. Wie kann ich Ihnen heute helfen?",
      budget: "Für britische Studentenunterkünfte budgetieren Sie etwa £400-800/Monat je nach Standort. London kostet typischerweise £600-1200/Monat, während nördliche Städte wie Manchester £300-600/Monat kosten.",
      documents: "Sie benötigen: Reisepass/Ausweis, Universitätszulassung, Bankauszüge (3-6 Monate), Einkommensnachweis und Referenzen. Internationale Studenten benötigen auch Visa-Dokumentation.",
      legal: "Ihre Rechte umfassen: schriftlichen Mietvertrag, Kautionsschutz, 24-Stunden-Ankündigung für Vermieterbesuche und Schutz vor unrechtmäßiger Kündigung.",
    },
    zh: {
      greeting: "您好！我是您的AI学生住宿助手。我可以用多种语言帮助您寻找住房、了解您的权利、预算规划等等。今天我能为您做些什么？",
      budget: "英国学生住宿预算大约每月£400-800，取决于位置。伦敦通常每月£600-1200，而曼彻斯特等北部城市每月£300-600。",
      documents: "您需要：护照/身份证、大学录取通知书、银行对账单（3-6个月）、收入证明和推荐信。国际学生还需要签证文件。",
      legal: "您的权利包括：书面租赁协议、押金保护、房东访问需24小时通知、保护免受不公平驱逐。",
    }
  };

  useEffect(() => {
    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }

    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        handleVoiceInput(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    // Add initial greeting
    const greeting = responses[currentLanguage as keyof typeof responses]?.greeting || responses.en.greeting;
    setMessages([{
      id: '1',
      content: greeting,
      isUser: false,
      timestamp: new Date(),
      language: currentLanguage
    }]);

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const speak = (text: string, language: string) => {
    if (!synthRef.current || isMuted) return;

    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    const selectedLang = languages.find(lang => lang.code === language);
    if (selectedLang) {
      utterance.lang = selectedLang.voice;
    }
    
    utterance.volume = volume;
    utterance.rate = 0.9;
    utterance.pitch = 1;
    
    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsAvatarActive(true);
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
      setIsAvatarActive(false);
    };
    
    synthRef.current.speak(utterance);
  };

  const generateResponse = (userMessage: string, language: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    const langResponses = responses[language as keyof typeof responses] || responses.en;
    
    if (lowerMessage.includes('budget') || lowerMessage.includes('cost') || lowerMessage.includes('price') || lowerMessage.includes('presupuesto') || lowerMessage.includes('budget') || lowerMessage.includes('预算')) {
      return langResponses.budget;
    } else if (lowerMessage.includes('document') || lowerMessage.includes('application') || lowerMessage.includes('documento') || lowerMessage.includes('文件')) {
      return langResponses.documents;
    } else if (lowerMessage.includes('rights') || lowerMessage.includes('legal') || lowerMessage.includes('derechos') || lowerMessage.includes('权利')) {
      return langResponses.legal;
    }
    
    // Default responses by language
    const defaultResponses = {
      en: "I understand your question about student accommodation. Could you be more specific so I can provide better assistance?",
      es: "Entiendo tu pregunta sobre alojamiento estudiantil. ¿Podrías ser más específico para poder brindarte mejor asistencia?",
      fr: "Je comprends votre question sur le logement étudiant. Pourriez-vous être plus précis pour que je puisse mieux vous aider?",
      de: "Ich verstehe Ihre Frage zur Studentenunterkunft. Könnten Sie spezifischer sein, damit ich Ihnen besser helfen kann?",
      zh: "我理解您关于学生住宿的问题。您能更具体一些吗，这样我能提供更好的帮助？"
    };
    
    return defaultResponses[language as keyof typeof defaultResponses] || defaultResponses.en;
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      isUser: true,
      timestamp: new Date(),
      language: currentLanguage
    };

    setMessages(prev => [...prev, userMessage]);
    
    setTimeout(() => {
      const response = generateResponse(inputMessage, currentLanguage);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        isUser: false,
        timestamp: new Date(),
        language: currentLanguage
      };

      setMessages(prev => [...prev, aiMessage]);
      speak(response, currentLanguage);
    }, 1000);

    setInputMessage('');
  };

  const handleVoiceInput = (transcript: string) => {
    setInputMessage(transcript);
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      const selectedLang = languages.find(lang => lang.code === currentLanguage);
      if (selectedLang) {
        recognitionRef.current.lang = selectedLang.voice;
      }
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const handleLanguageChange = (langCode: string) => {
    setCurrentLanguage(langCode);
    const greeting = responses[langCode as keyof typeof responses]?.greeting || responses.en.greeting;
    
    const aiMessage: Message = {
      id: Date.now().toString(),
      content: greeting,
      isUser: false,
      timestamp: new Date(),
      language: langCode
    };

    setMessages(prev => [...prev, aiMessage]);
    speak(greeting, langCode);
  };

  const currentLang = languages.find(lang => lang.code === currentLanguage) || languages[0];

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Avatar className={`w-12 h-12 transition-all duration-300 ${isAvatarActive ? 'ring-4 ring-blue-400 ring-opacity-50 scale-110' : ''}`}>
                  <AvatarImage src="/api/placeholder/150/150" />
                  <AvatarFallback className={`bg-gradient-to-r from-blue-500 to-purple-500 text-white ${isSpeaking ? 'animate-pulse' : ''}`}>
                    AI
                  </AvatarFallback>
                </Avatar>
                {isSpeaking && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                )}
              </div>
              <div>
                <h3 className="font-bold">AI Digital Avatar Assistant</h3>
                <p className="text-sm text-gray-600">Multilingual Student Housing Expert</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="flex items-center space-x-1">
                <span>{currentLang.flag}</span>
                <span>{currentLang.name}</span>
              </Badge>
              <Badge variant={isSpeaking ? "default" : "outline"}>
                {isSpeaking ? "Speaking" : "Ready"}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="h-[500px] flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Conversation</h4>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMuted(!isMuted)}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        message.isUser
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
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
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="flex space-x-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={`Type your message in ${currentLang.name}...`}
                  className="flex-1"
                />
                <Button
                  variant={isListening ? "destructive" : "outline"}
                  size="sm"
                  onClick={isListening ? stopListening : startListening}
                  disabled={!recognitionRef.current}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
                <Button onClick={handleSendMessage} disabled={!inputMessage.trim()}>
                  <MessageSquare className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="w-5 h-5" />
                <span>Language Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Select Language</label>
                <Select value={currentLanguage} onValueChange={handleLanguageChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        <div className="flex items-center space-x-2">
                          <span>{lang.flag}</span>
                          <span>{lang.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Voice Volume</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Quick Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { text: "Budget advice", key: "budget" },
                { text: "Required documents", key: "documents" },
                { text: "Tenant rights", key: "legal" },
                { text: "Safety tips", key: "safety" }
              ].map((action) => (
                <Button
                  key={action.key}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setInputMessage(action.text)}
                >
                  {action.text}
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Avatar Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Speech Recognition:</span>
                  <Badge variant={recognitionRef.current ? "default" : "secondary"}>
                    {recognitionRef.current ? "Available" : "Not Supported"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Text-to-Speech:</span>
                  <Badge variant={synthRef.current ? "default" : "secondary"}>
                    {synthRef.current ? "Available" : "Not Supported"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Current Status:</span>
                  <Badge variant={isAvatarActive ? "default" : "outline"}>
                    {isAvatarActive ? "Active" : "Idle"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AvatarAssistant;
