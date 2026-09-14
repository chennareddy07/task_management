import { useEffect, useState } from 'react';
import api from '../api/client.js';
import TaskForm from './TaskForm.jsx';
import TaskList from './TaskList.jsx';

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [editingTask, setEditingTask] = useState(null);
  const [error, setError] = useState('');

  const loadTasks = async () => {
    try {
      const { data } = await api.get('/tasks');
      setTasks(data.tasks);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load tasks');
    }
  };

  useEffect(() => { loadTasks(); }, []);

  const saveTask = async (task) => {
    try {
      const response = editingTask
        ? await api.put(`/tasks/${editingTask.id || editingTask._id}`, task)
        : await api.post('/tasks', task);
      setTasks((current) => editingTask
        ? current.map((item) => (item.id === editingTask.id || item._id === editingTask._id ? response.data.task : item))
        : [response.data.task, ...current]);
      setEditingTask(null);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save task');
    }
  };

  const deleteTask = async (id) => {
    try {
      await api.delete(`/tasks/${id}`);
      setTasks((current) => current.filter((task) => (task.id || task._id) !== id));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete task');
    }
  };

  return (
    <main className="dashboard">
      <h1>Your tasks</h1>
      {error && <p className="error">{error}</p>}
      <TaskForm task={editingTask} onSubmit={saveTask} onCancel={() => setEditingTask(null)} />
      <TaskList tasks={tasks} onEdit={setEditingTask} onDelete={deleteTask} />
    </main>
  );
}
