# media

각 페이지에서 사용하는 미디어 파일입니다. 현재는 **플레이스홀더**가 채워져 있으며,
실제 파일로 교체하면 그대로 반영됩니다.

## 프로필 (`myProfile.html`)
- `profile.png` — 박영서 프로필 사진 (실제 사진)

## 여행 앨범 (`myTrip.html`, `index.html`)
- `trip1.svg`, `trip2.svg`, `trip3.svg` — 여행 사진 (플레이스홀더 SVG)
- `travel-music.wav` — 배경 음악 (플레이스홀더, 파이썬 생성)
- `vlog-poster.svg` — 영상 포스터 (플레이스홀더)

### 실제 파일로 교체하려면
- 사진: `trip1.jpg` 등 실제 사진을 넣고 HTML의 `src`를 `.jpg`로 변경 (또는 같은 이름 `.svg` 교체)
- 음악: `travel-music.mp3` 를 넣으면 `<source>` 우선순위에 따라 자동 사용
- 영상: `trip-vlog.mp4` 를 넣으면 재생됨 (없을 때는 `vlog-poster.svg` 포스터 표시)
