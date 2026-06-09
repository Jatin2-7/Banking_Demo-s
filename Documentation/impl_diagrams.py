"""Implementation-plan diagrams — HLD, integration, AG-UI, roadmap."""
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Rectangle
import matplotlib.patches as mpatches

BG = '#F8FAFC'
LANE_HDR = '#0F172A'
TEXT = '#0F172A'
SUB = '#64748B'
ARROW = '#334155'

LANES = {
    'bank': ('#E0F2FE', '#0369A1', 'BANK CHANNELS'),
    'sdk': ('#EEF2FF', '#4338CA', 'VOICE RM SDK / EMBED'),
    'api': ('#F0FDF4', '#15803D', 'SILVER SUITS API LAYER'),
    'ai': ('#F3E8FF', '#7C3AED', 'AI + ORCHESTRATION'),
    'data': ('#FFEDD5', '#C2410C', 'BANK DATA & POLICY'),
}


def lane(ax, y, h, W, key):
    fc, ec, label = LANES[key]
    ax.add_patch(Rectangle((0, y), W, h, fc=fc, ec='none', zorder=0))
    ax.add_patch(Rectangle((0, y), 0.55, h, fc=LANE_HDR, ec='none', zorder=1))
    ax.text(0.28, y + h / 2, label, ha='center', va='center',
            fontsize=6.2, fontweight='bold', color='white', rotation=90, zorder=2)


def comp(ax, x, y, w, h, title, sub=None, ec='#4338CA', fc='white', ts=8.5, ss=7):
    p = FancyBboxPatch((x, y), w, h, boxstyle='round,pad=0,rounding_size=0.12',
                        fc=fc, ec=ec, lw=1.8, zorder=3)
    ax.add_patch(p)
    cx = x + w / 2
    if sub:
        ax.text(cx, y + h * 0.65, title, ha='center', va='center',
                fontsize=ts, fontweight='bold', color=TEXT, zorder=4)
        ax.text(cx, y + h * 0.30, sub, ha='center', va='center',
                fontsize=ss, color=SUB, zorder=4)
    else:
        ax.text(cx, y + h / 2, title, ha='center', va='center',
                fontsize=ts, fontweight='bold', color=TEXT, zorder=4)


def arr(ax, x1, y1, x2, y2, label=None, color=ARROW, rad=0, dashed=False):
    ls = (0, (4, 3)) if dashed else '-'
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle='->', color=color, lw=1.6,
                                linestyle=ls,
                                connectionstyle=f'arc3,rad={rad}',
                                shrinkA=5, shrinkB=5), zorder=5)
    if label:
        mx, my = (x1 + x2) / 2, (y1 + y2) / 2
        ax.text(mx, my - 0.12, label, ha='center', va='top',
                fontsize=6.5, color=SUB, zorder=6,
                bbox=dict(fc=BG, ec='none', pad=1, alpha=0.95))


def fig_title(ax, W, title, subtitle, y=0.12):
    ax.text(W / 2, y, title, ha='center', fontsize=14, fontweight='bold', color=TEXT)
    ax.text(W / 2, y + 0.42, subtitle, ha='center', fontsize=9, color=SUB)


