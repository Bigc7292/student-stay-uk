
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AIChatbot from '../../components/AIChatbot';

// Mock services
vi.mock('../../services/aiService', () => ({
  aiService: {
    sendMessage: vi.fn(),
    isConfigured: vi.fn(() => true),
    getAvailableModels: vi.fn(() => ['gpt-3.5-turbo']),
    getCurrentModel: vi.fn(() => 'gpt-3.5-turbo'),
    setModel: vi.fn()
  }
}));

describe('AIChatbot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders chatbot interface', () => {
    render(<AIChatbot />);
    expect(screen.getByRole('region', { name: /ai assistant/i })).toBeInTheDocument();
  });

  it('displays welcome message', () => {
    render(<AIChatbot />);
    expect(screen.getByText(/hello! i'm your ai assistant/i)).toBeInTheDocument();
  });

  it('handles user input', async () => {
    render(<AIChatbot />);
    const input = screen.getByPlaceholderText(/ask me anything/i);
    const sendButton = screen.getByRole('button', { name: /send/i });

    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });
  });
});
