import type {
  ComponentLossEntry,
  FiberCable,
  LossBudgetSettings,
  NetworkNode,
  PathLossReport,
  Project,
  SplitterRatio,
} from '@/types';

export const DEFAULT_LOSS_BUDGET: LossBudgetSettings = {
  txPowerDbm: 5,
  rxSensitivityDbm: -28,
  safetyMarginDb: 3,
  wavelengthNm: 1490,
  spliceLossDb: 0.1,
  connectorLossDb: 0.3,
  attenuationDbPerKm: {
    feeder: 0.35,       // typical 1310/1490 nm
    distribution: 0.35,
    drop: 0.4,
  },
};

// Typical insertion loss for symmetric PLC splitters (dB).
export const SPLITTER_LOSS_DB: Record<SplitterRatio, number> = {
  '1:2': 3.6,
  '1:4': 7.2,
  '1:8': 10.5,
  '1:16': 13.8,
  '1:32': 17.2,
  '1:64': 20.5,
};

export function cableAttenuation(cable: FiberCable, lb: LossBudgetSettings): number {
  const perKm = cable.attenuationDbPerKm ?? lb.attenuationDbPerKm[cable.cableType];
  return (cable.length / 1000) * perKm;
}

export function nodeInsertionLoss(node: NetworkNode): number {
  if (node.lossDb != null) return node.lossDb;
  if (node.type === 'splitter' && node.splitRatio) {
    return SPLITTER_LOSS_DB[node.splitRatio];
  }
  return 0;
}

/**
 * Find the path of nodes / cables from the OLT (or telecom center node)
 * to the given ONT using a simple BFS over the cable graph.
 */
function findPath(project: Project, fromId: string, toId: string): { nodes: NetworkNode[]; cables: FiberCable[] } | null {
  const adj = new Map<string, { neighborId: string; cable: FiberCable }[]>();
  project.cables.forEach((c) => {
    if (!adj.has(c.fromNodeId)) adj.set(c.fromNodeId, []);
    if (!adj.has(c.toNodeId)) adj.set(c.toNodeId, []);
    adj.get(c.fromNodeId)!.push({ neighborId: c.toNodeId, cable: c });
    adj.get(c.toNodeId)!.push({ neighborId: c.fromNodeId, cable: c });
  });

  const prev = new Map<string, { nodeId: string; cable: FiberCable } | null>();
  prev.set(fromId, null);
  const queue: string[] = [fromId];
  while (queue.length) {
    const cur = queue.shift()!;
    if (cur === toId) break;
    const neighbors = adj.get(cur) ?? [];
    for (const n of neighbors) {
      if (prev.has(n.neighborId)) continue;
      prev.set(n.neighborId, { nodeId: cur, cable: n.cable });
      queue.push(n.neighborId);
    }
  }
  if (!prev.has(toId)) return null;

  const cablesRev: FiberCable[] = [];
  const nodeIdsRev: string[] = [toId];
  let cursor: string | null = toId;
  while (cursor && cursor !== fromId) {
    const step = prev.get(cursor);
    if (!step) break;
    cablesRev.push(step.cable);
    nodeIdsRev.push(step.nodeId);
    cursor = step.nodeId;
  }
  const nodeIds = nodeIdsRev.reverse();
  const cables = cablesRev.reverse();
  const nodes = nodeIds
    .map((id) => project.nodes.find((n) => n.id === id))
    .filter((n): n is NetworkNode => !!n);
  return { nodes, cables };
}

export function computeOntReport(project: Project, ontId: string): PathLossReport | null {
  const olt = project.nodes.find((n) => n.type === 'olt');
  const ont = project.nodes.find((n) => n.id === ontId && n.type === 'ont');
  if (!olt || !ont) return null;
  const path = findPath(project, olt.id, ont.id);
  if (!path) return null;

  const lb = project.lossBudget;
  const breakdown: ComponentLossEntry[] = [];

  let fiberLossDb = 0;
  let totalLengthM = 0;
  let spliceCount = 0;
  let connectorCount = 0;
  let splitterLossDb = 0;

  // 2 connectors at OLT side & ONT side (patchcords)
  connectorCount += 2;

  path.cables.forEach((c) => {
    const loss = cableAttenuation(c, lb);
    fiberLossDb += loss;
    totalLengthM += c.length;
    breakdown.push({
      label: `Fiber (${c.cableType})`,
      detail: `${(c.length).toFixed(0)} m @ ${(c.attenuationDbPerKm ?? lb.attenuationDbPerKm[c.cableType]).toFixed(2)} dB/km`,
      lossDb: loss,
    });
    // Each cable segment ~ 2 splices (one at each end at closures)
    spliceCount += 2;
  });

  // Intermediate nodes contribute insertion loss (splitters etc.)
  path.nodes.slice(1, -1).forEach((n) => {
    const il = nodeInsertionLoss(n);
    if (il > 0) {
      splitterLossDb += n.type === 'splitter' ? il : 0;
      breakdown.push({
        label: `${n.type.toUpperCase()} ${n.name}${n.splitRatio ? ` (${n.splitRatio})` : ''}`,
        detail: 'Insertion loss',
        lossDb: il,
      });
    }
  });

  const spliceLossDb = spliceCount * lb.spliceLossDb;
  const connectorLossDb = connectorCount * lb.connectorLossDb;
  breakdown.push({
    label: 'Splices',
    detail: `${spliceCount} × ${lb.spliceLossDb} dB`,
    lossDb: spliceLossDb,
  });
  breakdown.push({
    label: 'Connectors',
    detail: `${connectorCount} × ${lb.connectorLossDb} dB`,
    lossDb: connectorLossDb,
  });

  const componentLossDb = fiberLossDb + splitterLossDb + spliceLossDb + connectorLossDb;
  const totalLossDb = componentLossDb + lb.safetyMarginDb;
  const rxPowerDbm = lb.txPowerDbm - totalLossDb;
  const margin = rxPowerDbm - lb.rxSensitivityDbm;

  return {
    ontId,
    ontName: ont.name,
    hops: path.cables.length,
    totalLengthM,
    spliceCount,
    connectorCount,
    splitterLossDb,
    fiberLossDb,
    spliceLossDb,
    connectorLossDb,
    componentLossDb,
    totalLossDb,
    rxPowerDbm,
    margin,
    feasible: margin >= 0,
    breakdown,
  };
}

export function computeAllOntReports(project: Project): PathLossReport[] {
  return project.nodes
    .filter((n) => n.type === 'ont')
    .map((n) => computeOntReport(project, n.id))
    .filter((r): r is PathLossReport => !!r);
}
