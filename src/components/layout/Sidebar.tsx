import { Link, useRouterState } from "@tanstack/react-router";
import {
  IconLayoutDashboard,
  IconUsers,
  IconCreditCard,
  IconChartPie,
  IconSettings,
  IconLogout,
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
  collapsed?: boolean;
}

export function Sidebar({ collapsed }: SidebarProps) {
  const router = useRouterState();
  const currentPath = router.location.pathname;

  const handleLogout = async () => {
    await authClient.signOut();
    window.location.href = "/connexion";
  };

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-border bg-sidebar transition-all",
        collapsed ? "w-16" : "w-60"
      )}
    >
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
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="size-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-2">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
        >
          <IconLogout className="size-5 shrink-0" />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </aside>
  );
}
