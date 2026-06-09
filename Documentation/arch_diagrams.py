"""Shared architecture diagrams — demo + production."""
import io
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Rectangle
import matplotlib.patches as mpatches

# ─── Enterprise palette ────────────────────────────────────────────────
BG       = '#F8FAFC'
LANE_HDR = '#0F172A'
TEXT     = '#0F172A'
SUB      = '#64748B'
ARROW    = '#334155'

DEMO_LANES = {
    'user':   ('#E0F2FE', '#0369A1', 'USER / BROWSER'),
    'react':  ('#EEF2FF', '#4338CA', 'REACT FRONTEND  ·  client/'),
    'express':('#F0FDF4', '#15803D', 'EXPRESS BACKEND  ·  server/  :3001'),
    'ai':     ('#F3E8FF', '#7C3AED', 'AI SERVICES  ·  External APIs'),
    'data':   ('#FFEDD5', '#C2410C', 'MOCK DATA & TOOLS  ·  In-memory demo'),
}
VOICE_EC = '#0369A1'
AGUI_EC  = '#7C3AED'


def lane(ax, y, h, W, key):
    fc, ec, label = DEMO_LANES[key]
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


def legend(ax, W, y, items):
    for i, (col, lbl) in enumerate(items):
        xo = 0.7 + i * (W - 1.4) / max(len(items), 1)
        ax.plot([xo, xo + 0.5], [y, y], color=col, lw=2.5)
        ax.text(xo + 0.65, y, lbl, fontsize=7, color=SUB, va='center')


