import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  Timestamp, 
  doc, 
  getDoc, 
  updateDoc,
  where,
  deleteDoc
} from 'firebase/firestore';
import { db } from './firebaseConfig';
// You can use icons from a React Native compatible library
// For example: 
import { Ionicons } from '@expo/vector-icons';

// Define types for our data
interface StockItem {
  id: string;
  itemName: string;
  category: string;
  department: string;
  quantity: number;
  minThreshold: number;
  manufacturer: string;
  model: string;
  purchaseDate: Timestamp;
  lastUpdated: Timestamp;
  status: string;
  location: string;
  notes: string;
}

interface StockHistory {
  id: string;
  itemId: string;
  itemName: string;
  action: string;
  previousQuantity: number;
  newQuantity: number;
  changedBy: string;
  timestamp: Timestamp;
  notes: string;
}

const Stock: React.FC = () => {
  // State for inventory data
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [stockHistory, setStockHistory] = useState<StockHistory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [openAddDialog, setOpenAddDialog] = useState<boolean>(false);
  const [openEditDialog, setOpenEditDialog] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [historyForItem, setHistoryForItem] = useState<string | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarType, setSnackbarType] = useState<'success' | 'error' | 'info'>('info');
  const [tabValue, setTabValue] = useState<number>(0);

  // Form states for adding/editing inventory
  const [formData, setFormData] = useState<Omit<StockItem, 'id' | 'lastUpdated'>>({
    itemName: '',
    category: '',
    department: '',
    quantity: 0,
    minThreshold: 0,
    manufacturer: '',
    model: '',
    purchaseDate: Timestamp.now(),
    status: 'Available',
    location: '',
    notes: ''
  });

  // Filter and search states
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<string>('itemName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // List of categories and departments (these would ideally come from Firestore too)
  const categories = [
    'Communication Devices',
    'Computers',
    'Servers',
    'Networking Equipment',
    'Peripherals',
    'Weapons',
    'Forensic Tools',
    'Security Equipment',
    'Spare Parts'
  ];

  const departments = [
    'Headquarters',
    'Criminal Investigation',
    'Traffic Control',
    'Cybercrime Unit',
    'Forensic Lab',
    'Training Center',
    'Administration',
    'Patrolling Unit'
  ];

  // Current user info (would come from authentication)
  const currentUser = {
    name: 'Admin User',
    role: 'Inventory Manager',
    id: 'admin123'
  };

  // Fetch stock items from Firestore
  const fetchStockItems = async () => {
    setLoading(true);
    try {
      const stockQuery = query(
        collection(db, 'assets'), 
        orderBy('itemName', 'asc')
      );
      
      const stockSnapshot = await getDocs(stockQuery);
      const items: StockItem[] = [];
      
      stockSnapshot.forEach((doc) => {
        const data = doc.data() as Omit<StockItem, 'id'>;
        items.push({
          id: doc.id,
          ...data
        });
      });
      
      setStockItems(items);
    } catch (error) {
      console.error('Error fetching stock items:', error);
      showSnackbar('Failed to load inventory data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch stock history from Firestore
  const fetchStockHistory = async (itemId?: string) => {
    try {
      let historyQuery;
      
      if (itemId) {
        historyQuery = query(
          collection(db, 'stock_history'),
          where('itemId', '==', itemId),
          orderBy('timestamp', 'desc')
        );
      } else {
        historyQuery = query(
          collection(db, 'stock_history'),
          orderBy('timestamp', 'desc')
        );
      }
      
      const historySnapshot = await getDocs(historyQuery);
      const history: StockHistory[] = [];
      
      historySnapshot.forEach((doc) => {
        const data = doc.data() as Omit<StockHistory, 'id'>;
        history.push({
          id: doc.id,
          ...data
        });
      });
      
      setStockHistory(history);
    } catch (error) {
      console.error('Error fetching stock history:', error);
      showSnackbar('Failed to load history data', 'error');
    }
  };

  // Add stock history entry
  const addStockHistory = async (
    itemId: string,
    itemName: string,
    action: string,
    previousQuantity: number,
    newQuantity: number,
    notes: string = ''
  ) => {
    try {
      await addDoc(collection(db, 'stock_history'), {
        itemId,
        itemName,
        action,
        previousQuantity,
        newQuantity,
        changedBy: currentUser.name,
        timestamp: Timestamp.now(),
        notes
      });
    } catch (error) {
      console.error('Error adding stock history:', error);
    }
  };

  // Add new stock item
  const handleAddStock = async () => {
    try {
      // Validate form data
      if (!formData.itemName || !formData.category || formData.quantity < 0) {
        showSnackbar('Please fill in all required fields', 'error');
        return;
      }

      const newItem = {
        ...formData,
        lastUpdated: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'assets'), newItem);
      
      // Add to history
      await addStockHistory(
        docRef.id,
        formData.itemName,
        'Added',
        0,
        formData.quantity,
        `Initial stock entry of ${formData.quantity} units`
      );

      setOpenAddDialog(false);
      setFormData({
        itemName: '',
        category: '',
        department: '',
        quantity: 0,
        minThreshold: 0,
        manufacturer: '',
        model: '',
        purchaseDate: Timestamp.now(),
        status: 'Available',
        location: '',
        notes: ''
      });
      
      showSnackbar('Inventory item added successfully', 'success');
      
      fetchStockItems();
      fetchStockHistory();
    } catch (error) {
      console.error('Error adding stock item:', error);
      showSnackbar('Failed to add inventory item', 'error');
    }
  };

  // Update stock item
  const handleUpdateStock = async () => {
    if (!selectedItem) return;

    try {
      const previousQuantity = selectedItem.quantity;
      const itemRef = doc(db, 'assets', selectedItem.id);
      
      await updateDoc(itemRef, {
        ...formData,
        lastUpdated: Timestamp.now()
      });

      // Add to history if quantity changed
      if (previousQuantity !== formData.quantity) {
        await addStockHistory(
          selectedItem.id,
          formData.itemName,
          previousQuantity < formData.quantity ? 'Increased' : 'Decreased',
          previousQuantity,
          formData.quantity,
          `Quantity updated from ${previousQuantity} to ${formData.quantity}`
        );
      }

      setOpenEditDialog(false);
      setSelectedItem(null);
      
      showSnackbar('Inventory item updated successfully', 'success');
      
      fetchStockItems();
      fetchStockHistory();
    } catch (error) {
      console.error('Error updating stock item:', error);
      showSnackbar('Failed to update inventory item', 'error');
    }
  };

  // Delete stock item
  const handleDeleteStock = async (id: string, itemName: string, quantity: number) => {
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete "${itemName}" from inventory?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'assets', id));
              
              // Add to history
              await addStockHistory(
                id,
                itemName,
                'Deleted',
                quantity,
                0,
                `Item removed from inventory`
              );
              
              showSnackbar('Inventory item deleted successfully', 'success');
              
              fetchStockItems();
              fetchStockHistory();
            } catch (error) {
              console.error('Error deleting stock item:', error);
              showSnackbar('Failed to delete inventory item', 'error');
            }
          }
        }
      ]
    );
  };

  // Handle opening the edit dialog
  const handleOpenEditDialog = (item: StockItem) => {
    setSelectedItem(item);
    setFormData({
      itemName: item.itemName,
      category: item.category,
      department: item.department,
      quantity: item.quantity,
      minThreshold: item.minThreshold,
      manufacturer: item.manufacturer,
      model: item.model,
      purchaseDate: item.purchaseDate,
      status: item.status,
      location: item.location,
      notes: item.notes
    });
    setOpenEditDialog(true);
  };

  // View history for specific item
  const handleViewHistory = (itemId: string) => {
    setHistoryForItem(itemId);
    fetchStockHistory(itemId);
    setShowHistory(true);
    setTabValue(1);
  };

  // Handle form changes - properly typed for TypeScript
  const handleFormChange = (name: string, value: string | number) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Show snackbar message
  const showSnackbar = (message: string, type: 'success' | 'error' | 'info') => {
    setSnackbarMessage(message);
    setSnackbarType(type);
    setSnackbarVisible(true);
    
    // Auto hide after 3 seconds
    setTimeout(() => {
      setSnackbarVisible(false);
    }, 3000);
  };

  // Format timestamp for display
  const formatDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Format timestamp with time for history
  const formatDateTime = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Apply filters to stock items
  const filteredItems = stockItems.filter(item => {
    const matchesCategory = categoryFilter ? item.category === categoryFilter : true;
    const matchesDepartment = departmentFilter ? item.department === departmentFilter : true;
    const matchesSearch = searchQuery 
      ? item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.manufacturer.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    
    return matchesCategory && matchesDepartment && matchesSearch;
  });

  // Sort filtered items
  const sortedItems = [...filteredItems].sort((a, b) => {
    let aValue: any = a[sortField as keyof StockItem];
    let bValue: any = b[sortField as keyof StockItem];
    
    // Handle special cases for sorting
    if (sortField === 'purchaseDate' || sortField === 'lastUpdated') {
      aValue = (aValue as Timestamp).seconds;
      bValue = (bValue as Timestamp).seconds;
    }
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    return 0;
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchStockItems();
    fetchStockHistory();
  }, []);

  // Render item for FlatList
  const renderItem = ({ item }: { item: StockItem }) => (
    <View style={[
      styles.tableRow,
      item.quantity === 0 ? styles.outOfStockRow : 
      item.quantity <= item.minThreshold ? styles.lowStockRow : null
    ]}>
      <View style={styles.tableCell}>
        <Text style={styles.itemName}>{item.itemName}</Text>
        <Text style={styles.itemDetails}>{item.manufacturer} {item.model}</Text>
      </View>
      <View style={styles.tableCell}>
        <Text>{item.category}</Text>
      </View>
      <View style={styles.tableCell}>
        <Text>{item.department}</Text>
      </View>
      <View style={styles.tableCell}>
        <Text style={[
          styles.quantityText,
          item.quantity === 0 ? styles.errorText : 
          item.quantity <= item.minThreshold ? styles.warningText : 
          styles.successText
        ]}>
          {item.quantity}
        </Text>
        <Text style={styles.itemDetails}>Min: {item.minThreshold}</Text>
      </View>
      <View style={styles.tableCell}>
        <View style={[
          styles.statusBadge,
          item.status === 'Available' ? styles.successBadge :
          item.status === 'Limited' ? styles.warningBadge :
          item.status === 'Out of Stock' ? styles.errorBadge :
          styles.defaultBadge
        ]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <View style={styles.tableCell}>
        <Text>{formatDate(item.lastUpdated)}</Text>
      </View>
      <View style={styles.actionCell}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleOpenEditDialog(item)}
        >
          <Ionicons name="create-outline" size={24} color="#2196F3" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleViewHistory(item.id)}
        >
          <Ionicons name="time-outline" size={24} color="#009688" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleDeleteStock(item.id, item.itemName, item.quantity)}
        >
          <Ionicons name="trash-outline" size={24} color="#F44336" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render history item for FlatList
  const renderHistoryItem = ({ item }: { item: StockHistory }) => (
    <View style={styles.historyRow}>
      <Text style={styles.historyDate}>{formatDateTime(item.timestamp)}</Text>
      <Text style={styles.historyItem}>{item.itemName}</Text>
      <View style={[
        styles.historyBadge,
        item.action === 'Added' ? styles.successBadge :
        item.action === 'Increased' ? styles.infoBadge :
        item.action === 'Decreased' ? styles.warningBadge :
        item.action === 'Deleted' ? styles.errorBadge :
        styles.defaultBadge
      ]}>
        <Text style={styles.historyAction}>{item.action}</Text>
      </View>
      <Text style={styles.historyQuantity}>
        {item.previousQuantity} → {item.newQuantity}
      </Text>
      <Text style={styles.historyUser}>{item.changedBy}</Text>
      <Text style={styles.historyNotes}>{item.notes}</Text>
    </View>
  );

  // Main Inventory Tab Content
  const renderInventoryTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statTitle}>Total Items</Text>
          <Text style={styles.statValue}>{stockItems.length}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statTitle}>Low Stock Items</Text>
          <Text style={[styles.statValue, styles.warningText]}>
            {stockItems.filter(item => item.quantity <= item.minThreshold).length}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statTitle}>Out of Stock Items</Text>
          <Text style={[styles.statValue, styles.errorText]}>
            {stockItems.filter(item => item.quantity === 0).length}
          </Text>
        </View>
      </View>

      <View style={styles.filterContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search Inventory"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerLabel}>Category:</Text>
          <TouchableOpacity 
            style={styles.picker}
            onPress={() => {
              // In a real app, you'd show a proper dropdown/picker here
              Alert.alert("Select Category", "", 
                [
                  {text: "All Categories", onPress: () => setCategoryFilter("")},
                  ...categories.map(cat => ({
                    text: cat,
                    onPress: () => setCategoryFilter(cat)
                  }))
                ]
              );
            }}
          >
            <Text>{categoryFilter || "All Categories"}</Text>
            <Ionicons name="chevron-down" size={16} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerLabel}>Department:</Text>
          <TouchableOpacity 
            style={styles.picker}
            onPress={() => {
              // In a real app, you'd show a proper dropdown/picker here
              Alert.alert("Select Department", "", 
                [
                  {text: "All Departments", onPress: () => setDepartmentFilter("")},
                  ...departments.map(dept => ({
                    text: dept,
                    onPress: () => setDepartmentFilter(dept)
                  }))
                ]
              );
            }}
          >
            <Text>{departmentFilter || "All Departments"}</Text>
            <Ionicons name="chevron-down" size={16} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setOpenAddDialog(true)}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.buttonText}>Add Item</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={() => fetchStockItems()}
          >
            <Ionicons name="refresh" size={20} color="#2196F3" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      ) : (
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <TouchableOpacity 
              style={styles.headerCell}
              onPress={() => handleSort('itemName')}
            >
              <Text style={styles.headerText}>Item Name</Text>
              {sortField === 'itemName' && (
                <Text style={styles.sortIndicator}>
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerCell}
              onPress={() => handleSort('category')}
            >
              <Text style={styles.headerText}>Category</Text>
              {sortField === 'category' && (
                <Text style={styles.sortIndicator}>
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerCell}
              onPress={() => handleSort('department')}
            >
              <Text style={styles.headerText}>Department</Text>
              {sortField === 'department' && (
                <Text style={styles.sortIndicator}>
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerCell}
              onPress={() => handleSort('quantity')}
            >
              <Text style={styles.headerText}>Quantity</Text>
              {sortField === 'quantity' && (
                <Text style={styles.sortIndicator}>
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerCell}
              onPress={() => handleSort('status')}
            >
              <Text style={styles.headerText}>Status</Text>
              {sortField === 'status' && (
                <Text style={styles.sortIndicator}>
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerCell}
              onPress={() => handleSort('lastUpdated')}
            >
              <Text style={styles.headerText}>Last Updated</Text>
              {sortField === 'lastUpdated' && (
                <Text style={styles.sortIndicator}>
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </Text>
              )}
            </TouchableOpacity>
            <View style={styles.headerCell}>
              <Text style={styles.headerText}>Actions</Text>
            </View>
          </View>
          
          {sortedItems.length > 0 ? (
            <FlatList
              data={sortedItems}
              renderItem={renderItem}
              keyExtractor={item => item.id}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {loading ? 'Loading inventory data...' : 'No inventory items found'}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );

  // History Tab Content
  const renderHistoryTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.historyHeader}>
        <Text style={styles.historyTitle}>
          {historyForItem 
            ? `History for ${stockItems.find(item => item.id === historyForItem)?.itemName || 'Selected Item'}`
            : 'Complete Inventory History'
          }
        </Text>
        {historyForItem && (
          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={() => {
              setHistoryForItem(null);
              fetchStockHistory();
            }}
          >
            <Text style={styles.viewAllText}>View All History</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      ) : (
        <View style={styles.historyTableContainer}>
          <View style={styles.historyTableHeader}>
            <Text style={styles.historyHeaderText}>Date & Time</Text>
            <Text style={styles.historyHeaderText}>Item</Text>
            <Text style={styles.historyHeaderText}>Action</Text>
            <Text style={styles.historyHeaderText}>Quantity Change</Text>
            <Text style={styles.historyHeaderText}>Changed By</Text>
            <Text style={styles.historyHeaderText}>Notes</Text>
          </View>
          
          {stockHistory.length > 0 ? (
            <FlatList
              data={stockHistory}
              renderItem={renderHistoryItem}
              keyExtractor={item => item.id}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No history records found
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );

  // Add Dialog Content
  const renderAddDialog = () => (
    <Modal
      visible={openAddDialog}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Add New Inventory Item</Text>
          
          <ScrollView style={styles.formContainer}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Item Name *</Text>
              <TextInput
                style={styles.formInput}
                value={formData.itemName}
                onChangeText={(text) => handleFormChange('itemName', text)}
                placeholder="Enter item name"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Category *</Text>
              <TouchableOpacity
                style={styles.formInput}
                onPress={() => {
                  Alert.alert("Select Category", "", 
                    categories.map(cat => ({
                      text: cat,
                      onPress: () => handleFormChange('category', cat)
                    }))
                  );
                }}
              >
                <Text>{formData.category || "Select a category"}</Text>
                <Ionicons name="chevron-down" size={16} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Department</Text>
              <TouchableOpacity
                style={styles.formInput}
                onPress={() => {
                  Alert.alert("Select Department", "", 
                    departments.map(dept => ({
                      text: dept,
                      onPress: () => handleFormChange('department', dept)
                    }))
                  );
                }}
              >
                <Text>{formData.department || "Select a department"}</Text>
                <Ionicons name="chevron-down" size={16} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.formRow}>
              <View style={[styles.formGroup, {flex: 1, marginRight: 8}]}>
                <Text style={styles.formLabel}>Quantity *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.quantity.toString()}
                  onChangeText={(text) => handleFormChange('quantity', parseInt(text) || 0)}
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>
              
              <View style={[styles.formGroup, {flex: 1, marginLeft: 8}]}>
                <Text style={styles.formLabel}>Min Threshold</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.minThreshold.toString()}
                  onChangeText={(text) => handleFormChange('minThreshold', parseInt(text) || 0)}
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>
            </View>
            
            // ... continuing from where the code ended:
            <View style={styles.formRow}>
              <View style={[styles.formGroup, {flex: 1, marginRight: 8}]}>
                <Text style={styles.formLabel}>Manufacturer</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.manufacturer}
                  onChangeText={(text) => handleFormChange('manufacturer', text)}
                  placeholder="Enter manufacturer"
                />
              </View>
              
              <View style={[styles.formGroup, {flex: 1, marginLeft: 8}]}>
                <Text style={styles.formLabel}>Model</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.model}
                  onChangeText={(text) => handleFormChange('model', text)}
                  placeholder="Enter model"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Status</Text>
              <TouchableOpacity
                style={styles.formInput}
                onPress={() => {
                  Alert.alert("Select Status", "", [
                    {text: "Available", onPress: () => handleFormChange('status', 'Available')},
                    {text: "Limited", onPress: () => handleFormChange('status', 'Limited')},
                    {text: "Out of Stock", onPress: () => handleFormChange('status', 'Out of Stock')},
                    {text: "Reserved", onPress: () => handleFormChange('status', 'Reserved')},
                  ]);
                }}
              >
                <Text>{formData.status || "Select status"}</Text>
                <Ionicons name="chevron-down" size={16} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Location</Text>
              <TextInput
                style={styles.formInput}
                value={formData.location}
                onChangeText={(text) => handleFormChange('location', text)}
                placeholder="Enter storage location"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Notes</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                value={formData.notes}
                onChangeText={(text) => handleFormChange('notes', text)}
                placeholder="Enter additional notes"
                multiline={true}
                numberOfLines={4}
              />
            </View>
          </ScrollView>
          
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setOpenAddDialog(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleAddStock}
            >
              <Text style={styles.saveButtonText}>Add Item</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Edit Dialog Content
  const renderEditDialog = () => (
    <Modal
      visible={openEditDialog}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Edit Inventory Item</Text>
          
          <ScrollView style={styles.formContainer}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Item Name *</Text>
              <TextInput
                style={styles.formInput}
                value={formData.itemName}
                onChangeText={(text) => handleFormChange('itemName', text)}
                placeholder="Enter item name"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Category *</Text>
              <TouchableOpacity
                style={styles.formInput}
                onPress={() => {
                  Alert.alert("Select Category", "", 
                    categories.map(cat => ({
                      text: cat,
                      onPress: () => handleFormChange('category', cat)
                    }))
                  );
                }}
              >
                <Text>{formData.category || "Select a category"}</Text>
                <Ionicons name="chevron-down" size={16} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Department</Text>
              <TouchableOpacity
                style={styles.formInput}
                onPress={() => {
                  Alert.alert("Select Department", "", 
                    departments.map(dept => ({
                      text: dept,
                      onPress: () => handleFormChange('department', dept)
                    }))
                  );
                }}
              >
                <Text>{formData.department || "Select a department"}</Text>
                <Ionicons name="chevron-down" size={16} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.formRow}>
              <View style={[styles.formGroup, {flex: 1, marginRight: 8}]}>
                <Text style={styles.formLabel}>Quantity *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.quantity.toString()}
                  onChangeText={(text) => handleFormChange('quantity', parseInt(text) || 0)}
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>
              
              <View style={[styles.formGroup, {flex: 1, marginLeft: 8}]}>
                <Text style={styles.formLabel}>Min Threshold</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.minThreshold.toString()}
                  onChangeText={(text) => handleFormChange('minThreshold', parseInt(text) || 0)}
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>
            </View>
            
            <View style={styles.formRow}>
              <View style={[styles.formGroup, {flex: 1, marginRight: 8}]}>
                <Text style={styles.formLabel}>Manufacturer</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.manufacturer}
                  onChangeText={(text) => handleFormChange('manufacturer', text)}
                  placeholder="Enter manufacturer"
                />
              </View>
              
              <View style={[styles.formGroup, {flex: 1, marginLeft: 8}]}>
                <Text style={styles.formLabel}>Model</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.model}
                  onChangeText={(text) => handleFormChange('model', text)}
                  placeholder="Enter model"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Status</Text>
              <TouchableOpacity
                style={styles.formInput}
                onPress={() => {
                  Alert.alert("Select Status", "", [
                    {text: "Available", onPress: () => handleFormChange('status', 'Available')},
                    {text: "Limited", onPress: () => handleFormChange('status', 'Limited')},
                    {text: "Out of Stock", onPress: () => handleFormChange('status', 'Out of Stock')},
                    {text: "Reserved", onPress: () => handleFormChange('status', 'Reserved')},
                  ]);
                }}
              >
                <Text>{formData.status || "Select status"}</Text>
                <Ionicons name="chevron-down" size={16} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Location</Text>
              <TextInput
                style={styles.formInput}
                value={formData.location}
                onChangeText={(text) => handleFormChange('location', text)}
                placeholder="Enter storage location"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Notes</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                value={formData.notes}
                onChangeText={(text) => handleFormChange('notes', text)}
                placeholder="Enter additional notes"
                multiline={true}
                numberOfLines={4}
              />
            </View>
          </ScrollView>
          
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setOpenEditDialog(false);
                setSelectedItem(null);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleUpdateStock}
            >
              <Text style={styles.saveButtonText}>Update Item</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Handle sorting when header is clicked
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inventory Management</Text>
        <Text style={styles.headerSubtitle}>
          Manage police department equipment and assets
        </Text>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[
            styles.tab, 
            tabValue === 0 ? styles.activeTab : {}
          ]}
          onPress={() => setTabValue(0)}
        >
          <Ionicons 
            name="cube-outline" 
            size={20} 
            color={tabValue === 0 ? "#2196F3" : "#757575"}
          />
          <Text style={[
            styles.tabText,
            tabValue === 0 ? styles.activeTabText : {}
          ]}>
            Inventory
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.tab, 
            tabValue === 1 ? styles.activeTab : {}
          ]}
          onPress={() => {
            setTabValue(1);
            setHistoryForItem(null);
            fetchStockHistory();
          }}
        >
          <Ionicons 
            name="time-outline" 
            size={20}
            color={tabValue === 1 ? "#2196F3" : "#757575"}
          />
          <Text style={[
            styles.tabText,
            tabValue === 1 ? styles.activeTabText : {}
          ]}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      {tabValue === 0 ? renderInventoryTab() : renderHistoryTab()}
      
      {renderAddDialog()}
      {renderEditDialog()}
      
      {snackbarVisible && (
        <View style={[
          styles.snackbar,
          snackbarType === 'success' ? styles.successSnackbar :
          snackbarType === 'error' ? styles.errorSnackbar :
          styles.infoSnackbar
        ]}>
          <Text style={styles.snackbarText}>{snackbarMessage}</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

// Styles for the component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 16,
    paddingTop: 24,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#2196F3',
  },
  tabText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#757575',
  },
  activeTabText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 4,
    elevation: 2,
    alignItems: 'center',
  },
  statTitle: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  searchInput: {
    flex: 2,
    backgroundColor: '#fff',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minWidth: 150,
  },
  pickerContainer: {
    flex: 1,
    marginRight: 8,
    minWidth: 120,
  },
  pickerLabel: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
  },
  picker: {
    backgroundColor: '#fff',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#2196F3',
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    marginLeft: 4,
    fontWeight: 'bold',
  },
  refreshButton: {
    backgroundColor: '#fff',
    borderRadius: 4,
    padding: 8,
    borderWidth: 1,
    borderColor: '#2196F3',
    elevation: 1,
  },
  tableContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerCell: {
    flex: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    fontWeight: 'bold',
    color: '#424242',
  },
  sortIndicator: {
    marginLeft: 4,
    fontSize: 16,
    color: '#2196F3',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  outOfStockRow: {
    backgroundColor: 'rgba(244, 67, 54, 0.05)',
  },
  lowStockRow: {
    backgroundColor: 'rgba(255, 152, 0, 0.05)',
  },
  tableCell: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  itemName: {
    fontWeight: 'bold',
    color: '#212121',
  },
  itemDetails: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
  quantityText: {
    fontWeight: 'bold',
  },
  successText: {
    color: '#4CAF50',
  },
  warningText: {
    color: '#FF9800',
  },
  errorText: {
    color: '#F44336',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  successBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  warningBadge: {
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
  },
  errorBadge: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
  },
  infoBadge: {
    backgroundColor: 'rgba(33, 150, 243, 0.2)',
  },
  defaultBadge: {
    backgroundColor: 'rgba(158, 158, 158, 0.2)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionCell: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 8,
  },
  actionButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    color: '#757575',
    textAlign: 'center',
  },
  snackbar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#323232',
    borderRadius: 4,
    padding: 16,
    elevation: 6,
  },
  successSnackbar: {
    backgroundColor: '#43a047',
  },
  errorSnackbar: {
    backgroundColor: '#d32f2f',
  },
  infoSnackbar: {
    backgroundColor: '#1976d2',
  },
  snackbarText: {
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  formContainer: {
    padding: 16,
    maxHeight: 400,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 4,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#757575',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    elevation: 2,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
  },
  viewAllButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
  },
  viewAllText: {
    color: '#424242',
    fontWeight: 'bold',
  },
  historyTableContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
  },
  historyTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 12,
  },
  historyHeaderText: {
    flex: 1,
    fontWeight: 'bold',
    color: '#424242',
    paddingHorizontal: 8,
  },
  historyRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 12,
  },
  historyDate: {
    flex: 1,
    fontSize: 12,
    color: '#757575',
    paddingHorizontal: 8,
  },
  historyItem: {
    flex: 1,
    fontWeight: 'bold',
    paddingHorizontal: 8,
  },
  historyBadge: {
    flex: 1,
    paddingHorizontal: 8,
  },
  historyAction: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  historyQuantity: {
    flex: 1,
    paddingHorizontal: 8,
  },
  historyUser: {
    flex: 1,
    fontSize: 12,
    color: '#424242',
    paddingHorizontal: 8,
  },
  historyNotes: {
    flex: 1,
    fontSize: 12,
    color: '#757575',
    paddingHorizontal: 8,
  }
});

export default Stock;