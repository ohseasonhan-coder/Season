# Season 앱 코드 분산 구조

이번 통합본은 기존 `src/App.jsx`에 몰려 있던 코드를 다음처럼 분산했습니다.

```text
src/App.jsx                 # 앱 상태, 라우팅, 최상위 화면 조립
src/seasonCore.jsx          # 기본 데이터, 저장소, 계산 유틸, 차트, 탭 컴포넌트, 공통 UI
src/styles/appStyles.js     # 전체 CSS 문자열
src/main.jsx                # React 진입점
```

## 수정 우선순위

- 화면 배치/상단 로그인/모바일 스크롤: `src/App.jsx`
- 계산식/탭 내부 화면/공통 컴포넌트: `src/seasonCore.jsx`
- 디자인/CSS/모바일 반응형: `src/styles/appStyles.js`

## 배포

기존과 동일하게 GitHub에 전체 덮어쓰기 후 Vercel에서 `npm run build`, output `dist`로 배포하면 됩니다.
