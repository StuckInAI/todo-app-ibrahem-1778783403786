// Shared types for the network designer and the legacy todo views.

export type Priority = 'low' | 'medium' | 'high';
export type Filter = 'all' | 'active' | 'completed';

export type Todo = {
  id: string;
  text: string;
  completed: boolean;
  priority: Priority;
  createdAt: number;
};

export type LatLng = {
  lat: number;
  lng: number;
};

export type ElementType =
  | 'olt'
  | 'splitter'
  | 'cabinet'
  | 'closure'
  | 'pole'
  | 'ont';

// Backwards-compat alias
export type NodeType = ElementType;

export type SplitterRatio = '1:2' | '1:4' | '1:8' | '1:16' | '1:32' | '1:64';

export type NetworkNode = {
  id: string;
  type: ElementType;
  name: string;
  position: LatLng;
  notes?: string;
  splitRatio?: SplitterRatio;
  // Optional per-component loss override (dB). If not set, defaults are used.
  lossDb?: number;
  createdAt: number;
};

export type CableType = 'feeder' | 'distribution' | 'drop';

export type FiberCable = {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  path: LatLng[];
  cableType: CableType;
  cores: number;
  length: number; // meters
  // Optional per-cable attenuation override (dB/km). If not set, defaults by type.
  attenuationDbPerKm?: number;
  createdAt: number;
};

// Backwards-compat alias
export type Cable = FiberCable;

export type ServiceArea = {
  id: string;
  name: string;
  path: LatLng[];
  createdAt: number;
};

// Wavelength used for loss budget calculations
export type Wavelength = 1310 | 1490 | 1550;

export type LossBudgetSettings = {
  // Transmit power of OLT (dBm)
  txPowerDbm: number;
  // Minimum receiver sensitivity at ONT (dBm)
  rxSensitivityDbm: number;
  // Safety margin (dB) reserved for ageing, repairs, etc.
  safetyMarginDb: number;
  // Wavelength used for attenuation calculation
  wavelengthNm: Wavelength;
  // Per-event losses (dB)
  spliceLossDb: number;       // per fusion splice
  connectorLossDb: number;    // per connector pair
  // Default per-cable attenuation by type (dB/km)
  attenuationDbPerKm: {
    feeder: number;
    distribution: number;
    drop: number;
  };
};

export type Project = {
  name: string;
  mapCenter: LatLng;
  mapZoom: number;
  nodes: NetworkNode[];
  cables: FiberCable[];
  areas: ServiceArea[];
  // Customer address (street/postcode) — starting point of the design workflow
  address?: string;
  addressLocation?: LatLng;
  // Telecom center / data center (typically where the OLT lives)
  telecomCenter?: {
    name: string;
    position: LatLng;
  };
  // Loss budget configuration for the design
  lossBudget: LossBudgetSettings;
};

export type Tool =
  | 'select'
  | 'place-olt'
  | 'place-splitter'
  | 'place-cabinet'
  | 'place-closure'
  | 'place-pole'
  | 'place-ont'
  | 'draw-cable'
  | 'draw-area'
  | 'place-telecom-center';

// ---- Workflow ----

export type WorkflowStep = 'address' | 'telecom-center' | 'service-area' | 'design';

// ---- Loss budget result ----

export type ComponentLossEntry = {
  label: string;
  detail?: string;
  lossDb: number;
};

export type PathLossReport = {
  ontId: string;
  ontName: string;
  hops: number;
  totalLengthM: number;
  spliceCount: number;
  connectorCount: number;
  splitterLossDb: number;
  fiberLossDb: number;
  spliceLossDb: number;
  connectorLossDb: number;
  componentLossDb: number; // total of all components, before margin
  totalLossDb: number;     // componentLossDb + safetyMargin
  rxPowerDbm: number;      // tx - totalLossDb
  margin: number;          // rxPower - rxSensitivity
  feasible: boolean;
  breakdown: ComponentLossEntry[];
};