# ═══════════════════════════════════════════════════════════════════════
#  FIGURE 1 — LAYERED SYSTEM (Voice left | AG-UI right)
# ═══════════════════════════════════════════════════════════════════════
def demo_fig_system_layers():
    W, H = 18, 12.5
    fig, ax = plt.subplots(figsize=(W, H), dpi=150)
    ax.set_facecolor(BG); fig.patch.set_facecolor(BG)
    ax.set_xlim(0, W); ax.set_ylim(0, H); ax.invert_yaxis(); ax.axis('off')
    fig_title(ax, W, 'Figure 1 — System Architecture (Current Demo Codebase)',
              'Web-based in-app assistant · Verified Voice-to-Command repo · In-app only')

    lanes_def = [
        (0.9,  1.2,  'user'),
        (2.2,  2.5,  'react'),
        (4.8,  1.65, 'express'),
        (6.55, 2.0,  'ai'),
        (8.65, 1.55, 'data'),
    ]
    for y, h, key in lanes_def:
        lane(ax, y, h, W, key)

    # Flow labels
    ax.text(4.5, 1.05, 'VOICE / UPI FLOW', ha='center', fontsize=9,
            fontweight='bold', color=VOICE_EC)
    ax.text(13.5, 1.05, 'AG-UI SCREEN AGENTS', ha='center', fontsize=9,
            fontweight='bold', color=AGUI_EC)
    ax.plot([9.0, 9.0], [1.2, 8.5], color='#CBD5E1', lw=1.5, linestyle='--', zorder=1)

    ox_v, ox_a = 0.75, 9.2
    cw, ch = 2.45, 0.68

    # User
    comp(ax, 3.0, 1.05, 5.5, 0.75, 'User · Browser · Indian Bank UI simulation', ec=DEMO_LANES['user'][1])

    # React — voice column
    voice_react = [
        ('useRageDetect', '5 taps / 900ms · invalid ×2'),
        ('RMHelpPrompt', '"Need help?" sheet'),
        ('VoiceModal', 'Chat · mic · TTS play'),
        ('MediaRecorder + VAD', 'useElevenSpeech.js'),
        ('MpinSheet', 'Payment confirm gate'),
    ]
    for i, (t, s) in enumerate(voice_react):
        comp(ax, ox_v + (i % 2) * 2.6, 2.35 + (i // 2) * 0.82, cw, ch, t, s, ec=VOICE_EC)

    # React — AG-UI column
    agui_react = [
        ('HomeScreen', 'Concierge · quick actions'),
        ('LoanApplicationScreen', 'Loan LOS form'),
        ('ImpsFundTransferScreen', 'IMPS form'),
        ('CreateDepositScreen', 'FD / RD / MMD'),
        ('TransactionHistoryScreen', 'Statement + AI query'),
    ]
    for i, (t, s) in enumerate(agui_react):
        comp(ax, ox_a + (i % 2) * 2.6, 2.35 + (i // 2) * 0.82, cw, ch, t, s, ec=AGUI_EC)

    # Express — voice
    comp(ax, ox_v, 4.95, cw, ch, 'POST /api/stt', 'ElevenLabs proxy', ec=DEMO_LANES['express'][1])
    comp(ax, ox_v + 2.7, 4.95, 2.8, ch, 'POST /api/engine/turn', 'State machine', ec=DEMO_LANES['express'][1])
    comp(ax, ox_v, 5.75, cw, ch, 'POST /api/tts', 'Cartesia MP3', ec=DEMO_LANES['express'][1])

    # Express — AG-UI
    comp(ax, ox_a, 4.95, 3.2, ch, 'POST /api/agui/{agentId}', 'SSE streaming', ec=AGUI_EC)
    comp(ax, ox_a + 3.4, 4.95, 2.5, ch, 'GET /api/manifests', 'Flow configs', ec=DEMO_LANES['express'][1])

    # AI — voice path
    comp(ax, ox_v, 6.75, cw, ch, 'ElevenLabs Scribe v2', 'STT · India', ec=DEMO_LANES['ai'][1])
    comp(ax, ox_v + 2.7, 6.65, 2.8, 0.88, 'State Machine + Saga', 'engine.js · 9 states', ec=DEMO_LANES['express'][1], ts=8, ss=6.5)
    comp(ax, ox_v + 2.7, 7.65, 2.8, ch, 'OpenAI GPT-4o-mini', 'Intent + reply', ec=DEMO_LANES['ai'][1])
    comp(ax, ox_v, 7.65, cw, ch, 'Cartesia sonic-3', 'TTS', ec=DEMO_LANES['ai'][1])

    # AI — AG-UI
    comp(ax, ox_a, 6.75, 3.2, 0.88, 'OpenAI GPT-4o-mini', 'Function calling · SSE', ec=AGUI_EC, ts=8, ss=6.5)

    # Mock / tools
    comp(ax, ox_v, 8.95, cw, ch, 'Tool Registry', 'tools.js', ec=DEMO_LANES['data'][1])
    comp(ax, ox_v + 2.7, 8.95, 2.8, ch, 'Mock Backend', 'backend.js · mock.js', ec=DEMO_LANES['data'][1])
    comp(ax, ox_a, 8.95, 3.2, ch, 'set_field / navigate_to', 'SSE → React state', ec=AGUI_EC)
    comp(ax, ox_a + 3.4, 8.95, 2.5, ch, 'Browser playback', 'Audio.play()', ec=DEMO_LANES['data'][1])

    # Key flows
    arr(ax, 5.5, 1.8, 2.0, 2.35, color=VOICE_EC)
    arr(ax, 2.0, 5.63, 2.0, 6.75, 'audio', color=DEMO_LANES['ai'][1])
    arr(ax, 4.1, 5.63, 4.1, 6.65, color=DEMO_LANES['express'][1])
    arr(ax, 4.1, 7.53, 4.1, 7.65, color=DEMO_LANES['ai'][1])
    arr(ax, 4.1, 8.33, 4.1, 8.95, 'tools', color=DEMO_LANES['data'][1])
    arr(ax, 14.0, 3.0, 10.5, 4.95, color=AGUI_EC)
    arr(ax, 10.5, 5.63, 10.5, 6.75, color=AGUI_EC)
    arr(ax, 10.5, 7.63, 10.5, 8.95, color=AGUI_EC, rad=0.15)
    arr(ax, 11.5, 9.29, 14.0, 3.5, 'form update', color=AGUI_EC, dashed=True, rad=0.25)

    legend(ax, W, 10.35, [
        (VOICE_EC, 'Voice / UPI flow'),
        (AGUI_EC, 'AG-UI screen agents'),
        (DEMO_LANES['ai'][1], 'AI vendor APIs'),
        (DEMO_LANES['data'][1], 'Mock data (demo only)'),
    ])

    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=150, bbox_inches='tight', facecolor=BG, pad_inches=0.15)
    buf.seek(0); plt.close()
    return buf


# ═══════════════════════════════════════════════════════════════════════
#  FIGURE 2 — VOICE FLOW SEQUENCE
# ═══════════════════════════════════════════════════════════════════════
def demo_fig_voice_sequence():
    W, H = 16, 7
    fig, ax = plt.subplots(figsize=(W, H), dpi=150)
    ax.set_facecolor(BG); fig.patch.set_facecolor(BG)
    ax.set_xlim(0, W); ax.set_ylim(0, H); ax.invert_yaxis(); ax.axis('off')
    fig_title(ax, W, 'Figure 2 — Voice / UPI Conversation Flow',
              'Manifest-driven state machine · One turn ≈ 1.5–2.5 seconds')

    actors = ['User', 'React App', 'Express API', 'AI Services', 'Mock Backend']
    aw = 2.9
    for i, a in enumerate(actors):
        comp(ax, 0.5 + i * aw, 1.0, aw - 0.2, 0.5, a,
             ec=VOICE_EC if i == 0 else DEMO_LANES['express'][1] if i == 2 else DEMO_LANES['ai'][1], ts=8)

    steps = [
        (0, 1, '1. Speak / tap mic'),
        (1, 2, '2. POST audio /api/stt'),
        (2, 3, '3. ElevenLabs transcript'),
        (2, 2, '4. POST /api/engine/turn'),
        (2, 3, '5. GPT-4o-mini intent'),
        (2, 4, '6. Tool call (if needed)'),
        (4, 2, '7. Mock payment'),
        (2, 3, '8. Generate reply'),
        (2, 2, '9. POST /api/tts'),
        (3, 2, '10. Cartesia MP3'),
        (2, 1, '11. Return audio'),
        (1, 0, '12. Play + re-arm mic'),
    ]
    y0 = 1.85
    for j, (fi, ti, lbl) in enumerate(steps):
        y = y0 + j * 0.42
        x1 = 0.5 + fi * aw + aw / 2
        x2 = 0.5 + ti * aw + aw / 2
        col = DEMO_LANES['data'][1] if fi == 4 or ti == 4 else VOICE_EC if fi <= 1 else DEMO_LANES['ai'][1] if fi == 3 or ti == 3 else DEMO_LANES['express'][1]
        arr(ax, x1, y, x2, y, lbl, color=col)

    # MPIN branch note
    comp(ax, 0.5, 6.2, 15, 0.55, 'CONFIRM state: voice "yes" intercepted → MpinSheet → then execute_payment',
         fc='#FFFBEB', ec='#D97706', ts=8, ss=7)

    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=150, bbox_inches='tight', facecolor=BG, pad_inches=0.15)
    buf.seek(0); plt.close()
    return buf


# ═══════════════════════════════════════════════════════════════════════
#  FIGURE 3 — AG-UI FLOW SEQUENCE
# ═══════════════════════════════════════════════════════════════════════
def demo_fig_agui_sequence():
    W, H = 16, 6.5
    fig, ax = plt.subplots(figsize=(W, H), dpi=150)
    ax.set_facecolor(BG); fig.patch.set_facecolor(BG)
    ax.set_xlim(0, W); ax.set_ylim(0, H); ax.invert_yaxis(); ax.axis('off')
    fig_title(ax, W, 'Figure 3 — AG-UI Screen Agent Flow',
              'SSE streaming · Independent of voice state machine · 5 screen-specific agents')

    actors = ['User', 'Bank Screen', 'POST /api/agui', 'OpenAI', 'React Form']
    aw = 3.0
    for i, a in enumerate(actors):
        comp(ax, 0.5 + i * aw, 1.0, aw - 0.2, 0.5, a, ec=AGUI_EC if i in (1, 4) else DEMO_LANES['ai'][1], ts=8)

    steps = [
        (0, 1, '1. User speaks'),
        (1, 2, '2. Forward messages[]'),
        (2, 3, '3. Stream GPT-4o-mini'),
        (3, 2, '4. SSE TEXT_MESSAGE'),
        (3, 2, '5. SSE TOOL_CALL'),
        (2, 4, '6. set_field / navigate'),
        (4, 1, '7. Form updates'),
        (2, 2, '8. TTS spoken reply'),
    ]
    y0 = 1.75
    for j, (fi, ti, lbl) in enumerate(steps):
        y = y0 + j * 0.48
        x1 = 0.5 + fi * aw + aw / 2
        x2 = 0.5 + ti * aw + aw / 2
        arr(ax, x1, y, x2, y, lbl, color=AGUI_EC)

    agents = 'Agents: home_assistant · loan_los · imps_transfer · create_deposit · txn_history'
    ax.text(W / 2, 5.85, agents, ha='center', fontsize=8, color=SUB,
            bbox=dict(boxstyle='round', facecolor='white', edgecolor='#CBD5E1'))

    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=150, bbox_inches='tight', facecolor=BG, pad_inches=0.15)
    buf.seek(0); plt.close()
    return buf


# ═══════════════════════════════════════════════════════════════════════
#  FIGURE 4 — STATE MACHINE + REPO MAP
# ═══════════════════════════════════════════════════════════════════════
def demo_fig_state_and_repo():
    W, H = 16, 8
    fig, ax = plt.subplots(figsize=(W, H), dpi=150)
    ax.set_facecolor(BG); fig.patch.set_facecolor(BG)
    ax.set_xlim(0, W); ax.set_ylim(0, H); ax.invert_yaxis(); ax.axis('off')
    fig_title(ax, W, 'Figure 4 — Dialogue State Machine & Repository Layout',
              'Server-side engine · Manifest-driven flows')

    # State machine (left)
    ax.text(4, 0.95, 'VOICE STATE MACHINE (9 states)', ha='center',
            fontsize=10, fontweight='bold', color=DEMO_LANES['express'][1])
    states = [
        ('IDLE', 'Start'),
        ('FILL', 'Collect slots'),
        ('ASK', 'Ask question'),
        ('DISAMBIGUATE', 'Pick contact'),
        ('CHOOSE', 'Pick VPA'),
        ('CONFIRM', 'MPIN gate'),
        ('DONE', 'Success'),
        ('FAILED', 'Error'),
        ('CANCELLED', 'User cancel'),
    ]
    for i, (st, desc) in enumerate(states):
        row, col = i // 3, i % 3
        comp(ax, 0.4 + col * 2.6, 1.35 + row * 0.95, 2.4, 0.75, st, desc,
             ec=DEMO_LANES['express'][1], ts=8, ss=6.5)

    # Repo structure (right)
    ax.text(12, 0.95, 'REPOSITORY STRUCTURE', ha='center',
            fontsize=10, fontweight='bold', color=VOICE_EC)
    repo = [
        ('client/src/', 'React UI · hooks · components'),
        ('client/src/engine/', 'simEngine.js → calls server'),
        ('server/index.js', 'Express routes · API entry'),
        ('server/engine/', 'engine.js · saga.js · llm.js · tools.js'),
        ('server/manifests/', 'send_money.json · 5 flows'),
        ('server/agui/', '5 AG-UI agent configs + runners'),
        ('server/data/', 'mock.js · backend.js (in-memory)'),
    ]
    for i, (path, desc) in enumerate(repo):
        comp(ax, 8.2, 1.35 + i * 0.88, 7.5, 0.72, path, desc, ec=VOICE_EC, ts=8, ss=7)

    # Manifests bar
    comp(ax, 0.4, 5.5, 15.2, 0.7,
         'Manifests: send_money · check_balance · internal_transfer · pay_bill · book_flight',
         'Each JSON defines slots, steps, validations, tool bindings — add new flow = new JSON file',
         ec=DEMO_LANES['data'][1], fc='#FFFBEB', ts=8.5, ss=7)

    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=150, bbox_inches='tight', facecolor=BG, pad_inches=0.15)
    buf.seek(0); plt.close()
    return buf


