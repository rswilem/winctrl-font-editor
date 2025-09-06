export interface FlightDistance {
  m: number;
  km: number;
  mi: number;
  nmi: number;
}

export interface Subfleet {
  id: number;
  type: string;
  name: string;
  code: string;
  airline_id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  // Add more fields if needed
}

export interface Airline {
  id: number;
  icao: string;
  iata: string;
  name: string;
  country: string;
  logo: string;
}

export interface Fare {
  // Add fare fields as needed based on actual data structure
  [key: string]: any;
}

export interface FieldValue {
  // Add field value structure as needed based on actual data structure
  [key: string]: any;
}

export interface SimbriefData {
  // Add simbrief data structure as needed based on actual data structure
  [key: string]: any;
}

export interface Flight {
  id: string;
  airline_id: number;
  flight_number: number;
  callsign: string;
  route_code: string | null;
  route_leg: number;
  dpt_airport_id: string;
  arr_airport_id: string;
  alt_airport_id: string | null;
  dpt_time: string;
  arr_time: string;
  level: number;
  distance: FlightDistance;
  flight_time: number;
  flight_type: string;
  load_factor: number;
  load_factor_variance: number;
  route: string | null;
  pilot_pay: number | null;
  notes: string | null;
  scheduled: number;
  days: number;
  start_date: string | null;
  end_date: string | null;
  has_bid: boolean;
  active: boolean;
  visible: boolean;
  event_id: number | null;
  user_id: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  owner_type: string | null;
  owner_id: number | null;
  subfleets: Subfleet[];
  airline: Airline;
  fares: Fare[];
  field_values: FieldValue[];
  simbrief: SimbriefData | null;
  ident: string;
}

export interface Airport {
  id: string;
  iata: string;
  icao: string;
  name: string;
  location: string;
  region: string | null;
  country: string;
  timezone: string;
  hub: boolean;
  notes: string | null;
  lat: number;
  lon: number;
  elevation: number | null;
  ground_handling_cost: number;
  fuel_100ll_cost: number;
  fuel_jeta_cost: number;
  fuel_mogas_cost: number;
  deleted_at: string | null;
  description: string;
}

export interface AirportsResponse {
  data: Airport[];
  source: 'cache' | 'api';
  count: number;
}

export interface FlightsResponse {
  data: Flight[];
}
