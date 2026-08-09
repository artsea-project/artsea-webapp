import AdminSidebar from "@/components/AdminSidebar"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen bg-white">
            <AdminSidebar userName="Élise Roux" />
            <div className="flex-1 overflow-y-auto">{children}</div>
        </div>
    )
}