# ─── Production diagram palette (overrides demo LANE keys for prod figures) ──
PROD_LANES = {
    'user':   ('#E0F2FE', '#0369A1', 'CHANNEL LAYER'),
    'bank':   ('#DCFCE7', '#15803D', 'BANK INTEGRATION LAYER'),
    'core':   ('#EEF2FF', '#4338CA', 'SILVER SUITS AI PLATFORM'),
    'ai':     ('#F3E8FF', '#7C3AED', 'AI SERVICES (MANAGED)'),
    'rule':   ('#FFEDD5', '#C2410C', 'RULE ENGINE'),
    'data':   ('#FEE2E2', '#B91C1C', 'DATA & ANALYTICS'),
}


def prod_lane(ax, y, h, W, key):
    fc, ec, label = PROD_LANES[key]
    ax.add_patch(Rectangle((0, y), W, h, fc=fc, ec='none', zorder=0))
    ax.add_patch(Rectangle((0, y), 0.55, h, fc=LANE_HDR, ec='none', zorder=1))
    ax.text(0.28, y + h / 2, label, ha='center', va='center',
            fontsize=6.5, fontweight='bold', color='white', rotation=90, zorder=2)


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


def legend(ax, W, y, items):
    for i, (col, lbl) in enumerate(items):
        xo = 0.7 + i * (W - 1.4) / len(items)
        ax.plot([xo, xo + 0.5], [y, y], color=col, lw=2.5)
        ax.text(xo + 0.65, y, lbl, fontsize=7, color=SUB, va='center')


