<?php
header('Content-Type: application/json');

try {
    // 1) Parse DATABASE_URL on Heroku, or fall back to local settings
    if ($dbUrl = getenv("postgres://u8c6pn7bkvse4v:pd4a837809109ad622d57d1ded6c5a6c1d02f03d3a066a74c89741025f4427803@cbec45869p4jbu.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com:5432/dcpar1popsdrru")) {
        $parts = parse_url($dbUrl);
        $host   = $parts["host"];
        $port   = $parts["port"];
        $dbname = ltrim($parts["path"], "/");
        $user   = $parts["u8c6pn7bkvse4v"];
        $pass   = $parts["pd4a837809109ad622d57d1ded6c5a6c1d02f03d3a066a74c89741025f4427803"];
    } else {
        $host   = "localhost";
        $port   = 5432;
        $dbname = "highscores";
        $user   = "jager";
        $pass   = "Mawj1984";
    }

    // 2) Connect
    $dsn  = "pgsql:host={$host};port={$port};dbname={$dbname}";
    $conn = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    // 3) Verify table exists
    $stmt = $conn->query("SELECT to_regclass('public.highscores')");
    if (!$stmt->fetchColumn()) {
        throw new Exception("Table 'highscores' does not exist");
    }

    // 4) Fetch your top 5 scores
    $stmt   = $conn->query("
        SELECT username, score, deviceType, gameID, gameVersion, created_at
        FROM highscores
        ORDER BY score DESC
        LIMIT 5
    ");
    $scores = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 5) Single JSON response
    echo json_encode([
        "status" => "success",
        "data"   => $scores
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => $e->getMessage()
    ]);
}
