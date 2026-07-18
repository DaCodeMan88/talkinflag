import AdminSidebar from "./AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    // pt clears the fixed site nav (h-16 md:h-20)
    <div className="min-h-screen bg-black text-white pt-16 md:pt-20 lg:flex">
      <AdminSidebar />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
