import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axiosInstance';
import Spinner from '../components/Spinner';
import StatusBadge from '../components/StatusBadge';
import Button from '../components/Button';
import Card from '../components/Card';
import Input, { Select } from '../components/Input';
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
      <header className="page-header">
        <div className="page-header-copy">
          <h1>Warranty Dashboard</h1>
          <p className="page-description">Monitor and manage product coverage and expiration schedules</p>
        </div>
        <Link to="/warranties/new" className="button button-primary">
          + Add New Warranty
        </Link>
      </header>

      <div className="grid-4 stats-grid">
        <Card className="stat-card stat-total">
          <span className="stat-label">Total Warranties</span>
          <strong className="stat-value">{statsLoading ? '...' : stats.total}</strong>
        </Card>
        <Card className="stat-card stat-active">
          <span className="stat-label">Active</span>
          <strong className="stat-value">{statsLoading ? '...' : stats.active}</strong>
        </Card>
        <Card className="stat-card stat-expiring">
          <span className="stat-label">Expiring Soon (≤30d)</span>
          <strong className="stat-value">{statsLoading ? '...' : stats.expiringSoon}</strong>
        </Card>
        <Card className="stat-card stat-expired">
          <span className="stat-label">Expired</span>
          <strong className="stat-value">{statsLoading ? '...' : stats.expired}</strong>
        </Card>
      </div>

      <Card className="search-panel">
        <form onSubmit={handleSearchSubmit} className="search-form">
          <Input
            type="text"
            className="search-query"
            placeholder="Search by product name or brand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search by product name or brand"
          />

          <Select
            className="search-status"
            value={statusFilter}
            aria-label="Filter by status"
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Expiring Soon">Expiring Soon</option>
            <option value="Expired">Expired</option>
          </Select>

          <Select
            className="search-sort"
            value={sort}
            aria-label="Sort warranties"
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
          >
            <option value="expiry_asc">Expiry: Nearest First</option>
            <option value="expiry_desc">Expiry: Furthest First</option>
            <option value="purchase_desc">Purchased: Newest</option>
            <option value="purchase_asc">Purchased: Oldest</option>
            <option value="name_asc">Name: A - Z</option>
            <option value="name_desc">Name: Z - A</option>
          </Select>

          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
      </Card>

      <Card className="card-flat">
        {loading ? (
          <Spinner />
        ) : warranties.length === 0 ? (
          <div className="empty-state">
            <p>
              No warranties yet, add your first one to get started!
            </p>
            <Link to="/warranties/new" className="button button-primary">
              Register Warranty
            </Link>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="warranty-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Brand / Model</th>
                  <th>Purchased</th>
                  <th>Expiry Date</th>
                  <th>Status</th>
                  <th>Remaining</th>
                  <th className="table-action">Action</th>
                </tr>
              </thead>
              <tbody>
                {warranties.map((w) => (
                  <tr key={w._id}>
                    <td>
                      <Link to={`/warranties/${w._id}`}>{w.productName}</Link>
                    </td>
                    <td className="text-secondary">
                      {w.brand || '—'} {w.model ? `(${w.model})` : ''}
                    </td>
                    <td className="text-secondary">
                      {new Date(w.purchaseDate).toLocaleDateString()}
                    </td>
                    <td>
                      {new Date(w.expiryDate).toLocaleDateString()}
                    </td>
                    <td>
                      <StatusBadge status={w.status} />
                    </td>
                    <td>
                      {w.daysRemaining >= 0 ? (
                        <span className={`remaining-${w.daysRemaining <= 30 ? 'expiring' : 'active'}`}>
                          {w.daysRemaining} day{w.daysRemaining === 1 ? '' : 's'}
                        </span>
                      ) : (
                        <span className="remaining-expired">
                          Ended {Math.abs(w.daysRemaining)}d ago
                        </span>
                      )}
                    </td>
                    <td className="table-action">
                      <Link
                        to={`/warranties/${w._id}`}
                        className="button button-secondary button-small"
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
      </Card>

      {totalPages > 1 && (
        <div className="pagination">
          <Button
            variant="secondary"
            size="small"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="pagination-label">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="secondary"
            size="small"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