def impl_fig_hld_deployment():
    """Figure 1 — Production HLD deployment topology."""
    W, H = 18, 11.5
    fig, ax = plt.subplots(figsize=(W, H), dpi=150)
    ax.set_facecolor(BG); fig.patch.set_facecolor(BG)
    ax.set_xlim(0, W); ax.set_ylim(0, H); ax.invert_yaxis(); ax.axis('off')
    fig_title(ax, W, 'Figure 1 — High-Level Deployment Architecture (Production Target)',
              'In-app only · Bank VPC + Silver Suits Azure · No telephony')

    for y, h, key in [(0.9, 1.35, 'bank'), (2.35, 1.55, 'sdk'), (4.0, 1.75, 'api'),
                      (5.85, 1.55, 'ai'), (7.5, 1.35, 'data')]:
        lane(ax, y, h, W, key)

    comp(ax, 1.2, 1.05, 2.4, 0.85, 'Android App', 'Kotlin + WebView/RN', ec=LANES['bank'][1])
    comp(ax, 4.0, 1.05, 2.4, 0.85, 'Internet Banking', 'React / Angular', ec=LANES['bank'][1])
    comp(ax, 6.8, 1.05, 2.4, 0.85, 'Bank API GW', 'JWT · mTLS · WAF', ec=LANES['bank'][1])

    comp(ax, 1.5, 2.55, 3.0, 0.95, '@silversuits/voice-rm-sdk', 'VoiceModal · AguiPanel · RageDetect', ec=LANES['sdk'][1])
    comp(ax, 5.2, 2.55, 2.8, 0.95, 'Bank Auth Bridge', 'session token · MPIN gate', ec=LANES['sdk'][1])
    comp(ax, 8.5, 2.55, 2.8, 0.95, 'Telemetry SDK', 'rage events · session metrics', ec=LANES['sdk'][1])

    comp(ax, 1.0, 4.2, 2.6, 1.1, 'Voice Engine API', 'POST /engine/turn', ec=LANES['api'][1])
    comp(ax, 3.9, 4.2, 2.6, 1.1, 'AG-UI Gateway', 'POST /agui/:id SSE', ec=LANES['api'][1])
    comp(ax, 6.8, 4.2, 2.6, 1.1, 'Trigger API', 'POST /trigger', ec=LANES['api'][1])
    comp(ax, 9.7, 4.2, 2.5, 1.1, 'STT/TTS Proxy', '/stt · /tts', ec=LANES['api'][1])
    comp(ax, 12.5, 4.2, 2.5, 1.1, 'Session Store', 'Redis cluster', ec=LANES['api'][1])

    comp(ax, 1.2, 6.05, 2.5, 1.0, 'ElevenLabs STT', 'India residency', ec=LANES['ai'][1])
    comp(ax, 4.1, 6.05, 2.5, 1.0, 'Azure OpenAI', 'GPT-4o-mini India', ec=LANES['ai'][1])
    comp(ax, 7.0, 6.05, 2.5, 1.0, 'Cartesia TTS', 'sonic-3 India', ec=LANES['ai'][1])
    comp(ax, 9.9, 6.05, 2.8, 1.0, 'Rule Engine', 'IF/THEN evaluator', ec=LANES['ai'][1])
    comp(ax, 13.0, 6.05, 2.5, 1.0, 'Manifest Registry', 'JSON sagas', ec=LANES['ai'][1])

    comp(ax, 1.5, 7.65, 3.2, 0.85, 'DocumentDB / Mongo', 'sessions · turns · analytics', ec=LANES['data'][1])
    comp(ax, 5.2, 7.65, 3.0, 0.85, 'Bank Core APIs', 'accounts · UPI · IMPS', ec=LANES['data'][1])
    comp(ax, 8.7, 7.65, 3.0, 0.85, 'CRM / RM Webhook', 'human escalation', ec=LANES['data'][1])
    comp(ax, 12.2, 7.65, 2.8, 0.85, 'Rule Config Store', 'bank-managed JSON', ec=LANES['data'][1])

    arr(ax, 3.6, 1.5, 3.0, 2.55, 'HTTPS', rad=0.1)
    arr(ax, 5.2, 1.5, 7.0, 2.55, 'HTTPS', rad=-0.05)
    arr(ax, 7.8, 1.5, 7.0, 4.2, 'mTLS', rad=0.15)
    arr(ax, 3.0, 3.5, 2.3, 4.2)
    arr(ax, 3.0, 3.5, 5.2, 4.2)
    arr(ax, 6.5, 3.5, 8.1, 4.2)
    arr(ax, 8.1, 5.3, 5.35, 6.05)
    arr(ax, 8.1, 5.3, 2.45, 6.05)
    arr(ax, 8.1, 5.3, 8.25, 6.05)
    arr(ax, 7.0, 5.3, 6.35, 7.65, dashed=True)
    arr(ax, 10.5, 5.3, 6.7, 7.65, dashed=True)

    ax.text(W / 2, 9.0, 'All voice stays in-app · Keys never in client bundle · Bank owns persistent data',
            ha='center', fontsize=8.5, color=SUB, style='italic')
    return fig


