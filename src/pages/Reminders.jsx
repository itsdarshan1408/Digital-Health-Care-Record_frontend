import { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { Plus, Bell, Pill, Calendar, Activity, X, Trash2, Power } from 'lucide-react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const Reminders = () => {
  const [reminders, setReminders] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'medication',
    time: '09:00',
    frequency: 'daily',
    daysOfWeek: [],
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
  });

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      const { data } = await axiosInstance.get('/reminders');
      setReminders(data);
    } catch (error) {
      toast.error('Failed to fetch reminders');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axiosInstance.post('/reminders', {
        ...formData,
        schedule: {
          time: formData.time,
          frequency: formData.frequency,
          daysOfWeek: formData.daysOfWeek,
          startDate: formData.startDate,
          endDate: formData.endDate || undefined,
        },
      });
      toast.success('Reminder created!');
      setShowModal(false);
      resetForm();
      fetchReminders();
    } catch (error) {
      toast.error('Failed to create reminder');
    }
  };

  const toggleReminder = async (id) => {
    try {
      await axiosInstance.patch(`/reminders/${id}/toggle`);
      fetchReminders();
      toast.success('Reminder updated');
    } catch (error) {
      toast.error('Failed to update reminder');
    }
  };

  const deleteReminder = async (id) => {
    if (!window.confirm('Delete this reminder?')) return;

    try {
      await axiosInstance.delete(`/reminders/${id}`);
      toast.success('Reminder deleted');
      fetchReminders();
    } catch (error) {
      toast.error('Failed to delete reminder');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'medication',
      time: '09:00',
      frequency: 'daily',
      daysOfWeek: [],
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
    });
  };

  const reminderTypes = [
    { value: 'medication', label: 'Medication', icon: Pill, color: 'blue' },
    { value: 'appointment', label: 'Appointment', icon: Calendar, color: 'purple' },
    { value: 'exercise', label: 'Exercise', icon: Activity, color: 'green' },
    { value: 'water', label: 'Water', icon: Bell, color: 'cyan' },
    { value: 'meal', label: 'Meal', icon: Bell, color: 'orange' },
    { value: 'other', label: 'Other', icon: Bell, color: 'gray' },
  ];

  const getTypeIcon = (type) => {
    const reminderType = reminderTypes.find((t) => t.value === type);
    return reminderType ? reminderType.icon : Bell;
  };

  const getTypeColor = (type) => {
    const colorMap = {
      medication: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      appointment: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      exercise: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      water: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
      meal: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      other: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    };
    return colorMap[type] || colorMap.other;
  };

  const weekDays = [
    { value: 0, label: 'Sun' },
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' },
  ];

  const toggleDayOfWeek = (day) => {
    if (formData.daysOfWeek.includes(day)) {
      setFormData({
        ...formData,
        daysOfWeek: formData.daysOfWeek.filter((d) => d !== day),
      });
    } else {
      setFormData({
        ...formData,
        daysOfWeek: [...formData.daysOfWeek, day],
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Reminders
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Never miss your medications and health activities
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Reminder</span>
        </button>
      </div>

      {/* Reminders List */}
      {reminders.length === 0 ? (
        <div className="card text-center py-12">
          <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No reminders yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Create your first reminder to stay on track
          </p>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            Create Reminder
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reminders.map((reminder) => {
            const Icon = getTypeIcon(reminder.type);
            return (
              <div
                key={reminder._id}
                className={`card ${
                  !reminder.isActive ? 'opacity-60' : ''
                } transition-all`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${getTypeColor(reminder.type)}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {reminder.title}
                      </h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                        {reminder.type}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleReminder(reminder._id)}
                    className={`p-2 rounded-lg transition ${
                      reminder.isActive
                        ? 'bg-green-100 text-green-600 dark:bg-green-900/30'
                        : 'bg-gray-100 text-gray-400 dark:bg-gray-700'
                    }`}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                </div>

                {reminder.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {reminder.description}
                  </p>
                )}

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Bell className="w-4 h-4 mr-2" />
                    <span>Time: {reminder.schedule?.time}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span className="capitalize">
                      {reminder.schedule?.frequency}
                    </span>
                  </div>
                  {reminder.schedule?.frequency === 'weekly' &&
                    reminder.schedule?.daysOfWeek?.length > 0 && (
                      <div className="flex items-center gap-1 mt-2">
                        {reminder.schedule.daysOfWeek.map((day) => (
                          <span
                            key={day}
                            className="px-2 py-1 text-xs bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400 rounded"
                          >
                            {weekDays[day]?.label}
                          </span>
                        ))}
                      </div>
                    )}
                </div>

                <button
                  onClick={() => deleteReminder(reminder._id)}
                  className="w-full py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                >
                  <Trash2 className="w-4 h-4 inline mr-1" />
                  Delete
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Reminder Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Create Reminder
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
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    className="input-field"
                  >
                    {reminderTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows="2"
                    className="input-field"
                  ></textarea>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Time
                    </label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) =>
                        setFormData({ ...formData, time: e.target.value })
                      }
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Frequency
                    </label>
                    <select
                      value={formData.frequency}
                      onChange={(e) =>
                        setFormData({ ...formData, frequency: e.target.value })
                      }
                      className="input-field"
                    >
                      <option value="once">Once</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </div>

                {formData.frequency === 'weekly' && (
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Days of Week
                    </label>
                    <div className="flex gap-2">
                      {weekDays.map((day) => (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => toggleDayOfWeek(day.value)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                            formData.daysOfWeek.includes(day.value)
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData({ ...formData, startDate: e.target.value })
                      }
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      End Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) =>
                        setFormData({ ...formData, endDate: e.target.value })
                      }
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button type="submit" className="flex-1 btn-primary">
                    Create Reminder
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

export default Reminders;
