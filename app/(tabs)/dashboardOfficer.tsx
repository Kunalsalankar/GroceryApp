import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, StatusBar, Platform, Alert } from 'react-native';
import { Card, Avatar, Badge, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, Database } from "firebase/database";

// Define interfaces for our data types
interface Module {
  id: string;
  title: string;
  icon: string;
  description: string;
}

interface Asset {
  id: string;
  name: string;
  category: string;
  assignedDate: string;
  status: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
}

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBZYvwt5dOL2jr7C7E0T7kHmy1wrVpvsCQ",
  authDomain: "omkar-bcfd4.firebaseapp.com",
  projectId: "omkar-bcfd4",
  storageBucket: "omkar-bcfd4.firebasestorage.app",
  messagingSenderId: "865551458358",
  appId: "1:865551458358:web:28e626110e592a7582f897",
  measurementId: "G-5SQD2GPRNB"
};

// Color scheme for police-themed app
const PoliceColors = {
  primary: '#003366', // Dark blue
  secondary: '#1a3c61', // Slightly lighter blue
  accent: '#bf2c37', // Police red
  background: '#f5f7fa', // Light background
  cardBackground: '#ffffff', // White for cards
  text: '#333333', // Near black for text
  textLight: '#6c757d', // Gray for secondary text
  border: '#d1d9e6', // Light border color
  lightBlue: '#e6f0ff', // Light blue for backgrounds
  gold: '#ffd700', // Gold for badge elements
  white: '#ffffff', // White color
  darkBlue: '#00264d', // Darker blue for gradients
  success: '#28a745', // Green for success indicators
  warning: '#ffc107', // Yellow for warnings
  danger: '#dc3545', // Red for critical alerts
  info: '#17a2b8', // Cyan for information
  shadowColor: 'rgba(0, 0, 0, 0.1)', // Shadow color
};

// Define the module routes for officers
const moduleRoutes: Record<string, string> = {
  myAssets: '/myAssets',
  requestMaintenance: '/requestMaintenance',
  reportIssue: '/reportIssue',
  assetHistory: '/assetHistory',
};

