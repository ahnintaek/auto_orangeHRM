# OrangeHRM Test Automation Portfolio

## 프로젝트 배경
더존비즈온 CRM QA 담당 시절, 요금제/프로모션 기능 검수를 수동으로 반복 수행하며 회귀 테스트 자동화의 필요성을 느꼈습니다. 사내 서비스는 보안상 공개할 수 없어, 구조적으로 유사한 CRUD 패턴을 가진 OrangeHRM을 대상으로 동일한 설계 원칙을 적용했습니다.

## 왜 이 대상을 선택했는가, 왜 자체 호스팅했는가
- Admin(시스템 사용자 관리), PIM(직원 정보 관리)은 CRM의 사용자/고객 관리 화면과 CRUD·검색·권한 노출 패턴이 동일함
- 초기엔 공개 데모(opensource-demo.orangehrmlive.com)를 사용했으나, 다른 사용자에 의해 UI 언어가 예고 없이 변경되는 등 공유 환경의 불안정성을 겪은 뒤, Docker로 격리된 자체 환경으로 전환

## 아키텍처
```
project/
├── models/employee.ts
├── pages/
│   ├── basePage.ts
│   ├── loginPage.ts
│   ├── adminPage.ts
│   └── pimPage.ts
├── utils/
│   └── formHelpers.ts       # 드롭다운/입력그룹 셀렉터 로직을 독립 함수로 분리
│                            # (BasePage와 global-setup.ts가 동일 로직 공유)
└── tests/
    ├── admin.spec.ts
    └── pim.spec.ts
global-setup.ts               # 테스트 실행 전 OrangeHRM 설치 마법사를 자동 완료
docker-compose.yml
```
Page Object Model을 택한 이유: UI 변경 시 로케이터 수정 지점을 페이지 클래스 한 곳으로 집중시켜 유지보수 비용을 낮추기 위함. 라벨 텍스트 기반 셀렉터(`getInputGroup`)로 통일하여, 필드 순서가 바뀌어도 테스트가 깨지지 않도록 설계.

## 테스트 전략 (현재 2개 시나리오)
- Admin: 신규 시스템 유저 등록 → 목록 반영 확인 → 삭제
- PIM: 신규 직원 등록 → 개인정보 저장 → 연락처 저장 → 검색 → 삭제
- 실행마다 유니크한 데이터(`Date.now()`, timestamp 조합) 사용으로 재실행 시 충돌 방지, 테스트 종료 후 생성 데이터 자체 정리(cleanup)

## CI/CD
- Push/PR/수동 실행(workflow_dispatch) 시 GitHub Actions에서 Docker Compose로 OrangeHRM+MariaDB를 완전히 빈 상태로 기동
- Playwright의 `globalSetup`(global-setup.ts)이 테스트 실행 전 설치 마법사(DB 연결, 조직 정보, 관리자 계정 생성)를 자동 완료시켜, 사람이 클릭할 필요 없이 매번 동일한 초기 상태를 재현
- 관리자 계정 정보는 GitHub Secrets로 주입, 로컬은 `.env`(gitignore 처리)
- 컨테이너 준비 상태를 폴링으로 확인 후 테스트 시작
- 실패 시 스크린샷/비디오/트레이스 아티팩트 자동 업로드

## 트러블슈팅

### 1. 공유 데모 환경의 불안정성
- 문제: 다른 사용자에 의해 공개 데모 사이트의 UI 언어가 스페인어로 변경되어 텍스트 기반 셀렉터가 전부 실패
- 해결: Docker Compose로 격리된 자체 환경으로 전환하여 재발 원천 차단

