// AI Service using OpenAI API
export interface AIResponse {
  content: string;
  confidence: number;
  source: 'openai' | 'local' | 'fallback';
}

// OpenAI API configuration
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = 'gpt-3.5-turbo';

class AIService {
  private apiKey: string | null = null;
  private fallbackResponses: string[] = [
    "I'd be happy to help with that! Could you be more specific about what aspect of student accommodation you're interested in?",
    "That's a great question! For the most accurate information, I'd recommend checking with your university's accommodation services as well. What specific details can I help you with?",
    "I can help you with accommodation budgeting, legal rights, application processes, area research, and safety tips. What would you like to know more about?",
    "For complex legal or financial matters, I recommend consulting with your university's student support services or Citizens Advice Bureau. Is there a specific accommodation concern I can help address?"
  ];

  constructor() {
    // Try to get API key from environment or localStorage
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY ||
                  localStorage.getItem('openai_api_key') ||
                  null;

    console.log('🤖 AI Service initialized with OpenAI API key:', this.apiKey ? 'Present' : 'Missing');
  }

  // Set API key (users can add their own OpenAI API key)
  setApiKey(key: string) {
    this.apiKey = key;
    localStorage.setItem('openai_api_key', key);
    console.log('🔑 OpenAI API key updated');
  }

  // Enhanced context for student accommodation
  private getSystemContext(): string {
    return `You are an AI assistant specialized in UK student accommodation. You help students with:
- Finding suitable housing options
- Understanding tenancy rights and legal matters
- Budgeting and cost planning
- Application processes and required documents
- Safety and area research
- Maintenance and landlord issues
- International student specific concerns

Provide helpful, accurate, and practical advice. Keep responses concise but informative.`;
  }

  // Try OpenAI API first, fallback to local processing
  async generateResponse(userMessage: string, conversationHistory: string[] = []): Promise<AIResponse> {
    console.log('🤖 Generating AI response for:', userMessage.substring(0, 50) + '...');

    // Check if we should use OpenAI API (with quota management)
    if (this.apiKey && this.shouldUseOpenAI()) {
      try {
        const response = await this.callOpenAIAPI(userMessage, conversationHistory);
        if (response) {
          console.log('✅ OpenAI API response generated successfully');
          this.recordSuccessfulCall();
          return {
            content: response,
            confidence: 0.9,
            source: 'openai'
          };
        }
      } catch (error) {
        console.warn('❌ OpenAI API failed, falling back to local processing:', error);
        this.recordFailedCall(error);
      }
    } else {
      console.log('⚠️ Using local processing (API key missing or quota exceeded)');
    }

    // Fallback to enhanced local processing
    const localResponse = this.generateLocalResponse(userMessage);
    console.log('📝 Using local response');
    return {
      content: localResponse,
      confidence: 0.6,
      source: 'local'
    };
  }

  // Quota management methods
  private shouldUseOpenAI(): boolean {
    const lastError = localStorage.getItem('openai_last_error');
    const lastErrorTime = localStorage.getItem('openai_last_error_time');

    if (lastError && lastError.includes('insufficient_quota')) {
      const errorTime = parseInt(lastErrorTime || '0');
      const hoursSinceError = (Date.now() - errorTime) / (1000 * 60 * 60);

      // Wait 1 hour before retrying after quota error
      if (hoursSinceError < 1) {
        return false;
      }
    }

    return true;
  }

  private recordSuccessfulCall(): void {
    localStorage.removeItem('openai_last_error');
    localStorage.removeItem('openai_last_error_time');
  }

  private recordFailedCall(error: any): void {
    const errorMessage = error.toString();
    localStorage.setItem('openai_last_error', errorMessage);
    localStorage.setItem('openai_last_error_time', Date.now().toString());
  }

  private async callOpenAIAPI(userMessage: string, history: string[]): Promise<string | null> {
    if (!this.apiKey) return null;

    try {
      // Prepare conversation context
      const systemContext = this.getSystemContext();

      // Build conversation messages
      const messages = [
        {
          role: 'system',
          content: systemContext
        }
      ];

      // Add conversation history (last 6 messages for context)
      const recentHistory = history.slice(-6);
      for (let i = 0; i < recentHistory.length; i += 2) {
        if (recentHistory[i]) {
          messages.push({
            role: 'user',
            content: recentHistory[i]
          });
        }
        if (recentHistory[i + 1]) {
          messages.push({
            role: 'assistant',
            content: recentHistory[i + 1]
          });
        }
      }

      // Add current user message
      messages.push({
        role: 'user',
        content: userMessage
      });

      console.log('🔄 Calling OpenAI API...');
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages: messages,
          max_tokens: 300,
          temperature: 0.7,
          top_p: 0.9,
          frequency_penalty: 0.1,
          presence_penalty: 0.1
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`OpenAI API error! status: ${response.status}, message: ${errorData}`);
      }

      const data = await response.json();

      if (data.choices && data.choices[0] && data.choices[0].message) {
        const content = data.choices[0].message.content;
        return this.postProcessResponse(content);
      }

