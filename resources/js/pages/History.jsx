import React, { useState, useEffect } from 'react';
import { 
    CalendarIcon,
    ChartBarIcon,
    ClockIcon,
    BeakerIcon,
    BoltIcon
} from '@heroicons/react/24/outline';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TimeScale,
    Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import axios from 'axios';
import { useDevice } from '../contexts/DeviceContext';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TimeScale,
    Filler
);

const History = () => {
    const { activeDevice } = useDevice();
    const [historicalData, setHistoricalData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedTimeRange, setSelectedTimeRange] = useState('all');

    useEffect(() => {
        console.log('History component mounted, setting initial date range');
        // Set default date range dari 2 Agustus 2025 sampai sekarang
        const dataStartDate = new Date('2025-08-02');
        const today = new Date();
        
        setStartDate(dataStartDate.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        setSelectedTimeRange('all');
    }, []);

    useEffect(() => {
        console.log('Date range changed:', { startDate, endDate });
        if (startDate && endDate) {
            fetchHistoricalData();
        }
    }, [startDate, endDate]); // Removed showWorkingHoursOnly dependency

    const setDateRangeFromTimeRange = (range) => {
        const end = new Date();
        const start = new Date();
        
        // Data real mulai dari 2 Agustus 2025
        const dataStartDate = new Date('2025-08-02');
        const now = new Date();
        
        switch (range) {
            case '12h':
                // For 12 hours, go back exactly 12 hours from now
                start.setTime(now.getTime() - (12 * 60 * 60 * 1000));
                end.setTime(now.getTime());
                break;
            case '1d':
                // For 1 day, go back 24 hours from now
                start.setTime(now.getTime() - (24 * 60 * 60 * 1000));
                end.setTime(now.getTime());
                break;
            case '3d':
                start.setTime(now.getTime() - (3 * 24 * 60 * 60 * 1000));
                end.setTime(now.getTime());
                break;
            case '7d':
                start.setTime(now.getTime() - (7 * 24 * 60 * 60 * 1000));
                end.setTime(now.getTime());
                break;
            case '30d':
                start.setTime(now.getTime() - (30 * 24 * 60 * 60 * 1000));
                end.setTime(now.getTime());
                break;
            case 'all':
                // Tampilkan semua data dari 2 Agustus 2025
                start.setTime(dataStartDate.getTime());
                end.setTime(now.getTime());
                break;
            default:
                start.setTime(now.getTime() - (24 * 60 * 60 * 1000));
                end.setTime(now.getTime());
        }
        
        // Pastikan start date tidak lebih awal dari tanggal mulai data real
        if (start < dataStartDate) {
            start.setTime(dataStartDate.getTime());
        }
        
        // Format dates properly for the backend
        const startDateStr = start.toISOString().split('T')[0];
        const endDateStr = end.toISOString().split('T')[0];
        
        console.log('Setting date range:', { 
            range, 
            startDateStr, 
            endDateStr,
            startTime: start.toLocaleString(),
            endTime: end.toLocaleString()
        });
        
        setStartDate(startDateStr);
        setEndDate(endDateStr);
        setSelectedTimeRange(range);
    };

    // Generate dummy data for non-default devices
    // Generate realistic dummy historical data for non-real devices
    const generateDummyData = (deviceId, timestamp) => {
        const baseValues = {
            'device-2': { 
                pH: 6.8, 
                TDS: 950, 
                Current_12V: 1.3, 
                Current_5V: 0.8,
                TDS_Target: 900,
                location: 'Greenhouse A'
            },
            'device-3': { 
                pH: 6.2, 
                TDS: 1150, 
                Current_12V: 1.1, 
                Current_5V: 0.9,
                TDS_Target: 1100,
                location: 'Greenhouse B'
            },
            'device-4': { 
                pH: 7.1, 
                TDS: 880, 
                Current_12V: 1.4, 
                Current_5V: 0.7,
                TDS_Target: 850,
                location: 'Greenhouse C'
            },
            'device-5': { 
                pH: 6.6, 
                TDS: 1020, 
                Current_12V: 1.2, 
                Current_5V: 0.85,
                TDS_Target: 1000,
                location: 'Greenhouse D'
            }
        };

        const base = baseValues[deviceId] || { 
            pH: 6.5, 
            TDS: 1000, 
            Current_12V: 1.2, 
            Current_5V: 0.8,
            TDS_Target: 1000,
            location: 'Unknown Location'
        };
        
        // Add realistic variations to historical data
        return {
            pH: parseFloat((base.pH + (Math.random() - 0.5) * 0.4).toFixed(2)),
            TDS: Math.round(base.TDS + (Math.random() - 0.5) * 100),
            Current_12V: parseFloat((base.Current_12V + (Math.random() - 0.5) * 0.3).toFixed(3)),
            Current_5V: parseFloat((base.Current_5V + (Math.random() - 0.5) * 0.2).toFixed(3)),
            TDS_Target: base.TDS_Target,
            Pump_PH_Plus: Math.random() > 0.8 ? 1 : 0,
            Pump_PH_Minus: Math.random() > 0.9 ? 1 : 0,
            Pump_Nutrisi: Math.random() > 0.7 ? 1 : 0,
            Pump_24Jam: 1, // Always on for circulation
            timestamp: timestamp,
            created_at: new Date(timestamp * 1000).toISOString(),
            // Additional metadata for dummy devices
            device_location: base.location,
            data_source: 'dummy_historical'
        };
    };

    const fetchHistoricalData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Only fetch real historical data for the default device (device-1 with isReal=true)
            // All other devices use dummy historical data only
            if (activeDevice?.isReal) {
                console.log('Fetching real historical data for:', activeDevice.name);
                console.log('Date range:', { start_date: startDate, end_date: endDate });
                
                const response = await axios.get('/api/historical-data/date-range', {
                    params: {
                        start_date: startDate,
                        end_date: endDate
                    }
                });

                console.log('Historical data response:', response.data);

                if (response.data.success) {
                    console.log('Real historical data loaded:', response.data.data.length, 'points');
                    
                    // Use real data without filtering for working hours
                    let filteredData = response.data.data;
                    
                    setHistoricalData(filteredData);
                    console.log('Real historical data set with', filteredData.length, 'points');
                } else {
                    setError(response.data.message || 'Failed to fetch real historical data');
                    console.error('API returned error:', response.data.message);
                }
            } else {
                // Generate dummy historical data for all non-real devices
                console.log('Generating dummy historical data for:', activeDevice?.name || 'Unknown Device');
                
                const dummyHistoricalData = [];
                const startTimestamp = new Date(startDate).getTime() / 1000;
                const endTimestamp = new Date(endDate + 'T23:59:59').getTime() / 1000;
                const intervalMinutes = 30; // 30 minutes intervals
                const intervalSeconds = intervalMinutes * 60;
                
                // Generate data points from start to end date
                for (let timestamp = startTimestamp; timestamp <= endTimestamp; timestamp += intervalSeconds) {
                    const dummyPoint = generateDummyData(activeDevice?.id || 'device-dummy', timestamp);
                    dummyHistoricalData.push(dummyPoint);
                }
                
                console.log(`Generated ${dummyHistoricalData.length} dummy historical points for ${activeDevice?.name || 'Unknown Device'}`);
                setHistoricalData(dummyHistoricalData);
            }
        } catch (err) {
            // Only log errors for real devices (device-1)
            if (activeDevice?.isReal) {
                setError('Failed to fetch real historical data');
                console.error('Error fetching real historical data:', err);
                console.error('Error details:', err.response?.data);
            } else {
                // For dummy devices, always generate dummy data - no API calls, no errors
                console.log('Generating fallback dummy historical data for:', activeDevice?.name || 'Unknown Device');
                
                const dummyHistoricalData = [];
                const startTimestamp = new Date(startDate).getTime() / 1000;
                const endTimestamp = new Date(endDate + 'T23:59:59').getTime() / 1000;
                const intervalMinutes = 30;
                const intervalSeconds = intervalMinutes * 60;
                
                for (let timestamp = startTimestamp; timestamp <= endTimestamp; timestamp += intervalSeconds) {
                    const dummyPoint = generateDummyData(activeDevice?.id || 'device-dummy', timestamp);
                    dummyHistoricalData.push(dummyPoint);
                }
                
                setHistoricalData(dummyHistoricalData);
                console.log(`Fallback: Generated ${dummyHistoricalData.length} dummy historical points`);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDateSearch = () => {
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            
            if (end < start) {
                setError('End date must be after start date');
                return;
            }
            
            // Clear any previous errors
            setError(null);
            fetchHistoricalData();
        } else {
            setError('Please select both start and end dates');
        }
    };

    // Prepare chart data
    const prepareChartData = (data, field, color) => {
        // Adjust point size based on data length (more data = smaller points)
        const pointRadius = data.length > 100 ? 1 : data.length > 48 ? 1.5 : 2;
        const pointHoverRadius = data.length > 100 ? 3 : data.length > 48 ? 4 : 6;
        
        // Sort data by timestamp untuk memastikan urutan yang benar
        const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp);
        
        return {
            labels: sortedData.map(item => new Date(item.timestamp * 1000)),
            datasets: [
                {
                    label: field,
                    data: sortedData.map(item => ({
                        x: new Date(item.timestamp * 1000), // Gunakan Date object dengan timezone Jakarta
                        y: parseFloat(item[field]) || 0
                    })),
                    borderColor: color,
                    backgroundColor: color + '20',
                    fill: true,
                    tension: 0.4,
                    pointRadius: pointRadius,
                    pointBackgroundColor: color,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 1,
                    pointHoverRadius: pointHoverRadius,
                    borderWidth: 2
                }
            ]
        };
    };

    const chartOptions = (title, yAxisLabel, suggestedMin, suggestedMax) => ({
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            intersect: false,
            mode: 'index',
        },
        plugins: {
            title: {
                display: true,
                text: title,
                font: {
                    size: 16,
                    weight: 'bold'
                },
                color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#000000'
            },
            legend: {
                display: false
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: '#374151',
                borderWidth: 1,
                cornerRadius: 8,
                displayColors: false,
                callbacks: {
                    label: function(context) {
                        return `${yAxisLabel}: ${context.parsed.y}`;
                    },
                    title: function(context) {
                        const date = new Date(context[0].parsed.x);
                        return date.toLocaleString('id-ID', {
                            timeZone: 'Asia/Jakarta',
                            weekday: 'short',
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                        });
                    }
                }
            }
        },
        scales: {
            x: {
                type: 'time',
                time: {
                    displayFormats: {
                        minute: 'HH:mm',
                        hour: 'DD/MM HH:mm',
                        day: 'DD/MM HH:mm',
                        week: 'DD/MM',
                        month: 'MM/YY'
                    },
                    unit: historicalData.length <= 48 ? 'hour' : historicalData.length <= 168 ? 'hour' : 'day',
                    stepSize: historicalData.length <= 24 ? 2 : historicalData.length <= 48 ? 4 : historicalData.length <= 168 ? 6 : 12,
                    tooltipFormat: 'DD/MM/YYYY HH:mm'
                },
                grid: {
                    color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                },
                ticks: {
                    color: document.documentElement.classList.contains('dark') ? '#9CA3AF' : '#6B7280',
                    maxTicksLimit: 8,
                    callback: function(value, index, values) {
                        const date = new Date(value);
                        // Format untuk menampilkan tanggal dan jam
                        return date.toLocaleString('id-ID', {
                            timeZone: 'Asia/Jakarta',
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                    }
                }
            },
            y: {
                suggestedMin,
                suggestedMax,
                grid: {
                    color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                },
                ticks: {
                    color: document.documentElement.classList.contains('dark') ? '#9CA3AF' : '#6B7280'
                }
            }
        }
    });

    return (
        <div className="space-y-6">
            {/* Header & Controls */}
            <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Historical Data</h2>
                        <p className="text-gray-600">
                            View sensor trends and historical analysis
                        </p>
                    </div>
                    
                    <div className="flex flex-col gap-4">
                        {/* Time Range Buttons */}
                        <div className="flex gap-2 flex-wrap">
                            {[
                                { value: '12h', label: '12H' },
                                { value: '1d', label: '1D' },
                                { value: '3d', label: '3D' },
                                { value: '7d', label: '7D' },
                                { value: '30d', label: '30D' },
                                { value: 'all', label: 'All Data' }
                            ].map((range) => (
                                <button
                                    key={range.value}
                                    onClick={() => setDateRangeFromTimeRange(range.value)}
                                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                                        selectedTimeRange === range.value
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {range.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                            {/* Date Range Picker */}
                            <div className="flex gap-2 items-center">
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900"
                                />
                                <span className="text-gray-500">to</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900"
                                />
                                <button
                                    onClick={handleDateSearch}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors duration-200"
                                >
                                    Search
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                    <span className="ml-4 text-gray-600">Loading historical data...</span>
                </div>
            ) : historicalData.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* pH Chart */}
                    <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
                        <div className="flex items-center mb-4">
                            <BeakerIcon className="h-6 w-6 text-blue-600 mr-2" />
                            <h3 className="text-lg font-semibold text-gray-900">pH Level Trend</h3>
                        </div>
                        <div className="h-80">
                            <Line
                                data={prepareChartData(historicalData, 'pH', '#3B82F6')}
                                options={chartOptions('pH Level Over Time', 'pH', 0, 14)}
                            />
                        </div>
                    </div>

                    {/* TDS Chart */}
                    <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
                        <div className="flex items-center mb-4">
                            <ChartBarIcon className="h-6 w-6 text-purple-600 mr-2" />
                            <h3 className="text-lg font-semibold text-gray-900">TDS Level Trend</h3>
                        </div>
                        <div className="h-80">
                            <Line
                                data={prepareChartData(historicalData, 'TDS', '#8B5CF6')}
                                options={chartOptions('TDS Level Over Time', 'TDS (ppm)', 0, 2000)}
                            />
                        </div>
                    </div>

                    {/* Current Consumption Chart */}
                    <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
                        <div className="flex items-center mb-4">
                            <BoltIcon className="h-6 w-6 text-green-600 mr-2" />
                            <h3 className="text-lg font-semibold text-gray-900">Current Consumption</h3>
                        </div>
                        <div className="h-80">
                            <Line
                                data={{
                                    labels: [...historicalData].sort((a, b) => a.timestamp - b.timestamp).map(item => new Date(item.timestamp * 1000)),
                                    datasets: [
                                        {
                                            label: '12V Current',
                                            data: [...historicalData].sort((a, b) => a.timestamp - b.timestamp).map(item => ({
                                                x: new Date(item.timestamp * 1000),
                                                y: item.Current_12V
                                            })),
                                            borderColor: '#10B981',
                                            backgroundColor: '#10B98120',
                                            fill: false,
                                            tension: 0.4,
                                            pointRadius: historicalData.length > 100 ? 0.5 : historicalData.length > 48 ? 1 : 1.5,
                                            pointHoverRadius: historicalData.length > 100 ? 2 : historicalData.length > 48 ? 3 : 4,
                                            borderWidth: 2
                                        },
                                        {
                                            label: '5V Current',
                                            data: [...historicalData].sort((a, b) => a.timestamp - b.timestamp).map(item => ({
                                                x: new Date(item.timestamp * 1000),
                                                y: item.Current_5V
                                            })),
                                            borderColor: '#6366F1',
                                            backgroundColor: '#6366F120',
                                            fill: false,
                                            tension: 0.4,
                                            pointRadius: historicalData.length > 100 ? 0.5 : historicalData.length > 48 ? 1 : 1.5,
                                            pointHoverRadius: historicalData.length > 100 ? 2 : historicalData.length > 48 ? 3 : 4,
                                            borderWidth: 2
                                        }
                                    ]
                                }}
                                options={{
                                    ...chartOptions('Current Consumption Over Time', 'Current (A)', 0, 0.5),
                                    plugins: {
                                        ...chartOptions().plugins,
                                        legend: {
                                            display: true,
                                            position: 'top',
                                            labels: {
                                                usePointStyle: true,
                                                color: document.documentElement.classList.contains('dark') ? '#9CA3AF' : '#6B7280'
                                            }
                                        }
                                    },
                                    scales: {
                                        ...chartOptions().scales,
                                        y: {
                                            ...chartOptions().scales.y,
                                            min: 0,
                                            max: 0.5,
                                            grid: {
                                                color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                                            },
                                            ticks: {
                                                color: document.documentElement.classList.contains('dark') ? '#9CA3AF' : '#6B7280'
                                            }
                                        }
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-12 bg-white rounded-xl shadow-lg border border-gray-200">
                    <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No historical data found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        No data available for the selected date range: {startDate} to {endDate}
                    </p>
                    {error && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md max-w-md mx-auto">
                            <p className="text-sm text-red-600">Error: {error}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Statistics Summary */}
            {historicalData.length > 0 && (
                <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">Data Summary</h3>
                        <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                            All Data
                        </span>
                    </div>
                    
                    {/* Main Statistics */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                        <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-100">
                            <div className="text-3xl font-bold text-blue-600 mb-2">
                                {(historicalData.reduce((sum, item) => sum + item.pH, 0) / historicalData.length).toFixed(1)}
                            </div>
                            <div className="text-sm font-medium text-blue-700">Average pH</div>
                            <div className="text-xs text-blue-600 mt-1">Level</div>
                        </div>
                        
                        <div className="bg-purple-50 rounded-lg p-4 text-center border border-purple-100">
                            <div className="text-3xl font-bold text-purple-600 mb-2">
                                {Math.round(historicalData.reduce((sum, item) => sum + item.TDS, 0) / historicalData.length)}
                            </div>
                            <div className="text-sm font-medium text-purple-700">Average TDS</div>
                            <div className="text-xs text-purple-600 mt-1">ppm</div>
                        </div>
                        
                        <div className="bg-green-50 rounded-lg p-4 text-center border border-green-100">
                            <div className="text-3xl font-bold text-green-600 mb-2">
                                {(historicalData.reduce((sum, item) => sum + item.Current_12V, 0) / historicalData.length).toFixed(2)}
                            </div>
                            <div className="text-sm font-medium text-green-700">Avg 12V Current</div>
                            <div className="text-xs text-green-600 mt-1">Ampere</div>
                        </div>
                        
                        <div className="bg-indigo-50 rounded-lg p-4 text-center border border-indigo-100">
                            <div className="text-3xl font-bold text-indigo-600 mb-2">
                                {(historicalData.reduce((sum, item) => sum + item.Current_5V, 0) / historicalData.length).toFixed(2)}
                            </div>
                            <div className="text-sm font-medium text-indigo-700">Avg 5V Current</div>
                            <div className="text-xs text-indigo-600 mt-1">Ampere</div>
                        </div>
                    </div>
                    
                    {/* Additional Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                        <div className="text-center">
                            <div className="text-xl font-bold text-gray-700">
                                {historicalData.length}
                            </div>
                            <div className="text-sm text-gray-600">Total Records</div>
                        </div>
                        
                        <div className="text-center">
                            <div className="text-xl font-bold text-gray-700">
                                {startDate} to {endDate}
                            </div>
                            <div className="text-sm text-gray-600">Date Range</div>
                        </div>
                        
                        <div className="text-center">
                            <div className="text-xl font-bold text-gray-700">
                                {Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24) + 1)}
                            </div>
                            <div className="text-sm text-gray-600">Days Analyzed</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default History;
