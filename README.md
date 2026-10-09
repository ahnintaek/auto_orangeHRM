# OrangeHRM Test Automation Portfolio

Playwright + TypeScript로 구축한 OrangeHRM 웹 애플리케이션 E2E/API 자동화 프로젝트입니다.
Docker로 격리한 자체 호스팅 환경에서, 설치부터 시드 데이터 생성·테스트 실행·리포트 게시까지 사람의 개입 없이 재현되도록 구성했습니다.

- **최신 테스트 리포트**: https://ahnintaek.github.io/auto_orangeHRM/playwright-report/
- **스택**: Playwright, TypeScript, Docker Compose(OrangeHRM + MariaDB), GitHub Actions, GitHub Pages

## 프로젝트 배경

더존비즈온 CRM QA 담당 시절, 요금제/프로모션 기능 검수를 수동으로 반복하며 회귀 테스트 자동화의 필요성을 느꼈습니다.
사내 서비스는 보안상 공개할 수 없어, 구조적으로 유사한 CRUD 패턴을 가진 OrangeHRM을 대상으로 동일한 설계 원칙을 적용했습니다.

## 왜 OrangeHRM이고, 왜 자체 호스팅인가

- Admin(시스템 사용자 관리), PIM(직원 정보 관리)은 CRM의 사용자/고객 관리 화면과 CRUD·검색·권한 노출 패턴이 동일합니다.
- 초기에는 공개 데모(opensource-demo.orangehrmlive.com)를 사용했으나, 다른 사용자에 의해 UI 언어가 예고 없이 변경되는 등 공유 환경의 불안정성을 겪었습니다. 이후 Docker로 격리된 자체 환경으로 전환했습니다.

## 테스트 범위

| 스펙 | 영역 | 검증 내용 |
|---|---|---|
| `admin.spec.ts` | Admin | 시스템 유저 등록 → 목록 반영 확인 → 삭제 |
| `pim.spec.ts` | PIM | 직원 등록 → 개인정보/연락처 저장 → 검색 → 삭제 |
| `jobsetting.spec.ts` | Admin > Job | 직무 설정 관리 |
| `login.spec.ts` | 인증 | 로그인 실패 등 네거티브 케이스 |
| `api.spec.ts` | API | Playwright `APIRequestContext` 기반 API 검증 |
| `buzz.spec.ts` | Buzz | 게시글 작성/좋아요/댓글 CRUD |

- 실행마다 유니크한 데이터(`Date.now()` 기반)를 사용해 재실행 시 충돌을 방지합니다.
- 생성한 데이터는 테스트 말미에서 직접 정리합니다.

## 아키텍처

```
project/
├── fixtures/authedPage.fixture.ts   # 인증된 page를 테스트에 주입
├── models/employee.ts
├── pages/
│   ├── basePage.ts                  # 공통 폼 입력/검증/네비게이션 유틸
│   ├── loginPage.ts
│   ├── adminPage.ts
│   ├── pimPage.ts
│   └── jobSettingsPage.ts
├── setup/auth.setup.ts              # 로그인 후 storageState 저장
├── testData/seedData.ts             # 시드 데이터 상수
├── utils/formHelpers.ts             # 드롭다운/입력그룹 로직 (BasePage와 global-setup이 공유)
└── tests/                           # 6개 스펙
global-setup.ts                      # 설치 마법사 자동 완료 + 시드 데이터 생성
docker-compose.yml
```

설계 결정:

- **Page Object Model**: UI 변경 시 수정 지점을 페이지 클래스 한 곳으로 모아 유지보수 비용을 낮춥니다.
- **라벨 기반 셀렉터(`getInputGroup`)**: 필드 순서 변경에 영향받지 않도록 폼 필드는 라벨로 찾습니다.
- **`BasePage` 공통화**: `fillAndVerify`, `fillFields`, `selectDropdown`, `gotoModule` 등 반복 로직을 한 곳에 둡니다.
- **인증 분리**: `setup` 프로젝트가 한 번 로그인해 `playwright/.auth/admin.json`에 세션을 저장하고, 테스트 프로젝트는 `storageState`로 로그인 상태에서 시작합니다. 테스트마다 로그인 화면을 거치지 않습니다.
- **멱등한 시드**: `global-setup.ts`는 이미 설치/시드된 상태면 해당 단계를 건너뜁니다.

## 실행 방법

```bash
# 1. 환경변수 준비
cp .env.example .env     # ADMIN_ID, ADMIN_PW 등 설정

# 2. OrangeHRM + MariaDB 기동
docker compose up -d

# 3. 의존성 설치 및 실행 (설치 마법사/시드는 globalSetup이 자동 수행)
npm ci
npx playwright install chromium
npx playwright test

# 리포트 확인
npx playwright show-report
```

## CI/CD

- Push / PR / 수동 실행(`workflow_dispatch`)마다 GitHub Actions가 동작합니다. 테스트 실행은 재사용 워크플로로 분리했습니다.
- Docker Compose로 OrangeHRM + MariaDB를 완전히 빈 상태로 기동하고, 컨테이너 응답을 폴링으로 확인한 뒤 `globalSetup`이 설치 마법사를 자동 완료합니다.
- 관리자 계정 정보는 GitHub Secrets로 주입하고, 로컬은 `.env`(gitignore)를 사용합니다.
- CI 설정: `retries: 2`, `workers: 2`, 뷰포트 1920x1080 고정, headless 실행.
- 실패 시 스크린샷/비디오/트레이스(`on-first-retry`)를 아티팩트로 업로드합니다.
- `main` 브랜치에서는 HTML 리포트를 GitHub Pages에 게시합니다(실행마다 덮어쓰기).

