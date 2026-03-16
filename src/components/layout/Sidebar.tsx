import { Link, useRouterState } from "@tanstack/react-router";
import {
  IconLayoutDashboard,
  IconUsers,
  IconCreditCard,
  IconChartPie,
  IconSettings,
  IconLogout,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { authClient } from "@/core/auth/auth-client";

const navItems = [
  {
    label: "Tableau de bord",
    href: "/tableau-de-bord",
    icon: IconLayoutDashboard,
  },
  {
    label: "Tontines",
    href: "/tontines",
    icon: IconUsers,
  },
  {
    label: "Transactions",
    href: "/transactions",
    icon: IconCreditCard,
  },
  {
    label: "Statistiques",
    href: "/statistiques",
    icon: IconChartPie,
  },
  {
    label: "Paramètres",
    href: "/parametres",
    icon: IconSettings,
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const router = useRouterState();
  const currentPath = router.location.pathname;

  const handleLogout = async () => {
    await authClient.signOut();
    window.location.href = "/connexion";
  };

  const sidebarContent = (
    <>
      <div className="flex h-14 items-center border-b border-sidebar-border px-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
          <span className="text-primary">K</span>
          {!collapsed && <span>olo</span>}
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const isActive = currentPath.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={onMobileClose}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="size-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-2">
        {/* Collapse toggle — desktop only */}
        <button
          onClick={onToggle}
          className="mb-1 hidden w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground lg:flex"
          title={collapsed ? "Développer le menu" : "Réduire le menu"}
        >
          {collapsed ? (
            <IconChevronRight className="size-5 shrink-0" />
          ) : (
            <>
              <IconChevronLeft className="size-5 shrink-0" />
              <span>Réduire</span>
            </>
          )}
        </button>

        <button
          onClick={handleLogout}
          className={cn(
            "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
            collapsed && "justify-center px-2"
          )}
          title={collapsed ? "Déconnexion" : undefined}
        >
          <IconLogout className="size-5 shrink-0" />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "flex h-screen flex-col border-r border-border bg-sidebar transition-all",
          // Desktop: fixed width based on collapsed state
          "lg:relative lg:z-auto",
          collapsed ? "lg:w-16" : "lg:w-60",
          // Mobile: slide-out drawer
          "fixed inset-y-0 left-0 z-50 w-60 lg:static",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