def impl_fig_integration_options():
    """Figure 2 — Android & Web integration patterns."""
    W, H = 18, 10.5
    fig, ax = plt.subplots(figsize=(W, H), dpi=150)
    ax.set_facecolor(BG); fig.patch.set_facecolor(BG)
    ax.set_xlim(0, W); ax.set_ylim(0, H); ax.invert_yaxis(); ax.axis('off')
    fig_title(ax, W, 'Figure 2 — Integration Options (Android + Web)',
              'Recommended: Option A (WebView) for fastest V1 · Option B for long-term native UX')

    opts = [
        ('A · WebView Shell (V1 recommended)', 1.0, '#15803D',
         ['Bank Android Activity hosts WebView',
          'Load hosted Voice RM bundle (CDN)',
          'JS bridge: getAuthToken(), onNavigate()',
          'Reuse demo React components as-is',
          'Ship in 4–6 weeks']),
        ('B · React Native Module', 4.2, '#4338CA',
         ['RN screen embeds LoanAguiPanel + VoiceModal',
          'expo/fetch or react-native-sse for AG-UI',
          'Native mic via expo-av / react-native-audio',
          'Shared TS SDK with web',
          'Ship in 8–12 weeks']),
        ('C · Native Kotlin + REST', 7.4, '#C2410C',
         ['Custom UI; call Voice Engine REST only',
          'AG-UI via Kotlin SSE client (Dart/Java SDK)',
          'Highest control; highest build cost',
          'Best for strict bank UI guidelines',
          'Ship in 12–16 weeks']),
    ]
    for title, x, ec, bullets in opts:
        comp(ax, x, 1.0, 2.8, 0.7, title, ec=ec, ts=8)
        for i, b in enumerate(bullets):
            ax.text(x + 0.15, 2.0 + i * 0.55, f'• {b}', fontsize=7.5, color=TEXT)

    ax.text(0.8, 5.2, 'WEB / INTERNET BANKING', fontsize=10, fontweight='bold', color=LANES['bank'][1])
    web_opts = [
        ('D · NPM SDK embed', 1.0, ['import { VoiceRmProvider } from @silversuits/voice-rm-sdk',
                                      'Mount <VoiceModal /> on UPI route',
                                      'Same-origin or CORS to API GW']),
        ('E · Iframe widget', 6.5, ['Hosted widget at voice.bank.com',
                                     'postMessage for auth + navigation',
                                     'Fastest bank-side integration']),
        ('F · CopilotKit + @ag-ui/client', 12.0, ['Official AG-UI HttpAgent',
                                                    'Migrate from custom aguiClient.js',
                                                    'Future-proof protocol compliance']),
    ]
    for title, x, bullets in web_opts:
        comp(ax, x, 5.6, 4.8, 0.65, title, ec='#0369A1', ts=8)
        for i, b in enumerate(bullets):
            ax.text(x + 0.15, 6.5 + i * 0.5, f'• {b}', fontsize=7.5, color=TEXT)

    ax.text(W / 2, 9.5, 'Decision: start A+D in V1 sprint 1–4; evaluate B/F in V2 based on bank mobile stack',
            ha='center', fontsize=8.5, color=SUB, style='italic')
    return fig


def impl_fig_agui_sequence():
    """Figure 3 — AG-UI integration sequence."""
    W, H = 18, 9.5
    fig, ax = plt.subplots(figsize=(W, H), dpi=150)
    ax.set_facecolor(BG); fig.patch.set_facecolor(BG)
    ax.set_xlim(0, W); ax.set_ylim(0, H); ax.invert_yaxis(); ax.axis('off')
    fig_title(ax, W, 'Figure 3 — AG-UI Integration Sequence (Form Assistant)',
              'AG-UI Protocol · HTTP POST + SSE · Compatible with @ag-ui/client HttpAgent')

    actors = ['Bank Screen', 'AguiPanel SDK', 'API Gateway', 'AG-UI Runner', 'Azure OpenAI']
    xs = [1.5, 4.5, 7.5, 10.5, 13.5]
    for i, (name, x) in enumerate(zip(actors, xs)):
        comp(ax, x - 0.9, 1.0, 1.8, 0.6, name, ec='#4338CA', ts=7.5)
        ax.plot([x, x], [1.6, 8.5], color='#CBD5E1', lw=1.2, zorder=1)

    steps = [
        (0, 1, 'User speaks / types on loan form'),
        (1, 2, 'runAgent(id, threadId, messages, formState)'),
        (2, 3, 'POST /api/agui/:agentId + Bearer JWT'),
        (3, 4, 'OpenAI stream + tool loop (set_field)'),
        (4, 3, 'SSE: TEXT_MESSAGE_CHUNK, STATE_DELTA'),
        (3, 2, 'SSE proxy stream'),
        (2, 1, 'applyStateDelta → onFormChange'),
        (1, 0, 'Form fields update + TTS reply'),
    ]
    y = 2.2
    for fr, to, lbl in steps:
        arr(ax, xs[fr], y, xs[to], y, lbl, rad=0.08 if fr != to else 0)
        y += 0.75

    comp(ax, 1.0, 8.7, 16.0, 0.55, 'Key events: RUN_STARTED · TEXT_MESSAGE_CHUNK · TOOL_CALL_* · STATE_DELTA · RUN_FINISHED · RUN_ERROR',
         ec='#7C3AED', ts=7.5)
    return fig


