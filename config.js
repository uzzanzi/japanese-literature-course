/*
 * ────────────────────────────────────────────────
 *  사이트 설정 파일 — 사이트의 모든 글은 여기서 고칩니다.
 * ────────────────────────────────────────────────
 *  · 따옴표("") 안의 글만 바꾸면 됩니다.
 *  · 항목을 늘리려면 { ... } 묶음을 복사해 쉼표(,)로 이어 붙이세요.
 *  · 항목을 지우려면 { ... } 묶음과 뒤의 쉼표를 함께 지우세요.
 *  · "○○"로 표시된 곳은 아직 채워지지 않은 자리입니다.
 *  · 저장한 뒤 index.html을 새로고침하면 바로 반영됩니다.
 */
window.SITE_CONFIG = {

  /* ── 기본 정보 ── */
  site: {
    university: "고려대학교",
    department: "○○학과",
    courseName: "일본근현대문학의 이해",
    courseNameJp: "日本近現代文学の理解",
    semester: "2026년 상반기",
    footerNote: "강의계획서와 강의자료를 바탕으로 정리한 소개 페이지입니다."
  },

  /* ── 상단 메뉴 (id는 아래 각 섹션의 id와 같아야 합니다) ── */
  nav: [
    { id: "about",      label: "프로그램 소개" },
    { id: "curriculum", label: "커리큘럼" },
    { id: "enroll",     label: "수강 안내" },
    { id: "student",    label: "수강생 공간" },
    { id: "faq",        label: "FAQ" },
    { id: "instructor", label: "교수자" }
  ],

  /* ── 첫 화면 ── */
  hero: {
    badge: "2026 상반기 집중 프로그램",
    // 제목은 site.courseName이 표시됩니다.
    subtitle: "AI 기반 데이터 활용능력 배양",
    description: "일본의 로봇SF를 읽으며 “인간이란 무엇인가”를 묻는 수업입니다. 생성형 AI 도구로 작품과 자료를 직접 분석해 보며, 기계가 답하는 시대에 데이터를 읽고 판단하는 힘을 기릅니다.",
    applyButton:      { label: "수강 신청",     link: "#apply" },    // 사이트 밖 신청 페이지를 쓰려면 주소를 넣으세요 (예: "https://...")
    curriculumButton: { label: "커리큘럼 보기", link: "#curriculum" },
    // 첫 화면 아래 요약 정보
    quickInfo: [
      { icon: "📅", label: "일정",     value: "2026년 상반기 · 15주" },
      { icon: "⏰", label: "시간",     value: "매주 화요일 ○○:○○–○○:○○" },
      { icon: "🏫", label: "수업 방식", value: "○○ (대면 / 온라인 / 혼합)" },
      { icon: "🎓", label: "수강 대상", value: "○○" }
    ]
  },

  /* ── 프로그램 소개: 숫자 카드 + 장점 슬라이드 ── */
  about: {
    title: "프로그램 소개",
    subtitle: "기계가 답하는 시대, 인간을 묻는다",
    // value에 숫자를 넣으면 화면에 들어올 때 숫자가 올라가는 효과가 납니다.
    stats: [
      { value: "15", unit: "주",  label: "집중 과정" },
      { value: "6",  unit: "종",  label: "실습 AI 도구" },
      { value: "○",  unit: "권",  label: "교수자 저술" },
      { value: "○",  unit: "년",  label: "강의 경력" }
    ],
    strengthsTitle: "이 수업의 장점",
    // 슬라이드로 넘겨 보는 장점 카드 (예시 문구 — 자유롭게 고치세요)
    strengths: [
      { icon: "🌸", title: "문학으로 묻는 AI 시대",
        text: "로봇과 인공지능을 상상해 온 일본 SF를 통해 기술 변화 앞에서 인간의 본질과 역할을 스스로 판단하는 시선을 기릅니다." },
      { icon: "🤖", title: "직접 써 보는 AI 실습",
        text: "매 단원마다 생성형 AI 도구로 자료를 찾고, 요약하고, 비교하며 AI를 ‘쓰는 법’과 ‘의심하는 법’을 함께 익힙니다." },
      { icon: "📊", title: "데이터로 읽는 작품",
        text: "작품 속 어휘와 주제를 데이터로 정리하고 시각화해, 감상에 근거를 더하는 읽기 방법을 연습합니다." },
      { icon: "📖", title: "원문과 함께 천천히",
        text: "호시 신이치, 쓰쓰이 야스타카, 고마쓰 사쿄 등 일본 로봇SF 다섯 편을 원문과 함께 깊이 읽고 토론합니다." },
      { icon: "🧭", title: "계보로 보는 큰 그림",
        text: "『프랑켄슈타인』에서 『R.U.R.』, 『철완 아톰』, 생성형 AI까지 로봇 상상의 역사를 한 흐름으로 정리합니다." }
    ]
  },

  /* ── 수업 일정 기본값 (커리큘럼과 달력에 함께 쓰입니다) ── */
  schedule: {
    firstClass: "2026-03-03",        // 첫 수업 날짜. 여기서부터 매주 같은 요일(화요일)로 날짜가 자동 계산됩니다.
    time: "○○:○○–○○:○○",           // 기본 수업 시간
    place: "○○관 ○○○호",            // 기본 수업 장소
    // 수업이 없는 날 (이 날은 건너뛰고 다음 주로 밀립니다)
    holidays: [
      { date: "2026-05-05", name: "어린이날 (휴강)" }
    ],
    submitUrl: ""                    // 과제 제출 기본 주소 (예: LMS 과제 페이지). 비워 두면 '제출 링크 준비 중'으로 표시됩니다.
  },

  /* ── 커리큘럼 (15주) ──
   *  · 주차 번호와 날짜는 자동으로 붙습니다.
   *  · 특정 주만 날짜·시간·장소가 다르면 그 주에 date / time / place를 적으세요.
   *      예) date: "2026-03-05", place: "온라인 (Zoom)"
   *  · 과제가 있는 주에는 assignment를 넣습니다. due는 "연-월-일T시:분" 형식입니다.
   *  · videos의 링크는 현재 유튜브 검색 결과로 연결됩니다. 실제 영상 주소로 바꿔 주세요.
   *  · 과제 내용은 예시입니다.
   */
  curriculum: {
    title: "커리큘럼",
    subtitle: "15주 동안 개념에서 계보로, 계보에서 작품으로",
    calendarTitle: "수업 달력",
    phases: [
      {
        title: "과학소설과 SF",
        summary: "용어와 개념, 유럽·미국의 흐름, 일본의 번역과 수용.",
        weeks: [
          { title: "오리엔테이션 · 과학소설과 SF의 개념",
            content: ["수업 소개와 평가 방법 안내", "과학소설·SF·공상과학, 용어의 차이", "실습용 AI 도구 계정 준비"],
            videos: [{ label: "SF란 무엇인가", url: "https://www.youtube.com/results?search_query=SF%EB%9E%80+%EB%AC%B4%EC%97%87%EC%9D%B8%EA%B0%80" }] },
          { title: "과학소설과 SF의 흐름",
            content: ["메리 셸리 『프랑켄슈타인』과 근대 과학", "쥘 베른, H. G. 웰스", "디스토피아 소설과 미국 대중 SF"],
            videos: [{ label: "프랑켄슈타인 해설", url: "https://www.youtube.com/results?search_query=%ED%94%84%EB%9E%91%EC%BC%84%EC%8A%88%ED%83%80%EC%9D%B8+%ED%95%B4%EC%84%A4" }],
            assignment: {
              title: "AI로 SF 개념 지도 만들기",
              desc: "생성형 AI 도구로 ‘과학소설’과 ‘SF’의 정의를 3가지 이상 수집하고, 출처를 확인해 한 장의 개념 지도로 정리합니다. AI 답변 중 틀린 부분이 있다면 표시해 주세요.",
              due: "2026-03-16T23:59"
            } },
          { title: "일본 근대문학과 과학소설의 번역 · SF의 형성",
            content: ["쥘 베른 『인도 왕비의 유산』이 동아시아에 들어온 길", "1887 『鉄世界』 → 1903 중국어판 → 1908 이해조 『철세계』", "일본 SF의 형성"] }
        ]
      },
      {
        title: "로봇이라는 상상",
        summary: "희곡과 애니메이션 속 로봇, 사이보그, 안드로이드.",
        weeks: [
          { title: "로봇의 개념과 과학소설 · 카렐 차페크 『R.U.R.』",
            content: ["‘로봇’이라는 말의 탄생 (체코어 robota)", "1923년 일본어 번역 『인조인간』과 이광수 「인조인」", "노동하는 기계는 누구의 자리를 대신하는가"],
            videos: [{ label: "R.U.R. 해설", url: "https://www.youtube.com/results?search_query=R.U.R.+%EC%B0%A8%ED%8E%98%ED%81%AC" }] },
          { title: "로봇SF의 흐름 · 애니메이션 속 로봇",
            content: ["『철완 아톰』 — 마음을 가진 소년 로봇", "『공각기동대』 — 몸이 기계라면 나는 누구인가", "『신세기 에반게리온』"],
            videos: [{ label: "철완 아톰 소개", url: "https://www.youtube.com/results?search_query=%EC%B2%A0%EC%99%84+%EC%95%84%ED%86%B0" }],
            assignment: {
              title: "로봇 애니메이션 비교 노트",
              desc: "수업에서 다룬 애니메이션 중 한 편을 골라 ‘로봇이 인간을 닮은 점과 다른 점’을 표로 정리하고, 300자 내외의 생각을 덧붙입니다.",
              due: "2026-04-06T23:59"
            } }
        ]
      },
      {
        title: "로봇SF 읽기",
        summary: "일본 로봇SF 다섯 편을 한 편씩 깊이 읽고 토론합니다.",
        weeks: [
          { title: "호시 신이치 「花とひみつ」",
            content: ["쇼트쇼트라는 형식", "원문 강독과 토론"] },
          { title: "쓰쓰이 야스타카 「お紺昇天」 (1)",
            content: ["작가와 작품 배경", "원문 강독 (전반부)"] },
          { title: "중간시험", exam: true,
            content: ["1–7주 범위"] },
          { title: "쓰쓰이 야스타카 「お紺昇天」 (2)",
            content: ["원문 강독 (후반부)", "기계에 대한 애착은 무엇을 말하는가"],
            assignment: {
              title: "작품 어휘 데이터 정리",
              desc: "「お紺昇天」에서 기계와 감정을 나타내는 표현을 골라 스프레드시트에 정리하고, 빈도를 간단한 그래프로 만들어 제출합니다.",
              due: "2026-05-11T23:59"
            } },
          { title: "야노 도오루 「幽霊ロボット」",
            content: ["번역가이자 작가 야노 도오루", "원문 강독과 토론"] },
          { title: "히라이 가즈마사 「ロボットは泣かない」 (1)",
            content: ["『8맨』 원작자 히라이 가즈마사", "원문 강독 (전반부)"] },
          { title: "히라이 가즈마사 「ロボットは泣かない」 (2)",
            content: ["원문 강독 (후반부)", "로봇은 왜 울지 않는가"] },
          { title: "고마쓰 사쿄 「ヴォミーサ」 (1)",
            content: ["『일본 침몰』의 작가 고마쓰 사쿄", "원문 강독 (전반부)"],
            assignment: {
              title: "기말 비평문",
              desc: "학기 중 읽은 작품 한 편을 골라, AI 도구로 찾은 자료와 직접 정리한 데이터를 근거로 ‘기계와 구별되는 인간’에 대한 비평문(A4 2쪽)을 씁니다. 사용한 AI 도구와 프롬프트를 부록으로 붙여 주세요.",
              due: "2026-06-08T23:59"
            } },
          { title: "고마쓰 사쿄 「ヴォミーサ」 (2)",
            content: ["원문 강독 (후반부)", "학기 정리 — 기계가 답하는 시대, 인간을 묻는다"] },
          { title: "기말시험", exam: true,
            content: ["전 범위"] }
        ]
      }
    ]
  },

  /* ── 실습 AI 도구 (예시 목록 — 실제 사용하는 도구로 바꾸세요) ── */
  tools: {
    title: "실습에 쓰는 AI 도구",
    subtitle: "읽고, 찾고, 정리하고, 보여 주는 도구들",
    items: [
      { icon: "💬", name: "ChatGPT",    use: "작품 배경 조사와 질문 만들기" },
      { icon: "✳️", name: "Claude",     use: "긴 원문 요약과 번역 비교" },
      { icon: "🔷", name: "Gemini",     use: "자료 검색과 이미지 분석" },
      { icon: "📓", name: "NotebookLM", use: "강의자료 기반 질의응답과 복습" },
      { icon: "🔎", name: "Perplexity", use: "출처가 달린 자료 검색" },
      { icon: "📈", name: "Google Sheets", use: "작품 데이터 정리와 시각화" }
    ]
  },

  /* ── 수강 안내: 준비물 + 교재 ── */
  enroll: {
    title: "수강 안내",
    subtitle: "수업 전에 준비해 주세요",
    prepTitle: "수강 준비물",
    prep: [
      { icon: "💻", title: "노트북 또는 태블릿", text: "실습 시간에 AI 도구를 직접 사용합니다." },
      { icon: "🔑", title: "AI 도구 계정",      text: "실습 도구에 로그인할 개인 계정을 미리 만들어 두세요." },
      { icon: "📘", title: "교재",              text: "첫 작품 읽기(6주) 전까지 준비해 주세요." },
      { icon: "✏️", title: "읽기 노트",          text: "작품마다 질문과 메모를 정리할 노트를 준비하세요." }
    ],
    cards: [
      { icon: "📖", title: "교재",
        items: [
          "星新一 他『ロボット篇 幽霊ロボット/ヴォミーサ』(SFショートストーリー傑作セレクション, 汐文社, 2018)",
          "자체 자료"
        ] },
      { icon: "📚", title: "참고서",
        items: [
          "長山靖生『日本SF精神史』(河出書房新社, 2018)",
          "고장원 『중국과 일본에서 SF소설은 어떻게 진화했는가?』(부크크, 2017)",
          "대중문학연구회 편 『과학소설이란 무엇인가?』(국학자료원, 2000)"
        ] },
      { icon: "📝", title: "평가",
        items: [
          "중간시험 ○○%",
          "기말시험 ○○%",
          "출석 및 참여 ○○%"
        ] }
    ]
  },

  /* ── FAQ ── (답변은 예시 자리입니다. 실제 내용으로 바꿔 주세요) */
  faq: {
    title: "자주 묻는 질문",
    subtitle: "궁금한 점을 먼저 살펴보세요",
    items: [
      { q: "일본어를 잘 몰라도 수강할 수 있나요?",
        a: "○○ (수강에 필요한 일본어 수준을 적어 주세요.)" },
      { q: "AI 도구를 한 번도 써 본 적이 없어도 괜찮나요?",
        a: "○○ (실습 난이도와 사전 안내 방법을 적어 주세요.)" },
      { q: "유료 AI 서비스에 가입해야 하나요?",
        a: "○○ (무료 버전으로 충분한지 적어 주세요.)" },
      { q: "교재는 어디서 구하나요?",
        a: "○○ (구입처 또는 배포 방법을 적어 주세요.)" },
      { q: "시험은 어떤 방식으로 보나요?",
        a: "중간시험과 기말시험이 있습니다. ○○" }
    ]
  },

  /* ── 교수자 (페이지 맨 아래 푸터에 표시) ── */
  instructor: {
    name: "김효순",
    role: "담당 교수",
    photo: "",            // 사진 파일 경로 (예: "images/professor.jpg"). 비워 두면 이니셜이 표시됩니다.
    bio: "○○ (연구 분야와 간단한 소개를 적어 주세요.)",
    contacts: [
      { icon: "✉️", label: "이메일",   value: "○○@korea.ac.kr" },
      { icon: "🏢", label: "연구실",   value: "○○관 ○○○호" },
      { icon: "🕑", label: "면담 시간", value: "○요일 ○시 (사전 예약)" }
    ]
  },

  /* ════════════════════════════════════════════════
   *  수강생 참여 기능
   * ════════════════════════════════════════════════ */

  /* ── 데이터 저장 위치 ──
   *  · url을 비워 두면 "체험 모드"입니다. 투표·신청·출석·제출 기록이
   *    지금 보고 있는 브라우저에만 저장되어 다른 사람과 공유되지 않습니다.
   *  · 실제 운영하려면 apps-script/설정방법.md 안내대로 구글 시트를 연결하고,
   *    배포된 웹 앱 주소(https://script.google.com/macros/s/.../exec)를 url에 넣으세요.
   */
  backend: {
    url: ""
  },

  /* ── 주제 투표 ── */
  poll: {
    title: "가장 먼저 배우고 싶은 주제는?",
    subtitle: "한 사람당 한 번 투표할 수 있고, 결과는 실시간으로 바뀝니다",
    refreshSeconds: 10,        // 결과를 새로 불러오는 간격 (초)
    options: [
      "생성형 AI로 문학 자료 찾기",
      "작품 속 단어를 데이터로 분석하기",
      "로봇SF와 애니메이션의 역사",
      "AI 번역과 원문 비교하기",
      "AI 시대의 창작과 저작권"
    ]
  },

  /* ── 수강 신청서 (수강 안내 섹션 안에 표시) ──
   *  type: text / email / tel / number / select / radio / textarea / checkbox
   *  required: true 이면 필수 항목입니다.
   */
  applyForm: {
    title: "수강 신청서",
    intro: "아래 항목을 작성해 제출해 주세요. * 표시는 필수 항목입니다.",
    submitLabel: "신청서 제출",
    successTitle: "신청이 접수되었습니다 🌸",
    successText: "확인 후 이메일로 안내드리겠습니다.",
    fields: [
      { name: "name",    label: "이름",        type: "text",  required: true, placeholder: "홍길동" },
      { name: "studentId", label: "학번",      type: "text",  required: true, placeholder: "2026123456",
        pattern: "^[0-9]{10}$", patternMessage: "학번은 숫자 10자리로 적어 주세요." },
      { name: "major",   label: "소속 학과",   type: "text",  required: true, placeholder: "○○학과" },
      { name: "year",    label: "학년",        type: "select", required: true, options: ["1학년", "2학년", "3학년", "4학년", "기타"] },
      { name: "email",   label: "이메일",      type: "email", required: true, placeholder: "you@korea.ac.kr" },
      { name: "phone",   label: "연락처",      type: "tel",   required: false, placeholder: "010-0000-0000",
        pattern: "^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$", patternMessage: "010-0000-0000 형식으로 적어 주세요." },
      { name: "japanese", label: "일본어 수준", type: "radio", required: true, options: ["처음 배움", "기초 (히라가나·가타카나)", "중급 이상"] },
      { name: "motive",  label: "수강 동기",   type: "textarea", required: true, placeholder: "이 수업에서 기대하는 점을 자유롭게 적어 주세요.", minLength: 10 },
      { name: "agree",   label: "개인정보 수집·이용에 동의합니다 (수강 관리 목적, 학기 종료 후 파기)", type: "checkbox", required: true }
    ]
  },

  /* ── 수강생 공간: 로그인 · 출석 · 과제 제출 ── */
  student: {
    title: "수강생 공간",
    subtitle: "로그인하고 출석을 체크하거나 과제를 제출하세요",
    usePin: true,              // true면 학번·이름과 함께 인증번호(교수자가 따로 안내)를 확인합니다
    maxFileMB: 10,
    accept: ".pdf,.hwp,.hwpx,.doc,.docx,.ppt,.pptx,.xlsx,.zip,.png,.jpg,.jpeg",
    allowLate: false           // true면 마감 후에도 제출 가능 (지각 제출로 표시)
  },

  /* ── 첫 화면 안내 팝업 ── */
  popup: {
    enabled: true,
    delaySeconds: 1.5,         // 페이지가 열리고 몇 초 뒤에 띄울지
    title: "2026 상반기 수강 신청 안내",
    text: "AI 기반 데이터 활용능력을 기르는 15주 집중 프로그램입니다. 신청서를 작성하면 확인 후 이메일로 안내드립니다.",
    buttonLabel: "수강 신청하기",
    link: "#apply"
  },

  /* ── 첫 방문 환영 효과 ── */
  welcome: {
    enabled: true,
    message: "처음 오셨네요, 환영합니다! 🌸"
  },

  /* ── 공지사항 (내용은 관리자 화면에서 올립니다) ── */
  notice: {
    title: "공지사항",
    maxShown: 3                // 첫 화면 아래에 보여 줄 공지 개수
  },

  /* ── 관리자 ──
   *  비밀번호 자체는 저장하지 않고, 알아볼 수 없게 바꾼 값(해시)만 저장합니다.
   *  비밀번호는 관리자 화면 → '비밀번호' 탭에서 바꾸고, 설정 파일로 저장하세요.
   */
  admin: {
    salt: "9b3e89b5f2d7d524",
    passwordHash: "92ec266ca0fb0e8b745aa34ec38d61e1fdcafb6812fcfd9ca2acf0c51789f0cf"
  }
};
