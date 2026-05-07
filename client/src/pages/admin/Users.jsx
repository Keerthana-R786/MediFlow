import React, { useEffect, useState } from 'react';
import { UserPlus, Edit, UserX } from 'lucide-react';
import { useForm } from 'react-hook-form';
import PageWrapper from '../../components/layout/PageWrapper';
import Button from '../../components/common/Button';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import EmptyState from '../../components/common/EmptyState';
import { SkeletonRow } from '../../components/common/Skeleton';
import { useToast } from '../../hooks/useToast';
import api from '../../services/api';
import { formatDate } from '../../utils/formatDate';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const toast = useToast();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  const fetchUsers = () => {
    api.get('/admin/users')
      .then((r) => setUsers(r.data.data.users || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(fetchUsers, []);

  const onSubmit = async (data) => {
    try {
      await api.post('/admin/users', data);
      toast.success('User created');
      setShowModal(false);
      reset();
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    }
  };

  const deactivate = async (id) => {
    if (!confirm('Deactivate this user?')) return;
    await api.delete(`/admin/users/${id}`);
    toast.success('User deactivated');
    fetchUsers();
  };

  return (
    <PageWrapper>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[20px] font-medium text-[#0F172A]">Users</h1>
        <Button onClick={() => setShowModal(true)}>
          <UserPlus size={16} /> Add User
        </Button>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-[12px] overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#F8FAFC] border-b border-[#F1F5F9]">
            <tr>
              <th className="text-left px-4 py-3 text-[11px] font-medium text-[#94A3B8] uppercase tracking-wide">Name</th>
              <th className="text-left px-4 py-3 text-[11px] font-medium text-[#94A3B8] uppercase tracking-wide">Role</th>
              <th className="text-left px-4 py-3 text-[11px] font-medium text-[#94A3B8] uppercase tracking-wide">Email</th>
              <th className="text-left px-4 py-3 text-[11px] font-medium text-[#94A3B8] uppercase tracking-wide">Status</th>
              <th className="text-left px-4 py-3 text-[11px] font-medium text-[#94A3B8] uppercase tracking-wide">Joined</th>
              <th className="text-right px-4 py-3 text-[11px] font-medium text-[#94A3B8] uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <tr key={i}><td colSpan={6}><SkeletonRow /></td></tr>)
            ) : users.length === 0 ? (
              <tr><td colSpan={6}><EmptyState title="No users" /></td></tr>
            ) : (
              users.map((u) => (
                <tr key={u._id} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={`${u.firstName} ${u.lastName}`} size="sm" />
                      <span className="text-[13px] font-medium text-[#0F172A]">{u.firstName} {u.lastName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[12px] px-2 py-0.5 bg-[#F1F5F9] text-[#475569] rounded-[4px] capitalize">{u.role}</span>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-[#475569]">{u.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant={u.isActive ? 'success' : 'default'}>{u.isActive ? 'Active' : 'Inactive'}</Badge>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-[#94A3B8]">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="ghost"><Edit size={14} /></Button>
                      {u.isActive && (
                        <Button size="sm" variant="ghost" onClick={() => deactivate(u._id)}>
                          <UserX size={14} />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add User">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="First name" error={errors.firstName?.message} {...register('firstName', { required: 'Required' })} />
            <Input label="Last name"  error={errors.lastName?.message}  {...register('lastName',  { required: 'Required' })} />
          </div>
          <Input label="Email" type="email" error={errors.email?.message} {...register('email', { required: 'Required' })} />
          <Input label="Password" type="password" error={errors.password?.message} {...register('password', { required: 'Required', minLength: { value: 8, message: 'Min 8 chars' } })} />
          <Input label="Phone" type="tel" {...register('phone')} />
          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium text-[#334155]">Role</label>
            <select className="h-10 px-3 rounded-[8px] border border-[#E2E8F0] bg-white text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]" {...register('role', { required: 'Required' })}>
              <option value="">Select role</option>
              <option value="doctor">Doctor</option>
              <option value="receptionist">Receptionist</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
            <Button type="submit" loading={isSubmitting} className="flex-1">Create User</Button>
          </div>
        </form>
      </Modal>
    </PageWrapper>
  );
};

export default AdminUsers;
