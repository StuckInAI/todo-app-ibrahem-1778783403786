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

export type NodeType =
  | 'olt'
  | 'splitter'
  | 'cabinet'
  | 'closure'
  | 'pole'
  | 'ont';

export type SplitterRatio = '1:2' | '1:4' | '1:8' | '1:16' | '1:32' | '1:64';

export type NetworkNode = {
  id: string;
  type: NodeType;
  name: string;
  position: LatLng;
  notes?: string;
  splitRatio?: SplitterRatio;
  createdAt: number;
};

export type CableType = 'feeder' | 'distribution' | 'drop';

export type Cable = {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  path: LatLng[];
  cableType: CableType;
  cores: number;
  length: number; // meters
  createdAt: number;
};

export type ServiceArea = {
  id: string;
  name: string;
  path: LatLng[];
  createdAt: number;
};

export type Project = {
  id: string;
  name: string;
  mapCenter: LatLng;
  mapZoom: number;
  nodes: NetworkNode[];
  cables: Cable[];
  areas: ServiceArea[];
  createdAt: number;
  updatedAt: number;
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
