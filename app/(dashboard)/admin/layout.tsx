import AdminSidebar from "@/components/AdminSidebar"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen overflow-hidden bg-white">
            <AdminSidebar userName="Élise Roux" />
            <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
        </div>
    )
}
