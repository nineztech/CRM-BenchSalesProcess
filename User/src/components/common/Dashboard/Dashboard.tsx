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

const StatCard: React.FC<{
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  delay: number;
}> = ({ title, value, change, isPositive, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
  >
    <h3 className="text-sm font-medium text-gray-500">{title}</h3>
    <div className="mt-2 flex items-baseline">
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      <p className={`ml-2 text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? '↑' : '↓'} {change}
      </p>
    </div>
  </motion.div>
);

const Dashboard: React.FC = () => {
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
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
        />
        <StatCard
          title="Conversion Rate"
          value="24.8%"
          change="4.1%"
          isPositive={true}
          delay={0.2}
        />
        <StatCard
          title="Average Response Time"
          value="2.4h"
          change="0.3h"
          isPositive={false}
          delay={0.3}
        />
        <StatCard
          title="Active Deals"
          value="$423,389"
          change="8.3%"
          isPositive={true}
          delay={0.4}
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Department Performance Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-200"
        >
          <h2 className="text-lg font-medium text-gray-900 mb-4">Department Performance</h2>
          <div className="h-80">
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
          className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
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
            <div className="space-y-5">
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
          <div className="border-t border-gray-200 mt-4">
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
    </div>
  );
};

export default Dashboard; 