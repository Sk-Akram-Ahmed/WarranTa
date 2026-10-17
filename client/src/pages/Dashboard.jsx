import React, { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/axiosInstance';
import StatusBadge from '../components/StatusBadge';
import Button from '../components/Button';
import Card from '../components/Card';
import Input, { Select } from '../components/Input';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import ProgressBar from '../components/ProgressBar';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';

const Icon = ({ name }) => {
  const icons = { total: <><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/></>, active: <><path d="m5 12 4 4L19 6"/></>, soon: <><circle cx="12" cy="12" r="8"/><path d="M12 8v5l3 2"/></>, expired: <><circle cx="12" cy="12" r="8"/><path d="m9 9 6 6m0-6-6 6"/></>, product: <><rect x="5" y="5" width="14" height="14" rx="3"/><path d="M9 9h6v6H9z"/></>, grid: <><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></>, list: <><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/></> };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icons[name]}</svg>;
};

const formatDate = (value) => new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
const formatPrice = (value) => value ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value) : null;
const toStatusKey = (status) => status === 'Expiring Soon' ? 'expiring' : status === 'Expired' ? 'expired' : 'active';
const warrantyProgress = (warranty) => {
  const purchase = new Date(warranty.purchaseDate).getTime(); const expiry = new Date(warranty.expiryDate).getTime();
  return Math.max(0, Math.min(100, ((Date.now() - purchase) / (expiry - purchase || 1)) * 100));
};

const WarrantyCard = ({ warranty }) => <Link to={`/warranties/${warranty._id}`} className={`warranty-card${warranty.status === 'Expired' ? ' warranty-card-expired' : ''}`}>
  <div className="warranty-card-top"><span className="product-icon"><Icon name="product" /></span><StatusBadge status={warranty.status} /></div>
  <div><h3>{warranty.productName}</h3><p>{[warranty.brand, warranty.model].filter(Boolean).join(' · ') || 'Product warranty'}</p></div>
  <div className="warranty-dates"><span>Purchased <strong>{formatDate(warranty.purchaseDate)}</strong></span><span>Expires <strong>{formatDate(warranty.expiryDate)}</strong></span></div>
  <ProgressBar value={warrantyProgress(warranty)} status={toStatusKey(warranty.status)} label={`${warranty.productName} warranty elapsed`} />
  <div className="warranty-card-footer"><span className={`remaining-${toStatusKey(warranty.status)}`}>{warranty.daysRemaining >= 0 ? `${warranty.daysRemaining} days left` : `Expired ${Math.abs(warranty.daysRemaining)} days ago`}</span>{formatPrice(warranty.price) && <span>{formatPrice(warranty.price)}</span>}</div>
</Link>;

