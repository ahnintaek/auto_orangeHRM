# OrangeHRM Test Automation Portfolio

Playwright + TypeScript로 구축한 OrangeHRM E2E/API 자동화 프로젝트입니다.
Docker로 격리한 자체 호스팅 환경에서 설치, 시드 데이터 생성, 테스트 실행, 리포트 게시까지 사람의 개입 없이 재현되도록 구성했습니다.

- **최신 테스트 리포트**: <https://ahnintaek.github.io/auto_orangeHRM/playwright-report/>
- **스택**: Playwright, TypeScript, Docker Compose(OrangeHRM + MariaDB), GitHub Actions, GitHub Pages

## 배경과 환경 선택

더존비즈온 CRM QA 담당 시절 요금제/프로모션 기능 검수를 수동으로 반복하며 회귀 테스트 자동화의 필요성을 느꼈습니다. 사내 서비스는 공개할 수 없어, 사용자/고객 관리 화면과 CRUD·검색·권한 노출 패턴이 같은 OrangeHRM(Admin, PIM 등)에 동일한 설계 원칙을 적용했습니다.

- **자체 호스팅**: 공개 데모는 다른 사용자가 UI 언어를 바꾸는 등 환경이 예고 없이 변해 셀렉터가 전부 깨졌습니다. 이후 Docker로 격리했습니다.
- **설치 자동화**: 설치가 끝난 상태를 이미지에 굽는 방식은 권한/설정 유실로 HTTP 500이 나서 포기하고, 설치 마법사 자체를 Playwright `globalSetup`으로 자동화했습니다.

## 테스트 범위

| 스펙 | 영역 | 검증 내용 |
|---|---|---|
| `admin.spec.ts` | Admin | 시스템 유저 등록 후 목록에서 확인 |
| `pim.spec.ts` | PIM | 직원 등록(로그인 계정 포함) → 개인·연락처·직무 정보 저장 → 검색 → 삭제 |
| `jobsetting.spec.ts` | Admin > Job | Job Title 등록·수정 후 값 재확인, Job Category 등록, 중복(Already exists)/빈 값(Required) 오류 |
| `login.spec.ts` | 인증 | 데이터 기반 실패 케이스 5종 + 로그인/로그아웃 |
| `api.spec.ts` | API | Job Titles: 응답 구조, 인증 없는 호출 401, 생성 → 조회 → 수정 → 삭제, 빈 이름/중복 거절(422) |
| `buzz.spec.ts` | Buzz | 게시글·댓글 등록, 좋아요(수 검증), 수정(Esc 취소 포함), 삭제 |

## 구조

```
project/
├── tests/        # 6개 스펙 (시나리오만 기술)
├── pages/        # Page Object (화면 조작과 검증 도우미)
├── api/          # API 헬퍼 (사전조건 생성, 정리, 시딩용)
├── fixtures/     # 로그인된 page, 실패해도 실행되는 정리 등록기(cleanup, apiCleanup)
├── setup/        # 로그인 후 세션(storageState) 저장
├── testData/     # 시드 데이터 상수
└── utils/        # env(설정 단일 창구), unique, 공통 폼 헬퍼
global-setup.ts   # 설치 마법사 자동 완료 + 시드 보충
docker-compose.yml
```

## 설계 원칙

