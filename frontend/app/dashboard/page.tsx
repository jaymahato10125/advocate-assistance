import type { Metadata } from "next";

import { ContractsView } from "@/components/contracts/contracts-view";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Your uploaded contracts — search, filter by status, sort, and upload new agreements for Gemini analysis.",
};

export default function DashboardPage() {
  return <ContractsView />;
}