      return null;
    } catch (error) {
      console.error('❌ OpenAI API error:', error);
      return null;
    }
  }

  private generateLocalResponse(userMessage: string): string {
    const lowerMessage = userMessage.toLowerCase();
    
    // Enhanced keyword matching with more sophisticated responses
    const knowledgeBase = {
      budget: {
        keywords: ['budget', 'cost', 'price', 'money', 'afford', 'expensive', 'cheap', 'rent', 'bills'],
        responses: [
          "For UK student accommodation, budget around £400-800/month depending on location. London typically costs £600-1200/month, while northern cities like Manchester or Liverpool range £300-600/month. Don't forget additional costs like utilities (£50-100/month) and internet (£20-40/month).",
          "Consider shared accommodation to reduce costs significantly. A shared house typically costs £400-600/month compared to £600-1000/month for a studio apartment. Factor in council tax exemption for full-time students.",
          "Hidden costs to consider: contents insurance (£5-15/month), deposit (usually 1-6 weeks' rent), and potential agency fees. Always ask what's included in the rent before committing."
        ]
      },
      documents: {
        keywords: ['documents', 'application', 'paperwork', 'forms', 'ID', 'proof', 'requirements', 'visa'],
        responses: [
          "Essential documents for UK student accommodation: Valid passport/ID, university acceptance letter, proof of income/student finance, bank statements (3-6 months), and references. International students also need visa documentation and sometimes a UK guarantor.",
          "Prepare digital copies of all documents - most applications are now online. Ensure documents are recent (within 3 months) and officially translated if not in English. Consider using services like Housing Hand if you need a guarantor.",
          "Pro tip: Create a digital folder with all your documents ready to go. This speeds up applications significantly, especially in competitive markets where quick responses matter."
        ]
      },
      safety: {
        keywords: ['safe', 'security', 'dangerous', 'crime', 'area', 'neighborhood', 'scam'],
        responses: [
          "Research crime rates using police.uk, visit properties in person when possible, and check for working smoke/carbon monoxide alarms. Look for secure locks, well-lit entrances, and good transport links.",
          "Red flags to avoid: Landlords asking for money before viewing, prices significantly below market rate, no proper tenancy agreement, or unwillingness to provide deposit protection details. Always use reputable sources.",
          "For area research, check local Facebook groups, Reddit communities, and use Google Street View to explore neighborhoods. Consider proximity to your university, local amenities, and student population density."
        ]
      },
      legal: {
        keywords: ['rights', 'legal', 'tenancy', 'contract', 'lease', 'deposit', 'eviction', 'landlord'],
        responses: [
          "UK tenancy rights include: written tenancy agreement, deposit protection in government-approved schemes (DPS, MyDeposits, or TDS), 24-hour notice for landlord visits, and protection from unfair eviction.",
          "Your deposit must be protected within 30 days and you should receive scheme details. Most tenancies are Assured Shorthold Tenancies (AST), typically 6-12 months. Always read contracts carefully.",
          "Landlord responsibilities include structural repairs, heating/hot water systems, electrical safety, and gas safety certificates. Report issues in writing and keep records for your protection."
        ]
      }
    };

    // Find best matching category
    let bestMatch = { category: '', score: 0 };
    for (const [category, data] of Object.entries(knowledgeBase)) {
      const score = data.keywords.filter(keyword => lowerMessage.includes(keyword)).length;
      if (score > bestMatch.score) {
        bestMatch = { category, score };
      }
    }

    if (bestMatch.score > 0) {
      const responses = knowledgeBase[bestMatch.category as keyof typeof knowledgeBase].responses;
      return responses[Math.floor(Math.random() * responses.length)];
    }

    // Fallback responses
    return this.fallbackResponses[Math.floor(Math.random() * this.fallbackResponses.length)];
  }

  private postProcessResponse(response: string): string {
    // Clean up the response
    let cleaned = response.trim();
    
    // Remove any unwanted prefixes or suffixes
    cleaned = cleaned.replace(/^(Assistant:|AI:|Bot:)/i, '').trim();
    
    // Ensure it's not too long
    if (cleaned.length > 500) {
      cleaned = cleaned.substring(0, 500) + '...';
    }
    
    // Ensure it ends properly
    if (!cleaned.match(/[.!?]$/)) {
      cleaned += '.';
    }
    
    return cleaned;
  }

  // Check if API is available
  isAPIAvailable(): boolean {
    return !!this.apiKey;
  }

  // Get instructions for users to set up their own API key
  getAPISetupInstructions(): string {
    return `OpenAI API is already configured! Your AI assistant is ready to use with advanced GPT-3.5 capabilities.

If you want to use a different OpenAI API key:
1. Go to https://platform.openai.com/
2. Create an account or sign in
3. Go to API Keys section
4. Create a new API key
5. Add your key in the AI settings

Current status: ${this.apiKey ? '✅ OpenAI API key configured' : '❌ No API key found'}`;
  }
}

export const aiService = new AIService();
