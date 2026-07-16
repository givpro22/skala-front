# SKALA-FRONT

> SK AX SKALA — **Full-Stack Engineering (HTML · CSS · JavaScript)** 종합 실습 프로젝트
> 하나의 개인 포털 사이트를 **개발자 터미널 / IDE 컨셉**으로 구현했습니다.

[![Live Demo](https://img.shields.io/badge/Live_Demo-▶_바로가기-000000?style=flat-square&logo=vercel&logoColor=white)](https://skala-front-ys.vercel.app/)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![No Dependencies](https://img.shields.io/badge/dependencies-0-success?style=flat-square)

**🔗 라이브 데모: https://skala-front-ys.vercel.app/**

---

## 프로젝트 소개

`SKALA-FRONT`는 개인의 프로필 · 강의 일정 · 휴일 계획 · 여행 앨범 · 회원가입 기능을
하나로 모은 **포털형 웹사이트**입니다.
시맨틱 마크업 위에 **VS Code 다크 테마 감성**의 스타일링과 다양한 **바닐라 JavaScript
인터랙션**(인터랙티브 터미널 · 업적 시스템 · 이스터에그)을 얹어, 정적인 과제를 넘어
실제 동작하는 웹앱처럼 완성했습니다.

- **작성자**: 박영서 (Park Youngseo) · Full-stack Developer
- **라이브 데모**: [skala-front-ys.vercel.app](https://skala-front-ys.vercel.app/) (Vercel 배포)
- **저장소**: [github.com/givpro22/skala-front](https://github.com/givpro22/skala-front)
- **외부 라이브러리·CDN 0개** — 순수 HTML · CSS · JavaScript 로만 구현

---

## 기술 스택

| 구분 | 사용 기술 |
|------|-----------|
| Markup | HTML5 (Semantic Elements, Forms, Media, Table) |
| Style | CSS3 (변수 · 다크/라이트 · 애니메이션 · Flex/Grid · 반응형) |
| Script | Vanilla JavaScript (DOM · 이벤트 · localStorage · Canvas · Fetch · IntersectionObserver) |
| Font | OS 기본 모노스페이스 폰트 (외부 폰트 미사용) |
| Tool | VS Code, Live Server |

---

## 폴더 구조

```
skala-front/
├── index.html              # Vercel 배포용 루트 → /html/index.html 리다이렉트
├── README.md
├── css/
│   └── style.css           # 전체 공통 스타일 (IDE 테마 · 애니메이션 · 반응형)
├── js/
│   ├── common.js           # 테마 · 상태바 · 명령 팔레트 · 스크롤 애니메이션
│   ├── effects.js          # 부팅 화면 · 페이지 전환 · 틸트 · 튜토리얼 · 히트맵
│   ├── terminal.js         # 인터랙티브 터미널 (명령어 인터프리터)
│   ├── achievements.js     # 업적 시스템 (해금 · 폭죽 · 패널)
│   ├── ambient.js          # 배경 코드 글리프 (상호작용 · 밀도 설정)
│   ├── signup.js           # 회원가입 폼 실시간 검증
│   ├── result.js           # 제출값 요약 · 컨페티
│   ├── ui-dialog.js        # 테마 커스텀 모달 (skPrompt/skAlert — 기본 prompt/alert 대체)
│   ├── weatherAPI.js       # [과제] 실시간 날씨 · 비동기 fetch (ES6 모듈, export)
│   ├── realtimeInfo.js     # [과제] 실시간 날씨 · DOM/이벤트 (모듈 import)
│   ├── upDown.js           # [과제] Up-Down 숫자 맞추기 게임
│   ├── grade.js            # [과제] 성적 계산기 (배열 · 반복 · 평균)
│   └── bag.js              # [과제] 내 가방 보기 (객체 배열 · 반복)
└── html/
    ├── index.html          # 메인 포털 (인터랙티브 터미널)
    ├── myProfile.html      # 소개 (통계 · 활동 그래프 · 탭)
    ├── myClass.html        # 강의 시간표 (셀 병합 · 오늘 요일 강조)
    ├── holiday.html        # 휴일 일과 (타임라인 · details)
    ├── myTrip.html         # 여행 앨범 (갤러리 · 라이트박스 · 미디어)
    ├── signUp.html         # 회원가입 폼
    ├── signUpResult.html   # 회원가입 결과
    └── media/              # 사진 · 음악 · 영상 (플레이스홀더 포함)
```

---

## 디자인 컨셉 — 개발자 터미널 / IDE

- **VS Code 다크 테마** 기반 · 우측 상단 버튼으로 **라이트 테마 토글** (localStorage 저장)
- 모노스페이스 폰트 + `$` `#` 프롬프트 스타일 헤딩 + 문법 강조 색상(블루 계열)
- 상단 **에디터 탭바**, 컨테이너마다 **파일명 탭**(`index.html` 등)
- 화면 하단 **VS Code 스타일 상태바** (git 브랜치 · 인코딩 · 실시간 시계 · 업적 진행도)
  · 클릭 가능 항목(도움말 · 배경 설정 · 업적) + **클릭 위치 좌표**(`Ln, Col`) 실시간 표시

---

## 인터랙티브 터미널

메인 페이지 히어로가 **직접 명령어를 입력하는 터미널**입니다. `help` 로 시작하세요.

| 명령어 | 동작 |
|--------|------|
| `about` `skills` `projects` | 자기소개 · 기술 스택 · 프로젝트 |
| `awards` `certs` `contact` | 수상 · 자격증 · 연락처 |
| `ls` · `goto <page>` | 페이지 목록 · 이동 |
| `weather <도시>` | 실시간 날씨 조회 (Open-Meteo API) |
| `updown` `grade` `bag` | 미니 앱 실행 (숫자 게임 · 성적 계산기 · 내 가방) |
| `neofetch` | 개발자 정보 ASCII 아트 |
| `cowsay <말>` · `rps <가위\|바위\|보>` | ASCII 소 · 가위바위보 게임 |
| `joke` `coffee` `sudo` | 유머 · 커피 · xkcd 개그 |
| `theme` `matrix` `achievements` | 테마 전환 · 이스터에그 · 업적 목록 |

- `↑` / `↓` 명령 히스토리, `clear` 초기화, 없는 명령 처리

---

## 업적 시스템 & 기타 인터랙션

| 기능 | 설명 |
|------|------|
| 업적 시스템 | 탐험하며 **숨은 업적 해금** → 폭죽 + 배너(설명·달성 방법), 하단 🏆 클릭 시 전체 목록 |
| 배경 코드 글리프 | `</>` `{ }` `=>` 등이 배경을 유영 · **마우스 근처면 밀려나며 밝아지고 클릭 시 퍼짐** · 밀도 설정(끄기/적게/보통/많이) |
| 첫 방문 튜토리얼 | 처음 접속 시 사용법 안내 모달 (재열람: 우측 하단 `?` 버튼) |
| 명령 팔레트 | `⌘K` / `Ctrl+K` — 페이지 이동 · 테마 · 업적 · 검색 |
| 인트로 부팅 화면 | 첫 진입 시 터미널 부팅 로그 타이핑 (세션 1회) |
| 페이지 전환 · 스크롤 진행바 | 페이드 + 상단 로딩바, 읽은 만큼 채워지는 바 |
| 카드 3D 틸트 | 마우스 추적 입체 효과 |
| 통계 카운터 · 활동 그래프 | 소개 페이지 숫자 카운트업, **GitHub 실제 커밋 히트맵** |
| 이스터에그 | `↑↑↓↓` → 매트릭스 레인 |
| 폼 검증 · 라이트박스 · 시간표 강조 | 실시간 검증, 사진 확대, 오늘 요일 자동 강조 |

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

## JavaScript 실습 과제

강의 실습 과제를 메인 페이지(`index.html`) 우측 **실시간 날씨 / 미니 앱** 영역에서 직접 실행할 수 있습니다.

| 과제 | 파일 | 핵심 개념 |
|------|------|-----------|
| 실시간 날씨 — 모듈 분리 | `js/weatherAPI.js` | ES6 `export` · 관심사 분리 |
| 실시간 날씨 — 비동기 호출 | `js/weatherAPI.js` | `async/await` · `fetch` (Open-Meteo API) |
| 실시간 날씨 — DOM · 이벤트 | `js/realtimeInfo.js` | `import` · `change` 이벤트 · `innerHTML` 갱신 |
| Up-Down 숫자 맞추기 게임 | `js/upDown.js` | `Math.random` · `while` · `prompt`/`alert` |
| 성적 계산기 | `js/grade.js` | 배열 · `for` 반복 · 평균 · 합격 판정 |
| 내 가방 보기 | `js/bag.js` | 객체 배열 · `for` 반복 · `alert` 출력 |

- 날씨 위젯은 도시 `<select>` 를 바꾸면 `change` 이벤트로 API 를 비동기 호출해 **현재/체감온도 · 습도 · 풍속 · 최고·최저 · 시간별 미니 예보(sparkline)** 를 실시간 표시합니다. 날씨 상태(맑음·비·눈·뇌우 등)에 따라 카드 배경 톤이 바뀝니다.
- 모듈 스크립트는 `<script type="module">` 로 로드되어 `import`/`export` 가 동작합니다 → `file://` 보다 **Live Server**에서 안정적입니다.
- 미니 앱은 **카드형 런처**(우측 aside)에서 실행하거나, 인터랙티브 터미널에 `weather <도시>` · `updown` · `grade` · `bag` 을 입력해도 실행됩니다. (게임/계산기는 전역 함수 `startUpDown` · `startGrade` · `showMyBag` 를 재사용)
- 입력/출력은 브라우저 기본 `prompt`/`alert`(스타일 불가) 대신 **사이트 테마에 맞춘 커스텀 모달**(`ui-dialog.js` → `skPrompt`/`skAlert`)을 사용합니다. 과제 로직(`Math.random`·`while`/`for`·배열·조건문)은 그대로이고, 모듈이 없으면 기본 `prompt`/`alert` 로 자동 대체됩니다.
- 실시간 날씨 조회 / 미니 앱 실행 시 **업적**(기상캐스터 · 미니앱 플레이어)이 해금됩니다.

---

## 실행 방법

1. 저장소를 클론합니다.
   ```bash
   git clone https://github.com/givpro22/skala-front.git
   ```
2. VS Code에서 폴더를 엽니다.
3. `html/index.html`을 열고 **Live Server** (우측 하단 `Go Live`)로 실행합니다.

> 처음 들어가면 튜토리얼이 뜹니다. 터미널에 `help`, `⌘K` 명령 팔레트, `↑↑↓↓` 이스터에그,
> 그리고 사이트를 돌아다니며 업적을 해금해 보세요.
> GitHub 활동 그래프는 외부 요청이 있어 `file://` 보다 **Live Server**에서 안정적으로 동작합니다.

### Vercel 배포
- **배포 완료**: [skala-front-ys.vercel.app](https://skala-front-ys.vercel.app/)
- 루트 `index.html`이 `/html/index.html`로 리다이렉트하도록 되어 있어, 저장소를 그대로 임포트하면 됩니다.
- Framework Preset: **Other**, Root Directory: `./`, Build/Output: 비워두기.

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
- [x] 인터랙티브 터미널 · 명령 팔레트
- [x] 업적 시스템 · 튜토리얼 · 이스터에그
- [x] GitHub 활동 그래프 (Fetch API)

### JavaScript 실습 과제
- [x] 실시간 날씨 — 모듈 분리 (`weatherAPI.js`)
- [x] 실시간 날씨 — 비동기 호출 (`async/await` · `fetch`)
- [x] 실시간 날씨 — DOM 조작 · 이벤트 처리 (`realtimeInfo.js`)
- [x] Up-Down 숫자 맞추기 게임 (`upDown.js`)
- [x] 성적 계산기 (`grade.js`)
- [x] 내 가방 보기 (`bag.js`)
