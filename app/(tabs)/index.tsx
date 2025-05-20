import React, { useState } from 'react';
import {
  Modal,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';

// Define types for form data
interface FormData {
  name: string;
  gender: string;
  legLength: string;
}

const App: React.FC = () => {
  const [name, setName] = useState<string>('');
  const [gender, setGender] = useState<string>('');
  const [legLength, setLegLength] = useState<string>('50');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleLegLengthChange = (value: string): void => {
    // Allow only numbers
    const numericValue = value.replace(/[^0-9]/g, '');
    setLegLength(numericValue);
  };

  const handleContinue = (): void => {
    // Validate leg length
    const legLengthValue = parseInt(legLength);
    if (isNaN(legLengthValue) || legLengthValue < 30 || legLengthValue > 70) {
      setErrorMessage('Panjang kaki harus antara 30-70 cm');
      setShowModal(true);
      return;
    }
    
    // If validation passes, proceed with form submission
    const formData: FormData = { name, gender, legLength };
    console.log('Form data:', formData);
    // Navigation to next screen would go here
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#3f51b5" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Fisioterapi Stepper Motor</Text>
      </View>

      {/* Form Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Data Pasien Fisioterapi</Text>
        
        {/* Name Field */}
        <Text style={styles.label}>Nama</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder=""
        />
        
        {/* Gender Field */}
        <Text style={styles.label}>Jenis Kelamin</Text>
        <View style={styles.radioGroup}>
          <TouchableOpacity 
            style={styles.radioOption} 
            onPress={() => setGender('Laki-laki')}
          >
            <View style={[styles.radioButton, gender === 'Laki-laki' && styles.radioButtonSelected]} />
            <Text style={styles.radioLabel}>Laki-laki</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.radioOption} 
            onPress={() => setGender('Perempuan')}
          >
            <View style={[styles.radioButton, gender === 'Perempuan' && styles.radioButtonSelected]} />
            <Text style={styles.radioLabel}>Perempuan</Text>
          </TouchableOpacity>
        </View>
        
        {/* Leg Length Field */}
        <Text style={styles.label}>Panjang Kaki (30-70cm)</Text>
        <TextInput
          style={styles.input}
          value={legLength}
          onChangeText={handleLegLengthChange}
          keyboardType="numeric"
        />
        
        {/* Continue Button */}
        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>LANJUT</Text>
        </TouchableOpacity>
      </View>

      {/* Error Modal */}
      <Modal
        transparent={true}
        visible={showModal}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Peringatan</Text>
                <Text style={styles.modalMessage}>{errorMessage}</Text>
                <TouchableOpacity 
                  style={styles.modalButton} 
                  onPress={() => setShowModal(false)}
                >
                  <Text style={styles.modalButtonText}>OK</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

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
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 4,
    padding: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    color: '#333',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    height: 42,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  radioGroup: {
    marginBottom: 16,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  radioButton: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#999',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#3f51b5',
    borderWidth: 6,
  },
  radioLabel: {
    fontSize: 14,
    color: '#333',
  },
  button: {
    backgroundColor: '#3f51b5',
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 24,
    width: '80%',
    alignItems: 'center',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  modalMessage: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButton: {
    backgroundColor: '#3f51b5',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 4,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  }
});

export default App;