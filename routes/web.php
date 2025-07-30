<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\MonitoringController;
use App\Http\Controllers\AuthController;

// Authentication routes
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register'])->name('auth.register');
    Route::post('/login', [AuthController::class, 'login'])->name('auth.login');
    Route::post('/logout', [AuthController::class, 'logout'])->name('auth.logout');
    Route::get('/me', [AuthController::class, 'me'])->name('auth.me');
    Route::get('/pending-users', [AuthController::class, 'getPendingUsers'])->name('auth.pending');
    Route::post('/approve-user/{userId}', [AuthController::class, 'approveUser'])->name('auth.approve');
});

// Main dashboard route
Route::get('/', function () {
    return view('app');
})->name('dashboard');

// API Routes for monitoring
Route::prefix('api')->group(function () {
    // Authentication API routes
    Route::post('/register', [AuthController::class, 'register'])->name('api.register');
    Route::post('/login', [AuthController::class, 'login'])->name('api.login');
    Route::post('/logout', [AuthController::class, 'logout'])->name('api.logout');
    Route::get('/me', [AuthController::class, 'me'])->name('api.me');
    
    // Monitoring API routes
    Route::get('/realtime-data', [MonitoringController::class, 'getRealtimeData'])->name('api.realtime');
    Route::post('/update-tds-target', [MonitoringController::class, 'updateTdsTarget'])->name('api.update.tds.target');
    Route::get('/test-firebase', [MonitoringController::class, 'testFirebaseConnection'])->name('api.test.firebase');
    Route::get('/generate-test-data', [MonitoringController::class, 'generateTestData'])->name('api.generate.test');
    Route::get('/historical-data', [MonitoringController::class, 'getHistoricalData'])->name('api.historical');
    Route::get('/historical-data/date-range', [MonitoringController::class, 'getHistoricalDataByDateRange'])->name('api.historical.daterange');
    Route::get('/statistics', [MonitoringController::class, 'getStatistics'])->name('api.statistics');
});

// Catch all routes for React Router
Route::get('/{path}', function () {
    return view('app');
})->where('path', '.*');