const Dashboard = () => {
  const { user } = useAuth(); const { showToast } = useToast(); const [searchParams] = useSearchParams();
  const [stats, setStats] = useState({ total: 0, active: 0, expiringSoon: 0, expired: 0 });
  const [warranties, setWarranties] = useState([]); const [attention, setAttention] = useState([]);
  const [loading, setLoading] = useState(true); const [statsLoading, setStatsLoading] = useState(true); const [error, setError] = useState(false);
  const [search, setSearch] = useState(searchParams.get('search') || ''); const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(''); const [sort, setSort] = useState('expiry_asc'); const [page, setPage] = useState(1); const [total, setTotal] = useState(0); const [totalPages, setTotalPages] = useState(1);
  const [view, setView] = useState(() => localStorage.getItem('warranty-view') || 'grid');

  useEffect(() => { const timer = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300); return () => clearTimeout(timer); }, [search]);
  useEffect(() => { localStorage.setItem('warranty-view', view); }, [view]);
  const fetchStats = useCallback(async () => { try { const res = await api.get('/warranties/stats'); setStats(res.data.stats); } catch { showToast('Could not fetch warranty statistics', 'error'); } finally { setStatsLoading(false); } }, [showToast]);
  const fetchAttention = useCallback(async () => { try { const res = await api.get('/warranties?page=1&limit=4&sort=expiry_asc&status=Expiring%20Soon'); setAttention(res.data.data); } catch { /* Main error state covers actionable retry. */ } }, []);
  const fetchWarranties = useCallback(async () => { setLoading(true); setError(false); try { const params = new URLSearchParams({ page: String(page), limit: '12', sort }); if (debouncedSearch.trim()) params.append('search', debouncedSearch.trim()); if (statusFilter) params.append('status', statusFilter); const res = await api.get(`/warranties?${params}`); setWarranties(res.data.data); setTotal(res.data.pagination.total); setTotalPages(res.data.pagination.totalPages); } catch { setError(true); showToast('Failed to load warranties', 'error'); } finally { setLoading(false); } }, [page, debouncedSearch, statusFilter, sort, showToast]);
  useEffect(() => { fetchStats(); fetchAttention(); }, [fetchStats, fetchAttention]);
  useEffect(() => { fetchWarranties(); }, [fetchWarranties]);
  const activeFilters = Boolean(search || statusFilter || sort !== 'expiry_asc');
  const clearFilters = () => { setSearch(''); setStatusFilter(''); setSort('expiry_asc'); setPage(1); };
  const statCards = [{ key: '', label: 'All warranties', value: stats.total, icon: 'total', className: 'total' }, { key: 'Active', label: 'Active', value: stats.active, icon: 'active', className: 'active' }, { key: 'Expiring Soon', label: 'Expiring soon', value: stats.expiringSoon, icon: 'soon', className: 'expiring' }, { key: 'Expired', label: 'Expired', value: stats.expired, icon: 'expired', className: 'expired' }];

  return <div className="container dashboard-page">
    <header className="dashboard-header"><div><p className="eyebrow">Your coverage at a glance</p><h1>Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0] || 'there'}.</h1><p className="page-description">{stats.total ? `${stats.active} active warranties, with ${stats.expiringSoon} needing attention.` : 'Keep every purchase and warranty in one calm place.'}</p></div><Link to="/warranties/new" className="button button-primary">+ Add warranty</Link></header>
    <section className="dashboard-stats" aria-label="Warranty statistics">{statCards.map((stat) => <button key={stat.label} type="button" className={`dashboard-stat stat-${stat.className}${statusFilter === stat.key ? ' selected' : ''}`} onClick={() => { setStatusFilter(stat.key); setPage(1); }} aria-pressed={statusFilter === stat.key}><span className="stat-icon"><Icon name={stat.icon} /></span><span><strong>{statsLoading ? '—' : stat.value}</strong><small>{stat.label}</small></span></button>)}</section>
    {attention.length > 0 && <section className="attention-section"><div className="section-heading"><div><p className="eyebrow">Don’t miss these</p><h2>Needs attention</h2></div><button type="button" className="text-button" onClick={() => { setStatusFilter('Expiring Soon'); setPage(1); }}>View all</button></div><div className="attention-grid">{attention.map((warranty) => <Link to={`/warranties/${warranty._id}`} key={warranty._id} className="attention-card"><span className="product-icon"><Icon name="product" /></span><span><strong>{warranty.productName}</strong><small>Expires {formatDate(warranty.expiryDate)}</small></span><StatusBadge status={warranty.status} /></Link>)}</div></section>}
    <section className="warranties-section"><div className="section-heading"><div><p className="eyebrow">Your collection</p><h2>All warranties</h2></div><div className="view-toggle" aria-label="View options"><button type="button" className={view === 'grid' ? 'active' : ''} onClick={() => setView('grid')} aria-label="Grid view" aria-pressed={view === 'grid'}><Icon name="grid" /></button><button type="button" className={view === 'list' ? 'active' : ''} onClick={() => setView('list')} aria-label="List view" aria-pressed={view === 'list'}><Icon name="list" /></button></div></div>
      <Card className="dashboard-toolbar"><Input value={search} onChange={(event) => setSearch(event.target.value)} type="search" placeholder="Search product or brand" aria-label="Search warranties" /><Select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} aria-label="Filter by status"><option value="">All statuses</option><option value="Active">Active</option><option value="Expiring Soon">Expiring soon</option><option value="Expired">Expired</option></Select><Select value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }} aria-label="Sort warranties"><option value="expiry_asc">Expiry: nearest first</option><option value="expiry_desc">Expiry: furthest first</option><option value="purchase_desc">Purchased: newest</option><option value="purchase_asc">Purchased: oldest</option><option value="name_asc">Name: A–Z</option></Select></Card>
      <div className="results-meta"><span>{loading ? 'Loading warranties…' : `${total} ${total === 1 ? 'warranty' : 'warranties'}`}</span>{activeFilters && <button className="text-button" type="button" onClick={clearFilters}>Clear filters</button>}</div>
      {loading ? <div className="warranty-grid">{Array.from({ length: 6 }, (_, index) => <Card key={index} className="warranty-card-skeleton"><Skeleton /><Skeleton /><Skeleton /></Card>)}</div> : error ? <ErrorState onRetry={fetchWarranties} /> : warranties.length === 0 ? <EmptyState title="No warranties found" description={activeFilters ? 'Try clearing a filter or searching for something else.' : 'Add your first warranty to start tracking coverage.'} action={!activeFilters && <Link to="/warranties/new" className="button button-primary">Add warranty</Link>} /> : view === 'grid' ? <div className="warranty-grid">{warranties.map((warranty) => <WarrantyCard key={warranty._id} warranty={warranty} />)}</div> : <Card className="card-flat list-card"><div className="table-wrap"><table className="warranty-table"><thead><tr><th>Product</th><th>Purchased</th><th>Expiry</th><th>Status</th><th>Remaining</th><th /></tr></thead><tbody>{warranties.map((warranty) => <tr key={warranty._id}><td data-label="Product"><Link to={`/warranties/${warranty._id}`}>{warranty.productName}</Link><small>{[warranty.brand, warranty.model].filter(Boolean).join(' · ')}</small></td><td data-label="Purchased">{formatDate(warranty.purchaseDate)}</td><td data-label="Expiry">{formatDate(warranty.expiryDate)}</td><td data-label="Status"><StatusBadge status={warranty.status} /></td><td data-label="Remaining" className={`remaining-${toStatusKey(warranty.status)}`}>{warranty.daysRemaining >= 0 ? `${warranty.daysRemaining} days` : `Expired ${Math.abs(warranty.daysRemaining)}d ago`}</td><td><Link to={`/warranties/${warranty._id}`} className="table-view-link">View</Link></td></tr>)}</tbody></table></div></Card>}
      {totalPages > 1 && <div className="pagination"><Button variant="secondary" size="small" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1}>Previous</Button><span className="pagination-label">Page {page} of {totalPages}</span><Button variant="secondary" size="small" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages}>Next</Button></div>}
    </section>
  </div>;
};
export default Dashboard;
