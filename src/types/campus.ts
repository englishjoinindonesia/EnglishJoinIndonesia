export interface CampusLogo {
  id: string;
  name: string;
  shortName?: string;
  tagline?: string;
  logoUrl?: string; // Image URL or Base64 Data URL
  svgPresetKey?: string; // Key for built-in high fidelity vector presets: 'unair' | 'ui' | 'itb' | 'ugm' | 'ipb' | 'unpad' | 'its' | 'undip' | 'nottingham' | 'stuttgart'
  category: 'PTN / Dalam Negeri' | 'PTS / Swasta' | 'Luar Negeri / Internasional' | 'Luar Negeri / International';
  country: string;
  isActive: boolean;
  order: number;
}
