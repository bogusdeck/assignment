import "./globals.css";
import { Providers } from "@/components/Providers";
import { VT323 } from "next/font/google";

const vt323 = VT323({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-vt323",
});

export const metadata = {
  title: "TaskBoy",
  description: "A minimal terminal-style task manager",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${vt323.variable} font-mono bg-black text-purple-400 selection:bg-purple-400 selection:text-black min-h-screen`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
