import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, StatusBar, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Button, TextInput, HelperText, Appbar, Checkbox, Dialog, Portal, RadioButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';

export default function OfficerSignUp() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [badgeNumber, setBadgeNumber] = useState('');
  const [rank, setRank] = useState('officer');
  const [division, setDivision] = useState('');
  const [supervisor, setSupervisor] = useState('');
  const [checked, setChecked] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);

  // Error states
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [badgeNumberError, setBadgeNumberError] = useState('');
  const [divisionError, setDivisionError] = useState('');
  const [supervisorError, setSupervisorError] = useState('');

  const validateInputs = () => {
    let isValid = true;

    if (!firstName.trim()) {
      setFirstNameError('First name is required');
      isValid = false;
    } else {
      setFirstNameError('');
    }

    if (!lastName.trim()) {
      setLastNameError('Last name is required');
      isValid = false;
    } else {
      setLastNameError('');
    }

    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Email is invalid');
      isValid = false;
    } else {
      setEmailError('');
    }

    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      isValid = false;
    } else {
      setPasswordError('');
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      isValid = false;
    } else if (confirmPassword !== password) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    } else {
      setConfirmPasswordError('');
    }

    if (!badgeNumber.trim()) {
      setBadgeNumberError('Badge number is required');
      isValid = false;
    } else {
      setBadgeNumberError('');
    }

    if (!division.trim()) {
      setDivisionError('Division is required');
      isValid = false;
    } else {
      setDivisionError('');
    }

    if (!supervisor.trim()) {
      setSupervisorError('Supervisor name is required');
      isValid = false;
    } else {
      setSupervisorError('');
    }

    if (!checked) {
      isValid = false;
    }

    return isValid;
  };

  const handleSignUp = () => {
    if (validateInputs()) {
      // Here you would normally handle the sign-up API call
      setDialogVisible(true);
    }
  };

  const handleBackToLogin = () => {
    router.back();
  };

  const handleSuccessfulSignUp = () => {
    setDialogVisible(false);
    router.replace('/dashboard');
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      <Appbar.Header style={styles.appbar}>
        <Appbar.BackAction onPress={handleBackToLogin} color={Colors.white} />
        <Appbar.Content title="Field Officer Sign Up" color={Colors.white} />
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
                colors={[Colors.secondary, '#4C9AFF']}
                style={styles.headerGradient}
              >
                <MaterialCommunityIcons 
                  name="account-tie" 
                  size={60} 
                  color={Colors.white}
                />
                <Text style={styles.headerTitle}>Field Officer Registration</Text>
                <Text style={styles.headerSubtitle}>
                  Create your account to manage equipment assignments and maintenance requests
                </Text>
              </LinearGradient>
            </View>

            {/* Form Section */}
            <View style={styles.formContainer}>
              <Text style={styles.sectionTitle}>Personal Information</Text>
              
              <View style={styles.nameRow}>
                <View style={styles.nameField}>
                  <TextInput
                    label="First Name"
                    value={firstName}
                    onChangeText={setFirstName}
                    mode="outlined"
                    style={styles.input}
                    error={!!firstNameError}
                    left={<TextInput.Icon icon="account" />}
                  />
                  {!!firstNameError && <HelperText type="error">{firstNameError}</HelperText>}
                </View>

                <View style={styles.nameField}>
                  <TextInput
                    label="Last Name"
                    value={lastName}
                    onChangeText={setLastName}
                    mode="outlined"
                    style={styles.input}
                    error={!!lastNameError}
                    left={<TextInput.Icon icon="account" />}
                  />
                  {!!lastNameError && <HelperText type="error">{lastNameError}</HelperText>}
                </View>
              </View>

              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                error={!!emailError}
                left={<TextInput.Icon icon="email" />}
              />
              {!!emailError && <HelperText type="error">{emailError}</HelperText>}

              <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                style={styles.input}
                secureTextEntry={!passwordVisible}
                error={!!passwordError}
                left={<TextInput.Icon icon="lock" />}
                right={
                  <TextInput.Icon 
                    icon={passwordVisible ? "eye-off" : "eye"} 
                    onPress={() => setPasswordVisible(!passwordVisible)}
                  />
                }
              />
              {!!passwordError && <HelperText type="error">{passwordError}</HelperText>}
              {!passwordError && password && (
                <HelperText type="info">
                  Password must be at least 8 characters long and include numbers and special characters
                </HelperText>
              )}

              <TextInput
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                mode="outlined"
                style={styles.input}
                secureTextEntry={!confirmPasswordVisible}
                error={!!confirmPasswordError}
                left={<TextInput.Icon icon="lock-check" />}
                right={
                  <TextInput.Icon 
                    icon={confirmPasswordVisible ? "eye-off" : "eye"} 
                    onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                  />
                }
              />
              {!!confirmPasswordError && <HelperText type="error">{confirmPasswordError}</HelperText>}

              <Text style={[styles.sectionTitle, {marginTop: 20}]}>Department Information</Text>

              <TextInput
                label="Badge Number"
                value={badgeNumber}
                onChangeText={setBadgeNumber}
                mode="outlined"
                style={styles.input}
                error={!!badgeNumberError}
                left={<TextInput.Icon icon="card-account-details" />}
              />
              {!!badgeNumberError && <HelperText type="error">{badgeNumberError}</HelperText>}

              <Text style={styles.radioLabel}>Rank</Text>
              <RadioButton.Group onValueChange={newValue => setRank(newValue)} value={rank}>
                <View style={styles.radioContainer}>
                  <View style={styles.radioOption}>
                    <RadioButton value="officer" color={Colors.secondary} />
                    <Text>Officer</Text>
                  </View>
                  <View style={styles.radioOption}>
                    <RadioButton value="sergeant" color={Colors.secondary} />
                    <Text>Sergeant</Text>
                  </View>
                  <View style={styles.radioOption}>
                    <RadioButton value="lieutenant" color={Colors.secondary} />
                    <Text>Lieutenant</Text>
                  </View>
                </View>
              </RadioButton.Group>

              <TextInput
                label="Division/Unit"
                value={division}
                onChangeText={setDivision}
                mode="outlined"
                style={styles.input}
                error={!!divisionError}
                left={<TextInput.Icon icon="office-building" />}
              />
              {!!divisionError && <HelperText type="error">{divisionError}</HelperText>}
              <HelperText type="info">
                Examples: Patrol, Traffic, Investigations, K-9, etc.
              </HelperText>

              <TextInput
                label="Supervisor Name"
                value={supervisor}
                onChangeText={setSupervisor}
                mode="outlined"
                style={styles.input}
                error={!!supervisorError}
                left={<TextInput.Icon icon="account-supervisor" />}
              />
              {!!supervisorError && <HelperText type="error">{supervisorError}</HelperText>}

              <View style={styles.checkboxContainer}>
                <Checkbox
                  status={checked ? 'checked' : 'unchecked'}
                  onPress={() => setChecked(!checked)}
                  color={Colors.secondary}
                />
                <Text style={styles.checkboxLabel}>
                  I agree to the Terms of Service and Privacy Policy
                </Text>
              </View>

              <Button 
                mode="contained" 
                style={styles.button} 
                labelStyle={styles.buttonLabel}
                onPress={handleSignUp}
                disabled={!checked}
              >
                Create Field Officer Account
              </Button>

              <TouchableOpacity 
                style={styles.backLink}
                onPress={handleBackToLogin}
              >
                <Text style={styles.backLinkText}>
                  <Ionicons name="arrow-back" size={16} /> Back to Main Page
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>Registration Successful</Dialog.Title>
          <Dialog.Content>
            <Text>Your Field Officer account has been created successfully.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleSuccessfulSignUp}>Continue to Dashboard</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  appbar: {
    backgroundColor: Colors.secondary,
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
    color: Colors.text,
    marginBottom: 15,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  nameField: {
    flex: 1,
    marginRight: 10,
  },
  input: {
    marginBottom: 5,
    backgroundColor: Colors.white,
  },
  radioLabel: {
    fontSize: 16,
    color: Colors.text,
    marginTop: 10,
    marginBottom: 5,
  },
  radioContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  button: {
    marginTop: 10,
    marginBottom: 20,
    paddingVertical: 8,
    backgroundColor: Colors.secondary,
    borderRadius: 8,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  backLink: {
    alignItems: 'center',
    marginBottom: 30,
  },
  backLinkText: {
    color: Colors.secondary,
    fontSize: 16,
  },
});