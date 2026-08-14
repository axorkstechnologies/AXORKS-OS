"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { Wallet, Plus, Tag } from "lucide-react";

const CATEGORIES = ["Infrastructure", "Software Licenses", "Salaries", "Marketing", "Office", "Travel", "Freelancers", "General"];

export default function ExpensesPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const [category, setCategory] = useState("General");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);

  const { data } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => apiClient("/api/v1/finance/expenses").then((r: any) => r),
  });
  const expenses = data?.data || [];

  const createExpense = useMutation({
    mutationFn: () =>
      apiClient("/api/v1/finance/expenses", {
        method: "POST",
        body: JSON.stringify({
          category,
          description: description || null,
          amount: parseFloat(amount) || 0,
          expense_date: expenseDate,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["finance-dashboard"] });
      toast.success("Expense recorded!");
      setShowCreate(false);
      setDescription("");
      setAmount("");
    },
  });

  const totalExpenses = expenses.reduce((s: number, e: any) => s + Number(e.amount || 0), 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Expense Tracking</h1>
          <p className="text-xs text-slate-400 mt-0.5">Record and categorize business expenses</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-lg shadow-violet-600/20 transition"
        >
          <Plus className="w-3.5 h-3.5" /> Log Expense
        </button>
      </div>

      {/* Summary */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
          <Wallet className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] uppercase text-slate-400 font-semibold tracking-wider">Total Recorded Expenses</p>
          <p className="text-xl font-bold text-slate-100">${totalExpenses.toLocaleString()}</p>
        </div>
      </div>

      {/* Create Expense Form */}
      {showCreate && (
        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-slate-100 shadow-2xl space-y-3 max-w-md">
          <h2 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-2">Record New Expense</h2>

          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-slate-300">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-violet-500 font-medium"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="bg-slate-900 text-slate-100">
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-slate-300">Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Expense Description (optional)"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-violet-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-300">Amount ($)</label>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
                placeholder="0.00"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-violet-500 font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-300">Date</label>
              <input
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                type="date"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-violet-500 font-medium"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition"
            >
              Cancel
            </button>
            <button
              onClick={() => createExpense.mutate()}
              disabled={!amount}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs shadow-lg shadow-violet-600/30 transition disabled:opacity-50"
            >
              Save Expense
            </button>
          </div>
        </div>
      )}

      {/* Expenses Table */}
      <div className="border border-slate-800 rounded-2xl overflow-hidden text-xs glass">
        <table className="w-full">
          <thead className="bg-slate-900/80 border-b border-slate-800">
            <tr>
              <th className="text-left px-4 py-3 text-slate-400 font-semibold">Date</th>
              <th className="text-left px-4 py-3 text-slate-400 font-semibold">Category</th>
              <th className="text-left px-4 py-3 text-slate-400 font-semibold">Description</th>
              <th className="text-right px-4 py-3 text-slate-400 font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {expenses.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  No expenses recorded yet.
                </td>
              </tr>
            ) : (
              expenses.map((exp: any) => (
                <tr key={exp.id} className="hover:bg-slate-900/40 transition">
                  <td className="px-4 py-3 text-slate-300">{exp.expense_date}</td>
                  <td className="px-4 py-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-semibold flex items-center gap-1 w-fit border border-slate-700">
                      <Tag className="w-2.5 h-2.5" /> {exp.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{exp.description || "—"}</td>
                  <td className="px-4 py-3 text-right font-bold text-rose-400">${Number(exp.amount).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
