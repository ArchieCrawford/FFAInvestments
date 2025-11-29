import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Plus, Search, Edit2, CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";

export default function AdminUsers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    role: "member",
    phone: "",
    address: "",
    date_of_birth: "",
    kyc_status: "pending",
    member_since: new Date().toISOString().split("T")[0],
    education_track: "beginner",
    notes: "",
  });

  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .order("full_name", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (userData) => {
      const payload = {
        full_name: userData.full_name,
        member_name: userData.full_name,
        email: userData.email,
        role: userData.role,
        phone: userData.phone,
        address: userData.address,
        date_of_birth: userData.date_of_birth || null,
        kyc_status: userData.kyc_status,
        join_date: userData.member_since,
        education_track: userData.education_track,
        notes: userData.notes || null,
      };
      const { error } = await supabase.from("members").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, userData }) => {
      const payload = {
        full_name: userData.full_name,
        member_name: userData.full_name,
        role: userData.role,
        phone: userData.phone,
        address: userData.address,
        date_of_birth: userData.date_of_birth || null,
        kyc_status: userData.kyc_status,
        join_date: userData.member_since,
        education_track: userData.education_track,
        notes: userData.notes || null,
      };
      const { error } = await supabase
        .from("members")
        .update(payload)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      setIsDialogOpen(false);
      setEditingUser(null);
      resetForm();
    },
  });

  const resetForm = () => {
    setFormData({
      full_name: "",
      email: "",
      role: "member",
      phone: "",
      address: "",
      date_of_birth: "",
      kyc_status: "pending",
      member_since: new Date().toISOString().split("T")[0],
      education_track: "beginner",
      notes: "",
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, userData: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name || user.member_name || "",
      email: user.email || "",
      role: user.role || "member",
      phone: user.phone || "",
      address: user.address || "",
      date_of_birth: user.date_of_birth || "",
      kyc_status: user.kyc_status || "pending",
      member_since: user.join_date || "",
      education_track: user.education_track || "beginner",
      notes: user.notes || "",
    });
    setIsDialogOpen(true);
  };

  const filteredUsers = users.filter((user) => {
    const name = (user.full_name || user.member_name || "").toLowerCase();
    const email = (user.email || "").toLowerCase();
    const term = searchTerm.toLowerCase();
    return name.includes(term) || email.includes(term);
  });

  const getKYCIcon = (status) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-amber-600" />;
    }
  };

  return (
    <div className="p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-default mb-2">
              Member Management
            </h1>
            <p className="text-muted">Manage club members and permissions</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-primary hover:bg-blue-800 gap-2"
                onClick={() => {
                  setEditingUser(null);
                  resetForm();
                }}
              >
                <Plus className="w-4 h-4" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingUser ? "Edit Member" : "Add New Member"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name *</Label>
                    <Input
                      value={formData.full_name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          full_name: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                      disabled={!!editingUser}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) =>
                        setFormData({ ...formData, role: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date of Birth</Label>
                    <Input
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          date_of_birth: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Member Since</Label>
                    <Input
                      type="date"
                      value={formData.member_since}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          member_since: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>KYC Status</Label>
                    <Select
                      value={formData.kyc_status}
                      onValueChange={(value) =>
                        setFormData({ ...formData, kyc_status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Education Track</Label>
                    <Select
                      value={formData.education_track}
                      onValueChange={(value) =>
                        setFormData({ ...formData, education_track: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">
                          Intermediate
                        </SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Input
                    value={formData.notes || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Internal notes about this member"
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-primary hover:bg-blue-800"
                  >
                    {editingUser ? "Update Member" : "Add Member"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted" />
                <Input
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>KYC Status</TableHead>
                    <TableHead>Member Since</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8"
                      >
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-muted"
                      >
                        No members found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id} className="hover:bg-bg">
                        <TableCell className="font-semibold">
                          {user.full_name || user.member_name}
                        </TableCell>
                        <TableCell className="text-muted">
                          {user.email}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              user.role === "admin" ? "default" : "secondary"
                            }
                          >
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getKYCIcon(user.kyc_status)}
                            <span className="capitalize text-sm">
                              {user.kyc_status}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.join_date
                            ? format(
                                new Date(user.join_date),
                                "MMM dd, yyyy"
                              )
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(user)}
                            className="gap-2"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
