
const { resolve } = require('path');
const dotenv = require('dotenv');

// Load .env
dotenv.config({ path: resolve(__dirname, '../.env') });

const SYSTEM_PROMPT = `
# Role
10년 차 시니어 개발자 면접관. 주니어 지원자의 '기술적 깊이(User vs Engineer)' 검증.
- 검증 흐름: 경험 → 근거/트레이드오프 → 검증/디버깅(동작 원리).
- 목표: 단순 사용 경험을 넘어 원리 이해도와 문제 해결 능력 확인.

# Primary Directives (최우선 준수 사항)
1. 중복 주제 절대 금지 (Highest Priority):
   - [제외된 주제]에 포함된 키워드, 기술, 개념에 대한 질문은 절대 금지.
   - 꼬리 질문이라 하더라도, 이미 논의된 [제외된 주제]로 되돌아가지 말 것.
   - 최근 대화 내역에 있는 질문을 절대로 반복해서 질문하지 말 것.
2. Force Switch (즉시 주제 전환) 필수:
   - 지원자가 **"모름", "경험 없음", "잘 모르겠습니다"** 등의 부정적 답변을 하거나,
   - 답변의 깊이가 얕아 더 이상 질문할 것이 없다고 판단되면,
   - **즉시** 현재 주제를 종료하고 [제외된 주제]에 없는 **완전히 새로운 주제(Scenario A)** 로 전환하라.
   - 절대 아는 척 넘어가거나 설명을 유도하지 말 것.
3. Context Alignment (맥락 일치 및 중복 질문 방지):
   - **Critical**: 지원자가 답변에서 이미 언급한 키워드나 내용을 "사용했나요?" 혹은 "무엇인가요?"라고 다시 묻지 말 것.
   - 이미 언급된 내용은 **'이미 알고 있는 사실(Fact)'**로 간주하고, 그 **Why(이유), How(구체적 구현), Trade-off(대안 비교)**를 묻는 심층 질문으로 즉시 넘어갈 것.
   - 충분히 물어봤다고 판단되면, 즉시 주제를 전환할 것
   - 예시:
     - 답변: "Kakfa를 사용해 비동기 처리를 구현했습니다."
     - 나쁜 질문 (X): "Kafka를 사용하셨나요?", "Kafka가 무엇인가요?"
     - 좋은 질문 (O): "Kafka 외에 RabbitMQ 같은 대안도 있었을 텐데, 왜 Kafka를 선택했나요?"

# Critical Guidelines
1. 단순 정의 금지: "A란 무엇인가?" 금지. 동작 흐름/실행 순서/예외 추론을 물을 것.
2. Deep Dive (심층 검증): 답변이 모호하면 즉시 근거(수치), 대안, 검증(로그/지표) 요구.
3. Tags 관리: 질문의 핵심 키워드(기술/개념) 2~3개 추출. (다음 턴 제외 주제로 사용)
4. 종료 조건: (누적 Unique Tags + 현재 Tags) ≥ 20개면 isLast: true.

# Scenarios
상황에 따라 아래 전략 중 하나를 선택.

## Scenario A. 새 주제 시작 (New Topic Router)
Trigger: 대화 시작, Force Switch 조건 달성, 최근 대화에서 꼬리 질문 3회 이상 진행 시.
Action: [제외된 주제]에 **없는** 새로운 토픽을 선정하여 질문.
- A1. 프로젝트 기반 (Project-Based):
  - 이력서의 특정 프로젝트/기술 지목.
  - 필수 포함: 기술 선택 이유(대안 비교), 설정 근거(트레이드오프), 장애 극복 사례 중 택 1.
- A2. 언어/런타임 기본기 (Language/Runtime):
  - 이력서 내 언어/프레임워크 지목.
  - 방향: 정의가 아닌 동작 원리, 실행 순서, 동시성 이슈 추론.

## Scenario B. 심층 꼬리 질문 (Deep Dive)
Trigger: 답변은 타당하나 깊이/근거가 부족할 때.
- **[제외된 주제]와 겹치지 않는 선에서** 깊이를 더함.
- 방향: 트래픽 부하 가정, 정합성/순서 보장 실패 모드, 엣지케이스, 검증 방법.

## Scenario C. CS/원리 연결 (CS Bridge)
Trigger: 단순 사용 경험('User' level)에 그치거나 자동화된 동작 이해가 의심될 때.
- 기술을 CS 원리(OS, Network, DB)와 연결.

# Self-Check (Internal)
- 생성된 question이 [제외된 주제]를 포함하는가? -> 즉시 폐기하고 다시 생성.
- 지원자가 모른다고 했는가? -> 즉시 다른 주제로 전환했는가 확인.
`;

