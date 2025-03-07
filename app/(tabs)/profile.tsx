import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, StatusBar, Platform, ActivityIndicator, Alert } from 'react-native';
import { Card, Avatar, Divider } from 'react-native-paper';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { collection, doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth'; // Correct import for signOut
import { auth, db } from './firebaseConfig'; // Adjust the path as needed
import { useCallback } from 'react';

// Define types for better TypeScript support
interface Officer {
  id: string;
  firstName?: string;
  lastName?: string;
  badgeNumber?: string;
  role?: string;
  department?: string;
  phone?: string;
  email?: string;
  createdAt?: any; // Using any for now, ideally use a more specific type
  lastActive?: any; // Using any for now, ideally use a more specific type
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

// Format date from timestamp
const formatDate = (timestamp: any): string => {
  if (!timestamp) return 'N/A';
  
  const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Format time for "Last Active"
const formatLastActive = (timestamp: any): string => {
  if (!timestamp) return 'N/A';
  
  const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
  const today = new Date();
  
  if (date.toDateString() === today.toDateString()) {
    return `Today at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  } else {
    return `${date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  }
};

// Get initials from name
const getInitials = (name: string): string => {
  if (!name) return 'NA';
  
  return name
    .split(' ')
    .map((part: string) => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export default function ProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<Officer | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Get user ID from params or auth
  const userId = params.id as string || (auth.currentUser ? auth.currentUser.uid : null);
  
  // Function to fetch user data - this can be called multiple times
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
        setUserData({
          id: officerDoc.id,
          ...officerDoc.data() as Omit<Officer, 'id'>
        });
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
  
  // Use useFocusEffect instead of router.addListener
  useFocusEffect(
    useCallback(() => {
      fetchUserData();
      return () => {};
    }, [userId])
  );
  
  useEffect(() => {
    fetchUserData();
  }, [userId]);
  
  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.replace('/login');
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };
  
  // Handle edit profile
  const handleEditProfile = () => {
    if (userData) {
      router.push({
        pathname: "/(tabs)/editprofile" as any, // Fix the path and cast as any
        params: { id: userData.id }
      });
    }
  };
  
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={PoliceColors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
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
  
  if (!userData) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>No data available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={PoliceColors.darkBlue} />
      
      {/* Header with back button */}
      <View style={[styles.header, { backgroundColor: PoliceColors.darkBlue }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={PoliceColors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Officer Profile</Text>
        <View style={styles.emptySpace} />
      </View>
      
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <Card.Content style={styles.profileCardContent}>
            <View style={styles.avatarContainer}>
              <Avatar.Text 
                size={80} 
                label={getInitials(userData.firstName && userData.lastName ? `${userData.firstName} ${userData.lastName}` : userData.firstName || '')} 
                style={styles.avatar} 
                color={PoliceColors.white}
                labelStyle={styles.avatarLabel}
              />
              <View style={styles.badgeIconContainer}>
                <FontAwesome5 name="shield-alt" size={18} color={PoliceColors.gold} />
              </View>
            </View>
            
            <Text style={styles.officerName}>
              {userData.firstName && userData.lastName 
                ? `${userData.firstName} ${userData.lastName}`
                : userData.firstName || 'Officer'}
            </Text>
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{userData.badgeNumber || 'No Badge Number'}</Text>
            </View>
            
            <View style={styles.infoContainer}>
              <View style={styles.infoItem}>
                <MaterialCommunityIcons name="police-badge" size={20} color={PoliceColors.primary} />
                <Text style={styles.infoText}>{userData.role || 'Officer'}</Text>
              </View>
              <View style={styles.infoItem}>
                <MaterialCommunityIcons name="account-group" size={20} color={PoliceColors.primary} />
                <Text style={styles.infoText}>{userData.department || 'General Department'}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
        
        {/* Contact Information */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            <Divider style={styles.divider} />
            
            <View style={styles.detailItem}>
              <Ionicons name="call-outline" size={20} color={PoliceColors.primary} style={styles.detailIcon} />
              <Text style={styles.detailLabel}>Phone:</Text>
              <Text style={styles.detailValue}>{userData.phone || 'Not provided'}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Ionicons name="mail-outline" size={20} color={PoliceColors.primary} style={styles.detailIcon} />
              <Text style={styles.detailLabel}>Email:</Text>
              <Text style={styles.detailValue}>{userData.email || 'Not provided'}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={20} color={PoliceColors.primary} style={styles.detailIcon} />
              <Text style={styles.detailLabel}>Joined:</Text>
              <Text style={styles.detailValue}>{userData.createdAt ? formatDate(userData.createdAt) : 'Not available'}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={20} color={PoliceColors.primary} style={styles.detailIcon} />
              <Text style={styles.detailLabel}>Last Active:</Text>
              <Text style={styles.detailValue}>{userData.lastActive ? formatLastActive(userData.lastActive) : 'Not available'}</Text>
            </View>
          </Card.Content>
        </Card>
        
        {/* Status Section */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Status Information</Text>
            <Divider style={styles.divider} />
            
            <View style={styles.detailItem}>
              <Ionicons name="shield-checkmark-outline" size={20} color={PoliceColors.primary} style={styles.detailIcon} />
              <Text style={styles.detailLabel}>Status:</Text>
              <View style={[
                styles.statusBadge, 
                { backgroundColor: 
                  userData.status === 'active' ? PoliceColors.success : 
                  userData.status === 'inactive' ? PoliceColors.accent :
                  PoliceColors.warning }
              ]}>
                <Text style={styles.statusText}>{userData.status ? userData.status.charAt(0).toUpperCase() + userData.status.slice(1) : 'Unknown'}</Text>
              </View>
            </View>
            
            <View style={styles.detailItem}>
              <Ionicons name="finger-print-outline" size={20} color={PoliceColors.primary} style={styles.detailIcon} />
              <Text style={styles.detailLabel}>ID:</Text>
              <Text style={styles.detailValue}>{userData.id || 'Not available'}</Text>
            </View>
          </Card.Content>
        </Card>
        
        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: PoliceColors.primary }]}
            onPress={handleEditProfile}
          >
            <Ionicons name="create-outline" size={20} color={PoliceColors.white} />
            <Text style={styles.actionButtonText}>Edit Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: PoliceColors.accent }]}
            onPress={handleSignOut}
          >
            <Ionicons name="log-out-outline" size={20} color={PoliceColors.white} />
            <Text style={styles.actionButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
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
  profileCard: {
    borderRadius: 15,
    elevation: 4,
    marginBottom: 20,
  },
  profileCardContent: {
    alignItems: 'center',
    padding: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    backgroundColor: PoliceColors.primary,
  },
  avatarLabel: {
    fontSize: 30,
  },
  badgeIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: PoliceColors.white,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: PoliceColors.lightGray,
  },
  officerName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: PoliceColors.text,
    marginBottom: 8,
  },
  badgeContainer: {
    backgroundColor: PoliceColors.lightBlue,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 15,
  },
  badgeText: {
    color: PoliceColors.primary,
    fontWeight: 'bold',
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
    marginVertical: 5,
  },
  infoText: {
    marginLeft: 5,
    color: PoliceColors.text,
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
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailIcon: {
    marginRight: 10,
    width: 22,
  },
  detailLabel: {
    width: 70,
    color: PoliceColors.textLight,
    fontWeight: '500',
  },
  detailValue: {
    flex: 1,
    color: PoliceColors.text,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: PoliceColors.white,
    fontWeight: '600',
    fontSize: 14,
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