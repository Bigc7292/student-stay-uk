import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Mic, MicOff } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import './AvatarAssistant.css';

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

interface KnowledgeBaseEntry {
  greeting: string;
  budget: string;
  documents: string;
  legal: string;
  universities: string;
  safety: string;
  international: string;
  maintenance: string;
  insurance: string;
  transport: string;
}

// Try multiple Ready Player Me URLs for better compatibility
const READY_PLAYER_ME_URLS = [
  "https://demo.readyplayer.me/avatar?frameApi=1&clearColor=ffffff&cameraInitialDistance=3&cameraTarget=0,0.65,0.15&modelSrc=https://models.readyplayer.me/685c1ff416e8b16f5efbfcf8.glb",
  "https://render.readyplayer.me/685c1ff416e8b16f5efbfcf8.glb",
  "https://models.readyplayer.me/685c1ff416e8b16f5efbfcf8.glb"
];
const READY_PLAYER_ME_AVATAR_URL = READY_PLAYER_ME_URLS[0];

const AvatarAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isAvatarActive, setIsAvatarActive] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false); // State to manage chat window

  // Add missing refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  // Use correct type for SpeechRecognition
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  
  const languages: Language[] = [
    { code: 'en', name: 'English', voice: 'en-US', flag: '🇺🇸' },
    { code: 'es', name: 'Spanish', voice: 'es-ES', flag: '🇪🇸' },
    { code: 'fr', name: 'French', voice: 'fr-FR', flag: '🇫🇷' },
    { code: 'de', name: 'German', voice: 'de-DE', flag: '🇩🇪' },
    { code: 'zh', name: 'Mandarin', voice: 'zh-CN', flag: '🇨🇳' },
    { code: 'pt', name: 'Portuguese', voice: 'pt-PT', flag: '🇵🇹' },
    { code: 'it', name: 'Italian', voice: 'it-IT', flag: '🇮🇹' },
    { code: 'ja', name: 'Japanese', voice: 'ja-JP', flag: '🇯🇵' },
    { code: 'ko', name: 'Korean', voice: 'ko-KR', flag: '🇰🇷' },
    { code: 'hi', name: 'Hindi', voice: 'hi-IN', flag: '🇮🇳' },
  ];

  // Enhanced knowledge base with comprehensive student accommodation information
  const knowledgeBase = useMemo<Record<string, KnowledgeBaseEntry>>(() => ({
    en: {
      greeting: "Hello! I'm your AI Digital Avatar Assistant with comprehensive knowledge of UK student accommodation. I can help you in multiple languages with finding housing, understanding tenant rights, budgeting, legal advice, university information, and much more. I have access to real-time data and can assist with complex queries. How can I help you today?",
      budget: "For UK student accommodation budgeting: London typically costs £600-1200/month, Manchester £400-700/month, Birmingham £350-600/month, Leeds £300-550/month, Bristol £450-800/month. Consider bills (£40-80/month), council tax (usually exempt for full-time students), deposit (typically 1-6 weeks rent), and additional costs like contents insurance (£5-15/month).",
      documents: "Essential documents needed: Valid passport/ID, university acceptance letter (CAS for international students), UK visa (if applicable), bank statements (3-6 months showing financial support), proof of income/guarantor details, previous landlord references, DBS check (sometimes required), and student finance confirmation.",
      legal: "Your key tenant rights include: Written tenancy agreement, deposit protection in government-approved scheme, 24-hour notice for landlord inspections, protection from unfair eviction, right to live in safe and habitable conditions, protection from discrimination, and right to challenge unfair rent increases.",
      universities: "I have comprehensive data on over 130 UK universities including location details, accommodation options, campus facilities, student support services, and local area information. Which university are you interested in?",
      safety: "Student safety essentials: Check property safety certificates (gas, electrical, fire), ensure working smoke/CO detectors, verify secure locks and lighting, research neighborhood crime rates, join university safety schemes, and always inform someone of your whereabouts when viewing properties.",
      international: "For international students: Arrive early for accommodation search, understand UK rental terminology, know your visa restrictions, set up UK bank account promptly, register with GP and university, understand local customs, and join international student support groups.",
      maintenance: "Maintenance responsibilities: Landlord handles structural repairs, heating/hot water systems, electrical safety, and pest control. Tenants handle minor repairs, cleaning, garden maintenance (if specified), and reporting issues promptly. Always document problems with photos and keep communication records.",
      insurance: "Student accommodation insurance covers: Personal belongings (laptops, phones, clothes), public liability, accidental damage to landlord's property, and sometimes rent protection. Costs typically £5-20/month. University halls often include basic coverage.",
      transport: "Transport considerations: Check bus/train connections to university (aim for under 30 minutes commute), investigate student discount schemes, consider cycling infrastructure, evaluate walkability scores, and factor transport costs (£50-100/month) into your budget."
    },
    es: {
      greeting: "¡Hola! Soy tu Asistente Avatar Digital de IA con conocimiento integral sobre alojamiento estudiantil en Reino Unido. Puedo ayudarte en varios idiomas con búsqueda de vivienda, derechos de inquilinos, presupuesto, asesoría legal y mucho más. ¿Cómo puedo ayudarte hoy?",
      budget: "Para presupuesto de alojamiento estudiantil en Reino Unido: Londres típicamente cuesta £600-1200/mes, Manchester £400-700/mes, Birmingham £350-600/mes. Considera facturas (£40-80/mes), impuesto municipal (usualmente exento para estudiantes de tiempo completo).",
      documents: "Documentos esenciales necesarios: Pasaporte/ID válido, carta de aceptación universitaria, visa del Reino Unido (si aplica), estados de cuenta bancarios, prueba de ingresos/detalles del garante.",
      legal: "Tus derechos clave como inquilino incluyen: Contrato de arrendamiento escrito, protección de depósito, aviso de 24 horas para inspecciones del propietario, protección contra desalojo injusto.",
      universities: "Tengo datos completos sobre más de 130 universidades del Reino Unido incluyendo detalles de ubicación, opciones de alojamiento y servicios de apoyo estudiantil.",
      safety: "Aspectos esenciales de seguridad estudiantil: Verificar certificados de seguridad de la propiedad, asegurar detectores de humo funcionando, verificar cerraduras seguras.",
      international: "Para estudiantes internacionales: Llegar temprano para búsqueda de alojamiento, entender terminología de alquiler del Reino Unido, conocer restricciones de visa.",
      maintenance: "Responsabilidades de mantenimiento: El propietario maneja reparaciones estructurales, sistemas de calefacción/agua caliente, seguridad eléctrica y control de plagas.",
      insurance: "El seguro de alojamiento estudiantil cubre: Pertenencias personales, responsabilidad pública, daños accidentales a la propiedad del propietario.",
      transport: "Consideraciones de transporte: Verificar conexiones de autobús/tren a la universidad, investigar esquemas de descuento estudiantil, considerar infraestructura ciclista."
    }
  }), []);

  // API simulation for real-time data
  const simulateAPICall = async (query: string, language: string) => {
    setIsProcessing(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    setIsProcessing(false);
    
    // Enhanced AI response generation
    return generateIntelligentResponse(query, language);
  };

  const generateIntelligentResponse = (userMessage: string, language: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    const langKnowledge = knowledgeBase[language] || knowledgeBase.en;
    
    // Advanced keyword matching and context understanding
    if (lowerMessage.includes('budget') || lowerMessage.includes('cost') || lowerMessage.includes('price') || lowerMessage.includes('money') || lowerMessage.includes('afford')) {
      return langKnowledge.budget;
    }
    
    if (lowerMessage.includes('document') || lowerMessage.includes('application') || lowerMessage.includes('paperwork') || lowerMessage.includes('visa') || lowerMessage.includes('requirements')) {
      return langKnowledge.documents;
    }
    
    if (lowerMessage.includes('rights') || lowerMessage.includes('legal') || lowerMessage.includes('law') || lowerMessage.includes('tenant') || lowerMessage.includes('landlord')) {
      return langKnowledge.legal;
    }
    
    if (lowerMessage.includes('university') || lowerMessage.includes('college') || lowerMessage.includes('campus') || lowerMessage.includes('education')) {
      return langKnowledge.universities;
    }
    
    if (lowerMessage.includes('safety') || lowerMessage.includes('security') || lowerMessage.includes('safe') || lowerMessage.includes('crime')) {
      return langKnowledge.safety;
    }
    
    if (lowerMessage.includes('international') || lowerMessage.includes('foreign') || lowerMessage.includes('overseas') || lowerMessage.includes('visa')) {
      return langKnowledge.international;
    }
    
    if (lowerMessage.includes('maintenance') || lowerMessage.includes('repair') || lowerMessage.includes('broken') || lowerMessage.includes('fix')) {
      return langKnowledge.maintenance;
    }
    
    if (lowerMessage.includes('insurance') || lowerMessage.includes('coverage') || lowerMessage.includes('protection') || lowerMessage.includes('belongings')) {
      return langKnowledge.insurance;
    }
    
    if (lowerMessage.includes('transport') || lowerMessage.includes('travel') || lowerMessage.includes('commute') || lowerMessage.includes('bus') || lowerMessage.includes('train')) {
      return langKnowledge.transport;
    }
    
    // Contextual responses based on conversation flow
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('help')) {
      return langKnowledge.greeting;
    }
    
    // Default intelligent response
    const defaultResponses = {
      en: "I understand your question about student accommodation. I have extensive knowledge on housing, legal rights, budgeting, university information, and international student support. Could you be more specific about what aspect you'd like help with? I can provide detailed guidance on any accommodation-related topic.",
      es: "Entiendo tu pregunta sobre alojamiento estudiantil. Tengo conocimiento extenso sobre vivienda, derechos legales, presupuesto, información universitaria y apoyo para estudiantes internacionales. ¿Podrías ser más específico sobre qué aspecto necesitas ayuda?",
      fr: "Je comprends votre question sur le logement étudiant. J'ai des connaissances approfondies sur le logement, les droits légaux, le budget, les informations universitaires et le soutien aux étudiants internationaux. Pourriez-vous être plus précis sur l'aspect pour lequel vous souhaitez de l'aide?",
      de: "Ich verstehe Ihre Frage zur Studentenunterkunft. Ich habe umfassende Kenntnisse über Wohnungen, Rechte, Budgetplanung, Universitätsinformationen und Unterstützung für internationale Studenten. Könnten Sie spezifischer sein, bei welchem Aspekt Sie Hilfe benötigen?",
      zh: "我理解您关于学生住宿的问题。我在住房、法律权利、预算、大学信息和国际学生支持方面有广泛的知识。您能更具体地说明需要帮助的方面吗？"
    };
    
    return defaultResponses[language as keyof typeof defaultResponses] || defaultResponses.en;
  };

  useEffect(() => {
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }

    // Polyfill for SpeechRecognition (browser only)
    const SpeechRecognitionCtor = (window as Window & { SpeechRecognition?: new () => MinimalSpeechRecognition; webkitSpeechRecognition?: new () => MinimalSpeechRecognition; }).SpeechRecognition ||
      (window as Window & { SpeechRecognition?: new () => MinimalSpeechRecognition; webkitSpeechRecognition?: new () => MinimalSpeechRecognition; }).webkitSpeechRecognition;
    recognitionRef.current = SpeechRecognitionCtor ? new SpeechRecognitionCtor() : null;
    if (recognitionRef.current) {
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.onresult = (event: BrowserSpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        handleVoiceInput(transcript);
      };
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    const greeting = knowledgeBase[currentLanguage]?.greeting || knowledgeBase.en.greeting;
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
  }, [currentLanguage, knowledgeBase]);

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

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      isUser: true,
      timestamp: new Date(),
      language: currentLanguage
    };

    setMessages(prev => [...prev, userMessage]);
    
    // Enhanced AI processing with API simulation
    try {
      const response = await simulateAPICall(inputMessage, currentLanguage);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        isUser: false,
        timestamp: new Date(),
        language: currentLanguage
      };

      setMessages(prev => [...prev, aiMessage]);
      speak(response, currentLanguage);
    } catch (error) {
      console.error('Error processing message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.",
        isUser: false,
        timestamp: new Date(),
        language: currentLanguage
      };
      setMessages(prev => [...prev, errorMessage]);
    }

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
    const greeting = knowledgeBase[langCode]?.greeting || knowledgeBase.en.greeting;
    
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

  // Only render the floating avatar button if chat is closed
  if (!isChatOpen) {
    return (
      <button
        className="avatar-assistant-fab"
        aria-label="Open AI Assistant"
        onClick={() => {
          console.log('Avatar clicked! Opening chat...');
          setIsChatOpen(true);
        }}
      >
        {/* Simple bouncy emoji avatar - reliable and fun! */}
        <div className="bouncy-avatar">
          🤖
        </div>
        {isSpeaking && (
          <div className="avatar-assistant-talking">
            Talking...
          </div>
        )}
      </button>
    );
  }

  return (
    <div className="avatar-assistant-chat-modal">
      <div className="avatar-assistant-chat-header">
        <div className="avatar-assistant-chat-header-left">
          <div className="chat-header-avatar">
            🤖
          </div>
          <span className="avatar-assistant-chat-header-title">AI Assistant</span>
        </div>
        <button onClick={() => setIsChatOpen(false)} aria-label="Close chat" className="avatar-assistant-chat-close">&times;</button>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
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
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="avatar-assistant-chat-input-row">
        <Input
          value={inputMessage}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputMessage(e.target.value)}
          onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && !isProcessing && handleSendMessage()}
          placeholder={`Ask me anything about student accommodation in ${currentLang.name}...`}
          className="flex-1"
          disabled={isProcessing}
        />
        <Button
          variant={isListening ? "destructive" : "outline"}
          size="sm"
          onClick={isListening ? stopListening : startListening}
          disabled={!recognitionRef.current || isProcessing}
        >
          {isListening ? (<MicOff className="w-4 h-4" />) : (<Mic className="w-4 h-4" />)}
        </Button>
        <Button 
          onClick={handleSendMessage} 
          disabled={!inputMessage.trim() || isProcessing}
        >
          <MessageSquare className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default AvatarAssistant;

// Minimal fallback types for browsers without TS lib dom support
interface MinimalSpeechRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: MinimalSpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
interface MinimalSpeechRecognitionEvent extends Event {
  results: Array<Array<{ transcript: string }>>;
}

type BrowserSpeechRecognition = MinimalSpeechRecognition;
type BrowserSpeechRecognitionEvent = MinimalSpeechRecognitionEvent;
