# OrangeHRM Test Automation Portfolio

Playwright + TypeScript로 구축한 OrangeHRM 웹 애플리케이션 E2E 자동화 프로젝트입니다.
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
| `admin.spec.ts` | Admin | 시스템 유저 등록 → 목록 반영 확인 (정리는 cleanup fixture가 수행) |
| `pim.spec.ts` | PIM | 직원 등록 → 개인정보/연락처 저장 → 검색 → 삭제 |
| `jobsetting.spec.ts` | Admin > Job | 직무 설정 관리 |
| `login.spec.ts` | 인증 | 데이터 기반 실패 케이스 5종(빈 값 3종, 잘못된 비밀번호, 존재하지 않는 아이디) + 로그인/로그아웃 |
| `api.spec.ts` | API | 브라우저 세션으로 Job Titles 목록 API를 호출해 시드 데이터 포함 여부 검증 |
| `buzz.spec.ts` | Buzz | 게시글 등록 → 좋아요(수 검증) → 댓글 등록(수 검증) → 댓글 좋아요(수 검증) → 수정 중 Esc 취소 → 댓글 수정 → 댓글 삭제 → 게시글 삭제 |

- 실행마다 유니크한 데이터를 사용해 재실행 시 충돌을 방지합니다.
- 생성한 데이터는 실패하더라도 정리되도록 테스트 본문 밖(fixture teardown, `afterEach`)에서 삭제합니다.

## 아키텍처

```
project/
├── fixtures/authedPage.fixture.ts   # 인증된 page 주입 + 실패해도 실행되는 cleanup 등록기
├── models/employee.ts
├── pages/
│   ├── basePage.ts                  # 공통 폼 입력/검증/네비게이션 유틸
│   ├── loginPage.ts
│   ├── adminPage.ts
│   ├── pimPage.ts
│   ├── jobSettingsPage.ts
│   └── buzzPage.ts
├── setup/auth.setup.ts              # 로그인 후 storageState 저장
├── testData/seedData.ts             # 시드 데이터 상수
├── utils/
│   ├── env.ts                       # 환경변수 로드 + 필수값 검증 (설정의 단일 창구)
│   ├── paths.ts                     # 공용 경로 상수 (인증 상태 파일 등)
│   ├── unique.ts                    # 실행마다 겹치지 않는 테스트 데이터 식별자
│   └── formHelpers.ts               # 드롭다운/입력그룹 로직 (BasePage와 global-setup이 공유)
└── tests/                           # 6개 스펙
global-setup.ts                      # 설치 마법사 자동 완료 + 시드 데이터 생성
docker-compose.yml
```

### 설계 결정

- **Page Object Model**: UI 변경 시 수정 지점을 페이지 클래스 한 곳으로 모읍니다. 로케이터(어디를 가리킬지)와 동작(무엇을 할지)을 한 클래스 안에서 구분해 둡니다.
- **인증 분리**: `setup` 프로젝트가 한 번 로그인해 `playwright/.auth/admin.json`에 세션을 저장하고, 테스트 프로젝트는 `storageState`로 로그인 상태에서 시작합니다. 로그인 자체는 `login.spec.ts`에서 별도로 검증합니다.
- **환경 설정 일원화**: `.env`/CI 환경변수를 `utils/env.ts` 한 곳에서만 읽습니다. 다른 파일은 `process.env`를 직접 쓰지 않고, 필수 값이 비어 있으면 실행 시작 시점에 어떤 변수가 빠졌는지 알려주며 멈춥니다.
- **스펙 구성 기준**: 서로 독립적인 케이스(로그인 실패 5종)는 데이터 기반으로 분리하고, 하나의 생명주기(유저 등록→확인, 게시글 작성→삭제)는 한 시나리오로 두고 `test.step`으로 단계를 나눕니다. 리포트에서 어느 단계에서 실패했는지 바로 보입니다.
- **테스트 데이터와 정리**
  - Admin: 생성한 유저를 이름으로 지정해 삭제합니다. 목록의 "첫 번째 행"을 지우던 방식은 다른 데이터를 지울 수 있어 폐기했습니다. 정리는 fixture teardown에서 실행되어 테스트가 실패해도 수행됩니다.
  - Buzz: `afterEach`에서 정리합니다. 본문에서 이미 지운 경우는 건너뛰고, 정리 전에는 게시글이 화면에 나타나길 기다립니다(`count()`는 기다려주지 않으므로 피드가 그려지기 전에 호출하면 0으로 오판).
