import React, { useState, useEffect } from 'react';
import { db } from './firebaseConfig';
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
  serverTimestamp,
  DocumentData
} from 'firebase/firestore';
import { FaHistory } from 'react-icons/fa';
import { BiArrowBack } from 'react-icons/bi';
import { toast } from 'react-toastify';

// Define interfaces for our data types
interface Officer {
  id: string;
  uid: string;
  firstName: string;
  lastName: string;
  badgeNumber: string;
  policeStation: string;
  department?: string;
  rank?: string;
  reportingOfficer?: string;
  status: string;
}

interface Asset {
  id?: string;
  name: string;
  category?: string;
  serialNumber?: string;
  purchaseDate?: Timestamp;
  status?: string;
}

interface Assignment {
  id: string;
  assetId: string;
  assetName: string;
  officerId: string;
  officerName: string;
  officerFullName?: string;
  officerBadge?: string;
  officerStation?: string;
  assignedDate: Timestamp;
  returnedDate?: Timestamp;
  status: string;
}

const Assign = () => {
  // Asset information states
  const [assetId, setAssetId] = useState<string>('');
  const [assetName, setAssetName] = useState<string>('');
  const [officerId, setOfficerId] = useState<string>('');
  const [officerName, setOfficerName] = useState<string>('');
  const [status, setStatus] = useState<string>('active');
  
  // Officer selection states
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [selectedOfficer, setSelectedOfficer] = useState<Officer | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showOfficerDropdown, setShowOfficerDropdown] = useState<boolean>(false);
  
  // Assignment history states
  const [assignmentHistory, setAssignmentHistory] = useState<Assignment[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [assetDetails, setAssetDetails] = useState<Asset | null>(null);

  // Fetch officers from Firestore
  useEffect(() => {
    const fetchOfficers = async () => {
      try {
        const officersRef = collection(db, 'normalofficers');
        const q = query(officersRef, where('status', '==', 'active'));
        const querySnapshot = await getDocs(q);
        
        const officersList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Officer[];
        
        setOfficers(officersList);
      } catch (error) {
        console.error('Error fetching officers:', error);
        toast.error('Failed to load officers list');
      }
    };

    fetchOfficers();
  }, []);

  // Filter officers based on search query
  const filteredOfficers = officers.filter(officer => {
    const fullName = `${officer.firstName} ${officer.lastName}`;
    return fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
           officer.badgeNumber.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Fetch asset details
  const fetchAssetDetails = async (id: string) => {
    setLoading(true);
    try {
      // Check if asset exists in assets collection
      const assetRef = doc(db, 'assets', id);
      const assetDoc = await getDoc(assetRef);
      
      if (assetDoc.exists()) {
        const assetData = assetDoc.data() as Asset;
        setAssetName(assetData.name || '');
        setAssetDetails(assetData);
        
        // Fetch assignment history for this asset
        await fetchAssignmentHistory(id);
      } else {
        toast.error('Asset not found in the database');
        setAssetName('');
        setAssetDetails(null);
      }
    } catch (error) {
      console.error('Error fetching asset details:', error);
      toast.error('Failed to load asset details');
    } finally {
      setLoading(false);
    }
  };

  // Fetch assignment history for an asset
  const fetchAssignmentHistory = async (assetId: string) => {
    try {
      const assignmentsRef = collection(db, 'assignments');
      const q = query(
        assignmentsRef, 
        where('assetId', '==', assetId),
        orderBy('assignedDate', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const history: Assignment[] = [];
      
      for (const docSnapshot of querySnapshot.docs) {
        const assignment = docSnapshot.data() as Omit<Assignment, 'id'>;
        
        // Fetch officer details for each assignment
        if (assignment.officerId) {
          const officerRef = collection(db, 'normalofficers');
          const officerQuery = query(officerRef, where('uid', '==', assignment.officerId));
          const officerSnapshot = await getDocs(officerQuery);
          
          if (!officerSnapshot.empty) {
            const officerData = officerSnapshot.docs[0].data() as Officer;
            assignment.officerFullName = `${officerData.firstName} ${officerData.lastName}`;
            assignment.officerBadge = officerData.badgeNumber;
            assignment.officerStation = officerData.policeStation;
          }
        }
        
        history.push({
          id: docSnapshot.id,
          ...assignment
        });
      }
      
      setAssignmentHistory(history);
    } catch (error) {
      console.error('Error fetching assignment history:', error);
      toast.error('Failed to load assignment history');
    }
  };

  // Select an officer from the dropdown
  const handleSelectOfficer = (officer: Officer) => {
    setSelectedOfficer(officer);
    setOfficerId(officer.uid);
    setOfficerName(`${officer.firstName} ${officer.lastName}`);
    setShowOfficerDropdown(false);
  };

  // Create a new asset assignment
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!assetId || !officerId) {
      toast.error('Please provide both asset and officer information');
      return;
    }
    
    setLoading(true);
    
    try {
      // Check if asset is already assigned to someone
      const assignmentsRef = collection(db, 'assignments');
      const q = query(
        assignmentsRef,
        where('assetId', '==', assetId),
        where('status', '==', 'active')
      );
      
      const querySnapshot = await getDocs(q);
      
      // If asset is already assigned, update its status to 'inactive'
      if (!querySnapshot.empty) {
        const docRef = doc(db, 'assignments', querySnapshot.docs[0].id);
        await updateDoc(docRef, {
          status: 'inactive',
          returnedDate: serverTimestamp()
        });
      }
      
      // Create new assignment record
      const newAssignment = {
        assetId,
        assetName,
        officerId,
        officerName,
        assignedDate: serverTimestamp(),
        status: 'active'
      };
      
      await addDoc(collection(db, 'assignments'), newAssignment);
      
      toast.success('Asset successfully assigned');
      
      // Refresh assignment history
      await fetchAssignmentHistory(assetId);
      
      // Clear form
      setOfficerId('');
      setOfficerName('');
      setSelectedOfficer(null);
    } catch (error) {
      console.error('Error assigning asset:', error);
      toast.error('Failed to assign asset');
    } finally {
      setLoading(false);
    }
  };

  // Reset the form
  const handleReset = () => {
    setAssetId('');
    setAssetName('');
    setOfficerId('');
    setOfficerName('');
    setSelectedOfficer(null);
    setAssignmentHistory([]);
    setAssetDetails(null);
    setShowHistory(false);
  };

  // Format timestamp for display
  const formatDate = (timestamp: Timestamp | Date | undefined) => {
    if (!timestamp) return 'N/A';
    
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Asset Assignment</h1>
        
        {showHistory ? (
          <div>
            <button 
              className="flex items-center text-blue-600 mb-4"
              onClick={() => setShowHistory(false)}
            >
              <BiArrowBack className="mr-1" /> Back to Assignment Form
            </button>
            
            <h2 className="text-xl font-semibold mb-4">
              Assignment History for Asset: {assetName} ({assetId})
            </h2>
            
            {assetDetails && (
              <div className="mb-6 bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium text-gray-700 mb-2">Asset Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p><span className="font-medium">Asset ID:</span> {assetId}</p>
                    <p><span className="font-medium">Name:</span> {assetName}</p>
                    <p><span className="font-medium">Category:</span> {assetDetails.category || 'N/A'}</p>
                  </div>
                  <div>
                    <p><span className="font-medium">Serial Number:</span> {assetDetails.serialNumber || 'N/A'}</p>
                    <p><span className="font-medium">Purchase Date:</span> {assetDetails.purchaseDate ? formatDate(assetDetails.purchaseDate) : 'N/A'}</p>
                    <p><span className="font-medium">Status:</span> {assetDetails.status || 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}
            
            {assignmentHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Officer
                      </th>
                      <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Badge Number
                      </th>
                      <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Police Station
                      </th>
                      <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assigned Date
                      </th>
                      <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Returned Date
                      </th>
                      <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {assignmentHistory.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.officerFullName || item.officerName || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.officerBadge || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.officerStation || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(item.assignedDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.returnedDate ? formatDate(item.returnedDate) : 'Active'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            item.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {item.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                No assignment history found for this asset.
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Asset Information Section */}
              <div className="bg-gray-50 p-6 rounded-md">
                <h2 className="text-lg font-semibold mb-4">Asset Information</h2>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Asset ID
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline flex-grow"
                      value={assetId}
                      onChange={(e) => setAssetId(e.target.value)}
                      placeholder="Enter Asset ID"
                      required
                    />
                    {assetId && (
                      <button
                        type="button"
                        className="ml-2 bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        onClick={() => {
                          fetchAssetDetails(assetId);
                          setShowHistory(true);
                        }}
                      >
                        <FaHistory />
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Asset Name
                  </label>
                  <input
                    type="text"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={assetName}
                    onChange={(e) => setAssetName(e.target.value)}
                    placeholder="Asset Name"
                    required
                  />
                </div>
                
                {/* Lookup asset button */}
                <div className="mb-4">
                  <button
                    type="button"
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    onClick={() => fetchAssetDetails(assetId)}
                  >
                    Look Up Asset
                  </button>
                </div>
                
                {assetDetails && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-md text-sm">
                    <h3 className="font-medium text-blue-800 mb-1">Asset Details</h3>
                    <p><span className="font-medium">Category:</span> {assetDetails.category || 'N/A'}</p>
                    <p><span className="font-medium">Serial Number:</span> {assetDetails.serialNumber || 'N/A'}</p>
                    <p><span className="font-medium">Current Status:</span> {
                      assignmentHistory.length > 0 && assignmentHistory[0].status === 'active' 
                        ? `Assigned to ${assignmentHistory[0].officerFullName || assignmentHistory[0].officerName}`
                        : 'Available'
                    }</p>
                  </div>
                )}
              </div>
              
              {/* Officer Information Section */}
              <div className="bg-gray-50 p-6 rounded-md">
                <h2 className="text-lg font-semibold mb-4">Officer Information</h2>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Search Officer
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      placeholder="Search by name or badge number"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowOfficerDropdown(true);
                      }}
                      onFocus={() => setShowOfficerDropdown(true)}
                    />
                    
                    {showOfficerDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {filteredOfficers.length > 0 ? (
                          filteredOfficers.map((officer) => (
                            <div
                              key={officer.id}
                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                              onClick={() => handleSelectOfficer(officer)}
                            >
                              <div className="font-medium">{officer.firstName} {officer.lastName}</div>
                              <div className="text-sm text-gray-600">Badge: {officer.badgeNumber}</div>
                              <div className="text-xs text-gray-500">Station: {officer.policeStation}</div>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-2 text-gray-500">No officers found</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {selectedOfficer && (
                  <div className="p-4 border rounded-md bg-blue-50">
                    <h3 className="font-medium text-blue-800 mb-2">Selected Officer</h3>
                    <div className="grid grid-cols-1 gap-1">
                      <p><span className="font-medium">Name:</span> {selectedOfficer.firstName} {selectedOfficer.lastName}</p>
                      <p><span className="font-medium">Badge Number:</span> {selectedOfficer.badgeNumber}</p>
                      <p><span className="font-medium">Police Station:</span> {selectedOfficer.policeStation}</p>
                      <p><span className="font-medium">Department:</span> {selectedOfficer.department || 'N/A'}</p>
                      <p><span className="font-medium">Rank:</span> {selectedOfficer.rank || 'N/A'}</p>
                      <p><span className="font-medium">Reporting Officer:</span> {selectedOfficer.reportingOfficer || 'N/A'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <button
                type="submit"
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline mr-4"
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Assign Asset'}
              </button>
              <button
                type="button"
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline"
                onClick={handleReset}
              >
                Reset
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Assign;