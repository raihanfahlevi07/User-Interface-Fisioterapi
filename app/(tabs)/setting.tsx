import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { BleManager } from 'react-native-ble-plx';

// Create a BLE Manager instance for checking bluetooth status
const bleManager = new BleManager();

export default function SettingsScreen() {
  // Settings state
  const [bluetoothEnabled, setBluetoothEnabled] = useState<boolean>(false);
  const [autoConnect, setAutoConnect] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [connectedDeviceName, setConnectedDeviceName] = useState<string>('');
  const [appVersion, setAppVersion] = useState<string>('1.0.0');
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [profileName, setProfileName] = useState<string>('');
  const [savedProfiles, setSavedProfiles] = useState<string[]>([]);
  
  // Check initial settings on component mount
  useEffect(() => {
    loadSettings();
    checkBluetoothStatus();
    loadConnectedDevice();
    loadProfiles();
  }, []);

  // Load all saved settings
  const loadSettings = async () => {
    try {
      const autoConnectSetting = await AsyncStorage.getItem('autoConnect');
      const soundSetting = await AsyncStorage.getItem('soundEnabled');
      const darkModeSetting = await AsyncStorage.getItem('darkMode');
      
      if (autoConnectSetting !== null) {
        setAutoConnect(autoConnectSetting === 'true');
      }
      
      if (soundSetting !== null) {
        setSoundEnabled(soundSetting === 'true');
      }
      
      if (darkModeSetting !== null) {
        setDarkMode(darkModeSetting === 'true');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  // Check if bluetooth is enabled
  const checkBluetoothStatus = () => {
    bleManager.state().then(state => {
      setBluetoothEnabled(state === 'PoweredOn');
    });
  };

  // Load connected device information
  const loadConnectedDevice = async () => {
    try {
      const isConnected = await AsyncStorage.getItem('bluetoothConnected');
      
      if (isConnected === 'true') {
        const deviceName = await AsyncStorage.getItem('connectedDeviceName');
        if (deviceName) {
          setConnectedDeviceName(deviceName);
        } else {
          setConnectedDeviceName('ESP32 Device');
        }
      } else {
        setConnectedDeviceName('');
      }
    } catch (error) {
      console.error('Error loading connected device:', error);
    }
  };

  // Load saved profiles
  const loadProfiles = async () => {
    try {
      const profiles = await AsyncStorage.getItem('savedProfiles');
      if (profiles) {
        setSavedProfiles(JSON.parse(profiles));
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
    }
  };

  // Toggle auto connect setting
  const toggleAutoConnect = async (value: boolean) => {
    setAutoConnect(value);
    try {
      await AsyncStorage.setItem('autoConnect', value.toString());
    } catch (error) {
      console.error('Error saving auto connect setting:', error);
    }
  };

  // Toggle sound setting
  const toggleSound = async (value: boolean) => {
    setSoundEnabled(value);
    try {
      await AsyncStorage.setItem('soundEnabled', value.toString());
    } catch (error) {
      console.error('Error saving sound setting:', error);
    }
  };

  // Toggle dark mode setting
  const toggleDarkMode = async (value: boolean) => {
    setDarkMode(value);
    try {
      await AsyncStorage.setItem('darkMode', value.toString());
      Alert.alert(
        'Mode Tampilan',
        'Perubahan tampilan akan diterapkan saat aplikasi dimulai ulang.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error saving dark mode setting:', error);
    }
  };

  // Disconnect from device
  const disconnectDevice = async () => {
    try {
      // Check if there's a device to disconnect
      if (!connectedDeviceName) {
        Alert.alert('Info', 'Tidak ada perangkat yang terhubung.');
        return;
      }
      
      // Find the device
      const connectedDevices = await bleManager.connectedDevices([]);
      const deviceId = await AsyncStorage.getItem('connectedDeviceId');
      
      if (deviceId) {
        const device = connectedDevices.find(d => d.id === deviceId);
        
        if (device) {
          // Disconnect
          await device.cancelConnection();
        }
        
        // Clear connection state
        await AsyncStorage.setItem('bluetoothConnected', 'false');
        await AsyncStorage.removeItem('connectedDeviceId');
        await AsyncStorage.removeItem('connectedDeviceName');
        
        setConnectedDeviceName('');
        
        Alert.alert('Berhasil', 'Perangkat berhasil diputuskan.');
      }
    } catch (error) {
      console.error('Disconnection error:', error);
      Alert.alert('Error', 'Gagal memutuskan perangkat.');
    }
  };

  // Save current patient data as profile
  const saveProfile = async () => {
    if (!profileName.trim()) {
      Alert.alert('Error', 'Nama profil tidak boleh kosong.');
      return;
    }
    
    try {
      // Get current patient data
      const patientData = await AsyncStorage.getItem('patientData');
      
      if (!patientData) {
        Alert.alert('Info', 'Tidak ada data pasien yang tersimpan.');
        return;
      }
      
      // Save profile
      const profileData = {
        name: profileName,
        data: JSON.parse(patientData)
      };
      
      // Update saved profiles
      const updatedProfiles = [...savedProfiles, profileName];
      setSavedProfiles(updatedProfiles);
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('savedProfiles', JSON.stringify(updatedProfiles));
      await AsyncStorage.setItem(`profile_${profileName}`, JSON.stringify(profileData));
      
      setShowProfileModal(false);
      setProfileName('');
      
      Alert.alert('Berhasil', `Profil "${profileName}" berhasil disimpan.`);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Gagal menyimpan profil.');
    }
  };

  // Load a saved profile
  const loadProfile = async (profileName: string) => {
    try {
      const profileData = await AsyncStorage.getItem(`profile_${profileName}`);
      
      if (profileData) {
        const parsedData = JSON.parse(profileData);
        
        // Load the patient data
        await AsyncStorage.setItem('patientData', JSON.stringify(parsedData.data));
        
        Alert.alert(
          'Berhasil',
          `Profil "${profileName}" berhasil dimuat. Silakan kembali ke halaman pasien untuk melihat data.`
        );
      } else {
        Alert.alert('Error', 'Profil tidak ditemukan.');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Gagal memuat profil.');
    }
  };

  // Delete a saved profile
  const deleteProfile = async (profileName: string) => {
    try {
      Alert.alert(
        'Konfirmasi',
        `Apakah Anda yakin ingin menghapus profil "${profileName}"?`,
        [
          {
            text: 'Batal',
            style: 'cancel'
          },
          {
            text: 'Hapus',
            style: 'destructive',
            onPress: async () => {
              // Remove from saved profiles
              const updatedProfiles = savedProfiles.filter(name => name !== profileName);
              setSavedProfiles(updatedProfiles);
              
              // Update AsyncStorage
              await AsyncStorage.setItem('savedProfiles', JSON.stringify(updatedProfiles));
              await AsyncStorage.removeItem(`profile_${profileName}`);
              
              Alert.alert('Berhasil', `Profil "${profileName}" berhasil dihapus.`);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error deleting profile:', error);
      Alert.alert('Error', 'Gagal menghapus profil.');
    }
  };

  // Reset all settings
  const resetSettings = () => {
    Alert.alert(
      'Konfirmasi Reset',
      'Apakah Anda yakin ingin mengembalikan semua pengaturan ke nilai default?',
      [
        {
          text: 'Batal',
          style: 'cancel'
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              // Reset settings
              await AsyncStorage.setItem('autoConnect', 'false');
              await AsyncStorage.setItem('soundEnabled', 'true');
              await AsyncStorage.setItem('darkMode', 'false');
              
              // Update state
              setAutoConnect(false);
              setSoundEnabled(true);
              setDarkMode(false);
              
              Alert.alert('Berhasil', 'Pengaturan berhasil direset.');
            } catch (error) {
              console.error('Error resetting settings:', error);
              Alert.alert('Error', 'Gagal mereset pengaturan.');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#3f51b5" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Pengaturan</Text>
      </View>
      
      <ScrollView style={styles.scrollView}>
        {/* Bluetooth Status Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Status Bluetooth</Text>
          
          <View style={styles.statusItem}>
            <View style={[styles.statusDot, { backgroundColor: bluetoothEnabled ? '#4CAF50' : '#F44336' }]} />
            <Text style={styles.statusText}>
              Bluetooth {bluetoothEnabled ? 'Aktif' : 'Tidak Aktif'}
            </Text>
          </View>
          
          {connectedDeviceName ? (
            <>
              <View style={styles.statusItem}>
                <View style={[styles.statusDot, { backgroundColor: '#4CAF50' }]} />
                <Text style={styles.statusText}>
                  Terhubung ke: {connectedDeviceName}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={disconnectDevice}
              >
                <Ionicons name="bluetooth" size={20} color="white" />
                <Text style={styles.actionButtonText}>Putuskan Perangkat</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.statusText}>
              Tidak ada perangkat yang terhubung
            </Text>
          )}
        </View>
        
        {/* General Settings Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pengaturan Umum</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <Ionicons name="bluetooth" size={20} color="#3f51b5" />
              <Text style={styles.settingLabel}>Auto-connect ke perangkat terakhir</Text>
            </View>
            <Switch
              value={autoConnect}
              onValueChange={toggleAutoConnect}
              trackColor={{ false: '#d1d1d1', true: '#a4adea' }}
              thumbColor={autoConnect ? '#3f51b5' : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <Ionicons name="volume-high" size={20} color="#3f51b5" />
              <Text style={styles.settingLabel}>Suara notifikasi</Text>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={toggleSound}
              trackColor={{ false: '#d1d1d1', true: '#a4adea' }}
              thumbColor={soundEnabled ? '#3f51b5' : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <Ionicons name="moon" size={20} color="#3f51b5" />
              <Text style={styles.settingLabel}>Mode Gelap</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: '#d1d1d1', true: '#a4adea' }}
              thumbColor={darkMode ? '#3f51b5' : '#f4f3f4'}
            />
          </View>
        </View>
        
        {/* Profile Management Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Manajemen Profil</Text>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowProfileModal(true)}
          >
            <Ionicons name="save" size={20} color="white" />
            <Text style={styles.actionButtonText}>Simpan Data Pasien sebagai Profil</Text>
          </TouchableOpacity>
          
          {savedProfiles.length > 0 ? (
            <View style={styles.profileList}>
              <Text style={styles.profileListTitle}>Profil Tersimpan:</Text>
              {savedProfiles.map((name, index) => (
                <View key={index} style={styles.profileItem}>
                  <Text style={styles.profileName}>{name}</Text>
                  <View style={styles.profileActions}>
                    <TouchableOpacity 
                      style={[styles.profileButton, styles.loadButton]}
                      onPress={() => loadProfile(name)}
                    >
                      <Text style={styles.profileButtonText}>Muat</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.profileButton, styles.deleteButton]}
                      onPress={() => deleteProfile(name)}
                    >
                      <Text style={styles.profileButtonText}>Hapus</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noProfileText}>
              Belum ada profil tersimpan
            </Text>
          )}
        </View>
        
        {/* About Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tentang Aplikasi</Text>
          
          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>Versi Aplikasi</Text>
            <Text style={styles.aboutValue}>{appVersion}</Text>
          </View>
          
          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>Pengembang</Text>
            <Text style={styles.aboutValue}>Kelompok TA2425.01.025</Text>
          </View>
          
          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>Dibuat oleh</Text>
            <Text style={styles.aboutValue}>
              Ekalina Rahayu, Muhammad Raihan Fahlevi, Danish Muhammad Hafidz
            </Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.resetButton]}
            onPress={resetSettings}
          >
            <Ionicons name="refresh" size={20} color="white" />
            <Text style={styles.actionButtonText}>Reset Pengaturan</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* Save Profile Modal */}
      <Modal
        visible={showProfileModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowProfileModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Simpan Profil</Text>
            
            <Text style={styles.modalLabel}>Nama Profil:</Text>
            <TextInput
              style={styles.modalInput}
              value={profileName}
              onChangeText={setProfileName}
              placeholder="Masukkan nama profil"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowProfileModal(false);
                  setProfileName('');
                }}
              >
                <Text style={styles.modalButtonText}>Batal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveProfile}
              >
                <Text style={styles.modalButtonText}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  scrollView: {
    flex: 1,
  },
  card: {
    backgroundColor: 'white',
    margin: 16,
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
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
  actionButton: {
    backgroundColor: '#3f51b5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginTop: 8,
  },
  actionButtonText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: '500',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
  },
  profileList: {
    marginTop: 16,
  },
  profileListTitle: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  profileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  profileName: {
    fontSize: 14,
    color: '#333',
  },
  profileActions: {
    flexDirection: 'row',
  },
  profileButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginLeft: 8,
  },
  loadButton: {
    backgroundColor: '#3f51b5',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  profileButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  noProfileText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
  },
  aboutItem: {
    marginBottom: 12,
  },
  aboutLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  aboutValue: {
    fontSize: 14,
    color: '#333',
  },
  resetButton: {
    backgroundColor: '#F44336',
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 4,
    padding: 24,
    width: '80%',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    height: 42,
    paddingHorizontal: 8,
    marginBottom: 24,
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#999',
  },
  saveButton: {
    backgroundColor: '#3f51b5',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});