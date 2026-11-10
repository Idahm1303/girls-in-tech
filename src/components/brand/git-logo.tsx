import Image from "next/image";

type GitLogoProps = {
  className?: string;
  loading?: "eager" | "lazy";
};

export function GitLogo({ className = "", loading }: GitLogoProps) {
  return (
    <Image
      src="/brand/git-infinity.svg"
      alt="Girls in Tech infinity logo"
      width={104}
      height={56}
      loading={loading}
      className={className}
    />
  );
}
