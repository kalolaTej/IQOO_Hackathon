#include <WiFi.h>
#include <WebServer.h>

const char* ssid = "Wokwi-GUEST";
const char* password = "";

#define STROBE_PIN 4     
#define BUZZER_PIN 18    
#define STATUS_LED 2    

WebServer server(80);

bool deterrentActive = false;
unsigned long deterrentStartTime = 0;
unsigned long deterrentDurationMs = 5000;
String currentAnimal = "";

// ESP32 LEDC PWM channel for Buzzer (Channel 0)
const int BUZZER_CHANNEL = 0;

void playBuzzerTone(int freq) {
#if defined(ESP_ARDUINO_VERSION_MAJOR) && ESP_ARDUINO_VERSION_MAJOR >= 3
  tone(BUZZER_PIN, freq);
#else
  ledcWriteTone(BUZZER_CHANNEL, freq);
#endif
}

void stopBuzzerTone() {
#if defined(ESP_ARDUINO_VERSION_MAJOR) && ESP_ARDUINO_VERSION_MAJOR >= 3
  noTone(BUZZER_PIN);
#else
  ledcWriteTone(BUZZER_CHANNEL, 0);
  digitalWrite(BUZZER_PIN, LOW);
#endif
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n[ESP32] Initializing Smart Farm Deterrent System...");

  pinMode(STROBE_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(STATUS_LED, OUTPUT);

  digitalWrite(STROBE_PIN, LOW);
  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(STATUS_LED, LOW);

  // Setup ESP32 LEDC PWM for Buzzer audio on GPIO 18 (Wokwi compatible)
#if !(defined(ESP_ARDUINO_VERSION_MAJOR) && ESP_ARDUINO_VERSION_MAJOR >= 3)
  ledcSetup(BUZZER_CHANNEL, 2000, 8);
  ledcAttachPin(BUZZER_PIN, BUZZER_CHANNEL);
#endif

  Serial.print("[WiFi] Connecting to ");
  Serial.println(ssid);
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  int wifiRetries = 0;
  while (WiFi.status() != WL_CONNECTED && wifiRetries < 20) {
    delay(500);
    Serial.print(".");
    digitalWrite(STATUS_LED, !digitalRead(STATUS_LED));
    wifiRetries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    digitalWrite(STATUS_LED, HIGH);
    Serial.println("\n[WiFi] Connected!");
    Serial.print("[WiFi] ESP32 IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[WiFi Warning] Connection failed. Operating in SERIAL ONLY mode.");
    digitalWrite(STATUS_LED, LOW);
  }

  server.on("/trigger", HTTP_GET, handleTrigger);
  server.on("/trigger", HTTP_POST, handleTrigger);
  server.on("/stop", HTTP_GET, handleStop);
  server.on("/stop", HTTP_POST, handleStop);
  server.on("/status", HTTP_GET, handleStatus);

  server.begin();
  Serial.println("[HTTP] Web Server running on port 80");
  Serial.println("[System] Ready for Intrusion Alerts!");
}

void loop() {
  server.handleClient();
  checkSerialInput();
  updateDeterrentState();
}

void triggerDeterrent(String animal, int durationMs) {
  deterrentActive = true;
  deterrentStartTime = millis();
  deterrentDurationMs = (durationMs > 0) ? durationMs : 5000;
  currentAnimal = animal;

  Serial.print("[DETERRENT ACTIVATED] Species: ");
  Serial.print(animal);
  Serial.print(" | Duration: ");
  Serial.print(deterrentDurationMs);
  Serial.println("ms");
}

void stopDeterrent() {
  deterrentActive = false;
  digitalWrite(STROBE_PIN, LOW);
  digitalWrite(STATUS_LED, WiFi.status() == WL_CONNECTED ? HIGH : LOW);
  stopBuzzerTone();
  Serial.println("[DETERRENT STOPPED] Hardware silenced.");
}

void updateDeterrentState() {
  if (!deterrentActive) return;

  if (millis() - deterrentStartTime > deterrentDurationMs) {
    stopDeterrent();
    return;
  }

  // Strobe LED Flashing (150ms interval)
  bool flashState = (millis() / 150) % 2 == 0;
  digitalWrite(STROBE_PIN, flashState ? HIGH : LOW);
  digitalWrite(STATUS_LED, flashState ? HIGH : LOW);

  // High-Decibel Siren Frequencies for Wokwi Buzzer (GPIO 18)
  if (currentAnimal == "pig" || currentAnimal == "boar") {
    int sweepFreq = 2400 + ((millis() / 5) % 800);
    playBuzzerTone(sweepFreq);
  } else if (currentAnimal == "cow" || currentAnimal == "buffalo" || currentAnimal == "horse") {
    int sirenFreq = ((millis() / 200) % 2 == 0) ? 2600 : 1600;
    playBuzzerTone(sirenFreq);
  } else if (currentAnimal == "dog" || currentAnimal == "cat" || currentAnimal == "goat" || currentAnimal == "sheep") {
    int pulseFreq = 2800 + ((millis() / 3) % 500);
    playBuzzerTone(pulseFreq);
  } else {
    int genFreq = 2000 + ((millis() / 10) % 1000);
    playBuzzerTone(genFreq);
  }
}

void handleTrigger() {
  String animal = server.hasArg("animal") ? server.arg("animal") : "unknown";
  int duration = server.hasArg("duration") ? server.arg("duration").toInt() : 5000;
  triggerDeterrent(animal, duration);
  server.send(200, "application/json", "{\"status\":\"success\",\"animal\":\"" + animal + "\"}");
}

void handleStop() {
  stopDeterrent();
  server.send(200, "application/json", "{\"status\":\"success\"}");
}

void handleStatus() {
  String activeStr = deterrentActive ? "true" : "false";
  server.send(200, "application/json", "{\"active\":" + activeStr + ",\"ip\":\"" + WiFi.localIP().toString() + "\"}");
}

void checkSerialInput() {
  if (Serial.available() > 0) {
    String input = Serial.readStringUntil('\n');
    input.trim();
    if (input.startsWith("DETER:")) {
      triggerDeterrent(input.substring(6), 5000);
    } else if (input == "STOP") {
      stopDeterrent();
    }
  }
}