const API_KEY = process.env.CLOVA_API_KEY || process.env.CLOVA_INTERVIEW_API_KEY;
const API_URL_BASE = 'https://clovastudio.stream.ntruss.com';
const MODEL_NAME = 'HCX-007';

async function verifyTokenUsage() {
    console.log('=== Verifying Token Usage for HCX-007 (V3 API) ===');

    if (!API_KEY) {
        console.error('ERROR: CLOVA_API_KEY is missing');
        process.exit(1);
    }

    // 1. Construct Mock Payload
    // 1. Construct Mock Payload
    // 10k chars using a mix of Korean text and Code to simulate real developer portfolio
    const koreanText = "안녕하세요. 저는 백엔드 개발자로서 대규모 트래픽 처리에 관심이 많습니다. 프로젝트 경험으로는 Spring Boot와 JPA를 활용한 쇼핑몰 개발이 있습니다. ";
    const codeSnippet = `
    @Entity
    public class Product {
        @Id @GeneratedValue
        private Long id;
        private String name;
        private Integer price;
        
        public void updatePrice(Integer newPrice) {
            this.price = newPrice;
        }
    }
    `;
    const mixedBlock = koreanText + codeSnippet; // ~200 chars
    const repeatCount = Math.ceil(10000 / mixedBlock.length);
    const dummyPortfolio = mixedBlock.repeat(repeatCount).substring(0, 10000);

    // Max history (5 turns)
    const historyMessages = [];
    for (let i = 0; i < 5; i++) {
        historyMessages.push({ role: 'assistant', content: '질문입니다. 기술적인 깊이를 검증하기 위해 질문드립니다. '.repeat(2) }); // ~50 chars
        historyMessages.push({ role: 'user', content: '답변입니다. 구체적인 경험을 바탕으로 설명하겠습니다. '.repeat(5) }); // ~100 chars
    } // Totals are smaller here but representative enough


    const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...historyMessages,
        { role: 'user', content: `[포트폴리오]\n${dummyPortfolio}\n\n질문해주세요.` }
    ];

    console.log(`Payload constructed.`);
    console.log(`- System Prompt Length: ${SYSTEM_PROMPT.length}`);
    console.log(`- Portfolio Length: ${dummyPortfolio.length}`);
    console.log(`- History Messages Count: ${historyMessages.length}`);

    // 2. Call Tokenize API (V3)
    // Endpoint: /v3/api-tools/chat-tokenize/{modelName}
    const url = `${API_URL_BASE}/v3/api-tools/chat-tokenize/${MODEL_NAME}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-NCP-CLOVASTUDIO-REQUEST-ID': `req-${Date.now()}` // Recommended header
            },
            body: JSON.stringify({ messages })
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`API Error ${response.status}: ${text}`);
        }

        const data = await response.json();
        console.log('\n=== Token Calculation Result ===');
        console.log('Full Response:', JSON.stringify(data, null, 2));
        console.log('================================');

    } catch (error) {
        console.error('Failed to calculate tokens:', error);
    }
}

verifyTokenUsage();
