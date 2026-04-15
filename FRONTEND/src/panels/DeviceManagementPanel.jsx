import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { devicesApi } from '../services/api';
import Modal from '../components/Modal';

export default function DeviceManagementPanel() {
  const { token } = useAuth();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');

  const [visibleKeys, setVisibleKeys] = useState({});

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    try {
      const result = await devicesApi.getAll(token);
      setDevices(result.data || []);
    } catch (err) {
      setError('Failed to load devices');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const clearForm = () => { setFormName(''); setFormDescription(''); };

  const showMessage = (msg, type = 'success') => {
    if (type === 'success') { setSuccess(msg); setError(''); }
    else { setError(msg); setSuccess(''); }
    setTimeout(() => { setSuccess(''); setError(''); }, 3000);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await devicesApi.create(token, { name: formName, description: formDescription || undefined });
      showMessage('Device created successfully! Save the API key shown in the table.');
      setShowCreateModal(false); clearForm(); fetchDevices();
    } catch (err) {
      showMessage(err.errors ? err.errors.map(e => e.msg).join(', ') : (err.message || 'Failed to create device'), 'error');
    } finally { setFormLoading(false); }
  };

  const openEditModal = (device) => {
    setEditingDevice(device); setFormName(device.name); setFormDescription(device.description || ''); setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingDevice) return;
    setFormLoading(true);
    try {
      await devicesApi.update(token, editingDevice.id, { name: formName, description: formDescription || undefined });
      showMessage('Device updated successfully!');
      setShowEditModal(false); clearForm(); setEditingDevice(null); fetchDevices();
    } catch (err) {
      showMessage(err.errors ? err.errors.map(e => e.msg).join(', ') : (err.message || 'Failed to update device'), 'error');
    } finally { setFormLoading(false); }
  };

  const handleRegenerateKey = async (deviceId) => {
    if (!window.confirm('Are you sure? The old API key will no longer work.')) return;
    try {
      await devicesApi.regenerateKey(token, deviceId);
      showMessage('API key regenerated! Save the new key.');
      setVisibleKeys(prev => ({ ...prev, [deviceId]: true }));
      fetchDevices();
    } catch (err) { showMessage(err.message || 'Failed to regenerate API key', 'error'); }
  };

  const handleDeactivate = async (deviceId) => {
    if (!window.confirm('Are you sure you want to deactivate this device?')) return;
    try {
      await devicesApi.deactivate(token, deviceId);
      showMessage('Device deactivated successfully!');
      fetchDevices();
    } catch (err) { showMessage(err.message || 'Failed to deactivate device', 'error'); }
  };

  const toggleKeyVisibility = (deviceId) => { setVisibleKeys(prev => ({ ...prev, [deviceId]: !prev[deviceId] })); };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => showMessage('API key copied to clipboard!')).catch(() => showMessage('Failed to copy', 'error'));
  };

  const formatDate = (dateStr) => new Date(dateStr).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const inputClass = 'w-full px-4 py-3 bg-surface-input border border-border-default rounded-lg text-text-primary text-sm outline-none transition-all duration-200 placeholder:text-text-placeholder focus:border-blue-500 focus:ring-3 focus:ring-blue-500/15';

  const renderDeviceForm = (onSubmit, submitLabel) => (
    <form onSubmit={onSubmit}>
      <div className="mb-4">
        <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wide" htmlFor="device-name">Device Name</label>
        <input id="device-name" type="text" className={inputClass} placeholder="e.g. Sensor Lab Kimia" value={formName} onChange={(e) => setFormName(e.target.value)} required />
      </div>
      <div className="mb-5">
        <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wide" htmlFor="device-desc">Description (Optional)</label>
        <textarea id="device-desc" className={`${inputClass} resize-y min-h-[80px]`} placeholder="Describe this device..." value={formDescription} onChange={(e) => setFormDescription(e.target.value)} />
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" className="px-5 py-2.5 bg-surface-elevated border border-border-default rounded-lg text-sm font-semibold text-text-primary hover:bg-surface-card-hover transition-all duration-200" onClick={() => { setShowCreateModal(false); setShowEditModal(false); clearForm(); }}>
          Cancel
        </button>
        <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg text-sm font-semibold text-white hover:from-blue-500 hover:to-blue-400 hover:shadow-[0_0_20px_rgba(51,120,255,0.3)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2" disabled={formLoading}>
          {formLoading ? <><div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Processing...</> : submitLabel}
        </button>
      </div>
    </form>
  );

  return (
    <div className="animate-page-enter">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-[1.75rem] font-extrabold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">📱 Device Management</h1>
            <p className="text-text-muted mt-1 text-sm">Manage sensor devices and API keys</p>
          </div>
          <button onClick={() => { clearForm(); setShowCreateModal(true); }} id="create-device-btn" className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg text-sm font-semibold text-white hover:from-blue-500 hover:to-blue-400 hover:shadow-[0_0_20px_rgba(51,120,255,0.3)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200">
            + Add Device
          </button>
        </div>
      </div>

      {/* Alerts */}
      {success && <div className="px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2.5 mb-4 animate-slide-down bg-badge-green-bg text-badge-green-text border border-badge-green-border">✅ {success}</div>}
      {error && <div className="px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2.5 mb-4 animate-slide-down bg-badge-red-bg text-badge-red-text border border-badge-red-border">⚠️ {error}</div>}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-text-muted text-sm gap-3">
          <div className="w-5 h-5 border-2 border-border-default border-t-blue-500 rounded-full animate-spin" /> Loading devices...
        </div>
      ) : devices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-5xl mb-4 opacity-30">📡</div>
          <div className="text-lg font-semibold text-text-secondary mb-2">No Devices Found</div>
          <div className="text-text-muted text-sm">Register a new sensor device to get started.</div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border-default">
          <table className="w-full border-collapse text-sm" id="devices-table">
            <thead className="bg-surface-elevated">
              <tr>
                {['ID', 'Name', 'Description', 'API Key', 'Status', 'Created', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-text-muted border-b border-border-default whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {devices.map((device) => (
                <tr key={device.id} className="transition-colors duration-150 hover:bg-badge-blue-bg border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-badge-blue-bg text-badge-blue-text border border-badge-blue-border">#{device.id}</span>
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-text-primary">{device.name}</td>
                  <td className="px-4 py-3.5 text-sm text-text-muted">{device.description || '-'}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5 bg-surface-input border border-border-default rounded-lg px-3 py-2 font-mono text-xs text-accent-cyan max-w-[220px]">
                      <span className="flex-1 truncate">
                        {visibleKeys[device.id] ? device.apiKey : '••••••••••••••••'}
                      </span>
                      <button onClick={() => toggleKeyVisibility(device.id)} title={visibleKeys[device.id] ? 'Hide' : 'Show'} className="text-text-muted hover:text-badge-blue-text hover:bg-surface-elevated p-1 rounded transition-all duration-150">
                        {visibleKeys[device.id] ? '🙈' : '👁'}
                      </button>
                      <button onClick={() => copyToClipboard(device.apiKey)} title="Copy" className="text-text-muted hover:text-badge-blue-text hover:bg-surface-elevated p-1 rounded transition-all duration-150">
                        📋
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    {device.isActive
                      ? <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-badge-green-bg text-badge-green-text border border-badge-green-border">Active</span>
                      : <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-badge-red-bg text-badge-red-text border border-badge-red-border">Inactive</span>
                    }
                  </td>
                  <td className="px-4 py-3.5 text-xs text-text-muted">{formatDate(device.createdAt)}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex gap-1.5">
                        <button onClick={() => openEditModal(device)} className="px-3 py-1.5 bg-surface-elevated border border-border-default rounded-lg text-xs font-semibold text-text-primary hover:bg-surface-card-hover transition-all duration-150">
                          ✏️ Edit
                        </button>
                        <button onClick={() => handleRegenerateKey(device.id)} className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-amber-500 rounded-lg text-xs font-semibold text-white hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all duration-150">
                          🔑 New Key
                        </button>
                      </div>
                      <button onClick={() => handleDeactivate(device.id)} className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-red-500 rounded-lg text-xs font-semibold text-white hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all duration-150">
                        🚫 Deactivate
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreateModal} onClose={() => { setShowCreateModal(false); clearForm(); }} title="Register New Device">
        {renderDeviceForm(handleCreate, 'Create Device')}
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); clearForm(); setEditingDevice(null); }} title={`Edit Device: ${editingDevice?.name || ''}`}>
        {renderDeviceForm(handleUpdate, 'Update Device')}
      </Modal>
    </div>
  );
}