- **대기 전략**: 고정 대기 대신 상태/응답 기반 대기를 사용합니다. 폼 로더가 사라지길 기다리고, 등록 API는 요청 응답(`waitForResponse`)을 기다리며, 클릭이 상태 전환으로 이어지지 않을 수 있는 구간은 상태를 확인하며 재시도(`toPass`)합니다.
- **텍스트는 정확 일치로 찾음**: `hasText` 문자열은 부분 일치라 누적 데이터와 겹칠 수 있어, 앞뒤를 고정한 정규식으로 전체 일치를 사용합니다.
- **멱등한 시드**: `global-setup.ts`는 이미 설치/시드된 상태면 해당 단계를 건너뜁니다.

## 실행 방법

```bash
# 1. 환경변수 준비
cp .env.example .env     # ADMIN_ID, ADMIN_PW, ADMIN_EMAIL 설정 (BASE_URL은 선택)

# 2. OrangeHRM + MariaDB 기동
docker compose up -d

# 3. 의존성 설치 및 실행 (설치 마법사/시드는 globalSetup이 자동 수행)
npm ci
npx playwright install chromium
npx playwright test

# 리포트 확인
npx playwright show-report

# 안정성 확인: 같은 스펙을 반복 실행
npx playwright test buzz.spec.ts --repeat-each=30 --workers=1

# 로컬 환경 초기화 (DB 볼륨까지 삭제해 누적 데이터 제거)
docker compose down -v
```

로컬 DB는 이름 있는 볼륨에 유지되므로, 데이터를 깨끗하게 되돌리려면 `docker compose down -v`로 정리합니다. 이 환경의 DB 계정 값은 로컬 테스트 전용입니다.

## CI/CD

- Push / PR / 수동 실행(`workflow_dispatch`)마다 GitHub Actions가 동작합니다. `laptop` 브랜치 push에도 같은 테스트가 실행되며(리포트 게시는 `main`에서만), 테스트 로직은 재사용 워크플로 `run-tests.yml` 한 곳에서 관리합니다.
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
- **교훈과 후속 조치**: 환경별 설정을 한 곳에 모으지 않으면 새 진입점마다 같은 실수가 반복됨 → `utils/env.ts`로 접속 주소, CI 여부, 계정 정보를 일원화하고 필수값 누락 시 즉시 실패하도록 개선

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
- **해결**: 앵커를 건 정규식으로 정확 일치. 이후 Buzz 전체를 재작성하며 게시글/댓글 모두 전체 일치 방식으로 통일

### 8. 댓글 편집 모드 전환의 간헐적 누락 (18/20 → 30/30)
- **문제**: Buzz 시나리오를 20회 반복 실행하자 2회 실패. Edit 클릭 후 편집 입력창이 나타나지 않음
- **분석**: 편집 모드가 되면 댓글 본문과 Edit 링크가 DOM에서 사라지고 입력 form만 남음. 따라서 "텍스트로 찾은 댓글"을 기준으로 한 로케이터와 검증(`toBeHidden`)은 편집 중에 대상이 사라져 의미가 없었음
- **해결**: 편집 중인 댓글은 텍스트가 아니라 "입력 form을 가진 댓글"이라는 상태로 찾고, 편집창이 열릴 때까지 클릭을 재시도하는 `toPass` 패턴 적용. 이미 열려 있으면 클릭하지 않으므로 반복해도 안전하며, 누를 때마다 상태가 뒤집히는 좋아요에는 같은 방식을 쓰지 않음
- **결과**: 30회 반복 실행 모두 통과

