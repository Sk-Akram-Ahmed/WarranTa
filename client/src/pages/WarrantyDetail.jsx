import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import Spinner from '../components/Spinner';
import StatusBadge from '../components/StatusBadge';
import ConfirmModal from '../components/ConfirmModal';
import Button from '../components/Button';
import Card from '../components/Card';
import { useToast } from '../hooks/useToast';

const WarrantyDetail = () => {
  const { id } = useParams();
  const [warranty, setWarranty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewingFileId, setViewingFileId] = useState(null);

  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWarranty = async () => {
      try {
        const res = await api.get(`/warranties/${id}`);
        setWarranty(res.data.data);
      } catch (err) {
        showToast('Failed to load warranty record', 'error');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchWarranty();
  }, [id, navigate, showToast]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/warranties/${id}`);
      showToast('Warranty deleted successfully', 'success');
      navigate('/dashboard');
    } catch (err) {
      showToast('Failed to delete warranty', 'error');
      setIsDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  const openProtectedFile = async (file) => {
    setViewingFileId(file._id);
    try {
      const response = await api.get(`/warranties/${id}/files/${file._id}/view`);
      const url = response.data.url;
      if (!url) {
        throw new Error('No file URL returned');
      }

      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      showToast('Could not open file or access was denied', 'error');
    } finally {
      setViewingFileId(null);
    }
  };

  if (loading) return <Spinner />;
  if (!warranty) return null;

  return (
    <div className="container page-detail">
      <div className="detail-toolbar">
        <Link to="/dashboard" className="text-secondary">
          &larr; Back to Dashboard
        </Link>
        <div className="inline-actions">
          <Link to={`/warranties/${warranty._id}/edit`} className="button button-secondary">
            Edit
          </Link>
          <Button variant="danger" onClick={() => setDeleteModalOpen(true)}>
            Delete
          </Button>
        </div>
      </div>

      <Card>
        <div className="detail-heading">
          <div className="detail-heading-copy">
            <h1>{warranty.productName}</h1>
            <p>
              {warranty.brand || 'No Brand'} {warranty.model ? `• Model: ${warranty.model}` : ''}
            </p>
          </div>
          <div className="detail-status">
            <StatusBadge status={warranty.status} />
            <div className="detail-remaining">
              {warranty.daysRemaining >= 0 ? `${warranty.daysRemaining} days remaining` : `Expired ${Math.abs(warranty.daysRemaining)} days ago`}
            </div>
          </div>
        </div>

        <div className="grid-2 detail-grid">
          <div>
            <span className="detail-label">Purchase Date</span>
            <p className="detail-value">{new Date(warranty.purchaseDate).toLocaleDateString()}</p>
          </div>
          <div>
            <span className="detail-label">Coverage Duration</span>
            <p className="detail-value">
              {warranty.warrantyValue} {warranty.warrantyUnit}
            </p>
          </div>
          <div>
            <span className="detail-label">Expiry Date</span>
            <p className="detail-value">{new Date(warranty.expiryDate).toLocaleDateString()}</p>
          </div>
          <div>
            <span className="detail-label">Serial Number</span>
            <p className="detail-value">{warranty.serialNumber || 'N/A'}</p>
          </div>
          <div>
            <span className="detail-label">Store / Merchant</span>
            <p className="detail-value">{warranty.shopName || 'N/A'}</p>
          </div>
          <div>
            <span className="detail-label">Purchase Price</span>
            <p className="detail-value">{warranty.price ? `$${warranty.price.toFixed(2)}` : 'N/A'}</p>
          </div>
        </div>

        {warranty.notes && (
          <div className="detail-notes">
            <span className="field-label">Notes / Instructions</span>
            <p>{warranty.notes}</p>
          </div>
        )}

        <div>
          <h2 className="card-heading">Attached Documents &amp; Receipts</h2>
          {warranty.files && warranty.files.length > 0 ? (
            <div className="file-grid">
              {warranty.files.map((file) => (
                <div key={file._id} className="file-card">
                  <div>
                    <p className="file-name">{file.originalName}</p>
                    <span className="file-meta">
                      {(file.size / 1024).toFixed(1)} KB • {file.format ? file.format.toUpperCase() : 'FILE'}
                    </span>
                  </div>
                  <Button
                    variant="secondary"
                    size="small"
                    className="button-full"
                    loading={viewingFileId === file._id}
                    onClick={() => openProtectedFile(file)}
                  >
                    {viewingFileId === file._id ? 'Opening...' : 'View File'}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-secondary text-sm">No bills or warranty cards uploaded for this item.</p>
          )}
        </div>
      </Card>

      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Warranty Record"
        message="Are you sure you want to delete this warranty record and all uploaded bill files? This action cannot be reversed."
        onConfirm={handleDelete}
        onCancel={() => setDeleteModalOpen(false)}
        loading={isDeleting}
      />
    </div>
  );
};

export default WarrantyDetail;
