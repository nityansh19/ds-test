import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Founding Five | Data Science Club Recruitment",
  description: "A student-led Python and Data Analytics founding-team assessment.",
  robots: { index: false, follow: false }
};

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body>{children}</body></html>;
}
