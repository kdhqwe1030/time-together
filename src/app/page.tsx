import Footer from "../components/home/Footer";
import Hero from "../components/home/Hero";
import HorizontalScrollSection from "../components/home/HorizontalScrollSection";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Hero />

      <HorizontalScrollSection
        kicker="투표"
        title={`로그인 없이 링크 하나로 투표 완료`}
        desc={`이름만 입력하면 바로 투표에 참여할 수 있어요.\n로그인 없이 링크 하나면 끝!`}
        phones={[
          { src: "/vote-1.webp", alt: "투표 참여 화면" },
          { src: "/vote-2.webp", alt: "투표 결과 화면" },
        ]}
      />
      <HorizontalScrollSection
        kicker="생성"
        title={`몇 번의 클릭으로 모임 일정 만들기`}
        desc={`몇 번의 클릭만으로 모임 일정이 바로 만들어져요.\n완성된 링크를 바로 공유해보세요.`}
        phones={[
          { src: "/create-1.webp", alt: "모임 이름 입력" },
          { src: "/create-2.webp", alt: "날짜 선택" },
          { src: "/create-3.webp", alt: "링크 생성 완료" },
        ]}
        isGray={true}
      />
      <HorizontalScrollSection
        kicker="정기 모임"
        title={`매주 모이는 일정도 간편하게`}
        desc={`스터디나 동아리처럼 매주 반복되는 일정의 \n요일과 시간대를 정해보세요.`}
        phones={[
          { src: "/regular-1.webp", alt: "요일 선택" },
          { src: "/regular-2.webp", alt: "시간대 투표" },
        ]}
      />
      <Footer />
    </div>
  );
}
