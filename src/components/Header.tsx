"use client";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useCreateStore } from "@/src/stores/createStore";

const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const step = useCreateStore((s) => s.step);
  const reset = useCreateStore((s) => s.reset);

  const isRoot = pathname === "/";
  const isVote = pathname?.startsWith("/e/");
  const isCreateDone = pathname === "/create" && step === 6;
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

  const onNewCreate = () => {
    if (isVote) router.push("/create");
    reset();
  };

  return (
    <div className="bg-surface border-b border-border px-5 py-2 flex justify-between items-center">
      <Image src="/logo.webp" alt="logo" width={80} height={28} />
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
    </div>
  );
};

export default Header;
