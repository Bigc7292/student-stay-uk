# Contributing to StudentHome

Thank you for your interest in contributing to StudentHome! This guide will help you get started with contributing to our AI-powered student accommodation platform.

## 🌟 Ways to Contribute

- **Bug Reports**: Help us identify and fix issues
- **Feature Requests**: Suggest new features or improvements
- **Code Contributions**: Submit bug fixes or new features
- **Documentation**: Improve our documentation
- **Testing**: Help test new features and report issues
- **Accessibility**: Improve accessibility and WCAG compliance
- **Translations**: Help make the app available in more languages

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or Yarn
- Git
- Modern web browser
- Basic knowledge of React, TypeScript, and web development

### Development Setup

1. **Fork the repository**
   ```bash
   # Click the "Fork" button on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/student-stay-uk.git
   cd student-stay-uk
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API keys (optional for most development)
   ```

4. **Start development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Run tests**
   ```bash
   npm run test
   # or
   yarn test
   ```

## 📋 Development Workflow

### 1. Create a Branch
```bash
# Create a new branch for your feature/fix
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-description
```

### 2. Make Changes
- Follow our coding standards (see below)
- Write tests for new functionality
- Update documentation as needed
- Ensure accessibility compliance

### 3. Test Your Changes
```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run accessibility tests
npm run test:accessibility

# Test the build
npm run build && npm run preview
```

### 4. Commit Your Changes
```bash
# Stage your changes
git add .

# Commit with a descriptive message
git commit -m "feat: add accommodation filtering by amenities"
```

### 5. Push and Create Pull Request
```bash
# Push to your fork
git push origin feature/your-feature-name

# Create a pull request on GitHub
```

## 📝 Coding Standards

### TypeScript Guidelines
- Use strict TypeScript configuration
- Define interfaces for all data structures
- Use proper type annotations
- Avoid `any` type unless absolutely necessary

```typescript
// Good
interface User {
  id: string;
  name: string;
  email: string;
}

const getUser = (id: string): Promise<User> => {
  return fetchUser(id);
};

// Avoid
const getUser = (id: any): any => {
  return fetchUser(id);
};
```

### React Guidelines
- Use functional components with hooks
- Follow the single responsibility principle
- Use proper prop types and default values
- Implement proper error boundaries

```typescript
// Good
interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  onClick, 
  variant = 'primary',
  disabled = false 
}) => {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant}`}
      aria-disabled={disabled}
    >
      {children}
    </button>
  );
};
```

### CSS/Styling Guidelines
- Use Tailwind CSS utility classes
- Follow mobile-first responsive design
- Ensure sufficient color contrast (4.5:1 minimum)
- Use semantic class names for custom CSS

```typescript
// Good
<div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
  <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
    Primary Action
  </button>
</div>
```

### Accessibility Guidelines
- Use semantic HTML elements
- Provide proper ARIA labels and descriptions
- Ensure keyboard navigation works
- Test with screen readers
- Maintain proper heading hierarchy

```typescript
// Good
<nav role="navigation" aria-label="Main navigation">
  <ul>
    <li>
      <a href="/search" aria-current={currentPage === 'search' ? 'page' : undefined}>
        Search
      </a>
    </li>
  </ul>
</nav>

<button 
  onClick={handleSubmit}
  aria-describedby="submit-help"
  disabled={isLoading}
>
  {isLoading ? 'Submitting...' : 'Submit'}
</button>
<div id="submit-help" className="sr-only">
  Click to submit the form
