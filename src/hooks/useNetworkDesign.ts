import { useCallback, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type {
  CableType,
  ElementType,
  FiberCable,
  LatLng,
  LossBudgetSettings,
  NetworkNode,
  Project,
  ServiceArea,
  SplitterRatio,
  WorkflowStep,
} from '@/types';
import { haversineLength } from '@/utils/geo';
import { computeAllOntReports, DEFAULT_LOSS_BUDGET } from '@/utils/lossBudget';

const STORAGE_KEY = 'ftth-designer-project-v2';

const DEFAULT_PROJECT: Project = {
  name: 'Untitled FTTH Project',
  nodes: [],
  cables: [],
  areas: [],
  mapCenter: { lat: 51.5074, lng: -0.1278 },
  mapZoom: 15,
  lossBudget: DEFAULT_LOSS_BUDGET,
};

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function defaultNameFor(type: ElementType, count: number) {
  const labels: Record<ElementType, string> = {
    olt: 'OLT',
    splitter: 'Splitter',
    cabinet: 'Cabinet',
    closure: 'Closure',
    pole: 'Pole',
    ont: 'ONT',
  };
  return `${labels[type]}-${count + 1}`;
}

export function useNetworkDesign() {
  const [project, setProject] = useLocalStorage<Project>(STORAGE_KEY, DEFAULT_PROJECT);

  // Migrate older saved projects that pre-date the loss budget feature.
  const safeProject: Project = {
    ...project,
    lossBudget: project.lossBudget ?? DEFAULT_LOSS_BUDGET,
    areas: project.areas ?? [],
  };

  const addNode = useCallback(
    (type: ElementType, position: LatLng) => {
      setProject((p) => {
        const sameTypeCount = p.nodes.filter((n) => n.type === type).length;
        const node: NetworkNode = {
          id: uid(),
          type,
          name: defaultNameFor(type, sameTypeCount),
          position,
          splitRatio: type === 'splitter' ? '1:8' : undefined,
          createdAt: Date.now(),
        };
        return { ...p, nodes: [...p.nodes, node] };
      });
    },
    [setProject]
  );

  const updateNode = useCallback(
    (id: string, patch: Partial<NetworkNode>) => {
      setProject((p) => ({
        ...p,
        nodes: p.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
      }));
    },
    [setProject]
  );

  const deleteNode = useCallback(
    (id: string) => {
      setProject((p) => ({
        ...p,
        nodes: p.nodes.filter((n) => n.id !== id),
        cables: p.cables.filter((c) => c.fromNodeId !== id && c.toNodeId !== id),
      }));
    },
    [setProject]
  );

  const addCable = useCallback(
    (fromNodeId: string, toNodeId: string, path: LatLng[], cableType: CableType, cores = 12) => {
      setProject((p) => {
        const cable: FiberCable = {
          id: uid(),
          fromNodeId,
          toNodeId,
          path,
          cableType,
          cores,
          length: haversineLength(path),
          createdAt: Date.now(),
        };
        return { ...p, cables: [...p.cables, cable] };
      });
    },
    [setProject]
  );

  const updateCable = useCallback(
    (id: string, patch: Partial<FiberCable>) => {
      setProject((p) => ({
        ...p,
        cables: p.cables.map((c) => {
          if (c.id !== id) return c;
          const merged = { ...c, ...patch };
          if (patch.path) merged.length = haversineLength(patch.path);
          return merged;
        }),
      }));
    },
    [setProject]
  );

  const deleteCable = useCallback(
    (id: string) => {
      setProject((p) => ({ ...p, cables: p.cables.filter((c) => c.id !== id) }));
    },
    [setProject]
  );

  const addArea = useCallback(
    (path: LatLng[], name?: string) => {
      setProject((p) => {
        const area: ServiceArea = {
          id: uid(),
          name: name ?? `Service Area ${p.areas.length + 1}`,
          path,
          createdAt: Date.now(),
        };
        return { ...p, areas: [...p.areas, area] };
      });
    },
    [setProject]
  );

  const deleteArea = useCallback(
    (id: string) => {
      setProject((p) => ({ ...p, areas: p.areas.filter((a) => a.id !== id) }));
    },
    [setProject]
  );

  const setSplitRatio = useCallback(
    (id: string, ratio: SplitterRatio) => {
      updateNode(id, { splitRatio: ratio });
    },
    [updateNode]
  );

  const setMapView = useCallback(
    (center: LatLng, zoom: number) => {
      setProject((p) => ({ ...p, mapCenter: center, mapZoom: zoom }));
    },
    [setProject]
  );

  const renameProject = useCallback(
    (name: string) => setProject((p) => ({ ...p, name })),
    [setProject]
  );

  const setAddress = useCallback(
    (address: string, location?: LatLng) => {
      setProject((p) => ({
        ...p,
        address,
        addressLocation: location ?? p.addressLocation,
      }));
      if (location) setMapView(location, 17);
    },
    [setProject, setMapView]
  );

  const setTelecomCenter = useCallback(
    (name: string, position: LatLng) => {
      setProject((p) => {
        // Either update an existing OLT node tagged as telecom center, or add one.
        const existingOlt = p.nodes.find((n) => n.type === 'olt');
        let nodes = p.nodes;
        if (existingOlt) {
          nodes = p.nodes.map((n) =>
            n.id === existingOlt.id ? { ...n, name, position } : n
          );
        } else {
          const oltNode: NetworkNode = {
            id: uid(),
            type: 'olt',
            name,
            position,
            createdAt: Date.now(),
          };
          nodes = [...p.nodes, oltNode];
        }
        return {
          ...p,
          telecomCenter: { name, position },
          nodes,
        };
      });
    },
    [setProject]
  );

  const updateLossBudget = useCallback(
    (patch: Partial<LossBudgetSettings>) => {
      setProject((p) => ({
        ...p,
        lossBudget: { ...(p.lossBudget ?? DEFAULT_LOSS_BUDGET), ...patch },
      }));
    },
    [setProject]
  );

  const clearAll = useCallback(() => {
    setProject((p) => ({
      ...p,
      nodes: [],
      cables: [],
      areas: [],
      telecomCenter: undefined,
      address: undefined,
      addressLocation: undefined,
    }));
  }, [setProject]);

  const exportJSON = useCallback(() => {
    return JSON.stringify(safeProject, null, 2);
  }, [safeProject]);

  const importJSON = useCallback(
    (json: string) => {
      try {
        const parsed = JSON.parse(json) as Project;
        if (parsed && Array.isArray(parsed.nodes) && Array.isArray(parsed.cables)) {
          setProject({
            ...DEFAULT_PROJECT,
            ...parsed,
            areas: parsed.areas ?? [],
            lossBudget: parsed.lossBudget ?? DEFAULT_LOSS_BUDGET,
          });
          return true;
        }
      } catch {
        // ignore
      }
      return false;
    },
    [setProject]
  );

  const workflowStep: WorkflowStep = useMemo(() => {
    if (!safeProject.address || !safeProject.addressLocation) return 'address';
    if (!safeProject.telecomCenter) return 'telecom-center';
    if (safeProject.areas.length === 0) return 'service-area';
    return 'design';
  }, [safeProject.address, safeProject.addressLocation, safeProject.telecomCenter, safeProject.areas.length]);

  const stats = useMemo(() => {
    const totalLength = safeProject.cables.reduce((sum, c) => sum + c.length, 0);
    const byType: Record<ElementType, number> = {
      olt: 0,
      splitter: 0,
      cabinet: 0,
      closure: 0,
      pole: 0,
      ont: 0,
    };
    safeProject.nodes.forEach((n) => {
      byType[n.type] += 1;
    });
    return {
      totalLength,
      nodeCount: safeProject.nodes.length,
      cableCount: safeProject.cables.length,
      areaCount: safeProject.areas.length,
      byType,
    };
  }, [safeProject]);

  const lossReports = useMemo(() => computeAllOntReports(safeProject), [safeProject]);

  return {
    project: safeProject,
    stats,
    workflowStep,
    lossReports,
    addNode,
    updateNode,
    deleteNode,
    addCable,
    updateCable,
    deleteCable,
    addArea,
    deleteArea,
    setSplitRatio,
    setMapView,
    renameProject,
    setAddress,
    setTelecomCenter,
    updateLossBudget,
    clearAll,
    exportJSON,
    importJSON,
  };
}