### 2. 비동기 폼 로딩으로 인한 간헐적 입력 실패 (race condition)
- 문제: Contact Details 등록 시 입력값이 저장 시점마다 다른 필드에서 랜덤하게 사라지는 현상 발생 (재현이 매번 다른 필드에서 발생)
- 원인 분석: 화면 진입 직후 기존 데이터를 불러오는 API 응답과 Vue의 비동기 DOM 패치가 끝나기 전에 입력을 시도하여, 패치 타이밍에 걸린 필드의 값만 덮어써짐
- 해결: API 응답 대기(`waitForResponse`) + 로딩 오버레이(`.oxd-form-loader`) hidden 대기를 결합해 폼 완전 준비 시점을 명시적으로 확보하고, 입력 직후 값 검증에 실패하면 1회 재입력하는 `fillAndVerify` 유틸을 BasePage에 공통화하여 안전망으로 추가

### 3. 설치 상태를 이미지에 굽는 방식의 한계와 방향 전환
- 시도: CI에서도 설치 마법사 없이 바로 실행되도록, 설치가 끝난 앱 파일을 `docker cp`로 추출해 커스텀 Dockerfile에 포함시키는 방식을 시도
- 문제: 파일 복제 과정에서 권한/설정 정보가 일부 유실되어 HTTP 500 에러 발생, 원인 규명에 시간 대비 효율이 낮다고 판단
- 방향 전환: 파일을 복제하는 대신, Playwright의 `globalSetup` 훅으로 설치 마법사 자체를 자동화하는 방식으로 전환. 테스트 대상 앱의 초기화까지 Playwright로 자동화한다는 관점으로 접근을 바꾸니 기존 셀렉터 설계 원칙(라벨 기반, 드롭다운 공통 함수)을 그대로 재사용할 수 있어 오히려 더 단순하게 해결됨
- 배운 점: 인프라 레벨 문제를 인프라 도구로만 풀려 하지 않고, 이미 익숙한 테스트 자동화 관점으로 재정의하니 해결이 빨라짐

### 4. CI 환경에서 설치 자동화 스크립트의 headless 미설정
- 문제: `playwright.config.ts`에는 `headless: !!process.env.CI`로 환경별 분기를 해뒀으나, `global-setup.ts`는 별도로 `chromium.launch()`를 호출하는 독립 스크립트라 이 설정이 적용되지 않아 CI에서 "Missing X server" 에러로 실패
- 해결: `global-setup.ts`에도 동일한 `!!process.env.CI` 분기를 적용
- 배운 점: 환경별 설정은 한 곳에 모아 관리하지 않으면, 새로운 진입점(entry point)이 생길 때마다 같은 실수가 반복될 수 있음

### 5. CI(headless) 환경에서만 발생한 반응형 레이아웃 이슈
- 문제: 로컬은 브라우저를 최대화(`--start-maximized`)한 상태로 테스트해 항상 통과했으나, CI는 headless 기본 해상도(1280x720)로 실행되어 Admin의 전체 선택 체크박스, PIM의 검색 필터 입력창이 반응형으로 숨겨져 요소를 찾을 수 없는 문제가 발생
- 원인 분석: 화면 크기에 따라 일부 UI 요소가 조건부로 렌더링/숨김 처리되는 반응형 구조였으나, 로컬에서는 항상 큰 화면으로 테스트해 이 분기를 가려서 인지하지 못함
- 해결: CI 환경에서 `viewport: { width: 1920, height: 1080 }`로 데스크톱 레이아웃을 명시적으로 고정하여, headless 여부와 무관하게 로컬과 동일한 레이아웃 조건을 보장
- 배운 점: "로컬에서 통과 = 신뢰 가능"이 아니라, 로컬 실행 조건 자체가 CI와 다르면 로컬 테스트가 오히려 잠재 결함을 가릴 수 있음. 이후로는 주요 변경 후 CI 환경과 유사한 조건(작은 뷰포트, headless)으로도 로컬에서 한 번씩 재현 테스트하는 습관을 추가

## 향후 개선 방향
- 로그인 실패/유효성 검사 등 네거티브 테스트 케이스 추가
- 목록 검색/필터 조합 테스트 추가
- API 레벨 테스트(APIRequestContext) 추가
- 데이터 기반 테스트로 케이스 확장 시 코드 수정 없이 데이터만 추가되도록 개선
- 환경변수 기반 설정(headless 등)을 여러 진입점에서 공유하는 공통 설정 모듈로 통합
