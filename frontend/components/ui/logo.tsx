import Link from "next/link";
import Image from "next/image";
import logo from "@/public/images/logo.png";

export default function Logo() {
  return (
    <Link
      href="/"
      className="inline-flex items-center shrink-0"
      aria-label="DosePacker"
    >
      <Image src={logo} alt="DosePacker Logo" width={32} height={32} />
      <span className="ml-2 text-xl font-semibold text-white">DosePacker</span>
    </Link>
  );
}
