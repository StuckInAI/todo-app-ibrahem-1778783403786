import { useState } from 'react';
import { Trash2, Pencil, Check, X } from 'lucide-react';
import { Todo } from '@/types';
import styles from './TodoItem.module.css';
import clsx from 'clsx';

type TodoItemProps = {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, text: string) => void;
};

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Med',
  high: 'High',
};

export default function TodoItem({ todo, onToggle, onDelete, onEdit }: TodoItemProps) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);

  function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (editText.trim()) {
      onEdit(todo.id, editText);
    }
    setEditing(false);
  }

  function handleEditKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setEditText(todo.text);
      setEditing(false);
    }
  }

  function startEditing() {
    setEditText(todo.text);
    setEditing(true);
  }

  return (
    <li className={clsx(styles.item, todo.completed && styles.completed)}>
      <button
        className={clsx(styles.checkbox, todo.completed && styles.checkboxDone)}
        onClick={() => onToggle(todo.id)}
        aria-label={todo.completed ? 'Mark incomplete' : 'Mark complete'}
      >
        {todo.completed && <Check size={14} strokeWidth={3} />}
      </button>

      <div className={styles.content}>
        {editing ? (
          <form className={styles.editForm} onSubmit={handleEditSubmit}>
            <input
              className={styles.editInput}
              value={editText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditText(e.target.value)}
              onKeyDown={handleEditKeyDown}
              autoFocus
            />
            <button type="submit" className={styles.iconBtn} aria-label="Save">
              <Check size={16} />
            </button>
            <button
              type="button"
              className={styles.iconBtn}
              onClick={() => { setEditText(todo.text); setEditing(false); }}
              aria-label="Cancel"
            >
              <X size={16} />
            </button>
          </form>
        ) : (
          <span className={styles.text}>{todo.text}</span>
        )}
      </div>

      <span className={clsx(styles.priority, styles[`priority_${todo.priority}`])}>
        {PRIORITY_LABELS[todo.priority]}
      </span>

      {!editing && (
        <div className={styles.actions}>
          <button
            className={styles.iconBtn}
            onClick={startEditing}
            aria-label="Edit"
          >
            <Pencil size={15} />
          </button>
          <button
            className={clsx(styles.iconBtn, styles.deleteBtn)}
            onClick={() => onDelete(todo.id)}
            aria-label="Delete"
          >
            <Trash2 size={15} />
          </button>
        </div>
      )}
    </li>
  );
}
