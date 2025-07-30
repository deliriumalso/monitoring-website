<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Http;

class AuthController extends Controller
{
    private $apiKey;
    private $projectId;

    public function __construct()
    {
        // Use API Key approach like in tes.php
        $this->apiKey = env('FIREBASE_API_KEY');
        $this->projectId = env('FIREBASE_PROJECT_ID');
    }

    // Helper method to get user by email from Firestore
    private function getUserByEmail($email)
    {
        // Query Firestore to find user by email
        $url = "https://firestore.googleapis.com/v1/projects/{$this->projectId}/databases/(default)/documents/users?key={$this->apiKey}";
        
        $response = Http::get($url);
        
        if ($response->successful()) {
            $data = $response->json();
            if (isset($data['documents'])) {
                foreach ($data['documents'] as $doc) {
                    if (isset($doc['fields']['email']['stringValue']) && 
                        $doc['fields']['email']['stringValue'] === $email) {
                        return $doc;
                    }
                }
            }
        }
        
        return null;
    }

    // Helper method to save user to Firestore
    private function saveUserToFirestore($userId, $userData)
    {
        $url = "https://firestore.googleapis.com/v1/projects/{$this->projectId}/databases/(default)/documents/users/{$userId}?key={$this->apiKey}";
        
        // Convert data to Firestore format
        $fields = [
            "id" => ["stringValue" => $userData['id']],
            "name" => ["stringValue" => $userData['name']],
            "email" => ["stringValue" => $userData['email']],
            "password" => ["stringValue" => $userData['password']],
            "role" => ["stringValue" => $userData['role']],
            "status" => ["stringValue" => $userData['status']],
            "approved_at" => ["nullValue" => null],
            "approved_by" => ["nullValue" => null],
            "created_at" => ["stringValue" => $userData['created_at']],
        ];
        
        $payload = json_encode(["fields" => $fields]);
        
        $response = Http::withHeaders([
            'Content-Type' => 'application/json'
        ])->patch($url, ["fields" => $fields]);
        
        return $response->successful();
    }

    // Helper method to get user document by ID from Firestore
    private function getUserById($userId)
    {
        $url = "https://firestore.googleapis.com/v1/projects/{$this->projectId}/databases/(default)/documents/users/{$userId}?key={$this->apiKey}";
        
        $response = Http::get($url);
        
        if ($response->successful()) {
            $data = $response->json();
            if (isset($data['fields'])) {
                return $this->convertFirestoreFields($data['fields']);
            }
        }
        
        return null;
    }

    // Helper method to convert Firestore fields format to regular array
    private function convertFirestoreFields($fields)
    {
        $result = [];
        foreach ($fields as $key => $value) {
            if (isset($value['stringValue'])) {
                $result[$key] = $value['stringValue'];
            } elseif (isset($value['nullValue'])) {
                $result[$key] = null;
            } elseif (isset($value['integerValue'])) {
                $result[$key] = (int)$value['integerValue'];
            } elseif (isset($value['doubleValue'])) {
                $result[$key] = (float)$value['doubleValue'];
            }
        }
        return $result;
    }
    
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Check if email already exists using Firestore REST API
            $checkResponse = $this->getUserByEmail($request->email);
            if ($checkResponse) {
                return response()->json([
                    'success' => false,
                    'message' => 'Email already exists'
                ], 409);
            }

            // Generate unique user ID
            $userId = 'user_' . uniqid() . '_' . time();

            // Create user data for Firestore
            $userData = [
                'id' => $userId,
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => 'user',
                'status' => 'pending',
                'approved_at' => null,
                'approved_by' => null,
                'created_at' => now()->toISOString(),
            ];

            // Save to Firestore using REST API
            $success = $this->saveUserToFirestore($userId, $userData);

