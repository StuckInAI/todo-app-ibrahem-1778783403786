import { useState } from 'react';
import {
  Settings,
  List,
  Radio,
  ChevronDown,
  ChevronUp,
  Trash2,
  Edit3,
  Check,
  X,
  AlertTriangle,
  CheckCircle,
  Eye,
} from 'lucide-react';
import type { Tool, NetworkNode, FiberCable, ServiceArea } from '@/types';
import { useNetworkDesign } from '@/hooks/useNetworkDesign';
import WorkflowPanel from '@/components/WorkflowPanel';
import LossBudgetPanel from '@/components/LossBudgetPanel';
import PreviewModal from '@/components/PreviewModal';
import { formatMeters } from '@/utils/geo';
import styles from './SidePanel.module.css';

type Tab = 'workflow' | 'elements' | 'loss';

type Props = {
  design: ReturnType<typeof useNetworkDesign>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onSetTool: (tool: Tool) => void;
};

export default function SidePanel({ design, selectedId, onSelect, onSetTool }: Props) {
  const [tab, setTab] = useState<Tab>('workflow');
  const [showPreview, setShowPreview] = useState(false);

  const { project, stats, lossReports, deleteNode, deleteCable, deleteArea, updateNode, updateCable } = design;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const startEdit = (id: string, currentName: string) => {
    setEditingId(id);
    setEditName(currentName);
  };
  const commitEdit = (type: 'node' | 'cable') => {
    if (!editingId) return;
    if (type === 'node') updateNode(editingId, { name: editName });
    else updateCable(editingId, { cableType: undefined } as never);
    setEditingId(null);
  };
  const cancelEdit = () => setEditingId(null);

  const feasibleCount = lossReports.filter((r) => r.feasible).length;
  const totalOnts = lossReports.length;

  return (
    <>
      <div className={styles.panel}>
        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === 'workflow' ? styles.tabActive : ''}`}
            onClick={() => setTab('workflow')}
          >
            Steps
          </button>
          <button
            className={`${styles.tab} ${tab === 'elements' ? styles.tabActive : ''}`}
            onClick={() => setTab('elements')}
          >
            Elements
          </button>
          <button
            className={`${styles.tab} ${tab === 'loss' ? styles.tabActive : ''}`}
            onClick={() => setTab('loss')}
          >
            Loss Budget
          </button>
        </div>

        <div className={styles.tabContent}>
          {tab === 'workflow' && (
            <WorkflowPanel
              design={design}
              step={design.workflowStep}
              onSetTool={onSetTool}
            />
          )}

          {tab === 'elements' && (
            <div className={styles.elementsTab}>
              {/* Stats */}
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statValue}>{stats.nodeCount}</div>
                  <div className={styles.statLabel}>Nodes</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statValue}>{stats.cableCount}</div>
                  <div className={styles.statLabel}>Cables</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statValue}>{formatMeters(stats.totalLength)}</div>
                  <div className={styles.statLabel}>Total Fiber</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statValue}>{stats.areaCount}</div>
                  <div className={styles.statLabel}>Areas</div>
                </div>
              </div>

              {/* Nodes list */}
              {project.nodes.length > 0 && (
                <ElementSection title="Network Nodes" icon={<Radio size={13} />}>
                  {project.nodes.map((node: NetworkNode) => (
                    <ElementRow
                      key={node.id}
                      id={node.id}
                      name={node.name}
                      sub={node.type.toUpperCase() + (node.splitRatio ? ` · ${node.splitRatio}` : '')}
                      selected={selectedId === node.id}
                      editing={editingId === node.id}
                      editName={editName}
                      onEditNameChange={setEditName}
                      onSelect={() => onSelect(node.id)}
                      onStartEdit={() => startEdit(node.id, node.name)}
                      onCommitEdit={() => {
                        if (editingId) updateNode(editingId, { name: editName });
                        setEditingId(null);
                      }}
                      onCancelEdit={cancelEdit}
                      onDelete={() => deleteNode(node.id)}
                    />
                  ))}
                </ElementSection>
              )}

              {/* Cables list */}
              {project.cables.length > 0 && (
                <ElementSection title="Fiber Cables" icon={<List size={13} />}>
                  {project.cables.map((cable: FiberCable) => {
                    const from = project.nodes.find((n) => n.id === cable.fromNodeId);
                    const to = project.nodes.find((n) => n.id === cable.toNodeId);
                    return (
                      <ElementRow
                        key={cable.id}
                        id={cable.id}
                        name={`${from?.name ?? '?'} → ${to?.name ?? '?'}`}
                        sub={`${cable.cableType} · ${formatMeters(cable.length)} · ${cable.cores}F`}
                        selected={selectedId === cable.id}
                        editing={false}
                        editName=''
                        onEditNameChange={() => {}}
                        onSelect={() => onSelect(cable.id)}
                        onStartEdit={() => {}}
                        onCommitEdit={() => {}}
                        onCancelEdit={cancelEdit}
                        onDelete={() => deleteCable(cable.id)}
                      />
                    );
                  })}
                </ElementSection>
              )}

              {/* Areas list */}
              {project.areas.length > 0 && (
                <ElementSection title="Service Areas" icon={<Settings size={13} />}>
                  {project.areas.map((area: ServiceArea) => (
                    <ElementRow
                      key={area.id}
                      id={area.id}
                      name={area.name}
                      sub={`${area.path.length} vertices`}
                      selected={selectedId === area.id}
                      editing={editingId === area.id}
                      editName={editName}
                      onEditNameChange={setEditName}
                      onSelect={() => onSelect(area.id)}
                      onStartEdit={() => startEdit(area.id, area.name)}
                      onCommitEdit={() => setEditingId(null)}
                      onCancelEdit={cancelEdit}
                      onDelete={() => deleteArea(area.id)}
                    />
                  ))}
                </ElementSection>
              )}

              {project.nodes.length === 0 && project.cables.length === 0 && project.areas.length === 0 && (
                <div className={styles.empty}>No elements yet. Use the toolbar to place equipment.</div>
              )}
            </div>
          )}

          {tab === 'loss' && (
            <LossBudgetPanel design={design} />
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          {totalOnts > 0 && (
            <div className={`${styles.feasibility} ${feasibleCount === totalOnts ? styles.feasibilityOk : styles.feasibilityWarn}`}>
              {feasibleCount === totalOnts ? (
                <><CheckCircle size={13} /> All {totalOnts} ONT{totalOnts > 1 ? 's' : ''} within budget</>
              ) : (
                <><AlertTriangle size={13} /> {totalOnts - feasibleCount}/{totalOnts} ONTs over budget</>
              )}
            </div>
          )}
          <button className={styles.previewBtn} onClick={() => setShowPreview(true)}>
            <Eye size={14} /> Preview Report
          </button>
        </div>
      </div>

      {showPreview && (
        <PreviewModal design={design} onClose={() => setShowPreview(false)} />
      )}
    </>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function ElementSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className={styles.section}>
      <button className={styles.sectionHeader} onClick={() => setOpen((o) => !o)}>
        {icon}
        <span>{title}</span>
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>
      {open && <div className={styles.sectionBody}>{children}</div>}
    </div>
  );
}

type RowProps = {
  id: string;
  name: string;
  sub: string;
  selected: boolean;
  editing: boolean;
  editName: string;
  onEditNameChange: (v: string) => void;
  onSelect: () => void;
  onStartEdit: () => void;
  onCommitEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
};

function ElementRow({
  name, sub, selected, editing, editName,
  onEditNameChange, onSelect, onStartEdit, onCommitEdit, onCancelEdit, onDelete,
}: RowProps) {
  return (
    <div className={`${styles.elementRow} ${selected ? styles.elementRowSelected : ''}`} onClick={onSelect}>
      <div className={styles.elementInfo}>
        {editing ? (
          <input
            className={styles.inlineInput}
            value={editName}
            autoFocus
            onChange={(e) => onEditNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onCommitEdit();
              if (e.key === 'Escape') onCancelEdit();
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className={styles.elementName}>{name}</span>
        )}
        <span className={styles.elementSub}>{sub}</span>
      </div>
      <div className={styles.elementActions}>
        {editing ? (
          <>
            <button onClick={(e) => { e.stopPropagation(); onCommitEdit(); }} title="Save"><Check size={12} /></button>
            <button onClick={(e) => { e.stopPropagation(); onCancelEdit(); }} title="Cancel"><X size={12} /></button>
          </>
        ) : (
          <button onClick={(e) => { e.stopPropagation(); onStartEdit(); }} title="Rename"><Edit3 size={12} /></button>
        )}
        <button
          className={styles.deleteBtn}
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          title="Delete"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}
