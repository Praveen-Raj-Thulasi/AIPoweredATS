import React, { useState, useEffect } from 'react';
import { Users, Building, FileText } from 'lucide-react';
import { User, Organization, AuditLog } from '@ats/shared';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { PageHeader } from '../ui/PageHeader';
import { api } from '../../services/api';
import { ConfirmationModal } from '../ui/ConfirmationModal';

export const AdminPortal: React.FC = () => {
  const [overview, setOverview] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'orgs' | 'audit'>('overview');
  const [userToToggle, setUserToToggle] = useState<User | null>(null);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);

  const loadData = async () => {
    try {
      const [ov, u, o, logs] = await Promise.all([
        api.getAdminOverview(),
        api.getAdminUsers(),
        api.getAdminOrganizations(),
        api.getAuditLogs(),
      ]);
      setOverview(ov);
      setUsers(u);
      setOrganizations(o);
      setAuditLogs(logs);
    } catch (err) {
      console.error('Error loading admin data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleConfirmToggleStatus = async () => {
    if (!userToToggle) return;
    setIsUpdatingUser(true);
    const newStatus = userToToggle.status === 'active' ? 'suspended' : 'active';
    try {
      await api.updateUserStatus(userToToggle.id, newStatus);
      setUsers((prev) =>
        prev.map((u) => (u.id === userToToggle.id ? { ...u, status: newStatus as any } : u))
      );
      setUserToToggle(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingUser(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header Banner */}
      <PageHeader
        title="System Administration"
        description="Platform governance, cross-organization tenant management, immutable security audit logs, and user access control."
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono text-zinc-400 border border-zinc-800 bg-zinc-900/40">
            SYSTEM ADMIN
          </span>
        }
      />

      {/* Tabs */}
      <div className="flex border-b border-zinc-850 gap-6 text-xs font-mono overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 transition-colors relative shrink-0 ${
            activeTab === 'overview'
              ? 'text-white active-tab-underline font-semibold'
              : 'text-zinc-500 hover:text-white'
          }`}
        >
          System Overview
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 transition-colors relative shrink-0 ${
            activeTab === 'users'
              ? 'text-white active-tab-underline font-semibold'
              : 'text-zinc-500 hover:text-white'
          }`}
        >
          All Users ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('orgs')}
          className={`pb-3 transition-colors relative shrink-0 ${
            activeTab === 'orgs'
              ? 'text-white active-tab-underline font-semibold'
              : 'text-zinc-500 hover:text-white'
          }`}
        >
          Organizations ({organizations.length})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 transition-colors relative shrink-0 ${
            activeTab === 'audit'
              ? 'text-white active-tab-underline font-semibold'
              : 'text-zinc-500 hover:text-white'
          }`}
        >
          Audit Logs ({auditLogs.length})
        </button>
      </div>


      {/* Overview Tab */}
      {activeTab === 'overview' && overview && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-white">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-zinc-400 font-mono">Total Users</p>
                <p className="text-2xl font-bold text-white font-mono mt-0.5">{overview.totalUsers}</p>
              </div>
            </Card>

            <Card className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-white">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-zinc-400 font-mono">Organizations</p>
                <p className="text-2xl font-bold text-white font-mono mt-0.5">{overview.totalOrganizations}</p>
              </div>
            </Card>

            <Card className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-white">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-zinc-400 font-mono">Active Jobs</p>
                <p className="text-2xl font-bold text-white font-mono mt-0.5">{overview.totalJobs}</p>
              </div>
            </Card>

            <Card className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-white">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-zinc-400 font-mono">Applications</p>
                <p className="text-2xl font-bold text-white font-mono mt-0.5">{overview.totalApplications}</p>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900/40 border-b border-zinc-800/80 text-zinc-400 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="py-3 px-5">User</th>
                  <th className="py-3 px-5">Role</th>
                  <th className="py-3 px-5">Organization</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850/60">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-900/30 transition-colors">
                    <td className="py-4 px-5">
                      <p className="font-semibold text-white">
                        {u.firstName} {u.lastName}
                      </p>
                      <p className="text-[11px] text-zinc-500 font-mono">{u.email}</p>
                    </td>
                    <td className="py-4 px-5">
                      <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-300 uppercase">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-zinc-400">
                      {u.organizationId || 'None (Candidate)'}
                    </td>
                    <td className="py-4 px-5">
                      <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-300 uppercase">
                        {u.status}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right">
                      {u.role !== 'admin' && (
                        <Button
                          variant={u.status === 'active' ? 'secondary' : 'primary'}
                          size="sm"
                          onClick={() => setUserToToggle(u)}
                        >
                          {u.status === 'active' ? 'Suspend' : 'Activate'}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Organizations Tab */}
      {activeTab === 'orgs' && (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900/40 border-b border-zinc-800/80 text-zinc-400 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="py-3 px-5">Organization</th>
                  <th className="py-3 px-5">Slug</th>
                  <th className="py-3 px-5">Plan</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850/60">
                {organizations.map((org) => (
                  <tr key={org.id} className="hover:bg-zinc-900/30 transition-colors">
                    <td className="py-4 px-5 font-semibold text-white">{org.name}</td>
                    <td className="py-4 px-5 font-mono text-zinc-400">{org.slug}</td>
                    <td className="py-4 px-5">
                      <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-300 uppercase">
                        {org.plan}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-300 uppercase">
                        {org.status}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-zinc-500 font-mono">
                      {new Date(org.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Audit Logs Tab */}
      {activeTab === 'audit' && (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900/40 border-b border-zinc-800/80 text-zinc-400 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="py-3 px-5">Event Action</th>
                  <th className="py-3 px-5">User</th>
                  <th className="py-3 px-5">Resource</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850/60">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-900/30 transition-colors">
                    <td className="py-4 px-5 font-mono font-semibold text-white">
                      {log.action}
                    </td>
                    <td className="py-4 px-5 text-zinc-300">{log.userEmail || 'System'}</td>
                    <td className="py-4 px-5 text-zinc-400">{log.resource}</td>
                    <td className="py-4 px-5">
                      <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-300 uppercase">
                        {log.status}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-zinc-500 font-mono">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!userToToggle}
        onClose={() => setUserToToggle(null)}
        onConfirm={handleConfirmToggleStatus}
        title={userToToggle?.status === 'active' ? 'Suspend User Access?' : 'Activate User Access?'}
        message={
          userToToggle?.status === 'active'
            ? `Are you sure you want to suspend ${userToToggle.firstName} ${userToToggle.lastName} (${userToToggle.email})? They will immediately lose access to the platform and their active sessions will be invalidated.`
            : `Are you sure you want to activate ${userToToggle?.firstName} ${userToToggle?.lastName}?`
        }
        confirmLabel={userToToggle?.status === 'active' ? 'Suspend User' : 'Activate User'}
        variant={userToToggle?.status === 'active' ? 'danger' : 'default'}
        isLoading={isUpdatingUser}
      />
    </div>
  );
};


