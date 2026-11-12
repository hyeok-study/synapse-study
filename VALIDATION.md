# 면접 진행과 상태 수명주기 검증

2026-11-12, macOS ARM64, Node 22.14.0. 원본 기준과 로컬 후속 코드에서 같은 단위 테스트 설정을 사용했습니다. 설치된 의존성을 공유하고 코드·출력 디렉터리를 분리했습니다.

| 항목 | 원본 기준 | 로컬 후속 변경 |
|---|---:|---:|
| 단위 테스트 | 74 통과 | 81 통과 |
| 라인 커버리지 | 48.12% (629/1307) | 50.99% (668/1310) |
| 분기 커버리지 | 42.31% (270/638) | 44.39% (285/642) |

새 회귀 테스트를 원본 구현에 적용하면 종료 신호와 타이머 수명주기 관련 3개가 실패했고, 수정 구현에서는 통과했습니다. 테스트가 추가되어 커버리지 분모도 달라졌습니다. 범위는 backend의 `test/jest-unit.json`이며, 문서 API E2E와 서비스 전체 운영 검증은 이 수치에 포함하지 않습니다.

```sh
python3 scripts/prepare.py
cd checkout
pnpm install --frozen-lockfile
cd packages/backend
pnpm exec jest --config test/jest-unit.json --runInBand --coverage --coverageReporters=json-summary --coverageReporters=text-summary
pnpm exec eslint 'src/**/*.ts' 'test/unit/**/*.ts' --format json
```

ESLint 결과는 93개 파일에서 오류 45개, 경고 1개였습니다. 진단 40개는 포맷 규칙이며 나머지는 타입 안전성 규칙입니다. 자동 수정은 적용하지 않았습니다. 규칙별 개수와 단위 테스트 결과는 [results](results)에 기록했습니다.
