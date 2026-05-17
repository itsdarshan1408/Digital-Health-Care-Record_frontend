import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../utils/axiosInstance';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import {
  Activity,
  Heart,
  Droplet,
  Moon,
  TrendingUp,
  Calendar,
  Target,
  Award,
} from 'lucide-react';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const { user } = useAuth();
  const [healthMetrics, setHealthMetrics] = useState(null);
  const [fitnessStats, setFitnessStats] = useState(null);
  const [dietStats, setDietStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [profileRes, fitnessRes, dietRes] = await Promise.all([
        axiosInstance.get('/profile'),
        axiosInstance.get('/fitness/stats?period=week'),
        axiosInstance.get('/diet/stats?period=week'),
      ]);

      setHealthMetrics(profileRes.data.healthMetrics);
      setFitnessStats(fitnessRes.data);
      setDietStats(dietRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const healthCards = [
    {
      title: 'BMI',
      value: healthMetrics?.bmi || '--',
      unit: '',
      icon: Activity,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'Heart Rate',
      value: healthMetrics?.heartRate || '--',
      unit: 'bpm',
      icon: Heart,
      color: 'from-red-500 to-pink-500',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
    },
    {
      title: 'Blood Pressure',
      value: healthMetrics?.bloodPressure?.systolic
        ? `${healthMetrics.bloodPressure.systolic}/${healthMetrics.bloodPressure.diastolic}`
        : '--',
      unit: 'mmHg',
      icon: Droplet,
      color: 'from-purple-500 to-indigo-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      title: 'Sleep',
      value: healthMetrics?.sleepHours || '--',
      unit: 'hours',
      icon: Moon,
      color: 'from-indigo-500 to-blue-500',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    },
  ];

  // Weekly activity chart data
  const activityChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Calories Burned',
        data: [420, 380, 500, 450, 520, 600, 480],
        borderColor: 'rgb(102, 126, 234)',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        tension: 0.4,
      },
    ],
  };

  // Workout types chart data
  const workoutTypesData = {
    labels: ['Cardio', 'Strength', 'Yoga', 'Sports'],
    datasets: [
      {
        data: [35, 25, 20, 20],
        backgroundColor: [
          'rgba(102, 126, 234, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
        ],
        borderWidth: 0,
      },
    ],
  };

  // Calories chart data
  const caloriesChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Calories Intake',
        data: [2100, 1950, 2200, 2050, 2150, 2300, 2000],
        backgroundColor: 'rgba(168, 85, 247, 0.6)',
      },
      {
        label: 'Target',
        data: [2000, 2000, 2000, 2000, 2000, 2000, 2000],
        backgroundColor: 'rgba(102, 126, 234, 0.6)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user?.name}! 👋
        </h1>
        <p className="text-white/90">
          Here's your health overview for today
        </p>
      </div>

      {/* Health Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {healthCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${card.bgColor}`}>
                  <Icon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <h3 className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                {card.title}
              </h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {card.value}
                {card.unit && (
                  <span className="text-lg text-gray-500 ml-1">{card.unit}</span>
                )}
              </p>
            </div>
          );
        })}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Weekly Workouts
            </h3>
            <Activity className="w-5 h-5 text-primary-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {fitnessStats?.totalWorkouts || 0}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Total this week
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Calories Burned
            </h3>
            <Target className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {fitnessStats?.totalCalories || 0}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Total this week
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Active Days
            </h3>
            <Calendar className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {dietStats?.totalDays || 0}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Days tracked
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <div className="card">
          <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-gray-100">
            Weekly Activity
          </h3>
          <div className="h-64">
            <Line data={activityChartData} options={chartOptions} />
          </div>
        </div>

        {/* Workout Types */}
        <div className="card">
          <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-gray-100">
            Workout Distribution
          </h3>
          <div className="h-64 flex items-center justify-center">
            <Doughnut
              data={workoutTypesData}
              options={{ ...chartOptions, scales: undefined }}
            />
          </div>
        </div>

        {/* Calories Chart */}
        <div className="card lg:col-span-2">
          <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-gray-100">
            Daily Calorie Intake
          </h3>
          <div className="h-64">
            <Bar data={caloriesChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-gray-100">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 transition group">
            <Activity className="w-8 h-8 mx-auto mb-2 text-gray-400 group-hover:text-primary-600" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Log Workout
            </p>
          </button>
          <button className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 transition group">
            <Target className="w-8 h-8 mx-auto mb-2 text-gray-400 group-hover:text-primary-600" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Add Meal
            </p>
          </button>
          <button className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 transition group">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-400 group-hover:text-primary-600" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Set Reminder
            </p>
          </button>
          <button className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 transition group">
            <Award className="w-8 h-8 mx-auto mb-2 text-gray-400 group-hover:text-primary-600" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Join Challenge
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
