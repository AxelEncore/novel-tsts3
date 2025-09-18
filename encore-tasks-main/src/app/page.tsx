"use client";

import { AppProvider } from "@/contexts/AppContext";
import { AuthProvider } from "@/refactored/presentation/context/AuthContext";
import { Layout } from "@/components/Layout";
import KanbanBoard from "@/components/KanbanBoard";
import { NotificationProvider } from "@/components/notifications";

export default function Page() {
  return (
    <AppProvider data-oid="ih2_dzp">
      <AuthProvider>
        <NotificationProvider>
          <Layout data-oid="zy0y3-c">
            <KanbanBoard data-oid=":_ayqqp" />
          </Layout>
        </NotificationProvider>
      </AuthProvider>
    </AppProvider>);

}