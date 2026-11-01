import type { Metadata } from "next";
import "./globals.css";
import AgeGate from "@/components/AgeGate";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://phenobase.vercel.app"),
  title: {
    default: "PhenoBase — Cannabis Strain Genetics, Lineages & Breeding",
    template: "%s | PhenoBase",
  },
  description:
    "Honest strain reviews, a 3D genetic star map, traceable lineage trees and a complete home breeding guide.",
  openGraph: {
    title: "PhenoBase — Cannabis Strain Genetics, Lineages & Breeding",
    description:
      "Honest strain reviews, a 3D genetic star map, traceable lineage trees and a complete home breeding guide.",
    images: [{ url: "/images/og-image.png", width: 1024, height: 1024 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PhenoBase — Cannabis Strain Genetics, Lineages & Breeding",
    description:
      "Honest strain reviews, a 3D genetic star map, traceable lineage trees and a complete home breeding guide.",
    images: ["/images/og-image.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AgeGate />
        {children}
      </body>
    </html>
  );
}
