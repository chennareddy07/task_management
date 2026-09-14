export default function TaskItem({ task, onEdit, onDelete }) {
  return (
    <article className="task-item">
      <div>
        <h3>{task.title}</h3>
        <p>{task.description || 'No description'}</p>
        <small>{task.status} · {task.priority} priority</small>
      </div>
      <div>
        <button type="button" onClick={() => onEdit(task)}>Edit</button>
        <button type="button" onClick={() => onDelete(task.id || task._id)}>Delete</button>
      </div>
    </article>
  );
}
