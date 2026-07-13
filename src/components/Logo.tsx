import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "hero";
  linked?: boolean;
}

const sizes = {
  sm: "h-9 w-auto max-w-[7.5rem]",
  md: "h-11 w-auto max-w-[9.5rem]",
  lg: "h-14 w-auto max-w-[11.5rem]",
  hero: "h-auto w-full max-w-[min(100%,22rem)] sm:max-w-[26rem]",
} as const;

export function Logo({ size = "md", linked = true }: LogoProps) {
  const image = (
    <Image
      src="/logo-iberic-distributions.png"
      alt="Iberic Distributions"
      width={440}
      height={176}
      className={`${sizes[size]} object-contain`}
      priority={size === "hero" || size === "lg"}
    />
  );

  if (!linked) return image;

  return (
    <Link
      href="/"
      className="inline-flex shrink-0 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-wine/40"
    >
      {image}
    </Link>
  );
}
