import React from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { 
  FaUserPlus, 
  FaChartLine, 
  FaClock, 
  FaMoneyBillWave,
  FaArrowUp,
  FaArrowDown,
  FaFileUpload
} from 'react-icons/fa';
// import usePermissions from '../../../hooks/usePermissions';
import BulkLeadUpload from '../../user/lead_creation/bulkLead';

// Sample data - Replace with actual data from your API
const leadData = [
  { name: 'Jan', leads: 400 },
  { name: 'Feb', leads: 300 },
  { name: 'Mar', leads: 600 },
  { name: 'Apr', leads: 800 },
  { name: 'May', leads: 500 },
  { name: 'Jun', leads: 700 },
];

const statusData = [
  { name: 'Interested', value: 400, color: '#4F46E5' },
  { name: 'Not Interested', value: 300, color: '#EF4444' },
  { name: 'Call Later', value: 200, color: '#F59E0B' },
  { name: 'Closed', value: 100, color: '#10B981' },
];

const departmentData = [
  { name: 'Sales', leads: 400, closed: 240 },
  { name: 'Marketing', leads: 300, closed: 139 },
  { name: 'Support', leads: 200, closed: 180 },
];

// Updated recent leads data
const recentLeads = [
  {
    id: 1,
    name: 'John Smith',
    email: 'john.smith@example.com',
    status: 'Interested',
    time: '2 hours ago',
    statusColor: '#4F46E5',
    amount: '$12,000',
    avatar: 'JS',
    bgColor: '#EEF2FF'
  },
  {
    id: 2,
    name: 'Sarah Johnson',
    email: 'sarah.j@example.com',
    status: 'Call Later',
    time: '3 hours ago',
    statusColor: '#F59E0B',
    amount: '$8,500',
    avatar: 'SJ',
    bgColor: '#FEF3C7'
  },
  {
    id: 3,
    name: 'Mike Wilson',
    email: 'mike.w@example.com',
    status: 'Interested',
    time: '5 hours ago',
    statusColor: '#4F46E5',
    amount: '$15,000',
    avatar: 'MW',
    bgColor: '#EEF2FF'
  },
  {
    id: 4,
    name: 'Emily Brown',
    email: 'emily.b@example.com',
    status: 'Not Interested',
    time: '6 hours ago',
    statusColor: '#EF4444',
    amount: '$0',
    avatar: 'EB',
    bgColor: '#FEE2E2'
  }
];

// Sample performance metrics
const performanceMetrics = [
  {
    metric: 'Average Deal Size',
    value: '$42,500',
    trend: '+8.2%',
    isPositive: true
  },
  {
    metric: 'Lead Response Time',
    value: '1.8 hours',
    trend: '-12%',
    isPositive: true
  },
  {
    metric: 'Conversion Rate',
    value: '32%',
    trend: '+5%',
    isPositive: true
  },
  {
    metric: 'Customer Satisfaction',
    value: '4.8/5',
    trend: '+0.3',
    isPositive: true
  }
];

// Add these new sample data arrays after the existing ones
const activityTimeline = [
  {
    id: 1,
    type: 'call',
    title: 'Client Call Scheduled',
    description: 'Upcoming call with John Smith to discuss project requirements',
    time: '2:00 PM',
    date: 'Today',
    status: 'upcoming',
    icon: '📞'
  },
  {
    id: 2,
    type: 'meeting',
    title: 'Team Meeting',
    description: 'Weekly sales team sync-up',
    time: '11:30 AM',
    date: 'Tomorrow',
    status: 'scheduled',
    icon: '👥'
  },
  {
    id: 3,
    type: 'email',
    title: 'Follow-up Email',
    description: 'Send proposal to Sarah Johnson',
    time: '4:00 PM',
    date: 'Today',
    status: 'pending',
    icon: '📧'
  }
];

const upcomingTasks = [
  {
    id: 1,
    title: 'Review Sales Proposals',
    priority: 'High',
    dueDate: 'Today',
    assignee: 'Mike Wilson',
    progress: 75
  },
  {
    id: 2,
    title: 'Client Presentation',
    priority: 'Medium',
    dueDate: 'Tomorrow',
    assignee: 'Sarah Johnson',
    progress: 40
  },
  {
    id: 3,
    title: 'Update Lead Database',
    priority: 'Low',
    dueDate: 'Next Week',
    assignee: 'John Smith',
    progress: 20
  }
];

const keyMetrics = [
  {
    title: 'Sales Velocity',
    value: '4.2 days',
    trend: '+12%',
    description: 'Average time to close deals'
  },
  {
    title: 'Win Rate',
    value: '68%',
    trend: '+5%',
    description: 'Successful deal closure rate'
  },
  {
    title: 'Pipeline Value',
    value: '$1.2M',
    trend: '+8%',
    description: 'Total value of active deals'
  }
];

