// Authentication Service with local storage and optional Firebase Auth
export interface User {
  id: string;
  email: string;
  name: string;
  preferences: UserPreferences;
  applicationHistory: ApplicationRecord[];
  savedSearches: SavedSearch[];
  createdAt: Date;
  lastLogin: Date;
}

export interface UserPreferences {
  preferredLocation: string;
  maxBudget: number;
  accommodationType: 'shared' | 'studio' | 'ensuite' | 'any';
  amenities: string[];
  university: string;
  notifications: {
    email: boolean;
    newListings: boolean;
    priceAlerts: boolean;
  };
}

export interface ApplicationRecord {
  id: string;
  accommodationName: string;
  status: 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected';
  submittedAt: Date;
  documents: string[];
}

export interface SavedSearch {
  id: string;
  name: string;
  criteria: {
    location: string;
    maxPrice: number;
    minPrice: number;
    amenities: string[];
    university: string;
  };
  alertsEnabled: boolean;
  createdAt: Date;
}

class AuthService {
  private currentUser: User | null = null;
  private listeners: ((user: User | null) => void)[] = [];
  private storageKey = 'studenthome_user';

  constructor() {
    this.loadUserFromStorage();
  }

  // Load user from localStorage
  private loadUserFromStorage() {
    try {
      const userData = localStorage.getItem(this.storageKey);
      if (userData) {
        const parsed = JSON.parse(userData);
        // Convert date strings back to Date objects
        parsed.createdAt = new Date(parsed.createdAt);
        parsed.lastLogin = new Date(parsed.lastLogin);
        parsed.applicationHistory = parsed.applicationHistory.map((app: any) => ({
          ...app,
          submittedAt: new Date(app.submittedAt)
        }));
        parsed.savedSearches = parsed.savedSearches.map((search: any) => ({
          ...search,
          createdAt: new Date(search.createdAt)
        }));
        this.currentUser = parsed;
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Failed to load user from storage:', error);
      localStorage.removeItem(this.storageKey);
    }
  }

  // Save user to localStorage
  private saveUserToStorage() {
    if (this.currentUser) {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(this.currentUser));
      } catch (error) {
        console.error('Failed to save user to storage:', error);
      }
    }
  }

  // Register new user
  async register(email: string, password: string, name: string): Promise<User> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if user already exists
    const existingUsers = this.getAllUsers();
    if (existingUsers.some(user => user.email === email)) {
      throw new Error('User with this email already exists');
    }

    const newUser: User = {
      id: this.generateId(),
      email,
      name,
      preferences: {
        preferredLocation: '',
        maxBudget: 800,
        accommodationType: 'any',
        amenities: [],
        university: '',
        notifications: {
          email: true,
          newListings: true,
          priceAlerts: true
        }
      },
      applicationHistory: [],
      savedSearches: [],
      createdAt: new Date(),
      lastLogin: new Date()
    };

    // Save to localStorage (in real app, this would be sent to server)
    this.saveUserToAllUsers(newUser);
    this.currentUser = newUser;
    this.saveUserToStorage();
    this.notifyListeners();

    return newUser;
  }

  // Login user
  async login(email: string, password: string): Promise<User> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const users = this.getAllUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
      throw new Error('User not found');
    }

    // In a real app, you'd verify the password hash
    // For demo purposes, we'll accept any password

    user.lastLogin = new Date();
    this.updateUserInAllUsers(user);
    this.currentUser = user;
    this.saveUserToStorage();
    this.notifyListeners();

    return user;
  }

  // Logout user
  logout() {
    this.currentUser = null;
    localStorage.removeItem(this.storageKey);
    this.notifyListeners();
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  // Update user preferences
  async updatePreferences(preferences: Partial<UserPreferences>): Promise<void> {
    if (!this.currentUser) throw new Error('No user logged in');

    this.currentUser.preferences = { ...this.currentUser.preferences, ...preferences };
    this.saveUserToStorage();
    this.updateUserInAllUsers(this.currentUser);
    this.notifyListeners();
  }

  // Add application record
  async addApplicationRecord(record: Omit<ApplicationRecord, 'id'>): Promise<void> {
    if (!this.currentUser) throw new Error('No user logged in');

    const newRecord: ApplicationRecord = {
      ...record,
      id: this.generateId()
    };

    this.currentUser.applicationHistory.push(newRecord);
    this.saveUserToStorage();
    this.updateUserInAllUsers(this.currentUser);
    this.notifyListeners();
  }

  // Add saved search
  async addSavedSearch(search: Omit<SavedSearch, 'id' | 'createdAt'>): Promise<void> {
    if (!this.currentUser) throw new Error('No user logged in');

    const newSearch: SavedSearch = {
      ...search,
      id: this.generateId(),
      createdAt: new Date()
    };

    this.currentUser.savedSearches.push(newSearch);
    this.saveUserToStorage();
    this.updateUserInAllUsers(this.currentUser);
    this.notifyListeners();
  }

  // Remove saved search
  async removeSavedSearch(searchId: string): Promise<void> {
    if (!this.currentUser) throw new Error('No user logged in');

    this.currentUser.savedSearches = this.currentUser.savedSearches.filter(s => s.id !== searchId);
    this.saveUserToStorage();
    this.updateUserInAllUsers(this.currentUser);
    this.notifyListeners();
  }

  // Subscribe to auth state changes
  onAuthStateChange(callback: (user: User | null) => void): () => void {
    this.listeners.push(callback);
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Helper methods
  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentUser));
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private getAllUsers(): User[] {
    try {
      const users = localStorage.getItem('studenthome_all_users');
      return users ? JSON.parse(users) : [];
    } catch {
      return [];
    }
  }

  private saveUserToAllUsers(user: User) {
    const users = this.getAllUsers();
    users.push(user);
    localStorage.setItem('studenthome_all_users', JSON.stringify(users));
  }

  private updateUserInAllUsers(updatedUser: User) {
    const users = this.getAllUsers();
    const index = users.findIndex(u => u.id === updatedUser.id);
    if (index !== -1) {
      users[index] = updatedUser;
      localStorage.setItem('studenthome_all_users', JSON.stringify(users));
    }
  }

  // Demo data for testing
  createDemoUser(): User {
    const demoUser: User = {
      id: 'demo-user',
      email: 'demo@studenthome.com',
      name: 'Demo Student',
      preferences: {
        preferredLocation: 'Manchester',
        maxBudget: 600,
        accommodationType: 'shared',
        amenities: ['Wi-Fi', 'Laundry', 'Gym'],
        university: 'University of Manchester',
        notifications: {
          email: true,
          newListings: true,
          priceAlerts: true
        }
      },
      applicationHistory: [
        {
          id: 'app-1',
          accommodationName: 'City Centre Student Studios',
          status: 'under_review',
          submittedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          documents: ['passport', 'bank_statement', 'uni_letter']
        }
      ],
      savedSearches: [
        {
          id: 'search-1',
          name: 'Manchester Budget Options',
          criteria: {
            location: 'Manchester',
            maxPrice: 600,
            minPrice: 400,
            amenities: ['Wi-Fi', 'Laundry'],
            university: 'University of Manchester'
          },
          alertsEnabled: true,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        }
      ],
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      lastLogin: new Date()
    };

    this.currentUser = demoUser;
    this.saveUserToStorage();
    this.notifyListeners();
    return demoUser;
  }
}

export const authService = new AuthService();
