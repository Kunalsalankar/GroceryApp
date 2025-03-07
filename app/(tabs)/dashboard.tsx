import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { Card, Avatar, Badge } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, Database } from "firebase/database";

// Define interfaces for our data types
interface Module {
  id: string;
  title: string;
  icon: string;
  description: string;
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
  shadowColor: 'rgba(0, 0, 0, 0.1)', // Shadow color
};

// Define the module routes explicitly
const moduleRoutes: Record<string, string> = {
  assign: '/assign',
  handover: '/handover',
  maintenance: '/maintenance',
  inventory: '/inventory',
};

export default function DashboardScreen(): React.ReactElement {
  const router = useRouter();
  const [modules, setModules] = useState<Module[]>([]);
  const [database, setDatabase] = useState<Database | null>(null);

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
    // Define the main modules available in the dashboard
    const defaultModules: Module[] = [
      {
        id: 'assign',
        title: 'Assign Module',
        icon: 'account-arrow-right',
        description: 'Assign hardware assets to police officers',
      },
      {
        id: 'handover',
        title: 'Handover Module',
        icon: 'account-switch',
        description: 'Transfer assets between officers',
      },
      {
        id: 'maintenance',
        title: 'Maintenance Module',
        icon: 'tools',
        description: 'Schedule and track maintenance activities',
      },
      {
        id: 'inventory',
        title: 'Stock Inventory',
        icon: 'cube',
        description: 'Monitor and manage hardware inventory',
      },
    ];

    setModules(defaultModules);
  };

  // Fetch data from Firebase
  const fetchFirebaseData = (db: Database): void => {
    try {
      // Fetch modules data
      const modulesRef = ref(db, 'modules');
      onValue(modulesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) setModules(data);
      });
    } catch (error) {
      console.error("Error fetching data from Firebase:", error);
    }
  };

  // Helper function to get the appropriate icon for module
  const getModuleIcon = (iconName: string): React.ReactNode => {
    switch (iconName) {
      case 'account-arrow-right':
        return <MaterialCommunityIcons name="account-arrow-right" size={32} color={PoliceColors.primary} />;
      case 'account-switch':
        return <MaterialCommunityIcons name="account-switch" size={32} color={PoliceColors.primary} />;
      case 'tools':
        return <FontAwesome5 name="tools" size={28} color={PoliceColors.primary} />;
      case 'cube':
        return <Ionicons name="cube" size={30} color={PoliceColors.primary} />;
      default:
        return <Ionicons name="grid" size={30} color={PoliceColors.primary} />;
    }
  };
  
  // Handles navigation to module screens
  const navigateToModule = (moduleId: string): void => {
    const route = moduleRoutes[moduleId] || '/(tabs)';
    router.push(route as any);
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
              <Text style={styles.appSubtitle}>Police Inventory Management</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.profileButton} 
            onPress={() => router.push('/(tabs)/profile' as any)}
          >
            <Avatar.Text size={40} label="IS" style={styles.avatar} color={PoliceColors.white} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Welcome section */}
       

        {/* Modules Grid Section */}
        <Text style={styles.sectionTitle}>
          <Ionicons name="grid" size={18} color={PoliceColors.primary} style={styles.sectionIcon} />
          System Modules
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
  }
});