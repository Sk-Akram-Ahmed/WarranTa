import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../api/axiosInstance';
import Spinner from '../components/Spinner';
import { useToast } from '../hooks/useToast';

const WarrantyForm = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    productName: '',
    brand: '',
    model: '',
    serialNumber: '',
    purchaseDate: '',
    warrantyValue: 12,
    warrantyUnit: 'months',
    shopName: '',
    price: '',
    notes: '',
  });

  const [existingFiles, setExistingFiles] = useState([]);
  const [removedFiles, setRemovedFiles] = useState([]);
  const [newFiles, setNewFiles] = useState([]);

  useEffect(() => {
    if (isEditMode) {
      const loadWarranty = async () => {
        try {
          const res = await api.get(`/warranties/${id}`);
          const data = res.data.data;
          setFormData({
            productName: data.productName || '',
            brand: data.brand || '',
            model: data.model || '',
            serialNumber: data.serialNumber || '',
            purchaseDate: data.purchaseDate ? data.purchaseDate.split('T')[0] : '',
            warrantyValue: data.warrantyValue || 1,
            warrantyUnit: data.warrantyUnit || 'months',
            shopName: data.shopName || '',
            price: data.price !== undefined ? data.price : '',
            notes: data.notes || '',
          });
          setExistingFiles(data.files || []);
        } catch (err) {
          showToast('Failed to load warranty for editing', 'error');
          navigate('/dashboard');
        } finally {
          setLoading(false);
        }
      };
      loadWarranty();
    }
  }, [id, isEditMode, navigate, showToast]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    const totalRemainingCapacity = 3 - (existingFiles.length - removedFiles.length);

    if (selected.length > totalRemainingCapacity) {
      showToast(`You can only upload up to ${totalRemainingCapacity} more file(s). Maximum total is 3.`, 'error');
      e.target.value = '';
      return;
    }

    const validFiles = [];
    for (let f of selected) {
      if (f.size > 5 * 1024 * 1024) {
        showToast(`File ${f.name} exceeds 5 MB limit`, 'error');
        e.target.value = '';
        return;
      }
      validFiles.push(f);
    }
    setNewFiles(validFiles);
  };

  const handleRemoveExistingFile = (storedName) => {
    setRemovedFiles([...removedFiles, storedName]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const today = new Date().toISOString().split('T')[0];
    if (formData.purchaseDate > today) {
      setErrors({ purchaseDate: 'Purchase date cannot be in the future.' });
      return;
    }

    if (parseInt(formData.warrantyValue, 10) <= 0) {
      setErrors({ warrantyValue: 'Warranty period must be positive.' });
      return;
    }

    setSubmitting(true);
    const payload = new FormData();
    payload.append('productName', formData.productName);
    payload.append('brand', formData.brand);
    payload.append('model', formData.model);
    payload.append('serialNumber', formData.serialNumber);
    payload.append('purchaseDate', formData.purchaseDate);
    payload.append('warrantyValue', formData.warrantyValue);
    payload.append('warrantyUnit', formData.warrantyUnit);
    payload.append('shopName', formData.shopName);
    payload.append('price', formData.price);
    payload.append('notes', formData.notes);

    if (isEditMode) {
      if (removedFiles.length > 0) {
        payload.append('removedFiles', removedFiles.join(','));
      }
    }

    newFiles.forEach((file) => {
      payload.append('files', file);
    });

    try {
      if (isEditMode) {
        await api.put(`/warranties/${id}`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        showToast('Warranty updated successfully', 'success');
        navigate(`/warranties/${id}`);
      } else {
        const res = await api.post('/warranties', payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        showToast('Warranty created successfully', 'success');
        navigate(`/warranties/${res.data.data._id}`);
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) {
        const errMap = {};
        data.errors.forEach((e) => {
          errMap[e.field] = e.message;
        });
        setErrors(errMap);
      } else {
        showToast(data?.message || 'Error saving warranty', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="container" style={{ maxWidth: '720px' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <Link to="/dashboard" style={{ color: 'var(--text-secondary)' }}>
          &larr; Cancel and return
        </Link>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '1.5rem' }}>{isEditMode ? 'Edit Warranty' : 'Add New Warranty'}</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="productName">Product Name *</label>
            <input
              type="text"
              id="productName"
              name="productName"
              className="form-input"
              required
              value={formData.productName}
              onChange={handleChange}
              placeholder="e.g. MacBook Pro 16 or Sony TV"
            />
            {errors.productName && <span className="form-error">{errors.productName}</span>}
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label htmlFor="brand">Brand</label>
              <input
                type="text"
                id="brand"
                name="brand"
                className="form-input"
                value={formData.brand}
                onChange={handleChange}
                placeholder="e.g. Apple, LG"
              />
            </div>
            <div className="form-group">
              <label htmlFor="model">Model</label>
              <input
                type="text"
                id="model"
                name="model"
                className="form-input"
                value={formData.model}
                onChange={handleChange}
                placeholder="e.g. OLED55C2PUA"
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label htmlFor="purchaseDate">Purchase Date *</label>
              <input
                type="date"
                id="purchaseDate"
                name="purchaseDate"
                className="form-input"
                required
                max={new Date().toISOString().split('T')[0]}
                value={formData.purchaseDate}
                onChange={handleChange}
              />
              {errors.purchaseDate && <span className="form-error">{errors.purchaseDate}</span>}
            </div>

            <div className="form-group">
              <label>Warranty Period *</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="number"
                  name="warrantyValue"
                  className="form-input"
                  min="1"
                  required
                  value={formData.warrantyValue}
                  onChange={handleChange}
                  style={{ width: '45%' }}
                />
                <select
                  name="warrantyUnit"
                  className="form-select"
                  value={formData.warrantyUnit}
                  onChange={handleChange}
                  style={{ width: '55%' }}
                >
                  <option value="months">Month(s)</option>
                  <option value="years">Year(s)</option>
                </select>
              </div>
              {errors.warrantyValue && <span className="form-error">{errors.warrantyValue}</span>}
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label htmlFor="serialNumber">Serial Number</label>
              <input
                type="text"
                id="serialNumber"
                name="serialNumber"
                className="form-input"
                value={formData.serialNumber}
                onChange={handleChange}
                placeholder="SN-12345678"
              />
            </div>
            <div className="form-group">
              <label htmlFor="shopName">Shop / Merchant Name</label>
              <input
                type="text"
                id="shopName"
                name="shopName"
                className="form-input"
                value={formData.shopName}
                onChange={handleChange}
                placeholder="e.g. Amazon, Local Store"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="price">Purchase Price ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              id="price"
              name="price"
              className="form-input"
              value={formData.price}
              onChange={handleChange}
              placeholder="0.00"
            />
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              name="notes"
              rows="3"
              className="form-textarea"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Additional terms, extended coverages, claim phone numbers..."
            />
          </div>

          {isEditMode && existingFiles.length > 0 && (
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontWeight: 600, fontSize: '0.875rem' }}>Current Files</label>
              <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {existingFiles.map((file) => {
                  const isMarked = removedFiles.includes(file.storedName);
                  return (
                    <div
                      key={file.storedName}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.5rem 0.75rem',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        opacity: isMarked ? 0.4 : 1,
                        textDecoration: isMarked ? 'line-through' : 'none',
                      }}
                    >
                      <span style={{ fontSize: '0.875rem' }}>{file.originalName}</span>
                      {!isMarked ? (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', color: '#dc2626' }}
                          onClick={() => handleRemoveExistingFile(file.storedName)}
                        >
                          Remove
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#dc2626' }}>Marked for deletion</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="file-input">
              Upload Bills / Warranty Cards (Max 3 files, JPG/PNG/PDF, ≤ 5MB each)
            </label>
            <input
              type="file"
              id="file-input"
              multiple
              accept=".jpg,.jpeg,.png,.pdf"
              className="form-input"
              onChange={handleFileChange}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
            <Link to="/dashboard" className="btn btn-secondary">
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : isEditMode ? 'Update Warranty' : 'Save Warranty'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WarrantyForm;
