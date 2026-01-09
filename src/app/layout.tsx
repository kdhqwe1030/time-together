import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Header from "../components/Header";

const siteUrl = "https://xn--v52b95rqmblr.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: "언제모임",
  description: "간편한 일정 조율 서비스",

  keywords: ["언제모임", "일정조율", "모임", "약속", "투표"],

  openGraph: {
    siteName: "언제모임",
    title: "언제모임",
    description: "간편한 일정 조율 서비스",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "언제모임",
      },
    ],
  },
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
        <div className="flex flex-col min-h-screen mx-auto max-w-2xl">
          <Header />
          <main className="flex-1 w-full bg-color-bg">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
