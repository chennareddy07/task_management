import TaskItem from './TaskItem.jsx';

export default function TaskList({ tasks, onEdit, onDelete }) {
  if (!tasks.length) return <p>No tasks yet. Add your first one above.</p>;
  return <section className="task-list">{tasks.map((task) => <TaskItem key={task.id || task._id} task={task} onEdit={onEdit} onDelete={onDelete} />)}</section>;
}