## 트러블슈팅

### 1. 공유 데모 환경의 불안정성
- **문제**: 다른 사용자가 공개 데모의 UI 언어를 스페인어로 변경해 텍스트 기반 셀렉터가 전부 실패
- **해결**: Docker Compose 자체 환경으로 전환해 외부 변경 요인 제거

### 2. 비동기 폼 로딩으로 인한 간헐적 입력 실패 (race condition)
- **문제**: Contact Details 입력값이 저장 시점마다 다른 필드에서 랜덤하게 사라짐
- **원인**: 화면 진입 직후 기존 데이터 로딩 API 응답과 Vue의 비동기 DOM 패치가 끝나기 전에 입력해, 패치 타이밍에 걸린 필드 값이 덮어써짐
- **해결**: `waitForResponse`와 로딩 오버레이(`.oxd-form-loader`) hidden 대기를 결합해 폼 준비 시점을 명시적으로 확보. 입력 직후 값 검증에 실패하면 1회 재입력하는 `fillAndVerify`를 BasePage에 두어 안전망으로 사용 (근본 해결은 대기 조건이며, 재입력은 보조 수단)

### 3. 설치 상태를 이미지에 굽는 방식의 한계와 방향 전환
- **시도**: 설치가 끝난 앱 파일을 `docker cp`로 추출해 커스텀 Dockerfile에 포함
- **문제**: 복제 과정에서 권한/설정 정보가 유실되어 HTTP 500 발생, 원인 규명 대비 효율이 낮다고 판단
- **전환**: 설치 마법사 자체를 Playwright `globalSetup`으로 자동화. 기존 셀렉터 설계(라벨 기반, 드롭다운 공통 함수)를 그대로 재사용할 수 있었음

### 4. 진입점별 환경 설정 불일치
- **문제**: `playwright.config.ts`의 `headless` 분기가 독립 스크립트인 `global-setup.ts`에는 적용되지 않아 CI에서 "Missing X server" 오류
- **해결**: `global-setup.ts`에도 동일한 CI 분기 적용
- **교훈**: 환경별 설정을 한 곳에 모으지 않으면 새 진입점마다 같은 실수가 반복됨 → 공통 설정 모듈화를 개선 과제로 등록

### 5. CI에서만 발생한 레이아웃 의존 실패
- **문제**: 로컬에서 통과하던 테스트가 CI에서만 실패. 원인은 headless 기본 뷰포트가 작아 반응형 레이아웃이 달라진 것
- **해결**: CI 뷰포트를 1920x1080으로 고정

### 6. 로그인 직후 API 401
- **문제**: 로그인 직후 API 호출이 간헐적으로 401
- **원인**: 세션이 확립되기 전에 API 요청이 나감
- **해결**: 대시보드 로드 완료를 대기한 뒤 요청

### 7. 누적 데이터로 인한 부분 일치 오탐
- **문제**: Buzz `editComment` 검증이 간헐적으로 실패
- **원인**: `hasText`의 부분 일치가 Docker DB에 누적된 레코드까지 매칭
- **해결**: 앵커를 건 정규식으로 정확 일치시키고, `--trace on`으로 원인을 확인

## 테스트 중 발견한 이슈

- **Buzz 접근성**: 좋아요/댓글 버튼이 아이콘만 있고 접근 가능한 이름(accessible name)이 없음

## 알려진 한계

- 브라우저는 Chromium만 사용하며, 모바일 뷰포트는 검증하지 않습니다.
- 시드 데이터(Job Title/Category)를 UI로 생성합니다. API 기반 시딩으로 바꾸면 더 빠르고 안정적입니다.
- 환경 설정이 `local` 하나뿐이며, `global-setup.ts`의 접속 주소가 `playwright.config.ts`와 분리되어 있습니다.
- 병렬 실행(`fullyParallel`) 시 공유 DB·단일 관리자 세션에 대한 격리 전략이 체계화되어 있지 않습니다.
- 테스트 말미의 정리(cleanup)는 테스트가 중간에 실패하면 실행되지 않을 수 있습니다.
- 린트/타입체크 게이트가 CI에 포함되어 있지 않습니다.

## 향후 개선 방향

- axe-core 기반 접근성 자동 검증 (Buzz에서 발견한 이슈를 회귀 테스트로 고정)
- `TESTING_STRATEGY.md`: 자동화 대상 선정 기준, 위험 기반 우선순위, smoke/regression 분리
- API 레벨 테스트 확대 및 API 기반 사전조건 세팅(하이브리드 시나리오)
- 데이터 기반 테스트: 코드 수정 없이 데이터만 추가해 케이스 확장
- 환경 설정 공통 모듈화(진입점별 중복 제거), 필수 환경변수 검증
- ESLint/Prettier/`tsc --noEmit` CI 게이트
- 정리 로직을 fixture teardown으로 이동해 실패 시에도 실행 보장