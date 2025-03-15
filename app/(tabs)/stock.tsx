import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, Timestamp, doc, getDoc, updateDoc, where } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { toast } from 'react-hot-toast';
import { FiPlus, FiMinus, FiTrash2, FiEdit, FiX } from 'react-icons/fi';
import { BiSearchAlt } from 'react-icons/bi';
import { useAuth } from '../contexts/AuthContext'; // Updated path
// Define types for our data
interface StockItem {
  id: string;
  itemName: string;
  category: string;
  quantity: number;
  threshold: number;
  lastUpdated: Timestamp;
  updatedBy: string;
  location: string;
  department: string;
  status: 'Available' | 'Low Stock' | 'Out of Stock';
  description?: string;
}

interface Department {
  id: string;
  name: string;
}

const StockManagement: React.FC = () => {
  // State variables
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterDepartment, setFilterDepartment] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [categories, setCategories] = useState<string[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [showLowStock, setShowLowStock] = useState<boolean>(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState<boolean>(false);
  const [currentItem, setCurrentItem] = useState<StockItem | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [showReport, setShowReport] = useState<boolean>(false);

  const { currentUser  } = useAuth();

  // Form states for adding new item
  const [newItem, setNewItem] = useState({
    itemName: '',
    category: '',
    quantity: 0,
    threshold: 5,
    location: '',
    department: '',
    description: ''
  });

  // Form states for transferring items
  const [transferData, setTransferData] = useState({
    fromDepartment: '',
    toDepartment: '',
    itemId: '',
    quantity: 1,
    reason: ''
  });

  // Fetch stock items
  const fetchStockItems = async () => {
    setLoading(true);
    try {
      const stockQuery = query(collection(db, 'assets'), orderBy('itemName'));
      const querySnapshot = await getDocs(stockQuery);
      
      const items: StockItem[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const status = determineStatus(data.quantity, data.threshold);
        
        items.push({
          id: doc.id,
          itemName: data.itemName,
          category: data.category,
          quantity: data.quantity,
          threshold: data.threshold,
          lastUpdated: data.lastUpdated,
          updatedBy: data.updatedBy,
          location: data.location,
          department: data.department,
          status,
          description: data.description || ''
        });
      });

      setStockItems(items);
      setFilteredItems(items);

      // Extract categories
      const uniqueCategories = [...new Set(items.map(item => item.category))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error("Error fetching stock items:", error);
      toast.error("Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  };

  // Fetch departments
  const fetchDepartments = async () => {
    try {
      const deptQuery = query(collection(db, 'departments'), orderBy('name'));
      const querySnapshot = await getDocs(deptQuery);
      
      const depts: Department[] = [];
      querySnapshot.forEach((doc) => {
        depts.push({
          id: doc.id,
          name: doc.data().name
        });
      });

      setDepartments(depts);
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  useEffect(() => {
    fetchStockItems();
    fetchDepartments();
  }, []);

  // Determine item status based on quantity and threshold
  const determineStatus = (quantity: number, threshold: number): 'Available' | 'Low Stock' | 'Out of Stock' => {
    if (quantity <= 0) return 'Out of Stock';
    if (quantity <= threshold) return 'Low Stock';
    return 'Available';
  };

  // Filter items based on search and filters
  useEffect(() => {
    let result = stockItems;

    // Text search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.itemName.toLowerCase().includes(query) || 
        item.description?.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (filterCategory) {
      result = result.filter(item => item.category === filterCategory);
    }

    // Department filter
    if (filterDepartment) {
      result = result.filter(item => item.department === filterDepartment);
    }

    // Status filter
    if (filterStatus) {
      result = result.filter(item => item.status === filterStatus);
    }

    // Low stock filter
    if (showLowStock) {
      result = result.filter(item => item.status === 'Low Stock' || item.status === 'Out of Stock');
    }

    setFilteredItems(result);
  }, [searchQuery, filterCategory, filterDepartment, filterStatus, showLowStock, stockItems]);

  // Add new stock item
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newItem.itemName || !newItem.category || newItem.quantity < 0) {
      toast.error("Please fill all required fields correctly");
      return;
    }

    try {
      const docRef = await addDoc(collection(db, 'assets'), {
        ...newItem,
        quantity: Number(newItem.quantity),
        threshold: Number(newItem.threshold),
        lastUpdated: Timestamp.now(),
        updatedBy: currentUser ?.displayName || currentUser ?.email || 'Unknown',
      });

      toast.success("Inventory item added successfully");
      setIsAddModalOpen(false);
      setNewItem({
        itemName: '',
        category: '',
        quantity: 0,
        threshold: 5,
        location: '',
        department: '',
        description: ''
      });
      fetchStockItems();
    } catch (error) {
      console.error("Error adding item:", error);
      toast.error("Failed to add inventory item");
    }
  };

  // Update stock quantity
  const updateQuantity = async (id: string, newQuantity: number) => {
    if (newQuantity < 0) {
      toast.error("Quantity cannot be negative");
      return;
    }

    try {
      const itemRef = doc(db, 'assets', id);
      await updateDoc(itemRef, {
        quantity: newQuantity,
        lastUpdated: Timestamp.now(),
        updatedBy: currentUser ?.displayName || currentUser ?.email || 'Unknown',
      });

      toast.success("Quantity updated successfully");
      fetchStockItems();
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast.error("Failed to update quantity");
    }
  };

  // Open edit modal with current item data
  const openEditModal = (item: StockItem) => {
    setCurrentItem(item);
    setIsEditModalOpen(true);
  };

  // Save edited item
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentItem) return;

    try {
      const itemRef = doc(db, 'assets', currentItem.id);
      await updateDoc(itemRef, {
        itemName: currentItem.itemName,
        category: currentItem.category,
        quantity: Number(currentItem.quantity),
        threshold: Number(currentItem.threshold),
        location: currentItem.location,
        department: currentItem.department,
        description: currentItem.description,
        lastUpdated: Timestamp.now(),
        updatedBy: currentUser ?.displayName || currentUser ?.email || 'Unknown',
      });

      toast.success("Item updated successfully");
      setIsEditModalOpen(false);
      fetchStockItems();
    } catch (error) {
      console.error("Error updating item:", error);
      toast.error("Failed to update item");
    }
  };

  // Delete item
  const deleteItem = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this item? This action cannot be undone.")) {
      return;
    }

    try {
      const itemRef = doc(db, 'assets', id);
      await updateDoc(itemRef, { deleted: true });
      toast.success("Item deleted successfully");
      fetchStockItems();
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Failed to delete item");
    }
  };

  // Handle transfer between departments
  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!transferData.fromDepartment || !transferData.toDepartment || !transferData.itemId || transferData.quantity <= 0) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      // Get the item from the source department
      const itemRef = doc(db, 'assets', transferData.itemId);
      const itemDoc = await getDoc(itemRef);
      
      if (!itemDoc.exists()) {
        toast.error("Item not found");
        return;
      }
      
      const itemData = itemDoc.data();
      
      if (itemData.quantity < transferData.quantity) {
        toast.error("Transfer quantity exceeds available quantity");
        return;
      }

      // Update the source item quantity
      await updateDoc(itemRef, {
        quantity: itemData.quantity - transferData.quantity,
        lastUpdated: Timestamp.now(),
        updatedBy: currentUser ?.displayName || currentUser ?.email || 'Unknown',
      });

      // Check if the item already exists in the destination department
      const destinationQuery = query(
        collection(db, 'assets'),
        where('itemName', '==', itemData.itemName),
        where('department', '==', transferData.toDepartment)
      );
      
      const destinationSnapshot = await getDocs(destinationQuery);
      
      if (!destinationSnapshot.empty) {
        // Item exists in destination department - update quantity
        const destDoc = destinationSnapshot.docs[0];
        const destData = destDoc.data();
        
        await updateDoc(doc(db, 'assets', destDoc.id), {
          quantity: destData.quantity + transferData.quantity,
          lastUpdated: Timestamp.now(),
          updatedBy: currentUser ?.displayName || currentUser ?.email || 'Unknown',
        });
      } else {
        // Item doesn't exist in destination - create new entry
        await addDoc(collection(db, 'assets'), {
          itemName: itemData.itemName,
          category: itemData.category,
          quantity: transferData.quantity,
          threshold: itemData.threshold,
          location: itemData.location,
          department: transferData.toDepartment,
          description: itemData.description,
          lastUpdated: Timestamp.now(),
          updatedBy: currentUser ?.displayName || currentUser ?.email || 'Unknown',
        });
      }

      // Record the transfer in the transfers collection
      await addDoc(collection(db, 'transfers'), {
        itemId: transferData.itemId,
        itemName: itemData.itemName,
        fromDepartment: transferData.fromDepartment,
        toDepartment: transferData.toDepartment,
        quantity: transferData.quantity,
        reason: transferData.reason,
        transferredAt: Timestamp.now(),
        transferredBy: currentUser ?.displayName || currentUser ?.email || 'Unknown',
      });

      toast.success("Transfer completed successfully");
      setIsTransferModalOpen(false);
      setTransferData({
        fromDepartment: '',
        toDepartment: '',
        itemId: '',
        quantity: 1,
        reason: ''
      });
      fetchStockItems();
    } catch (error) {
      console.error("Error transferring item:", error);
      toast.error("Failed to transfer item");
    }
  };

  // Generate inventory report
  const generateReport = () => {
    // Count total items
    const totalItems = stockItems.length;
    
    // Count items by status
    const itemsByStatus = {
      'Available': stockItems.filter(item => item.status === 'Available').length,
      'Low Stock': stockItems.filter(item => item.status === 'Low Stock').length,
      'Out of Stock': stockItems.filter(item => item.status === 'Out of Stock').length,
    };
    
    // Count items by category
    const itemsByCategory: Record<string, number> = {};
    stockItems.forEach(item => {
      if (itemsByCategory[item.category]) {
        itemsByCategory[item.category]++;
      } else {
        itemsByCategory[item.category] = 1;
      }
    });
    
    // Count items by department
    const itemsByDepartment: Record<string, number> = {};
    stockItems.forEach(item => {
      if (itemsByDepartment[item.department]) {
        itemsByDepartment[item.department]++;
      } else {
        itemsByDepartment[item.department] = 1;
      }
    });
    
    // Items that need attention (low or out of stock)
    const attentionItems = stockItems
      .filter(item => item.status === 'Low Stock' || item.status === 'Out of Stock')
      .sort((a, b) => {
        // Sort by status first (out of stock first)
        if (a.status === 'Out of Stock' && b.status !== 'Out of Stock') return -1;
        if (a.status !== 'Out of Stock' && b.status === 'Out of Stock') return 1;
        
        // Then sort by category
        return a.category.localeCompare(b.category);
      });
    
    setReportData({
      totalItems,
      itemsByStatus,
      itemsByCategory,
      itemsByDepartment,
      attentionItems,
      generatedAt: new Date().toLocaleString(),
      generatedBy: currentUser ?.displayName || currentUser ?.email || 'Unknown',
    });
    
    setShowReport(true);
  };

  // Export report to CSV
  const exportToCSV = () => {
    const headers = ['Item Name', 'Category', 'Department', 'Quantity', 'Threshold', 'Status', 'Last Updated'];
    
    let csvContent = headers.join(',') + '\n';
    
    filteredItems.forEach(item => {
      const row = [
        `"${item.itemName}"`,
        `"${item.category}"`,
        `"${item.department}"`,
        item.quantity,
        item.threshold,
        `"${item.status}"`,
        new Date(item.lastUpdated.toDate()).toLocaleString()
      ];
      
      csvContent += row.join(',') + '\n';
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
        <p className="mt-4 text-lg text-gray-700">Loading inventory data...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Inventory Stock Management</h1>
            <p className="text-gray-600">Manage and track inventory items</p>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center"
            >
              <FiPlus className="mr-2" /> Add New Item
            </button>
            <button 
              onClick={() => setIsTransferModalOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center"
            >
              <FiEdit className="mr-2" /> Transfer Items
            </button>
            <button 
              onClick={generateReport}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded flex items-center"
            >
              Generate Report
            </button>
            <button 
              onClick={exportToCSV}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded flex items-center"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-gray-100 p-4 rounded-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-2 pl-10 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <BiSearchAlt className="absolute left-3 top-3 text-gray-400" />
            </div>
            
            {/* Category filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map((category, index) => (
                <option key={index} value={category}>{category}</option>
              ))}
            </select>
            
            {/* Department filter */}
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.name}>{dept.name}</option>
              ))}
            </select>
            
            {/* Status filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="Available">Available</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>
          
          <div className="mt-2 flex items-center">
            <input
              type="checkbox"
              id="lowStockOnly"
              checked={showLowStock}
              onChange={(e) => setShowLowStock(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="lowStockOnly" className="text-red-600 font-medium">
              Show only items that need attention (Low or Out of Stock)
            </label>
          </div>
        </div>

        {/* Display filtered items count */}
        <div className="mb-4">
          <p className="text-gray-600">
            Showing {filteredItems.length} out of {stockItems.length} items
          </p>
        </div>

        {/* Inventory Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Item Name</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Category</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Department</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Location</th>
                <th className="px-4 py-2 text-center text-sm font-semibold text-gray-700">Quantity</th>
                <th className="px-4 py-2 text-center text-sm font-semibold text-gray-700">Threshold</th>
                <th className="px-4 py-2 text-center text-sm font-semibold text-gray-700">Status</th>
                <th className="px-4 py-2 text-center text-sm font-semibold text-gray-700">Last Updated</th>
                <th className="px-4 py-2 text-center text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <tr key={item.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">{item.itemName}</td>
                    <td className="px-4 py-3">{item.category}</td>
                    <td className="px-4 py-3">{item.department}</td>
                    <td className="px-4 py-3">{item.location}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="text-red-500 hover:text-red-700 p-1"
                          disabled={item.quantity <= 0}
                        >
                          <FiMinus />
                        </button>
                        <span className="mx-2 font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="text-green-500 hover:text-green-700 p-1"
                        >
                          <FiPlus />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">{item.threshold}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        item.status === 'Available' ? 'bg-green-100 text-green-800' :
                        item.status === 'Low Stock' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm">
                      {item.lastUpdated?.toDate().toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => openEditModal(item)}
                          className="text-blue-500 hover:text-blue-700 p-1"
                          title="Edit Item"
                        >
                          <FiEdit />
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Delete Item"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-4 py-4 text-center text-gray-500">
                    No items found. Try adjusting your filters or add new items.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add New Inventory Item</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleAddItem}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Item Name *</label>
                <input
                  type="text"
                  value={newItem.itemName}
                  onChange={(e) => setNewItem({...newItem, itemName: e.target.value})}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 mb-2">Category *</label>
                  <input
                    type="text"
                    value={newItem.category}
                    onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Department *</label>
                  <select
                    value={newItem.department}
                    onChange={(e) => setNewItem({...newItem, department: e.target.value})}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.name}>{dept.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 mb-2">Initial Quantity *</label>
                  <input
                    type="number"
                    min="0"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value)})}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Low Stock Threshold *</label>
                  <input
                    type="number"
                    min="1"
                    value={newItem.threshold}
                    onChange={(e) => setNewItem({...newItem, threshold: parseInt(e.target.value)})}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  value={newItem.location}
                  onChange={(e) => setNewItem({...newItem, location: e.target.value})}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Description</label>
                <textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                ></textarea>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded mr-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {isEditModalOpen && currentItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit Item: {currentItem.itemName}</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
            <div className="mb-4">
                <label className="block text-gray-700 mb-2">Item Name *</label>
                <input
                  type="text"
                  value={currentItem.itemName}
                  onChange={(e) => setCurrentItem({...currentItem, itemName: e.target.value})}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 mb-2">Category *</label>
                  <input
                    type="text"
                    value={currentItem.category}
                    onChange={(e) => setCurrentItem({...currentItem, category: e.target.value})}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Department *</label>
                  <select
                    value={currentItem.department}
                    onChange={(e) => setCurrentItem({...currentItem, department: e.target.value})}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.name}>{dept.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 mb-2">Quantity *</label>
                  <input
                    type="number"
                    min="0"
                    value={currentItem.quantity}
                    onChange={(e) => setCurrentItem({...currentItem, quantity: parseInt(e.target.value)})}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Low Stock Threshold *</label>
                  <input
                    type="number"
                    min="1"
                    value={currentItem.threshold}
                    onChange={(e) => setCurrentItem({...currentItem, threshold: parseInt(e.target.value)})}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  value={currentItem.location}
                  onChange={(e) => setCurrentItem({...currentItem, location: e.target.value})}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Description</label>
                <textarea
                  value={currentItem.description}
                  onChange={(e) => setCurrentItem({...currentItem, description: e.target.value})}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                ></textarea>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded mr-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Transfer Items Between Departments</h2>
              <button onClick={() => setIsTransferModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleTransfer}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">From Department *</label>
                <select
                  value={transferData.fromDepartment}
                  onChange={(e) => setTransferData({...transferData, fromDepartment: e.target.value})}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Source Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.name}>{dept.name}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Item to Transfer *</label>
                <select
                  value={transferData.itemId}
                  onChange={(e) => setTransferData({...transferData, itemId: e.target.value})}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={!transferData.fromDepartment}
                >
                  <option value="">Select Item</option>
                  {stockItems
                    .filter(item => item.department === transferData.fromDepartment && item.quantity > 0)
                    .map((item) => (
                      <option key={item.id} value={item.id}>{item.itemName} (Available: {item.quantity})</option>
                    ))
                  }
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2">To Department *</label>
                <select
                  value={transferData.toDepartment}
                  onChange={(e) => setTransferData({...transferData, toDepartment: e.target.value})}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Destination Department</option>
                  {departments
                    .filter(dept => dept.name !== transferData.fromDepartment)
                    .map((dept) => (
                      <option key={dept.id} value={dept.name}>{dept.name}</option>
                    ))
                  }
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Quantity to Transfer *</label>
                <input
                  type="number"
                  min="1"
                  value={transferData.quantity}
                  onChange={(e) => setTransferData({...transferData, quantity: parseInt(e.target.value)})}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Reason for Transfer</label>
                <textarea
                  value={transferData.reason}
                  onChange={(e) => setTransferData({...transferData, reason: e.target.value})}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                ></textarea>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded mr-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                >
                  Complete Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inventory Report Modal */}
      {showReport && reportData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Inventory Report</h2>
              <button onClick={() => setShowReport(false)} className="text-gray-500 hover:text-gray-700">
                <FiX size={24} />
              </button>
            </div>

            <div className="mb-6 p-4 bg-gray-100 rounded-lg">
              <p><strong>Generated:</strong> {reportData.generatedAt}</p>
              <p><strong>Generated By:</strong> {reportData.generatedBy}</p>
              <p><strong>Total Items in Inventory:</strong> {reportData.totalItems}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Status summary */}
              <div className="bg-white p-4 border rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-3">Status Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Available Items:</span>
                    <span className="font-medium text-green-600">{reportData.itemsByStatus['Available']}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Low Stock Items:</span>
                    <span className="font-medium text-yellow-600">{reportData.itemsByStatus['Low Stock']}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Out of Stock Items:</span>
                    <span className="font-medium text-red-600">{reportData.itemsByStatus['Out of Stock']}</span>
                  </div>
                </div>
              </div>

              {/* Category breakdown */}
              <div className="bg-white p-4 border rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-3">Category Breakdown</h3>
                <div className="space-y-2">
                  {Object.entries(reportData.itemsByCategory).map(([category, count]) => (
                    <div key={category} className="flex justify-between">
                      <span>{category}:</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Department breakdown */}
            <div className="mb-6 bg-white p-4 border rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-3">Department Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(reportData.itemsByDepartment).map(([dept, count]) => (
                  <div key={dept} className="flex justify-between">
                    <span>{dept}:</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Items needing attention */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-3">Items Needing Attention</h3>
              {reportData.attentionItems.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-4 py-2 text-left">Item Name</th>
                        <th className="px-4 py-2 text-left">Category</th>
                        <th className="px-4 py-2 text-left">Department</th>
                        <th className="px-4 py-2 text-center">Quantity</th>
                        <th className="px-4 py-2 text-center">Threshold</th>
                        <th className="px-4 py-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.attentionItems.map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="px-4 py-2">{item.itemName}</td>
                          <td className="px-4 py-2">{item.category}</td>
                          <td className="px-4 py-2">{item.department}</td>
                          <td className="px-4 py-2 text-center">{item.quantity}</td>
                          <td className="px-4 py-2 text-center">{item.threshold}</td>
                          <td className="px-4 py-2 text-center">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              item.status === 'Low Stock' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-green-600">All items are sufficiently stocked.</p>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowReport(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

