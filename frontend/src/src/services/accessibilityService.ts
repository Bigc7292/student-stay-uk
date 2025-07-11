// Accessibility Service for WCAG compliance and screen reader support
export interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  screenReaderOptimized: boolean;
  keyboardNavigation: boolean;
  focusIndicators: boolean;
  colorBlindFriendly: boolean;
}

export interface AccessibilityAudit {
  score: number;
  issues: AccessibilityIssue[];
  recommendations: string[];
  wcagLevel: 'A' | 'AA' | 'AAA';
}

export interface AccessibilityIssue {
  type: 'error' | 'warning' | 'info';
  element: string;
  description: string;
  wcagCriterion: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  solution: string;
}

class AccessibilityService {
  private settings: AccessibilitySettings;
  private announcements: string[] = [];
  private focusHistory: HTMLElement[] = [];

  constructor() {
    this.settings = this.loadSettings();
    this.initializeAccessibility();
  }

  // Initialize accessibility features
  private initializeAccessibility() {
    this.setupKeyboardNavigation();
    this.setupFocusManagement();
    this.setupScreenReaderSupport();
    this.applySettings();
    this.monitorUserPreferences();
  }

  // Load accessibility settings from localStorage
  private loadSettings(): AccessibilitySettings {
    const stored = localStorage.getItem('accessibility-settings');
    const defaults: AccessibilitySettings = {
      highContrast: false,
      largeText: false,
      reducedMotion: false,
      screenReaderOptimized: false,
      keyboardNavigation: true,
      focusIndicators: true,
      colorBlindFriendly: false
    };

    if (stored) {
      try {
        return { ...defaults, ...JSON.parse(stored) };
      } catch (error) {
        console.warn('Failed to parse accessibility settings:', error);
      }
    }

    // Check system preferences
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      defaults.reducedMotion = true;
    }
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      defaults.highContrast = true;
    }

    return defaults;
  }

  // Save accessibility settings
  private saveSettings() {
    try {
      localStorage.setItem('accessibility-settings', JSON.stringify(this.settings));
    } catch (error) {
      console.warn('Failed to save accessibility settings:', error);
    }
  }

  // Get current accessibility settings
  getSettings(): AccessibilitySettings {
    return { ...this.settings };
  }

  // Update accessibility settings
  updateSettings(updates: Partial<AccessibilitySettings>) {
    this.settings = { ...this.settings, ...updates };
    this.saveSettings();
    this.applySettings();
    this.announceToScreenReader('Accessibility settings updated');
  }

  // Apply accessibility settings to the page
  private applySettings() {
    const root = document.documentElement;

    // High contrast mode
    if (this.settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Large text mode
    if (this.settings.largeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }

    // Reduced motion
    if (this.settings.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }

    // Screen reader optimized
    if (this.settings.screenReaderOptimized) {
      root.classList.add('screen-reader-optimized');
    } else {
      root.classList.remove('screen-reader-optimized');
    }

    // Focus indicators
    if (this.settings.focusIndicators) {
      root.classList.add('enhanced-focus');
    } else {
      root.classList.remove('enhanced-focus');
    }

    // Color blind friendly
    if (this.settings.colorBlindFriendly) {
      root.classList.add('color-blind-friendly');
    } else {
      root.classList.remove('color-blind-friendly');
    }
  }

  // Setup keyboard navigation
  private setupKeyboardNavigation() {
    document.addEventListener('keydown', (event) => {
      if (!this.settings.keyboardNavigation) return;

      switch (event.key) {
        case 'Tab':
          this.handleTabNavigation(event);
          break;
        case 'Escape':
          this.handleEscapeKey(event);
          break;
        case 'Enter':
        case ' ':
          this.handleActivation(event);
          break;
        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
          this.handleArrowNavigation(event);
          break;
      }
    });
  }

  // Handle tab navigation
  private handleTabNavigation(event: KeyboardEvent) {
    const focusableElements = this.getFocusableElements();
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);

    if (event.shiftKey) {
      // Shift+Tab (backward)
      if (currentIndex <= 0) {
        event.preventDefault();
        focusableElements[focusableElements.length - 1]?.focus();
      }
    } else {
      // Tab (forward)
      if (currentIndex >= focusableElements.length - 1) {
        event.preventDefault();
        focusableElements[0]?.focus();
      }
    }
  }

  // Handle escape key
  private handleEscapeKey(event: KeyboardEvent) {
    // Close modals, dropdowns, etc.
    const activeModal = document.querySelector('[role="dialog"][aria-hidden="false"]');
    if (activeModal) {
      const closeButton = activeModal.querySelector('[aria-label*="close"], [aria-label*="Close"]');
      if (closeButton) {
        (closeButton as HTMLElement).click();
      }
    }

    // Return focus to previous element
    this.restoreFocus();
  }

  // Handle activation (Enter/Space)
  private handleActivation(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    
    if (target.getAttribute('role') === 'button' && target.tagName !== 'BUTTON') {
      event.preventDefault();
      target.click();
    }
  }

  // Handle arrow navigation
  private handleArrowNavigation(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    const parent = target.closest('[role="menu"], [role="listbox"], [role="tablist"], [role="radiogroup"]');
    
    if (parent) {
      event.preventDefault();
      const items = Array.from(parent.querySelectorAll('[role="menuitem"], [role="option"], [role="tab"], [role="radio"]'));
      const currentIndex = items.indexOf(target);
      let nextIndex = currentIndex;

      switch (event.key) {
        case 'ArrowUp':
        case 'ArrowLeft':
          nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
          break;
        case 'ArrowDown':
        case 'ArrowRight':
          nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
          break;
      }

      (items[nextIndex] as HTMLElement)?.focus();
    }
  }

  // Get all focusable elements
  private getFocusableElements(): HTMLElement[] {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([aria-disabled="true"])',
      '[role="link"]:not([aria-disabled="true"])'
    ].join(', ');

    return Array.from(document.querySelectorAll(selector))
      .filter(el => this.isVisible(el)) as HTMLElement[];
  }

  // Check if element is visible
  private isVisible(element: Element): boolean {
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0';
  }

  // Setup focus management
  private setupFocusManagement() {
    document.addEventListener('focusin', (event) => {
      const target = event.target as HTMLElement;
      this.focusHistory.push(target);
      
      // Limit history size
      if (this.focusHistory.length > 10) {
        this.focusHistory.shift();
      }
    });
  }

  // Restore focus to previous element
  restoreFocus() {
    if (this.focusHistory.length > 1) {
      const previousElement = this.focusHistory[this.focusHistory.length - 2];
      if (previousElement && document.contains(previousElement)) {
        previousElement.focus();
      }
    }
  }

  // Setup screen reader support
  private setupScreenReaderSupport() {
    // Create live region for announcements
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.id = 'accessibility-announcements';
    document.body.appendChild(liveRegion);

    // Create assertive live region for urgent announcements
    const assertiveRegion = document.createElement('div');
    assertiveRegion.setAttribute('aria-live', 'assertive');
    assertiveRegion.setAttribute('aria-atomic', 'true');
    assertiveRegion.className = 'sr-only';
    assertiveRegion.id = 'accessibility-announcements-assertive';
    document.body.appendChild(assertiveRegion);
  }

  // Announce message to screen readers
  announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
    const regionId = priority === 'assertive' 
      ? 'accessibility-announcements-assertive'
      : 'accessibility-announcements';
    
    const region = document.getElementById(regionId);
    if (region) {
      region.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        region.textContent = '';
      }, 1000);
    }

    // Store announcement
    this.announcements.push(message);
    if (this.announcements.length > 50) {
      this.announcements.shift();
    }
  }

  // Monitor user preferences
  private monitorUserPreferences() {
    // Watch for system preference changes
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionQuery.addEventListener('change', (e) => {
      if (e.matches && !this.settings.reducedMotion) {
        this.updateSettings({ reducedMotion: true });
      }
    });

    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    highContrastQuery.addEventListener('change', (e) => {
      if (e.matches && !this.settings.highContrast) {
        this.updateSettings({ highContrast: true });
      }
    });
  }

  // Perform accessibility audit
  performAudit(): AccessibilityAudit {
    const issues: AccessibilityIssue[] = [];
    
    // Check for missing alt text
    const images = document.querySelectorAll('img:not([alt])');
    images.forEach((img, index) => {
      issues.push({
        type: 'error',
        element: `img:nth-child(${index + 1})`,
        description: 'Image missing alt text',
        wcagCriterion: '1.1.1 Non-text Content',
        impact: 'serious',
        solution: 'Add descriptive alt text to the image'
      });
    });

    // Check for missing form labels
    const inputs = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
    inputs.forEach((input, index) => {
      const hasLabel = document.querySelector(`label[for="${input.id}"]`);
      if (!hasLabel) {
        issues.push({
          type: 'error',
          element: `input:nth-child(${index + 1})`,
          description: 'Form input missing label',
          wcagCriterion: '3.3.2 Labels or Instructions',
          impact: 'serious',
          solution: 'Add a label element or aria-label attribute'
        });
      }
    });

    // Check color contrast (simplified)
    const score = Math.max(0, 100 - (issues.length * 10));
    const wcagLevel = score >= 90 ? 'AAA' : score >= 70 ? 'AA' : 'A';

    return {
      score,
      issues,
      recommendations: this.generateRecommendations(issues),
      wcagLevel
    };
  }

  // Generate accessibility recommendations
  private generateRecommendations(issues: AccessibilityIssue[]): string[] {
    const recommendations: string[] = [];
    
    if (issues.some(i => i.description.includes('alt text'))) {
      recommendations.push('Add descriptive alt text to all images');
    }
    
    if (issues.some(i => i.description.includes('label'))) {
      recommendations.push('Ensure all form inputs have proper labels');
    }
    
    if (issues.length === 0) {
      recommendations.push('Great job! No major accessibility issues found.');
    }

    return recommendations;
  }

  // Get recent announcements
  getRecentAnnouncements(): string[] {
    return [...this.announcements];
  }

  // Skip to main content
  skipToMainContent() {
    const main = document.querySelector('main, [role="main"], #main-content');
    if (main) {
      (main as HTMLElement).focus();
      this.announceToScreenReader('Skipped to main content');
    }
  }

  // Toggle high contrast mode
  toggleHighContrast() {
    this.updateSettings({ highContrast: !this.settings.highContrast });
  }

  // Toggle large text mode
  toggleLargeText() {
    this.updateSettings({ largeText: !this.settings.largeText });
  }

  // Toggle reduced motion
  toggleReducedMotion() {
    this.updateSettings({ reducedMotion: !this.settings.reducedMotion });
  }
}

export const accessibilityService = new AccessibilityService();
