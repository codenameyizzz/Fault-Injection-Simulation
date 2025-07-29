// src/components/Protected.js
"use client";

import { useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "@/context/AuthContext";

export default function Protected({ children }) {
  const { user } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    // jika belum login, redirect ke /login
    if (user === null) {
      router.replace("/login");
    }
  }, [user, router]);

  // sementara menunggu cek auth
  if (!user) return null;

  return <>{children}</>;
}
