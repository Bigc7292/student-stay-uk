// UK Postcode Service for converting city names to proper postcodes
export class PostcodeService {
  // Major UK cities and their central postcodes for property searches
  private static readonly CITY_POSTCODES: Record<string, string[]> = {
    // London areas
    'london': ['E1 6AN', 'SW1A 1AA', 'W1A 0AX', 'EC1A 1BB', 'N1 9GU'],
    'central london': ['WC1A 1AA', 'EC1A 1BB', 'W1A 0AX'],
    'east london': ['E1 6AN', 'E14 5AB', 'E20 2ST'],
    'south london': ['SE1 9GF', 'SW1A 1AA', 'SW11 1AA'],
    'north london': ['N1 9GU', 'NW1 2DB', 'N7 9DP'],
    'west london': ['W1A 0AX', 'W14 8UX', 'W6 8RF'],
    
    // Manchester
    'manchester': ['M1 1AA', 'M13 9PL', 'M14 6HR', 'M15 6BH', 'M20 2RN'],
    'manchester city centre': ['M1 1AA', 'M2 3WQ', 'M3 4LZ'],
    'manchester university': ['M13 9PL', 'M14 6HR'],
    'fallowfield': ['M14 6HR', 'M14 7ED'],
    'rusholme': ['M14 5GL', 'M14 4GA'],
    
    // Birmingham
    'birmingham': ['B1 1AA', 'B15 2TT', 'B29 6BD', 'B42 1LG'],
    'birmingham city centre': ['B1 1AA', 'B2 4QA', 'B3 1JJ'],
    'edgbaston': ['B15 2TT', 'B15 3ES'],
    'selly oak': ['B29 6BD', 'B29 7QU'],
    
    // Leeds
    'leeds': ['LS1 1AA', 'LS2 9JT', 'LS6 3HB', 'LS11 8PG'],
    'leeds city centre': ['LS1 1AA', 'LS2 9JT'],
    'headingley': ['LS6 3HB', 'LS6 1EF'],
    'hyde park': ['LS6 1AD', 'LS6 1EG'],
    
    // Liverpool
    'liverpool': ['L1 1AA', 'L7 8TX', 'L15 8HX', 'L17 6BD'],
    'liverpool city centre': ['L1 1AA', 'L2 2DZ'],
    'smithdown': ['L15 8HX', 'L15 3HF'],
    'wavertree': ['L15 4LE', 'L15 9EH'],
    
    // Sheffield
    'sheffield': ['S1 1AA', 'S10 2TN', 'S11 8UZ', 'S3 7HQ'],
    'sheffield city centre': ['S1 1AA', 'S1 2HE'],
    'broomhill': ['S10 2TN', 'S10 2LN'],
    'crookes': ['S10 1UH', 'S10 5BT'],
    
    // Bristol
    'bristol': ['BS1 1AA', 'BS8 1QU', 'BS16 1QY', 'BS34 8QZ'],
    'bristol city centre': ['BS1 1AA', 'BS1 4DJ'],
    'clifton': ['BS8 1QU', 'BS8 3LG'],
    'redland': ['BS6 6UB', 'BS6 7HY'],
    
    // Newcastle
    'newcastle': ['NE1 1AA', 'NE2 4HH', 'NE6 5PA', 'NE15 8NY'],
    'newcastle city centre': ['NE1 1AA', 'NE1 7RU'],
    'jesmond': ['NE2 4HH', 'NE2 3JU'],
    'heaton': ['NE6 5PA', 'NE6 1SA'],
    
    // Nottingham
    'nottingham': ['NG1 1AA', 'NG7 2RD', 'NG11 8NS', 'NG16 1AW'],
    'nottingham city centre': ['NG1 1AA', 'NG1 5DT'],
    'lenton': ['NG7 2RD', 'NG7 1JW'],
    'beeston': ['NG9 2LA', 'NG9 1FE'],
    
    // Edinburgh
    'edinburgh': ['EH1 1AA', 'EH8 9YL', 'EH16 5AY', 'EH14 1DJ'],
    'edinburgh city centre': ['EH1 1AA', 'EH2 2BY'],
    'marchmont': ['EH9 1HJ', 'EH9 2HN'],
    'newington': ['EH8 9YL', 'EH8 7EH'],
    
    // Glasgow
    'glasgow': ['G1 1AA', 'G12 8QQ', 'G13 1PP', 'G20 6AD'],
    'glasgow city centre': ['G1 1AA', 'G2 3BZ'],
    'west end': ['G12 8QQ', 'G12 0XH'],
    'partick': ['G11 5QX', 'G11 6AR'],
    
    // Cardiff
    'cardiff': ['CF10 1AA', 'CF24 0DE', 'CF11 9LJ', 'CF5 2YB'],
    'cardiff city centre': ['CF10 1AA', 'CF10 3AT'],
    'cathays': ['CF24 4HQ', 'CF24 0DE'],
    'roath': ['CF24 3AA', 'CF24 1RZ'],
    
    // Oxford
    'oxford': ['OX1 1AA', 'OX4 1EZ', 'OX2 6GG', 'OX3 7LF'],
    'oxford city centre': ['OX1 1AA', 'OX1 2JD'],
    'cowley': ['OX4 1EZ', 'OX4 2RD'],
    'headington': ['OX3 7LF', 'OX3 9DU'],
    
    // Cambridge
    'cambridge': ['CB1 1AA', 'CB4 0WS', 'CB2 1TN', 'CB5 8AQ'],
    'cambridge city centre': ['CB1 1AA', 'CB2 1RX'],
    'mill road': ['CB1 2AZ', 'CB1 3DF'],
    'cherry hinton': ['CB1 9PB', 'CB1 9JA'],
    
    // Bath
    'bath': ['BA1 1AA', 'BA2 3DH', 'BA1 5AN', 'BA2 6QE'],
    'bath city centre': ['BA1 1AA', 'BA1 1LN'],
    'oldfield park': ['BA2 3DH', 'BA2 2NR'],
    
    // York
    'york': ['YO1 1AA', 'YO10 5DD', 'YO24 4AB', 'YO31 0UR'],
    'york city centre': ['YO1 1AA', 'YO1 7HH'],
    'heslington': ['YO10 5DD', 'YO10 5GH'],
    
    // Canterbury
    'canterbury': ['CT1 1AA', 'CT2 7NZ', 'CT1 3AS', 'CT4 7ES'],
    'canterbury city centre': ['CT1 1AA', 'CT1 2JB'],
    
    // Coventry
    'coventry': ['CV1 1AA', 'CV4 7AL', 'CV2 2DX', 'CV6 1GU'],
    'coventry city centre': ['CV1 1AA', 'CV1 1GF'],
    'canley': ['CV4 7AL', 'CV4 8UW'],
    
    // Leicester
    'leicester': ['LE1 1AA', 'LE2 7LH', 'LE3 0QR', 'LE5 4PW'],
    'leicester city centre': ['LE1 1AA', 'LE1 5WW'],
    
    // Lincoln
    'lincoln': ['LN1 1AA', 'LN2 2LG', 'LN6 7TS', 'LN5 7AT'],
    'lincoln city centre': ['LN1 1AA', 'LN2 1PZ'],
    
    // Plymouth
    'plymouth': ['PL1 1AA', 'PL4 8AA', 'PL6 8BU', 'PL9 7BH'],
    'plymouth city centre': ['PL1 1AA', 'PL1 2AR'],
    
    // Portsmouth
    'portsmouth': ['PO1 1AA', 'PO5 4EZ', 'PO2 7HB', 'PO4 0JY'],
    'portsmouth city centre': ['PO1 1AA', 'PO1 2EG'],
    
    // Southampton
    'southampton': ['SO14 0AA', 'SO17 1BJ', 'SO15 2CE', 'SO16 4GX'],
    'southampton city centre': ['SO14 0AA', 'SO14 2AH'],
    'portswood': ['SO17 1BJ', 'SO17 2NB'],
    
    // Reading
    'reading': ['RG1 1AA', 'RG6 1WG', 'RG2 7HE', 'RG4 7JH'],
    'reading city centre': ['RG1 1AA', 'RG1 3EH'],
    
    // Brighton
    'brighton': ['BN1 1AA', 'BN2 4ES', 'BN1 9QJ', 'BN3 1AL'],
    'brighton city centre': ['BN1 1AA', 'BN1 1UG'],
    'preston park': ['BN1 6SD', 'BN1 6HG'],
    
    // Exeter
    'exeter': ['EX1 1AA', 'EX4 4QJ', 'EX2 4NT', 'EX6 8AT'],
    'exeter city centre': ['EX1 1AA', 'EX1 1GE'],
    
    // Hull
    'hull': ['HU1 1AA', 'HU6 7RX', 'HU3 2SX', 'HU9 1EN'],
    'hull city centre': ['HU1 1AA', 'HU1 3DZ'],
    
    // Swansea
    'swansea': ['SA1 1AA', 'SA2 8PP', 'SA1 6ED', 'SA5 4BE'],
    'swansea city centre': ['SA1 1AA', 'SA1 3SN'],
    
    // Aberdeen
    'aberdeen': ['AB10 1AA', 'AB24 3FX', 'AB15 4DT', 'AB25 2ZN'],
    'aberdeen city centre': ['AB10 1AA', 'AB10 1XE'],
    
    // Dundee
    'dundee': ['DD1 1AA', 'DD2 1SW', 'DD4 6QH', 'DD5 1NY'],
    'dundee city centre': ['DD1 1AA', 'DD1 4HN'],
    
    // Stirling
    'stirling': ['FK8 1AA', 'FK9 4LA', 'FK7 7TH', 'FK8 2QL'],
    'stirling city centre': ['FK8 1AA', 'FK8 1EA']
  };

