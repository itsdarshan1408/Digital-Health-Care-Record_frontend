import { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { Plus, FileText, Download, Trash2, Edit, Upload, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const HealthRecords = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    type: 'other',
  });
  const [selectedFiles, setSelectedFiles] = useState([]);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const { data } = await axiosInstance.get('/records');
      setRecords(data);
    } catch (error) {
      toast.error('Failed to fetch records');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formDataToSend = new FormData();
    formDataToSend.append('title', formData.title);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('date', formData.date);
    formDataToSend.append('type', formData.type);

    selectedFiles.forEach((file) => {
      formDataToSend.append('files', file);
    });

    try {
      await axiosInstance.post('/records', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Record created successfully');
      setShowModal(false);
      resetForm();
      fetchRecords();
    } catch (error) {
      toast.error('Failed to create record');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;

    try {
      await axiosInstance.delete(`/records/${id}`);
      toast.success('Record deleted successfully');
      fetchRecords();
    } catch (error) {
      toast.error('Failed to delete record');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      type: 'other',
    });
    setSelectedFiles([]);
  };

  const handleFileChange = (e) => {
    setSelectedFiles(Array.from(e.target.files));
  };

  const recordTypes = [
    { value: 'lab-report', label: 'Lab Report' },
    { value: 'prescription', label: 'Prescription' },
    { value: 'x-ray', label: 'X-Ray' },
    { value: 'scan', label: 'Scan' },
    { value: 'consultation', label: 'Consultation' },
    { value: 'other', label: 'Other' },
  ];

  const getTypeColor = (type) => {
    const colors = {
      'lab-report': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      prescription: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      'x-ray': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      scan: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
      consultation: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      other: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    };
    return colors[type] || colors.other;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Health Records
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your medical documents and records
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Record</span>
        </button>
      </div>

      {/* Records Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : records.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No records yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Start by adding your first health record
          </p>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            Add First Record
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {records.map((record) => (
            <div key={record._id} className="card hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(
                    record.type
                  )}`}
                >
                  {record.type}
                </span>
                <div className="flex space-x-2">
                  <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                    <Edit className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(record._id)}
                    className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>

              <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-gray-100">
                {record.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                {record.description || 'No description'}
              </p>

              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-3">
                <span>{format(new Date(record.date), 'MMM dd, yyyy')}</span>
                <span>{record.files?.length || 0} file(s)</span>
              </div>

              {record.files && record.files.length > 0 && (
                <div className="space-y-2">
                  {record.files.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded"
                    >
                      <span className="text-sm truncate flex-1">
                        {file.filename}
                      </span>
                      <a
                        href={`${import.meta.env.VITE_SOCKET_URL || 'https://digital-health-care-record-backend.onrender.com'}/${file.path}`}
                        download
                        className="ml-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                      >
                        <Download className="w-4 h-4 text-primary-600" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Record Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Add Health Record
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    className="input-field"
                  >
                    {recordTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows="3"
                    className="input-field"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Upload Files
                  </label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                    <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer text-primary-600 hover:text-primary-700"
                    >
                      Click to upload files
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, JPG, PNG, DOC up to 10MB
                    </p>
                    {selectedFiles.length > 0 && (
                      <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                        {selectedFiles.length} file(s) selected
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button type="submit" className="flex-1 btn-primary">
                    Save Record
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthRecords;
