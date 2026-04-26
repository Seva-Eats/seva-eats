// Hub/pickup locations
export type PickupLocation = {
  id: string;
  name: string;
  image: string;
  address: string;
  distance: string;
  boxesAvailable: number;
  nextPickupWindow: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
};

// Drop-off/recipient locations
export type DropOffLocation = {
  id: string;
  name: string;
  type: 'shelter' | 'food_bank' | 'community_center' | 'family';
  address: string;
  distance: string;
  boxesNeeded: number;
  partnerProgram: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
};

// Stats for the community
export type CommunityStats = {
  mealsDelivered: number;
  activeVolunteers: number;
  familiesServed: number;
  foodSavedKg: number;
};

// Sample pickup locations
export const pickupLocations: PickupLocation[] = [
  {
    id: 'hub-brampton',
    name: 'Brampton Distribution Hub',
    image: 'https://images.unsplash.com/photo-1609947017136-9daf32a3d37e?q=80&w=1200&auto=format&fit=crop',
    address: '123 Community Way, Brampton, ON',
    distance: '2.3 km',
    boxesAvailable: 45,
    nextPickupWindow: 'Friday, 6:00 PM',
    location: {
      latitude: 43.7315,
      longitude: -79.7624,
      address: '123 Community Way, Brampton, ON',
    },
  },
  {
    id: 'hub-mississauga',
    name: 'Mississauga Central Hub',
    image: 'https://images.unsplash.com/photo-1545459720-aac8509eb02c?q=80&w=1200&auto=format&fit=crop',
    address: '7080 Dixie Road, Mississauga, ON',
    distance: '4.1 km',
    boxesAvailable: 62,
    nextPickupWindow: 'Friday, 7:00 PM',
    location: {
      latitude: 43.6629,
      longitude: -79.6832,
      address: '7080 Dixie Road, Mississauga, ON',
    },
  },
];

// Sample drop-off locations
export const dropOffLocations: DropOffLocation[] = [
  {
    id: 'hope-shelter',
    name: 'Hope Community Shelter',
    type: 'shelter',
    address: '456 Main St, Brampton, ON',
    distance: '0.8 km from you',
    boxesNeeded: 12,
    partnerProgram: 'Peel Region Housing Support',
    location: {
      latitude: 43.7285,
      longitude: -79.7594,
      address: '456 Main St, Brampton, ON',
    },
  },
  {
    id: 'mississauga-food-bank',
    name: 'Mississauga Food Bank',
    type: 'food_bank',
    address: '3121 Universal Dr, Mississauga, ON',
    distance: '1.2 km from you',
    boxesNeeded: 25,
    partnerProgram: 'Feed Ontario Network',
    location: {
      latitude: 43.6459,
      longitude: -79.6121,
      address: '3121 Universal Dr, Mississauga, ON',
    },
  },
];

// Community stats
export const communityStats: CommunityStats = {
  mealsDelivered: 12847,
  activeVolunteers: 234,
  familiesServed: 892,
  foodSavedKg: 6423,
};
