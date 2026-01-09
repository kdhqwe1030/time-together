import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Header from "../components/ui/Header";

const siteUrl = "https://xn--v52b95rqmblr.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: "언제모임",
  description:
    "바쁜 일정 속에서도 약속 잡기 쉽게, 로그인 없이 링크로 바로 투표하고 몇 번의 클릭만으로 모임 일정을 완성하는 일정 조율 서비스입니다.",

  keywords: [
    "언제모임",
    "일정 조율",
    "일정 투표",
    "모임 일정",
    "약속 잡기",
    "시간 맞추기",
    "when2meet",
    "모임 투표",
    "스케줄 조율",
    "친구 약속",
  ],

  // canonical(대표 URL) 권장
  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "언제모임",
    title: "언제모임",
    description:
      "바쁜 일정 속에서도 약속 잡기 쉽게, 로그인 없이 링크로 바로 투표하고 몇 번의 클릭만으로 모임 일정을 완성하는 일정 조율 서비스입니다.",
    locale: "ko_KR",
    images: [
      {
        url: new URL("/og.png", siteUrl).toString(),
        width: 1200,
        height: 630,
        alt: "언제모임 - 간편한 일정 조율",
      },
    ],
  },
  // Twitter 카드
  twitter: {
    card: "summary_large_image",
    title: "언제모임",
    description:
      "로그인 없이 링크 하나로 투표하고, 30초 만에 모임 일정을 만드는 간편한 일정 조율 서비스.",
    images: [new URL("/og.png", siteUrl).toString()],
  },

  // 아이콘/파비콘
  icons: {
    icon: "/favicon.ico",
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
          <main className="flex-1 w-full bg-color-bg">{children}</main>
        </div>
      </body>
    </html>
  );
}
