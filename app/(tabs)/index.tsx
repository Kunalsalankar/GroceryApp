import React from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, StatusBar, Dimensions, TouchableOpacity, Platform } from 'react-native';
import { Button, Card, Title, Paragraph, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons, Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

// Professional police-themed color scheme
const PoliceColors = {
  primary: '#1a3a5f',         // Navy blue
  secondary: '#2c3e50',       // Dark blue-gray
  accent: '#e74c3c',          // Emergency red
  accent2: '#3498db',         // Badge blue
  background: '#f5f7fa',      // Light gray
  cardBackground: '#ffffff',  // White
  text: '#2c3e50',            // Dark blue-gray
  textLight: '#7f8c8d',       // Medium gray
  textDark: '#1a2530',        // Near black
  white: '#ffffff',           // White
  shadow: 'rgba(0,0,0,0.15)', // Shadow color
  gold: '#f1c40f',            // Badge gold
  silver: '#bdc3c7',          // Badge silver
  // Gradients
  primaryGradient1: '#1a3a5f', // Dark navy blue
  primaryGradient2: '#2c5282', // Medium navy blue
  secondaryGradient1: '#2c3e50', // Dark blue-gray
  secondaryGradient2: '#34495e', // Medium blue-gray
  accentGradient1: '#c0392b',  // Dark red
  accentGradient2: '#e74c3c',  // Medium red
};

export default function Index() {
  const router = useRouter();
  const { width } = Dimensions.get('window');

  const handleHeadOfficerSignUp = (): void => {
    router.push('/head-officer');
  };

  const handleOfficerSignUp = (): void => {
    router.push('/officer');
  };

  

  
  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={[PoliceColors.primaryGradient1, PoliceColors.primaryGradient2]}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo and Title Section */}
          <View style={styles.logoContainer}>
            <View style={styles.logoWrapper}>
              <LinearGradient
                colors={[PoliceColors.white, PoliceColors.white]}
                style={styles.logoInner}
              >
                <MaterialCommunityIcons 
                  name="police-badge" 
                  size={80} 
                  color={PoliceColors.primary}
                />
              </LinearGradient>
            </View>
            
            <Text style={styles.title}>EquipTrack</Text>
            <Text style={styles.subtitle}>
              Smart Hardware Inventory Management for Law Enforcement
            </Text>
          </View>

          {/* Features Section */}
          <BlurView intensity={15} tint="light" style={styles.blurContainer}>
            <View style={styles.featureContainer}>
              <Text style={styles.featureTitle}>Police Inventory Features</Text>
              <View style={styles.featureList}>
                <View style={styles.featureItem}>
                  <LinearGradient
                    colors={[PoliceColors.primaryGradient1, PoliceColors.primaryGradient2]}
                    style={styles.featureIconBg}
                  >
                    <FontAwesome5 name="map-marker-alt" size={16} color={PoliceColors.white} />
                  </LinearGradient>
                  <Text style={styles.featureText}>Real-time equipment tracking</Text>
                </View>
                <View style={styles.featureItem}>
                  <LinearGradient
                    colors={[PoliceColors.primaryGradient1, PoliceColors.primaryGradient2]}
                    style={styles.featureIconBg}
                  >
                    <MaterialIcons name="qr-code-scanner" size={16} color={PoliceColors.white} />
                  </LinearGradient>
                  <Text style={styles.featureText}>QR code scanning for quick check-in/out</Text>
                </View>
                <View style={styles.featureItem}>
                  <LinearGradient
                    colors={[PoliceColors.primaryGradient1, PoliceColors.primaryGradient2]}
                    style={styles.featureIconBg}
                  >
                    <FontAwesome5 name="tools" size={16} color={PoliceColors.white} />
                  </LinearGradient>
                  <Text style={styles.featureText}>Maintenance alerts and scheduling</Text>
                </View>
                <View style={styles.featureItem}>
                  <LinearGradient
                    colors={[PoliceColors.primaryGradient1, PoliceColors.primaryGradient2]}
                    style={styles.featureIconBg}
                  >
                    <FontAwesome5 name="exchange-alt" size={16} color={PoliceColors.white} />
                  </LinearGradient>
                  <Text style={styles.featureText}>Seamless equipment transfer</Text>
                </View>
                <View style={styles.featureItem}>
                  <LinearGradient
                    colors={[PoliceColors.primaryGradient1, PoliceColors.primaryGradient2]}
                    style={styles.featureIconBg}
                  >
                    <FontAwesome5 name="chart-bar" size={16} color={PoliceColors.white} />
                  </LinearGradient>
                  <Text style={styles.featureText}>Advanced analytics dashboard</Text>
                </View>
                <View style={styles.featureItem}>
                  <LinearGradient
                    colors={[PoliceColors.primaryGradient1, PoliceColors.primaryGradient2]}
                    style={styles.featureIconBg}
                  >
                    <FontAwesome5 name="user-shield" size={16} color={PoliceColors.white} />
                  </LinearGradient>
                  <Text style={styles.featureText}>Secure role-based access controls</Text>
                </View>
              </View>
            </View>
          </BlurView>

          {/* Sign Up Cards Section */}
          <View style={styles.cardsContainer}>
            <Card style={styles.signupCard}>
              <LinearGradient
                colors={[PoliceColors.primaryGradient1, PoliceColors.primaryGradient2]}
                style={styles.cardGradient}
              />
              <Card.Content style={styles.cardContent}>
                <View style={styles.cardIconContainer}>
                  <MaterialCommunityIcons name="shield-account" size={60} color={PoliceColors.white} />
                </View>
                <Title style={styles.cardTitle}>Department Chief</Title>
                <Paragraph style={styles.cardDescription}>
                  Full administrative access to manage department equipment, assign resources, and generate comprehensive reports.
                </Paragraph>
              </Card.Content>
              <Card.Actions style={styles.cardActions}>
                <TouchableOpacity onPress={handleHeadOfficerSignUp} style={styles.gradientButtonContainer}>
                  <LinearGradient
                    colors={[PoliceColors.accentGradient1, PoliceColors.accentGradient2]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientButton}
                  >
                    <Text style={styles.buttonText}>Department Chief Sign Up</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Card.Actions>
            </Card>

            <Card style={styles.signupCard}>
              <LinearGradient
                colors={[PoliceColors.secondaryGradient1, PoliceColors.secondaryGradient2]}
                style={styles.cardGradient}
              />
              <Card.Content style={styles.cardContent}>
                <View style={styles.cardIconContainer}>
                  <MaterialCommunityIcons name="account-tie" size={60} color={PoliceColors.white} />
                </View>
                <Title style={styles.cardTitle}>Field Officer</Title>
                <Paragraph style={styles.cardDescription}>
                  Streamlined access to check out equipment, report status, and submit maintenance requests in real-time.
                </Paragraph>
              </Card.Content>
              <Card.Actions style={styles.cardActions}>
                <TouchableOpacity onPress={handleOfficerSignUp} style={styles.gradientButtonContainer}>
                  <LinearGradient
                    colors={[PoliceColors.accentGradient2, PoliceColors.accentGradient1]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientButton}
                  >
                    <Text style={styles.buttonText}>Field Officer Sign Up</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Card.Actions>
            </Card>
          </View>
        
          
          {/* Footer Section */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>© 2025 EquipTrack - Official Police Department Asset Management</Text>
            <Text style={styles.tagline}>Serving Those Who Serve</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// Enhanced police-themed styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PoliceColors.background,
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 350,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 20,
    paddingTop: 60,
    flexGrow: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 50,
  },
  logoWrapper: {
    borderRadius: 75,
    padding: 5,
    marginBottom: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  logoInner: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 70,
  },
  title: {
    fontSize: 38,
    fontWeight: 'bold',
    color: PoliceColors.white,
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 16,
    color: PoliceColors.white,
    textAlign: 'center',
    paddingHorizontal: 30,
    lineHeight: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  blurContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 30,
    shadowColor: PoliceColors.shadow,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  featureContainer: {
    padding: 25,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  featureTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 25,
    color: PoliceColors.primary,
    textAlign: 'center',
  },
  featureList: {
    marginLeft: 5,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  featureIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  featureText: {
    fontSize: 16,
    color: PoliceColors.text,
    lineHeight: 24,
    fontWeight: '500',
    flex: 1,
  },
  cardsContainer: {
    marginBottom: 40,
    gap: 25,
  },
  signupCard: {
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 8,
    backgroundColor: 'transparent',
    shadowColor: PoliceColors.shadow,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  cardGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  cardContent: {
    backgroundColor: 'transparent',
    paddingVertical: 25,
  },
  cardIconContainer: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: PoliceColors.white,
    marginBottom: 15,
  },
  cardDescription: {
    fontSize: 15,
    textAlign: 'center',
    color: PoliceColors.white,
    lineHeight: 22,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  cardActions: {
    justifyContent: 'center',
    paddingBottom: 25,
    backgroundColor: 'transparent',
  },
  gradientButtonContainer: {
    width: '85%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradientButton: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: PoliceColors.white,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  dividerTextContainer: {
    backgroundColor: PoliceColors.background,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  dividerText: {
    color: PoliceColors.textLight,
    fontWeight: 'bold',
    fontSize: 12,
  },
  buttonContainer: {
    marginBottom: 50,
    alignItems: 'center',
  },
  loginButtonContainer: {
    width: '85%',
    marginBottom: 15,
  },
  loginButton: {
    borderColor: PoliceColors.primary,
    borderWidth: 2,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  loginButtonText: {
    color: PoliceColors.primary,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  poweredByText: {
    color: PoliceColors.textLight,
    fontSize: 13,
    marginTop: 10,
    fontStyle: 'italic',
  },
  footer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  footerText: {
    color: PoliceColors.textLight,
    fontSize: 12,
    marginBottom: 5,
  },
  tagline: {
    color: PoliceColors.primary,
    fontSize: 14,
    fontWeight: '500',
    fontStyle: 'italic',
  },
});