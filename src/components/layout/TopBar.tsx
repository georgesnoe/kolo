import { IconSun, IconMoon, IconBell, IconUser, IconMenu2 } from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import { useTheme } from "@/components/ThemeProvider";
import { useQuery } from "@tanstack/react-query";
import { getProfile } from "@/features/profile/server/profileFns";

interface TopBarProps {
  onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => getProfile(),
  });

  const avatarUrl = profile?.avatarBlobKey
    ? `https://blob.vercel-storage.com/${profile.avatarBlobKey}`
    : null;

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

        <button
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Notifications"
        >
          <IconBell className="size-5" />
        </button>

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
