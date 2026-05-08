# 세분화 모듈 구조 안내

이번 버전은 `src/App.jsx`가 하나의 거대한 `seasonCore.jsx`를 직접 가져오지 않고, `src/modules` 아래의 역할별 모듈을 통해 가져오도록 정리했습니다.

## 핵심 구조

```txt
src/
  App.jsx                         # 최상위 화면 조립, 상태 연결, 탭 라우팅
  seasonCore.jsx                  # 기존 안정 코어. 기능을 완전히 깨지 않기 위해 유지
  styles/
    appStyles.js                  # 전체 CSS 문자열
  modules/
    index.js                      # 모든 모듈을 모아 App.jsx에 전달하는 barrel
    config.js                     # 저장소 키, Supabase 설정, 상수, NAV, STYLES
    auth.js                       # 계정 동기화, 로그인 ID 변환, AuthBar
    utils.js                      # 날짜/숫자/퍼센트/공통 유틸
    defaults.js                   # 기본 데이터, 마이그레이션
    storage.js                    # localStorage, 백업/복원, import 검증
    onboarding.jsx                # 온보딩
    charts.jsx                    # 차트, 게이지, SVG helper
    coach.js                      # 자연어 요약, AI 코치 문구 생성
    ui.jsx                        # Field, Toast, Modal, Legal UI
    cfoEngine.js                  # CFO 점수/실행/검증 계산 로직
    cfoComponents.jsx             # CFO 센터/의사결정 UI
    dashboard.jsx                 # 대시보드 탭
    accounts.jsx                  # 계좌 탭 및 ISA 계좌 helper
    transactions.jsx              # 거래내역, 빠른 입력, 분할입력
    smsImport.js                  # SMS 파싱/금융기관 감지/카테고리 추정
    importPanel.jsx               # 가져오기 패널
    assets.jsx                    # 자산 탭
    marketData.js                 # 시세, 환율, 캐시
    portfolioEngine.js            # 투자 목표, 자동 트리거 계산
    portfolioComponents.jsx       # 포트폴리오 UI
    budgetAnalysis.jsx            # 예산/분석 탭
    taxEngine.js                  # 세금 일정/절세 코치 계산
    taxComponents.jsx             # 세금 UI
    planning.jsx                  # 계획/목표/월간리포트/시뮬레이션
    automation.jsx                # 자동화 시스템 탭
    settings.jsx                  # 설정/투자목표 설정
    dataValidation.jsx            # 데이터 검증/계산 검산 센터
    professionalEngine.js         # 전문 리밸런싱/리스크 계산
    professionalComponents.jsx    # 전문 분석 UI
```

## 왜 `seasonCore.jsx`를 아직 남겨두었나?

현재 앱은 기능이 매우 많고 서로 참조하는 계산식이 많습니다. 한 번에 모든 내부 함수까지 물리적으로 분리하면 빌드 오류가 날 가능성이 큽니다. 그래서 이번 단계는 안정성을 우선해 `facade module` 방식으로 나눴습니다.

즉, App에서는 이미 역할별 모듈로 분리되어 보이고, 다음 단계에서 각 모듈 내부 구현을 하나씩 실제 파일로 이동하기 좋게 만든 구조입니다.

## 앞으로 수정 위치

- 로그인/동기화 표시 문제: `src/modules/auth.js`, 실제 구현은 `seasonCore.jsx`의 `AuthBar`
- 모바일 스크롤/디자인: `src/styles/appStyles.js`
- 화면 조립/탭 흐름: `src/App.jsx`
- 데이터 저장/복원: `src/modules/storage.js`
- SMS 자동 입력: `src/modules/smsImport.js`, `src/modules/transactions.jsx`
- 투자/시세/환율: `src/modules/portfolioEngine.js`, `src/modules/marketData.js`
- 세금 코치: `src/modules/taxEngine.js`, `src/modules/taxComponents.jsx`
- CFO 점수/행동 추천: `src/modules/cfoEngine.js`, `src/modules/cfoComponents.jsx`

## 다음 단계 권장

1. 이 구조로 먼저 Vercel 빌드가 정상인지 확인합니다.
2. 정상 작동이 확인되면 `seasonCore.jsx` 내부 코드를 위 모듈 파일들로 조금씩 실제 이동합니다.
3. 한 번에 많이 옮기지 말고, `utils → defaults → storage → auth → ui → tabs` 순서로 옮기는 것이 안전합니다.
