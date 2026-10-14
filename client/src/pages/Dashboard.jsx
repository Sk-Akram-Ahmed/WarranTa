import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axiosInstance';
import Spinner from '../components/Spinner';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../hooks/useToast';

const Dashboard = () => {
  const [stats, setStats] = useState({ total: 0, active: 0, expiringSoon: 0, expired: 0 });
  const [warranties, setWarranties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sort, setSort] = useState('expiry_asc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const { showToast } = useToast();

  const fetchStats = async () => {
    try {
      const res = await api.get('/warranties/stats');
      setStats(res.data.stats);
    } catch (err) {
      showToast('Could not fetch warranty statistics', 'error');
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchWarranties = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 10,
        sort,
      });
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter) params.append('status', statusFilter);

      const res = await api.get(`/warranties?${params.toString()}`);
      setWarranties(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
    } catch (err) {
      showToast('Failed to load warranties', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, sort, showToast]);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchWarranties();
  }, [fetchWarranties]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchWarranties();
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Warranty Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Monitor and manage product coverage and expiration schedules</p>
        </div>
        <Link to="/warranties/new" className="btn btn-primary">
          + Add New Warranty
        </Link>
      </div>

      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <div className="card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>TOTAL WARRANTIES</span>
          <h2 style={{ fontSize: '1.85rem', marginTop: '0.5rem' }}>{statsLoading ? '...' : stats.total}</h2>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #16a34a' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>ACTIVE</span>
          <h2 style={{ fontSize: '1.85rem', marginTop: '0.5rem', color: '#16a34a' }}>{statsLoading ? '...' : stats.active}</h2>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #d97706' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>EXPIRING SOON (≤30D)</span>
          <h2 style={{ fontSize: '1.85rem', marginTop: '0.5rem', color: '#d97706' }}>{statsLoading ? '...' : stats.expiringSoon}</h2>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #dc2626' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>EXPIRED</span>
          <h2 style={{ fontSize: '1.85rem', marginTop: '0.5rem', color: '#dc2626' }}>{statsLoading ? '...' : stats.expired}</h2>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search by product name or brand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: '1 1 220px' }}
          />

          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            style={{ flex: '0 1 160px' }}
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Expiring Soon">Expiring Soon</option>
            <option value="Expired">Expired</option>
          </select>

          <select
            className="form-select"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            style={{ flex: '0 1 180px' }}
          >
            <option value="expiry_asc">Expiry: Nearest First</option>
            <option value="expiry_desc">Expiry: Furthest First</option>
            <option value="purchase_desc">Purchased: Newest</option>
            <option value="purchase_asc">Purchased: Oldest</option>
            <option value="name_asc">Name: A - Z</option>
            <option value="name_desc">Name: Z - A</option>
          </select>

          <button type="submit" className="btn btn-secondary" style={{ flexShrink: 0 }}>
            Search
          </button>
        </form>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <Spinner />
        ) : warranties.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              No warranties yet, add your first one to get started!
            </p>
            <Link to="/warranties/new" className="btn btn-primary">
              Register Warranty
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.925rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Product</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Brand / Model</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Purchased</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Expiry Date</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Remaining</th>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {warranties.map((w) => (
                  <tr key={w._id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>
                      <Link to={`/warranties/${w._id}`}>{w.productName}</Link>
                    </td>
                    <td style={{ padding: '1rem 1rem', color: 'var(--text-secondary)' }}>
                      {w.brand || '—'} {w.model ? `(${w.model})` : ''}
                    </td>
                    <td style={{ padding: '1rem 1rem', color: 'var(--text-secondary)' }}>
                      {new Date(w.purchaseDate).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '1rem 1rem', fontWeight: 500 }}>
                      {new Date(w.expiryDate).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '1rem 1rem' }}>
                      <StatusBadge status={w.status} />
                    </td>
                    <td style={{ padding: '1rem 1rem' }}>
                      {w.daysRemaining >= 0 ? (
                        <span style={{ color: w.daysRemaining <= 30 ? '#d97706' : '#16a34a', fontWeight: 600 }}>
                          {w.daysRemaining} day{w.daysRemaining === 1 ? '' : 's'}
                        </span>
                      ) : (
                        <span style={{ color: '#dc2626', fontWeight: 600 }}>
                          Ended {Math.abs(w.daysRemaining)}d ago
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      <Link
                        to={`/warranties/${w._id}`}
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.825rem' }}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <span style={{ display: 'flex', alignItems: 'center', padding: '0 0.75rem', fontWeight: 500 }}>
            Page {page} of {totalPages}
          </span>
          <button
            className="btn btn-secondary"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
