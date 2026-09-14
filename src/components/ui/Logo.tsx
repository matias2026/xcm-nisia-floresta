import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

// G4 mark (without the dumbbell detail) for compact use in headers —
// extracted from the brand material in public/logo-g4-icon.png.
export function Logo({ className }: LogoProps) {
  return (
    <Image
      src="/logo-g4-icon.png"
      alt="G4"
      width={2887}
      height={1928}
      className={cn("h-8 w-auto", className)}
      priority
    />
  );
}
