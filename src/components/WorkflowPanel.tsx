import { useState } from 'react';
import { Building2, Hexagon, MapPin, Search } from 'lucide-react';
import type { LatLng, WorkflowStep } from '@/types';
import { useNetworkDesign } from '@/hooks/useNetworkDesign';
import styles from './WorkflowPanel.module.css';

type Props = {
  design: ReturnType<typeof useNetworkDesign>;
  step: WorkflowStep;
  onSetTool: (tool: 'place-telecom-center' | 'draw-area' | 'select') => void;
};

async function geocode(query: string): Promise<{ lat: number; lng: number; display: string } | null> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
    { headers: { Accept: 'application/json' } }
  );
  const data = await res.json();
  if (Array.isArray(data) && data.length > 0) {
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), display: data[0].display_name };
  }
  return null;
}

export default function WorkflowPanel({ design, step, onSetTool }: Props) {
  const { project, setAddress, setTelecomCenter } = design;
  const [addressInput, setAddressInput] = useState(project.address ?? '');
  const [tcInput, setTcInput] = useState(project.telecomCenter?.name ?? '');
  const [tcAddrInput, setTcAddrInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddressSubmit = async () => {
    if (!addressInput.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const r = await geocode(addressInput);
      if (!r) {
        setError('Address not found');
      } else {
        setAddress(addressInput, { lat: r.lat, lng: r.lng });
      }
    } catch {
      setError('Lookup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleTcByAddress = async () => {
    if (!tcAddrInput.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const r = await geocode(tcAddrInput);
      if (!r) {
        setError('Telecom center address not found');
      } else {
        const pos: LatLng = { lat: r.lat, lng: r.lng };
        setTelecomCenter(tcInput.trim() || 'Central Office', pos);
        design.setMapView(pos, 16);
      }
    } catch {
      setError('Lookup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.panel}>
      {/* Step 1 — Address */}
      <div className={`${styles.card} ${step === 'address' ? styles.cardActive : ''}`}>
        <div className={styles.cardHeader}>
          <MapPin size={16} />
          <h3>Step 1 · Customer / Project Address</h3>
        </div>
        <p className={styles.help}>
          Enter the street address or postcode of the area you want to serve. The map will jump there.
        </p>
        <div className={styles.row}>
          <input
            className={styles.input}
            placeholder="123 Main St, City, Postcode"
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddressSubmit()}
          />
          <button className={styles.primaryBtn} onClick={handleAddressSubmit} disabled={loading}>
            <Search size={14} /> Find
          </button>
        </div>
        {project.address && project.addressLocation && (
          <div className={styles.ok}>
            ✓ {project.address} ({project.addressLocation.lat.toFixed(4)}, {project.addressLocation.lng.toFixed(4)})
          </div>
        )}
      </div>

      {/* Step 2 — Telecom Center */}
      <div
        className={`${styles.card} ${step === 'telecom-center' ? styles.cardActive : ''} ${
          !project.addressLocation ? styles.cardDisabled : ''
        }`}
      >
        <div className={styles.cardHeader}>
          <Building2 size={16} />
          <h3>Step 2 · Telecom Center / Data Center</h3>
        </div>
        <p className={styles.help}>
          Identify the head-end where the OLT is installed. Search by address, or pick a point on the map.
        </p>
        <input
          className={styles.input}
          placeholder="Name (e.g. Central Office #4)"
          value={tcInput}
          onChange={(e) => setTcInput(e.target.value)}
        />
        <div className={styles.row}>
          <input
            className={styles.input}
            placeholder="Telecom center address"
            value={tcAddrInput}
            onChange={(e) => setTcAddrInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleTcByAddress()}
          />
          <button
            className={styles.primaryBtn}
            onClick={handleTcByAddress}
            disabled={loading || !project.addressLocation}
          >
            <Search size={14} /> Set
          </button>
        </div>
        <button
          className={styles.secondaryBtn}
          onClick={() => onSetTool('place-telecom-center')}
          disabled={!project.addressLocation}
        >
          📍 Pick on map
        </button>
        {project.telecomCenter && (
          <div className={styles.ok}>
            ✓ {project.telecomCenter.name} ({project.telecomCenter.position.lat.toFixed(4)},{' '}
            {project.telecomCenter.position.lng.toFixed(4)})
          </div>
        )}
      </div>

      {/* Step 3 — Service Area */}
      <div
        className={`${styles.card} ${step === 'service-area' ? styles.cardActive : ''} ${
          !project.telecomCenter ? styles.cardDisabled : ''
        }`}
      >
        <div className={styles.cardHeader}>
          <Hexagon size={16} />
          <h3>Step 3 · Define Service Area</h3>
        </div>
        <p className={styles.help}>
          Draw a polygon on the map to define the area you want to design the FTTH network for. Click to add
          vertices, press <kbd>Enter</kbd> to finish.
        </p>
        <button
          className={styles.primaryBtn}
          onClick={() => onSetTool('draw-area')}
          disabled={!project.telecomCenter}
        >
          <Hexagon size={14} /> Draw service area
        </button>
        {project.areas.length > 0 && (
          <div className={styles.ok}>
            ✓ {project.areas.length} service area{project.areas.length === 1 ? '' : 's'} defined
          </div>
        )}
      </div>

      {/* Step 4 — Design */}
      {step === 'design' && (
        <div className={`${styles.card} ${styles.cardActive}`}>
          <div className={styles.cardHeader}>
            <h3>Step 4 · Design the Network</h3>
          </div>
          <p className={styles.help}>
            Place splitters, closures, poles and ONTs inside the service area, then draw fiber cables between
            them. The loss budget panel below will recompute in real time.
          </p>
          <button className={styles.secondaryBtn} onClick={() => onSetTool('select')}>
            Switch to design mode
          </button>
        </div>
      )}

      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}
