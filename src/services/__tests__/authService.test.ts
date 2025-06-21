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
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        university: 'University of Manchester'
      };

      const user = await authService.register(userData);

      expect(user).toBeDefined();
      expect(user.name).toBe(userData.name);
      expect(user.email).toBe(userData.email);
      expect(user.preferences.university).toBe(userData.university);
      expect(user.id).toBeDefined();
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it('should not register user with existing email', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        university: 'University of Manchester'
      };

      // Register first user
      await authService.register(userData);

      // Try to register with same email
      await expect(authService.register(userData)).rejects.toThrow('User already exists');
    });

    it('should validate required fields', async () => {
      const incompleteData = {
        name: 'Test User',
        email: '',
        password: 'password123',
        university: 'University of Manchester'
      };

      await expect(authService.register(incompleteData)).rejects.toThrow('All fields are required');
    });

    it('should validate email format', async () => {
      const invalidEmailData = {
        name: 'Test User',
        email: 'invalid-email',
        password: 'password123',
        university: 'University of Manchester'
      };

      await expect(authService.register(invalidEmailData)).rejects.toThrow('Invalid email format');
    });

    it('should validate password length', async () => {
      const shortPasswordData = {
        name: 'Test User',
        email: 'test@example.com',
        password: '123',
        university: 'University of Manchester'
      };

      await expect(authService.register(shortPasswordData)).rejects.toThrow('Password must be at least 6 characters');
    });
  });

  describe('User Login', () => {
    beforeEach(async () => {
      // Register a test user
      await authService.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        university: 'University of Manchester'
      });
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
      await authService.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        university: 'University of Manchester'
      });

      const currentUser = authService.getCurrentUser();
      expect(currentUser).toBeDefined();
      expect(currentUser!.email).toBe('test@example.com');
    });

    it('should logout user successfully', async () => {
      await authService.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        university: 'University of Manchester'
      });

      expect(authService.getCurrentUser()).toBeDefined();

      await authService.logout();

      expect(authService.getCurrentUser()).toBeNull();
    });

    it('should persist user session in localStorage', async () => {
      const user = await authService.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        university: 'University of Manchester'
      });

      const storedUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
      expect(storedUser).toBeDefined();
      expect(storedUser.id).toBe(user.id);
    });
  });

  describe('Profile Management', () => {
    let testUser: any;

    beforeEach(async () => {
      testUser = await authService.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        university: 'University of Manchester'
      });
    });

    it('should update user profile', async () => {
      const updates = {
        name: 'Updated Name',
        preferences: {
          ...testUser.preferences,
          budget: 250,
          location: 'London'
        }
      };

      const updatedUser = await authService.updateProfile(updates);

      expect(updatedUser.name).toBe('Updated Name');
      expect(updatedUser.preferences.budget).toBe(250);
      expect(updatedUser.preferences.location).toBe('London');
    });

    it('should not allow email updates', async () => {
      const updates = {
        email: 'newemail@example.com'
      };

      await expect(authService.updateProfile(updates)).rejects.toThrow('Email cannot be updated');
    });

    it('should save search to user profile', async () => {
      const searchData = {
        location: 'Manchester',
        budget: 200,
        roomType: 'studio',
        amenities: ['Wi-Fi', 'Laundry'],
        timestamp: new Date()
      };

      await authService.saveSearch(searchData);

      const currentUser = authService.getCurrentUser();
      expect(currentUser!.savedSearches).toHaveLength(1);
      expect(currentUser!.savedSearches[0].location).toBe('Manchester');
    });

    it('should limit saved searches to 10', async () => {
      // Save 12 searches
      for (let i = 0; i < 12; i++) {
        await authService.saveSearch({
          location: `Location ${i}`,
          budget: 200,
          roomType: 'studio',
          amenities: [],
          timestamp: new Date()
        });
      }

      const currentUser = authService.getCurrentUser();
      expect(currentUser!.savedSearches).toHaveLength(10);
      expect(currentUser!.savedSearches[0].location).toBe('Location 11'); // Most recent first
    });
  });

  describe('Favorites Management', () => {
    let testUser: any;

    beforeEach(async () => {
      testUser = await authService.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        university: 'University of Manchester'
      });
    });

    it('should add accommodation to favorites', async () => {
      const accommodationId = 'acc-123';
      await authService.addToFavorites(accommodationId);

      const favorites = await authService.getFavorites();
      expect(favorites).toContain(accommodationId);
    });

    it('should remove accommodation from favorites', async () => {
      const accommodationId = 'acc-123';
      await authService.addToFavorites(accommodationId);
      await authService.removeFromFavorites(accommodationId);

      const favorites = await authService.getFavorites();
      expect(favorites).not.toContain(accommodationId);
    });

    it('should not add duplicate favorites', async () => {
      const accommodationId = 'acc-123';
      await authService.addToFavorites(accommodationId);
      await authService.addToFavorites(accommodationId);

      const favorites = await authService.getFavorites();
      expect(favorites.filter(id => id === accommodationId)).toHaveLength(1);
    });

    it('should return empty array for new user favorites', async () => {
      const favorites = await authService.getFavorites();
      expect(favorites).toEqual([]);
    });
  });

  describe('Auth State Changes', () => {
    it('should notify listeners on login', async () => {
      const listener = vi.fn();
      const unsubscribe = authService.onAuthStateChange(listener);

      await authService.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        university: 'University of Manchester'
      });

      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        email: 'test@example.com'
      }));

      unsubscribe();
    });

    it('should notify listeners on logout', async () => {
      const listener = vi.fn();
      
      await authService.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        university: 'University of Manchester'
      });

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

      await authService.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        university: 'University of Manchester'
      });

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();

      unsubscribe1();
      unsubscribe2();
    });
  });
});
