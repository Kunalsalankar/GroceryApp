import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar, 
  Platform, 
  ActivityIndicator, 
  Alert,
  KeyboardAvoidingView,
  TextInput
} from 'react-native';
import { Card, Divider } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { collection, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebaseConfig'; // Adjust the path as needed

// Define types for Officer data
interface Officer {
  id: string;
  firstName?: string;
  lastName?: string;
  badgeNumber?: string;
  role?: string;
  department?: string;
  phone?: string;
  email?: string;
  createdAt?: any;
  lastActive?: any;
  status?: string;
}

// Use the same color scheme
const PoliceColors = {
  primary: '#003366', // Dark blue
  secondary: '#1a3c61', // Slightly lighter blue
  accent: '#bf2c37', // Police red
  background: '#f5f7fa', // Light background
  cardBackground: '#ffffff', // White for cards
  text: '#333333', // Near black for text
  textLight: '#6c757d', // Gray for secondary text
  border: '#d1d9e6', // Light border color
  success: '#28a745', // Green for success indicators
  warning: '#ffc107', // Yellow for warnings
  danger: '#dc3545', // Red for alerts
  lightBlue: '#e6f0ff', // Light blue for backgrounds
  gold: '#ffd700', // Gold for badge elements
  white: '#ffffff', // White color
  darkBlue: '#00264d', // Darker blue for gradients
  lightGray: '#f0f2f5', // Light gray for backgrounds
  darkGray: '#495057', // Dark gray for text
  shadowColor: 'rgba(0, 0, 0, 0.1)', // Shadow color
};

export default function EditProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState<Officer | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [badgeNumber, setBadgeNumber] = useState('');
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  
  // Get user ID from params or auth
  const userId = params.id as string || (auth.currentUser ? auth.currentUser.uid : null);
  
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) {
        setError('No user ID provided');
        setLoading(false);
        return;
      }
      
      try {
        // Reference to the specific officer document
        const officerDocRef = doc(db, 'officers', userId);
        const officerDoc = await getDoc(officerDocRef);
        
        if (officerDoc.exists()) {
          const officerData = {
            id: officerDoc.id,
            ...officerDoc.data() as Omit<Officer, 'id'>
          };
          
          setUserData(officerData);
          
          // Initialize form state with existing data
          setFirstName(officerData.firstName || '');
          setLastName(officerData.lastName || '');
          setBadgeNumber(officerData.badgeNumber || '');
          setRole(officerData.role || '');
          setDepartment(officerData.department || '');
          setPhone(officerData.phone || '');
          setEmail(officerData.email || '');
          setStatus(officerData.status || 'active');
        } else {
          setError('Officer not found');
        }
      } catch (err) {
        console.error('Error fetching officer data:', err);
        setError('Failed to load officer data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [userId]);
  
  // Handle save profile
  const handleSaveProfile = async () => {
    if (!userId) {
      Alert.alert('Error', 'User ID is missing');
      return;
    }
    
    // Validate form
    if (!firstName.trim()) {
      Alert.alert('Error', 'First name is required');
      return;
    }
    
    if (!email.trim()) {
      Alert.alert('Error', 'Email is required');
      return;
    }
    
    try {
      setSaving(true);
      
      // Create updated officer data
      const updatedOfficerData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        badgeNumber: badgeNumber.trim(),
        role: role.trim(),
        department: department.trim(),
        phone: phone.trim(),
        email: email.trim(),
        status: status.trim() || 'active',
        lastActive: serverTimestamp(), // Update last active time
      };
      
      // Reference to the officer document
      const officerDocRef = doc(db, 'officers', userId);
      
      // Update the document
      await updateDoc(officerDocRef, updatedOfficerData);
      
      Alert.alert(
        'Success',
        'Profile updated successfully',
        [
          { 
            text: 'OK', 
            onPress: () => {
              // Navigate back to profile page
              router.replace({
                pathname: '/(tabs)/profile' as any,
                params: { id: userId }
              });
            }
          }
        ]
      );
    } catch (err) {
      console.error('Error updating profile:', err);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  // Handle cancel
  const handleCancel = () => {
    router.back();
  };
  
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={PoliceColors.primary} />
        <Text style={styles.loadingText}>Loading profile data...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="alert-circle-outline" size={48} color={PoliceColors.accent} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.errorButton}
          onPress={() => router.back()}
        >
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <StatusBar barStyle="light-content" backgroundColor={PoliceColors.darkBlue} />
      
      {/* Header with back button */}
      <View style={[styles.header, { backgroundColor: PoliceColors.darkBlue }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={PoliceColors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={styles.emptySpace} />
      </View>
      
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Basic Information Card */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            <Divider style={styles.divider} />
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>First Name*</Text>
              <TextInput
                style={styles.textInput}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Enter first name"
                placeholderTextColor={PoliceColors.textLight}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Last Name</Text>
              <TextInput
                style={styles.textInput}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Enter last name"
                placeholderTextColor={PoliceColors.textLight}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Badge Number</Text>
              <TextInput
                style={styles.textInput}
                value={badgeNumber}
                onChangeText={setBadgeNumber}
                placeholder="Enter badge number"
                placeholderTextColor={PoliceColors.textLight}
              />
            </View>
          </Card.Content>
        </Card>
        
        {/* Professional Details Card */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Professional Details</Text>
            <Divider style={styles.divider} />
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Role</Text>
              <TextInput
                style={styles.textInput}
                value={role}
                onChangeText={setRole}
                placeholder="Enter role (e.g., Detective, Officer)"
                placeholderTextColor={PoliceColors.textLight}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Department</Text>
              <TextInput
                style={styles.textInput}
                value={department}
                onChangeText={setDepartment}
                placeholder="Enter department"
                placeholderTextColor={PoliceColors.textLight}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Status</Text>
              <View style={styles.statusContainer}>
                <TouchableOpacity
                  style={[
                    styles.statusOption,
                    status === 'active' && { backgroundColor: PoliceColors.lightBlue }
                  ]}
                  onPress={() => setStatus('active')}
                >
                  <Text style={[
                    styles.statusText,
                    status === 'active' && { color: PoliceColors.primary, fontWeight: 'bold' }
                  ]}>Active</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.statusOption,
                    status === 'inactive' && { backgroundColor: PoliceColors.lightBlue }
                  ]}
                  onPress={() => setStatus('inactive')}
                >
                  <Text style={[
                    styles.statusText,
                    status === 'inactive' && { color: PoliceColors.primary, fontWeight: 'bold' }
                  ]}>Inactive</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.statusOption,
                    status === 'on leave' && { backgroundColor: PoliceColors.lightBlue }
                  ]}
                  onPress={() => setStatus('on leave')}
                >
                  <Text style={[
                    styles.statusText,
                    status === 'on leave' && { color: PoliceColors.primary, fontWeight: 'bold' }
                  ]}>On Leave</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card.Content>
        </Card>
        
        {/* Contact Information Card */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            <Divider style={styles.divider} />
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email*</Text>
              <TextInput
                style={styles.textInput}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter email"
                placeholderTextColor={PoliceColors.textLight}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.textInput}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter phone number"
                placeholderTextColor={PoliceColors.textLight}
                keyboardType="phone-pad"
              />
            </View>
          </Card.Content>
        </Card>
        
        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: PoliceColors.accent }]}
            onPress={handleCancel}
          >
            <Ionicons name="close-outline" size={20} color={PoliceColors.white} />
            <Text style={styles.actionButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.actionButton, 
              { backgroundColor: PoliceColors.primary },
              saving && { opacity: 0.7 }
            ]}
            onPress={handleSaveProfile}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={PoliceColors.white} />
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color={PoliceColors.white} />
                <Text style={styles.actionButtonText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PoliceColors.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: PoliceColors.text,
  },
  errorText: {
    fontSize: 18,
    color: PoliceColors.accent,
    marginTop: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  errorButton: {
    backgroundColor: PoliceColors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 20,
  },
  errorButtonText: {
    color: PoliceColors.white,
    fontWeight: 'bold',
  },
  header: {
    height: Platform.OS === 'ios' ? 100 : 80,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PoliceColors.white,
  },
  emptySpace: {
    width: 40,
  },
  scrollContainer: {
    flex: 1,
    padding: 20,
  },
  sectionCard: {
    borderRadius: 15,
    elevation: 2,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PoliceColors.text,
    marginBottom: 10,
  },
  divider: {
    backgroundColor: PoliceColors.border,
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    color: PoliceColors.textLight,
    marginBottom: 5,
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: PoliceColors.white,
    borderWidth: 1,
    borderColor: PoliceColors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: PoliceColors.text,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusOption: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: PoliceColors.border,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statusText: {
    color: PoliceColors.textLight,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    flex: 0.48,
  },
  actionButtonText: {
    color: PoliceColors.white,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});