import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  IconSun,
  IconMoon,
  IconBell,
  IconUser,
  IconMenu2,
  IconX,
} from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import { useTheme } from "@/components/ThemeProvider";
import { getProfile } from "@/features/profile/server/profileFns";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/features/notifications/server/notificationFns";
import { cn } from "@/lib/utils";

interface TopBarProps {
  onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => getProfile(),
  });

  const { data: notificationData } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => getNotifications(),
    refetchInterval: 60000, // Refetch every minute
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead({ data: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const avatarUrl = profile?.avatarBlobKey
    ? `https://blob.vercel-storage.com/${profile.avatarBlobKey}`
    : null;

  const unreadCount = notificationData?.unreadCount || 0;
  const notifications = notificationData?.notifications || [];

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return "À l'instant";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}min`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}j`;
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background px-4">
      <button
        onClick={onMenuClick}
        className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
        aria-label="Menu"
      >
        <IconMenu2 className="size-5" />
      </button>

      <div className="hidden lg:block" />

      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Basculer le thème"
        >
          {resolvedTheme === "dark" ? (
            <IconSun className="size-5" />
          ) : (
            <IconMoon className="size-5" />
          )}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Notifications"
          >
            <IconBell className="size-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-border bg-popover shadow-lg">
              <div className="flex items-center justify-between border-b border-border p-3">
                <h3 className="text-sm font-semibold">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllReadMutation.mutate()}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Tout marquer lu
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Aucune notification
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={cn(
                        "flex items-start gap-3 border-b border-border p-3 last:border-0",
                        !n.read && "bg-muted/50"
                      )}
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">{n.title}</p>
                        <p className="text-xs text-muted-foreground">{n.message}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatTimeAgo(n.createdAt)}
                        </p>
                      </div>
                      {!n.read && (
                        <button
                          onClick={() => markReadMutation.mutate(n.id)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <IconX className="size-4" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <Link
          to="/parametres"
          className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-border"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={profile?.displayName || "Profil"}
              className="h-full w-full object-cover"
            />
          ) : (
            <IconUser className="size-5 text-muted-foreground" />
          )}
        </Link>
      </div>
    </header>
  );
}