1. **테스트 계층 분리**: UI 테스트는 사용자가 보는 결과(목록의 행, 입력값, 알림, 오류 문구)로 검증하고, 서버 규칙(상태 코드, 응답 구조, 인증)은 `api.spec.ts`가 별도로 검증합니다. 사전조건 생성, 정리, 시딩에는 API를 써서 빠르고 안정적으로 만듭니다.
2. **스펙 구성 기준**: 서로 독립적인 케이스(로그인 실패)는 데이터 기반으로 분리하고, 하나의 생명주기(유저 등록 → 확인, 게시글 작성 → 삭제)는 한 시나리오로 두고 `test.step`으로 단계를 나눕니다. 리포트에서 실패한 단계가 바로 보입니다.
3. **데이터 격리와 정리**: 실행마다 고유한 데이터를 쓰고, 정리 대상은 만들기 전에 등록하며, 이름이 정확히 일치하는 항목만 지웁니다. 정리는 테스트 본문 밖(fixture teardown, `afterEach`)에서 실행되어 실패해도 수행되고, 이미 없으면 아무것도 하지 않습니다(멱등).
4. **안정적인 대기와 로케이터**: 고정 대기 대신 상태 기반 대기를 쓰고, 텍스트는 정확 일치로 찾습니다(`hasText` 부분 일치는 누적 데이터와 겹침). 클릭이 상태 전환으로 이어지지 않을 수 있는 구간은 결과 상태를 확인하며 재시도(`toPass`)하되, 누를 때마다 뒤집히는 토글에는 쓰지 않습니다.
5. **재현 가능한 환경**: `.env`/CI 설정은 `utils/env.ts` 한 곳에서만 읽고 필수값이 비면 즉시 실패합니다. Docker 이미지는 digest로 고정하고 DB healthcheck를 둡니다. `globalSetup`은 설치(필요할 때만)와 시드 보충(매 실행, 없으면 API로 생성)을 분리해, 설치 후 시딩이 실패한 환경도 다음 실행에서 복구됩니다.
6. **인증 분리**: `setup` 프로젝트가 한 번 로그인해 세션을 저장하고 테스트는 로그인 상태로 시작합니다. 로그인 자체는 `login.spec.ts`가 검증합니다.
7. **코드 품질 점검**: `tsc --noEmit`(타입), ESLint(`await` 누락 같은 논리 실수와 Playwright 규칙), Prettier(서식)를 사용합니다.

## 실행 방법

```bash
cp .env.example .env                 # ADMIN_ID, ADMIN_PW, ADMIN_EMAIL 설정 (BASE_URL은 선택)
docker compose up -d                 # OrangeHRM + MariaDB 기동
npm ci && npx playwright install chromium
npx playwright test                  # 설치 마법사와 시드는 globalSetup이 자동 수행
npx playwright show-report           # 리포트 확인

npm run typecheck && npm run lint    # 코드 점검
docker compose down -v               # 로컬 환경 초기화 (DB 볼륨까지 삭제)
```

DB 계정 값은 로컬 테스트 전용입니다. Docker 이미지를 올릴 때는 새 이미지를 받아 digest를 확인하고, 전체 테스트 통과를 확인한 뒤 `docker-compose.yml`의 digest를 교체합니다.

## CI/CD

- Push, PR, 수동 실행마다 GitHub Actions가 동작합니다. `laptop` 브랜치에서도 같은 테스트가 실행되며(리포트 게시는 `main`만), 로직은 재사용 워크플로 `run-tests.yml` 한 곳에서 관리합니다.
- 빈 DB로 OrangeHRM과 MariaDB를 기동하고 `globalSetup`이 설치와 시딩을 수행합니다. 계정 정보는 GitHub Secrets로 주입합니다. `retries: 2`, `workers: 2`, headless이며 뷰포트를 1920x1080으로 고정해 레이아웃 의존 실패를 막습니다.
- 아티팩트는 용도별로 분리합니다. **공개 HTML 리포트만 GitHub Pages에 게시**하고, trace/비디오(`test-results`)는 Actions 아티팩트로만 보관합니다. 실패 리포트도 게시하되 취소된 실행은 제외하며, 기본 권한은 읽기 전용이고 배포 잡만 쓰기 권한을 갖습니다.

## 트러블슈팅 (핵심 4건)

### 1. 비동기 폼 로딩으로 인한 간헐적 입력 실패
- **문제**: Contact Details 입력값이 저장할 때마다 다른 필드에서 무작위로 사라짐
- **원인**: 화면 진입 직후 기존 데이터 로딩 응답과 Vue의 비동기 DOM 패치가 끝나기 전에 입력해, 패치 타이밍에 걸린 값이 덮어써짐
- **해결**: `waitForResponse`와 로딩 오버레이 hidden 대기를 결합해 폼 준비 시점을 명시. 입력 직후 값을 검증하고 실패하면 1회 재입력하는 `fillAndVerify`는 보조 안전망(근본 해결은 대기 조건)