# ═══════════════════════════════════════════════════════════════════════
#  FIGURE 1 — LAYERED SYSTEM ARCHITECTURE
# ═══════════════════════════════════════════════════════════════════════
def prod_fig_layered_arch():
    W, H = 18, 13
    fig, ax = plt.subplots(figsize=(W, H), dpi=150)
    ax.set_facecolor(BG); fig.patch.set_facecolor(BG)
    ax.set_xlim(0, W); ax.set_ylim(0, H); ax.invert_yaxis(); ax.axis('off')
    fig_title(ax, W, 'Figure 1 — Production System Architecture (Layered View)',
              'Indian Bank VPC · AWS ap-south-1 (Mumbai) · DPDP / RBI compliant deployment')

    # Lane layout: (y_start, height, key)
    lanes = [
        (0.9,  1.35, 'user'),
        (2.35, 1.55, 'bank'),
        (4.0,  2.35, 'core'),
        (6.45, 1.75, 'ai'),
        (8.3,  1.55, 'rule'),
        (9.95, 1.55, 'data'),
    ]
    for y, h, key in lanes:
        prod_lane(ax, y, h, W, key)

    cw, ch = 2.55, 0.72
    ox = 0.75

    # Channel
    comps_user = [
        ('Web Banking App', 'React · VoiceModal · AG-UI screens'),
        ('Mobile App (V3)', 'iOS / Android wrapper'),
        ('Agent Desktop (V2)', 'CRM overlay · RM assist'),
    ]
    for i, (t, s) in enumerate(comps_user):
        comp(ax, ox + i * 2.85, 1.05, cw, ch, t, s, ec=PROD_LANES['user'][1])

    # Bank integration
    comps_bank = [
        ('Event Gateway', 'POST /api/trigger'),
        ('Identity (SSO)', 'OAuth 2.0 · JWT'),
        ('Core Banking APIs', 'Accounts · Pay · KYC'),
        ('Webhook / Callback', 'Session outcomes'),
        ('Network Security', 'mTLS · IP allowlist'),
    ]
    for i, (t, s) in enumerate(comps_bank):
        comp(ax, ox + i * 2.85, 2.55, 2.35 if i == 4 else cw, ch, t, s, ec=PROD_LANES['bank'][1])

    # Silver Suits core — 2 rows
    row1 = [
        ('API Gateway', 'Auth · rate limit · WAF'),
        ('Session Manager', 'Redis · 30min TTL'),
        ('Dialogue Engine', 'State machine · saga'),
        ('AG-UI Agents', 'SSE · 5 screen agents'),
        ('Event Bus', 'Turn + trigger events'),
        ('Logger', 'Structured JSON logs'),
    ]
    row2 = [
        ('STT Proxy', '/api/stt'),
        ('TTS Proxy', '/api/tts'),
        ('Tool Registry', 'Bank tool bindings'),
        ('Bank API Adapter', 'Retry · circuit breaker'),
        ('MPIN Gate', 'Payment confirmation'),
        ('Load Balancer', 'ALB · auto-scale'),
    ]
    for i, (t, s) in enumerate(row1):
        comp(ax, ox + i * 2.85, 4.25, cw, ch, t, s, ec=PROD_LANES['core'][1])
    for i, (t, s) in enumerate(row2):
        comp(ax, ox + i * 2.85, 5.25, cw, ch, t, s, ec=PROD_LANES['core'][1])

    # AI services
    comps_ai = [
        ('ElevenLabs STT', 'Scribe v2 · India'),
        ('Azure OpenAI', 'GPT-4o · intent + reply'),
        ('Cartesia TTS', 'sonic-3 · MP3'),
        ('Azure OpenAI', 'AG-UI function calls'),
        ('Analysis LLM (V3)', 'Post-session insights'),
    ]
    for i, (t, s) in enumerate(comps_ai):
        ec = SUB if 'V3' in t else PROD_LANES['ai'][1]
        comp(ax, ox + i * 2.85, 6.75, cw, ch, t, s, ec=ec)

    # Rule engine
    comps_rule = [
        ('Trigger Ingestor', 'Schema validate'),
        ('Fact Composer', 'User + event + form'),
        ('Rule Evaluator', 'In-memory <100ms'),
        ('Action Dispatcher', '5 actuation types'),
        ('Rule Config Store', 'Bank-managed JSON'),
        ('Emergency Override', 'Compliance inject'),
    ]
    for i, (t, s) in enumerate(comps_rule):
        comp(ax, ox + i * 2.85, 8.55, cw, ch, t, s, ec=PROD_LANES['rule'][1])

    # Data
    comps_data = [
        ('DocumentDB', 'Sessions · turns · audit'),
        ('Redis Cache', 'Active session state'),
        ('S3', 'Rules · backups · audio opt.'),
        ('Analytics Dashboard', 'Read-only · bank ops'),
        ('CloudWatch', 'Metrics · alerts'),
    ]
    for i, (t, s) in enumerate(comps_data):
        comp(ax, ox + i * 2.85, 10.2, cw, ch, t, s, ec=PROD_LANES['data'][1])

    # Key vertical flows (center)
    cx = W / 2
    arr(ax, cx, 1.77, cx, 2.35, 'HTTPS')
    arr(ax, cx, 3.1, cx, 4.0, 'REST / JWT')
    arr(ax, cx, 6.35, cx, 6.45, 'API calls', color=PROD_LANES['ai'][1])
    arr(ax, cx, 8.2, cx, 8.3, 'events', color=PROD_LANES['rule'][1])
    arr(ax, cx, 9.85, cx, 9.95, 'persist', color=PROD_LANES['data'][1])

    # Bank → Rule (horizontal)
    arr(ax, 2.0, 3.1, 2.0, 8.55, 'trigger', color=PROD_LANES['bank'][1], rad=0.35)
    # Core → Bank APIs
    arr(ax, 12.5, 5.6, 8.0, 3.1, 'bank APIs', color=PROD_LANES['bank'][1], rad=-0.2)

    legend(ax, W, 11.75, [
        (PROD_LANES['bank'][1], 'Bank-owned'),
        (PROD_LANES['core'][1], 'Silver Suits platform'),
        (PROD_LANES['ai'][1], 'External AI (zero retention)'),
        (PROD_LANES['rule'][1], 'Rule engine'),
        (PROD_LANES['data'][1], 'Bank data plane'),
    ])

    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=150, bbox_inches='tight', facecolor=BG, pad_inches=0.15)
    buf.seek(0); plt.close()
    return buf


