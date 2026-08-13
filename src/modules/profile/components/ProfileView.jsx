import React, { useState, useEffect } from 'react';
import { useStore } from '@/context/store-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmployeeAvatar } from './EmployeeAvatar';
import { AddRemarkModal } from '@/modules/remarks/components/AddRemarkModal';
import { Mail, Phone, MapPin, Award, Plus, Pencil, Trash2 } from 'lucide-react';
import { AnimatedNumber } from '@/components/motion/animated-number';

import { isRemarkForEmployee } from '@/modules/remarks/services/remarkService';

export const ProfileView = () => {
  const { currentUser, remarks, activeRole, deleteRemark, notifications, dismissNotification } = useStore();
  const [isRemarkModalOpen, setIsRemarkModalOpen] = useState(false);
  const [editingRemark, setEditingRemark] = useState(null);

  // Auto-clear remark notifications once the employee checks their profile
  useEffect(() => {
    if (activeRole !== 'ADMIN' && currentUser && notifications?.length > 0) {
      notifications.forEach(n => {
        const titleLower = (n.title || '').toLowerCase();
        const descLower = (n.message || '').toLowerCase();
        if (titleLower.includes('remark') || descLower.includes('remark') || n.category === 'REMARK') {
          dismissNotification(n.id);
        }
      });
    }
  }, [currentUser, activeRole, notifications]);

  if (!currentUser) return null;

  const myRemarks = remarks.filter(r => isRemarkForEmployee(r, currentUser)).slice(0, 2);

  const handleOpenAddRemark = () => {
    setEditingRemark(null);
    setIsRemarkModalOpen(true);
  };

  const handleOpenEditRemark = (remark) => {
    setEditingRemark(remark);
    setIsRemarkModalOpen(true);
  };

  const handleDeleteRemark = (remarkId) => {
    deleteRemark(remarkId);
  };

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="relative group">
              <EmployeeAvatar
                src={currentUser.card_image || currentUser.avatar}
                name={currentUser.name}
                employee={currentUser}
                size="xl"
              />
            </div>

            <div className="space-y-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">{currentUser.name}</h2>
                <Badge variant="outline" className="font-mono text-xs">
                  {currentUser.role}
                </Badge>
              </div>
              <p className="text-xs text-neutral-500">{currentUser.designation} • {currentUser.department}</p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-neutral-400 font-mono pt-0.5">
                <span>ID: {currentUser.employeeId}</span>
                <span>•</span>
                <span>Joined: {currentUser.joiningDate}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
        <Card className="h-full flex flex-col justify-between">
          <CardHeader>
            <CardTitle>Personal &amp; Employment Details</CardTitle>
            <CardDescription>Official Spirit Data Solutions employee profile ledger</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 text-xs flex-1 flex flex-col justify-center">
            <div className="flex justify-between py-2 border-b border-neutral-100 dark:border-neutral-800/80">
              <span className="text-neutral-500">Corporate Email:</span>
              <span className="font-medium text-neutral-900 dark:text-white flex items-center gap-1.5 font-mono">
                <Mail className="w-3.5 h-3.5 text-neutral-400" /> {currentUser.email}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-neutral-100 dark:border-neutral-800/80">
              <span className="text-neutral-500">Contact Phone:</span>
              <span className="font-medium text-neutral-900 dark:text-white flex items-center gap-1.5 font-mono">
                <Phone className="w-3.5 h-3.5 text-neutral-400" /> {currentUser.phone}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-neutral-100 dark:border-neutral-800/80">
              <span className="text-neutral-500">Reporting Manager:</span>
              <span className="font-semibold text-neutral-900 dark:text-white">{currentUser.manager}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-neutral-100 dark:border-neutral-800/80">
              <span className="text-neutral-500">Assigned Geofence Radius:</span>
              <span className="font-semibold text-neutral-900 dark:text-white flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-neutral-400" /> <AnimatedNumber value={currentUser?.officeLocation?.radiusMeters ?? 20} />m
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="h-full flex flex-col justify-between">
          <CardHeader>
            <CardTitle>Leave Balance Quotas (2026)</CardTitle>
            <CardDescription>Your remaining approved leave balances</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center">
            <div className="grid grid-cols-3 gap-3 text-center my-auto">
              <div className="p-3.5 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                <span className="text-[10px] text-neutral-400 font-mono uppercase block">Casual</span>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1"><AnimatedNumber value={currentUser?.leaveBalance?.casual ?? 12} /></p>
                <span className="text-[10px] text-neutral-400">days</span>
              </div>
              <div className="p-3.5 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                <span className="text-[10px] text-neutral-400 font-mono uppercase block">Sick</span>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1"><AnimatedNumber value={currentUser?.leaveBalance?.sick ?? 12} /></p>
                <span className="text-[10px] text-neutral-400">days</span>
              </div>
              <div className="p-3.5 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                <span className="text-[10px] text-neutral-400 font-mono uppercase block">Emergency</span>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1"><AnimatedNumber value={currentUser?.leaveBalance?.emergency ?? currentUser?.leaveBalance?.annual ?? 10} /></p>
                <span className="text-[10px] text-neutral-400">days</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-4 h-4 text-neutral-400" /> Performance Remarks
              </CardTitle>
              <CardDescription>
                {activeRole === 'ADMIN' ? 'Official manager feedback entries (Admin can add & edit)' : 'Official manager performance remarks log (Read-Only)'}
              </CardDescription>
            </div>
            {activeRole === 'ADMIN' && (
              <Button onClick={handleOpenAddRemark} size="sm" variant="outline">
                <Plus className="w-3.5 h-3.5" /> Add Remark ({myRemarks.length}/2)
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {myRemarks.length > 0 ? (
              myRemarks.map(r => (
                <div key={r.id} className="p-3.5 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {r.category}
                      </Badge>
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">Written by: {r.authorName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-neutral-400">{new Date(r.createdAt).toLocaleString()}</span>
                      {activeRole === 'ADMIN' && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditRemark(r)}
                            className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                            title="Edit Remark"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRemark(r.id)}
                            className="p-1 text-rose-400 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                            title="Delete Remark"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                    "{r.content}"
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-xs text-neutral-400">No performance remarks recorded yet.</div>
            )}
          </div>
        </CardContent>
      </Card>

      <AddRemarkModal
        isOpen={isRemarkModalOpen}
        onClose={() => setIsRemarkModalOpen(false)}
        employeeId={currentUser.employeeId}
        employeeName={currentUser.name}
        editingRemark={editingRemark}
      />

    </div>
  );
};