  /**
   * Convert a city name or search term to valid UK postcode outward codes (first part only)
   */
  static getPostcodesForLocation(location: string): string[] {
    const normalizedLocation = location.toLowerCase().trim();
    
    // Direct match
    if (this.CITY_POSTCODES[normalizedLocation]) {
      const outwardCodes = this.CITY_POSTCODES[normalizedLocation].map(postcode => this.getOutwardCode(postcode));
      return [...new Set(outwardCodes)]; // Remove duplicates
    }
    
    // Partial match - find cities that contain the search term
    const matches: string[] = [];
    for (const [city, postcodes] of Object.entries(this.CITY_POSTCODES)) {
      if (city.includes(normalizedLocation) || normalizedLocation.includes(city)) {
        matches.push(...postcodes);
      }
    }
    
    // If we found matches, extract outward codes and return them
    if (matches.length > 0) {
      const outwardCodes = matches.map(postcode => this.getOutwardCode(postcode));
      return [...new Set(outwardCodes)]; // Remove duplicates
    }
    
    // If it looks like a postcode already, return its outward code
    if (this.isValidPostcodeFormat(location)) {
      return [this.getOutwardCode(location.toUpperCase())];
    }

    // Default fallback - return diverse major city outward codes (randomized)
    const fallbackCodes = ['E1', 'B1', 'LS1', 'L1', 'S1', 'BS1', 'NE1', 'NG1', 'EH1', 'G1', 'CF10', 'M1'];
    return fallbackCodes.sort(() => Math.random() - 0.5).slice(0, 3); // Return 3 random cities
  }