</div>
```

## 🧪 Testing Guidelines

### Unit Tests
- Test individual components and functions
- Use React Testing Library for component tests
- Mock external dependencies
- Aim for 80%+ code coverage

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('should call onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button onClick={() => {}} disabled>Click me</Button>);
    
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### Integration Tests
- Test component interactions
- Test user workflows
- Test API integrations with mocks

### Accessibility Tests
- Use @testing-library/jest-dom matchers
- Test keyboard navigation
- Test screen reader compatibility

```typescript
it('should be accessible', () => {
  render(<SearchForm />);
  
  const searchInput = screen.getByLabelText(/search for accommodations/i);
  expect(searchInput).toBeInTheDocument();
  expect(searchInput).toHaveAttribute('aria-required', 'true');
});
```

## 📚 Documentation Guidelines

### Code Documentation
- Use JSDoc comments for functions and components
- Document complex logic and algorithms
- Include examples for public APIs

```typescript
/**
 * Calculates the commute time between two locations
 * @param origin - Starting location coordinates
 * @param destination - Destination location coordinates
 * @param mode - Transportation mode (walking, driving, transit)
 * @returns Promise resolving to commute information
 * @example
 * ```typescript
 * const commute = await calculateCommute(
 *   { lat: 53.4808, lng: -2.2426 },
 *   { lat: 53.4670, lng: -2.2340 },
 *   'walking'
 * );
 * ```
 */
async function calculateCommute(
  origin: Coordinates,
  destination: Coordinates,
  mode: TransportMode
): Promise<CommuteInfo> {
  // Implementation
}
```

### README Updates
- Update feature lists when adding new features
- Update installation instructions if needed
- Add new environment variables to documentation

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Clear description** of the issue
2. **Steps to reproduce** the bug
3. **Expected behavior** vs actual behavior
4. **Screenshots** or videos if applicable
5. **Environment information**:
   - Browser and version
   - Operating system
   - Device type (desktop/mobile)
   - Screen reader (if applicable)

### Bug Report Template
```markdown
## Bug Description
A clear description of what the bug is.

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior
What you expected to happen.

## Actual Behavior
What actually happened.

## Screenshots
If applicable, add screenshots to help explain your problem.

## Environment
- Browser: [e.g. Chrome 91, Firefox 89]
- OS: [e.g. Windows 10, macOS 11.4]
- Device: [e.g. Desktop, iPhone 12]
- Screen Reader: [e.g. NVDA, VoiceOver] (if applicable)

## Additional Context
Any other context about the problem.
```

## 💡 Feature Requests

When suggesting features, please include:

1. **Problem statement** - What problem does this solve?
2. **Proposed solution** - How should it work?
3. **User stories** - Who benefits and how?
4. **Acceptance criteria** - How do we know it's done?
5. **Mockups or wireframes** (if applicable)

## 🔍 Code Review Process

### For Contributors
- Ensure your code follows our standards
- Write comprehensive tests
- Update documentation
- Keep pull requests focused and small
- Respond to feedback promptly

### Review Criteria
- **Functionality**: Does it work as intended?
- **Code Quality**: Is it readable and maintainable?
- **Performance**: Does it impact app performance?
- **Accessibility**: Does it maintain WCAG compliance?
- **Security**: Are there any security concerns?
- **Testing**: Are there adequate tests?

## 🏷️ Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples
```
feat(search): add filtering by amenities
fix(maps): resolve marker clustering issue
docs(api): update authentication documentation
style(components): improve button hover states
refactor(services): simplify data fetching logic
test(auth): add user registration tests
chore(deps): update dependencies
```

## 🎯 Priority Labels

We use labels to prioritize issues and pull requests:

- **Priority: Critical** - Security issues, major bugs
- **Priority: High** - Important features, significant bugs
- **Priority: Medium** - Nice-to-have features, minor bugs
- **Priority: Low** - Documentation, cleanup tasks

## 🤝 Community Guidelines

### Be Respectful
- Use inclusive language
- Be constructive in feedback
- Help newcomers get started
- Celebrate contributions

### Be Collaborative
- Share knowledge and resources
- Ask questions when unclear
- Offer help to others
- Participate in discussions

### Be Professional
- Keep discussions on-topic
- Avoid personal attacks
- Respect different opinions
- Follow the code of conduct

## 📞 Getting Help

- **GitHub Discussions**: For general questions and discussions
- **GitHub Issues**: For bug reports and feature requests
- **Email**: contribute@studenthome.com
- **Discord**: [Join our community](https://discord.gg/studenthome)

## 🏆 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- Annual contributor highlights
- Special badges for long-term contributors

## 📄 License

By contributing to StudentHome, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to StudentHome! Together, we're making student accommodation search better for everyone. 🏠✨
