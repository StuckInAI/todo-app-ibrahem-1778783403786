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

export type SplitterRatio = '1:2' | '1:4' | '1:8' | '1:16' | '1:32' | '1:64';

export type NetworkNode = {
  id: string;
  type: ElementType;
  name: string;
  position: LatLng;
  /** Only for splitters */
  splitRatio?: SplitterRatio;
  /** Optional notes */
  notes?: string;
  createdAt: number;
};

export type CableType = 'feeder' | 'distribution' | 'drop';

export type FiberCable = {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  /** Polyline path including intermediate vertices */
  path: LatLng[];
  cableType: CableType;
  /** Number of fiber cores */
  cores: number;
  /** Length in meters (computed) */
  length: number;
  createdAt: number;
};

export type ServiceArea = {
  id: string;
  name: string;
  /** Polygon vertices */
  path: LatLng[];
  createdAt: number;
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
  | 'draw-area';

export type Project = {
  name: string;
  nodes: NetworkNode[];
  cables: FiberCable[];
  areas: ServiceArea[];
  mapCenter: LatLng;
  mapZoom: number;
};
