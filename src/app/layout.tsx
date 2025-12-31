import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Header from "../components/Header";

export const metadata: Metadata = {
  title: "언제 모임",
  description: "간편한 일정 조율 서비스로 모임 시간을 쉽게 정하세요",
};

const pretendard = localFont({
  src: "../fonts/PretendardVariable.woff2",
  variable: "--font-pretendard",
  display: "swap",
});
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${pretendard.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className="min-h-screen antialiased font-pretendard">
        <main className="mx-auto h-full max-w-3xl bg-background text-text">
          <Header />
          {children}
        </main>
      </body>
    </html>
  );
}