# ═══════════════════════════════════════════════════════════════════════
#  FIGURE 2 — RUNTIME SEQUENCE (Voice + Rule parallel)
# ═══════════════════════════════════════════════════════════════════════
def prod_fig_runtime_flows():
    W, H = 18, 8.5
    fig, ax = plt.subplots(figsize=(W, H), dpi=150)
    ax.set_facecolor(BG); fig.patch.set_facecolor(BG)
    ax.set_xlim(0, W); ax.set_ylim(0, H); ax.invert_yaxis(); ax.axis('off')
    fig_title(ax, W, 'Figure 2 — Runtime Flows',
              'Left: Voice conversation path  |  Right: Rule engine path (can run in parallel)')

    # Swimlane headers
    actors_l = ['Customer', 'Bank App', 'AI Platform', 'AI Services', 'Bank APIs', 'Database']
    actors_r = ['Bank CBS/CRM', 'Rule Engine', 'AI Platform', 'Bank App', 'Database']
    aw = 2.5
    for i, a in enumerate(actors_l):
        comp(ax, 0.6 + i * aw, 1.0, aw - 0.15, 0.55, a, ec=PROD_LANES['user'][1] if i == 0 else PROD_LANES['core'][1], ts=8)
    ax.text(7.75, 0.75, 'VOICE CONVERSATION FLOW', ha='center', fontsize=10,
            fontweight='bold', color=PROD_LANES['core'][1])
    for i, a in enumerate(actors_r):
        comp(ax, 9.5 + i * aw, 1.0, aw - 0.15, 0.55, a, ec=PROD_LANES['rule'][1] if i == 1 else PROD_LANES['bank'][1], ts=8)
    ax.text(16.25, 0.75, 'RULE ENGINE FLOW', ha='center', fontsize=10,
            fontweight='bold', color=PROD_LANES['rule'][1])

    # Divider
    ax.plot([9.0, 9.0], [1.0, 7.8], color='#CBD5E1', lw=1.5, linestyle='--')

    # Voice flow steps (y positions)
    steps_l = [
        (0, 1, 2, '1. Speak'),
        (1, 2, 3, '2. Audio → STT'),
        (2, 3, 4, '3. LLM intent'),
        (3, 4, 5, '4. Bank action'),
        (4, 3, 2, '5. TTS reply'),
        (5, 5, 5, '6. Log turn'),
    ]
    y0 = 2.0
    for j, (from_i, to_i, via_i, lbl) in enumerate(steps_l):
        y = y0 + j * 0.85
        x1 = 0.6 + from_i * aw + aw / 2
        x2 = 0.6 + to_i * aw + aw / 2
        xv = 0.6 + via_i * aw + aw / 2 if via_i != to_i else None
        if xv and via_i != from_i:
            arr(ax, x1, y, xv, y, color=PROD_LANES['core'][1])
            arr(ax, xv, y, x2, y, lbl, color=PROD_LANES['ai'][1] if via_i == 3 else PROD_LANES['core'][1])
        else:
            arr(ax, x1, y, x2, y, lbl, color=PROD_LANES['core'][1])

    # Rule flow
    steps_r = [
        (0, 1, '1. Event POST'),
        (1, 2, '2. Build facts'),
        (2, 3, '3. Evaluate rules'),
        (3, 4, '4. Dispatch action'),
        (4, 5, '5. Log decision'),
    ]
    for j, (from_i, to_i, lbl) in enumerate(steps_r):
        y = y0 + j * 0.85
        x1 = 9.5 + from_i * aw + aw / 2
        x2 = 9.5 + to_i * aw + aw / 2
        arr(ax, x1, y, x2, y, lbl, color=PROD_LANES['rule'][1])

    # Timing note
    ax.text(7.75, 7.5, 'Typical voice turn: 1.5–2.5s (STT 400ms + LLM 600ms + TTS 400ms + bank API 200ms)',
            ha='center', fontsize=8, color=SUB,
            bbox=dict(boxstyle='round', facecolor='white', edgecolor='#CBD5E1'))
    ax.text(16.25, 7.5, 'Rule engine: <100ms trigger-to-action (in-memory evaluation)',
            ha='center', fontsize=8, color=SUB,
            bbox=dict(boxstyle='round', facecolor='white', edgecolor='#CBD5E1'))

    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=150, bbox_inches='tight', facecolor=BG, pad_inches=0.15)
    buf.seek(0); plt.close()
    return buf


