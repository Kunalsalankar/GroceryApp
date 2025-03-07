import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, StatusBar, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Button, TextInput, HelperText, Appbar, Checkbox, Dialog, Portal, Provider as PaperProvider, List, Searchbar, Card, Avatar, Chip, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, where, doc, getDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import DropDown from 'react-native-paper-dropdown';

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

// Types for our data
interface Equipment {
  id: string;
  name: string;
  type: string;
  serialNumber: string;
  status: string;
  condition: string;
  lastChecked: Timestamp;
  assignedTo?: string;
  assignedToName?: string;
  departmentId: string;
}

interface Officer {
  id: string;
  uid: string;
  firstName: string;
  lastName: string;
  badgeNumber: string;
  departmentId: string;
  role: string;
  email: string;
}

export default function Handover() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingOfficers, setLoadingOfficers] = useState(false);
  const [loadingEquipment, setLoadingEquipment] = useState(false);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOfficer, setSelectedOfficer] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [handoverNotes, setHandoverNotes] = useState('');
  const [showOfficerDropDown, setShowOfficerDropDown] = useState(false);
  const [officerDropdownList, setOfficerDropdownList] = useState<{label: string, value: string}[]>([]);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState<{id: string, name: string} | null>(null);
  const [departmentId, setDepartmentId] = useState('');
  
  // Error states
  const [officerError, setOfficerError] = useState('');
  const [equipmentError, setEquipmentError] = useState('');
  const [notesError, setNotesError] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          Alert.alert('Error', 'Not logged in');
          router.replace('/');
          return;
        }

        // Get current user data
        const officersRef = collection(db, 'officers');
        const q = query(officersRef, where('uid', '==', user.uid));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          Alert.alert('Error', 'User profile not found');
          return;
        }

        const userData = querySnapshot.docs[0].data();
        const userDeptId = userData.departmentId;
        
        setCurrentUser({
          id: user.uid,
          name: `${userData.firstName} ${userData.lastName}`
        });
        
        setDepartmentId(userDeptId);
        
        // Now fetch data based on department
        fetchOfficers(userDeptId);
        fetchEquipment(userDeptId);
      } catch (error) {
        console.error("Error fetching user data:", error);
        if (error && typeof error === 'object' && 'message' in error) {
          Alert.alert('Error', String(error.message));
        } else {
          Alert.alert('Error', 'Failed to load user data. Please try again.');
        }
      }
    };

    fetchUserData();
  }, []);

  const fetchOfficers = async (deptId: string) => {
    setLoadingOfficers(true);
    try {
      const officersRef = collection(db, 'officers');
      const q = query(officersRef, where('departmentId', '==', deptId));
      const querySnapshot = await getDocs(q);
      
      const officersList: Officer[] = [];
      const dropdownList: {label: string, value: string}[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as Omit<Officer, 'id'>;
        const officer = {
          id: doc.id,
          ...data
        };
        
        // Don't include current user in the list
        if (officer.uid !== auth.currentUser?.uid) {
          officersList.push(officer);
          dropdownList.push({
            label: `${data.firstName} ${data.lastName} (${data.badgeNumber})`,
            value: officer.uid
          });
        }
      });
      
      setOfficers(officersList);
      setOfficerDropdownList(dropdownList);
    } catch (error) {
      console.error("Error fetching officers:", error);
      if (error && typeof error === 'object' && 'message' in error) {
        Alert.alert('Error', String(error.message));
      } else {
        Alert.alert('Error', 'Failed to load officers. Please try again.');
      }
    } finally {
      setLoadingOfficers(false);
    }
  };

  const fetchEquipment = async (deptId: string) => {
    setLoadingEquipment(true);
    try {
      const equipmentRef = collection(db, 'equipment');
      const q = query(
        equipmentRef, 
        where('departmentId', '==', deptId),
        where('assignedTo', '==', auth.currentUser?.uid)
      );
      const querySnapshot = await getDocs(q);
      
      const equipmentList: Equipment[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as Omit<Equipment, 'id'>;
        equipmentList.push({
          id: doc.id,
          ...data
        });
      });
      
      setEquipment(equipmentList);
      setFilteredEquipment(equipmentList);
    } catch (error) {
      console.error("Error fetching equipment:", error);
      if (error && typeof error === 'object' && 'message' in error) {
        Alert.alert('Error', String(error.message));
      } else {
        Alert.alert('Error', 'Failed to load equipment. Please try again.');
      }
    } finally {
      setLoadingEquipment(false);
    }
  };

  const onChangeSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredEquipment(equipment);
    } else {
      const filtered = equipment.filter(
        item => 
          item.name.toLowerCase().includes(query.toLowerCase()) ||
          item.serialNumber.toLowerCase().includes(query.toLowerCase()) ||
          item.type.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredEquipment(filtered);
    }
  };

  const toggleEquipmentSelection = (id: string) => {
    if (selectedEquipment.includes(id)) {
      setSelectedEquipment(selectedEquipment.filter(itemId => itemId !== id));
    } else {
      setSelectedEquipment([...selectedEquipment, id]);
    }
  };

  const validateForm = () => {
    let isValid = true;

    if (!selectedOfficer) {
      setOfficerError('Please select an officer to hand over equipment to');
      isValid = false;
    } else {
      setOfficerError('');
    }

    if (selectedEquipment.length === 0) {
      setEquipmentError('Please select at least one equipment item');
      isValid = false;
    } else {
      setEquipmentError('');
    }

    if (!handoverNotes.trim()) {
      setNotesError('Please provide handover notes for documentation');
      isValid = false;
    } else {
      setNotesError('');
    }

    return isValid;
  };

  const handleOfficerChange = (value: string) => {
    setSelectedOfficer(value);
    
    // Find the officer name for display
    const officer = officers.find(o => o.uid === value);
    if (officer) {
      setRecipientName(`${officer.firstName} ${officer.lastName}`);
    }
  };

  const handleHandover = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Create handover record
      const handoverRef = await addDoc(collection(db, 'handovers'), {
        fromOfficerId: auth.currentUser?.uid,
        fromOfficerName: currentUser?.name,
        toOfficerId: selectedOfficer,
        toOfficerName: recipientName,
        equipmentIds: selectedEquipment,
        notes: handoverNotes,
        status: 'pending',
        timestamp: Timestamp.now(),
        departmentId: departmentId
      });

      // Update each equipment item
      const batch = [];
      for (const equipId of selectedEquipment) {
        const equipRef = doc(db, 'equipment', equipId);
        batch.push(
          updateDoc(equipRef, {
            assignedTo: selectedOfficer,
            assignedToName: recipientName,
            status: 'pending_transfer',
            lastUpdated: Timestamp.now(),
            handoverId: handoverRef.id
          })
        );
      }

      await Promise.all(batch);
      
      setLoading(false);
      setDialogVisible(true);
    } catch (error) {
      setLoading(false);
      console.error("Error processing handover:", error);
      if (error && typeof error === 'object' && 'message' in error) {
        Alert.alert('Error', String(error.message));
      } else {
        Alert.alert('Error', 'Failed to process handover. Please try again.');
      }
    }
  };

  const handleDialogClose = () => {
    setDialogVisible(false);
    setSelectedEquipment([]);
    setSelectedOfficer('');
    setRecipientName('');
    setHandoverNotes('');
    
    // Refresh equipment list
    fetchEquipment(departmentId);
    
    // Navigate to dashboard or handover history
    router.replace('/dashboard');
  };

  const getEquipmentStatusChip = (status: string) => {
    let color = '';
    
    switch(status) {
      case 'available':
        color = 'green';
        break;
      case 'in_use':
        color = 'blue';
        break;
      case 'maintenance':
        color = 'orange';
        break;
      case 'pending_transfer':
        color = 'purple';
        break;
      default:
        color = 'gray';
    }
    
    return (
      <Chip 
        style={{backgroundColor: color + '20'}} 
        textStyle={{color}}
      >
        {status.replace('_', ' ')}
      </Chip>
    );
  };

  return (
    <PaperProvider>
      <View style={styles.container}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        
        <Appbar.Header style={styles.appbar}>
          <Appbar.BackAction onPress={() => router.back()} color={Colors.white} />
          <Appbar.Content title="Equipment Handover" color={Colors.white} />
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
                    name="swap-horizontal" 
                    size={60} 
                    color={Colors.white}
                  />
                  <Text style={styles.headerTitle}>Equipment Handover</Text>
                  <Text style={styles.headerSubtitle}>
                    Transfer equipment to another officer with proper documentation
                  </Text>
                </LinearGradient>
              </View>

              {/* Form Section */}
              <View style={styles.formContainer}>
                <Text style={styles.sectionTitle}>Handover Details</Text>
                
                <Card style={styles.infoCard}>
                  <Card.Content>
                    <Text style={styles.infoLabel}>From Officer:</Text>
                    <Text style={styles.infoValue}>{currentUser?.name || 'Loading...'}</Text>
                  </Card.Content>
                </Card>
                
                <View style={styles.dropdownContainer}>
                  <Text style={styles.inputLabel}>Recipient Officer</Text>
                  {loadingOfficers ? (
                    <ActivityIndicator animating={true} color={Colors.primary} />
                  ) : (
                    <DropDown
                      label={"Select Recipient Officer"}
                      mode={"outlined"}
                      visible={showOfficerDropDown}
                      showDropDown={() => setShowOfficerDropDown(true)}
                      onDismiss={() => setShowOfficerDropDown(false)}
                      value={selectedOfficer}
                      setValue={handleOfficerChange}
                      list={officerDropdownList}
                    />
                  )}
                  {!!officerError && <HelperText type="error">{officerError}</HelperText>}
                </View>
                
                <TextInput
                  label="Handover Notes"
                  value={handoverNotes}
                  onChangeText={setHandoverNotes}
                  mode="outlined"
                  style={styles.input}
                  multiline
                  numberOfLines={4}
                  error={!!notesError}
                  left={<TextInput.Icon icon="text-box" />}
                />
                {!!notesError && <HelperText type="error">{notesError}</HelperText>}
                <HelperText type="info">
                  Please include condition details and any relevant information
                </HelperText>

                <Text style={[styles.sectionTitle, {marginTop: 20}]}>Select Equipment for Handover</Text>
                
                {loadingEquipment ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingText}>Loading your equipment...</Text>
                  </View>
                ) : (
                  <>
                    <Searchbar
                      placeholder="Search equipment"
                      onChangeText={onChangeSearch}
                      value={searchQuery}
                      style={styles.searchBar}
                    />
                    
                    {filteredEquipment.length === 0 ? (
                      <View style={styles.noItemsContainer}>
                        <MaterialCommunityIcons name="inbox" size={60} color={Colors.grey} />
                        <Text style={styles.noItemsText}>No equipment items found</Text>
                      </View>
                    ) : (
                      <>
                        <Text style={styles.selectionInfo}>
                          Selected: {selectedEquipment.length} out of {filteredEquipment.length} items
                        </Text>
                        {!!equipmentError && <HelperText type="error">{equipmentError}</HelperText>}
                        
                        <View style={styles.equipmentList}>
                          {filteredEquipment.map((item) => (
                            <TouchableOpacity 
                              key={item.id}
                              style={[
                                styles.equipmentCard,
                                selectedEquipment.includes(item.id) && styles.selectedCard
                              ]}
                              onPress={() => toggleEquipmentSelection(item.id)}
                            >
                              <View style={styles.equipmentCardContent}>
                                <Avatar.Icon 
                                  size={40} 
                                  icon={
                                    item.type === 'firearm' ? 'pistol' : 
                                    item.type === 'vehicle' ? 'car' : 
                                    item.type === 'radio' ? 'radio' : 
                                    item.type === 'armor' ? 'shield' : 
                                    'package-variant-closed'
                                  } 
                                  style={styles.equipmentIcon}
                                />
                                <View style={styles.equipmentInfo}>
                                  <Text style={styles.equipmentName}>{item.name}</Text>
                                  <Text style={styles.equipmentSerial}>SN: {item.serialNumber}</Text>
                                  {getEquipmentStatusChip(item.status)}
                                </View>
                                <Checkbox
                                  status={selectedEquipment.includes(item.id) ? 'checked' : 'unchecked'}
                                  onPress={() => toggleEquipmentSelection(item.id)}
                                  color={Colors.primary}
                                />
                              </View>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </>
                    )}
                  </>
                )}
                
                <Button 
                  mode="contained" 
                  style={styles.button} 
                  labelStyle={styles.buttonLabel}
                  onPress={handleHandover}
                  loading={loading}
                  disabled={loading || selectedEquipment.length === 0 || !selectedOfficer}
                >
                  Process Equipment Handover
                </Button>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>

        <Portal>
          <Dialog visible={dialogVisible} onDismiss={handleDialogClose}>
            <Dialog.Title>Handover Processed</Dialog.Title>
            <Dialog.Content>
              <Text>Equipment handover has been successfully initiated. The recipient officer will need to accept the transfer.</Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={handleDialogClose}>Return to Dashboard</Button>
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
    color: Colors.text,
    marginBottom: 15,
  },
  infoCard: {
    marginBottom: 15,
    backgroundColor: Colors.white,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.grey,
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  dropdownContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    marginBottom: 5,
    backgroundColor: Colors.white,
  },
  searchBar: {
    marginVertical: 10,
    backgroundColor: Colors.white,
  },
  equipmentList: {
    marginVertical: 10,
  },
  equipmentCard: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.lightGrey,
  },
  selectedCard: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: Colors.primary + '10',
  },
  equipmentCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  equipmentIcon: {
    backgroundColor: Colors.secondary,
  },
  equipmentInfo: {
    flex: 1,
    marginLeft: 15,
  },
  equipmentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  equipmentSerial: {
    fontSize: 14,
    color: Colors.grey,
    marginBottom: 5,
  },
  noItemsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  noItemsText: {
    color: Colors.grey,
    fontSize: 16,
    marginTop: 10,
  },
  selectionInfo: {
    fontSize: 14,
    color: Colors.secondary,
    marginVertical: 10,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  loadingText: {
    color: Colors.grey,
    fontSize: 16,
    marginTop: 10,
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
  },
});