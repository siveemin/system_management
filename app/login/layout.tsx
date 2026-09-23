export default function LoginLayout({ children }: { children: React.ReactNode }) {
  // Standalone layout — no sidebar, no topbar, no bottom nav
  return <>{children}</>;
}
