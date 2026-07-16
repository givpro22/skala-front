# 🚀 SKALA-FRONT

> SK AX SKALA — **Full-Stack Engineering (HTML · CSS · JavaScript)** 종합 실습 프로젝트
> 하나의 개인 포털 사이트를 만들며 웹 표준 마크업부터 스타일링까지 단계별로 구현했습니다.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)

---

## 📖 프로젝트 소개

`SKALA-FRONT`는 개인의 프로필 · 강의 일정 · 휴일 계획 · 여행 앨범 · 회원가입 기능을
하나로 모은 **포털형 웹사이트**입니다.
시맨틱 태그를 기반으로 접근성과 SEO를 고려하여 마크업하고,
외부 CSS로 전체 테마를 일관되게 스타일링했습니다.

- **작성자**: ParkYoungSeo
- **저장소**: [github.com/givpro22/skala-front](https://github.com/givpro22/skala-front)

---

## 🛠️ 기술 스택

| 구분 | 사용 기술 |
|------|-----------|
| Markup | HTML5 (Semantic Elements, Forms, Media, Table) |
| Style | CSS3 (변수 · 다크모드 · 애니메이션 · Flex/Grid · 반응형) |
| Script | Vanilla JavaScript (DOM · 이벤트 · localStorage · IntersectionObserver) |
| Font | OS 기본 시스템 폰트 (외부 라이브러리·CDN 미사용) |
| Tool | VS Code, Live Server |

---

## 📂 폴더 구조

```
skala-front/
├── README.md
├── css/
│   └── style.css          # 전체 공통 스타일 (테마 · 다크모드 · 애니메이션 · 반응형)
├── js/
│   ├── common.js          # 공통 (다크모드 · 스크롤 애니메이션 · 시계 · 맨위로)
│   ├── signup.js          # 회원가입 폼 실시간 검증 · 비밀번호 강도
│   └── result.js          # 제출값 요약 표시 · 컨페티
└── html/
    ├── index.html         # 🏠 메인 포털 (타이핑 · 시계 · 이미지 슬라이더)
    ├── myProfile.html     # 👤 나의 소개 (탭 · 스킬 프로그레스바)
    ├── myClass.html       # 📅 나의 강의 시간표 (오늘 요일 강조 · 셀 선택)
    ├── holiday.html       # 🎉 나의 휴일 일과 (타임라인 · details)
    ├── myTrip.html        # 🌏 나의 여행 앨범 (라이트박스 갤러리)
    ├── signUp.html        # 📝 회원가입 폼 (실시간 검증)
    ├── signUpResult.html  # ✅ 회원가입 결과 (제출값 요약 · 컨페티)
    └── media/             # 여행 앨범용 이미지 · 오디오 · 비디오
```

---

## 📄 페이지별 구현 내용

| 페이지 | 설명 | 핵심 학습 요소 |
|--------|------|----------------|
| `index.html` | 전체 페이지를 잇는 메인 허브 | `<header> <nav> <main> <aside> <footer>`, `<a>` 내비게이션 |
| `myProfile.html` | 좋아하는 것 · 계획 · 나를 설명하는 단어 | `<ul>` `<ol>` `<dl><dt><dd>` |
| `myClass.html` | 주간 강의 시간표 | `<table><thead><tbody>`, `rowspan` / `colspan` 셀 병합 |
| `holiday.html` | 휴일 하루 일과 | `<h1>~<h2>` `<p>` `<br>` `<mark>` `<hr>` |
| `myTrip.html` | 여행 사진 · 음악 · 영상 앨범 | `<figure><figcaption>` `<img>` `<audio>` `<video>` `<source>` |
| `signUp.html` | 회원가입 입력 폼 | `<form><fieldset><legend><label>`, 다양한 `<input>` 타입, `<select>` `<textarea>` |
| `signUpResult.html` | 가입 완료 안내 | `method="get"` 폼 전송 후 이동, 앵커 링크 |

---

## 🎨 스타일링 (css/style.css)

전체 페이지에 외부 스타일시트를 연결하여 통일된 디자인을 적용했습니다.

- **전체 테마** — OS 기본 시스템 폰트, 배경색 · 줄간격 · 기본 텍스트 색상
- **제목 강조** — `h1` `h2`에 색상 · 패딩 · 보더로 시각적 계층 구성
- **링크 스타일** — `:hover` 시 색상 전환 효과
- **박스 모델** — `.container`로 콘텐츠 가운데 정렬, 여행지 `.trip-card`, 시간표 테이블 꾸미기
- **폼 스타일** — 입력창 · `fieldset` 테두리 · 버튼 디자인
- **CSS 변수 & 다크모드** — `:root` 토큰과 `[data-theme="dark"]`로 라이트/다크 테마 전환
- **애니메이션** — `@keyframes`(fadeInUp · blink · confetti), `transition`, `:hover` 효과
- **레이아웃** — Flexbox 상단 네비게이션, CSS Grid 카드/갤러리
- **반응형** — `@media`로 PC · 태블릿 · 모바일 대응, `prefers-reduced-motion` 접근성 배려

---

## ⚡ JavaScript 인터랙션

바닐라 JavaScript로 페이지에 동작을 더했습니다.

| 기능 | 설명 | 페이지 |
|------|------|--------|
| 🌙 다크모드 토글 | `localStorage`에 테마 저장 후 재방문 시 유지 | 전체 |
| ⬆️ 맨 위로 · 스크롤 등장 | `IntersectionObserver`로 요소가 보일 때 페이드인 | 전체 |
| 🕒 실시간 시계 · 타이핑 효과 | `setInterval` 시계, 문구 타이핑 애니메이션 | index |
| 🖼️ 이미지 슬라이더 | 자동 · 수동 사진 전환 | index |
| 🗂️ 탭 전환 · 스킬 바 | 탭 UI, 프로그레스 바 애니메이션, 목표 추가 | myProfile |
| 📅 오늘 요일 강조 | `Date`로 오늘 열 강조, 셀 클릭 표시 | myClass |
| 🔍 라이트박스 갤러리 | 사진 클릭 시 모달 확대 | myTrip |
| ✅ 실시간 폼 검증 | 아이디/비밀번호 검증, 강도 미터, 글자수 카운터 | signUp |
| 🎊 제출값 요약 · 컨페티 | URL 쿼리 파싱으로 입력값 표시 + 축하 효과 | signUpResult |

---

## ▶️ 실행 방법

1. 저장소를 클론합니다.
   ```bash
   git clone https://github.com/givpro22/skala-front.git
   ```
2. VS Code에서 폴더를 엽니다.
3. `html/index.html`을 열고 **Live Server** (우측 하단 `Go Live`)로 실행합니다.

> 💡 `myTrip.html`의 이미지 · 음악 · 영상은 `html/media/` 폴더에 실제 미디어 파일을 넣으면 표시됩니다.

---

## ✅ 과제 완료 체크리스트

### HTML
- [x] Project 구성과 index.html 생성
- [x] 나의 소개 (myProfile)
- [x] 나의 강의 일정 (myClass)
- [x] 바로가기 (index 내비게이션)
- [x] 회원가입 (signUp)
- [x] 회원가입 결과 (signUpResult)
- [x] 나의 여행지 (myTrip)
- [x] 포털 사이트형 메인 Hub

### CSS
- [x] 미션1 — 전체 테마 및 텍스트 Styling
- [x] 미션2 — 박스 모델의 이해
- [x] 미션3 — 가독성 높은 회원가입 폼

### 심화 (CSS · JavaScript)
- [x] CSS 변수 · 다크모드 테마 전환
- [x] 애니메이션 · 트랜지션 효과
- [x] Flexbox · Grid 레이아웃
- [x] 반응형 (Media Query)
- [x] JavaScript 인터랙션 (검증 · 슬라이더 · 라이트박스 · 컨페티 등)