const StatCard: React.FC<{
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  delay: number;
  icon: React.ReactNode;
  color: string;
  gradientFrom: string;
  gradientTo: string;
}> = ({ title, value, change, isPositive, delay, icon, color, gradientFrom, gradientTo }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="relative bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300 group overflow-hidden"
  >
    {/* Gradient Background on Hover */}
    <div 
      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      style={{
        background: `linear-gradient(145deg, ${gradientFrom}05 0%, ${gradientTo}05 100%)`
      }}
    />

    <div className="relative">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div 
            className="p-3 rounded-lg transition-all duration-300"
            style={{ 
              background: `linear-gradient(145deg, ${gradientFrom}15, ${gradientTo}15)`,
              boxShadow: `0 2px 10px ${color}10`
            }}
          >
            <span style={{ color }}>{icon}</span>
          </div>
          <h3 className="text-lg font-medium text-gray-700">{title}</h3>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <p className="text-2xl font-bold" style={{ color }}>{value}</p>
        <div 
          className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full ${
            isPositive 
              ? 'text-emerald-700 bg-emerald-50' 
              : 'text-rose-700 bg-rose-50'
          }`}
        >
          {isPositive ? <FaArrowUp size={12} /> : <FaArrowDown size={12} />}
          <span>{change}</span>
        </div>
      </div>
    </div>
  </motion.div>
);

const Dashboard: React.FC = () => {
  // const { loading: permissionsLoading } = usePermissions();

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Bulk Upload Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-lg shadow-md p-6 mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <FaFileUpload className="mr-2 text-indigo-600" />
            Bulk Lead Upload
          </h2>
        </div>
        <BulkLeadUpload />
      </motion.div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard Overview</h1>
        <p className="mt-1 text-sm text-gray-500">Track your team's performance and lead management metrics</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Leads"
          value="2,651"
          change="12%"
          isPositive={true}
          delay={0.1}
          icon={<FaUserPlus size={20} />}
          color="#2563EB"
          gradientFrom="#3B82F6"
          gradientTo="#1D4ED8"
        />
        <StatCard
          title="Conversion Rate"
          value="24.8%"
          change="4.1%"
          isPositive={true}
          delay={0.2}
          icon={<FaChartLine size={20} />}
          color="#059669"
          gradientFrom="#10B981"
          gradientTo="#047857"
        />
        <StatCard
          title="Response Time"
          value="2.4h"
          change="0.3h"
          isPositive={false}
          delay={0.3}
          icon={<FaClock size={20} />}
          color="#B45309"
          gradientFrom="#D97706"
          gradientTo="#92400E"
        />
        <StatCard
          title="Active Deals"
          value="$423,389"
          change="8.3%"
          isPositive={true}
          delay={0.4}
          icon={<FaMoneyBillWave size={20} />}
          color="#6D28D9"
          gradientFrom="#7C3AED"
          gradientTo="#5B21B6"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Lead Trend Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
        >
          <h2 className="text-lg font-medium text-gray-900 mb-4">Lead Generation Trend</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={leadData}>
                <defs>
                  <linearGradient id="leadColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="leads"
                  stroke="#4F46E5"
                  fillOpacity={1}
                  fill="url(#leadColor)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Lead Status Distribution */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
        >
          <h2 className="text-lg font-medium text-gray-900 mb-4">Lead Status Distribution</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Department Performance and Additional Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* Department Performance Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="lg:col-span-7 bg-white p-6 rounded-lg shadow-sm border border-gray-200"
        >
          <h2 className="text-lg font-medium text-gray-900 mb-4">Department Performance</h2>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip />
                <Legend />
                <Bar dataKey="leads" name="Total Leads" fill="#4F46E5" />
                <Bar dataKey="closed" name="Closed Deals" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="lg:col-span-5 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-gray-900">Recent Lead Activity</h2>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                View All
              </motion.button>
            </div>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {recentLeads.map((lead, index) => (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="group relative flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-all duration-200"
                >
                  {/* Avatar */}
                  <div 
                    className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium text-gray-700"
                    style={{ backgroundColor: lead.bgColor }}
                  >
                    {lead.avatar}
                  </div>

                  {/* Lead Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                        {lead.name}
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {lead.amount}
                      </p>
                    </div>
                    <div className="mt-1 flex items-center">
                      <p className="text-sm text-gray-500 truncate">{lead.email}</p>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span 
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{ 
                          backgroundColor: `${lead.statusColor}15`,
                          color: lead.statusColor
                        }}
                      >
                        {lead.status}
                      </span>
                      <span className="text-xs text-gray-500">{lead.time}</span>
                    </div>
                  </div>

                  {/* Hover Arrow */}
                  <motion.div 
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    className="absolute right-4 text-gray-400 group-hover:text-indigo-600 transition-colors"
                  >
                    →
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="border-t border-gray-200">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Performance Metrics</h2>
              <div className="space-y-4">
                {performanceMetrics.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">{item.metric}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">{item.value}</span>
                      <span className={`text-xs font-medium ${
                        item.isPositive ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {item.trend}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Additional Dashboard Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Activity Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-4 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity Timeline</h2>
            <div className="space-y-6">
              {activityTimeline.map((activity) => (
                <div key={activity.id} className="relative pl-8 pb-6 last:pb-0">
                  <div className="absolute left-0 top-0 mt-1.5 -ml-[2px] h-full w-[2px] bg-gray-200">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="text-sm">{activity.icon}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-900">{activity.title}</h3>
                    <p className="mt-1 text-sm text-gray-500">{activity.description}</p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                      <span className="font-medium">{activity.time}</span>
                      <span>•</span>
                      <span>{activity.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Upcoming Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-4 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Tasks</h2>
            <div className="space-y-4">
              {upcomingTasks.map((task) => (
                <div key={task.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-900">{task.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      task.priority === 'High' ? 'bg-red-100 text-red-700' :
                      task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">Due: {task.dueDate}</span>
                    <span className="text-xs text-gray-500">{task.assignee}</span>
                  </div>
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold inline-block text-indigo-600">
                          Progress
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold inline-block text-indigo-600">
                          {task.progress}%
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2 text-xs flex rounded bg-indigo-100">
                      <div
                        style={{ width: `${task.progress}%` }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500"
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Key Metrics Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-4 space-y-4"
        >
          {keyMetrics.map((metric) => (
            <div
              key={metric.title}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-300"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500">{metric.title}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  metric.trend.startsWith('+') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {metric.trend}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900">{metric.value}</span>
                <span className="text-sm text-gray-500">{metric.description}</span>
              </div>
              <div className="mt-4 h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full"
                  style={{ width: `${Math.random() * 40 + 60}%` }}
                ></div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard; 