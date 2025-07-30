<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MonitoringController extends Controller
{
    private string $apiKey;
    private string $databaseUrl;
    private string $projectId;

    public function __construct()
    {
        $this->apiKey = config('services.firebase.api_key');
        $this->databaseUrl = config('services.firebase.database_url');
        $this->projectId = config('services.firebase.project_id');
    }

    /**
     * Test Firebase connection and configuration
     */
    public function testFirebaseConnection(): JsonResponse
    {
        $diagnostics = [
            'config_check' => [
                'api_key_exists' => !empty($this->apiKey),
                'database_url_exists' => !empty($this->databaseUrl),
                'project_id_exists' => !empty($this->projectId),
                'api_key_length' => strlen($this->apiKey ?? ''),
                'database_url' => $this->databaseUrl ? str_replace($this->apiKey, '[HIDDEN]', $this->databaseUrl) : null,
            ],
            'connection_test' => null,
            'data_test' => null
        ];

        try {
            if (!$this->apiKey || !$this->databaseUrl) {
                return response()->json([
                    'success' => false,
                    'message' => 'Firebase configuration incomplete',
                    'diagnostics' => $diagnostics
                ]);
            }

            // Test basic connection
            $url = $this->databaseUrl . "/.json?auth=" . $this->apiKey;
            $response = Http::timeout(10)->get($url);
            
            $diagnostics['connection_test'] = [
                'status_code' => $response->status(),
                'response_time' => 'OK',
                'headers' => $response->headers(),
            ];

            if ($response->successful()) {
                // Test specific Sensor path
                $sensorUrl = $this->databaseUrl . "/Sensor.json?auth=" . $this->apiKey;
                $sensorResponse = Http::timeout(10)->get($sensorUrl);
                
                $sensorData = $sensorResponse->json();
                $diagnostics['data_test'] = [
                    'sensor_endpoint_status' => $sensorResponse->status(),
                    'data_exists' => !empty($sensorData),
                    'data_structure' => $sensorData ? array_keys($sensorData) : null,
                    'validation_result' => $sensorData ? $this->validateSensorData($sensorData) : false,
                ];

                return response()->json([
                    'success' => true,
                    'message' => 'Firebase connection successful',
                    'diagnostics' => $diagnostics,
                    'sample_data' => $sensorData
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Firebase connection failed',
                    'diagnostics' => $diagnostics
                ], $response->status());
            }

        } catch (\Exception $e) {
            $diagnostics['connection_test'] = [
                'error' => $e->getMessage(),
                'type' => get_class($e)
            ];

            return response()->json([
                'success' => false,
                'message' => 'Connection test failed: ' . $e->getMessage(),
                'diagnostics' => $diagnostics
            ], 500);
        }
    }

    /**
     * Get realtime sensor data from Firebase RTDB
     */
    public function getRealtimeData(): JsonResponse
    {
        try {
            Log::info('MonitoringController: getRealtimeData called');
            
            // Check if Firebase config exists
            if (!$this->apiKey || !$this->databaseUrl) {
                Log::error('Firebase configuration missing');
                return response()->json([
                    'success' => false,
                    'message' => 'Firebase configuration not found',
                    'data' => null
                ], 500);
            }
            
            $url = $this->databaseUrl . "/Sensor.json?auth=" . $this->apiKey;
            Log::info('Firebase RTDB URL: ' . $url);
            
            $response = Http::timeout(30)->get($url);
            Log::info('Firebase RTDB Response Status: ' . $response->status());
            
            if ($response->successful()) {
                $data = $response->json();
                Log::info('Firebase RTDB Data received: ' . json_encode($data));
                
                // Check if data is null or empty
                if (!$data) {
                    Log::warning('No data found in Firebase');
                    return response()->json([
                        'success' => false,
                        'message' => 'No sensor data found in Firebase',
                        'data' => null
                    ], 404);
                }
                
                // Validate data structure
                if ($this->validateSensorData($data)) {
                    Log::info('Data validation successful');
                    
                    // Add default values for missing fields
                    $defaultData = [
                        'Current_3Pompa' => 0,
                        'Current_24Jam' => 0,
                        'Pump_PH_Plus' => false,
                        'Pump_PH_Minus' => false,
                        'Pump_Nutrisi' => false,
                        'Pump_24Jam' => false,
                        'timestamp' => now()->timestamp
                    ];
                    
                    $completeData = array_merge($defaultData, $data);
                    
                    return response()->json([
                        'success' => true,
                        'data' => $completeData,
                        'timestamp' => now()->toISOString()
                    ]);
                }
                
                Log::warning('Data validation failed');
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid data structure received from Firebase',
                    'data' => $data,
                    'debug' => 'Core fields (pH, TDS, Temperature) missing'
                ], 422);
            }
            
            Log::error('Firebase RTDB request failed with status: ' . $response->status());
            Log::error('Firebase RTDB response body: ' . $response->body());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch data from Firebase: HTTP ' . $response->status(),
                'data' => null,
                'debug' => $response->body()
            ], $response->status());
            
        } catch (\Exception $e) {
            Log::error('Firebase RTDB fetch error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Internal server error: ' . $e->getMessage(),
                'data' => null
            ], 500);
        }
    }

    /**
     * Get historical data from Firestore
     */
    public function getHistoricalData(Request $request): JsonResponse
    {
        try {
            $limit = $request->input('limit', 100);
            $orderBy = $request->input('orderBy', 'timestamp');
            $orderDirection = $request->input('orderDirection', 'DESCENDING');
            
            $url = "https://firestore.googleapis.com/v1/projects/{$this->projectId}/databases/(default)/documents/history";
            
            $queryParams = [
                'key' => $this->apiKey,
                'pageSize' => min($limit, 1000), // Max 1000 per request
                'orderBy' => $orderBy . ' ' . $orderDirection
            ];
            
            if ($request->has('pageToken')) {
                $queryParams['pageToken'] = $request->input('pageToken');
            }
            
            $response = Http::timeout(30)->get($url, $queryParams);
            
            if ($response->successful()) {
                $data = $response->json();
                $documents = $data['documents'] ?? [];
                
                $formattedData = collect($documents)->map(function ($doc) {
                    return $this->formatFirestoreDocument($doc);
                })->filter()->values();
                
                return response()->json([
                    'success' => true,
                    'data' => $formattedData,
                    'nextPageToken' => $data['nextPageToken'] ?? null,
                    'total' => count($formattedData)
                ]);
            }
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch historical data from Firestore',
                'data' => []
            ], $response->status());
            
        } catch (\Exception $e) {
            Log::error('Firestore fetch error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Internal server error',
                'data' => []
            ], 500);
        }
    }

    /**
     * Get historical data within date range
     */
    public function getHistoricalDataByDateRange(Request $request): JsonResponse
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'limit' => 'integer|min:1|max:1000'
        ]);

        try {
            $startTimestamp = strtotime($request->input('start_date'));
            $endTimestamp = strtotime($request->input('end_date'));
            $limit = $request->input('limit', 500);

            $url = "https://firestore.googleapis.com/v1/projects/{$this->projectId}/databases/(default)/documents/history";
            
            // Build query with timestamp filter
            $structuredQuery = [
                'structuredQuery' => [
                    'from' => [['collectionId' => 'history']],
                    'where' => [
                        'compositeFilter' => [
                            'op' => 'AND',
                            'filters' => [
                                [
                                    'fieldFilter' => [
                                        'field' => ['fieldPath' => 'timestamp'],
                                        'op' => 'GREATER_THAN_OR_EQUAL',
                                        'value' => ['integerValue' => (string)$startTimestamp]
                                    ]
                                ],
                                [
                                    'fieldFilter' => [
                                        'field' => ['fieldPath' => 'timestamp'],
                                        'op' => 'LESS_THAN_OR_EQUAL',
                                        'value' => ['integerValue' => (string)$endTimestamp]
                                    ]
                                ]
                            ]
                        ]
                    ],
                    'orderBy' => [
                        [
                            'field' => ['fieldPath' => 'timestamp'],
                            'direction' => 'DESCENDING'
                        ]
                    ],
                    'limit' => $limit
                ]
            ];

            $queryUrl = "https://firestore.googleapis.com/v1/projects/{$this->projectId}/databases/(default)/documents:runQuery?key={$this->apiKey}";
            
            $response = Http::timeout(30)
                ->withHeaders(['Content-Type' => 'application/json'])
                ->post($queryUrl, $structuredQuery);
            
            if ($response->successful()) {
                $results = $response->json();
                
                $formattedData = collect($results)->map(function ($result) {
                    if (isset($result['document'])) {
                        return $this->formatFirestoreDocument($result['document']);
                    }
                    return null;
                })->filter()->values();
                
                return response()->json([
                    'success' => true,
                    'data' => $formattedData,
                    'total' => count($formattedData),
                    'date_range' => [
                        'start' => $request->input('start_date'),
                        'end' => $request->input('end_date')
                    ]
                ]);
            }
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch data from Firestore',
                'data' => []
            ], $response->status());
            
        } catch (\Exception $e) {
            Log::error('Firestore date range query error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Internal server error',
                'data' => []
            ], 500);
        }
    }

    /**
     * Get aggregated statistics
     */
    public function getStatistics(): JsonResponse
    {
        try {
            // Get latest realtime data
            $realtimeResponse = $this->getRealtimeData();
            $realtimeData = $realtimeResponse->getData();
            
            if (!$realtimeData->success) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to get realtime data for statistics'
                ], 500);
            }
            
            $sensorData = (array) $realtimeData->data;
            
            // Calculate system status
            $systemStatus = $this->calculateSystemStatus($sensorData);
            
            // Get today's data count from Firestore
            $todayStart = strtotime('today');
            $todayEnd = strtotime('tomorrow');
            
            $request = new Request([
                'start_date' => date('Y-m-d', $todayStart),
                'end_date' => date('Y-m-d', $todayEnd),
                'limit' => 1000
            ]);
            
            $historicalResponse = $this->getHistoricalDataByDateRange($request);
            $historicalData = $historicalResponse->getData();
            
            $todayCount = $historicalData->success ? count($historicalData->data) : 0;
            
            return response()->json([
                'success' => true,
                'data' => [
                    'current_values' => $sensorData,
                    'system_status' => $systemStatus,
                    'today_records' => $todayCount,
                    'last_update' => $sensorData['timestamp'] ?? null,
                    'alerts' => $this->generateAlerts($sensorData)
                ]
            ]);
            
        } catch (\Exception $e) {
            Log::error('Statistics calculation error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to calculate statistics'
            ], 500);
        }
    }

    /**
     * Validate sensor data structure
     */
    private function validateSensorData(array $data): bool
    {
        // Required core fields - more flexible validation
        $coreFields = ['pH', 'TDS', 'Temperature'];
        
        // Check if core sensor data exists
        foreach ($coreFields as $field) {
            if (!array_key_exists($field, $data)) {
                Log::warning("Missing core field: {$field}");
                return false;
            }
        }
        
        // Optional fields - don't fail if missing
        $optionalFields = [
            'Current_3Pompa', 'Current_24Jam', 'timestamp',
            'Pump_PH_Plus', 'Pump_PH_Minus', 'Pump_Nutrisi', 'Pump_24Jam'
        ];
        
        // Log missing optional fields but don't fail validation
        foreach ($optionalFields as $field) {
            if (!array_key_exists($field, $data)) {
                Log::info("Optional field missing: {$field}");
            }
        }
        
        return true;
    }

    /**
     * Format Firestore document to standard array
     */
    private function formatFirestoreDocument(array $document): ?array
    {
        if (!isset($document['fields'])) {
            return null;
        }
        
        $fields = $document['fields'];
        
        return [
            'pH' => (float) ($fields['pH']['doubleValue'] ?? 0),
            'TDS' => (float) ($fields['TDS']['doubleValue'] ?? 0),
            'Temperature' => (float) ($fields['Temperature']['doubleValue'] ?? 0),
            'Current_3Pompa' => (float) ($fields['Current_3Pompa']['doubleValue'] ?? 0),
            'Current_24Jam' => (float) ($fields['Current_24Jam']['doubleValue'] ?? 0),
            'timestamp' => (int) ($fields['timestamp']['integerValue'] ?? 0),
            'Pump_PH_Plus' => (int) ($fields['Pump_PH_Plus']['integerValue'] ?? 0),
            'Pump_PH_Minus' => (int) ($fields['Pump_PH_Minus']['integerValue'] ?? 0),
            'Pump_Nutrisi' => (int) ($fields['Pump_Nutrisi']['integerValue'] ?? 0),
            'Pump_24Jam' => (int) ($fields['Pump_24Jam']['integerValue'] ?? 0),
            'created_at' => date('Y-m-d H:i:s', $fields['timestamp']['integerValue'] ?? time())
        ];
    }

    /**
     * Calculate system status based on sensor values
     */
    private function calculateSystemStatus(array $data): array
    {
        $status = 'normal';
        $issues = [];
        
        // pH level check (optimal: 5.5 - 6.5)
        $ph = $data['pH'] ?? 0;
        if ($ph < 5.0 || $ph > 8.0) {
            $status = 'critical';
            $issues[] = 'pH level out of range';
        } elseif ($ph < 5.5 || $ph > 6.5) {
            $status = 'warning';
            $issues[] = 'pH level suboptimal';
        }
        
        // TDS level check (optimal: 800 - 1200 ppm)
        $tds = $data['TDS'] ?? 0;
        if ($tds < 500 || $tds > 1500) {
            $status = 'critical';
            $issues[] = 'TDS level critical';
        } elseif ($tds < 800 || $tds > 1200) {
            if ($status !== 'critical') $status = 'warning';
            $issues[] = 'TDS level suboptimal';
        }
        
        // Temperature check (optimal: 18 - 24°C)
        $temp = $data['Temperature'] ?? 0;
        if ($temp < 15 || $temp > 30) {
            $status = 'critical';
            $issues[] = 'Temperature critical';
        } elseif ($temp < 18 || $temp > 24) {
            if ($status !== 'critical') $status = 'warning';
            $issues[] = 'Temperature suboptimal';
        }
        
        return [
            'status' => $status,
            'issues' => $issues,
            'pumps_active' => [
                'ph_plus' => (bool) ($data['Pump_PH_Plus'] ?? false),
                'ph_minus' => (bool) ($data['Pump_PH_Minus'] ?? false),
                'nutrisi' => (bool) ($data['Pump_Nutrisi'] ?? false),
                'circulation' => (bool) ($data['Pump_24Jam'] ?? false)
            ]
        ];
    }

    /**
     * Generate alerts based on current sensor values
     */
    private function generateAlerts(array $data): array
    {
        $alerts = [];
        
        $ph = $data['pH'] ?? 0;
        $tds = $data['TDS'] ?? 0;
        $temp = $data['Temperature'] ?? 0;
        $current3 = $data['Current_3Pompa'] ?? 0;
        $current24 = $data['Current_24Jam'] ?? 0;
        
        if ($ph < 5.0) {
            $alerts[] = [
                'type' => 'critical',
                'message' => 'pH too low (< 5.0)',
                'value' => $ph,
                'recommended_action' => 'Add pH Plus solution'
            ];
        } elseif ($ph > 8.0) {
            $alerts[] = [
                'type' => 'critical',
                'message' => 'pH too high (> 8.0)',
                'value' => $ph,
                'recommended_action' => 'Add pH Minus solution'
            ];
        }
        
        if ($tds < 500) {
            $alerts[] = [
                'type' => 'warning',
                'message' => 'TDS too low (< 500 ppm)',
                'value' => $tds,
                'recommended_action' => 'Add nutrient solution'
            ];
        } elseif ($tds > 1500) {
            $alerts[] = [
                'type' => 'critical',
                'message' => 'TDS too high (> 1500 ppm)',
                'value' => $tds,
                'recommended_action' => 'Dilute with fresh water'
            ];
        }
        
        if ($temp < 15) {
            $alerts[] = [
                'type' => 'warning',
                'message' => 'Temperature too low (< 15°C)',
                'value' => $temp,
                'recommended_action' => 'Check heating system'
            ];
        } elseif ($temp > 30) {
            $alerts[] = [
                'type' => 'critical',
                'message' => 'Temperature too high (> 30°C)',
                'value' => $temp,
                'recommended_action' => 'Check cooling system'
            ];
        }
        
        if ($current3 > 1.5) {
            $alerts[] = [
                'type' => 'warning',
                'message' => 'High current on 3-pump system',
                'value' => $current3,
                'recommended_action' => 'Check pump conditions'
            ];
        }
        
        if ($current24 > 1.5) {
            $alerts[] = [
                'type' => 'warning',
                'message' => 'High current on 24h pump',
                'value' => $current24,
                'recommended_action' => 'Check circulation pump'
            ];
        }
        
        return $alerts;
    }
}
