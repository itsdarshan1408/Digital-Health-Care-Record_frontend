import { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { Plus, UtensilsCrossed, Trash2, X, Lightbulb } from 'lucide-react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { Bar } from 'react-chartjs-2';

const DietPlanner = () => {
  const [plans, setPlans] = useState([]);
  const [stats, setStats] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [meals, setMeals] = useState([]);
  const [currentMeal, setCurrentMeal] = useState({
    name: '',
    type: 'breakfast',
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
  });
  const [planData, setPlanData] = useState({
    date: new Date().toISOString().split('T')[0],
    goal: 'maintenance',
    waterIntake: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [plansRes, statsRes] = await Promise.all([
        axiosInstance.get('/diet'),
        axiosInstance.get('/diet/stats?period=week'),
      ]);
      setPlans(plansRes.data);
      setStats(statsRes.data);
    } catch (error) {
      toast.error('Failed to fetch diet data');
    }
  };

  const addMeal = () => {
    if (!currentMeal.name || !currentMeal.calories) {
      toast.error('Please fill in meal name and calories');
      return;
    }
    setMeals([...meals, { ...currentMeal, macros: { protein: currentMeal.protein || 0, carbs: currentMeal.carbs || 0, fats: currentMeal.fats || 0 }}]);
    setCurrentMeal({ name: '', type: 'breakfast', calories: '', protein: '', carbs: '', fats: '' });
  };

  const removeMeal = (index) => {
    setMeals(meals.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (meals.length === 0) {
      toast.error('Please add at least one meal');
      return;
    }

    try {
      await axiosInstance.post('/diet', {
        ...planData,
        meals,
      });
      toast.success('Diet plan created successfully');
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error('Failed to create diet plan');
    }
  };

  const getSuggestions = async () => {
    try {
      const { data } = await axiosInstance.post('/diet/suggestions', {
        goal: planData.goal,
        calories: 2000,
      });
      setSuggestions(data);
      setShowSuggestions(true);
    } catch (error) {
      toast.error('Failed to get suggestions');
    }
  };

  const resetForm = () => {
    setMeals([]);
    setPlanData({
      date: new Date().toISOString().split('T')[0],
      goal: 'maintenance',
      waterIntake: '',
    });
    setCurrentMeal({ name: '', type: 'breakfast', calories: '', protein: '', carbs: '', fats: '' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this diet plan?')) return;

    try {
      await axiosInstance.delete(`/diet/${id}`);
      toast.success('Diet plan deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete diet plan');
    }
  };

  const totalCalories = meals.reduce((sum, meal) => sum + Number(meal.calories), 0);

  // Chart data
  const chartData = {
    labels: plans.slice(0, 7).reverse().map(p => format(new Date(p.date), 'MMM dd')),
    datasets: [
      {
        label: 'Daily Calories',
        data: plans.slice(0, 7).reverse().map(p => p.totalCalories),
        backgroundColor: 'rgba(168, 85, 247, 0.6)',
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Diet Planner
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Plan your meals and track nutrition
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Diet Plan</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Average Daily Calories
          </h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {Math.round(stats?.averageCaloriesPerDay) || 0}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Per day this week
          </p>
        </div>

        <div className="card">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Total Calories
          </h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {stats?.totalCalories || 0}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            This week
          </p>
        </div>

        <div className="card">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Total Water
          </h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {stats?.totalWaterIntake || 0}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Glasses this week
          </p>
        </div>
      </div>

      {/* Calorie Chart */}
      {plans.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-gray-100">
            Weekly Calorie Intake
          </h3>
          <div className="h-64">
            <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      )}

      {/* Diet Plans */}
      <div className="card">
        <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-gray-100">
          Recent Diet Plans
        </h3>

        {plans.length === 0 ? (
          <div className="text-center py-8">
            <UtensilsCrossed className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="text-gray-600 dark:text-gray-400">
              No diet plans yet
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {plans.map((plan) => (
              <div
                key={plan._id}
                className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                      {format(new Date(plan.date), 'MMMM dd, yyyy')}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                      Goal: {plan.goal.replace('-', ' ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary-600">
                      {plan.totalCalories}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Total calories
                    </p>
                    <button
                      onClick={() => handleDelete(plan._id)}
                      className="mt-2 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {plan.meals.map((meal, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white dark:bg-gray-700 rounded-lg"
                    >
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-1">
                        {meal.type}
                      </p>
                      <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                        {meal.name}
                      </p>
                      <p className="text-xs text-primary-600 mt-1">
                        {meal.calories} cal
                      </p>
                    </div>
                  ))}
                </div>

                {plan.waterIntake > 0 && (
                  <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                    💧 Water intake: {plan.waterIntake} glasses
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Diet Plan Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Create Diet Plan
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
                      Date
                    </label>
                    <input
                      type="date"
                      value={planData.date}
                      onChange={(e) =>
                        setPlanData({ ...planData, date: e.target.value })
                      }
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Goal
                    </label>
                    <select
                      value={planData.goal}
                      onChange={(e) =>
                        setPlanData({ ...planData, goal: e.target.value })
                      }
                      className="input-field"
                    >
                      <option value="weight-loss">Weight Loss</option>
                      <option value="muscle-gain">Muscle Gain</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="general-health">General Health</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Water Intake (glasses)
                    </label>
                    <input
                      type="number"
                      value={planData.waterIntake}
                      onChange={(e) =>
                        setPlanData({ ...planData, waterIntake: e.target.value })
                      }
                      className="input-field"
                      min="0"
                    />
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      Add Meals
                    </h3>
                    <button
                      type="button"
                      onClick={getSuggestions}
                      className="text-sm text-primary-600 hover:text-primary-700 flex items-center space-x-1"
                    >
                      <Lightbulb className="w-4 h-4" />
                      <span>Get Suggestions</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <input
                      type="text"
                      value={currentMeal.name}
                      onChange={(e) =>
                        setCurrentMeal({ ...currentMeal, name: e.target.value })
                      }
                      placeholder="Meal name"
                      className="input-field"
                    />
                    <select
                      value={currentMeal.type}
                      onChange={(e) =>
                        setCurrentMeal({ ...currentMeal, type: e.target.value })
                      }
                      className="input-field"
                    >
                      <option value="breakfast">Breakfast</option>
                      <option value="lunch">Lunch</option>
                      <option value="dinner">Dinner</option>
                      <option value="snack">Snack</option>
                    </select>
                    <input
                      type="number"
                      value={currentMeal.calories}
                      onChange={(e) =>
                        setCurrentMeal({ ...currentMeal, calories: e.target.value })
                      }
                      placeholder="Calories"
                      className="input-field"
                    />
                    <input
                      type="number"
                      value={currentMeal.protein}
                      onChange={(e) =>
                        setCurrentMeal({ ...currentMeal, protein: e.target.value })
                      }
                      placeholder="Protein (g)"
                      className="input-field"
                    />
                    <input
                      type="number"
                      value={currentMeal.carbs}
                      onChange={(e) =>
                        setCurrentMeal({ ...currentMeal, carbs: e.target.value })
                      }
                      placeholder="Carbs (g)"
                      className="input-field"
                    />
                    <input
                      type="number"
                      value={currentMeal.fats}
                      onChange={(e) =>
                        setCurrentMeal({ ...currentMeal, fats: e.target.value })
                      }
                      placeholder="Fats (g)"
                      className="input-field"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={addMeal}
                    className="w-full btn-secondary mb-4"
                  >
                    Add Meal
                  </button>

                  {meals.length > 0 && (
                    <div className="space-y-2 mb-4">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Meals ({totalCalories} total calories)
                      </p>
                      {meals.map((meal, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded"
                        >
                          <div>
                            <span className="font-medium">{meal.name}</span>
                            <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                              ({meal.type}) - {meal.calories} cal
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeMeal(idx)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex space-x-3 pt-4">
                  <button type="submit" className="flex-1 btn-primary">
                    Save Diet Plan
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

      {/* Suggestions Modal */}
      {showSuggestions && suggestions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Meal Suggestions
                </h2>
                <button
                  onClick={() => setShowSuggestions(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {Object.entries(suggestions.suggestions).map(([type, meals]) => (
                  <div key={type}>
                    <h3 className="font-semibold capitalize mb-2 text-gray-900 dark:text-gray-100">
                      {type}
                    </h3>
                    <ul className="space-y-1">
                      {meals.map((meal, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-gray-600 dark:text-gray-400 pl-4"
                        >
                          • {meal}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DietPlanner;
