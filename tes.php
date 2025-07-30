<?php
// tes.php - Kirim data random ke Firebase RTDB dan Firestore (loop otomatis)
// Pastikan: 
// - Enable PHP CURL
// - Ganti API_KEY dan PROJECT_ID sesuai project Anda

date_default_timezone_set('Asia/Jakarta');

// Konfigurasi
$API_KEY = "AIzaSyA6J1o8vEw54-Y4d1_cuP_xbOmZrWdAWK0";
$DATABASE_URL = "https://tugas-akhir-bf1e8-default-rtdb.asia-southeast1.firebasedatabase.app";
$PROJECT_ID = "tugas-akhir-bf1e8";

// Fungsi kirim ke RTDB (Realtime Database)
function sendToRTDB($data, $API_KEY, $DATABASE_URL) {
    $url = $DATABASE_URL . "/Sensor.json?auth=" . $API_KEY;
    $curl = curl_init($url);
    curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "PUT");
    curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($curl);
    curl_close($curl);
    return $response;
}

// Fungsi kirim ke Firestore (Firestore REST API)
function sendToFirestore($data, $API_KEY, $PROJECT_ID) {
    $docName = time();
    $url = "https://firestore.googleapis.com/v1/projects/$PROJECT_ID/databases/(default)/documents/history/$docName?key=$API_KEY";
    $fields = [
        "pH" => ["doubleValue" => $data['pH']],
        "TDS" => ["doubleValue" => $data['TDS']],
        "Temperature" => ["doubleValue" => $data['Temperature']],
        "Current_3Pompa" => ["doubleValue" => $data['Current_3Pompa']],
        "Current_24Jam" => ["doubleValue" => $data['Current_24Jam']],
        "timestamp" => ["integerValue" => $data['timestamp']],
        "Pump_PH_Plus" => ["integerValue" => $data['Pump_PH_Plus']],
        "Pump_PH_Minus" => ["integerValue" => $data['Pump_PH_Minus']],
        "Pump_Nutrisi" => ["integerValue" => $data['Pump_Nutrisi']],
        "Pump_24Jam" => ["integerValue" => $data['Pump_24Jam']],
    ];
    $payload = json_encode(["fields" => $fields]);
    $curl = curl_init($url);
    curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "PATCH");
    curl_setopt($curl, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($curl, CURLOPT_HTTPHEADER, [
        "Content-Type: application/json"
    ]);
    $response = curl_exec($curl);
    curl_close($curl);
    return $response;
}

// Generate data random sesuai struktur
function generateRandomData() {
    $ph = mt_rand(50, 80) / 10; // 5.0 - 8.0
    $tds = mt_rand(500, 1300); // 500 - 1300 ppm
    $temperature = mt_rand(240, 300) / 10; // 24.0 - 30.0
    $current_3pompa = mt_rand(0, 200) / 100; // 0.00 - 2.00
    $current_24jam = mt_rand(0, 200) / 100;  // 0.00 - 2.00
    $timestamp = time();
    $pump_ph_plus = rand(0, 1);
    $pump_ph_minus = rand(0, 1);
    $pump_nutrisi = rand(0, 1);
    $pump_24jam = rand(0, 1);

    return [
        "pH" => $ph,
        "TDS" => $tds,
        "Temperature" => $temperature,
        "Current_3Pompa" => $current_3pompa,
        "Current_24Jam" => $current_24jam,
        "timestamp" => $timestamp,
        "Pump_PH_Plus" => $pump_ph_plus,
        "Pump_PH_Minus" => $pump_ph_minus,
        "Pump_Nutrisi" => $pump_nutrisi,
        "Pump_24Jam" => $pump_24jam
    ];
}

// Loop pengiriman data
$intervalRTDB = 1;        // detik
$intervalFirestore = 1800; // detik (30 menit)
$lastFirestore = 0;
$start = time();

echo "Mulai loop pengiriman data...\nTekan CTRL+C untuk berhenti.\n\n";

while (true) {
    $now = time();

    // Selalu kirim ke RTDB setiap $intervalRTDB detik
    $data = generateRandomData();
    echo "[".date("H:i:s")."] Kirim ke RTDB...\n";
    $rtdb_resp = sendToRTDB($data, $API_KEY, $DATABASE_URL);
    echo "RTDB Response: $rtdb_resp\n";

    // Kirim ke Firestore setiap $intervalFirestore detik
    if (($now - $lastFirestore) >= $intervalFirestore) {
        echo "[".date("H:i:s")."] Kirim ke Firestore...\n";
        $firestore_resp = sendToFirestore($data, $API_KEY, $PROJECT_ID);
        echo "Firestore Response: $firestore_resp\n";
        $lastFirestore = $now;
    }

    sleep($intervalRTDB);
}