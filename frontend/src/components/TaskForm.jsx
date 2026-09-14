import { useEffect, useState } from 'react';

const emptyTask = { title: '', description: '', status: 'todo', priority: 'medium' };

export default function TaskForm({ task, onSubmit, onCancel }) {
  const [form, setForm] = useState(task || emptyTask);

  useEffect(() => setForm(task || emptyTask), [task]);

  const submit = async (event) => {
    event.preventDefault();
    await onSubmit(form);
    if (!task) setForm(emptyTask);
  };

  return (
    <form className="task-form" onSubmit={submit}>
      <input required maxLength="200" placeholder="Task title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      <textarea maxLength="5000" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
        <option value="todo">To do</option><option value="in-progress">In progress</option><option value="done">Done</option>
      </select>
      <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
        <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
      </select>
      <button>{task ? 'Save changes' : 'Add task'}</button>
      {task && <button type="button" onClick={onCancel}>Cancel</button>}
    </form>
  );
}
