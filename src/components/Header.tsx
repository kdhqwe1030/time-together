"use client";
import { usePathname } from "next/navigation";

const Header = () => {
  const pathname = usePathname();

  const isRoot = pathname === "/";
  const isVote = pathname?.startsWith("/e/");
  const shareUrl = isVote ? pathname.split("/")[2] : "";

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
  return (
    <div className="bg-surface border-b border-border px-5 py-4 flex justify-between items-center">
      <h1 className="text-lg font-bold text-primary">언제 모임?</h1>
      {isVote && (
        <button
          className="text-muted text-sm hover:text-text"
          onClick={onShare}
        >
          공유
        </button>
      )}
    </div>
  );
};

export default Header;
