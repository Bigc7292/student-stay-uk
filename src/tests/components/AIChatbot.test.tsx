// AIChatbot Component Tests
// Testing the AI chatbot functionality and error handling

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AIChatbot from '@/components/AIChatbot';
import { setupTest, teardownTest } from '../setup';

// Mock the AI service
vi.mock('@/services/aiService', () => ({
  aiService: {
    generateResponse: vi.fn(),
    setApiKey: vi.fn(),
    isAPIAvailable: vi.fn(() => true),
    getAPISetupInstructions: vi.fn(() => 'API is configured and ready to use.')
  }
}));

describe('AIChatbot', () => {
  beforeEach(() => {
    setupTest();
  });

  afterEach(() => {
    teardownTest();
  });

  describe('Component Rendering', () => {
    it('should render the chatbot interface', () => {
      render(<AIChatbot />);
      
      expect(screen.getByText('AI Student Housing Assistant')).toBeInTheDocument();
      expect(screen.getByText('24/7 Available')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Ask me anything about student accommodation...')).toBeInTheDocument();
    });

    it('should show initial welcome message', () => {
      render(<AIChatbot />);
      
      expect(screen.getByText(/Hello! I'm your AI assistant/)).toBeInTheDocument();
    });

    it('should display quick action buttons', () => {
      render(<AIChatbot />);
      
      expect(screen.getByText('How much should I budget for accommodation?')).toBeInTheDocument();
      expect(screen.getByText('What documents do I need for applications?')).toBeInTheDocument();
      expect(screen.getByText('Tell me about tenancy rights in the UK')).toBeInTheDocument();
      expect(screen.getByText('How do I find safe accommodation?')).toBeInTheDocument();
    });
  });

  describe('User Interaction', () => {
    it('should handle text input', async () => {
      const user = userEvent.setup();
      render(<AIChatbot />);
      
      const input = screen.getByPlaceholderText('Ask me anything about student accommodation...');
      await user.type(input, 'Hello, I need help finding accommodation');
      
      expect(input).toHaveValue('Hello, I need help finding accommodation');
    });

    it('should handle quick action clicks', async () => {
      const user = userEvent.setup();
      render(<AIChatbot />);
      
      const quickActionButton = screen.getByText('How much should I budget for accommodation?');
      await user.click(quickActionButton);
      
      const input = screen.getByPlaceholderText('Ask me anything about student accommodation...');
      expect(input).toHaveValue('How much should I budget for accommodation?');
    });

    it('should send message on Enter key press', async () => {
      const user = userEvent.setup();
      render(<AIChatbot />);
      
      const input = screen.getByPlaceholderText('Ask me anything about student accommodation...');
      await user.type(input, 'Test message');
      await user.keyboard('{Enter}');
      
      expect(input).toHaveValue(''); // Input should be cleared after sending
    });

    it('should not send empty messages', async () => {
      const user = userEvent.setup();
      render(<AIChatbot />);
      
      const sendButton = screen.getByRole('button', { name: /send/i });
      expect(sendButton).toBeDisabled();
      
      const input = screen.getByPlaceholderText('Ask me anything about student accommodation...');
      await user.type(input, '   '); // Only whitespace
      
      expect(sendButton).toBeDisabled();
    });
  });

  describe('Message Display', () => {
    it('should display user messages correctly', async () => {
      const user = userEvent.setup();
      render(<AIChatbot />);
      
      const input = screen.getByPlaceholderText('Ask me anything about student accommodation...');
      await user.type(input, 'Test user message');
      
      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);
      
      await waitFor(() => {
        expect(screen.getByText('Test user message')).toBeInTheDocument();
      });
    });

    it('should show typing indicator when processing', async () => {
      const user = userEvent.setup();
      
      // Mock a delayed response
      const { aiService } = await import('@/services/aiService');
      vi.mocked(aiService.generateResponse).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          content: 'AI response',
          confidence: 0.9,
          source: 'openai' as const
        }), 100))
      );
      
      render(<AIChatbot />);
      
      const input = screen.getByPlaceholderText('Ask me anything about student accommodation...');
      await user.type(input, 'Test message');
      
      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);
      
      // Should show typing indicator
      expect(screen.getByText('AI is thinking...')).toBeInTheDocument();
    });
  });

  describe('API Integration', () => {
    it('should handle successful AI responses', async () => {
      const user = userEvent.setup();
      
      const { aiService } = await import('@/services/aiService');
      vi.mocked(aiService.generateResponse).mockResolvedValue({
        content: 'This is an AI response about student accommodation.',
        confidence: 0.95,
        source: 'openai' as const
      });
      
      render(<AIChatbot />);
      
      const input = screen.getByPlaceholderText('Ask me anything about student accommodation...');
      await user.type(input, 'Help me find accommodation');
      
      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);
      
      await waitFor(() => {
        expect(screen.getByText('This is an AI response about student accommodation.')).toBeInTheDocument();
      });
    });

    it('should handle AI service errors gracefully', async () => {
      const user = userEvent.setup();
      
      const { aiService } = await import('@/services/aiService');
      vi.mocked(aiService.generateResponse).mockRejectedValue(new Error('API Error'));
      
      render(<AIChatbot />);
      
      const input = screen.getByPlaceholderText('Ask me anything about student accommodation...');
      await user.type(input, 'Test message');
      
      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);
      
      await waitFor(() => {
        expect(screen.getByText(/I apologize, but I'm having trouble processing your request/)).toBeInTheDocument();
      });
    });
  });

  describe('Settings Dialog', () => {
    it('should open settings dialog', async () => {
      const user = userEvent.setup();
      render(<AIChatbot />);
      
      const settingsButton = screen.getByRole('button', { name: /settings/i });
      await user.click(settingsButton);
      
      expect(screen.getByText('AI Settings')).toBeInTheDocument();
    });

    it('should handle API key input', async () => {
      const user = userEvent.setup();
      render(<AIChatbot />);
      
      const settingsButton = screen.getByRole('button', { name: /settings/i });
      await user.click(settingsButton);
      
      const apiKeyInput = screen.getByPlaceholderText(/Enter your OpenAI API key/);
      await user.type(apiKeyInput, 'test-api-key');
      
      expect(apiKeyInput).toHaveValue('test-api-key');
    });

    it('should save API key when button is clicked', async () => {
      const user = userEvent.setup();
      
      const { aiService } = await import('@/services/aiService');
      
      render(<AIChatbot />);
      
      const settingsButton = screen.getByRole('button', { name: /settings/i });
      await user.click(settingsButton);
      
      const apiKeyInput = screen.getByPlaceholderText(/Enter your OpenAI API key/);
      await user.type(apiKeyInput, 'test-api-key');
      
      const saveButton = screen.getByText('Save API Key');
      await user.click(saveButton);
      
      expect(aiService.setApiKey).toHaveBeenCalledWith('test-api-key');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<AIChatbot />);
      
      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<AIChatbot />);
      
      const input = screen.getByPlaceholderText('Ask me anything about student accommodation...');
      
      // Tab to input
      await user.tab();
      expect(input).toHaveFocus();
      
      // Type and press Enter
      await user.type(input, 'Test message{Enter}');
      
      expect(input).toHaveValue(''); // Should clear after sending
    });
  });

  describe('Knowledge Categories', () => {
    it('should display knowledge categories section', () => {
      render(<AIChatbot />);
      
      expect(screen.getByText('What I Can Help With')).toBeInTheDocument();
      expect(screen.getByText('Budgeting & Costs')).toBeInTheDocument();
      expect(screen.getByText('Legal Rights')).toBeInTheDocument();
      expect(screen.getByText('Applications')).toBeInTheDocument();
      expect(screen.getByText('Safety & Areas')).toBeInTheDocument();
    });
  });
});
