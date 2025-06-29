import { spareRoomService } from './spareRoomService';
import { rightmoveService } from './rightmoveService';
import { gumtreeService } from './gumtreeService';
import { openRentService } from './openRentService';
import type { Property } from '../types/Property';

export interface SearchParams {
  location: string;
  maxPrice: number;
  minPrice: number;
  bedrooms: number;
  furnished: boolean;
  billsIncluded: boolean;
  availableFrom: string;
  radius: number;
}

interface PropertyService {
  searchProperties: (params: SearchParams) => Promise<Property[]>;
  getServiceInfo: () => { name: string; isConfigured: boolean };
}

export class PropertyServiceManager {
  private services: PropertyService[];

  constructor() {
    this.services = [
      spareRoomService,
      rightmoveService,
      gumtreeService,
      openRentService
    ];
  }

  public async searchAllServices(params: SearchParams): Promise<Property[]> {
    const results: Property[] = [];
    const promises = this.services.map(async (service) => {
      try {
        const serviceResults = await service.searchProperties(params);
        return serviceResults;
      } catch (error) {
        console.warn(`Service ${service.getServiceInfo().name} failed:`, error);
        return [];
      }
    });

    const allResults = await Promise.all(promises);
    allResults.forEach(serviceResults => {
      results.push(...serviceResults);
    });

    return results;
  }

  public async searchProperties(params: SearchParams): Promise<{ properties: Property[]; summary: Record<string, unknown> }> {
    const properties = await this.searchAllServices(params);
    return {
      properties,
      summary: {
        total: properties.length,
        sourceBreakdown: {
          spareroom: properties.filter(p => p.id.toString().includes('spare')).length,
          rightmove: properties.filter(p => p.id.toString().includes('right')).length,
          gumtree: properties.filter(p => p.id.toString().includes('gum')).length,
          openrent: properties.filter(p => p.id.toString().includes('open')).length
        }
      }
    };
  }

  getAvailableServices() {
    return this.services.map(service => service.getServiceInfo());
  }
}

export const propertyServiceManager = new PropertyServiceManager();
