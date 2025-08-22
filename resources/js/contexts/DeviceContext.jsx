import React, { createContext, useContext, useState, useEffect } from 'react';

const DeviceContext = createContext();

export const useDevice = () => {
    const context = useContext(DeviceContext);
    if (!context) {
        throw new Error('useDevice must be used within a DeviceProvider');
    }
    return context;
};

export const DeviceProvider = ({ children }) => {
    const [devices, setDevices] = useState(() => {
        const saved = localStorage.getItem('hydroponics_devices');
        return saved ? JSON.parse(saved) : [
            {
                id: 'device-1',
                name: 'Hydroponic System 1',
                isReal: true, // Device pertama menggunakan data real
                status: 'online',
                location: 'Main Greenhouse'
            }
        ];
    });

    const [activeDeviceId, setActiveDeviceId] = useState(() => {
        const saved = localStorage.getItem('active_device_id');
        return saved || 'device-1';
    });

    // Save to localStorage whenever devices or activeDevice changes
    useEffect(() => {
        localStorage.setItem('hydroponics_devices', JSON.stringify(devices));
    }, [devices]);

    useEffect(() => {
        localStorage.setItem('active_device_id', activeDeviceId);
    }, [activeDeviceId]);

    const activeDevice = devices.find(device => device.id === activeDeviceId) || devices[0];

    const addDevice = (deviceData) => {
        const newDevice = {
            id: `device-${Date.now()}`,
            name: deviceData.name || `Hydroponic System ${devices.length + 1}`,
            isReal: false, // Device tambahan menggunakan data dummy
            status: 'online',
            location: deviceData.location || 'Greenhouse',
            ...deviceData
        };

        setDevices(prev => [...prev, newDevice]);
        return newDevice;
    };

    const removeDevice = (deviceId) => {
        if (deviceId === 'device-1') {
            alert('Cannot remove the main device');
            return false;
        }

        setDevices(prev => prev.filter(device => device.id !== deviceId));
        
        // If we're removing the active device, switch to device-1
        if (activeDeviceId === deviceId) {
            setActiveDeviceId('device-1');
        }
        
        return true;
    };

    const updateDevice = (deviceId, updates) => {
        setDevices(prev => prev.map(device => 
            device.id === deviceId 
                ? { ...device, ...updates }
                : device
        ));
    };

    const switchDevice = (deviceId) => {
        const device = devices.find(d => d.id === deviceId);
        if (device) {
            setActiveDeviceId(deviceId);
            return true;
        }
        return false;
    };

    // Generate dummy data for non-real devices
    const generateDummyRealtimeData = () => {
        const now = Date.now();
        const hour = new Date().getHours();
        
        // Simulate daily variations
        const baseTemp = 22 + Math.sin((hour / 24) * 2 * Math.PI) * 3;
        
        return {
            pH: Number((6.0 + (Math.random() - 0.5) * 1.0).toFixed(2)),
            TDS: Math.floor(800 + Math.random() * 400), // 800-1200
            Current_12V: Number((1.0 + Math.random() * 0.5).toFixed(3)),
            Current_5V: Number((0.8 + Math.random() * 0.4).toFixed(3)),
            TDS_Target: 1000,
            timestamp: Math.floor(now / 1000),
            Pump_PH_Plus: Math.random() > 0.8 ? 1 : 0,
            Pump_PH_Minus: Math.random() > 0.9 ? 1 : 0,
            Pump_Nutrisi: Math.random() > 0.7 ? 1 : 0,
            Pump_24Jam: 1, // Always on
            created_at: new Date().toISOString()
        };
    };

    const generateDummyHistoricalData = (limit = 20) => {
        const data = [];
        const now = new Date();
        
        for (let i = limit - 1; i >= 0; i--) {
            const time = new Date(now.getTime() - (i * 30 * 60 * 1000)); // 30 minutes intervals
            const hour = time.getHours();
            
            data.push({
                pH: Number((6.0 + (Math.random() - 0.5) * 1.0).toFixed(2)),
                TDS: Math.floor(800 + Math.random() * 400),
                Current_12V: Number((1.0 + Math.random() * 0.5).toFixed(3)),
                Current_5V: Number((0.8 + Math.random() * 0.4).toFixed(3)),
                timestamp: Math.floor(time.getTime() / 1000),
                time: time.toLocaleTimeString(),
                created_at: time.toISOString()
            });
        }
        
        return data;
    };

    const value = {
        devices,
        activeDevice,
        activeDeviceId,
        addDevice,
        removeDevice,
        updateDevice,
        switchDevice,
        generateDummyRealtimeData,
        generateDummyHistoricalData
    };

    return (
        <DeviceContext.Provider value={value}>
            {children}
        </DeviceContext.Provider>
    );
};
