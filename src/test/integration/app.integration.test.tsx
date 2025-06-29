
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import App from '../../App';

describe('App Integration Tests', () => {
  it('renders the application', () => {
    render(<App />);
    
    // Should render without crashing
    expect(document.body).toBeInTheDocument();
  });
});
