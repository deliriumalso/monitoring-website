import React, { useState, useEffect } from 'react';
import { 
    BeakerIcon, 
    BoltIcon,
    ArrowPathIcon,
    PlayIcon,
    PauseIcon,
    ChartBarIcon,
    ClockIcon,
    Cog6ToothIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';

const Dashboard = () => {
    const [realtimeData, setRealtimeData] = useState(null);
    const [historicalData, setHistoricalData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [refreshInterval, setRefreshInterval] = useState(2000); // 2 seconds
    const [lastUpdate, setLastUpdate] = useState(null);
    const [tdsTargetEdit, setTdsTargetEdit] = useState(false);
    const [newTdsTarget, setNewTdsTarget] = useState('');
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchRealtimeData();
        fetchRecentHistory();
        
        let interval;
        if (autoRefresh) {
            interval = setInterval(() => {
                fetchRealtimeData();
                // Update historical data every 30 seconds
                if (Date.now() % 30000 < refreshInterval) {
                    fetchRecentHistory();
                }
            }, refreshInterval);
        }
        
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [autoRefresh, refreshInterval]);

    const fetchRealtimeData = async () => {
        try {
            const response = await axios.get('/api/realtime-data');
            if (response.data.success) {
                console.log('Realtime data received:', response.data.data);
                setRealtimeData(response.data.data);
                setLastUpdate(new Date());
                setError(null);
            } else {
                const errorMsg = response.data.message || 'Unknown error occurred';
                const debugInfo = response.data.debug ? ` (Debug: ${response.data.debug})` : '';
                setError(`API Error: ${errorMsg}${debugInfo}`);
                console.error('API returned error:', response.data);
            }
        } catch (err) {
            let errorMessage = 'Failed to fetch realtime data';
            
            if (err.response) {
                // Server responded with error status
                errorMessage = `Server Error (${err.response.status}): ${err.response.data?.message || err.response.statusText}`;
                if (err.response.data?.debug) {
                    errorMessage += ` - ${err.response.data.debug}`;
                }
            } else if (err.request) {
                // Request made but no response received
                errorMessage = 'No response from server. Please check if Laravel server is running.';
            } else {
                // Something else happened
                errorMessage = `Request failed: ${err.message}`;
            }
            
            setError(errorMessage);
            console.error('Error fetching realtime data:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchRecentHistory = async () => {
        try {
            const response = await axios.get('/api/historical-data', {
                params: {
                    limit: 20
                }
            });
            
            if (response.data.success && response.data.data) {
                const formattedData = response.data.data.map(item => ({
                    ...item,
                    time: new Date(item.timestamp).toLocaleTimeString()
                })).reverse(); // Reverse to show chronological order
                
                setHistoricalData(formattedData);
            }
        } catch (err) {
            console.error('Error fetching historical data:', err);
        }
    };

    const handleRefresh = () => {
        fetchRealtimeData();
        fetchRecentHistory();
    };

    const testFirebaseConnection = async () => {
        try {
            const response = await axios.get('/api/test-firebase');
            console.log('Firebase test result:', response.data);
            alert(`Firebase Test: ${response.data.success ? 'SUCCESS' : 'FAILED'}\n\nMessage: ${response.data.message}\n\nCheck console for detailed diagnostics.`);
        } catch (err) {
            console.error('Firebase test error:', err);
            alert(`Firebase Test Failed: ${err.response?.data?.message || err.message}`);
        }
    };

    const updateTdsTarget = async () => {
        if (!newTdsTarget || newTdsTarget < 100 || newTdsTarget > 3000) {
            alert('Please enter a valid TDS Target value between 100 and 3000 ppm');
            return;
        }

        try {
            setUpdating(true);
            const response = await axios.post('/api/update-tds-target', {
                tds_target: parseFloat(newTdsTarget)
            });

            if (response.data.success) {
                alert(`TDS Target updated successfully to ${newTdsTarget} ppm`);
                setTdsTargetEdit(false);
                setNewTdsTarget('');
                // Refresh data to show updated target
                fetchRealtimeData();
            } else {
                alert(`Failed to update TDS Target: ${response.data.message}`);
            }
        } catch (err) {
            console.error('Error updating TDS Target:', err);
            alert(`Error updating TDS Target: ${err.response?.data?.message || err.message}`);
        } finally {
            setUpdating(false);
        }
    };

    const handleTdsTargetEdit = () => {
        setNewTdsTarget(realtimeData?.TDS_Target || 1000);
        setTdsTargetEdit(true);
    };

    const cancelTdsTargetEdit = () => {
        setTdsTargetEdit(false);
        setNewTdsTarget('');
    };

    const getPumpStatus = (pumpValue) => {
        return pumpValue ? 'Active' : 'Inactive';
    };

    const getPumpStatusColor = (pumpValue) => {
        return pumpValue ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-3" />
                            <div>
                                <h3 className="text-sm font-medium text-red-800">Connection Error</h3>
                                <p className="text-sm text-red-700 mt-1">{error}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setError(null);
                                setLoading(true);
                                fetchRealtimeData();
                            }}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors duration-200"
                        >
                            Retry
                        </button>
                    </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <h3 className="text-sm font-medium text-blue-800 mb-2">Troubleshooting Steps:</h3>
                    <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Check if Laravel server is running on port 8000</li>
                        <li>• Verify Firebase configuration in .env file</li>
                        <li>• Check network connection</li>
                        <li>• Look at browser console for detailed errors</li>
                    </ul>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with Controls */}
            <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Hydroponic Dashboard</h1>
                        <p className="text-gray-600 mt-1">Real-time monitoring and system control</p>
                        {lastUpdate && (
                            <p className="text-sm text-gray-500 mt-1">
                                Last updated: {lastUpdate.toLocaleTimeString()}
                            </p>
                        )}
                    </div>
                    
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <label className="text-sm font-medium text-gray-700">Refresh:</label>
                            <select
                                value={refreshInterval}
                                onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900"
                            >
                                <option value={1000}>1s</option>
                                <option value={2000}>2s</option>
                                <option value={5000}>5s</option>
                                <option value={10000}>10s</option>
                            </select>
                        </div>
                        
                        <button
                            onClick={() => setAutoRefresh(!autoRefresh)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2 ${
                                autoRefresh 
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700 '
                            }`}
                        >
                            {autoRefresh ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
                            <span>{autoRefresh ? 'Pause' : 'Resume'}</span>
                        </button>
                        
                        <button
                            onClick={handleRefresh}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2"
                        >
                            <ArrowPathIcon className="h-4 w-4" />
                            <span>Refresh</span>
                        </button>
                        
                        <button
                            onClick={testFirebaseConnection}
                            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors duration-200"
                        >
                            Test Connection
                        </button>
                    </div>
                </div>
            </div>

            {realtimeData && (
                <>
                    {/* Main Sensor Cards - Row 1 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {/* pH Card */}
                        <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200 hover:shadow-xl transition-shadow duration-300">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                        <BeakerIcon className="h-6 w-6 text-blue-600 " />
                                        <p className="text-sm font-medium text-gray-600 ">pH Level</p>
                                    </div>
                                    <p className="text-2xl lg:text-3xl font-bold text-gray-900 mt-2">{realtimeData.pH || 0}</p>
                                    <p className="text-xs text-gray-500 mt-1">Acidity Level</p>
                                </div>
                            </div>
                        </div>

                        {/* TDS Card */}
                        <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200 hover:shadow-xl transition-shadow duration-300">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                        <ChartBarIcon className="h-6 w-6 text-purple-600 " />
                                        <p className="text-sm font-medium text-gray-600 ">TDS</p>
                                    </div>
                                    <p className="text-2xl lg:text-3xl font-bold text-gray-900 mt-2">{realtimeData.TDS || 0}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        ppm (Target: {realtimeData.TDS_Target || 1000})
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* 12V Current Card */}
                        <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200 hover:shadow-xl transition-shadow duration-300">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                        <BoltIcon className="h-6 w-6 text-yellow-600 " />
                                        <p className="text-sm font-medium text-gray-600 ">12V Current</p>
                                    </div>
                                    <p className="text-2xl lg:text-3xl font-bold text-gray-900 mt-2">{realtimeData.Current_12V || 0}A</p>
                                    <p className="text-xs text-gray-500 mt-1">12V System</p>
                                </div>
                            </div>
                        </div>

                        {/* Last Update Card - Moved from second row */}
                        <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200 hover:shadow-xl transition-shadow duration-300">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                        <ClockIcon className="h-6 w-6 text-gray-600 " />
                                        <p className="text-sm font-medium text-gray-600 ">Last Update</p>
                                    </div>
                                    <p className="text-lg lg:text-xl font-bold text-gray-900 mt-2">
                                        {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Never'}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">Real-time Data</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Secondary Metrics Row - Row 2 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {/* 5V Current Card */}
                        <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200 hover:shadow-xl transition-shadow duration-300">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                        <BoltIcon className="h-6 w-6 text-emerald-600 " />
                                        <p className="text-sm font-medium text-gray-600 ">5V Current</p>
                                    </div>
                                    <p className="text-2xl lg:text-3xl font-bold text-gray-900 mt-2">{realtimeData.Current_5V || 0}A</p>
                                    <p className="text-xs text-gray-500 mt-1">5V System</p>
                                </div>
                            </div>
                        </div>

                        {/* TDS Target Card */}
                        <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200 hover:shadow-xl transition-shadow duration-300">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                        <ChartBarIcon className="h-6 w-6 text-orange-600 " />
                                        <p className="text-sm font-medium text-gray-600 ">TDS Target</p>
                                    </div>
                                    {tdsTargetEdit ? (
                                        <div className="mt-2">
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="number"
                                                    value={newTdsTarget}
                                                    onChange={(e) => setNewTdsTarget(e.target.value)}
                                                    min="100"
                                                    max="3000"
                                                    className="px-2 py-1 border border-gray-300 rounded text-sm bg-white text-gray-900 w-20"
                                                    disabled={updating}
                                                />
                                                <button
                                                    onClick={updateTdsTarget}
                                                    disabled={updating}
                                                    className="px-2 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded text-xs"
                                                >
                                                    {updating ? '...' : '✓'}
                                                </button>
                                                <button
                                                    onClick={cancelTdsTargetEdit}
                                                    disabled={updating}
                                                    className="px-2 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded text-xs"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between mt-2">
                                            <p className="text-2xl lg:text-3xl font-bold text-gray-900 ">{realtimeData.TDS_Target || 1000}</p>
                                            <button
                                                onClick={handleTdsTargetEdit}
                                                className="text-gray-400 hover:text-gray-600 "
                                                title="Edit TDS Target"
                                            >
                                                <Cog6ToothIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1">ppm (Setpoint)</p>
                                </div>
                            </div>
                        </div>

                        {/* System Status Card */}
                        <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200 hover:shadow-xl transition-shadow duration-300">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                        <Cog6ToothIcon className="h-6 w-6 text-indigo-600 " />
                                        <p className="text-sm font-medium text-gray-600 ">System Status</p>
                                    </div>
                                    <p className="text-2xl lg:text-3xl font-bold text-green-600 mt-2">Online</p>
                                    <p className="text-xs text-gray-500 mt-1">All Systems Active</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pump Status */}
                    <div className="mt-8 bg-white shadow-lg rounded-xl p-6 border border-gray-200 ">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                            <Cog6ToothIcon className="h-6 w-6 mr-2 text-gray-600 " />
                            Pump Control System
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className={`px-4 py-4 rounded-lg transition-all duration-200 ${getPumpStatusColor(realtimeData.Pump_PH_Plus || false)}`}>
                                    <p className="text-sm font-medium">pH Plus</p>
                                    <p className="text-xs mt-1">{getPumpStatus(realtimeData.Pump_PH_Plus || false)}</p>
                                </div>
                            </div>
                            <div className="text-center">
                                <div className={`px-4 py-4 rounded-lg transition-all duration-200 ${getPumpStatusColor(realtimeData.Pump_PH_Minus || false)}`}>
                                    <p className="text-sm font-medium">pH Minus</p>
                                    <p className="text-xs mt-1">{getPumpStatus(realtimeData.Pump_PH_Minus || false)}</p>
                                </div>
                            </div>
                            <div className="text-center">
                                <div className={`px-4 py-4 rounded-lg transition-all duration-200 ${getPumpStatusColor(realtimeData.Pump_Nutrisi || false)}`}>
                                    <p className="text-sm font-medium">Nutrient</p>
                                    <p className="text-xs mt-1">{getPumpStatus(realtimeData.Pump_Nutrisi || false)}</p>
                                </div>
                            </div>
                            <div className="text-center">
                                <div className={`px-4 py-4 rounded-lg transition-all duration-200 ${getPumpStatusColor(realtimeData.Pump_24Jam || false)}`}>
                                    <p className="text-sm font-medium">24H Circulation</p>
                                    <p className="text-xs mt-1">{getPumpStatus(realtimeData.Pump_24Jam || false)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Charts */}
                    {historicalData.length > 0 && (
                        <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200 ">
                            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                                <ChartBarIcon className="h-6 w-6 mr-2 text-gray-600 " />
                                Recent Trends (Last 20 readings)
                            </h3>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                                {/* pH Chart */}
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                                        <BeakerIcon className="h-4 w-4 mr-1 text-blue-600 " />
                                        pH Level
                                    </h4>
                                    <ResponsiveContainer width="100%" height={200}>
                                        <LineChart data={historicalData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke={document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb'} />
                                            <XAxis dataKey="time" fontSize={12} stroke={document.documentElement.classList.contains('dark') ? '#9CA3AF' : '#6B7280'} />
                                            <YAxis fontSize={12} stroke={document.documentElement.classList.contains('dark') ? '#9CA3AF' : '#6B7280'} />
                                            <Tooltip 
                                                contentStyle={{
                                                    backgroundColor: document.documentElement.classList.contains('dark') ? '#1F2937' : '#FFFFFF',
                                                    border: `1px solid ${document.documentElement.classList.contains('dark') ? '#374151' : '#E5E7EB'}`,
                                                    borderRadius: '8px',
                                                    color: document.documentElement.classList.contains('dark') ? '#FFFFFF' : '#000000'
                                                }}
                                            />
                                            <Line 
                                                type="monotone" 
                                                dataKey="pH" 
                                                stroke="#3B82F6" 
                                                strokeWidth={2}
                                                dot={{ r: 3, fill: '#3B82F6' }}
                                                activeDot={{ r: 5, fill: '#3B82F6' }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* TDS Chart */}
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                                        <ChartBarIcon className="h-4 w-4 mr-1 text-purple-600 " />
                                        TDS Level
                                    </h4>
                                    <ResponsiveContainer width="100%" height={200}>
                                        <LineChart data={historicalData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke={document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb'} />
                                            <XAxis dataKey="time" fontSize={12} stroke={document.documentElement.classList.contains('dark') ? '#9CA3AF' : '#6B7280'} />
                                            <YAxis fontSize={12} stroke={document.documentElement.classList.contains('dark') ? '#9CA3AF' : '#6B7280'} />
                                            <Tooltip 
                                                contentStyle={{
                                                    backgroundColor: document.documentElement.classList.contains('dark') ? '#1F2937' : '#FFFFFF',
                                                    border: `1px solid ${document.documentElement.classList.contains('dark') ? '#374151' : '#E5E7EB'}`,
                                                    borderRadius: '8px',
                                                    color: document.documentElement.classList.contains('dark') ? '#FFFFFF' : '#000000'
                                                }}
                                            />
                                            <Line 
                                                type="monotone" 
                                                dataKey="TDS" 
                                                stroke="#8B5CF6" 
                                                strokeWidth={2}
                                                dot={{ r: 3, fill: '#8B5CF6' }}
                                                activeDot={{ r: 5, fill: '#8B5CF6' }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Current Chart */}
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                                        <BoltIcon className="h-4 w-4 mr-1 text-yellow-600 " />
                                        Current Consumption
                                    </h4>
                                    <ResponsiveContainer width="100%" height={200}>
                                        <LineChart data={historicalData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke={document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb'} />
                                            <XAxis dataKey="time" fontSize={12} stroke={document.documentElement.classList.contains('dark') ? '#9CA3AF' : '#6B7280'} />
                                            <YAxis fontSize={12} stroke={document.documentElement.classList.contains('dark') ? '#9CA3AF' : '#6B7280'} />
                                            <Tooltip 
                                                contentStyle={{
                                                    backgroundColor: document.documentElement.classList.contains('dark') ? '#1F2937' : '#FFFFFF',
                                                    border: `1px solid ${document.documentElement.classList.contains('dark') ? '#374151' : '#E5E7EB'}`,
                                                    borderRadius: '8px',
                                                    color: document.documentElement.classList.contains('dark') ? '#FFFFFF' : '#000000'
                                                }}
                                            />
                                            <Legend />
                                            <Line 
                                                type="monotone" 
                                                dataKey="Current_12V" 
                                                stroke="#F59E0B" 
                                                strokeWidth={2}
                                                dot={{ r: 3, fill: '#F59E0B' }}
                                                activeDot={{ r: 5, fill: '#F59E0B' }}
                                                name="12V Current (A)"
                                            />
                                            <Line 
                                                type="monotone" 
                                                dataKey="Current_5V" 
                                                stroke="#6366F1" 
                                                strokeWidth={2}
                                                dot={{ r: 3, fill: '#6366F1' }}
                                                activeDot={{ r: 5, fill: '#6366F1' }}
                                                name="5V Current (A)"
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Dashboard;
