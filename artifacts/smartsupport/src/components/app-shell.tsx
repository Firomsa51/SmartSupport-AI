import { Link, useLocation } from "wouter";
import { useUser, useClerk } from "@clerk/clerk-react";
import { useTheme } from "@/components/theme-provider";
import { LayoutDashboard, Moon, Sun, LogOut, MessageSquare, Menu, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = user?.firstName?.[0] ?? user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() ?? "U";
  const displayName = user?.firstName ?? user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ?? "User";
  const email = user?.emailAddresses?.[0]?.emailAddress ?? "";

  return (
    <div className="min-h-screen bg-background flex">

      {/* Sidebar Desktop */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col
        transition-transform duration-200
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0 md:static md:flex
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
            <Zap className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-base tracking-tight">SmartSupport</span>
          <span className="text-xs text-muted-foreground font-medium ml-auto bg-muted px-1.5 py-0.5 rounded">AI</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const active = location.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <button
                  onClick={() => setMobileOpen(false)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {item.label}
                </button>
              </Link>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-border space-y-3">
          {/* User Info */}
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-muted/50">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="text-xs font-bold text-primary-foreground">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{email}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-2 text-xs h-8"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              data-testid="button-theme-toggle"
            >
              {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              {theme === "dark" ? "Light" : "Dark"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-xs h-8 text-muted-foreground hover:text-destructive hover:border-destructive"
              onClick={() => signOut({ redirectUrl: "/" })}
              data-testid="button-sign-out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="h-16 flex items-center justify-between px-5 border-b border-border md:hidden bg-card">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm">SmartSupport AI</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setMobileOpen(!mobileOpen)} data-testid="button-menu">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
