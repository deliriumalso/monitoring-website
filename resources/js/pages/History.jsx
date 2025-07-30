import React, { useState, useEffect } from 'react';
import { 
    CalendarIcon, 
    ArrowDownTrayIcon,
    ChartBarIcon,
    ClockIcon,
    BeakerIcon,
    FireIcon,
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
    const [historicalData, setHistoricalData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedTimeRange, setSelectedTimeRange] = useState('1d');

    useEffect(() => {
        console.log('History component mounted, setting initial date range');
        setDateRangeFromTimeRange(selectedTimeRange);
    }, []);

    useEffect(() => {
        console.log('Date range changed:', { startDate, endDate });
        if (startDate && endDate) {
            fetchHistoricalData();
        }
    }, [startDate, endDate]);

    const setDateRangeFromTimeRange = (range) => {
        const end = new Date();
        const start = new Date();
        
        // Get the current timezone offset for proper local time handling
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
            default:
                start.setTime(now.getTime() - (24 * 60 * 60 * 1000));
                end.setTime(now.getTime());
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

    const fetchHistoricalData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            console.log('Fetching historical data with params:', { start_date: startDate, end_date: endDate });
            
            const response = await axios.get('/api/historical-data/date-range', {
                params: {
                    start_date: startDate,
                    end_date: endDate
                }
            });

            console.log('Historical data response:', response.data);

            if (response.data.success) {
                setHistoricalData(response.data.data);
                console.log('Historical data set:', response.data.data);
            } else {
                setError(response.data.message || 'Failed to fetch historical data');
                console.error('API returned error:', response.data.message);
            }
        } catch (err) {
            setError('Failed to fetch historical data');
            console.error('Error fetching historical data:', err);
            console.error('Error details:', err.response?.data);
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

    const exportToCSV = () => {
        if (historicalData.length === 0) return;

        const headers = ['Date/Time', 'pH', 'TDS (ppm)', 'Temperature (°C)', 'Current 3-Pump (A)', 'Current 24h (A)', 'pH Plus Pump', 'pH Minus Pump', 'Nutrient Pump', 'Circulation Pump'];
        
        const csvContent = [
            headers.join(','),
            ...historicalData.map(row => [
                new Date(row.timestamp * 1000).toLocaleString('id-ID', {
                    timeZone: 'Asia/Jakarta',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                row.pH,
                row.TDS,
                row.Temperature,
                row.Current_3Pompa,
                row.Current_24Jam,
                row.Pump_PH_Plus ? 'Active' : 'Inactive',
                row.Pump_PH_Minus ? 'Active' : 'Inactive',
                row.Pump_Nutrisi ? 'Active' : 'Inactive',
                row.Pump_24Jam ? 'Active' : 'Inactive'
            ].join(','))
        ].join('\\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hydroponic_data_${startDate}_to_${endDate}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    // Prepare chart data
    const prepareChartData = (data, field, color) => {
        // Adjust point size based on data length (more data = smaller points)
        const pointRadius = data.length > 100 ? 1 : data.length > 48 ? 1.5 : 2;
        const pointHoverRadius = data.length > 100 ? 3 : data.length > 48 ? 4 : 6;
        
        return {
            labels: data.map(item => new Date(item.timestamp * 1000)),
            datasets: [
                {
                    label: field,
                    data: data.map(item => ({
                        x: new Date(item.timestamp * 1000), // Use Date object for proper timezone handling
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
                        return new Date(context[0].parsed.x).toLocaleString('id-ID', {
                            timeZone: 'Asia/Jakarta',
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
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
                        hour: 'HH:mm',
                        day: 'DD/MM HH:mm',
                        week: 'DD/MM',
                        month: 'DD/MM'
                    },
                    unit: historicalData.length <= 48 ? 'hour' : historicalData.length <= 144 ? 'day' : 'week',
                    stepSize: historicalData.length <= 48 ? 1 : 1,
                    // Remove timezone as Chart.js handles it differently
                },
                grid: {
                    color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                },
                ticks: {
                    color: document.documentElement.classList.contains('dark') ? '#9CA3AF' : '#6B7280',
                    maxTicksLimit: 12,
                    // Let Chart.js handle the formatting automatically
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
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Historical Data</h2>
                        <p className="text-gray-600 dark:text-gray-400">View sensor trends and historical analysis</p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Time Range Buttons */}
                        <div className="flex gap-2">
                            {[
                                { value: '12h', label: '12H' },
                                { value: '1d', label: '1D' },
                                { value: '3d', label: '3D' },
                                { value: '7d', label: '7D' },
                                { value: '30d', label: '30D' }
                            ].map((range) => (
                                <button
                                    key={range.value}
                                    onClick={() => setDateRangeFromTimeRange(range.value)}
                                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                                        selectedTimeRange === range.value
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    {range.label}
                                </button>
                            ))}
                        </div>

                        {/* Date Range Picker */}
                        <div className="flex gap-2 items-center">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                            <span className="text-gray-500 dark:text-gray-400">to</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                            <button
                                onClick={handleDateSearch}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors duration-200"
                            >
                                Search
                            </button>
                        </div>

                        {/* Export Button */}
                        <button
                            onClick={exportToCSV}
                            disabled={historicalData.length === 0}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2"
                        >
                            <ArrowDownTrayIcon className="h-4 w-4" />
                            Export CSV
                        </button>
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 dark:border-emerald-400"></div>
                    <span className="ml-4 text-gray-600 dark:text-gray-400">Loading historical data...</span>
                </div>
            ) : historicalData.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* pH Chart */}
                    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center mb-4">
                            <BeakerIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">pH Level Trend</h3>
                        </div>
                        <div className="h-80">
                            <Line
                                data={prepareChartData(historicalData, 'pH', '#3B82F6')}
                                options={chartOptions('pH Level Over Time', 'pH', 0, 14)}
                            />
                        </div>
                    </div>

                    {/* TDS Chart */}
                    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center mb-4">
                            <ChartBarIcon className="h-6 w-6 text-purple-600 dark:text-purple-400 mr-2" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">TDS Level Trend</h3>
                        </div>
                        <div className="h-80">
                            <Line
                                data={prepareChartData(historicalData, 'TDS', '#8B5CF6')}
                                options={chartOptions('TDS Level Over Time', 'TDS (ppm)', 0, 2000)}
                            />
                        </div>
                    </div>

                    {/* Temperature Chart */}
                    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center mb-4">
                            <FireIcon className="h-6 w-6 text-orange-600 dark:text-orange-400 mr-2" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Temperature Trend</h3>
                        </div>
                        <div className="h-80">
                            <Line
                                data={prepareChartData(historicalData, 'Temperature', '#F59E0B')}
                                options={chartOptions('Temperature Over Time', 'Temperature (°C)', 0, 40)}
                            />
                        </div>
                    </div>

                    {/* Current Consumption Chart */}
                    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center mb-4">
                            <BoltIcon className="h-6 w-6 text-green-600 dark:text-green-400 mr-2" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Current Consumption</h3>
                        </div>
                        <div className="h-80">
                            <Line
                                data={{
                                    labels: historicalData.map(item => new Date(item.timestamp * 1000)),
                                    datasets: [
                                        {
                                            label: '3-Pump Current',
                                            data: historicalData.map(item => item.Current_3Pompa),
                                            borderColor: '#10B981',
                                            backgroundColor: '#10B98120',
                                            fill: false,
                                            tension: 0.4,
                                            pointRadius: historicalData.length > 100 ? 0.5 : historicalData.length > 48 ? 1 : 1.5,
                                            pointHoverRadius: historicalData.length > 100 ? 2 : historicalData.length > 48 ? 3 : 4,
                                            borderWidth: 2
                                        },
                                        {
                                            label: '24h Current',
                                            data: historicalData.map(item => item.Current_24Jam),
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
                                    ...chartOptions('Current Consumption Over Time', 'Current (A)', 0, 5),
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
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                    <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No historical data found</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        No data available for the selected date range: {startDate} to {endDate}
                    </p>
                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                        Try selecting a different date range. Data is collected every 30 minutes.
                    </p>
                    {error && (
                        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md max-w-md mx-auto">
                            <p className="text-sm text-red-600 dark:text-red-400">Error: {error}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Statistics Summary */}
            {historicalData.length > 0 && (
                <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Data Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {(historicalData.reduce((sum, item) => sum + item.pH, 0) / historicalData.length).toFixed(1)}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Avg pH</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                {Math.round(historicalData.reduce((sum, item) => sum + item.TDS, 0) / historicalData.length)}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Avg TDS</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                {(historicalData.reduce((sum, item) => sum + item.Temperature, 0) / historicalData.length).toFixed(1)}°C
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Avg Temp</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {(historicalData.reduce((sum, item) => sum + item.Current_3Pompa, 0) / historicalData.length).toFixed(2)}A
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Avg 3P Current</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                {historicalData.length}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Total Records</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default History;
