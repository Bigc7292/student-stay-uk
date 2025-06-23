import { SpareRoomService, spareRoomService } from './spareRoomService';
import { RightmoveService, rightmoveService } from './rightmoveService';
import { ZooplaService, zooplaService } from './zooplaService';
import { FacebookMarketplaceService, facebookMarketplaceService } from './facebookMarketplaceService';
import { GumtreeService, gumtreeService } from './gumtreeService';
import { OpenRentService, openRentService } from './openRentService';
import { IdealFlatmateService, idealFlatmateService } from './idealFlatmateService';
import { Property } from '@/types/property';

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
      zooplaService,
      facebookMarketplaceService,
      gumtreeService,
      openRentService,
      idealFlatmateService
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

  getAvailableServices() {
    return this.services.map(service => service.getServiceInfo());
  }
}
