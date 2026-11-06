import Image from "next/image";

type GitLogoProps = {
  className?: string;
  priority?: boolean;
};

export function GitLogo({ className = "", priority = false }: GitLogoProps) {
  return (
    <Image
      src="/brand/git-infinity.svg"
      alt="Girls in Tech infinity logo"
      width={104}
      height={56}
      priority={priority}
      className={className}
    />
  );
}
