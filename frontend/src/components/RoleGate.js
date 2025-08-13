// src/components/RoleGate.js
import { useAuth } from "../context/AuthContext";

export default function RoleGate({ anyOf = [], children, fallback = null }) {
  const { user } = useAuth();
  const role = user?.role?.toString()?.toLowerCase?.();
  const ok = role && anyOf.map((r) => r.toLowerCase()).includes(role);
  return ok ? children : fallback;
}
