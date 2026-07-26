# OrangeHRM Test Automation Portfolio

## 프로젝트 배경
더존비즈온 CRM QA 담당 시절, 요금제/프로모션 기능 검수를 수동으로
반복 수행하며 회귀 테스트 자동화의 필요성을 느꼈습니다.
사내 서비스는 보안상 공개할 수 없어, 구조적으로 유사한 CRUD 패턴을
가진 OrangeHRM을 대상으로 동일한 설계 원칙을 적용했습니다.

## 왜 이 대상을 선택했는가, 왜 자체 호스팅했는가
- Admin(시스템 사용자 관리), PIM(직원 정보 관리)은 CRM의 사용자/고객
  관리 화면과 CRUD·검색·권한 노출 패턴이 동일함
- 초기엔 공개 데모(opensource-demo.orangehrmlive.com)를 사용했으나,
  다른 사용자에 의해 UI 언어가 예고 없이 변경되는 등 공유 환경의
  불안정성을 겪은 뒤, Docker로 격리된 자체 환경으로 전환

## 아키텍처

project/
├── models/employee.ts
├── pages/
│ ├── basePage.ts
│ ├── loginPage.ts
│ ├── adminPage.ts
│ └── pimPage.ts
└── tests/
├── admin.spec.ts
└── pim.spec.ts

Page Object Model을 택한 이유: UI 변경 시 로케이터 수정 지점을
페이지 클래스 한 곳으로 집중시켜 유지보수 비용을 낮추기 위함.
라벨 텍스트 기반 셀렉터(`getInputGroup`)로 통일하여, 필드 순서가
바뀌어도 테스트가 깨지지 않도록 설계.

## 테스트 전략 (현재 2개 시나리오)
- Admin: 신규 시스템 유저 등록 → 목록 반영 확인 → 삭제
- PIM: 신규 직원 등록 → 개인정보 저장 → 연락처 저장 → 검색 → 삭제
- 실행마다 유니크한 데이터(`Date.now()`, timestamp 조합) 사용으로
  재실행 시 충돌 방지, 테스트 종료 후 생성 데이터 자체 정리(cleanup)

## CI/CD
- Push/PR 시 GitHub Actions에서 Docker Compose로 OrangeHRM+MariaDB를
  기동한 뒤 테스트 실행 (로컬과 동일한 docker-compose.yml 재사용)
- 컨테이너 준비 상태를 폴링으로 확인 후 테스트 시작 (헬스체크 없이
  바로 실행하면 초기화 미완료 상태에서 실패하는 문제 방지)
- 실패 시 스크린샷/비디오/트레이스 아티팩트 자동 업로드

## 트러블슈팅

### 1. 공유 데모 환경의 불안정성
- 문제: 다른 사용자에 의해 공개 데모 사이트의 UI 언어가 스페인어로
  변경되어 텍스트 기반 셀렉터가 전부 실패
- 해결: Docker Compose로 격리된 자체 환경으로 전환하여 재발 원천 차단

### 2. 비동기 폼 로딩으로 인한 간헐적 입력 실패 (race condition)
- 문제: Contact Details 등록 시 입력값이 저장 시점마다 다른 필드에서
  랜덤하게 사라지는 현상 발생 (재현이 매번 다른 필드에서 발생)
- 원인 분석: 화면 진입 직후 기존 데이터를 불러오는 API 응답과 Vue의
  비동기 DOM 패치가 끝나기 전에 입력을 시도하여, 패치 타이밍에 걸린
  필드의 값만 덮어써짐
- 해결: API 응답 대기(`waitForResponse`) + 로딩 오버레이(`.oxd-form-loader`)
  hidden 대기를 결합해 폼 완전 준비 시점을 명시적으로 확보하고,
  입력 직후 값 검증에 실패하면 1회 재입력하는 `fillAndVerify` 유틸을
  BasePage에 공통화하여 안전망으로 추가

## 향후 개선 방향
- 로그인 실패/유효성 검사 등 네거티브 테스트 케이스 추가
- 목록 검색/필터 조합 테스트 추가
- API 레벨 테스트(APIRequestContext) 추가
- 데이터 기반 테스트로 케이스 확장 시 코드 수정 없이 데이터만 추가되도록 개선