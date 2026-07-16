# SKALA-FRONT

> SK AX SKALA — **Full-Stack Engineering (HTML · CSS · JavaScript)** 종합 실습 프로젝트
> 하나의 개인 포털 사이트를 **개발자 터미널 / IDE 컨셉**으로 구현했습니다.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![No Dependencies](https://img.shields.io/badge/dependencies-0-success?style=flat-square)

---

## 프로젝트 소개

`SKALA-FRONT`는 개인의 프로필 · 강의 일정 · 휴일 계획 · 여행 앨범 · 회원가입 기능을
하나로 모은 **포털형 웹사이트**입니다.
시맨틱 마크업 위에 **VS Code 다크 테마 감성**의 스타일링과 다양한 **바닐라 JavaScript
인터랙션**을 얹어, 정적인 과제를 넘어 실제 동작하는 웹앱처럼 완성했습니다.

- **작성자**: 박영서 (Park Youngseo) · Full-stack Developer
- **저장소**: [github.com/givpro22/skala-front](https://github.com/givpro22/skala-front)
- **외부 라이브러리·CDN 0개** — 순수 HTML · CSS · JavaScript 로만 구현

---

## 기술 스택

| 구분 | 사용 기술 |
|------|-----------|
| Markup | HTML5 (Semantic Elements, Forms, Media, Table) |
| Style | CSS3 (변수 · 다크/라이트 · 애니메이션 · Flex/Grid · 반응형) |
| Script | Vanilla JavaScript (DOM · 이벤트 · localStorage · Canvas · IntersectionObserver) |
| Font | OS 기본 모노스페이스 폰트 (외부 폰트 미사용) |
| Tool | VS Code, Live Server |

---

## 폴더 구조

```
skala-front/
├── README.md
├── css/
│   └── style.css          # 전체 공통 스타일 (IDE 테마 · 애니메이션 · 반응형)
├── js/
│   ├── common.js          # 테마 토글 · 상태바 · 명령 팔레트 · 스크롤 애니메이션
│   ├── effects.js         # 부팅 화면 · 페이지 전환 · 틸트 · 코나미 · 도움말
│   ├── signup.js          # 회원가입 폼 실시간 검증
│   └── result.js          # 제출값 요약 · 컨페티
└── html/
    ├── index.html         # 메인 포털 (터미널 히어로)
    ├── myProfile.html     # 소개 (탭 · 이력 · 프로젝트 · 스킬)
    ├── myClass.html       # 강의 시간표 (셀 병합 · 오늘 요일 강조)
    ├── holiday.html       # 휴일 일과 (타임라인 · details)
    ├── myTrip.html        # 여행 앨범 (갤러리 · 라이트박스 · 미디어)
    ├── signUp.html        # 회원가입 폼
    ├── signUpResult.html  # 회원가입 결과
    └── media/             # 사진 · 음악 · 영상 (플레이스홀더 포함)
```

---

## 디자인 컨셉 — 개발자 터미널 / IDE

- **VS Code 다크 테마** 기반 · 우측 상단 버튼으로 **라이트 테마 토글** (localStorage 저장)
- 모노스페이스 폰트 + `$` `#` 프롬프트 스타일 헤딩 + 문법 강조 색상(블루 계열)
- 상단 **에디터 탭바**, 컨테이너마다 **파일명 탭**(`index.html` 등)
- 화면 하단 **VS Code 스타일 상태바** (git 브랜치 · 인코딩 · 실시간 시계)

---

## JavaScript 인터랙션

바닐라 JavaScript로 구현한 주요 동작입니다.

| 기능 | 설명 | 위치 |
|------|------|------|
| 명령 팔레트 | `⌘K` / `Ctrl+K` — 페이지 이동 · 테마 전환 · 검색 | 전체 |
| 인트로 부팅 화면 | 첫 진입 시 터미널 부팅 로그 타이핑 (세션 1회) | index |
| 페이지 전환 효과 | 링크 클릭 시 페이드 + 상단 로딩바 | 전체 |
| 스크롤 진행바 | 읽은 만큼 채워지는 상단 바 | 전체 |
| 카드 3D 틸트 | 마우스 추적 입체 효과 | 카드 |
| 터미널 타이핑 · 실시간 시계 | 히어로 타이핑 · `date` 시계 | index |
| 탭 · 스킬 바 | 탭 전환, 프로그레스 애니메이션 | myProfile |
| 오늘 요일 강조 · 셀 선택 | `Date` 기반 강조, 클릭 표시 | myClass |
| 라이트박스 갤러리 | 사진 클릭 확대 | myTrip |
| 실시간 폼 검증 | 아이디/비밀번호 검증 · 강도 미터 · 글자수 | signUp |
| 제출값 요약 · 컨페티 | URL 쿼리 파싱으로 입력값 표시 | signUpResult |
| 이스터에그 | `↑↑↓↓` 또는 팔레트 → 매트릭스 레인 | 전체 |
| 도움말 팝업/버튼 | 단축키 안내 (플로팅 버튼 · 상태바) | 전체 |

---

## 페이지별 핵심 학습 요소

| 페이지 | 핵심 태그 · 개념 |
|--------|------------------|
| `index.html` | `<header> <nav> <main> <aside> <footer>`, `<a>` 내비게이션 |
| `myProfile.html` | `<ul>` `<ol>` `<dl><dt><dd>` |
| `myClass.html` | `<table><thead><tbody>`, `rowspan` / `colspan` 셀 병합 |
| `holiday.html` | `<h1>~<h2>` `<p>` `<br>` `<mark>` `<hr>` `<details>` |
| `myTrip.html` | `<figure><figcaption>` `<img>` `<audio>` `<video>` `<source>` |
| `signUp.html` | `<form><fieldset><legend><label>`, 다양한 `<input>` · `<select>` · `<textarea>` |
| `signUpResult.html` | `method="get"` 폼 전송 · 앵커 링크 |

---

## 실행 방법

1. 저장소를 클론합니다.
   ```bash
   git clone https://github.com/givpro22/skala-front.git
   ```
2. VS Code에서 폴더를 엽니다.
3. `html/index.html`을 열고 **Live Server** (우측 하단 `Go Live`)로 실행합니다.

> 첫 진입 시 부팅 화면, `⌘K` 명령 팔레트, `↑↑↓↓` 이스터에그를 확인해 보세요.
> 미디어(`html/media/`)는 플레이스홀더가 채워져 있으며, 실제 파일로 교체하면 반영됩니다.

---

## 과제 완료 체크리스트

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
- [x] CSS 변수 · 다크/라이트 테마 전환
- [x] 애니메이션 · 트랜지션 · 화면 전환 효과
- [x] Flexbox · Grid 레이아웃 · 반응형 (Media Query)
- [x] JavaScript 인터랙션 (명령 팔레트 · 폼 검증 · 라이트박스 · 이스터에그 등)
