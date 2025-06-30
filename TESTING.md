# Testing Guide for StudentHome

This document provides comprehensive information about the testing setup and practices for the StudentHome application.

## Testing Stack

- **Test Runner**: Vitest (fast, modern alternative to Jest)
- **Testing Library**: React Testing Library (component testing)
- **User Interactions**: @testing-library/user-event
- **Mocking**: Vitest built-in mocking capabilities
- **Coverage**: V8 coverage provider
- **Environment**: jsdom (browser-like environment)

## Test Structure

```
src/
├── test/
│   ├── setup.ts              # Global test setup and mocks
│   ├── utils.tsx              # Test utilities and helpers
│   └── integration/           # Integration tests
├── components/
│   └── __tests__/            # Component unit tests
└── services/
    └── __tests__/            # Service unit tests
```

## Running Tests

### Basic Commands

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests once (CI mode)
npm run test:run

# Run with coverage report
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run tests with UI
npm run test:ui
```

### Test Categories

#### 1. Unit Tests
- **Location**: `src/components/__tests__/` and `src/services/__tests__/`
- **Purpose**: Test individual components and services in isolation
- **Coverage**: All major components and services

#### 2. Integration Tests
- **Location**: `src/test/integration/`
- **Purpose**: Test component interactions and data flow
- **Coverage**: End-to-end user workflows

## Test Coverage

### Current Coverage Areas

#### Components
- ✅ SearchForm - Complete search functionality
- ✅ InteractiveMaps - Maps and location features
- ✅ AuthDialog - Authentication flows
- ✅ UserProfile - Profile management
- ✅ PWAInstallPrompt - PWA installation
- ✅ PerformanceDashboard - Performance monitoring

#### Services
- ✅ authService - User authentication and management
- ✅ performanceService - Performance monitoring
- ✅ mapsService - Google Maps integration
- ✅ dataService - Real-time data fetching
- ✅ locationService - Location insights
- ✅ pwaService - PWA functionality

#### Integration Tests
- ✅ Navigation and routing
- ✅ User authentication flow
- ✅ Search functionality end-to-end
- ✅ Maps integration
- ✅ Cross-component data flow
- ✅ Error handling
- ✅ Performance tracking

### Coverage Goals
- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

## Writing Tests

### Component Testing Best Practices

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test/utils';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interactions', async () => {
    const user = userEvent.setup();
    render(<MyComponent />);
    
    const button = screen.getByRole('button', { name: /click me/i });
    await user.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Button clicked')).toBeInTheDocument();
    });
  });
});
```

### Service Testing Best Practices

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { myService } from '../myService';

describe('MyService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should perform operation successfully', async () => {
    const result = await myService.performOperation('test-data');
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  it('should handle errors gracefully', async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));
    
    await expect(myService.performOperation('test-data'))
      .rejects.toThrow('Network error');
  });
});
```

## Mocking Strategy

### Global Mocks (in setup.ts)
- Browser APIs (localStorage, sessionStorage, fetch)
- Google Maps API
- Performance API
- Service Worker API
- Notification API

### Service Mocks (in utils.tsx)
- Authentication service
- Maps service
- Data service
- Location service
- Performance service
- PWA service

### Component-Specific Mocks
- Use `vi.mock()` for external dependencies
- Mock heavy components with lazy loading
- Mock API calls and async operations

## Test Data

### Mock Data Available
- `mockUser` - Sample user object
- `mockAccommodations` - Sample accommodation listings
- `mockTransitInfo` - Sample transit information
- `mockSafetyData` - Sample safety data
- `mockCostOfLivingData` - Sample cost data
- `mockPerformanceMetrics` - Sample performance data

### Creating Test Data

```typescript
const testAccommodation = {
  id: 'test-1',
  title: 'Test Accommodation',
  price: 150,
  location: 'Test Location',
  type: 'studio',
  amenities: ['Wi-Fi', 'Kitchen'],
  rating: 4.0,
  available: true
};
```

## Continuous Integration

### GitHub Actions Workflow

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:run
      - run: npm run test:coverage
```

## Performance Testing

### Metrics Tracked
- Component render times
- API response times
- Bundle size impact
- Memory usage
- Core Web Vitals

### Performance Test Example

```typescript
it('should render within performance budget', async () => {
  const startTime = performance.now();
  render(<LargeComponent />);
  const endTime = performance.now();
  
  expect(endTime - startTime).toBeLessThan(100); // 100ms budget
});
```

## Accessibility Testing

### Tools Used
- @testing-library/jest-dom (accessibility matchers)
- Manual testing with screen readers
- Lighthouse accessibility audits

### Accessibility Test Example

```typescript
it('should be accessible', () => {
  render(<MyComponent />);
  
  const button = screen.getByRole('button', { name: /submit/i });
  expect(button).toBeInTheDocument();
  expect(button).not.toHaveAttribute('aria-disabled');
});
```

## Debugging Tests

### Common Issues
1. **Async operations not awaited**
   - Use `waitFor()` for async state changes
   - Use `findBy*` queries for elements that appear asynchronously

2. **Mocks not working**
   - Ensure mocks are cleared between tests
   - Check mock implementation matches expected interface

3. **DOM cleanup issues**
   - Tests should clean up after themselves
   - Use `afterEach()` for cleanup

### Debug Commands

```bash
# Run specific test file
npm run test SearchForm.test.tsx

# Run tests with verbose output
npm run test -- --reporter=verbose

# Run tests in debug mode
npm run test -- --inspect-brk
```

## Best Practices

### Do's
- ✅ Test user behavior, not implementation details
- ✅ Use semantic queries (getByRole, getByLabelText)
- ✅ Test error states and edge cases
- ✅ Keep tests focused and isolated
- ✅ Use descriptive test names
- ✅ Mock external dependencies

### Don'ts
- ❌ Test implementation details
- ❌ Use querySelector or getElementById
- ❌ Write tests that depend on other tests
- ❌ Mock everything (test real behavior when possible)
- ❌ Ignore accessibility in tests

## Maintenance

### Regular Tasks
- Review and update test coverage
- Update mocks when APIs change
- Refactor tests when components change
- Add tests for new features
- Remove tests for deprecated features

### Test Health Metrics
- Test execution time
- Flaky test detection
- Coverage trends
- Test maintenance burden

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Accessibility Testing](https://web.dev/accessibility-testing/)
