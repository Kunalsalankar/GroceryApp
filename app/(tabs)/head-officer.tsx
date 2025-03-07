import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  SafeAreaView, 
  ScrollView, 
  StatusBar, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  Alert,
  Image
} from 'react-native';
import { 
  Button, 
  TextInput, 
  HelperText, 
  Appbar, 
  Checkbox, 
  Dialog, 
  Portal, 
  Provider as PaperProvider,
  ActivityIndicator 
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  doc, 
  getDoc, 
  Timestamp, 
  updateDoc,
  setDoc 
} from 'firebase/firestore';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  updateProfile 
} from 'firebase/auth';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBZYvwt5dOL2jr7C7E0T7kHmy1wrVpvsCQ",
  authDomain: "omkar-bcfd4.firebaseapp.com",
  projectId: "omkar-bcfd4",
  storageBucket: "omkar-bcfd4.firebasestorage.app",
  messagingSenderId: "865551458358",
  appId: "1:865551458358:web:28e626110e592a7582f897",
  measurementId: "G-5SQD2GPRNB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export default function HeadOfficer() {
  const router = useRouter();
  
  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [badgeNumber, setBadgeNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  
  // Error states
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [badgeNumberError, setBadgeNumberError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [departmentError, setDepartmentError] = useState('');
  const [termsError, setTermsError] = useState('');
  
  const validateForm = () => {
    let isValid = true;
    
    // First name validation
    if (!firstName.trim()) {
      setFirstNameError('First name is required');
      isValid = false;
    } else {
      setFirstNameError('');
    }
    
    // Last name validation
    if (!lastName.trim()) {
      setLastNameError('Last name is required');
      isValid = false;
    } else {
      setLastNameError('');
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    } else {
      setEmailError('');
    }
    
    // Password validation
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      isValid = false;
    } else {
      setPasswordError('');
    }
    
    // Confirm password validation
    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      isValid = false;
    } else if (confirmPassword !== password) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    } else {
      setConfirmPasswordError('');
    }
    
    // Badge number validation
    if (!badgeNumber.trim()) {
      setBadgeNumberError('Badge number is required');
      isValid = false;
    } else {
      setBadgeNumberError('');
    }
    
    // Phone validation
    const phoneRegex = /^\d{10}$/;
    if (!phone.trim()) {
      setPhoneError('Phone number is required');
      isValid = false;
    } else if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
      setPhoneError('Please enter a valid 10-digit phone number');
      isValid = false;
    } else {
      setPhoneError('');
    }
    
    // Department validation
    if (!department.trim()) {
      setDepartmentError('Please enter your department');
      isValid = false;
    } else {
      setDepartmentError('');
    }
    
    // Terms validation
    if (!agreeToTerms) {
      setTermsError('You must agree to the terms and conditions');
      isValid = false;
    } else {
      setTermsError('');
    }
    
    return isValid;
  };
  
  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update profile
      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`
      });
      
      // Create a unique ID for the officer document
      const officerId = user.uid;
      
      // Save officer details to Firestore with document ID matching the user UID
      await setDoc(doc(db, 'officers', officerId), {
        uid: user.uid,
        firstName: firstName,
        lastName: lastName,
        email: email,
        badgeNumber: badgeNumber,
        phone: phone,
        department: department,
        role: 'head_officer',
        createdAt: Timestamp.now(),
        status: 'active'
      });
      
      // Also save to the 5PSSw... collection for reference
      const customDocRef = doc(db, '5PSSwEiFiPVaAfaIR4dB', officerId);
      await setDoc(customDocRef, {
        badgeNumber: badgeNumber,
        name: `${firstName} ${lastName}`,
        department: department,
        phone: phone,
        email: email,
        role: 'head_officer',
        createdAt: Timestamp.now(),
        status: 'active'
      });
      
      setLoading(false);
      setDialogVisible(true);
    } catch (error) {
      setLoading(false);
      console.error("Error registering user:", error);
      if (error && typeof error === 'object' && 'message' in error) {
        Alert.alert('Registration Error', String(error.message));
      } else {
        Alert.alert('Registration Error', 'Failed to register. Please try again.');
      }
    }
  };
  
  const handleDialogClose = () => {
    setDialogVisible(false);
    // Navigate to dashboard
    router.replace('/dashboard');
  };
  
  return (
    <PaperProvider>
      <View style={styles.container}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        
        <Appbar.Header style={styles.appbar}>
          <Appbar.BackAction onPress={() => router.back()} color={Colors.white} />
          <Appbar.Content title="Head Officer Registration" color={Colors.white} />
        </Appbar.Header>
        
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardAvoid}
          >
            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={styles.scrollViewContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Header Section */}
              <View style={styles.headerContainer}>
                <LinearGradient
                  colors={[Colors.primary, Colors.secondary]}
                  style={styles.headerGradient}
                >
                  <MaterialCommunityIcons 
                    name="shield-account" 
                    size={60} 
                    color={Colors.white}
                  />
                  <Text style={styles.headerTitle}>Head Officer Registration</Text>
                  <Text style={styles.headerSubtitle}>
                    Create an account to manage your department's resources and personnel
                  </Text>
                </LinearGradient>
              </View>
              
              {/* Registration Form */}
              <View style={styles.formContainer}>
                <Text style={styles.sectionTitle}>Personal Information</Text>
                
                <View style={styles.row}>
                  <View style={styles.halfColumn}>
                    <TextInput
                      label="First Name"
                      value={firstName}
                      onChangeText={setFirstName}
                      mode="outlined"
                      style={styles.input}
                      error={!!firstNameError}
                      left={<TextInput.Icon icon="account" />}
                      theme={{ colors: { text: '#000000', placeholder: '#555555' } }}
                    />
                    {!!firstNameError && <HelperText type="error" style={styles.errorText}>{firstNameError}</HelperText>}
                  </View>
                  
                  <View style={styles.halfColumn}>
                    <TextInput
                      label="Last Name"
                      value={lastName}
                      onChangeText={setLastName}
                      mode="outlined"
                      style={styles.input}
                      error={!!lastNameError}
                      left={<TextInput.Icon icon="account" />}
                      theme={{ colors: { text: '#000000', placeholder: '#555555' } }}
                    />
                    {!!lastNameError && <HelperText type="error" style={styles.errorText}>{lastNameError}</HelperText>}
                  </View>
                </View>
                
                <TextInput
                  label="Email Address"
                  value={email}
                  onChangeText={setEmail}
                  mode="outlined"
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={!!emailError}
                  left={<TextInput.Icon icon="email" />}
                  theme={{ colors: { text: '#000000', placeholder: '#555555' } }}
                />
                {!!emailError && <HelperText type="error" style={styles.errorText}>{emailError}</HelperText>}
                
                <View style={styles.row}>
                  <View style={styles.halfColumn}>
                    <TextInput
                      label="Password"
                      value={password}
                      onChangeText={setPassword}
                      mode="outlined"
                      style={styles.input}
                      secureTextEntry
                      error={!!passwordError}
                      left={<TextInput.Icon icon="lock" />}
                      theme={{ colors: { text: '#000000', placeholder: '#555555' } }}
                    />
                    {!!passwordError && <HelperText type="error" style={styles.errorText}>{passwordError}</HelperText>}
                  </View>
                  
                  <View style={styles.halfColumn}>
                    <TextInput
                      label="Confirm Password"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      mode="outlined"
                      style={styles.input}
                      secureTextEntry
                      error={!!confirmPasswordError}
                      left={<TextInput.Icon icon="lock-check" />}
                      theme={{ colors: { text: '#000000', placeholder: '#555555' } }}
                    />
                    {!!confirmPasswordError && <HelperText type="error" style={styles.errorText}>{confirmPasswordError}</HelperText>}
                  </View>
                </View>
                
                <Text style={[styles.sectionTitle, {marginTop: 20}]}>Professional Details</Text>
                
                <View style={styles.row}>
                  <View style={styles.halfColumn}>
                    <TextInput
                      label="Badge Number"
                      value={badgeNumber}
                      onChangeText={setBadgeNumber}
                      mode="outlined"
                      style={styles.input}
                      error={!!badgeNumberError}
                      left={<TextInput.Icon icon="badge-account" />}
                      theme={{ colors: { text: '#000000', placeholder: '#555555' } }}
                    />
                    {!!badgeNumberError && <HelperText type="error" style={styles.errorText}>{badgeNumberError}</HelperText>}
                  </View>
                  
                  <View style={styles.halfColumn}>
                    <TextInput
                      label="Phone Number"
                      value={phone}
                      onChangeText={setPhone}
                      mode="outlined"
                      style={styles.input}
                      keyboardType="phone-pad"
                      error={!!phoneError}
                      left={<TextInput.Icon icon="phone" />}
                      theme={{ colors: { text: '#000000', placeholder: '#555555' } }}
                    />
                    {!!phoneError && <HelperText type="error" style={styles.errorText}>{phoneError}</HelperText>}
                  </View>
                </View>
                
                {/* Changed from dropdown to text input for department */}
                <TextInput
                  label="Department"
                  value={department}
                  onChangeText={setDepartment}
                  mode="outlined"
                  style={styles.input}
                  error={!!departmentError}
                  left={<TextInput.Icon icon="office-building" />}
                  placeholder="Enter your department name"
                  theme={{ colors: { text: '#000000', placeholder: '#555555' } }}
                />
                {!!departmentError && <HelperText type="error" style={styles.errorText}>{departmentError}</HelperText>}
                
                <View style={styles.termsContainer}>
                  <Checkbox.Item
                    label="I agree to the terms and conditions"
                    status={agreeToTerms ? 'checked' : 'unchecked'}
                    onPress={() => setAgreeToTerms(!agreeToTerms)}
                    position="leading"
                    color={Colors.primary}
                    style={styles.checkbox}
                    labelStyle={styles.checkboxLabel}
                  />
                  {!!termsError && <HelperText type="error" style={styles.errorText}>{termsError}</HelperText>}
                  
                  <TouchableOpacity onPress={() => Alert.alert('Terms and Conditions', 'By using this application, you agree to abide by department policies and regulations regarding the use of equipment and data privacy.')}>
                    <Text style={styles.termsLink}>View Terms and Conditions</Text>
                  </TouchableOpacity>
                </View>
                
                <Button 
                  mode="contained" 
                  style={styles.button} 
                  labelStyle={styles.buttonLabel}
                  onPress={handleRegister}
                  loading={loading}
                  disabled={loading}
                >
                  Register as Head Officer
                </Button>
                
                <TouchableOpacity style={styles.loginLink} onPress={() => router.replace('/')}>
                  <Text style={styles.loginText}>Already have an account? Login</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
        
        {/* Success Dialog */}
        <Portal>
          <Dialog visible={dialogVisible} onDismiss={handleDialogClose}>
            <Dialog.Title>Registration Successful</Dialog.Title>
            <Dialog.Content>
              <Text style={styles.dialogText}>Your head officer account has been created successfully. You can now access the dashboard to manage your department.</Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={handleDialogClose}>Go to Dashboard</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  appbar: {
    backgroundColor: Colors.primary,
    elevation: 4,
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  headerContainer: {
    marginBottom: 20,
  },
  headerGradient: {
    padding: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    marginTop: 10,
    marginBottom: 5,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.9,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  formContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000', // Darker color for section titles
    marginBottom: 15,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  halfColumn: {
    width: '48%',
  },
  input: {
    marginBottom: 8,
    backgroundColor: Colors.white,
  },
  errorText: {
    color: '#FF0000', // Bright red for errors
    fontWeight: '500',
    marginBottom: 8,
  },
  termsContainer: {
    marginVertical: 15,
  },
  checkbox: {
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  },
  checkboxLabel: {
    color: '#000000', // Darker checkbox label color
    fontSize: 15,
  },
  termsLink: {
    color: Colors.primary,
    textDecorationLine: 'underline',
    marginLeft: 50,
    marginTop: 5,
    fontWeight: '500',
  },
  button: {
    marginTop: 20,
    paddingVertical: 8,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    color: Colors.white,
  },
  loginLink: {
    marginTop: 15,
    alignItems: 'center',
  },
  loginText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  dialogText: {
    color: '#000000',
    fontSize: 15,
    lineHeight: 22,
  },
});