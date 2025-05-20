import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// Interface for patient data
interface PatientData {
  name: string;
  gender: string;
  legLength: string;
}

// Component for number input with +/- buttons
const NumberInput = ({ 
  value, 
  onValueChange, 
  label, 
  min = 1, 
  max = 100 
}: { 
  value: number; 
  onValueChange: (val: number) => void; 
  label: string; 
  min?: number; 
  max?: number; 
}) => {
  const increment = () => {
    if (value < max) {
      onValueChange(value + 1);
    }
  };

  const decrement = () => {
    if (value > min) {
      onValueChange(value - 1);
    }
  };

  return (
    <View style={styles.controlGroup}>
      <Text style={styles.controlLabel}>{label}</Text>
      <View style={styles.numberInputContainer}>
        <TouchableOpacity
          style={styles.numberButton}
          onPress={decrement}
        >
          <Text style={styles.numberButtonText}>-</Text>
        </TouchableOpacity>
        <View style={styles.numberValueContainer}>
          <Text style={styles.numberValue}>{value}</Text>
        </View>
        <TouchableOpacity
          style={styles.numberButton}
          onPress={increment}
        >
          <Text style={styles.numberButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.sliderContainer}>
        <View style={[styles.slider, { width: `${(value / max) * 100}%` }]} />
      </View>
      <View style={styles.rangeLabels}>
        <Text style={styles.rangeText}>{min}</Text>
        <Text style={styles.rangeText}>{max}</Text>
      </View>
    </View>
  );
};

// Status indicator component
const StatusIndicator = ({ status }: { status: 'idle' | 'running' | 'paused' }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'idle': return '#999';
      case 'running': return '#4CAF50';
      case 'paused': return '#FF9800';
      default: return '#999';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'idle': return 'Siap';
      case 'running': return 'Berjalan';
      case 'paused': return 'Dijeda';
      default: return 'Tidak diketahui';
    }
  };

  return (
    <View style={styles.statusContainer}>
      <Text style={styles.statusLabel}>Status:</Text>
      <View style={styles.statusIndicator}>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
        <Text style={styles.statusText}>{getStatusText()}</Text>
      </View>
    </View>
  );
};

export default function ControlScreen() {
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [speed, setSpeed] = useState<number>(50);
  const [stepDistance, setStepDistance] = useState<number>(50);
  const [status, setStatus] = useState<'idle' | 'running' | 'paused'>('idle');
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // Load patient data from AsyncStorage
  useEffect(() => {
    const loadPatientData = async () => {
      try {
        const data = await AsyncStorage.getItem('patientData');
        if (data) {
          setPatientData(JSON.parse(data));
        } else {
          Alert.alert(
            "Data Tidak Ditemukan", 
            "Silakan masukkan data pasien terlebih dahulu.",
            [{ text: "OK" }]
          );
        }
      } catch (error) {
        console.error("Error loading patient data:", error);
      }
    };

    // Check if Bluetooth is connected
    const checkBluetoothConnection = async () => {
      try {
        const connected = await AsyncStorage.getItem('bluetoothConnected');
        setIsConnected(connected === 'true');
      } catch (error) {
        console.error("Error checking Bluetooth connection:", error);
      }
    };

    loadPatientData();
    checkBluetoothConnection();
  }, []);

  // Handle control buttons
  const handleStart = () => {
    if (!isConnected) {
      Alert.alert(
        "Tidak Terhubung", 
        "Silakan hubungkan perangkat Bluetooth terlebih dahulu.",
        [{ text: "OK" }]
      );
      return;
    }
    
    setStatus('running');
    // Here you would send commands to the ESP32
    console.log(`Starting with speed: ${speed}, step distance: ${stepDistance}`);
  };

  const handlePause = () => {
    if (status === 'running') {
      setStatus('paused');
      // Here you would send pause command to the ESP32
      console.log('Pausing');
    }
  };

  const handleStop = () => {
    setStatus('idle');
    // Here you would send stop command to the ESP32
    console.log('Stopping');
  };

  // Save settings when they change
  useEffect(() => {
    const saveSettings = async () => {
      try {
        await AsyncStorage.setItem('motorSettings', JSON.stringify({ speed, stepDistance }));
      } catch (error) {
        console.error("Error saving settings:", error);
      }
    };

    saveSettings();
  }, [speed, stepDistance]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#3f51b5" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Kontrol Motor</Text>
      </View>

      {/* Connection Status */}
      <View style={[styles.connectionStatus, isConnected ? styles.connected : styles.disconnected]}>
        <Text style={styles.connectionText}>
          {isConnected ? "Terhubung ke ESP32" : "Tidak Terhubung"}
        </Text>
      </View>

      {/* Patient Info Card */}
      {patientData && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Data Pasien:</Text>
          <View style={styles.patientInfo}>
            <Text style={styles.infoText}>Nama: {patientData.name}</Text>
            <Text style={styles.infoText}>Jenis Kelamin: {patientData.gender}</Text>
            <Text style={styles.infoText}>Panjang Kaki: {patientData.legLength} cm</Text>
          </View>
        </View>
      )}

      {/* Controls Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Pengaturan Gerakan</Text>
        
        {/* Speed Control */}
        <NumberInput
          label="Kecepatan"
          value={speed}
          onValueChange={setSpeed}
          min={1}
          max={100}
        />
        
        {/* Step Distance Control */}
        <NumberInput
          label="Jarak Langkah"
          value={stepDistance}
          onValueChange={setStepDistance}
          min={1}
          max={100}
        />
        
        {/* Control Buttons */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity 
            style={[styles.button, styles.startButton, status === 'running' && styles.activeButton]} 
            onPress={handleStart}
          >
            <Text style={styles.buttonText}>START</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.pauseButton, status === 'paused' && styles.activeButton]} 
            onPress={handlePause}
          >
            <Text style={styles.buttonText}>PAUSE</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.stopButton]} 
            onPress={handleStop}
          >
            <Text style={styles.buttonText}>STOP</Text>
          </TouchableOpacity>
        </View>
        
        {/* Status Indicator */}
        <StatusIndicator status={status} />
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
  connectionStatus: {
    padding: 8,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  connected: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  disconnected: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
  },
  connectionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  card: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 4,
    padding: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    color: '#333',
    marginBottom: 16,
  },
  patientInfo: {
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  controlGroup: {
    marginBottom: 20,
  },
  controlLabel: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  numberInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  numberButton: {
    width: 42,
    height: 42,
    backgroundColor: '#3f51b5',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  numberValueContainer: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    marginHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberValue: {
    fontSize: 16,
    color: '#333',
  },
  sliderContainer: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginBottom: 4,
  },
  slider: {
    height: 4,
    backgroundColor: '#3f51b5',
    borderRadius: 2,
  },
  rangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rangeText: {
    fontSize: 12,
    color: '#999',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  pauseButton: {
    backgroundColor: '#FF9800',
  },
  stopButton: {
    backgroundColor: '#F44336',
  },
  activeButton: {
    opacity: 0.8,
    borderWidth: 2,
    borderColor: '#333',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  statusLabel: {
    fontSize: 16,
    color: '#333',
    marginRight: 8,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    color: '#333',
  },
});