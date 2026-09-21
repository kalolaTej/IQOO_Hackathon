#include <Arduino.h>

#define STROBE_PIN     4
#define BUZZER_PIN     18
#define STATUS_LED     2

#define BUZZER_CHANNEL 0
#define BUZZER_RESOLUTION 8

bool active = false;
unsigned long startTime = 0;
unsigned long lastFlash = 0;
bool flashState = false;
String inputBuffer = "";

void stopDeterrent() {
  active = false;
  digitalWrite(STROBE_PIN, LOW);
  ledcWriteTone(BUZZER_CHANNEL, 0);
  ledcWrite(BUZZER_CHANNEL, 0);
}

void playSiren(double freq) {
  ledcWriteTone(BUZZER_CHANNEL, freq);
  ledcWrite(BUZZER_CHANNEL, 128);
}

void setup() {
  Serial.begin(115200);
  delay(200);

  pinMode(STROBE_PIN, OUTPUT);
  pinMode(STATUS_LED, OUTPUT);

  digitalWrite(STROBE_PIN, LOW);
  digitalWrite(STATUS_LED, HIGH);

  // Initialize ESP32 LEDC PWM for Buzzer audio output
  ledcSetup(BUZZER_CHANNEL, 2000, BUZZER_RESOLUTION);
  ledcAttachPin(BUZZER_PIN, BUZZER_CHANNEL);
  stopDeterrent();

  Serial.println("\n[ESP32] Smart Farm Deterrent System Ready!");
  Serial.println("[ESP32] Type DETER:cow to activate | Type STOP to silence\n");
}

void loop() {
  // Serial Echo and Input Handler
  while (Serial.available() > 0) {
    char c = Serial.read();

    if (c == '\r' || c == '\n') {
      Serial.println();
      inputBuffer.trim();
      inputBuffer.toUpperCase();

      if (inputBuffer.indexOf("DETER") != -1) {
        active = true;
        startTime = millis();
        Serial.println(">>> [DETERRENT ACTIVATED] Strobe & Siren ON <<<");
      } else if (inputBuffer == "STOP") {
        stopDeterrent();
        Serial.println(">>> [DETERRENT STOPPED] Silenced <<<");
      } else if (inputBuffer == "STATUS") {
        Serial.println(active ? "[STATUS] Deterrent ACTIVE" : "[STATUS] Deterrent IDLE");
      } else if (inputBuffer.length() > 0) {
        Serial.println(">>> [UNKNOWN COMMAND] Use DETER:cow or STOP <<<");
      }
      inputBuffer = "";
    } else if (c == '\b' || c == 127) {
      if (inputBuffer.length() > 0) {
        inputBuffer.remove(inputBuffer.length() - 1);
        Serial.print("\b \b");
      }
    } else {
      inputBuffer += c;
      Serial.print(c);
    }
  }

  if (active) {
    if (millis() - startTime > 5000) {
      stopDeterrent();
      Serial.println(">>> [DETERRENT TIMED OUT] Auto Off <<<");
    } else {
      if (millis() - lastFlash >= 150) {
        lastFlash = millis();
        flashState = !flashState;
        digitalWrite(STROBE_PIN, flashState ? HIGH : LOW);

        if (flashState) {
          playSiren(2400);
        } else {
          playSiren(1500);
        }
      }
    }
  }

  delay(10);
}
