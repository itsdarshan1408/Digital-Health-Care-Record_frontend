import { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { Plus, Activity, Flame, TrendingUp, X, Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { Line } from 'react-chartjs-2';

const FitnessTracker = () => {
  const [entries, setEntries] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    type: 'cardio',
    duration: '',
    calories: '',
    steps: '',
    distance: '',
    notes: '',
    intensity: 'medium',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [entriesRes, statsRes] = await Promise.all([
        axiosInstance.get('/fitness'),
        axiosInstance.get('/fitness/stats?period=week'),
      ]);
      setEntries(entriesRes.data);
      setStats(statsRes.data);
    } catch (error) {
      toast.error('Failed to fetch fitness data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axiosInstance.post('/fitness', formData);
      toast.success('Workout logged successfully');
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error('Failed to log workout');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this workout?')) return;

    try {
      await axiosInstance.delete(`/fitness/${id}`);
      toast.success('Workout deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete workout');
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'cardio',
      duration: '',
      calories: '',
      steps: '',
      distance: '',
      notes: '',
      intensity: 'medium',
      date: new Date().toISOString().split('T')[0],
    });
  };

  const workoutTypes = [
    { value: 'cardio', label: 'Cardio', icon: '🏃' },
    { value: 'strength', label: 'Strength', icon: '💪' },
    { value: 'yoga', label: 'Yoga', icon: '🧘' },
    { value: 'sports', label: 'Sports', icon: '⚽' },
    { value: 'walking', label: 'Walking', icon: '🚶' },
    { value: 'running', label: 'Running', icon: '🏃' },
    { value: 'cycling', label: 'Cycling', icon: '🚴' },
    { value: 'other', label: 'Other', icon: '🎯' },
  ];

  // Chart data
  const chartData = {
    labels: entries.slice(0, 7).reverse().map(e => format(new Date(e.date), 'MMM dd')),
    datasets: [
      {
        label: 'Calories Burned',
        data: entries.slice(0, 7).reverse().map(e => e.calories),
        borderColor: 'rgb(102, 126, 234)',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Fitness Tracker
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor your workouts and progress
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Log Workout</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Workouts
            </h3>
            <Activity className="w-5 h-5 text-primary-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {stats?.totalWorkouts || 0}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            This week
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Calories Burned
            </h3>
            <Flame className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {stats?.totalCalories || 0}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Total this week
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Duration
            </h3>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {stats?.totalDuration || 0}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Minutes
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Steps
            </h3>
            <Activity className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {stats?.totalSteps?.toLocaleString() || 0}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            This week
          </p>
        </div>
      </div>

      {/* Activity Chart */}
      <div className="card">
        <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-gray-100">
          Weekly Progress
        </h3>
        <div className="h-64">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Workout History */}
      <div className="card">
        <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-gray-100">
          Recent Workouts
        </h3>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="text-gray-600 dark:text-gray-400">
              No workouts logged yet
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div
                key={entry._id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:shadow-md transition"
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className="text-3xl">
                    {workoutTypes.find(t => t.value === entry.type)?.icon || '🎯'}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 capitalize">
                      {entry.type}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {format(new Date(entry.date), 'MMM dd, yyyy')} • {entry.duration} min • {entry.calories} cal
                    </p>
                    {entry.notes && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {entry.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    entry.intensity === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                    entry.intensity === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  }`}>
                    {entry.intensity}
                  </span>
                  <button
                    onClick={() => handleDelete(entry._id)}
                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Workout Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Log Workout
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Workout Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value })
                      }
                      className="input-field"
                    >
                      {workoutTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.icon} {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Date
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) =>
                        setFormData({ ...formData, duration: e.target.value })
                      }
                      className="input-field"
                      required
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Calories Burned
                    </label>
                    <input
                      type="number"
                      value={formData.calories}
                      onChange={(e) =>
                        setFormData({ ...formData, calories: e.target.value })
                      }
                      className="input-field"
                      required
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Steps
                    </label>
                    <input
                      type="number"
                      value={formData.steps}
                      onChange={(e) =>
                        setFormData({ ...formData, steps: e.target.value })
                      }
                      className="input-field"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Distance (km)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.distance}
                      onChange={(e) =>
                        setFormData({ ...formData, distance: e.target.value })
                      }
                      className="input-field"
                      min="0"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Intensity
                    </label>
                    <select
                      value={formData.intensity}
                      onChange={(e) =>
                        setFormData({ ...formData, intensity: e.target.value })
                      }
                      className="input-field"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      rows="3"
                      className="input-field"
                      placeholder="How did you feel?"
                    ></textarea>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button type="submit" className="flex-1 btn-primary">
                    Log Workout
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FitnessTracker;
