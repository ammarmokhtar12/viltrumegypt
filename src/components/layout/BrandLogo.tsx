import Image from "next/image";
import Link from "next/link";

interface BrandLogoProps {
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  asLink?: boolean;
}

const sizes = {
  sm: { img: 32, word: "text-2xl", tag: "text-[8px] tracking-[0.5em]" },
  md: { img: 40, word: "text-2xl sm:text-3xl", tag: "text-[8px] tracking-[0.5em]" },
  lg: { img: 48, word: "text-3xl sm:text-4xl", tag: "text-[9px] tracking-[0.55em]" },
};

export default function BrandLogo({
  variant = "dark",
  size = "md",
  showTagline = true,
  asLink = true,
}: BrandLogoProps) {
  const s = sizes[size];
  const isLight = variant === "light";
  const wordColor = isLight ? "text-white" : "text-primary";
  const tagColor = isLight ? "text-zinc-400" : "text-accent";

  const inner = (
    <div className="flex items-center gap-2.5 leading-none">
      <div className="relative shrink-0" style={{ width: s.img, height: s.img }}>
        <Image
          src="/viltrum-logo.png"
          alt="Viltrum Egypt"
          width={s.img}
          height={s.img}
          className="object-contain"
          priority={size === "lg"}
        />
      </div>
      <div className="flex flex-col">
        <span className={`${s.word} type-brand ${wordColor}`}>VILTRUM</span>
        {showTagline && (
          <span className={`${s.tag} font-sans font-bold uppercase ${tagColor} mt-1`}>
            Est. 2024
          </span>
        )}
      </div>
    </div>
  );

  if (!asLink) return inner;

  return (
    <Link href="/" className="inline-flex transition-opacity hover:opacity-85">
      {inner}
    </Link>
  );
}
