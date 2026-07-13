import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePositions } from '../hooks/usePositions';
import { useAuthStore } from '../store/authStore';
import { Layout } from "../components/Layout";
import { PageHeader, Card, Spinner, EmptyState, Button, Input, Select } from '../components/ui';
import { StatusBadge } from '../components/StatusBadge';
import { formatDate } from '../utils/constants';
import type { PositionStatus } from '../types/models';

const STATUSES: (PositionStatus | 'ALL')[] = ['ALL', 'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'ON_HOLD', 'POSTED', 'FILLED', 'REJECTED', 'COLLAPSED'];

export function PositionsPage() {
  const { data: positions, isLoading } = usePositions();
  const user = useAuthStore(s => s.user);
  const role = user?.role ?? 'HM';
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<PositionStatus | 'ALL'>('ALL');

  const filtered = (positions ?? []).filter(p => {
    if (status !== 'ALL' && p.status !== status) return false;
    if (q && !`${p.jobTitle} ${p.costCentre} ${p.raisedByName ?? ''}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <Layout>
      <PageHeader
        title="Positions"
        subtitle={role === 'HM' ? 'Positions you have raised' : 'All positions'}
        actions={role === 'HM' && <Link to="/raise"><Button variant="primary">Raise Position</Button></Link>}
      />

      <Card className="p-4 mb-4">
        <div className="grid md:grid-cols-2 gap-3">
          <Input label="Search" placeholder="Search title, cost centre, raiser…" value={q} onChange={e => setQ(e.target.value)} />
          <Select value={status} onChange={e => setStatus(e.target.value as PositionStatus | 'ALL')} label="Filter by status">
            {STATUSES.map(s => <option key={s} value={s}>{s === 'ALL' ? 'All statuses' : s.replace(/_/g, ' ')}</option>)}
          </Select>
        </div>
      </Card>

      <Card>
        {isLoading ? <Spinner /> : !filtered.length ? (
          <EmptyState title="No positions found" hint="Try adjusting your filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Title</th>
                  <th className="text-left px-4 py-3 font-medium">Type</th>
                  <th className="text-left px-4 py-3 font-medium">Cost Centre</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Raised By</th>
                  <th className="text-left px-4 py-3 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link to={`/positions/${p.id}`} className="font-medium text-brand-700 hover:underline">
                        {p.jobTitle || 'Untitled'}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{p.positionType === 'NEW_HIRE' ? 'New Hire' : 'Replacement'}</td>
                    <td className="px-4 py-3 text-slate-600">{p.costCentre}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-3 text-slate-600">{p.raisedByName ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(p.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </Layout>
  );
}
