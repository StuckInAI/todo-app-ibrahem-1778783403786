import { useCallback, useEffect, useRef, useState } from 'react';
import type { LatLng, NetworkNode, Tool } from '@/types';
import { latLngToPixel, pixelToLatLng } from '@/utils/mercator';
import { useNetworkDesign } from '@/hooks/useNetworkDesign';
import NodeMarker from '@/components/NodeMarker';
import styles from './MapCanvas.module.css';

type Props = {
  design: ReturnType<typeof useNetworkDesign>;
  tool: Tool;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onToolHandled: () => void;
};

const MIN_ZOOM = 3;
const MAX_ZOOM = 20;

const TILE_URL = (x: number, y: number, z: number) =>
  `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;

export default function MapCanvas({ design, tool, selectedId, onSelect, onToolHandled }: Props) {
  const { project, addNode, addCable, addArea, setMapView, setTelecomCenter, updateNode } = design;
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ width: 800, height: 600 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; center: LatLng } | null>(null);

  const [cableFrom, setCableFrom] = useState<string | null>(null);
  const [cablePath, setCablePath] = useState<LatLng[]>([]);
  const [areaPath, setAreaPath] = useState<LatLng[]>([]);
  const [cursorLatLng, setCursorLatLng] = useState<LatLng | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const update = () => {
      const rect = el.getBoundingClientRect();
      setViewport({ width: rect.width, height: rect.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    setCableFrom(null);
    setCablePath([]);
    setAreaPath([]);
  }, [tool]);

  const center = project.mapCenter;
  const zoom = project.mapZoom;

  const toPixel = useCallback(
    (ll: LatLng) => latLngToPixel(ll, center, zoom, viewport),
    [center, zoom, viewport]
  );
  const toLatLng = useCallback(
    (px: { x: number; y: number }) => pixelToLatLng(px, center, zoom, viewport),
    [center, zoom, viewport]
  );

  const tileZ = Math.round(zoom);
  const tileScale = Math.pow(2, zoom - tileZ);
  const numTiles = Math.pow(2, tileZ);
  const centerWorldX = ((center.lng + 180) / 360) * numTiles;
  const sinLat = Math.sin((center.lat * Math.PI) / 180);
  const centerWorldY =
    (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * numTiles;
  const tilePixelSize = 256 * tileScale;
  const tilesAcross = Math.ceil(viewport.width / tilePixelSize) + 2;
  const tilesDown = Math.ceil(viewport.height / tilePixelSize) + 2;
  const startX = Math.floor(centerWorldX - tilesAcross / 2);
  const startY = Math.floor(centerWorldY - tilesDown / 2);

  const tiles: { x: number; y: number; left: number; top: number }[] = [];
  for (let i = 0; i < tilesAcross; i += 1) {
    for (let j = 0; j < tilesDown; j += 1) {
      const tx = startX + i;
      const ty = startY + j;
      if (tx < 0 || ty < 0 || tx >= numTiles || ty >= numTiles) continue;
      const left = (tx - centerWorldX) * tilePixelSize + viewport.width / 2;
      const top = (ty - centerWorldY) * tilePixelSize + viewport.height / 2;
      tiles.push({ x: tx, y: ty, left, top });
    }
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const before = toLatLng({ x: mx, y: my });
    const delta = e.deltaY > 0 ? -1 : 1;
    const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom + delta * 0.5));
    const tmpCenter = center;
    const afterPixel = latLngToPixel(before, tmpCenter, newZoom, viewport);
    const dx = afterPixel.x - mx;
    const dy = afterPixel.y - my;
    const newCenterPixel = {
      x: viewport.width / 2 + dx,
      y: viewport.height / 2 + dy,
    };
    const newCenter = pixelToLatLng(newCenterPixel, tmpCenter, newZoom, viewport);
    setMapView(newCenter, newZoom);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if (tool === 'select') {
      setDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY, center });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const ll = toLatLng({ x: mx, y: my });
    setCursorLatLng(ll);

    if (draggingNodeId) {
      updateNode(draggingNodeId, { position: ll });
      return;
    }

    if (dragging && dragStart) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      const startCenterPx = latLngToPixel(dragStart.center, dragStart.center, zoom, viewport);
      const newCenterPx = { x: startCenterPx.x - dx, y: startCenterPx.y - dy };
      const newCenter = pixelToLatLng(newCenterPx, dragStart.center, zoom, viewport);
      setMapView(newCenter, zoom);
    }
  };

  const handleMouseUp = () => {
    setDragging(false);
    setDragStart(null);
    setDraggingNodeId(null);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (dragging) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const ll = toLatLng({ x: mx, y: my });

    if (tool === 'place-telecom-center') {
      const name = project.telecomCenter?.name || 'Central Office';
      setTelecomCenter(name, ll);
      onToolHandled();
      return;
    }

    if (tool.startsWith('place-')) {
      const type = tool.replace('place-', '') as NetworkNode['type'];
      addNode(type, ll);
      onToolHandled();
      return;
    }

    if (tool === 'draw-cable') {
      if (cableFrom) {
        setCablePath((p) => [...p, ll]);
      }
      return;
    }

    if (tool === 'draw-area') {
      setAreaPath((p) => [...p, ll]);
      return;
    }

    if (tool === 'select') {
      onSelect(null);
    }
  };

  const handleNodeClick = (node: NetworkNode, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tool === 'draw-cable') {
      if (!cableFrom) {
        setCableFrom(node.id);
        setCablePath([node.position]);
      } else if (cableFrom !== node.id) {
        const fullPath = [...cablePath, node.position];
        const fromNode = project.nodes.find((n) => n.id === cableFrom);
        const cableType =
          fromNode?.type === 'olt' ? 'feeder' : fromNode?.type === 'splitter' ? 'distribution' : 'drop';
        addCable(cableFrom, node.id, fullPath, cableType, 12);
        setCableFrom(null);
        setCablePath([]);
      }
      return;
    }
    if (tool === 'select') {
      onSelect(node.id);
    }
  };

  const handleNodeMouseDown = (node: NetworkNode, e: React.MouseEvent) => {
    if (tool !== 'select') return;
    e.stopPropagation();
    setDraggingNodeId(node.id);
    onSelect(node.id);
  };

  const finishArea = () => {
    if (areaPath.length >= 3) {
      addArea(areaPath);
    }
    setAreaPath([]);
  };

  const cancelDraw = () => {
    setCableFrom(null);
    setCablePath([]);
    setAreaPath([]);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancelDraw();
      if (e.key === 'Enter' && tool === 'draw-area') finishArea();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool, areaPath]);

  const cablePolylines = project.cables.map((c) => {
    const pts = c.path.map(toPixel).map((p) => `${p.x},${p.y}`).join(' ');
    const isSelected = selectedId === c.id;
    const stroke =
      c.cableType === 'feeder' ? '#ef4444' : c.cableType === 'distribution' ? '#f59e0b' : '#10b981';
    return (
      <polyline
        key={c.id}
        points={pts}
        stroke={stroke}
        strokeWidth={isSelected ? 5 : 3}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ cursor: 'pointer', filter: isSelected ? 'drop-shadow(0 0 4px rgba(0,0,0,0.5))' : 'none' }}
        onClick={(e) => {
          e.stopPropagation();
          if (tool === 'select') onSelect(c.id);
        }}
      />
    );
  });

  const areaPolygons = project.areas.map((a) => {
    const pts = a.path.map(toPixel).map((p) => `${p.x},${p.y}`).join(' ');
    const isSelected = selectedId === a.id;
    return (
      <polygon
        key={a.id}
        points={pts}
        fill="rgba(99,102,241,0.15)"
        stroke={isSelected ? '#4f46e5' : '#6366f1'}
        strokeWidth={2}
        strokeDasharray="6 4"
        onClick={(e) => {
          e.stopPropagation();
          if (tool === 'select') onSelect(a.id);
        }}
        style={{ cursor: 'pointer' }}
      />
    );
  });

  let cablePreview: React.ReactNode = null;
  if (tool === 'draw-cable' && cableFrom && cablePath.length > 0) {
    const preview = [...cablePath];
    if (cursorLatLng) preview.push(cursorLatLng);
    const pts = preview.map(toPixel).map((p) => `${p.x},${p.y}`).join(' ');
    cablePreview = (
      <polyline
        points={pts}
        stroke="#6366f1"
        strokeWidth={3}
        strokeDasharray="6 4"
        fill="none"
      />
    );
  }

  let areaPreview: React.ReactNode = null;
  if (tool === 'draw-area' && areaPath.length > 0) {
    const preview = [...areaPath];
    if (cursorLatLng) preview.push(cursorLatLng);
    const pts = preview.map(toPixel).map((p) => `${p.x},${p.y}`).join(' ');
    areaPreview = (
      <polyline
        points={pts}
        stroke="#6366f1"
        strokeWidth={2}
        strokeDasharray="4 4"
        fill="rgba(99,102,241,0.1)"
      />
    );
  }

  // Address marker
  let addressMarker: React.ReactNode = null;
  if (project.addressLocation) {
    const p = toPixel(project.addressLocation);
    addressMarker = (
      <div
        className={styles.addressPin}
        style={{ left: p.x, top: p.y }}
        title={project.address ?? 'Project address'}
      >
        📍
      </div>
    );
  }

  const cursorStyle: React.CSSProperties = {
    cursor:
      tool === 'select'
        ? dragging
          ? 'grabbing'
          : 'grab'
        : 'crosshair',
  };

  return (
    <div
      ref={containerRef}
      className={styles.map}
      style={cursorStyle}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleClick}
    >
      <div className={styles.tileLayer}>
        {tiles.map((t) => (
          <img
            key={`${tileZ}-${t.x}-${t.y}`}
            src={TILE_URL(t.x, t.y, tileZ)}
            alt=""
            draggable={false}
            style={{
              position: 'absolute',
              left: t.left,
              top: t.top,
              width: tilePixelSize,
              height: tilePixelSize,
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          />
        ))}
      </div>

      <svg className={styles.svg} width={viewport.width} height={viewport.height}>
        {areaPolygons}
        {areaPreview}
        {cablePolylines}
        {cablePreview}
      </svg>

      <div className={styles.markers}>
        {addressMarker}
        {project.nodes.map((node) => {
          const px = toPixel(node.position);
          return (
            <NodeMarker
              key={node.id}
              node={node}
              x={px.x}
              y={px.y}
              selected={selectedId === node.id}
              cableSource={cableFrom === node.id}
              onClick={(e) => handleNodeClick(node, e)}
              onMouseDown={(e) => handleNodeMouseDown(node, e)}
            />
          );
        })}
      </div>

      {tool === 'draw-area' && areaPath.length >= 3 && (
        <button className={styles.finishBtn} onClick={finishArea}>
          Finish area (Enter)
        </button>
      )}
      {tool === 'draw-cable' && cableFrom && (
        <div className={styles.hint}>Click another node to finish the cable · Esc to cancel</div>
      )}
      {tool === 'draw-area' && (
        <div className={styles.hint}>Click to add polygon vertices · Enter to finish · Esc to cancel</div>
      )}
      {tool === 'place-telecom-center' && (
        <div className={styles.hint}>Click on the map to place the telecom center / OLT</div>
      )}

      {cursorLatLng && (
        <div className={styles.coords}>
          {cursorLatLng.lat.toFixed(5)}, {cursorLatLng.lng.toFixed(5)} · z{zoom.toFixed(1)}
        </div>
      )}
      <div className={styles.attribution}>
        © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors
      </div>
    </div>
  );
}
