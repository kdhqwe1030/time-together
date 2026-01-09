"use client";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useCreateStore } from "@/src/stores/createStore";
import { RxHamburgerMenu } from "react-icons/rx";
import { useState } from "react";

const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const step = useCreateStore((s) => s.step);
  const reset = useCreateStore((s) => s.reset);

  const isRoot = pathname === "/";
  const isVote = pathname?.startsWith("/e/");
  const isCreateDone = pathname === "/create" && step === 6;
  const shareUrl = isVote ? pathname.split("/")[2] : "";
  const goHome = () => router.push("/");
  const goCreate = () => router.push("/create");
  const goContact = () => {
    const url = "  https://forms.gle/5zFRjd4dbAi6zavy9";
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const [isOpen, setIsOpen] = useState(false);
  const onShare = async () => {
    if (!shareUrl) return;

    // 모바일이면 네이티브 공유 먼저 시도
    if (navigator.share) {
      try {
        await navigator.share({
          // title: title || "모임 투표",
          url: shareUrl,
        });
        return;
      } catch {
        // 사용자가 취소해도 그냥 넘어감
      }
    }

    await navigator.clipboard.writeText(shareUrl);
  };

  const onNewCreate = () => {
    if (isVote) router.push("/create");
    reset();
  };

  return (
    <div
      className={`bg-surface px-5 py-2 flex justify-between items-center${
        isRoot
          ? " fixed top-0 left-0 right-0 z-50 mx-auto max-w-2xl"
          : " border-b border-border"
      }`}
    >
      <Image
        src="/logo.webp"
        alt="logo"
        width={80}
        height={28}
        onClick={goHome}
      />
      {isVote && (
        <button
          className="text-muted text-sm hover:text-text"
          onClick={onShare}
        >
          공유
        </button>
      )}
      {isCreateDone && (
        <button
          className="text-muted text-sm hover:text-text"
          onClick={onNewCreate}
        >
          새로 만들기
        </button>
      )}
      {!isCreateDone && (
        <div className="relative">
          <button
            className="p-1.5 border rounded-lg border-border"
            onClick={() => setIsOpen((prev) => !prev)}
          >
            <RxHamburgerMenu />
          </button>
          {isOpen && (
            <div className="absolute bg-surface shadow-lg rounded-xl z-50 p-2 right-0  text-nowrap text-center text-sm">
              <div className="border-b border-border p-0.5" onClick={goHome}>
                홈
              </div>
              <div className="border-b border-border p-0.5" onClick={goCreate}>
                새 일정 만들기
              </div>
              <div className="p-0.5" onClick={goContact}>
                문의하기
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Header;
