import { Todo } from '@/types';
import TodoItem from '@/components/TodoItem';
import styles from './TodoList.module.css';

type TodoListProps = {
  todos: Todo[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, text: string) => void;
};

export default function TodoList({ todos, onToggle, onDelete, onEdit }: TodoListProps) {
  if (todos.length === 0) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>🎉</span>
        <p className={styles.emptyText}>Nothing here yet!</p>
        <p className={styles.emptySubtext}>Add a task above to get started.</p>
      </div>
    );
  }

  return (
    <ul className={styles.list}>
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={onToggle}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </ul>
  );
}
