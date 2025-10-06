import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { getFieldOptions } from '../services/api';

function ProgressUpdateModal({ update, onSave, onClose }) {
  const [formData, setFormData] = useState({
    update_type: '',
    update_title: '',
    update_details: ''
  });
  const [updateTypeOptions, setUpdateTypeOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadUpdateTypeOptions();
    if (update) {
      setFormData({
        update_type: update.update_type || '',
        update_title: update.update_title || '',
        update_details: update.update_details || ''
      });
    }
  }, [update]);

  const loadUpdateTypeOptions = async () => {
    try {
      const response = await getFieldOptions('update_type');
      setUpdateTypeOptions(response.data);
    } catch (err) {
      console.error('Failed to load update type options', err);
      setUpdateTypeOptions([
        { option_value: 'Update' },
        { option_value: 'Road block' },
        { option_value: 'Threat' },
        { option_value: 'Requirement' }
      ]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.update_type || !formData.update_title) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      setError('Failed to save progress update');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h2>{update ? 'Edit Progress Update' : 'Add Progress Update'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="error-message" style={{ marginBottom: '16px' }}>
                {error}
              </div>
            )}

            <div className="form-group">
              <label>
                Update Type <span style={{ color: 'red' }}>*</span>
              </label>
              <select
                name="update_type"
                value={formData.update_type}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              >
                <option value="">Select update type...</option>
                {updateTypeOptions.map((opt, idx) => (
                  <option key={idx} value={opt.option_value}>
                    {opt.option_value}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>
                Update Title <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                name="update_title"
                value={formData.update_title}
                onChange={handleChange}
                required
                maxLength={500}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                placeholder="Enter a brief title for this update..."
              />
            </div>

            <div className="form-group">
              <label>Update Details</label>
              <textarea
                name="update_details"
                value={formData.update_details}
                onChange={handleChange}
                rows={6}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', resize: 'vertical' }}
                placeholder="Enter detailed information about this update..."
              />
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Provide comprehensive details about the update, roadblock, threat, or requirement
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Save size={18} />
              {loading ? 'Saving...' : 'Save Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProgressUpdateModal;
