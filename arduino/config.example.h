/*
 * Configuration Template for Arduino Irrigation System
 * 
 * INSTRUCTIONS:
 * 1. Copy this file and rename it to "config.h"
 * 2. Fill in your actual credentials
 * 3. Upload to your Arduino
 * 
 * IMPORTANT: config.h is ignored by Git for security
 */

#ifndef CONFIG_H
#define CONFIG_H

// ============================================
// WiFi Configuration
// ============================================
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// ============================================
// MQTT Broker Configuration (EMQX Serverless)
// ============================================
const char* MQTT_BROKER = "your-broker.emqxsl.com";
const int MQTT_PORT = 8883;  // SSL Port
const char* MQTT_USER = "your_mqtt_username";
const char* MQTT_PASSWORD = "your_mqtt_password";

// ============================================
// Device Identification
// ============================================
const char* API_KEY = "your_device_api_key_from_web_platform";

#endif
