import Footer from "../components/Footer";
import Hero from "../components/Hero";
import HorizontalScrollSection from "../components/HorizontalScrollSection";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Hero />

      <HorizontalScrollSection
        kicker="투표"
        title={`로그인 없이\n링크 하나로 투표 완료`}
        desc="이름만 입력하면 바로 참여할 수 있어요!"
        phones={[
          { src: "/vote-1.webp", alt: "투표 참여 화면" },
          { src: "/vote-2.webp", alt: "투표 결과 화면" },
        ]}
      />
      <HorizontalScrollSection
        kicker="생성"
        title={`몇 번의 클릭으로\n모임 일정 만들기`}
        desc="몇 가지 선택만 하면 링크가 바로 생성돼요."
        phones={[
          { src: "/create-1.webp", alt: "모임 이름 입력" },
          { src: "/create-2.webp", alt: "날짜 선택" },
          { src: "/create-3.webp", alt: "링크 생성 완료" },
        ]}
        isGray={true}
      />
      <HorizontalScrollSection
        kicker="정기 모임"
        title={`스터디처럼 \n 매주 모이는 일정도`}
        desc="매주 반복되는 모임도 한 번 설정으로 끝"
        phones={[
          { src: "/regular-1.webp", alt: "요일 선택" },
          { src: "/regular-2.webp", alt: "시간대 투표" },
        ]}
      />
      <Footer />
    </div>
  );
}
