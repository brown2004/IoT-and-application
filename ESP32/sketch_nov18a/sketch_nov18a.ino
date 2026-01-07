#include <WiFi.h>
#include <PubSubClient.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <DHT.h>
#include <ArduinoJson.h>

// cau hinh wifi va mqtt
const char* ssid = "TP-LINK_B80E";
const char* password = "88888888";
const char* mqtt_server = "broker.hivemq.com";

// cac topic mqtt
const char* topic_slot     = "parking/update";      // topic cap nhat trang thai tung slot
const char* topic_alert    = "parking/alert";       // topic canh bao nhiet do va do am
const char* topic_gate_cmd = "parking/gate_cmd";    // topic dieu khien cong

// cau hinh chan ket noi
#define DHTPIN 4
#define DHTTYPE DHT11
#define GATE_LED 2
#define SDA_PIN 21
#define SCL_PIN 22

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64

const int NUM_SLOTS = 4;
const int trigPins[NUM_SLOTS] = {13, 14, 26, 33};
const int echoPins[NUM_SLOTS] = {12, 27, 25, 32};

// thong tin vi tri cua tung slot
const char* slotRows[NUM_SLOTS]   = {"A", "A", "B", "B"};
const char* slotCols[NUM_SLOTS]   = {"1", "2", "1", "2"};
const char* slotFloor = "1";

// khoi tao cac doi tuong
DHT dht(DHTPIN, DHTTYPE);
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);
WiFiClient espClient;
PubSubClient client(espClient);

// cac bien quan ly freertos
SemaphoreHandle_t mqttMutex;
SemaphoreHandle_t oledMutex;
SemaphoreHandle_t serialMutex;

// bien toan cuc luu du lieu
struct SensorData {
  float temperature;
  float humidity;
} currentSensor = {0, 0};

int slotOccupiedCount = 0;

// cac ham ho tro

void safeSerialPrint(String msg) {
  if (xSemaphoreTake(serialMutex, portMAX_DELAY) == pdTRUE) {
    Serial.println(msg);
    xSemaphoreGive(serialMutex);
  }
}

long getDistance(int trig, int echo) {
  digitalWrite(trig, LOW); 
  delayMicroseconds(2);
  digitalWrite(trig, HIGH); 
  delayMicroseconds(10);
  digitalWrite(trig, LOW);
  long duration = pulseIn(echo, HIGH, 20000);
  if (duration == 0) return 999;
  return duration * 0.034 / 2;
}

void setup_wifi() {
  Serial.print("Connecting to WiFi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected! IP: " + WiFi.localIP().toString());
}

void callback(char* topic, byte* payload, unsigned int length) {
  StaticJsonDocument<256> doc;
  deserializeJson(doc, payload, length);
  
  if (String(topic) == topic_gate_cmd) {
    const char* action = doc["action"];
    if (action != nullptr) {
      if (strcmp(action, "open") == 0) {
        digitalWrite(GATE_LED, HIGH);
        safeSerialPrint("[GATE] Opened");
      } 
      else if (strcmp(action, "close") == 0) {
        digitalWrite(GATE_LED, LOW);
        safeSerialPrint("[GATE] Closed");
      }
    }
  }
}

void reconnect() {
  while (!client.connected()) {
    String clientId = "ESP32_Park_" + String(random(0xffff), HEX);
    if (client.connect(clientId.c_str())) {
      client.subscribe(topic_gate_cmd);
      safeSerialPrint("MQTT Connected!");
    } else {
      vTaskDelay(pdMS_TO_TICKS(5000));
    }
  }
}

// cac tac vu freertos

// task 1 quet cam bien sieu am va gui mqtt tung slot
void TaskParking(void *pvParameters) {
  bool previousState[NUM_SLOTS] = {false, false, false, false};
  
  for (;;) {
    int count = 0;
    
    for (int i = 0; i < NUM_SLOTS; i++) {
      long dist = getDistance(trigPins[i], echoPins[i]);
      bool isOccupied = (dist > 2 && dist < 10);
      
      if (isOccupied) count++;
      
      // chi gui mqtt khi trang thai thay doi
      if (isOccupied != previousState[i]) {
        StaticJsonDocument<128> doc;
        doc["row"] = slotRows[i];
        doc["column"] = slotCols[i];
        doc["floor"] = slotFloor;
        doc["status"] = isOccupied ? "Occupied" : "Free";
        
        char buffer[128];
        serializeJson(doc, buffer);
        
        if (xSemaphoreTake(mqttMutex, pdMS_TO_TICKS(100)) == pdTRUE) {
          if (client.connected()) {
            client.publish(topic_slot, buffer);
          }
          xSemaphoreGive(mqttMutex);
        }
        
        safeSerialPrint("LOG [SLOT " + String(slotRows[i]) + String(slotCols[i]) + 
                        "]: " + String(isOccupied ? "Occupied" : "Free"));
        
        previousState[i] = isOccupied;
      }
      
      vTaskDelay(pdMS_TO_TICKS(15));
    }
    
    slotOccupiedCount = count;
    vTaskDelay(pdMS_TO_TICKS(500));
  }
}

