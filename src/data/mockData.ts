
export interface Property {
  id: number;
  title: string;
  price: number;
  location: string;
  image: string;
  amenities: string[];
  rating: number;
  available: boolean;
  description: string;
  propertyType: string;
  commuteTime: number;
  university: string;
  bills: string;
  deposit: number;
  viewingCount: number;
  savedCount: number;
  isNew?: boolean;
  virtualTour?: boolean;
  coordinates: [number, number];
  landlord: {
    name: string;
    rating: number;
    responseTime: string;
  };
  photos: string[];
  floorPlan?: string;
  energy Rating: string;
  council Tax: string;
  tenancyLength: string[];
}

export const mockProperties: Property[] = [
  {
    id: 1,
    title: "Luxury Studio Apartment - City Centre",
    price: 280,
    location: "Manchester City Centre",
    image: "https://images.unsplash.com/photo-1721322800607-8c38375eef04?w=400&h=300&fit=crop",
    amenities: ["Wi-Fi", "Gym", "24/7 Security", "Laundry", "Study Room"],
    rating: 4.8,
    available: true,
    description: "Modern studio apartment in the heart of Manchester with stunning city views. Perfect for students who want to be close to everything.",
    propertyType: "Studio",
    commuteTime: 5,
    university: "University of Manchester",
    bills: "Bills included",
    deposit: 280,
    viewingCount: 127,
    savedCount: 34,
    isNew: true,
    virtualTour: true,
    coordinates: [-2.2426, 53.4808],
    landlord: {
      name: "CityLiving Properties",
      rating: 4.6,
      responseTime: "Within 2 hours"
    },
    photos: [
      "https://images.unsplash.com/photo-1721322800607-8c38375eef04?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop"
    ],
    energyRating: "B",
    councilTax: "Exempt (full-time students)",
    tenancyLength: ["6 months", "12 months"]
  },
  {
    id: 2,
    title: "Shared House - 4 Bedroom Victorian",
    price: 140,
    location: "Fallowfield, Manchester",
    image: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=400&h=300&fit=crop",
    amenities: ["Wi-Fi", "Parking", "Garden", "Living Room", "Kitchen"],
    rating: 4.3,
    available: true,
    description: "Charming Victorian house share with large communal areas and private garden. Great student community atmosphere.",
    propertyType: "Shared House",
    commuteTime: 15,
    university: "University of Manchester",
    bills: "£45/month extra",
    deposit: 420,
    viewingCount: 89,
    savedCount: 23,
    coordinates: [-2.2200, 53.4400],
    landlord: {
      name: "Student Homes Ltd",
      rating: 4.2,
      responseTime: "Within 4 hours"
    },
    photos: [
      "https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=800&h=600&fit=crop"
    ],
    energyRating: "C",
    councilTax: "Exempt (full-time students)",
    tenancyLength: ["12 months"]
  },
  {
    id: 3,
    title: "Purpose-Built Student Accommodation",
    price: 220,
    location: "Student Village, Manchester",
    image: "https://images.unsplash.com/photo-1524230572899-a752b3835840?w=400&h=300&fit=crop",
    amenities: ["Wi-Fi", "Gym", "Study Rooms", "Common Area", "Reception", "Cinema Room"],
    rating: 4.7,
    available: false,
    description: "Premium student accommodation with all modern amenities. Part of a vibrant student community with regular events.",
    propertyType: "En-suite",
    commuteTime: 10,
    university: "Manchester Metropolitan University",
    bills: "All bills included",
    deposit: 220,
    viewingCount: 203,
    savedCount: 67,
    virtualTour: true,
    coordinates: [-2.2300, 53.4700],
    landlord: {
      name: "Unite Students",
      rating: 4.5,
      responseTime: "Within 1 hour"
    },
    photos: [
      "https://images.unsplash.com/photo-1524230572899-a752b3835840?w=800&h=600&fit=crop"
    ],
    energyRating: "A",
    councilTax: "Exempt (full-time students)",
    tenancyLength: ["44 weeks", "51 weeks"]
  },
  {
    id: 4,
    title: "Modern 2-Bed Apartment Share",
    price: 180,
    location: "Northern Quarter, Manchester",
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop",
    amenities: ["Wi-Fi", "Balcony", "Modern Kitchen", "Dishwasher"],
    rating: 4.4,
    available: true,
    description: "Contemporary apartment in trendy Northern Quarter. Perfect for students who love arts, culture and nightlife.",
    propertyType: "Apartment Share",
    commuteTime: 8,
    university: "University of Manchester",
    bills: "£38/month extra",
    deposit: 540,
    viewingCount: 156,
    saved Count: 41,
    isNew: true,
    coordinates: [-2.2350, 53.4850],
    landlord: {
      name: "Urban Living",
      rating: 4.3,
      responseTime: "Within 3 hours"
    },
    photos: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop"
    ],
    energyRating: "B",
    councilTax: "Exempt (full-time students)",
    tenancyLength: ["6 months", "12 months"]
  }
];

export const ukUniversities = [
  { name: "University of Oxford", city: "Oxford", coordinates: [-1.2577, 51.7520] },
  { name: "University of Cambridge", city: "Cambridge", coordinates: [0.1278, 52.2053] },
  { name: "Imperial College London", city: "London", coordinates: [-0.1759, 51.4988] },
  { name: "London School of Economics", city: "London", coordinates: [-0.1166, 51.5145] },
  { name: "University College London", city: "London", coordinates: [-0.1340, 51.5246] },
  { name: "University of Edinburgh", city: "Edinburgh", coordinates: [-3.1883, 55.9533] },
  { name: "King's College London", city: "London", coordinates: [-0.1160, 51.5118] },
  { name: "University of Manchester", city: "Manchester", coordinates: [-2.2426, 53.4808] },
  { name: "University of Bristol", city: "Bristol", coordinates: [-2.6037, 51.4585] },
  { name: "University of Warwick", city: "Coventry", coordinates: [-1.5606, 52.3789] },
  { name: "University of Birmingham", city: "Birmingham", coordinates: [-1.9344, 52.4508] },
  { name: "University of Leeds", city: "Leeds", coordinates: [-1.5559, 53.8067] },
  { name: "University of Glasgow", city: "Glasgow", coordinates: [-4.2429, 55.8719] },
  { name: "University of Southampton", city: "Southampton", coordinates: [-1.3968, 50.9345] },
  { name: "University of Sheffield", city: "Sheffield", coordinates: [-1.4797, 53.3811] }
];
