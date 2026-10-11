"use client";

import { usePathname } from "next/navigation";
import AppShell from "./AppShell";

export default function AppFrame({ children }) {
  const pathname = usePathname();

  if (pathname === "/") {
    return children;
  }

  return <AppShell>{children}</AppShell>;
}
