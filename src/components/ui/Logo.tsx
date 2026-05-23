import Image from "next/image";
import Link from "next/link";

export function Logo({ variant = "horizontal", size = "md" }: {
  variant?: "horizontal" | "square" | "circle";
  size?: "sm" | "md" | "lg";
}) {
  const sizes = { sm: 80, md: 120, lg: 200 };
  const src = {
    horizontal: "/logo-horizontal.png",
    square: "/logo-square.png",
    circle: "/logo-circle.png",
  };
  return (
    <Link href="/" aria-label="Go to homepage">
      <Image
        src={src[variant]}
        alt="Talkin Flag"
        height={sizes[size]}
        width={variant === "horizontal" ? sizes[size] * 3.5 : sizes[size]}
        priority
      />
    </Link>
  );
}