  /**
   * Check if a string looks like a valid UK postcode format
   */
  static isValidPostcodeFormat(postcode: string): boolean {
    const postcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i;
    return postcodeRegex.test(postcode.trim());
  }

  /**
   * Extract the outward code (first part) from a full UK postcode
   * Examples: "M1 1AA" -> "M1", "SW1A 1AA" -> "SW1A", "B15 2TT" -> "B15"
   */
  static getOutwardCode(postcode: string): string {
    const cleaned = postcode.replace(/\s+/g, '').toUpperCase();
    // UK outward codes are 2-4 characters: area (1-2 letters) + district (1-2 digits/letters)
    const match = cleaned.match(/^([A-Z]{1,2}[0-9][A-Z0-9]?)/);
    return match ? match[1] : cleaned.substring(0, Math.min(4, cleaned.length));
  }

  /**
   * Get the primary outward code for a location (first in the list)
   */
  static getPrimaryPostcode(location: string): string {
    const outwardCodes = this.getPostcodesForLocation(location);
    return outwardCodes[0];
  }

  /**
   * Get all supported cities
   */
  static getSupportedCities(): string[] {
    return Object.keys(this.CITY_POSTCODES);
  }

  /**
   * Format postcode properly (uppercase with space)
   */
  static formatPostcode(postcode: string): string {
    const cleaned = postcode.replace(/\s+/g, '').toUpperCase();
    if (cleaned.length >= 5) {
      return `${cleaned.slice(0, -3)} ${cleaned.slice(-3)}`;
    }
    return cleaned;
  }
}

export const postcodeService = PostcodeService;
