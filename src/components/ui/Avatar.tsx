import { cn } from "@/lib/utils";

interface AvatarProps {
  name: string;
  className?: string;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

// Avatar with the name's initials, G4 green accent — used in place of a
// photo (there's no image upload) to give each student visual identity in
// the cockpit, instead of a generic text row.
export function Avatar({ name, className }: AvatarProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-lime/15 text-sm font-bold text-lime-deep",
        className
      )}
    >
      {initials(name)}
    </span>
  );
}