### 9. 고정 대기가 가려주던 타이밍 문제
- **문제**: 공통 폼 로더 대기가 Buzz에서는 불필요하게 3초를 허비하는 것으로 보여 Buzz 전용 대기로 교체했더니, 게시글 정리가 동작하지 않고 등록 이후 단계가 진행되지 않음
- **원인(판단)**: 느려 보이던 그 대기가 피드가 그려질 시간을 우연히 벌어주고 있었고, `count()`는 기다려주지 않아 피드가 그려지기 전에 호출하면 0으로 오판해 정리를 건너뜀
- **해결**: 변경을 원복하고, 정리 로직이 게시글이 나타나길 기다린 뒤 판단하도록 수정
- **교훈**: 느려 보이는 대기가 다른 로직을 받쳐주고 있을 수 있음. 한 번에 여러 가지를 바꾸면 원인 분리가 어려워지므로 변경은 하나씩 적용하고 반복 실행으로 검증

### 10. 로더 대기를 API 응답 대기로 교체
- **문제**: 게시글 등록 후 로더가 나타났다 사라지길 기다리는 방식은 로더가 나타나지 않으면 3초를 허비하고, 서버 처리 결과도 직접 확인하지 못함
- **해결**: 등록 요청(`POST /api/v2/buzz/posts`)의 응답을 클릭과 함께 대기하고 상태 코드를 검증. 실패 시 "화면에서 게시글을 못 찾음"이 아니라 API 실패 코드가 바로 보임
- **결과**: 31개 테스트 실행 시간 5.5분 → 5.2분 (전체 통과 유지)

## 테스트 중 발견한 이슈

- **Buzz 접근성**: 좋아요/댓글 버튼이 아이콘만 있고 접근 가능한 이름(accessible name)이 없음. 댓글의 Like/Edit/Delete는 `<p>` 요소로 구현되어 버튼 역할이 없고, 댓글 편집 입력창에는 라벨이나 placeholder가 없음

## 알려진 한계

- 브라우저는 Chromium만 사용하며, 모바일 뷰포트는 검증하지 않습니다.
- API 테스트는 브라우저 세션을 이용한 단일 조회 1건이며, 생성 → 조회 → 삭제 CRUD는 아직 없습니다.
- 시드 데이터(Job Title/Category)를 UI로 생성합니다. API 기반 시딩이 더 빠르고 안정적입니다.
- 모듈 이동 시 공통 폼 로더 대기가 로더가 없는 화면에서는 최대 3초를 소비합니다. 모듈별로 응답/상태 기반 대기로 교체할 예정입니다.
- `global-setup.ts`에는 인덱스 기반 로케이터와 고정 대기 루프가 남아 있습니다.
- Docker 이미지가 `latest` 태그라 업스트림 변경에 영향을 받을 수 있습니다.
- 병렬 실행(`fullyParallel`) 시 공유 DB·단일 관리자 세션에 대한 격리 전략이 체계화되어 있지 않습니다. 현재는 유니크 데이터와 이름 지정 정리로 충돌을 피합니다.
- 린트/타입체크 게이트가 CI에 포함되어 있지 않습니다.

## 향후 개선 방향

- `tsconfig` 정비와 `tsc --noEmit`, ESLint/Prettier CI 게이트
- API 테스트 확장: `APIRequestContext` 기반 생성 → 조회 → 삭제 CRUD, 스키마 검증, 인증 없는 요청(401) 케이스. 사전조건 생성/정리를 API로 전환
- axe-core 기반 접근성 자동 검증 (Buzz에서 발견한 이슈를 회귀 테스트로 고정)
- `TESTING_STRATEGY.md`: 자동화 대상 선정 기준, 위험 기반 우선순위, smoke/regression 분리
- 모듈 공통 대기 개선과 `global-setup.ts` 정리(셀렉터, 고정 대기)
- 로그인 스펙 보강: 보호 페이지 직접 접근, 로그아웃 후 뒤로가기