def impl_fig_component_map():
    """Figure 4 — LLD component / package map."""
    W, H = 18, 10.0
    fig, ax = plt.subplots(figsize=(W, H), dpi=150)
    ax.set_facecolor(BG); fig.patch.set_facecolor(BG)
    ax.set_xlim(0, W); ax.set_ylim(0, H); ax.invert_yaxis(); ax.axis('off')
    fig_title(ax, W, 'Figure 4 — Component Map (Packages to Build)',
              'Extract from demo monorepo into publishable SDK + production services')

    groups = [
        ('@silversuits/voice-rm-sdk (npm)', 0.8, '#4338CA', [
            'VoiceModal', 'LoanAguiPanel', 'RMHelpPrompt', 'useRageDetect',
            'engineClient', 'aguiClient → @ag-ui/client wrapper',
            'cartesiaTts', 'useElevenSpeech',
        ]),
        ('voice-rm-api (Node/Express → Azure)', 4.0, '#15803D', [
            'routes/engine.js', 'routes/agui.js', 'routes/trigger.js',
            'services/sessionStore (Redis)', 'services/ruleEngine',
            'adapters/bankCore.js', 'middleware/auth.js',
        ]),
        ('voice-rm-engine (domain)', 7.2, '#7C3AED', [
            'manifestRegistry', 'saga.js', 'llm.js', 'tools.js',
            'agui/*Runner.js + *Config.js', 'confirmParser.js',
        ]),
        ('Bank-side (bank team owns)', 10.4, '#0369A1', [
            'POST /api/trigger wiring', 'JWT issuer for customer sessions',
            'MPIN verify endpoint', 'CRM escalation webhook',
            'DocumentDB schema + read views', 'Mobile WebView shell',
        ]),
        ('Infra (DevOps)', 13.6, '#C2410C', [
            'Azure App Service / AKS', 'Redis', 'Key Vault',
            'API Management', 'CI/CD pipelines', 'Grafana + Pino logs',
        ]),
    ]
    for title, x, ec, items in groups:
        comp(ax, x, 1.0, 2.8, 0.55, title, ec=ec, ts=7.5)
        for i, item in enumerate(items):
            comp(ax, x, 1.8 + i * 0.95, 2.8, 0.75, item, ec=ec, ts=7.5, ss=6.5)

    arr(ax, 3.6, 4.5, 4.0, 4.5, 'HTTP', rad=0)
    arr(ax, 6.8, 4.5, 7.2, 4.5, 'import', rad=0)
    arr(ax, 10.0, 4.5, 10.4, 4.5, 'webhook', rad=0)
    return fig


