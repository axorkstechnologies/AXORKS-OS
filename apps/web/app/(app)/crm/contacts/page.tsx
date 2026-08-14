"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Search, UserCheck, Mail, Phone } from "lucide-react";

export default function ContactsListPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["contacts", page, search],
    queryFn: () => apiClient(`/api/v1/contacts?page=${page}&per_page=25${search ? `&search=${search}` : ""}`),
  });

  const contacts = data?.data || [];
  const total = data?.meta?.total || 0;

  const [showCreate, setShowCreate] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");

  const createContact = useMutation({
    mutationFn: () =>
      apiClient("/api/v1/contacts", {
        method: "POST",
        body: JSON.stringify({
          first_name: firstName || null,
          last_name: lastName || null,
          email: email || null,
          title: title || null,
        }),
      }),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Contact created");
      setShowCreate(false);
      setFirstName("");
      setLastName("");
      setEmail("");
      setTitle("");
      router.push(`/crm/contacts/${res.data.id}`);
    },
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Contacts</h1>
          <p className="text-xs text-slate-500 mt-0.5">{total} contacts</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition">
          <Plus className="w-3.5 h-3.5" /> New Contact
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search contacts..."
          className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs focus:outline-none focus:border-violet-500"
        />
      </div>

      {/* Create dialog */}
      {showCreate && (
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 max-w-md space-y-3">
          <h2 className="text-sm font-semibold text-white">Create Contact</h2>
          <div className="grid grid-cols-2 gap-2">
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500" />
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500" />
          </div>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500" />
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Job title" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500" />
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowCreate(false)} className="px-4 py-1.5 rounded bg-slate-800 text-slate-400 text-xs">Cancel</button>
            <button onClick={() => createContact.mutate()} disabled={!firstName.trim() && !lastName.trim() && !email.trim()} className="px-4 py-1.5 rounded bg-violet-600 text-white text-xs disabled:opacity-50">Create</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-900/60 border-b border-slate-800">
            <tr>
              <th className="text-left px-4 py-3 text-slate-500 font-medium uppercase tracking-wider">Contact</th>
              <th className="text-left px-4 py-3 text-slate-500 font-medium uppercase tracking-wider">Title</th>
              <th className="text-left px-4 py-3 text-slate-500 font-medium uppercase tracking-wider">Email</th>
              <th className="text-left px-4 py-3 text-slate-500 font-medium uppercase tracking-wider">Phone</th>
              <th className="text-left px-4 py-3 text-slate-500 font-medium uppercase tracking-wider">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {isLoading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">Loading...</td></tr>
            ) : contacts.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No contacts yet</td></tr>
            ) : (
              contacts.map((c: any) => (
                <tr key={c.id} className="hover:bg-slate-900/40 transition cursor-pointer" onClick={() => router.push(`/crm/contacts/${c.id}`)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-violet-400">
                        {c.first_name?.[0]}{c.last_name?.[0]}
                      </div>
                      <span className="font-medium text-slate-200">{[c.first_name, c.last_name].filter(Boolean).join(" ") || "Unnamed"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{c.title || "—"}</td>
                  <td className="px-4 py-3 text-slate-400">{c.email || "—"}</td>
                  <td className="px-4 py-3 text-slate-400">{c.phone || "—"}</td>
                  <td className="px-4 py-3 text-slate-500">{new Date(c.created_at).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
