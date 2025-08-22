import React, { useState } from 'react';
import { useDevice } from '../contexts/DeviceContext';
import {
    PlusIcon,
    TrashIcon,
    CpuChipIcon,
    ChevronDownIcon,
    ChevronRightIcon,
    CheckCircleIcon,
    XCircleIcon
} from '@heroicons/react/24/outline';

function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
}

export default function DeviceSelector({ sidebarExpanded }) {
    const { 
        devices, 
        activeDevice, 
        activeDeviceId, 
        addDevice, 
        removeDevice, 
        switchDevice 
    } = useDevice();
    
    const [showDevices, setShowDevices] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newDeviceName, setNewDeviceName] = useState('');
    const [newDeviceLocation, setNewDeviceLocation] = useState('');

    const handleAddDevice = () => {
        if (!newDeviceName.trim()) {
            alert('Please enter a device name');
            return;
        }

        const device = addDevice({
            name: newDeviceName.trim(),
            location: newDeviceLocation.trim() || 'Greenhouse'
        });

        // Switch to the new device
        switchDevice(device.id);
        
        // Reset form
        setNewDeviceName('');
        setNewDeviceLocation('');
        setShowAddForm(false);
    };

    const handleRemoveDevice = (deviceId, deviceName) => {
        if (confirm(`Are you sure you want to remove "${deviceName}"?`)) {
            removeDevice(deviceId);
        }
    };

    const getDeviceStatusIcon = (device) => {
        if (device.status === 'online') {
            return <CheckCircleIcon className="h-3 w-3 text-green-500" />;
        }
        return <XCircleIcon className="h-3 w-3 text-red-500" />;
    };

    return (
        <div className="border-t border-gray-200 mt-4">
            {/* Device Section Header */}
            <div className="px-3 py-3">
                <button
                    onClick={() => setShowDevices(!showDevices)}
                    className={classNames(
                        "flex items-center w-full text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors",
                        !sidebarExpanded && "justify-center"
                    )}
                    title={!sidebarExpanded ? 'Devices' : ''}
                >
                    {showDevices ? (
                        <ChevronDownIcon className="h-4 w-4 mr-1" />
                    ) : (
                        <ChevronRightIcon className="h-4 w-4 mr-1" />
                    )}
                    {sidebarExpanded && "Devices"}
                </button>
            </div>

            {/* Device List */}
            {showDevices && (
                <div className="px-3 space-y-1">
                    {devices.map((device) => (
                        <div key={device.id} className="group relative">
                            <button
                                onClick={() => switchDevice(device.id)}
                                className={classNames(
                                    "flex items-center w-full px-2 py-2 text-sm rounded-lg transition-all duration-200",
                                    activeDeviceId === device.id
                                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                        : "text-gray-700 hover:bg-gray-100",
                                    !sidebarExpanded && "justify-center"
                                )}
                                title={!sidebarExpanded ? device.name : ''}
                            >
                                <div className="flex items-center min-w-0 flex-1">
                                    <CpuChipIcon className="h-4 w-4 flex-shrink-0" />
                                    {sidebarExpanded && (
                                        <>
                                            <div className="ml-2 min-w-0 flex-1">
                                                <div className="flex items-center">
                                                    <span className="truncate font-medium">
                                                        {device.name}
                                                    </span>
                                                    {device.isReal && (
                                                        <span className="ml-1 inline-block w-2 h-2 bg-blue-500 rounded-full" 
                                                              title="Real Data" />
                                                    )}
                                                </div>
                                                <div className="flex items-center text-xs text-gray-500">
                                                    {getDeviceStatusIcon(device)}
                                                    <span className="ml-1">{device.location}</span>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Remove button for non-main devices */}
                                {sidebarExpanded && device.id !== 'device-1' && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveDevice(device.id, device.name);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:text-red-700 transition-all"
                                        title="Remove device"
                                    >
                                        <TrashIcon className="h-3 w-3" />
                                    </button>
                                )}
                            </button>

                            {/* Tooltip for collapsed sidebar */}
                            {!sidebarExpanded && (
                                <div className="absolute left-full ml-6 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                                    <div className="font-medium">{device.name}</div>
                                    <div className="text-gray-300">{device.location}</div>
                                    {device.isReal && <div className="text-blue-300">Real Data</div>}
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Add Device Button */}
                    {!showAddForm ? (
                        <button
                            onClick={() => setShowAddForm(true)}
                            className={classNames(
                                "flex items-center w-full px-2 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-200 border-2 border-dashed border-gray-300 hover:border-gray-400",
                                !sidebarExpanded && "justify-center"
                            )}
                            title={!sidebarExpanded ? 'Add Device' : ''}
                        >
                            <PlusIcon className="h-4 w-4 flex-shrink-0" />
                            {sidebarExpanded && <span className="ml-2">Add Device</span>}
                        </button>
                    ) : sidebarExpanded && (
                        /* Add Device Form */
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    placeholder="Device name"
                                    value={newDeviceName}
                                    onChange={(e) => setNewDeviceName(e.target.value)}
                                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    onKeyPress={(e) => e.key === 'Enter' && handleAddDevice()}
                                />
                                <input
                                    type="text"
                                    placeholder="Location (optional)"
                                    value={newDeviceLocation}
                                    onChange={(e) => setNewDeviceLocation(e.target.value)}
                                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    onKeyPress={(e) => e.key === 'Enter' && handleAddDevice()}
                                />
                                <div className="flex space-x-2">
                                    <button
                                        onClick={handleAddDevice}
                                        className="flex-1 px-2 py-1 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700 transition-colors"
                                    >
                                        Add
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowAddForm(false);
                                            setNewDeviceName('');
                                            setNewDeviceLocation('');
                                        }}
                                        className="flex-1 px-2 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
