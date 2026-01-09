export default function Footer() {
  return (
    <footer className="w-full bg-white border-t border-gray-100 py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-col gap-6">
          {/* 상단: 로고 & 설명 */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">언제모임</h3>
            <p className="text-sm text-gray-500">
              로그인 없이 간편하게 모임 일정을 조율해보세요
            </p>
          </div>

          {/* 하단: 문의 & 제작자 */}
          <div className="flex flex-col gap-3 text-sm">
            {/* 문의하기 */}
            <div className="flex items-center gap-2 text-gray-600">
              <span className="text-gray-700 font-medium">문의하기</span>
              <a
                href="mailto:kdhqwe1030@gmail.com"
                className="hover:text-gray-900 transition-colors border-b border-border"
              >
                kdhqwe1030@gmail.com
              </a>
              <span className="text-gray-300">|</span>
              <a
                href="https://forms.gle/5zFRjd4dbAi6zavy9"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-900 transition-colors"
              >
                구글폼
              </a>
            </div>

            {/* 제작자 */}
            <p className="text-gray-400 text-xs">
              © 2025 언제모임. Made by kdhqwe1030
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
