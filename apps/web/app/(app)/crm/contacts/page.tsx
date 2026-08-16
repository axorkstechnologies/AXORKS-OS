"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  Search,
  UserCheck,
  Mail,
  Phone,
  Building2,
  X,
  ExternalLink,
  Users,
} from "lucide-react";

export default function ContactsListPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [companyName, setCompanyName] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["contacts", page, search],
    queryFn: () =>
      apiClient(`/api/v1/contacts?page=${page}&per_page=50${search ? `&search=${search}` : ""}`),
  });

  const contacts = data?.data || [];
  const total = contacts.length || data?.meta?.total || 0;

  const createContact = useMutation({
    mutationFn: () =>
      apiClient("/api/v1/contacts", {
        method: "POST",
        body: JSON.stringify({
          first_name: firstName.trim() || null,
          last_name: lastName.trim() || null,
          email: email.trim() || null,
          title: title.trim() || null,
          company_name: companyName.trim() || null,
        }),
      }),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Contact created successfully");
      setShowCreate(false);
      setFirstName("");
      setLastName("");
      setEmail("");
      setTitle("");
      setCompanyName("");
      if (res?.data?.id) {
        router.push(`/crm/contacts/${res.data.id}`);
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create contact");
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-violet-500" /> CRM Contacts & Decision Makers
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-500 dark:text-violet-400 border border-violet-500/20">
              {total} Contacts
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Individual client relationships, executive decision-makers, and outreach channels
          </p>
        </div>

        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-violet-600/30 transition transform active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" /> New Contact
        </button>
      </div>

      {/* Search Bar */}
      <div className="glass p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
        <div className="relative w-full max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-3 text-slate-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search contacts by name, email, or designation..."
            className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-violet-500 transition"
          />
        </div>
      </div>

      {/* Create Modal Dialog */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full glass p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-violet-500" /> Create Contact
              </h2>
              <button
                onClick={() => setShowCreate(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">First Name *</label>
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. John"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-medium placeholder-slate-400 focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Last Name</label>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Smith"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-medium placeholder-slate-400 focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@company.com"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-medium placeholder-slate-400 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Job Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Chief Technology Officer"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-medium placeholder-slate-400 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Company</label>
                <input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-medium placeholder-slate-400 focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => createContact.mutate()}
                disabled={(!firstName.trim() && !email.trim()) || createContact.isPending}
                className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-md shadow-violet-600/30 transition disabled:opacity-50"
              >
                {createContact.isPending ? "Saving..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contacts Table */}
      <div className="glass rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100/60 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5 font-bold">Contact Name</th>
                <th className="px-5 py-3.5 font-bold">Role / Title</th>
                <th className="px-5 py-3.5 font-bold">Email</th>
                <th className="px-5 py-3.5 font-bold">Organization</th>
                <th className="px-5 py-3.5 font-bold text-right">Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/80">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-400 font-mono">
                    Loading CRM contacts...
                  </td>
                </tr>
              ) : contacts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
                    No contacts found. Click "New Contact" to add one.
                  </td>
                </tr>
              ) : (
                contacts.map((c: any) => {
                  const fullName = `${c.first_name || ""} ${c.last_name || ""}`.trim() || c.name || "Contact";

                  return (
                    <tr
                      key={c.id}
                      onClick={() => router.push(`/crm/contacts/${c.id}`)}
                      className="hover:bg-slate-100/40 dark:hover:bg-slate-900/40 transition cursor-pointer group"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            {fullName[0] || "C"}
                          </div>
                          <span className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                            {fullName}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300 font-medium">
                        {c.title || c.position || "Decision Maker"}
                      </td>

                      <td className="px-5 py-3.5">
                        {c.email ? (
                          <a
                            href={`mailto:${c.email}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 text-violet-600 dark:text-violet-400 hover:underline"
                          >
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span>{c.email}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">
                        {c.company_name || c.organization || "Direct Account"}
                      </td>

                      <td className="px-5 py-3.5 text-slate-400 text-right text-[11px]">
                        {new Date(c.created_at || Date.now()).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
