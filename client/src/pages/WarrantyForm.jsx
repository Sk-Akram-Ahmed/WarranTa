import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../api/axiosInstance';
import Spinner from '../components/Spinner';
import { useToast } from '../hooks/useToast';
import Button from '../components/Button';
import Card from '../components/Card';
import FormField from '../components/FormField';
import Input, { Select, Textarea } from '../components/Input';

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
  const [previewUrls, setPreviewUrls] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);

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

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

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
    for (const f of selected) {
      const fileExtension = f.name.split('.').pop()?.toLowerCase();
      const validMimeType = ['jpg', 'jpeg', 'png', 'pdf'].includes(fileExtension) || ['image/jpeg', 'image/png', 'application/pdf'].includes(f.type);

      if (f.size > 5 * 1024 * 1024 || !validMimeType) {
        showToast(`File ${f.name} is invalid or exceeds 5 MB limit. Only JPG, PNG, and PDF files are allowed.`, 'error');
        e.target.value = '';
        return;
      }
      validFiles.push(f);
    }

    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    setNewFiles(validFiles);
    setPreviewUrls(validFiles.filter((file) => file.type.startsWith('image/')).map((file) => URL.createObjectURL(file)));
  };

  const handleRemoveExistingFile = (publicId) => {
    setRemovedFiles((current) => [...new Set([...current, publicId])]);
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

    if (isEditMode && removedFiles.length > 0) {
      payload.append('removedFiles', removedFiles.join(','));
    }

    newFiles.forEach((file) => {
      payload.append('files', file);
    });

    try {
      if (isEditMode) {
        await api.put(`/warranties/${id}`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
            setUploadProgress(percent);
          },
        });
        showToast('Warranty updated successfully', 'success');
        navigate(`/warranties/${id}`);
      } else {
        const res = await api.post('/warranties', payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
            setUploadProgress(percent);
          },
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
      setUploadProgress(0);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="container page-narrow">
      <div className="back-link">
        <Link to="/dashboard">&larr; Cancel and return</Link>
      </div>

      <Card>
        <h1 className="card-heading">{isEditMode ? 'Edit Warranty' : 'Add New Warranty'}</h1>

        <form onSubmit={handleSubmit}>
          <FormField label="Product Name *" htmlFor="productName" error={errors.productName}>
            <Input
              type="text"
              id="productName"
              name="productName"
              required
              value={formData.productName}
              onChange={handleChange}
              placeholder="e.g. MacBook Pro 16 or Sony TV"
            />
          </FormField>

          <div className="form-grid">
            <FormField label="Brand" htmlFor="brand">
              <Input
                type="text"
                id="brand"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                placeholder="e.g. Apple, LG"
              />
            </FormField>
            <FormField label="Model" htmlFor="model">
              <Input
                type="text"
                id="model"
                name="model"
                value={formData.model}
                onChange={handleChange}
                placeholder="e.g. OLED55C2PUA"
              />
            </FormField>
          </div>

          <div className="form-grid">
            <FormField label="Purchase Date *" htmlFor="purchaseDate" error={errors.purchaseDate}>
              <Input
                type="date"
                id="purchaseDate"
                name="purchaseDate"
                required
                max={new Date().toISOString().split('T')[0]}
                value={formData.purchaseDate}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="Warranty Period *" htmlFor="warrantyValue" error={errors.warrantyValue}>
              <div className="form-inline">
                <Input
                  id="warrantyValue"
                  type="number"
                  name="warrantyValue"
                  min="1"
                  required
                  value={formData.warrantyValue}
                  onChange={handleChange}
                />
                <Select
                  name="warrantyUnit"
                  value={formData.warrantyUnit}
                  onChange={handleChange}
                  aria-label="Warranty period unit"
                >
                  <option value="months">Month(s)</option>
                  <option value="years">Year(s)</option>
                </Select>
              </div>
            </FormField>
          </div>

          <div className="form-grid">
            <FormField label="Serial Number" htmlFor="serialNumber">
              <Input
                type="text"
                id="serialNumber"
                name="serialNumber"
                value={formData.serialNumber}
                onChange={handleChange}
                placeholder="SN-12345678"
              />
            </FormField>
            <FormField label="Shop / Merchant Name" htmlFor="shopName">
              <Input
                type="text"
                id="shopName"
                name="shopName"
                value={formData.shopName}
                onChange={handleChange}
                placeholder="e.g. Amazon, Local Store"
              />
            </FormField>
          </div>

          <FormField label="Purchase Price ($)" htmlFor="price">
            <Input
              type="number"
              step="0.01"
              min="0"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="0.00"
            />
          </FormField>

          <FormField label="Notes" htmlFor="notes">
            <Textarea
              id="notes"
              name="notes"
              rows="3"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Additional terms, extended coverages, claim phone numbers..."
            />
          </FormField>

          {isEditMode && existingFiles.length > 0 && (
            <section className="existing-files">
              <h2 className="field-label">Current Files</h2>
              <div className="existing-file-list">
                {existingFiles.map((file) => {
                  const fileIdentifier = file.publicId || file._id;
                  const isMarked = removedFiles.includes(fileIdentifier);
                  return (
                    <div
                      key={fileIdentifier}
                      className={`file-row${isMarked ? ' file-row-removed' : ''}`}
                    >
                      <span className="file-name">{file.originalName}</span>
                      {!isMarked ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="small"
                          className="button-danger-text"
                          onClick={() => handleRemoveExistingFile(fileIdentifier)}
                        >
                          Remove
                        </Button>
                      ) : (
                        <span className="file-remove-label">Marked for deletion</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {previewUrls.length > 0 && (
            <section className="new-file-preview">
              <h2 className="field-label">Selected image previews</h2>
              <div className="file-preview-grid">
                {previewUrls.map((url, index) => (
                  <img key={`${url}-${index}`} src={url} alt={`Preview ${index + 1}`} className="preview-image" />
                ))}
              </div>
            </section>
          )}

          <FormField label="Upload Bills / Warranty Cards (Max 3 files, JPG/PNG/PDF, ≤ 5MB each)" htmlFor="file-input">
            <Input
              type="file"
              id="file-input"
              multiple
              accept=".jpg,.jpeg,.png,.pdf"
              className="file-input"
              onChange={handleFileChange}
            />
          </FormField>

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="upload-progress" aria-live="polite">
              <span>Uploading files: {uploadProgress}%</span>
              <div className="progress-bar">
                <span style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}

          <div className="form-actions">
            <Link to="/dashboard" className="button button-secondary">
              Cancel
            </Link>
            <Button type="submit" loading={submitting}>
              {submitting ? (uploadProgress > 0 ? `Saving... ${uploadProgress}%` : 'Saving...') : isEditMode ? 'Update Warranty' : 'Save Warranty'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default WarrantyForm;