# ═══════════════════════════════════════════════════════════════════════
#  FIGURE 3 — RULE ENGINE ARCHITECTURE
# ═══════════════════════════════════════════════════════════════════════
def prod_fig_rule_engine():
    W, H = 16, 9
    fig, ax = plt.subplots(figsize=(W, H), dpi=150)
    ax.set_facecolor(BG); fig.patch.set_facecolor(BG)
    ax.set_xlim(0, W); ax.set_ylim(0, H); ax.invert_yaxis(); ax.axis('off')
    fig_title(ax, W, 'Figure 3 — Rule Engine Architecture',
              'Event-driven · Bank-configured JSON rules · Sub-100ms evaluation · Full audit trail')

    # Pipeline boxes (horizontal, large)
    py = 2.2
    pw, ph = 2.6, 1.35
    pipeline = [
        ('① Trigger\nIngestor', 'POST /api/trigger\nSchema validation', PROD_LANES['bank'][1]),
        ('② Fact\nComposer', 'user + event + form\n+ session context', PROD_LANES['rule'][1]),
        ('③ Rule\nEvaluator', 'AND/OR conditions\nPriority resolution', PROD_LANES['rule'][1]),
        ('④ Action\nDispatcher', 'Route to actuation\nhandler', PROD_LANES['rule'][1]),
        ('⑤ Audit &\nCallback', 'Log + bank webhook', PROD_LANES['data'][1]),
    ]
    px0 = 0.8
    for i, (title, sub, ec) in enumerate(pipeline):
        comp(ax, px0 + i * 3.05, py, pw, ph, title, sub, ec=ec, ts=9, ss=7)
        if i < 4:
            arr(ax, px0 + i * 3.05 + pw, py + ph / 2,
                px0 + (i + 1) * 3.05, py + ph / 2, color=PROD_LANES['rule'][1])

    # Trigger sources (top)
    ax.text(W / 2, 1.35, 'TRIGGER SOURCES', ha='center', fontsize=9,
            fontweight='bold', color=SUB)
    triggers = [
        ('App Analytics', 'rage_click · invalid_field'),
        ('Bank CBS / CRM', 'churn_flag · large_txn'),
        ('Scheduler (V2)', 'EMI due · FD maturity'),
        ('Voice Turn Bus', 'Post-turn events'),
        ('Analytics Bus (V2)', 'Session outcome events'),
    ]
    for i, (t, s) in enumerate(triggers):
        comp(ax, 0.6 + i * 3.05, 1.55, 2.7, 0.65, t, s, ec=PROD_LANES['bank'][1], ts=7.5, ss=6.5)
        arr(ax, 0.6 + i * 3.05 + 1.35, 2.2, px0 + 1.3, py, color=PROD_LANES['bank'][1], rad=0.15)

    # Actions (bottom)
    ax.text(W / 2, 4.0, 'ACTUATION HANDLERS', ha='center', fontsize=9,
            fontweight='bold', color=SUB)
    actions = [
        ('popup', 'Open VoiceModal\n+ context prefill'),
        ('assign_rm', 'CRM ticket +\nRM notification'),
        ('push_notif', 'FCM / APNs (V2)'),
        ('form_prefill', 'AG-UI warm start'),
        ('escalate_queue', 'Human RM queue (V2)'),
    ]
    for i, (t, s) in enumerate(actions):
        ec = SUB if 'V2' in s else PROD_LANES['rule'][1]
        comp(ax, 0.6 + i * 3.05, 4.25, 2.7, 0.75, t, s, ec=ec, ts=8, ss=6.5)
        arr(ax, px0 + 3 * 3.05 + pw / 2, py + ph, 0.6 + i * 3.05 + 1.35, 4.25,
            color=PROD_LANES['rule'][1], rad=0.2)

    # Rule config side panel
    rb = FancyBboxPatch((12.0, 5.3), 3.5, 2.8, boxstyle='round,pad=0.1',
                         fc='white', ec=PROD_LANES['rule'][1], lw=2, zorder=3)
    ax.add_patch(rb)
    ax.text(13.75, 5.55, 'RULE CONFIG (Bank-Managed)', ha='center',
            fontsize=8.5, fontweight='bold', color=PROD_LANES['rule'][1], zorder=4)
    sample = (
        'rule_id · priority · trigger[]\n'
        'conditions: AND/OR tree\n'
        'action · action_config\n'
        'enabled · version\n'
        '─────────────\n'
        'Hot-reload < 5 sec\n'
        'CI schema validation\n'
        'Git-versioned deploy'
    )
    ax.text(12.2, 5.95, sample, ha='left', va='top', fontsize=7,
            color=TEXT, fontfamily='monospace', zorder=4, linespacing=1.4)
    arr(ax, 12.0, 6.7, 10.5, 2.9, 'load rules', color=PROD_LANES['rule'][1], dashed=True)

    # Emergency override
    comp(ax, 0.6, 5.3, 4.5, 0.9, 'Emergency Override Layer (V2)',
         'RBI directives · global AI pause · mandatory disclosures',
         ec='#D97706', fc='#FFFBEB', ts=8.5, ss=7)
    arr(ax, 2.85, 5.3, 4.5, 2.9, 'priority inject', color='#D97706', rad=-0.15)

    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=150, bbox_inches='tight', facecolor=BG, pad_inches=0.15)
    buf.seek(0); plt.close()
    return buf