### 2. 댓글 편집 모드 전환의 간헐적 실패 (18/20 → 30/30)
- **문제**: Buzz 시나리오를 20회 반복하자 2회 실패. Edit 클릭 후 편집 입력창이 나타나지 않음
- **분석**: 편집 모드가 되면 댓글 본문과 Edit 링크가 DOM에서 사라지고 입력 form만 남아, "텍스트로 찾은 댓글"을 기준으로 한 로케이터와 검증이 편집 중에는 대상을 잃음
- **해결**: 편집 중인 댓글을 텍스트가 아닌 "입력 form을 가진 댓글"이라는 상태로 찾고, 편집창이 열릴 때까지 클릭을 재시도(`toPass`). 이미 열려 있으면 클릭하지 않아 반복해도 안전
- **교훈**: 느려 보이는 고정 대기를 한 번에 제거했다가 다른 로직(정리)이 깨진 적이 있어, 변경은 하나씩 적용하고 반복 실행으로 검증

### 3. 통과하지만 아무것도 검증하지 못한 테스트
- **문제**: PIM 테스트가 통과하는데 직원과 로그인 계정이 실행마다 1개씩 쌓임
- **원인**: 삭제 확인이 "텍스트가 보이지 않음"뿐이라 삭제 요청이 끝나기 전 일시적으로 안 보여도 통과. 삭제 뒤 정리 플래그를 꺼서 `afterEach` 정리도 건너뜀. 같은 유형으로 편집 모드의 `toBeHidden` 검증도 대상이 없어 항상 통과했음
- **해결**: 삭제 성공 알림(토스트)을 먼저 확인한 뒤 해당 행이 0개인지 확인
- **교훈**: "안 보임"은 어떤 이유로든 통과하므로 성공을 증명하는 신호를 먼저 확인하고, 검증이 실패할 수 있는지도 점검

### 4. API 테스트에서 추정을 증거로 교체
- **문제**: 비인증 호출 테스트가 401이 아니라 200과 전체 목록을 받음 / 직무 수정 API가 422로 실패
- **원인**: `request.newContext()`가 설정의 로그인 세션(`storageState`)을 기본값으로 물려받아 "새 컨텍스트"도 로그인 상태였고, 수정 본문의 필드(`currentAttachment`)는 다른 버전의 관례를 근거로 한 추정이었음
- **해결**: 빈 `storageState`를 명시해 401을 확인. 화면에서 저장할 때 나가는 요청을 DevTools로 캡처해 본문을 실제 Payload와 일치시키고, 실패 시 상태 코드와 응답 본문을 에러에 담아 원인을 바로 파악
- **교훈**: API 요청은 추정하지 않고 실제 화면이 보내는 요청을 기준으로 작성

## 개선 계획

| 현재 한계 | 개선 계획 |
|---|---|
| 권한/접근 제어 테스트가 없음 | 일반 직원(ESS) 계정으로 메뉴 노출과 직접 접근 제한을 검증 (계정은 `globalSetup`에서 시드) |
| 접근성 이슈: Buzz 아이콘 버튼에 접근 가능한 이름이 없고, 댓글 Like/Edit/Delete가 `<p>`, 편집 입력창에 라벨 없음 | axe-core로 자동 검증하고 발견한 이슈를 회귀 테스트로 고정 |
| 모듈 이동 시 공통 폼 로더 대기가 로더 없는 화면에서 최대 3초 소비 | 모듈별 상태/응답 기반 대기로 교체하고 실행 시간 전후를 측정 |
| `globalSetup`의 설치 단계에 순서 기반 셀렉터와 `networkidle`이 남음 | 라벨 기반 셀렉터와 화면 상태 대기로 교체 |
| API 테스트가 Job Titles/Categories에 한정 | Admin Users 등으로 확대 |
| 로그인 검증이 기본 케이스 위주 | 보호 페이지 직접 접근, 로그아웃 후 뒤로가기, 오류 개수 검증 추가 |
| Chromium만 사용, 모바일 뷰포트 미검증 | Firefox/WebKit과 모바일 뷰포트 프로젝트 추가 |
| 병렬 실행 시 공유 DB와 단일 관리자 세션의 격리 전략이 체계화되지 않음 (고유 데이터와 이름 지정 정리로 회피 중) | 데이터 소유 규칙을 문서화하고 병렬 반복 실행으로 검증 |
| 이름 지정 정리가 목록을 최대 100건까지만 조회 | 서버 검색 조건으로 조회 (로컬은 `down -v`로 초기화) |
| 테스트 전략 문서 없음 | `TESTING_STRATEGY.md`에 자동화 대상 선정 기준, 위험 기반 우선순위, smoke/regression 분리 정리 |