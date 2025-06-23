
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authService } from '../authService';

describe('AuthService', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const name = 'Test User';

      const user = await authService.register(email, password, name);

      expect(user).toBeDefined();
      expect(user.name).toBe(name);
      expect(user.email).toBe(email);
      expect(user.id).toBeDefined();
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it('should not register user with existing email', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const name = 'Test User';

      // Register first user
      await authService.register(email, password, name);

      // Try to register with same email
      await expect(authService.register(email, password, name)).rejects.toThrow('User already exists');
    });

    it('should validate required fields', async () => {
      await expect(authService.register('', 'password123', 'Test User')).rejects.toThrow('All fields are required');
    });

    it('should validate email format', async () => {
      await expect(authService.register('invalid-email', 'password123', 'Test User')).rejects.toThrow('Invalid email format');
    });

    it('should validate password length', async () => {
      await expect(authService.register('test@example.com', '123', 'Test User')).rejects.toThrow('Password must be at least 6 characters');
    });
  });

  describe('User Login', () => {
    beforeEach(async () => {
      // Register a test user
      await authService.register('test@example.com', 'password123', 'Test User');
      authService.logout(); // Logout after registration
    });

    it('should login with correct credentials', async () => {
      const user = await authService.login('test@example.com', 'password123');

      expect(user).toBeDefined();
      expect(user.email).toBe('test@example.com');
      expect(user.lastLogin).toBeInstanceOf(Date);
    });

    it('should not login with incorrect email', async () => {
      await expect(authService.login('wrong@example.com', 'password123')).rejects.toThrow('Invalid credentials');
    });

    it('should not login with incorrect password', async () => {
      await expect(authService.login('test@example.com', 'wrongpassword')).rejects.toThrow('Invalid credentials');
    });

    it('should update last login time', async () => {
      const user = await authService.login('test@example.com', 'password123');
      const loginTime = user.lastLogin.getTime();

      // Wait a bit and login again
      await new Promise(resolve => setTimeout(resolve, 10));
      const user2 = await authService.login('test@example.com', 'password123');

      expect(user2.lastLogin.getTime()).toBeGreaterThan(loginTime);
    });
  });

  describe('User Session Management', () => {
    it('should return null when no user is logged in', () => {
      const currentUser = authService.getCurrentUser();
      expect(currentUser).toBeNull();
    });

    it('should return current user when logged in', async () => {
      await authService.register('test@example.com', 'password123', 'Test User');

      const currentUser = authService.getCurrentUser();
      expect(currentUser).toBeDefined();
      expect(currentUser!.email).toBe('test@example.com');
    });

    it('should logout user successfully', async () => {
      await authService.register('test@example.com', 'password123', 'Test User');

      expect(authService.getCurrentUser()).toBeDefined();

      await authService.logout();

      expect(authService.getCurrentUser()).toBeNull();
    });

    it('should persist user session in localStorage', async () => {
      const user = await authService.register('test@example.com', 'password123', 'Test User');

      const storedUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
      expect(storedUser).toBeDefined();
      expect(storedUser.id).toBe(user.id);
    });
  });

  describe('Basic Profile Management', () => {
    let testUser: any;

    beforeEach(async () => {
      testUser = await authService.register('test@example.com', 'password123', 'Test User');
    });

    it('should get current user profile', () => {
      const currentUser = authService.getCurrentUser();
      expect(currentUser).toBeDefined();
      expect(currentUser!.email).toBe('test@example.com');
      expect(currentUser!.name).toBe('Test User');
    });
  });

  describe('Auth State Changes', () => {
    it('should notify listeners on login', async () => {
      const listener = vi.fn();
      const unsubscribe = authService.onAuthStateChange(listener);

      await authService.register('test@example.com', 'password123', 'Test User');

      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        email: 'test@example.com'
      }));

      unsubscribe();
    });

    it('should notify listeners on logout', async () => {
      const listener = vi.fn();
      
      await authService.register('test@example.com', 'password123', 'Test User');

      const unsubscribe = authService.onAuthStateChange(listener);
      
      await authService.logout();

      expect(listener).toHaveBeenCalledWith(null);

      unsubscribe();
    });

    it('should allow multiple listeners', async () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      
      const unsubscribe1 = authService.onAuthStateChange(listener1);
      const unsubscribe2 = authService.onAuthStateChange(listener2);

      await authService.register('test@example.com', 'password123', 'Test User');

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();

      unsubscribe1();
      unsubscribe2();
    });
  });
});
