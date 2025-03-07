import React, { useState } from 'react';
import { StyleSheet, View, Text, Image, KeyboardAvoidingView, Platform, Alert, TouchableOpacity } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// Firebase configuration - you'll need to replace this with your actual config
const firebaseConfig = {
  apiKey: "AIzaSyBZYvwt5dOL2jr7C7E0T7kHmy1wrVpvsCQ",
  authDomain: "omkar-bcfd4.firebaseapp.com",
  projectId: "omkar-bcfd4",
  storageBucket: "omkar-bcfd4.firebasestorage.app",
  messagingSenderId: "865551458358",
  appId: "1:865551458358:web:28e626110e592a7582f897",
  measurementId: "G-5SQD2GPRNB"
};

// Initialize Firebase - check if already initialized to prevent duplicate app error
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

// Define officer type options
type OfficerType = 'headOfficer' | 'officer';

export default function LoginScreen() {
  // State management for form inputs and loading state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [officerType, setOfficerType] = useState<OfficerType>('officer'); // Default to normal officer
  const [showTypeSelection, setShowTypeSelection] = useState(true);
  const [selectedType, setSelectedType] = useState<OfficerType | ''>('');
  const router = useRouter();

  // Handle officer type selection
  const handleTypeSelection = (type: OfficerType) => {
    setSelectedType(type);
    setShowTypeSelection(false);
  };

  // Handle form validation and submission
  const handleLogin = async () => {
    // Basic form validation
    if (!email.trim()) {
      Alert.alert('Validation Error', 'Please enter your email');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Validation Error', 'Please enter your password');
      return;
    }

    setIsLoading(true);
    try {
      // Authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Determine collection to query based on selected type
      const collectionName = selectedType === 'headOfficer' ? 'officers' : 'normalofficers';
      
      // Check if user exists in the appropriate collection
      const q = query(collection(db, collectionName), where("email", "==", email));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error(`No ${selectedType} found with this email`);
      }
      
      // User found, navigate to appropriate dashboard
      if (selectedType === 'headOfficer') {
        router.replace('/dashboard');
      } else {
        router.replace('/dashboardOfficer');
      }
      
    } catch (error: unknown) {
      console.error('Login error:', error);
      
      // Handle error message formatting with proper type checking
      let errorMessage = 'Please check your credentials and try again';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      Alert.alert(
        'Login Failed',
        errorMessage
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Go back to officer type selection
  const handleBackToSelection = () => {
    setShowTypeSelection(true);
    setSelectedType('');
    setEmail('');
    setPassword('');
  };

  // Render officer type selection
  if (showTypeSelection) {
    return (
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/logo.jpeg')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>EquipTrack</Text>
        </View>
        
        <View style={styles.selectionContainer}>
          <Text style={styles.selectionTitle}>Select Your Position</Text>
          
          <TouchableOpacity 
            style={styles.selectionButton}
            onPress={() => handleTypeSelection('headOfficer')}
          >
            <Text style={styles.selectionButtonText}>Head Officer</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.selectionButton}
            onPress={() => handleTypeSelection('officer')}
          >
            <Text style={styles.selectionButtonText}>Officer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Render login form
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.logoContainer}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackToSelection}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        
        <Image
          source={require('../../assets/images/logo.jpeg')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>EquipTrack</Text>
        <Text style={styles.subtitle}>
          {selectedType === 'headOfficer' ? 'Head Officer Login' : 'Officer Login'}
        </Text>
      </View>

      <View style={styles.formContainer}>
        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          mode="outlined"
          activeOutlineColor={Colors.primary}
          keyboardType="email-address"
          autoCapitalize="none"
          returnKeyType="next"
        />
        
        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
          mode="outlined"
          activeOutlineColor={Colors.primary}
          autoCapitalize="none"
          returnKeyType="done"
          onSubmitEditing={handleLogin}
        />

        <Button
          mode="contained"
          onPress={handleLogin}
          loading={isLoading}
          disabled={isLoading}
          style={styles.button}
        >
          Login
        </Button>

        <Text style={styles.forgotPassword}>
          Forgot password? Contact IT Support
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 60 : 40,
    marginBottom: 40,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  backButtonText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '500',
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.text,
    marginBottom: 10,
  },
  formContainer: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  input: {
    marginBottom: 16,
    backgroundColor: Colors.white,
  },
  button: {
    marginTop: 10,
    padding: 5,
    backgroundColor: Colors.primary,
  },
  forgotPassword: {
    marginTop: 20,
    textAlign: 'center',
    color: Colors.text,
    fontSize: 14,
  },
  selectionContainer: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: 20,
    width: '100%',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  selectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 30,
  },
  selectionButton: {
    backgroundColor: Colors.primary,
    width: '100%',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 15,
  },
  selectionButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});