import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "hero";
  linked?: boolean;
}

/** Tuned for the wide logo asset — crops excess horizontal padding */
const sizes = {
  sm: { box: "h-9 w-[7.5rem]", img: "h-[3.25rem]" },
  md: { box: "h-12 w-[9.5rem]", img: "h-[4.25rem]" },
  lg: { box: "h-14 w-[11rem]", img: "h-[5rem]" },
  hero: {
    box: "h-32 w-[20rem] sm:h-44 sm:w-[28rem]",
    img: "h-[14rem] sm:h-[20rem]",
  },
} as const;

export function Logo({ size = "md", linked = true }: LogoProps) {
  const s = sizes[size];

  const image = (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden ${s.box}`}
    >
      <Image
        src="/logo-iberic-distributions.png"
        alt="Iberic Distributions"
        width={440}
        height={176}
        className={`${s.img} w-auto max-w-none object-contain`}
        priority={size !== "sm"}
      />
    </span>
  );

  if (!linked) return image;

  return (
    <Link href="/" className="inline-flex shrink-0 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-wine/40">
      {image}
    </Link>
  );
}
