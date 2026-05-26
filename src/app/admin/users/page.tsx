"use client";

import { useState, useEffect } from "react";
import * as LucideIcons from "lucide-react";

const {
  Shield,
  UserPlus,
  Key,
  UserCheck,
  UserX,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  X,
  ShieldAlert,
  History,
  Activity,
  Info,
  Check,
  Plus,
  Edit,
  Clock,
  Laptop
} = LucideIcons;

interface Department {
  id: number;
  name: string;
  code: string;
  description: string | null;
}

interface Staff {
  staff_id: number;
  name: string;
  mobile: string;
  email: string;
  role: string;
  permissions: string;
  status: string;
  department_id: number | null;
  department: Department | null;
}

interface AuditLog {
  log_id: number;
  timestamp: string;
  user_name: string;
  action: string;
  description: string;
  linked_id: string | null;
}

interface LoginActivity {
  id: number;
  timestamp: string;
  mobile: string | null;
  ip_address: string | null;
  user_agent: string | null;
  status: string;
  failure_reason: string | null;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<Staff[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loginActivities, setLoginActivities] = useState<LoginActivity[]>([]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  const [isLoading, setIsLoading] = useState(true);
  const [isLogsLoading, setIsLogsLoading] = useState(false);
  const [isActivityLoading, setIsActivityLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [isActivityDrawerOpen, setIsActivityDrawerOpen] = useState(false);
  const [isAuditLogsDrawerOpen, setIsAuditLogsDrawerOpen] = useState(false);

  // Selected records
  const [selectedUser, setSelectedUser] = useState<Staff | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    password: "",
    role: "SALES",
    departmentCode: "SALES",
    permissions: ""
  });