# ═══════════════════════════════════════════════════════════════════════
#  FIGURE 4 — DATA & DEPLOYMENT
# ═══════════════════════════════════════════════════════════════════════
def prod_fig_data_deploy():
    W, H = 16, 8
    fig, ax = plt.subplots(figsize=(W, H), dpi=150)
    ax.set_facecolor(BG); fig.patch.set_facecolor(BG)
    ax.set_xlim(0, W); ax.set_ylim(0, H); ax.invert_yaxis(); ax.axis('off')
    fig_title(ax, W, 'Figure 4 — Data Architecture & AWS Deployment',
              'Bank-owned data plane · Silver Suits compute in bank VPC')

    # Left: Data model
    ax.text(4, 0.95, 'DATA MODEL (DocumentDB)', ha='center', fontsize=10,
            fontweight='bold', color=PROD_LANES['data'][1])
    collections = [
        ('sessions', 'id · user · outcome · lang · duration'),
        ('turns', 'utterance · intent · slots · latency'),
        ('rule_events', 'rule_id · facts · action'),
        ('users', 'segment · churn · preferences'),
        ('audit_log', 'immutable · 7yr retention'),
    ]
    for i, (name, fields) in enumerate(collections):
        comp(ax, 0.5, 1.3 + i * 1.05, 7, 0.85, name, fields, ec=PROD_LANES['data'][1], ts=8.5, ss=7)

    # Right: AWS deployment
    ax.text(12, 0.95, 'AWS DEPLOYMENT (ap-south-1)', ha='center', fontsize=10,
            fontweight='bold', color=PROD_LANES['core'][1])
    aws = [
        ('Internet / Bank WAN', 'HTTPS 443 only'),
        ('ALB + WAF', 'TLS 1.3 termination'),
        ('ECS Fargate Cluster', '3+ AI platform containers'),
        ('ElastiCache Redis', 'Session + override flags'),
        ('DocumentDB Cluster', 'Multi-AZ · encrypted'),
        ('S3 + KMS', 'Rules · logs · backups'),
        ('CloudWatch', 'Metrics · alarms · logs'),
    ]
    for i, (name, desc) in enumerate(aws):
        comp(ax, 8.5, 1.3 + i * 0.88, 7, 0.72, name, desc, ec=PROD_LANES['core'][1], ts=8.5, ss=7)

    # Analytics bar
    comp(ax, 0.5, 6.8, 15, 0.75, 'Analytics Dashboard (Read-Only)',
         'Queries DocumentDB only · No write path · Role-based access for bank operations team',
         ec=PROD_LANES['data'][1], fc='#FEF2F2', ts=9, ss=7.5)
    arr(ax, 4, 6.3, 4, 6.8, 'read', color=PROD_LANES['data'][1])
    arr(ax, 12, 6.3, 12, 6.8, 'read', color=PROD_LANES['data'][1])

    # Security strip
    sec = 'AES-256 at rest  ·  TLS 1.3 in transit  ·  mTLS bank integration  ·  Zero AI vendor retention  ·  India data residency'
    ax.text(W / 2, 7.75, sec, ha='center', fontsize=8, color='white', fontweight='bold',
            bbox=dict(boxstyle='round', facecolor=LANE_HDR, pad=0.5))

    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=150, bbox_inches='tight', facecolor=BG, pad_inches=0.15)
    buf.seek(0); plt.close()
    return buf




def demo_figures():
    return (
        demo_fig_system_layers(),
        demo_fig_voice_sequence(),
        demo_fig_agui_sequence(),
        demo_fig_state_and_repo(),
    )

def prod_figures():
    return (
        prod_fig_layered_arch(),
        prod_fig_runtime_flows(),
        prod_fig_rule_engine(),
        prod_fig_data_deploy(),
    )
