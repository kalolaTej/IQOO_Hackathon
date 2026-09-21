#define STROBE_PIN 4     
#define BUZZER_PIN 18    
#define STATUS_LED 2    

bool active = false;
unsigned long startTime = 0;

void setup() {
  Serial.begin(115200);
  pinMode(STROBE_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(STATUS_LED, OUTPUT);
  
  digitalWrite(STATUS_LED, HIGH);
  delay(500);
  Serial.println("\n[ESP32] Smart Farm Deterrent System Ready!");
}

void loop() {
  if (Serial.available() > 0) {
    String input = Serial.readStringUntil('\n');
    input.trim();
    
    if (input.startsWith("DETER")) {
      active = true;
      startTime = millis();
      Serial.println("\n>>> [DETERRENT ACTIVATED] Strobe & Siren ON <<<");
    } else if (input == "STOP") {
      active = false;
      digitalWrite(STROBE_PIN, LOW);
      noTone(BUZZER_PIN);
      Serial.println("\n>>> [DETERRENT STOPPED] Silenced <<<");
    }
  }

  if (active) {
    if (millis() - startTime > 5000) {
      active = false;
      digitalWrite(STROBE_PIN, LOW);
      noTone(BUZZER_PIN);
      Serial.println("\n>>> [DETERRENT TIMED OUT] Auto Off <<<");
    } else {
      bool flash = (millis() / 150) % 2 == 0;
      digitalWrite(STROBE_PIN, flash ? HIGH : LOW);
      tone(BUZZER_PIN, 2400 + ((millis() / 5) % 800));
    }
  }

  delay(10); // Prevents ESP32 Watchdog Timer reset loop
}
