import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext.jsx';
import {
    HomeIcon,
    ClockIcon,
    CogIcon,
    Bars3Icon,
    XMarkIcon,
    UserIcon,
    ArrowRightOnRectangleIcon,
    ChevronDownIcon,
    SunIcon,
    MoonIcon,
    ChevronLeftIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline';

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'History', href: '/history', icon: ClockIcon },
    { name: 'Settings', href: '/settings', icon: CogIcon },
];

function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
}

export default function Layout({ children, user, onLogout }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarExpanded, setSidebarExpanded] = useState(() => {
        return localStorage.getItem('sidebarExpanded') !== 'false';
    });
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const location = useLocation();
    const { isDark, toggleTheme } = useTheme();

    // Save sidebar state to localStorage
    useEffect(() => {
        localStorage.setItem('sidebarExpanded', sidebarExpanded.toString());
    }, [sidebarExpanded]);

    const handleLogout = () => {
        if (onLogout) {
            onLogout();
        }
        setUserMenuOpen(false);
    };

    const toggleSidebar = () => {
        setSidebarExpanded(!sidebarExpanded);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-all duration-300">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Mobile sidebar */}
            <div className={classNames(
                "fixed inset-y-0 left-0 z-50 w-72 transform bg-white dark:bg-gray-800 shadow-2xl transition-transform duration-300 ease-in-out lg:hidden",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                            <HomeIcon className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                            HydroMonitor
                        </h1>
                    </div>
                    <button
                        type="button"
                        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                {/* Mobile Navigation */}
                <nav className="mt-6 px-3">
                    <ul className="space-y-2">
                        {navigation.map((item) => {
                            const isActive = location.pathname === item.href;
                            return (
                                <li key={item.name}>
                                    <Link
                                        to={item.href}
                                        onClick={() => setSidebarOpen(false)}
                                        className={classNames(
                                            "group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200",
                                            isActive
                                                ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg"
                                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                                        )}
                                    >
                                        <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                                        {item.name}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </div>

            {/* Desktop sidebar */}
            <div className={classNames(
                "hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-xl transition-all duration-300 ease-in-out z-40",
                sidebarExpanded ? "lg:w-72" : "lg:w-20"
            )}>
                {/* Sidebar header */}
                <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700">
                    <div className={classNames(
                        "flex items-center space-x-3 transition-all duration-300",
                        sidebarExpanded ? "opacity-100" : "opacity-0"
                    )}>
                        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                            <HomeIcon className="w-5 h-5 text-white" />
                        </div>
                        {sidebarExpanded && (
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                                HydroMonitor
                            </h1>
                        )}
                    </div>
                    
                    {/* Sidebar toggle button */}
                    <button
                        type="button"
                        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={toggleSidebar}
                    >
                        {sidebarExpanded ? (
                            <ChevronLeftIcon className="h-5 w-5" />
                        ) : (
                            <ChevronRightIcon className="h-5 w-5" />
                        )}
                    </button>
                </div>

                {/* Desktop Navigation */}
                <nav className="flex-1 mt-6 px-3">
                    <ul className="space-y-2">
                        {navigation.map((item) => {
                            const isActive = location.pathname === item.href;
                            return (
                                <li key={item.name}>
                                    <Link
                                        to={item.href}
                                        className={classNames(
                                            "group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 relative",
                                            isActive
                                                ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg"
                                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                                        )}
                                        title={!sidebarExpanded ? item.name : ''}
                                    >
                                        <item.icon className="h-5 w-5 flex-shrink-0" />
                                        {sidebarExpanded && (
                                            <span className="ml-3 transition-all duration-300">
                                                {item.name}
                                            </span>
                                        )}
                                        
                                        {/* Tooltip for collapsed sidebar */}
                                        {!sidebarExpanded && (
                                            <div className="absolute left-full ml-6 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                                                {item.name}
                                            </div>
                                        )}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Sidebar footer - User info */}
                <div className="border-t border-gray-200 dark:border-gray-700 p-3">
                    <div className={classNames(
                        "flex items-center transition-all duration-300",
                        sidebarExpanded ? "px-3 py-2" : "justify-center"
                    )}>
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        {sidebarExpanded && (
                            <div className="ml-3 overflow-hidden">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {user?.name || 'User'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {user?.email || 'user@example.com'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className={classNames(
                "lg:pl-20 transition-all duration-300 ease-in-out",
                sidebarExpanded ? "lg:pl-72" : "lg:pl-20"
            )}>
                {/* Top navigation */}
                <div className="sticky top-0 z-30 flex h-16 items-center gap-x-4 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
                    {/* Mobile menu button */}
                    <button
                        type="button"
                        className="p-2.5 text-gray-700 dark:text-gray-300 lg:hidden rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Bars3Icon className="h-6 w-6" />
                    </button>

                    {/* Separator */}
                    <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 lg:hidden" />

                    {/* Page title */}
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {navigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
                        </h1>
                    </div>

                    {/* Right side buttons */}
                    <div className="flex items-center gap-x-4 lg:gap-x-6">
                        {/* Theme toggle */}
                        <button
                            type="button"
                            className="p-2.5 text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                            onClick={toggleTheme}
                        >
                            {isDark ? (
                                <SunIcon className="h-6 w-6" />
                            ) : (
                                <MoonIcon className="h-6 w-6" />
                            )}
                        </button>

                        {/* Profile dropdown */}
                        <div className="relative">
                            <button
                                type="button"
                                className="flex items-center gap-x-4 px-6 py-3 text-sm font-semibold leading-6 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-all duration-200"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setUserMenuOpen(!userMenuOpen);
                                }}
                            >
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                <span className="hidden lg:flex lg:items-center">
                                    <span className="ml-4 text-sm font-semibold leading-6" aria-hidden="true">
                                        {user?.name || 'User'}
                                    </span>
                                    <ChevronDownIcon className="ml-2 h-5 w-5 text-gray-400" aria-hidden="true" />
                                </span>
                            </button>

                            {/* Dropdown menu */}
                            {userMenuOpen && (
                                <div className="absolute right-0 z-50 mt-2.5 w-48 origin-top-right rounded-xl bg-white dark:bg-gray-800 py-2 shadow-xl ring-1 ring-gray-900/5 dark:ring-gray-700">
                                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                                        <p className="text-sm text-gray-900 dark:text-white font-medium">
                                            {user?.name || 'User'}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                            {user?.email || 'user@example.com'}
                                        </p>
                                    </div>
                                    <Link
                                        to="/settings"
                                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                        onClick={() => setUserMenuOpen(false)}
                                    >
                                        <CogIcon className="mr-3 h-5 w-5 text-gray-400" />
                                        Settings
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="flex w-full items-center px-4 py-2 text-sm text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    >
                                        <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" />
                                        Sign out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Page content */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8">
                    <div className="mx-auto max-w-7xl">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
