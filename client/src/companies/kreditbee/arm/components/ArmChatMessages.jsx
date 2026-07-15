import React from 'react';
import { AiAvatar } from './ArmChatHeader.jsx';
import { KB } from '../../theme.js';

export default function ArmChatMessages({ messages, chatEndRef, footer }) {
  return (
    <div className="flex flex-col gap-3 px-3 py-4">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start gap-2'}`}
        >
          {msg.role === 'assistant' && <AiAvatar />}
          <div
            className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
              msg.role === 'user'
                ? 'rounded-br-md text-kb-ink'
                : 'rounded-bl-md border border-kb-border bg-white text-kb-ink'
            }`}
            style={msg.role === 'user' ? { backgroundColor: KB.yellow } : undefined}
          >
            {msg.content}
          </div>
        </div>
      ))}
      {footer ? (
        <div className="flex items-start gap-2">
          <div className="h-7 w-7 shrink-0" aria-hidden />
          <div className="min-w-0 flex-1">{footer}</div>
        </div>
      ) : null}
      <div ref={chatEndRef} />
    </div>
  );
}
