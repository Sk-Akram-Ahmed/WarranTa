import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import Spinner from '../components/Spinner';
import StatusBadge from '../components/StatusBadge';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../hooks/useToast';

const WarrantyDetail = () => {
  const { id } = useParams();
  const [warranty, setWarranty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const openProtectedFile = async (storedName) => {
    try {
      const response = await api.get(`/files/${id}/${storedName}`, {
        responseType: 'blob',
      });
      const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: response.headers['content-type'] }));
      window.open(blobUrl, '_blank');
    } catch (err) {
      showToast('Could not open file or access was denied', 'error');
    }
  };

  if (loading) return <Spinner />;
  if (!warranty) return null;

  return (
    <div className="container" style={{ maxWidth: '840px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <Link to="/dashboard" style={{ color: 'var(--text-secondary)' }}>
          &larr; Back to Dashboard
        </Link>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to={`/warranties/${warranty._id}/edit`} className="btn btn-secondary">
            Edit
          </Link>
          <button className="btn btn-danger" onClick={() => setDeleteModalOpen(true)}>
            Delete
          </button>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{warranty.productName}</h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              {warranty.brand || 'No Brand'} {warranty.model ? `• Model: ${warranty.model}` : ''}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <StatusBadge status={warranty.status} />
            <div style={{ marginTop: '0.4rem', fontSize: '0.9rem', fontWeight: 600 }}>
              {warranty.daysRemaining >= 0 ? `${warranty.daysRemaining} days remaining` : `Expired ${Math.abs(warranty.daysRemaining)} days ago`}
            </div>
          </div>
        </div>

        <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Purchase Date</span>
            <p style={{ fontWeight: 600 }}>{new Date(warranty.purchaseDate).toLocaleDateString()}</p>
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Coverage Duration</span>
            <p style={{ fontWeight: 600 }}>
              {warranty.warrantyValue} {warranty.warrantyUnit}
            </p>
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Expiry Date</span>
            <p style={{ fontWeight: 600 }}>{new Date(warranty.expiryDate).toLocaleDateString()}</p>
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Serial Number</span>
            <p style={{ fontWeight: 600 }}>{warranty.serialNumber || 'N/A'}</p>
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Store / Merchant</span>
            <p style={{ fontWeight: 600 }}>{warranty.shopName || 'N/A'}</p>
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Purchase Price</span>
            <p style={{ fontWeight: 600 }}>{warranty.price ? `$${warranty.price.toFixed(2)}` : 'N/A'}</p>
          </div>
        </div>

        {warranty.notes && (
          <div style={{ marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius)' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Notes / Instructions</span>
            <p style={{ marginTop: '0.25rem', whiteSpace: 'pre-wrap' }}>{warranty.notes}</p>
          </div>
        )}

        <div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Attached Documents & Receipts</h3>
          {warranty.files && warranty.files.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
              {warranty.files.map((file) => (
                <div
                  key={file._id}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    padding: '0.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ marginBottom: '0.5rem' }}>
                    <p style={{ fontWeight: 600, fontSize: '0.85rem', wordBreak: 'break-all' }}>{file.originalName}</p>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {(file.size / 1024).toFixed(1)} KB • {file.mimeType.split('/')[1]?.toUpperCase()}
                    </span>
                  </div>
                  <button
                    className="btn btn-secondary"
                    style={{ width: '100%', fontSize: '0.8rem', padding: '0.4rem' }}
                    onClick={() => openProtectedFile(file.storedName)}
                  >
                    View File
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No bills or warranty cards uploaded for this item.</p>
          )}
        </div>
      </div>

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