            if ($success) {
                return response()->json([
                    'success' => true,
                    'message' => 'Registration successful. Please wait for admin approval.',
                    'data' => [
                        'user_id' => $userId,
                        'name' => $userData['name'],
                        'email' => $userData['email'],
                        'status' => $userData['status']
                    ]
                ]);
            } else {
                throw new \Exception('Failed to save user to Firestore');
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Registration failed: ' . $e->getMessage()
            ], 500);
        }
    }

    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Find user by email using Firestore REST API
            $userDoc = $this->getUserByEmail($request->email);

            if (!$userDoc) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid credentials'
                ], 401);
            }

            // Convert Firestore document to array
            $userData = $this->convertFirestoreFields($userDoc['fields']);

            // Check password
            if (!Hash::check($request->password, $userData['password'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid credentials'
                ], 401);
            }

            // Check if user is approved
            if ($userData['status'] !== 'approved') {
                return response()->json([
                    'success' => false,
                    'message' => 'Your account is not yet approved. Please wait for admin approval.'
                ], 403);
            }

            // Create session
            Session::put('user', [
                'id' => $userData['id'],
                'name' => $userData['name'],
                'email' => $userData['email'],
                'role' => $userData['role'],
                'status' => $userData['status']
            ]);

            $request->session()->regenerate();

            return response()->json([
                'success' => true,
                'message' => 'Login successful',
                'data' => [
                    'user' => [
                        'id' => $userData['id'],
                        'name' => $userData['name'],
                        'email' => $userData['email'],
                        'role' => $userData['role'],
                        'status' => $userData['status']
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Login failed: ' . $e->getMessage()
            ], 500);
        }
    }

    public function logout(Request $request)
    {
        try {
            Session::forget('user');
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return response()->json([
                'success' => true,
                'message' => 'Logout successful'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Logout failed: ' . $e->getMessage()
            ], 500);
        }
    }

    public function me(Request $request)
    {
        try {
            $user = Session::get('user');

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'user' => $user
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get user data: ' . $e->getMessage()
            ], 500);
        }
    }

    public function approveUser(Request $request, $userId)
    {
        try {
            $currentUser = Session::get('user');

            // Check if current user is admin
            if (!$currentUser || $currentUser['role'] !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Only admins can approve users.'
                ], 403);
            }

            // Find user document in Firestore using REST API
            $userData = $this->getUserById($userId);

            if (!$userData) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }

            // Update user status to approved using REST API
            $url = "https://firestore.googleapis.com/v1/projects/{$this->projectId}/databases/(default)/documents/users/{$userId}?key={$this->apiKey}";
            
            $fields = [
                "id" => ["stringValue" => $userData['id']],
                "name" => ["stringValue" => $userData['name']],
                "email" => ["stringValue" => $userData['email']],
                "password" => ["stringValue" => $userData['password']],
                "role" => ["stringValue" => $userData['role']],
                "status" => ["stringValue" => "approved"],
                "approved_at" => ["stringValue" => now()->toISOString()],
                "approved_by" => ["stringValue" => $currentUser['id']],
                "created_at" => ["stringValue" => $userData['created_at']],
            ];
            
            $response = Http::withHeaders([
                'Content-Type' => 'application/json'
            ])->patch($url, ["fields" => $fields]);

            if ($response->successful()) {
                return response()->json([
                    'success' => true,
                    'message' => 'User approved successfully',
                    'data' => [
                        'user_id' => $userData['id'],
                        'name' => $userData['name'],
                        'email' => $userData['email'],
                        'status' => 'approved'
                    ]
                ]);
            } else {
                throw new \Exception('Failed to update user status');
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to approve user: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getPendingUsers(Request $request)
    {
        try {
            $currentUser = Session::get('user');

            // Check if current user is admin
            if (!$currentUser || $currentUser['role'] !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Only admins can view pending users.'
                ], 403);
            }

            // Get all users from Firestore using REST API
            $url = "https://firestore.googleapis.com/v1/projects/{$this->projectId}/databases/(default)/documents/users?key={$this->apiKey}";
            
            $response = Http::get($url);
            
            if ($response->successful()) {
                $data = $response->json();
                $pendingUsers = [];
                
                if (isset($data['documents'])) {
                    foreach ($data['documents'] as $doc) {
                        if (isset($doc['fields'])) {
                            $userData = $this->convertFirestoreFields($doc['fields']);
                            
                            // Only include pending users
                            if (isset($userData['status']) && $userData['status'] === 'pending') {
                                // Remove password from response
                                unset($userData['password']);
                                $pendingUsers[] = $userData;
                            }
                        }
                    }
                }

                return response()->json([
                    'success' => true,
                    'data' => $pendingUsers
                ]);
            } else {
                throw new \Exception('Failed to fetch users from Firestore');
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get pending users: ' . $e->getMessage()
            ], 500);
        }
    }
}
