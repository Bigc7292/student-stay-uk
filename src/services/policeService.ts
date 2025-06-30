// UK Police API Service
// Free API - no authentication required
// Documentation: https://data.police.uk/docs/

interface PoliceForce {
  id: string;
  name: string;
}

interface Neighbourhood {
  id: string;
  name: string;
}

interface CrimeLocation {
  latitude: string;
  longitude: string;
  street: {
    id: number;
    name: string;
  };
}

interface CrimeOutcome {
  category: string;
  date: string;
}

interface Crime {
  category: string;
  persistent_id: string;
  location_subtype: string;
  id: number;
  location: CrimeLocation;
  context: string;
  month: string;
  location_type: string;
  outcome_status: CrimeOutcome | null;
}

interface CrimeStats {
  totalCrimes: number;
  crimesByCategory: Record<string, number>;
  mostCommonCrime: string;
  safetyScore: number; // 1-10 scale (10 = safest)
  lastUpdated: string;
}

class PoliceService {
  private readonly baseUrl = 'https://data.police.uk/api';
  private readonly timeout = 10000; // 10 seconds

  // Get all police forces
  async getPoliceForces(): Promise<PoliceForce[]> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/forces`);
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch police forces:', error);
      return [];
    }
  }

  // Get neighbourhoods for a specific force
  async getNeighbourhoods(forceId: string): Promise<Neighbourhood[]> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/${forceId}/neighbourhoods`);
      return await response.json();
    } catch (error) {
      console.error(`Failed to fetch neighbourhoods for force ${forceId}:`, error);
      return [];
    }
  }

  // Get street-level crimes for a specific location
  async getCrimesAtLocation(lat: number, lng: number, date?: string): Promise<Crime[]> {
    try {
      const params = new URLSearchParams({
        lat: lat.toString(),
        lng: lng.toString(),
      });
      
      if (date) {
        params.append('date', date);
      }

      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/crimes-street/all-crime?${params.toString()}`
      );
      
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch crimes at location:', error);
      return [];
    }
  }

  // Get crimes within a custom area (polygon)
  async getCrimesInArea(coordinates: Array<{lat: number, lng: number}>, date?: string): Promise<Crime[]> {
    try {
      const poly = coordinates
        .map(coord => `${coord.lat},${coord.lng}`)
        .join(':');

      const params = new URLSearchParams({ poly });
      
      if (date) {
        params.append('date', date);
      }

      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/crimes-street/all-crime?${params.toString()}`
      );
      
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch crimes in area:', error);
      return [];
    }
  }

  // Get crime statistics and safety analysis
  async getCrimeStats(lat: number, lng: number, radiusMonths: number = 6): Promise<CrimeStats> {
    try {
      const promises: Promise<Crime[]>[] = [];
      const currentDate = new Date();

      // Get crime data for the last N months
      for (let i = 0; i < radiusMonths; i++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        promises.push(this.getCrimesAtLocation(lat, lng, dateString));
      }

      const crimeArrays = await Promise.all(promises);
      const allCrimes = crimeArrays.flat();

      // Analyze crime data
      const crimesByCategory: Record<string, number> = {};
      
      allCrimes.forEach(crime => {
        const category = crime.category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        crimesByCategory[category] = (crimesByCategory[category] || 0) + 1;
      });

      const totalCrimes = allCrimes.length;
      const mostCommonCrime = Object.entries(crimesByCategory)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'No data';

      // Calculate safety score (simplified algorithm)
      // Lower crime count = higher safety score
      const avgCrimesPerMonth = totalCrimes / radiusMonths;
      let safetyScore = 10;
      
      if (avgCrimesPerMonth > 50) safetyScore = 3;
      else if (avgCrimesPerMonth > 30) safetyScore = 5;
      else if (avgCrimesPerMonth > 15) safetyScore = 7;
      else if (avgCrimesPerMonth > 5) safetyScore = 8;

      return {
        totalCrimes,
        crimesByCategory,
        mostCommonCrime,
        safetyScore,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to get crime statistics:', error);
      return {
        totalCrimes: 0,
        crimesByCategory: {},
        mostCommonCrime: 'Data unavailable',
        safetyScore: 5,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  // Get safety recommendations based on crime data
  async getSafetyRecommendations(lat: number, lng: number): Promise<string[]> {
    try {
      const stats = await this.getCrimeStats(lat, lng);
      const recommendations: string[] = [];

      if (stats.safetyScore <= 5) {
        recommendations.push('⚠️ Higher crime area - exercise extra caution, especially at night');
        recommendations.push('🚶‍♀️ Consider walking in groups and stick to well-lit areas');
        recommendations.push('📱 Keep emergency contacts readily available');
      }

      if (stats.crimesByCategory['Anti Social Behaviour'] > 5) {
        recommendations.push('🏠 Be aware of potential anti-social behaviour in the area');
      }

      if (stats.crimesByCategory['Bicycle Theft'] > 3) {
        recommendations.push('🚲 Secure bicycles with high-quality locks and consider indoor storage');
      }

      if (stats.crimesByCategory['Burglary'] > 2) {
        recommendations.push('🏠 Ensure proper home security measures are in place');
      }

      if (stats.crimesByCategory['Vehicle Crime'] > 3) {
        recommendations.push('🚗 Be cautious about vehicle security and parking locations');
      }

      if (recommendations.length === 0) {
        recommendations.push('✅ This appears to be a relatively safe area');
        recommendations.push('🌟 Continue following standard safety precautions');
      }

      return recommendations;
    } catch (error) {
      console.error('Failed to get safety recommendations:', error);
      return ['⚠️ Unable to assess safety data at this time'];
    }
  }

  // Helper method for fetch with timeout
  private async fetchWithTimeout(url: string): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Check if the service is available
  async isServiceAvailable(): Promise<boolean> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/forces`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const policeService = new PoliceService();
export type { Crime, CrimeStats, PoliceForce, Neighbourhood };
