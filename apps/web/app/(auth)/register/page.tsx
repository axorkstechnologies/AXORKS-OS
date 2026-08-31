"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    // Public registration disabled permanently — redirect to secure login
    router.replace("/login");
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="text-center text-slate-400 text-xs font-mono">
        Public registration disabled. Redirecting to login...
      </div>
    </div>
  );
}