// task 2 doc cam bien nhiet do do am va gui mqtt
void TaskSensor(void *pvParameters) {
  String previousStatus = ""; // luu trang thai truoc do
  
  for (;;) {
    float t = dht.readTemperature();
    float h = dht.readHumidity();
    
    if (!isnan(t) && !isnan(h)) {
      currentSensor.temperature = t;
      currentSensor.humidity = h;
      
      String status = (t > 20.0) ? "warning" : "normal";
      
      // chi gui mqtt khi trang thai thay doi
      if (status != previousStatus) {
        StaticJsonDocument<256> doc;
        doc["sensorId"] = "DHT11_01";
        doc["temperature"] = round(t * 10) / 10.0;
        doc["humidity"] = round(h * 10) / 10.0;
        doc["status"] = status;
        
        char buffer[256];
        serializeJson(doc, buffer);
        
        if (xSemaphoreTake(mqttMutex, pdMS_TO_TICKS(100)) == pdTRUE) {
          if (client.connected()) {
            client.publish(topic_alert, buffer);
          }
          xSemaphoreGive(mqttMutex);
        }
        
        safeSerialPrint("LOG [SENSOR CHANGE]: " + String(t) + "C | " + 
                        String(h) + "% | Status: " + status);
        
        previousStatus = status;
      } else {
        // khong gui mqtt chi log cuc bo
        safeSerialPrint("LOG [SENSOR]: " + String(t) + "C | " + 
                        String(h) + "% | Status: " + status + " (no change)");
      }
    } else {
      safeSerialPrint("ERROR: Khong doc duoc DHT11!");
    }
    
    vTaskDelay(pdMS_TO_TICKS(5000));
  }
}

// task 3 hien thi thong tin len man hinh oled
void TaskDisplay(void *pvParameters) {
  for (;;) {
    if (xSemaphoreTake(oledMutex, pdMS_TO_TICKS(100)) == pdTRUE) {
      display.clearDisplay();
      
      
      display.setTextSize(1);
      display.setCursor(18, 0);
      display.print("SMART PARKING");
      display.drawLine(0, 10, 128, 10, WHITE);
      
      // hien thi so luong xe
      display.setTextSize(2);
      int xPos = (128 - (7 * 11)) / 2;
      display.setCursor(xPos, 18);
      display.print("XE: ");
      display.print(slotOccupiedCount);
      display.print("/");
      display.print(NUM_SLOTS);
      
      // hien thi nhiet do va do am
      display.setTextSize(1);
      
      // hien thi nhiet do
      display.setCursor(0, 42);
      display.print("Nhiet do:");
      display.setCursor(65, 42);
      display.printf("%.1fC", currentSensor.temperature);
      
      // hien thi do am
      display.setCursor(0, 54);
      display.print("Do am:");
      display.setCursor(65, 54);
      display.printf("%.1f%%", currentSensor.humidity);
      
      display.display();
      xSemaphoreGive(oledMutex);
    }
    
    vTaskDelay(pdMS_TO_TICKS(500));
  }
}

// task 4 xu ly ket noi mqtt
void TaskMQTT(void *pvParameters) {
  for (;;) {
    if (!client.connected()) reconnect();
    
    if (xSemaphoreTake(mqttMutex, pdMS_TO_TICKS(10)) == pdTRUE) {
      client.loop();
      xSemaphoreGive(mqttMutex);
    }
    
    vTaskDelay(pdMS_TO_TICKS(10));
  }
}

// thiet lap he thong
void setup() {
  Serial.begin(115200);
  
  // khoi tao chan io
  pinMode(GATE_LED, OUTPUT);
  digitalWrite(GATE_LED, LOW);
  
  for (int i = 0; i < NUM_SLOTS; i++) {
    pinMode(trigPins[i], OUTPUT);
    pinMode(echoPins[i], INPUT);
  }
  
  // khoi tao cam bien va man hinh
  dht.begin();
  Wire.begin(SDA_PIN, SCL_PIN);
  
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("ERROR: Khong tim thay OLED!");
  } else {
    display.clearDisplay();
    display.setTextColor(WHITE);
    display.setTextSize(1);
    display.setCursor(20, 28);
    display.print("STARTING...");
    display.display();
  }
  
  // khoi tao wifi va mqtt
  setup_wifi();
  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);
  
  // khoi tao tai nguyen freertos
  mqttMutex = xSemaphoreCreateMutex();
  oledMutex = xSemaphoreCreateMutex();
  serialMutex = xSemaphoreCreateMutex();
  
  // tao cac task
  xTaskCreatePinnedToCore(TaskMQTT,    "MQTT",    8192, NULL, 3, NULL, 0);
  xTaskCreatePinnedToCore(TaskParking, "Parking", 4096, NULL, 2, NULL, 1);
  xTaskCreatePinnedToCore(TaskSensor,  "Sensor",  4096, NULL, 1, NULL, 1);
  xTaskCreatePinnedToCore(TaskDisplay, "Display", 4096, NULL, 1, NULL, 1);
  
  
}

void loop() {
  // vong lap de trong vi da co freertos xu ly
}