def impl_fig_sprint_roadmap():
    """Figure 5 — 36-week sprint roadmap."""
    W, H = 18, 6.5
    fig, ax = plt.subplots(figsize=(W, H), dpi=150)
    ax.set_facecolor(BG); fig.patch.set_facecolor(BG)
    ax.set_xlim(0, W); ax.set_ylim(0, H); ax.invert_yaxis(); ax.axis('off')
    fig_title(ax, W, 'Figure 5 — Development Roadmap (36 Weeks · V1–V3)',
              'Sprint-level deliverables for engineering teams')

    phases = [
        ('V1 MVP\nWk 1–8', 0.8, 4.5, '#15803D',
         'Auth · Redis sessions · Bank DB writes · Trigger API · WebView embed · UAT'),
        ('V2 Production\nWk 9–20', 5.6, 5.5, '#4338CA',
         'Rule builder UI · Push notif · Analytics v1 · 10 langs · Load test 1K sessions'),
        ('V3 Intelligence\nWk 21–36', 11.4, 5.5, '#7C3AED',
         'Post-session LLM analytics · Churn scoring · Conversation replay · DR'),
    ]
    for label, x, w, col, desc in phases:
        ax.add_patch(FancyBboxPatch((x, 1.2), w, 1.0, boxstyle='round,pad=0.08',
                                     fc=col, ec='none', alpha=0.85, zorder=2))
        ax.text(x + w / 2, 1.7, label, ha='center', va='center', fontsize=9,
                fontweight='bold', color='white', zorder=3)
        ax.text(x + w / 2, 2.8, desc, ha='center', va='top', fontsize=7.5, color=TEXT, zorder=3)

    sprints = [
        (1, 'Azure + CI/CD'), (3, 'Engine prod'), (5, 'Bank DB'), (7, 'UAT'),
        (9, 'Push + WS'), (11, 'Rule builder'), (15, 'Analytics'), (17, 'Load test'),
        (21, 'Post-session AI'), (25, 'Churn model'), (29, 'Full dashboard'), (33, 'Go-live'),
    ]
    for wk, lbl in sprints:
        x = 0.8 + (wk / 36) * (W - 1.6)
        ax.plot([x, x], [3.5, 4.8], color='#94A3B8', lw=1)
        ax.text(x, 5.0, f'W{wk}', ha='center', fontsize=6.5, color=SUB)
        ax.text(x, 4.2, lbl, ha='center', fontsize=6, color=TEXT, rotation=45)

    ax.text(W / 2, 6.0, 'V4/V5 (mobile SDK hardening, multi-bank tenancy) — scope after V3 go-live',
            ha='center', fontsize=8, color=SUB, style='italic')
    return fig


def impl_fig_voice_sequence():
    """Figure 6 — Voice engine production sequence."""
    W, H = 18, 9.0
    fig, ax = plt.subplots(figsize=(W, H), dpi=150)
    ax.set_facecolor(BG); fig.patch.set_facecolor(BG)
    ax.set_xlim(0, W); ax.set_ylim(0, H); ax.invert_yaxis(); ax.axis('off')
    fig_title(ax, W, 'Figure 6 — Voice Engine Sequence (UPI / Manifest Flow)',
              'Server-authoritative state · Bank MPIN before CONFIRMATION')

    actors = ['User', 'VoiceModal', 'STT Proxy', 'Engine API', 'Saga+Tools', 'Bank Core']
    xs = [1.2, 3.5, 6.0, 8.5, 11.0, 13.5]
    for name, x in zip(actors, xs):
        comp(ax, x - 0.75, 0.9, 1.5, 0.55, name, ec='#0369A1', ts=7)
        ax.plot([x, x], [1.45, 8.2], color='#CBD5E1', lw=1.2)

    flow = [
        (0, 1, 'Speak utterance'),
        (1, 2, 'POST /api/stt (audio/webm)'),
        (2, 1, '{ text }'),
        (1, 3, 'POST /engine/turn TRANSCRIPT'),
        (3, 4, 'LLM extract + saga step'),
        (4, 5, 'contacts.search / execute_payment'),
        (5, 4, 'result / error'),
        (4, 3, 'session state update'),
        (3, 1, 'session JSON'),
        (1, 0, 'Render + TTS speak'),
    ]
    y = 2.0
    for fr, to, lbl in flow:
        arr(ax, xs[fr], y, xs[to], y, lbl, rad=0.06)
        y += 0.62

    comp(ax, 1.0, 8.5, 16.0, 0.45, 'At CONFIRM: bank MPIN verify → then CONFIRMATION turn → execute tool',
         ec='#C2410C', ts=7.5)
    return fig


def impl_figures():
    return {
        'hld_deployment': impl_fig_hld_deployment(),
        'integration_options': impl_fig_integration_options(),
        'agui_sequence': impl_fig_agui_sequence(),
        'component_map': impl_fig_component_map(),
        'sprint_roadmap': impl_fig_sprint_roadmap(),
        'voice_sequence': impl_fig_voice_sequence(),
    }