export default function OfficerDashboardScreen(): React.ReactElement {
  const router = useRouter();
  const [modules, setModules] = useState<Module[]>([]);
  const [assignedAssets, setAssignedAssets] = useState<Asset[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [database, setDatabase] = useState<Database | null>(null);
  const [userName, setUserName] = useState<string>("Officer Singh"); // Mock user name
  const [userRank, setUserRank] = useState<string>("Police Constable"); // Mock user rank

  // Initialize Firebase and fetch data on component mount
  useEffect(() => {
    try {
      const app = initializeApp(firebaseConfig);
      const db = getDatabase(app);
      
      setDatabase(db);
      
      // Load default data first
      setDefaultData();
      
      // Then try to fetch from Firebase
      fetchFirebaseData(db);
    } catch (error: any) {
      if (error.code !== 'app/duplicate-app') {
        console.error("Firebase initialization error:", error);
      } else {
        const app = initializeApp(firebaseConfig);
        const db = getDatabase(app);
        setDatabase(db);
        
        setDefaultData();
        fetchFirebaseData(db);
      }
    }
  }, []);

  // Set default data
  const setDefaultData = (): void => {
    // Define the main modules available in the officer dashboard
    const defaultModules: Module[] = [
      {
        id: 'myAssets',
        title: 'My Assets',
        icon: 'device-laptop',
        description: 'View and manage your assigned hardware',
      },
      {
        id: 'requestMaintenance',
        title: 'Request Maintenance',
        icon: 'tools',
        description: 'Request maintenance for your equipment',
      },
      {
        id: 'reportIssue',
        title: 'Report Issue',
        icon: 'alert-circle',
        description: 'Report issues with assigned hardware',
      },
      {
        id: 'assetHistory',
        title: 'Asset History',
        icon: 'history',
        description: 'View history of your assigned assets',
      },
    ];

    // Mock assigned assets for the officer
    const defaultAssets: Asset[] = [
      {
        id: 'DEV-1234',
        name: 'HP Laptop',
        category: 'Computer',
        assignedDate: '2024-01-15',
        status: 'Active',
      },
      {
        id: 'DEV-5678',
        name: 'Police Radio',
        category: 'Communication',
        assignedDate: '2023-11-20',
        status: 'Maintenance Due',
      },
      {
        id: 'DEV-9012',
        name: 'Body Camera',
        category: 'Equipment',
        assignedDate: '2024-02-10',
        status: 'Active',
      },
    ];

    // Mock notifications for the officer
    const defaultNotifications: Notification[] = [
      {
        id: '1',
        title: 'Maintenance Reminder',
        message: 'Your Police Radio is due for maintenance in 3 days',
        date: '2024-03-05',
        read: false,
      },
      {
        id: '2',
        title: 'New Asset Assignment',
        message: 'A new Body Camera has been assigned to you',
        date: '2024-02-10',
        read: true,
      },
    ];

    setModules(defaultModules);
    setAssignedAssets(defaultAssets);
    setNotifications(defaultNotifications);
  };

  // Fetch data from Firebase
  const fetchFirebaseData = (db: Database): void => {
    try {
      // Fetch modules data
      const modulesRef = ref(db, 'officerModules');
      onValue(modulesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) setModules(data);
      });

      // Fetch assigned assets
      const assetsRef = ref(db, 'officerAssets/officer123'); // Using a mock officer ID
      onValue(assetsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) setAssignedAssets(data);
      });

      // Fetch notifications
      const notificationsRef = ref(db, 'notifications/officer123'); // Using a mock officer ID
      onValue(notificationsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) setNotifications(data);
      });
    } catch (error) {
      console.error("Error fetching data from Firebase:", error);
    }
  };

  // Helper function to get the appropriate icon for module
  const getModuleIcon = (iconName: string): React.ReactNode => {
    switch (iconName) {
      case 'device-laptop':
        return <MaterialCommunityIcons name="laptop" size={32} color={PoliceColors.primary} />;
      case 'tools':
        return <FontAwesome5 name="tools" size={28} color={PoliceColors.primary} />;
      case 'alert-circle':
        return <MaterialIcons name="error" size={30} color={PoliceColors.primary} />;
      case 'history':
        return <MaterialIcons name="history" size={30} color={PoliceColors.primary} />;
      default:
        return <Ionicons name="grid" size={30} color={PoliceColors.primary} />;
    }
  };
  
  // Get status color based on asset status
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Active':
        return PoliceColors.success;
      case 'Maintenance Due':
        return PoliceColors.warning;
      case 'Under Repair':
        return PoliceColors.accent;
      case 'Out of Service':
        return PoliceColors.danger;
      default:
        return PoliceColors.info;
    }
  };

  // Count unread notifications
  const unreadNotificationsCount = notifications.filter(notification => !notification.read).length;
  
  // Handles navigation to module screens
  const navigateToModule = (moduleId: string): void => {
    const route = moduleRoutes[moduleId] || '/(tabs)';
    router.push(route as any);
  };

  // Handle viewing all notifications
  const viewAllNotifications = (): void => {
    router.push('/notifications' as any);
  };

  // Handle requesting maintenance for an asset
  const requestMaintenance = (assetId: string): void => {
    Alert.alert(
      "Request Maintenance",
      `Are you sure you want to request maintenance for asset ${assetId}?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Confirm", 
          onPress: () => {
            // Handle maintenance request submission
            Alert.alert("Success", "Maintenance request submitted successfully");
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={PoliceColors.darkBlue} />
      
      {/* Header with Police banner */}
      <View style={[styles.headerBanner, { backgroundColor: PoliceColors.darkBlue }]}>
        <View style={styles.headerContainer}>
          <View style={styles.headerTitleContainer}>
            <View style={styles.badgeContainer}>
              <FontAwesome5 name="shield-alt" size={18} color={PoliceColors.gold} style={styles.badgeIcon} />
            </View>
            <View>
              <Text style={styles.appTitle}>EQUIPTRACK</Text>
              <Text style={styles.appSubtitle}>Police Inventory System</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.profileButton} 
            onPress={() => router.push('/(tabs)/profile' as any)}
          >
            <Avatar.Text size={40} label="OS" style={styles.avatar} color={PoliceColors.white} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Welcome section */}
        <View style={styles.welcomeSection}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.userRank}>{userRank}</Text>
          </View>
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={viewAllNotifications}
          >
            <Ionicons name="notifications" size={24} color={PoliceColors.textLight} />
            {unreadNotificationsCount > 0 && (
              <Badge style={styles.badge}>{unreadNotificationsCount}</Badge>
            )}
          </TouchableOpacity>
        </View>

        {/* Recent Notifications */}
        {unreadNotificationsCount > 0 && (
          <>
            <Text style={styles.sectionTitle}>
              <Ionicons name="notifications" size={18} color={PoliceColors.primary} style={styles.sectionIcon} />
              Recent Notifications
            </Text>
            <View style={styles.notificationsContainer}>
              {notifications
                .filter(notification => !notification.read)
                .slice(0, 2)
                .map((notification) => (
                  <Card key={notification.id} style={styles.notificationCard}>
                    <Card.Content>
                      <View style={styles.notificationHeader}>
                        <Text style={styles.notificationTitle}>{notification.title}</Text>
                        <Text style={styles.notificationDate}>{notification.date}</Text>
                      </View>
                      <Text style={styles.notificationMessage}>{notification.message}</Text>
                    </Card.Content>
                  </Card>
                ))}
              {unreadNotificationsCount > 2 && (
                <TouchableOpacity onPress={viewAllNotifications} style={styles.viewAllButton}>
                  <Text style={styles.viewAllText}>View all notifications</Text>
                  <Ionicons name="chevron-forward" size={16} color={PoliceColors.primary} />
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

        {/* My Assets Section */}
        <Text style={styles.sectionTitle}>
          <MaterialCommunityIcons name="laptop" size={18} color={PoliceColors.primary} style={styles.sectionIcon} />
          My Assigned Assets
        </Text>
        <View style={styles.assetsContainer}>
          {assignedAssets.map((asset) => (
            <Card key={asset.id} style={styles.assetCard}>
              <Card.Content>
                <View style={styles.assetHeader}>
                  <Text style={styles.assetId}>{asset.id}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(asset.status) }]}>
                    <Text style={styles.statusText}>{asset.status}</Text>
                  </View>
                </View>
                <Text style={styles.assetName}>{asset.name}</Text>
                <Text style={styles.assetCategory}>{asset.category}</Text>
                <Text style={styles.assetDate}>Assigned: {asset.assignedDate}</Text>
                
                {asset.status === 'Maintenance Due' && (
                  <Button 
                    mode="contained" 
                    style={styles.maintenanceButton}
                    onPress={() => requestMaintenance(asset.id)}
                  >
                    Request Maintenance
                  </Button>
                )}
              </Card.Content>
            </Card>
          ))}
        </View>

        {/* Modules Grid Section */}
        <Text style={styles.sectionTitle}>
          <Ionicons name="grid" size={18} color={PoliceColors.primary} style={styles.sectionIcon} />
          Quick Actions
        </Text>
        <View style={styles.moduleGrid}>
          {modules.map((module) => (
            <TouchableOpacity 
              key={module.id} 
              style={styles.moduleItem}
              onPress={() => navigateToModule(module.id)}
            >
              <Card style={styles.moduleCard}>
                <Card.Content style={styles.moduleCardContent}>
                  <View style={styles.moduleIconContainer}>{getModuleIcon(module.icon)}</View>
                  <Text style={styles.moduleTitle}>{module.title}</Text>
                  <Text style={styles.moduleDescription}>{module.description}</Text>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PoliceColors.background,
  },
  scrollContainer: {
    flex: 1,
  },
  
  // Header Banner styles
  headerBanner: {
    height: 120,
    backgroundColor: PoliceColors.primary,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 45 : 25,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: PoliceColors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  badgeIcon: {
    shadowColor: PoliceColors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  appSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  profileButton: {
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  avatar: {
    backgroundColor: PoliceColors.secondary,
  },
  
  // Welcome section styles
  welcomeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: PoliceColors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: PoliceColors.border,
  },
  welcomeText: {
    fontSize: 14,
    color: PoliceColors.textLight,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PoliceColors.text,
  },
  userRank: {
    fontSize: 14,
    color: PoliceColors.textLight,
    marginTop: 2,
  },
  notificationButton: {
    position: 'relative',
    padding: 5,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: PoliceColors.accent,
  },

  // Section title styles
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 20,
    marginTop: 25,
    marginBottom: 15,
    color: PoliceColors.text,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    marginRight: 8,
  },

  // Modules grid styles
  moduleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 30,
  },
  moduleItem: {
    width: '48%',
    marginBottom: 15,
  },
  moduleCard: {
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 3,
  },
  moduleCardContent: {
    padding: 15,
    alignItems: 'center',
  },
  moduleIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    height: 45,
  },
  moduleTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: PoliceColors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  moduleDescription: {
    fontSize: 12,
    color: PoliceColors.textLight,
    textAlign: 'center',
  },

  // Notification styles
  notificationsContainer: {
    marginHorizontal: 20,
    marginBottom: 10,
  },
  notificationCard: {
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: PoliceColors.accent,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: PoliceColors.text,
  },
  notificationDate: {
    fontSize: 12,
    color: PoliceColors.textLight,
  },
  notificationMessage: {
    fontSize: 13,
    color: PoliceColors.text,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  viewAllText: {
    color: PoliceColors.primary,
    fontWeight: '600',
    marginRight: 5,
  },

  // Assets styles
  assetsContainer: {
    marginHorizontal: 20,
  },
  assetCard: {
    marginBottom: 10,
    borderRadius: 10,
  },
  assetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  assetId: {
    fontSize: 12,
    fontWeight: '600',
    color: PoliceColors.textLight,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: PoliceColors.white,
    fontWeight: '600',
  },
  assetName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: PoliceColors.text,
    marginBottom: 2,
  },
  assetCategory: {
    fontSize: 14,
    color: PoliceColors.text,
    marginBottom: 2,
  },
  assetDate: {
    fontSize: 12,
    color: PoliceColors.textLight,
    marginBottom: 10,
  },
  maintenanceButton: {
    backgroundColor: PoliceColors.primary,
    marginTop: 5,
  },
});