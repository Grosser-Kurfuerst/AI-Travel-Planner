import { create } from 'zustand';
import { Trip, Activity } from '@/lib/supabaseClient';

interface TripState {
  currentTrip: (Trip & { activities?: Activity[] }) | null;
  trips: Trip[];
  setCurrentTrip: (trip: (Trip & { activities?: Activity[] }) | null) => void;
  setTrips: (trips: Trip[]) => void;
  addTrip: (trip: Trip) => void;
}

export const useTripStore = create<TripState>((set) => ({
  currentTrip: null,
  trips: [],
  setCurrentTrip: (trip) => set({ currentTrip: trip }),
  setTrips: (trips) => set({ trips }),
  addTrip: (trip) => set((state) => ({ trips: [trip, ...state.trips] })),
}));

