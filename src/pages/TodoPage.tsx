import { useState } from 'react';
import { useTodos } from '@/hooks/useTodos';
import AddTodoForm from '@/components/AddTodoForm';
import TodoList from '@/components/TodoList';
import FilterBar from '@/components/FilterBar';
import StatsBar from '@/components/StatsBar';
import styles from './TodoPage.module.css';

export default function TodoPage() {
  const {
    todos,
    filter,
    setFilter,
    addTodo,
    toggleTodo,
    deleteTodo,
    editTodo,
    clearCompleted,
    activeCount,
    completedCount,
  } = useTodos();

  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className={clsx(styles.page, darkMode && styles.dark)}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.logo}>✓</span>
            <h1 className={styles.title}>My Todos</h1>
          </div>
          <button
            className={styles.themeToggle}
            onClick={() => setDarkMode((d) => !d)}
            aria-label="Toggle theme"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </header>

        <StatsBar activeCount={activeCount} completedCount={completedCount} />

        <AddTodoForm onAdd={addTodo} />

        <FilterBar filter={filter} onFilterChange={setFilter} />

        <TodoList
          todos={todos}
          onToggle={toggleTodo}
          onDelete={deleteTodo}
          onEdit={editTodo}
        />

        {completedCount > 0 && (
          <button className={styles.clearBtn} onClick={clearCompleted}>
            Clear completed ({completedCount})
          </button>
        )}
      </div>
    </div>
  );
}

function clsx(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
