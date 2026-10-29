import { BottomNav, Fab, SideNav } from "@/components/Nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <SideNav />
      <div className="min-w-0 flex-1 pb-28 md:pb-10">{children}</div>
      <Fab />
      <BottomNav />
    </div>
  );
}
