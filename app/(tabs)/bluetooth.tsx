import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Device as BleDevice, BleManager } from 'react-native-ble-plx';

// Create a BLE Manager instance
const bleManager = new BleManager();

// Device interface
interface DeviceInfo {
  id: string;
  name: string;
  connected?: boolean;
}

export default function BluetoothScreen() {
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [connectedId, setConnectedId] = useState<string | null>(null);

  // Check permissions and initialize Bluetooth on component mount
  useEffect(() => {
    const initializeBluetooth = async () => {
      // Load previously connected device
      try {
        const connectedDeviceId = await AsyncStorage.getItem('connectedDeviceId');
        if (connectedDeviceId) {
          setConnectedId(connectedDeviceId);
        }
      } catch (error) {
        console.error('Error loading connected device:', error);
      }
    };

    initializeBluetooth();

    // Cleanup on unmount
    return () => {
      bleManager.destroy();
    };
  }, []);

  // Refresh the device list when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      loadConnectedDevice();
      return () => {
        // Stop scanning when screen loses focus
        if (scanning) {
          bleManager.stopDeviceScan();
          setScanning(false);
        }
      };
    }, [scanning])
  );

  // Load connected device from AsyncStorage
  const loadConnectedDevice = async () => {
    try {
      const isConnected = await AsyncStorage.getItem('bluetoothConnected');
      const deviceId = await AsyncStorage.getItem('connectedDeviceId');
      
      if (isConnected === 'true' && deviceId) {
        setConnectedId(deviceId);
      } else {
        setConnectedId(null);
      }
    } catch (error) {
      console.error('Error loading connection state:', error);
    }
  };

  // Start scanning for devices
  const startScan = () => {
    // Clear previous devices
    setDevices([]);
    setScanning(true);

    // Request permissions on Android
    if (Platform.OS === 'android') {
      requestAndroidPermissions();
    }

    // Start scanning with proper type annotations
    bleManager.startDeviceScan(
      null, 
      null, 
      (error: Error | null, device: BleDevice | null) => {
        if (error) {
          console.error('Scan error:', error);
          setScanning(false);
          Alert.alert('Error', 'Failed to scan for devices. Please try again.');
          return;
        }

        // Check if this is a valid device (has a name and is ESP32)
        if (device && device.name && device.name.includes('ESP32')) {
          // Get deviceId and deviceName before the setState
          const deviceId = device.id;
          const deviceName = device.name;
          
          // Check if device is already in the list using the local variables
          setDevices((currentDevices: DeviceInfo[]) => {
            const exists = currentDevices.some(d => d.id === deviceId);
            if (exists) {
              return currentDevices;
            } else {
              return [...currentDevices, { 
                id: deviceId, 
                name: deviceName 
              }];
            }
          });
        }
      }
    );

    // Stop scanning after 10 seconds
    setTimeout(() => {
      bleManager.stopDeviceScan();
      setScanning(false);
    }, 10000);
  };

  // Request necessary Android permissions
  const requestAndroidPermissions = async () => {
    if (Platform.OS === 'android') {
      const granted = await requestLocationPermission();
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'Bluetooth scanning requires location permission',
          [{ text: 'OK' }]
        );
        setScanning(false);
      }
    }
  };

  // Request location permission (required for BLE on Android)
  const requestLocationPermission = async () => {
    // This would normally use react-native-permissions library
    // For this example, we'll assume the permission is granted
    return true;
  };

  // Connect to a selected device
  const connectToDevice = async (device: DeviceInfo) => {
    try {
      setScanning(false);
      bleManager.stopDeviceScan();

      // Show connecting indicator
      const updatedDevices = devices.map(d => ({
        ...d,
        connected: d.id === device.id
      }));
      setDevices(updatedDevices);

      // Connect to the device
      const foundDevice = await bleManager.devices([device.id]);
      
      let targetDevice: BleDevice | null = null;
      
      if (foundDevice && foundDevice.length > 0) {
        targetDevice = foundDevice[0];
      } else {
        // Try to find by name
        const allDevices = await bleManager.connectedDevices([]);
        const matchingDevice = allDevices.find(d => d.name === device.name);
        if (matchingDevice) {
          targetDevice = matchingDevice;
        }
      }

      if (!targetDevice) {
        throw new Error('Device not found');
      }

      console.log('Connecting to device:', device.name);
      
      // Connect and discover services
      const connectedDevice = await targetDevice.connect();
      await connectedDevice.discoverAllServicesAndCharacteristics();
      
      // Save connection state
      await AsyncStorage.setItem('bluetoothConnected', 'true');
      await AsyncStorage.setItem('connectedDeviceId', device.id);
      
      setConnectedId(device.id);
      
      Alert.alert('Success', `Connected to ${device.name}`);
    } catch (error) {
      console.error('Connection error:', error);
      Alert.alert('Connection Error', 'Failed to connect to the device. Please try again.');
      
      // Reset connection state
      setDevices(devices.map(d => ({ ...d, connected: false })));
    }
  };

  // Disconnect from the connected device
  const disconnectDevice = async () => {
    if (!connectedId) return;

    try {
      // Find the device
      const connectedDevices = await bleManager.connectedDevices([]);
      const device = connectedDevices.find(d => d.id === connectedId);
      
      if (device) {
        // Disconnect
        await device.cancelConnection();
      }
      
      // Clear connection state
      await AsyncStorage.setItem('bluetoothConnected', 'false');
      await AsyncStorage.removeItem('connectedDeviceId');
      
      setConnectedId(null);
      setDevices((currentDevices: DeviceInfo[]) => currentDevices.map(d => ({ ...d, connected: false })));
      
      Alert.alert('Disconnected', 'Device disconnected successfully');
    } catch (error) {
      console.error('Disconnection error:', error);
      Alert.alert('Error', 'Failed to disconnect from the device.');
    }
  };

  // Render device item
  const renderDeviceItem = ({ item }: { item: DeviceInfo }) => {
    const isConnected = item.id === connectedId;
    
    return (
      <TouchableOpacity 
        style={[styles.deviceItem, isConnected && styles.connectedDevice]}
        onPress={() => !isConnected && connectToDevice(item)}
        disabled={scanning || isConnected}
      >
        <View style={styles.deviceInfo}>
          <View style={[
            styles.deviceIcon, 
            isConnected ? styles.connectedIcon : styles.disconnectedIcon
          ]} />
          <Text style={styles.deviceName}>{item.name}</Text>
        </View>
        {isConnected ? (
          <Text style={styles.connectedText}>Terhubung</Text>
        ) : (
          <Text style={styles.connectText}>Hubungkan</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#3f51b5" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Koneksi Bluetooth</Text>
      </View>

      {/* Connected Device Card (if any) */}
      {connectedId && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Perangkat Terhubung</Text>
          <View style={styles.connectedDeviceInfo}>
            <View style={styles.deviceInfo}>
              <View style={[styles.deviceIcon, styles.connectedIcon]} />
              <Text style={styles.deviceName}>
                {devices.find(d => d.id === connectedId)?.name || 'ESP32 Device'}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.disconnectButton}
              onPress={disconnectDevice}
            >
              <Text style={styles.disconnectText}>Putuskan</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Scan Card */}
      <View style={styles.card}>
        <View style={styles.scanHeader}>
          <Text style={styles.cardTitle}>Perangkat Terdeteksi</Text>
          <TouchableOpacity 
            style={styles.scanButton} 
            onPress={startScan}
            disabled={scanning}
          >
            {scanning ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.scanButtonText}>SCAN</Text>
            )}
          </TouchableOpacity>
        </View>

        {scanning && devices.length === 0 && (
          <View style={styles.scanningContainer}>
            <ActivityIndicator size="large" color="#3f51b5" />
            <Text style={styles.scanningText}>Mencari perangkat...</Text>
          </View>
        )}

        {!scanning && devices.length === 0 && (
          <Text style={styles.noDevicesText}>
            Tidak ada perangkat ditemukan. Tekan SCAN untuk mencari.
          </Text>
        )}

        {devices.length > 0 && (
          <FlatList
            data={devices}
            keyExtractor={(item) => item.id}
            renderItem={renderDeviceItem}
            style={styles.deviceList}
          />
        )}
      </View>

      {/* Help Text */}
      <View style={styles.helpCard}>
        <Text style={styles.helpTitle}>Bantuan</Text>
        <Text style={styles.helpText}>
          1. Pastikan alat GETO sudah dinyalakan.
        </Text>
        <Text style={styles.helpText}>
          2. Tekan tombol SCAN untuk mencari perangkat.
        </Text>
        <Text style={styles.helpText}>
          3. Pilih perangkat ESP32 dari daftar untuk terhubung.
        </Text>
        <Text style={styles.helpText}>
          4. Setelah terhubung, Anda dapat mengontrol alat dari menu Kontrol.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#3f51b5',
    paddingVertical: 16,
    paddingHorizontal: 20,
    elevation: 4,
  },
  headerText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  card: {
    backgroundColor: 'white',
    margin: 16,
    marginBottom: 8,
    borderRadius: 4,
    padding: 16,
    elevation: 2,
  },
  scanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    color: '#333',
  },
  scanButton: {
    backgroundColor: '#3f51b5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    minWidth: 80,
    alignItems: 'center',
  },
  scanButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  scanningContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  scanningText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  noDevicesText: {
    textAlign: 'center',
    color: '#999',
    padding: 20,
  },
  deviceList: {
    maxHeight: 200,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  connectedDevice: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceIcon: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  connectedIcon: {
    backgroundColor: '#4CAF50',
  },
  disconnectedIcon: {
    backgroundColor: '#999',
  },
  deviceName: {
    fontSize: 16,
    color: '#333',
  },
  connectedText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  connectText: {
    fontSize: 14,
    color: '#3f51b5',
    fontWeight: '500',
  },
  connectedDeviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  disconnectButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#F44336',
  },
  disconnectText: {
    color: '#F44336',
    fontSize: 14,
    fontWeight: '500',
  },
  helpCard: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 8,
    borderRadius: 4,
    padding: 16,
    elevation: 2,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
});