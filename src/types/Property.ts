// src/types/Property.ts

export interface Property {
  id: string;
  title: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms?: number;
  description?: string;
  images?: string[];
  url: string;
  source: string;
  // Allow extra fields for flexibility, but avoid 'any'
  [key: string]: string | number | boolean | string[] | number[] | boolean[] | undefined;
}
