import React, { useState, useEffect } from 'react';
import { 
    CogIcon,
    CircleStackIcon,
    InformationCircleIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const Settings = () => {
    const [settings, setSettings] = useState({
        // Data retention
        data_retention_days: 90,
        auto_cleanup: true,
        
        // Refresh intervals
        realtime_refresh: 2000, // milliseconds
        chart_refresh: 5000
    });

    const [savedSettings, setSavedSettings] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = () => {
        // In a real app, this would load from backend/localStorage
        const saved = localStorage.getItem('hydroponicSettings');
        if (saved) {
            setSettings(JSON.parse(saved));
            setSavedSettings(JSON.parse(saved));
        }
    };

    const saveSettings = () => {
        setSaving(true);
        setTimeout(() => {
            localStorage.setItem('hydroponicSettings', JSON.stringify(settings));
            setSavedSettings({ ...settings });
            setSaving(false);
        }, 1000);
    };

    const resetToDefaults = () => {
        if (confirm('Are you sure you want to reset all settings to default values?')) {
            setSettings({
                data_retention_days: 90,
                auto_cleanup: true,
                realtime_refresh: 2000,
                chart_refresh: 5000
            });
        }
    };

    const handleInputChange = (key, value) => {
        setSettings(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const hasUnsavedChanges = () => {
        return JSON.stringify(settings) !== JSON.stringify(savedSettings);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
                        <p className="text-gray-600">Configure system preferences and data management</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        {hasUnsavedChanges() && (
                            <span className="text-sm text-yellow-600 flex items-center">
                                <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                                Unsaved changes
                            </span>
                        )}
                        <button
                            onClick={resetToDefaults}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Reset to Defaults
                        </button>
                        <button
                            onClick={saveSettings}
                            disabled={saving || !hasUnsavedChanges()}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </div>
            </div>

            {/* System Settings */}
            <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center mb-6">
                    <CogIcon className="h-6 w-6 text-gray-400 mr-3" />
                    <h3 className="text-lg font-medium text-gray-900">System Settings</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Realtime refresh interval (ms)
                        </label>
                        <select
                            value={settings.realtime_refresh}
                            onChange={(e) => handleInputChange('realtime_refresh', parseInt(e.target.value))}
                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                        >
                            <option value={1000}>1 second</option>
                            <option value={2000}>2 seconds</option>
                            <option value={5000}>5 seconds</option>
                            <option value={10000}>10 seconds</option>
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Chart refresh interval (ms)
                        </label>
                        <select
                            value={settings.chart_refresh}
                            onChange={(e) => handleInputChange('chart_refresh', parseInt(e.target.value))}
                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                        >
                            <option value={5000}>5 seconds</option>
                            <option value={10000}>10 seconds</option>
                            <option value={30000}>30 seconds</option>
                            <option value={60000}>1 minute</option>
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Data retention (days)
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="365"
                            value={settings.data_retention_days}
                            onChange={(e) => handleInputChange('data_retention_days', parseInt(e.target.value))}
                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>
                    
                    <div>
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                checked={settings.auto_cleanup}
                                onChange={(e) => handleInputChange('auto_cleanup', e.target.checked)}
                                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                            />
                            <label className="ml-2 text-sm text-gray-700">Auto cleanup old data</label>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                            Automatically delete data older than retention period
                        </p>
                    </div>
                </div>
            </div>

            {/* Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex">
                    <InformationCircleIcon className="h-5 w-5 text-blue-400" />
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800 ">
                            Configuration Notes
                        </h3>
                        <div className="mt-2 text-sm text-blue-700 ">
                            <ul className="list-disc list-inside space-y-1">
                                <li>Lower refresh intervals may increase data usage and server load</li>
                                <li>Data retention settings help manage database size and performance</li>
                                <li>Auto cleanup will permanently delete old data based on retention period</li>
                                <li>Changes are saved to localStorage and will persist across sessions</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