  const [editFormData, setEditFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    role: "SALES",
    departmentCode: "SALES",
    permissions: "",
    status: "active"
  });

  const [newPassword, setNewPassword] = useState("");

  // Available permissions options
  const permissionOptions = [
    { code: "view_overview", label: "Overview Dashboard" },
    { code: "view_buyers", label: "Access B2B Buyers" },
    { code: "manage_buyers", label: "Manage Buyers (Edit/Verify)" },
    { code: "view_leads", label: "Access Leads Pipeline" },
    { code: "manage_leads", label: "Manage Leads CRM" },
    { code: "view_stock", label: "Access SKU Stock" },
    { code: "manage_stock", label: "Fabric Entry & QC" },
    { code: "view_orders", label: "Access Sales Orders" },
    { code: "manage_orders", label: "Log/Approve Orders" },
    { code: "view_cashflow", label: "Access Cash Ledger" },
    { code: "manage_cashflow", label: "Manage Income/Payouts" },
    { code: "view_whatsapp", label: "Access WhatsApp sandbox" },
    { code: "manage_whatsapp", label: "Broadcast WhatsApp API" },
    { code: "view_technical", label: "Access APIs & AI rules" },
    { code: "manage_users", label: "Manage Staff RBAC" }
  ];

  // Default permissions mapping per role/department code
  const presetPermissions: Record<string, string[]> = {
    FOUNDER: permissionOptions.map(p => p.code),
    ADMIN: permissionOptions.map(p => p.code),
    SALES: ["view_orders", "manage_orders", "view_buyers", "manage_buyers", "view_leads", "manage_leads", "view_whatsapp", "manage_whatsapp"],
    ACCOUNTS: ["view_cashflow", "manage_cashflow", "view_orders"],
    INVENTORY: ["view_stock", "manage_stock", "view_orders"],
    TECHNICAL: ["view_whatsapp", "manage_whatsapp", "view_stock", "view_technical"],
    PURCHASE: ["view_stock", "manage_stock", "view_orders"],
    PRICING: ["view_stock"],
    CONTENT: ["view_stock", "view_whatsapp"],
    MARKETING: ["view_leads", "view_whatsapp", "view_buyers"],
    BUYER_HUNTING: ["view_leads", "view_whatsapp"],
    LOGISTICS: ["view_orders", "view_stock"],
    FIELD_BOY: ["view_orders"]
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const url = new URL("/api/admin/users", window.location.origin);
      if (roleFilter) url.searchParams.set("role", roleFilter);
      if (statusFilter) url.searchParams.set("status", statusFilter);

      const res = await fetch(url.toString());
      const data = await res.json();

      if (data.success) {
        setUsers(data.users);
      } else {
        setErrorMessage(data.error || "Failed to load employees list.");
      }
    } catch (err) {
      setErrorMessage("Network issue. Could not connect to API.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    setIsLogsLoading(true);
    try {
      const res = await fetch("/api/admin/audit-logs");
      const data = await res.json();
      if (data.success) {
        setAuditLogs(data.auditLogs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLogsLoading(false);
    }
  };

  const fetchUserActivity = async (id: number) => {
    setIsActivityLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${id}/activity`);
      const data = await res.json();
      if (data.success) {
        setLoginActivities(data.activities);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsActivityLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (data.success) {
        setSuccessMessage(`Employee login created successfully for ${formData.name}!`);
        setIsCreateModalOpen(false);
        // Reset form
        setFormData({
          name: "",
          mobile: "",
          email: "",
          password: "",
          role: "SALES",
          departmentCode: "SALES",
          permissions: ""
        });
        fetchUsers();
      } else {
        setErrorMessage(data.error || "Failed to create employee login.");
      }
    } catch (err) {
      setErrorMessage("Network error occurred.");
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await fetch(`/api/admin/users/${selectedUser.staff_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData)
      });
      const data = await res.json();

      if (data.success) {
        setSuccessMessage(`Employee ${selectedUser.name} updated successfully!`);
        setIsEditModalOpen(false);
        fetchUsers();
      } else {
        setErrorMessage(data.error || "Failed to update employee.");
      }
    } catch (err) {
      setErrorMessage("Network error occurred.");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await fetch(`/api/admin/users/${selectedUser.staff_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword })
      });
      const data = await res.json();

      if (data.success) {
        setSuccessMessage(`Password reset successfully for ${selectedUser.name}!`);
        setIsResetPasswordOpen(false);
        setNewPassword("");
      } else {
        setErrorMessage(data.error || "Failed to reset password.");
      }
    } catch (err) {
      setErrorMessage("Network error occurred.");
    }
  };

  const handleToggleStatus = async (user: Staff) => {
    setErrorMessage("");
    setSuccessMessage("");
    const newStatus = user.status === "active" ? "inactive" : "active";

    try {
      const res = await fetch(`/api/admin/users/${user.staff_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();

      if (data.success) {
        setSuccessMessage(`Account ${user.name} is now ${newStatus === "active" ? "Activated" : "Blocked"}!`);
        fetchUsers();
      } else {
        setErrorMessage(data.error || "Failed to update status.");
      }
    } catch (err) {
      setErrorMessage("Network error.");
    }
  };

  const handleDeleteUser = async (user: Staff) => {
    if (!confirm(`Are you sure you want to permanently DELETE the employee account of ${user.name}? This cannot be undone.`)) {
      return;
    }
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await fetch(`/api/admin/users/${user.staff_id}`, {
        method: "DELETE"
      });
      const data = await res.json();

      if (data.success) {
        setSuccessMessage(`Permanently deleted employee account for ${user.name}.`);
        fetchUsers();
      } else {
        setErrorMessage(data.error || "Failed to delete account.");
      }
    } catch (err) {
      setErrorMessage("Network error.");
    }
  };

  // Helper: sync presets
  const handlePresetSelect = (roleKey: string, isEditing: boolean) => {
    const list = presetPermissions[roleKey] || [];
    const joined = list.join(",");
    if (isEditing) {
      setEditFormData(prev => ({
        ...prev,
        role: roleKey,
        departmentCode: roleKey,
        permissions: joined
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        role: roleKey,
        departmentCode: roleKey,
        permissions: joined
      }));
    }
  };

  const handlePermissionCheckbox = (code: string, isChecked: boolean, isEditing: boolean) => {
    const currentList = isEditing
      ? (editFormData.permissions ? editFormData.permissions.split(",") : [])
      : (formData.permissions ? formData.permissions.split(",") : []);

    let newList = [...currentList];
    if (isChecked) {
      if (!newList.includes(code)) newList.push(code);
    } else {
      newList = newList.filter(c => c !== code);
    }

    const joined = newList.join(",");
    if (isEditing) {
      setEditFormData(prev => ({ ...prev, permissions: joined }));
    } else {
      setFormData(prev => ({ ...prev, permissions: joined }));
    }
  };

  const openEditModal = (user: Staff) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name,
      mobile: user.mobile,
      email: user.email,
      role: user.role,
      departmentCode: user.department?.code || user.role,
      permissions: user.permissions,
      status: user.status
    });
    setIsEditModalOpen(true);
  };

  const openResetPasswordModal = (user: Staff) => {
    setSelectedUser(user);
    setNewPassword("");
    setIsResetPasswordOpen(true);
  };

  const openActivityLogs = (user: Staff) => {
    setSelectedUser(user);
    fetchUserActivity(user.staff_id);
    setIsActivityDrawerOpen(true);
  };

  const openAuditLogs = () => {
    fetchAuditLogs();
    setIsAuditLogsDrawerOpen(true);
  };

  const filteredUsers = users.filter(user => {
    const q = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(q) ||
      user.mobile.includes(q) ||
      user.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen text-slate-100 font-sans p-2 select-none">
      
      {/* SUCCESS/ERROR NOTIFICATIONS */}
      {successMessage && (
        <div className="fixed bottom-4 right-4 bg-emerald-950 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl shadow-xl shadow-emerald-950/20 z-50 flex items-center gap-2 animate-bounce-short">
          <Check className="w-4 h-4" />
          <span className="text-xs font-bold">{successMessage}</span>
          <button onClick={() => setSuccessMessage("")} className="ml-2 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="fixed bottom-4 right-4 bg-rose-950 border border-rose-500/30 text-rose-400 px-4 py-3 rounded-xl shadow-xl shadow-rose-950/20 z-50 flex items-center gap-2 animate-shake">
          <ShieldAlert className="w-4 h-4" />
          <span className="text-xs font-bold">{errorMessage}</span>
          <button onClick={() => setErrorMessage("")} className="ml-2 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* DASHBOARD HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight uppercase flex items-center gap-2">
            <Shield className="w-6 h-6 text-amber-500 animate-pulse-glow" />
            <span>ROLE-BASED USER MANAGEMENT</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Founder Console to control employee accounts, block permissions, and audit logs.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={openAuditLogs}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-white/5 hover:border-amber-500/20 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-all shadow-lg"
          >
            <History className="w-3.5 h-3.5" />
            <span>System Audit Logs</span>
          </button>
          
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 rounded-xl text-xs font-bold shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 transition-all scale-button"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {/* QUICK METRICS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 backdrop-blur-md">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Accounts</span>
          <span className="text-2xl font-black text-white block mt-1">{users.length}</span>
          <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-3">
            <div className="bg-amber-500 h-full rounded-full w-full"></div>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 backdrop-blur-md">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Active Employees</span>
          <span className="text-2xl font-black text-emerald-400 block mt-1">
            {users.filter(u => u.status === "active").length}
          </span>
          <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-3">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(users.filter(u => u.status === "active").length / Math.max(1, users.length)) * 100}%` }}></div>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 backdrop-blur-md">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Blocked Accounts</span>
          <span className="text-2xl font-black text-rose-500 block mt-1">
            {users.filter(u => u.status === "inactive").length}
          </span>
          <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-3">
            <div className="bg-rose-500 h-full rounded-full" style={{ width: `${(users.filter(u => u.status === "inactive").length / Math.max(1, users.length)) * 100}%` }}></div>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 backdrop-blur-md">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Departments</span>
          <span className="text-2xl font-black text-blue-400 block mt-1">11</span>
          <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-3">
            <div className="bg-blue-500 h-full rounded-full w-full"></div>
          </div>
        </div>
      </div>

      {/* FILTER AND SEARCH BAR */}
      <div className="bg-slate-900/20 border border-white/5 rounded-2xl p-4 mb-6 backdrop-blur-md flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800/80 focus:border-amber-500/30 outline-none rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-slate-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Filter:</span>
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-950 border border-slate-850 hover:border-white/10 outline-none rounded-xl py-1.5 px-3 text-xs text-slate-300 font-semibold cursor-pointer"
          >
            <option value="">All Roles</option>
            <option value="FOUNDER">Founder</option>
            <option value="ADMIN">Admin</option>
            <option value="SALES">Sales Agent</option>
            <option value="ACCOUNTS">Accounts Manager</option>
            <option value="INVENTORY">QC / Inventory</option>
            <option value="TECHNICAL">Technical Engineer</option>
            <option value="PURCHASE">Purchase Team</option>
            <option value="MARKETING">Marketing Team</option>
            <option value="CONTENT">Content Team</option>
            <option value="LOGISTICS">Logistics Team</option>
            <option value="FIELD_BOY">Field Boy Team</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-850 hover:border-white/10 outline-none rounded-xl py-1.5 px-3 text-xs text-slate-300 font-semibold cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive/Blocked</option>
          </select>

          <button
            onClick={() => {
              setSearchQuery("");
              setRoleFilter("");
              setStatusFilter("");
              fetchUsers();
            }}
            className="p-2 bg-slate-950 border border-slate-850 rounded-xl hover:text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* STAFF DATA TABLE */}
      <div className="bg-slate-900/10 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        {isLoading ? (
          <div className="py-24 flex flex-col justify-center items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin"></div>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Loading employee directory...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-20 flex flex-col justify-center items-center gap-2">
            <ShieldAlert className="w-8 h-8 text-slate-600" />
            <span className="text-xs text-slate-400 font-black uppercase tracking-wider">No Employees Found</span>
            <span className="text-[10px] text-slate-500">Refine your search queries or add a new staff member.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-slate-950/40 text-[9px] text-slate-500 font-black uppercase tracking-wider">
                  <th className="py-4 px-6">Proprietary User / Details</th>
                  <th className="py-4 px-4">Role Presets</th>
                  <th className="py-4 px-4">Department Sourcing</th>
                  <th className="py-4 px-4">Auth Clearance</th>
                  <th className="py-4 px-4 text-center">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map((user) => {
                  const isActive = user.status === "active";
                  return (
                    <tr key={user.staff_id} className="hover:bg-white/[0.02] text-slate-300 transition-colors">
                      
                      {/* Name / Contact details */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800/80 flex justify-center items-center font-black text-xs text-amber-500 shadow-md">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white block">{user.name}</span>
                            <span className="text-[10px] text-slate-500 block font-mono mt-0.5">{user.email}</span>
                            <span className="text-[9px] text-slate-400 block font-mono mt-0.5">📞 {user.mobile}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role presets */}
                      <td className="py-4 px-4">
                        <span className={`text-[9px] px-2.5 py-1 rounded-lg border font-black tracking-wider uppercase ${
                          user.role === "FOUNDER" || user.role === "ADMIN"
                            ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                            : "bg-slate-950 border-slate-850 text-slate-400"
                        }`}>
                          {user.role}
                        </span>
                      </td>

                      {/* Department */}
                      <td className="py-4 px-4">
                        <span className="text-[11px] font-bold text-slate-400">
                          {user.department?.name || "Global Admin"}
                        </span>
                        <span className="text-[9px] text-slate-500 block font-mono">
                          Code: {user.department?.code || "GLOBAL"}
                        </span>
                      </td>

                      {/* Auth clearance */}
                      <td className="py-4 px-4 max-w-[200px]">
                        <div className="flex flex-wrap gap-1">
                          {user.permissions ? (
                            user.permissions.split(",").slice(0, 3).map((perm) => (
                              <span key={perm} className="text-[8px] bg-slate-950 border border-slate-850 px-1.5 py-0.5 rounded text-slate-500 font-mono">
                                {perm}
                              </span>
                            ))
                          ) : (
                            <span className="text-[8px] text-slate-600 italic">No permissions set</span>
                          )}
                          {user.permissions && user.permissions.split(",").length > 3 && (
                            <span className="text-[8px] bg-amber-500/10 border border-amber-500/25 px-1 rounded text-amber-400 font-bold font-mono">
                              +{user.permissions.split(",").length - 3} more
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[9px] font-bold uppercase transition-all shadow-md ${
                            isActive
                              ? "bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400"
                              : "bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-500"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-400 animate-ping-slow" : "bg-rose-500"}`}></span>
                          <span>{isActive ? "ACTIVE" : "BLOCKED"}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openActivityLogs(user)}
                            title="Login Logs"
                            className="p-1.5 bg-slate-950 border border-slate-850 text-slate-500 hover:text-white rounded-lg hover:border-slate-800 transition-colors"
                          >
                            <Activity className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => openResetPasswordModal(user)}
                            title="Reset Password"
                            className="p-1.5 bg-slate-950 border border-slate-850 text-slate-500 hover:text-amber-400 rounded-lg hover:border-amber-500/10 transition-colors"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => openEditModal(user)}
                            title="Edit Permissions"
                            className="p-1.5 bg-slate-950 border border-slate-850 text-slate-500 hover:text-blue-400 rounded-lg hover:border-blue-500/10 transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteUser(user)}
                            title="Delete Account"
                            className="p-1.5 bg-slate-950 border border-slate-850 text-slate-500 hover:text-rose-500 rounded-lg hover:border-rose-500/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* POPUP MODAL: CREATE EMPLOYEE LOGIN */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setIsCreateModalOpen(false)}></div>
          <div className="bg-slate-900 border border-white/5 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative z-10 animate-scale-up font-sans">
            
            <header className="p-4 border-b border-white/5 flex justify-between items-center bg-slate-950/40">
              <h2 className="text-sm font-black text-white tracking-wider uppercase flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-amber-500" />
                <span>Onboard Department Employee</span>
              </h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </header>

            <form onSubmit={handleCreateUser} className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[80vh]">
              
              {/* Personal Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Employee Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Anil Kumar"
                    className="bg-slate-950 border border-slate-800/80 focus:border-amber-500/30 outline-none rounded-xl py-2 px-3 text-xs text-white placeholder-slate-600 transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Mobile Number (Login username)</label>
                  <input
                    type="text"
                    required
                    value={formData.mobile}
                    onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
                    placeholder="e.g. 9876543210"
                    className="bg-slate-950 border border-slate-800/80 focus:border-amber-500/30 outline-none rounded-xl py-2 px-3 text-xs text-white placeholder-slate-600 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="e.g. anil@primeapparel.in"
                    className="bg-slate-950 border border-slate-800/80 focus:border-amber-500/30 outline-none rounded-xl py-2 px-3 text-xs text-white placeholder-slate-600 transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Login Password</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Set initial password"
                    className="bg-slate-950 border border-slate-800/80 focus:border-amber-500/30 outline-none rounded-xl py-2 px-3 text-xs text-white placeholder-slate-600 transition-colors"
                  />
                </div>
              </div>

              {/* Department Roles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/5 pt-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Department Role Presets</label>
                  <select
                    value={formData.role}
                    onChange={(e) => handlePresetSelect(e.target.value, false)}
                    className="bg-slate-950 border border-slate-800 focus:border-amber-500/30 outline-none rounded-xl py-2 px-3 text-xs text-slate-300 cursor-pointer"
                  >
                    <option value="SALES">Sales & Follow-up Team</option>
                    <option value="ACCOUNTS">Accounts & Billing Team</option>
                    <option value="INVENTORY">QC & Inventory Team</option>
                    <option value="TECHNICAL">Technical Systems Team</option>
                    <option value="PURCHASE">Purchase Team</option>
                    <option value="PRICING">Pricing & landed Cost Team</option>
                    <option value="CONTENT">Content Creator Team</option>
                    <option value="MARKETING">Marketing & Outreach Team</option>
                    <option value="BUYER_HUNTING">Buyer Hunting Team</option>
                    <option value="LOGISTICS">Logistics Dispatch Team</option>
                    <option value="FIELD_BOY">Field Boy Team</option>
                    <option value="ADMIN">System Administrator</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end gap-1.5">
                  <span className="text-[9px] text-slate-500 font-bold block uppercase">Simulation Sourcing Link</span>
                  <div className="bg-slate-950 border border-slate-850 p-2.5 rounded-xl text-[10px] text-slate-400 font-semibold">
                    Automatically mapped to <span className="text-amber-400 font-bold">{formData.role}</span> presets.
                  </div>
                </div>
              </div>

              {/* Permissions override matrix */}
              <div className="flex flex-col gap-2 border-t border-white/5 pt-4">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Explicit Access Permissions Overrides</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-950 p-4 rounded-xl border border-slate-850">
                  {permissionOptions.map(p => {
                    const currentList = formData.permissions ? formData.permissions.split(",") : [];
                    const isChecked = currentList.includes(p.code);
                    return (
                      <label key={p.code} className="flex items-center gap-2 cursor-pointer p-1 text-[10px] text-slate-400 hover:text-white transition-colors">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handlePermissionCheckbox(p.code, e.target.checked, false)}
                          className="w-3.5 h-3.5 accent-amber-500 bg-slate-900 border-slate-800 rounded outline-none cursor-pointer"
                        />
                        <span>{p.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <footer className="flex justify-end gap-2.5 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-950 border border-slate-850 hover:border-slate-800 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 rounded-xl text-xs font-black shadow-lg"
                >
                  Confirm Registration
                </button>
              </footer>

            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL: EDIT EMPLOYEE PERMISSIONS */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setIsEditModalOpen(false)}></div>
          <div className="bg-slate-900 border border-white/5 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative z-10 animate-scale-up font-sans">
            
            <header className="p-4 border-b border-white/5 flex justify-between items-center bg-slate-950/40">
              <h2 className="text-sm font-black text-white tracking-wider uppercase flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-500" />
                <span>Edit Employee Permissions Matrix: {selectedUser.name}</span>
              </h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </header>

            <form onSubmit={handleEditUser} className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[80vh]">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Employee Name</label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-slate-950 border border-slate-800/80 focus:border-amber-500/30 outline-none rounded-xl py-2 px-3 text-xs text-white transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Mobile Number</label>
                  <input
                    type="text"
                    required
                    value={editFormData.mobile}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, mobile: e.target.value }))}
                    className="bg-slate-950 border border-slate-800/80 focus:border-amber-500/30 outline-none rounded-xl py-2 px-3 text-xs text-white transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    required
                    value={editFormData.email}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="bg-slate-950 border border-slate-800/80 focus:border-amber-500/30 outline-none rounded-xl py-2 px-3 text-xs text-white transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Account Status</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="bg-slate-950 border border-slate-800 focus:border-amber-500/30 outline-none rounded-xl py-2 px-3 text-xs text-slate-300 cursor-pointer"
                  >
                    <option value="active">Active (Normal Access)</option>
                    <option value="inactive">Inactive/Blocked (Access revoked)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/5 pt-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Change Role Presets</label>
                  <select
                    value={editFormData.role}
                    onChange={(e) => handlePresetSelect(e.target.value, true)}
                    className="bg-slate-950 border border-slate-800 focus:border-amber-500/30 outline-none rounded-xl py-2 px-3 text-xs text-slate-300 cursor-pointer"
                  >
                    <option value="SALES">Sales & Follow-up Team</option>
                    <option value="ACCOUNTS">Accounts & Billing Team</option>
                    <option value="INVENTORY">QC & Inventory Team</option>
                    <option value="TECHNICAL">Technical Systems Team</option>
                    <option value="PURCHASE">Purchase Team</option>
                    <option value="PRICING">Pricing Specialist Team</option>
                    <option value="CONTENT">Content Creator Team</option>
                    <option value="MARKETING">Marketing Team</option>
                    <option value="BUYER_HUNTING">Buyer Hunting Team</option>
                    <option value="LOGISTICS">Logistics Dispatch Team</option>
                    <option value="FIELD_BOY">Field Boy Team</option>
                    <option value="ADMIN">System Administrator</option>
                  </select>
                </div>
              </div>

              {/* Permissions overrides */}
              <div className="flex flex-col gap-2 border-t border-white/5 pt-4">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Modify Access Permissions Overrides</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-950 p-4 rounded-xl border border-slate-850">
                  {permissionOptions.map(p => {
                    const currentList = editFormData.permissions ? editFormData.permissions.split(",") : [];
                    const isChecked = currentList.includes(p.code);
                    return (
                      <label key={p.code} className="flex items-center gap-2 cursor-pointer p-1 text-[10px] text-slate-400 hover:text-white transition-colors">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handlePermissionCheckbox(p.code, e.target.checked, true)}
                          className="w-3.5 h-3.5 accent-amber-500 bg-slate-900 border-slate-800 rounded outline-none cursor-pointer"
                        />
                        <span>{p.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <footer className="flex justify-end gap-2.5 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-950 border border-slate-850 hover:border-slate-800 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 rounded-xl text-xs font-black shadow-lg"
                >
                  Save Configuration
                </button>
              </footer>

            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL: RESET PASSWORD */}
      {isResetPasswordOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setIsResetPasswordOpen(false)}></div>
          <div className="bg-slate-900 border border-white/5 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative z-10 animate-scale-up font-sans">
            
            <header className="p-4 border-b border-white/5 flex justify-between items-center bg-slate-950/40">
              <h2 className="text-sm font-black text-white tracking-wider uppercase flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-500 animate-pulse-glow" />
                <span>Reset password</span>
              </h2>
              <button onClick={() => setIsResetPasswordOpen(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </header>

            <form onSubmit={handleResetPassword} className="p-6 flex flex-col gap-4">
              <div className="bg-slate-950 border border-slate-850 p-3 rounded-xl">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Employee</span>
                <span className="text-xs font-bold text-white block mt-0.5">{selectedUser.name}</span>
                <span className="text-[9px] text-slate-400 block font-mono mt-0.5">{selectedUser.email}</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter secure new password"
                  className="bg-slate-950 border border-slate-800 focus:border-amber-500/30 outline-none rounded-xl py-2 px-3 text-xs text-white transition-colors"
                />
              </div>

              <footer className="flex justify-end gap-2.5 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsResetPasswordOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-950 border border-slate-850 hover:border-slate-800 rounded-xl text-xs font-bold text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 rounded-xl text-xs font-black shadow-lg"
                >
                  Update Password
                </button>
              </footer>
            </form>

          </div>
        </div>
      )}

      {/* SIDE DRAWER: EMPLOYEE LOGIN ACTIVITIES */}
      {isActivityDrawerOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsActivityDrawerOpen(false)}></div>
          <div className="bg-slate-900 border-l border-white/5 w-full max-w-md h-full flex flex-col justify-between shadow-2xl relative z-10 animate-slide-left font-sans">
            
            <header className="p-4 border-b border-white/5 flex justify-between items-center bg-slate-950/40">
              <div>
                <h2 className="text-xs font-black text-white tracking-wider uppercase flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  <span>Login Activity Audit</span>
                </h2>
                <span className="text-[10px] text-slate-500 font-semibold">{selectedUser.name}</span>
              </div>
              <button onClick={() => setIsActivityDrawerOpen(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </header>

            <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-3.5">
              {isActivityLoading ? (
                <div className="py-24 flex flex-col justify-center items-center gap-2">
                  <div className="w-6 h-6 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin"></div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Fetching login history...</span>
                </div>
              ) : loginActivities.length === 0 ? (
                <div className="py-20 flex flex-col justify-center items-center text-slate-600 gap-1.5">
                  <Clock className="w-7 h-7" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">No login logs recorded yet</span>
                </div>
              ) : (
                loginActivities.map((act) => {
                  const isSuccess = act.status === "SUCCESS";
                  return (
                    <div key={act.id} className="bg-slate-950 border border-slate-850 p-3.5 rounded-xl flex gap-3">
                      <div className={`w-8 h-8 rounded-lg flex justify-center items-center shrink-0 shadow-md ${
                        isSuccess ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-500"
                      }`}>
                        {isSuccess ? <UserCheck className="w-4.5 h-4.5" /> : <UserX className="w-4.5 h-4.5" />}
                      </div>

                      <div className="flex-grow">
                        <div className="flex justify-between items-center">
                          <span className={`text-[10px] font-black uppercase ${isSuccess ? "text-emerald-400" : "text-rose-500"}`}>
                            {act.status}
                          </span>
                          <span className="text-[9px] text-slate-500 font-mono">
                            {new Date(act.timestamp).toLocaleString("en-IN")}
                          </span>
                        </div>

                        {!isSuccess && act.failure_reason && (
                          <div className="text-[10px] text-rose-400 font-bold mt-1">
                            Reason: {act.failure_reason}
                          </div>
                        )}

                        <div className="flex items-center gap-3 text-[9px] text-slate-500 font-semibold font-mono mt-1.5 pt-1.5 border-t border-white/5">
                          <span className="flex items-center gap-1">🌐 {act.ip_address || "127.0.0.1"}</span>
                          <span className="flex items-center gap-1 max-w-[150px] truncate" title={act.user_agent || "unknown"}>
                            <Laptop className="w-3 h-3" /> {act.user_agent ? act.user_agent.split(" ")[0] : "unknown"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <footer className="p-4 border-t border-white/5 bg-slate-950/20 text-center text-[10px] text-slate-500 font-medium">
              Only successful / failed staff credentials are logged.
            </footer>

          </div>
        </div>
      )}

      {/* SIDE DRAWER: SYSTEM AUDIT LOGS */}
      {isAuditLogsDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsAuditLogsDrawerOpen(false)}></div>
          <div className="bg-slate-900 border-l border-white/5 w-full max-w-lg h-full flex flex-col justify-between shadow-2xl relative z-10 animate-slide-left font-sans">
            
            <header className="p-4 border-b border-white/5 flex justify-between items-center bg-slate-950/40">
              <div>
                <h2 className="text-xs font-black text-white tracking-wider uppercase flex items-center gap-1.5">
                  <History className="w-4 h-4 text-amber-500 animate-pulse-glow" />
                  <span>Administrative Audit Stream</span>
                </h2>
                <span className="text-[10px] text-slate-500 font-semibold">Real-time database mutations logging</span>
              </div>
              <button onClick={() => setIsAuditLogsDrawerOpen(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </header>

            <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-3">
              {isLogsLoading ? (
                <div className="py-24 flex flex-col justify-center items-center gap-2">
                  <div className="w-6 h-6 rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin"></div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Streaming audit stream...</span>
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="py-20 flex flex-col justify-center items-center text-slate-600 gap-1.5">
                  <Info className="w-7 h-7" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">No modifications logged yet</span>
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.log_id} className="bg-slate-950 border border-slate-850 p-3.5 rounded-xl">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[9px] bg-slate-900 border border-slate-800 text-amber-400 px-2 py-0.5 rounded font-black tracking-wide font-mono uppercase">
                          {log.action}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-bold mt-1.5">
                          {log.description}
                        </span>
                      </div>
                      <span className="text-[9px] text-slate-500 font-mono shrink-0">
                        {new Date(log.timestamp).toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[9px] text-slate-500 font-bold mt-3 pt-2 border-t border-white/5">
                      <span>Operator:</span>
                      <span className="text-slate-400">{log.user_name}</span>
                      {log.linked_id && (
                        <>
                          <span className="text-slate-700">|</span>
                          <span>Target:</span>
                          <span className="text-slate-400 font-mono">ID {log.linked_id}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <footer className="p-4 border-t border-white/5 bg-slate-950/20 text-center text-[10px] text-slate-500 font-medium">
              Mutations are permanent and cannot be modified.
            </footer>

          </div>
        </div>
      )}

    </div>
  );
}
