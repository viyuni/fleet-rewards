import { envEmails, port } from '@internal/shared';
import { createEnv } from '@t3-oss/env-core';
import * as v from 'valibot';

export const smtpEnvShape = {
  NOTIFY_EMAILS: v.optional(envEmails),
  SMTP_HOST: v.optional(v.string()),
  SMTP_PORT: v.optional(port()),
  SMTP_USER: v.optional(v.string()),
  SMTP_PASS: v.optional(v.string()),
};

export const smtpEnvSchema = v.union([
  v.object({
    NOTIFY_EMAILS: v.optional(envEmails),
    SMTP_HOST: v.undefined(),
    SMTP_PORT: v.undefined(),
    SMTP_USER: v.undefined(),
    SMTP_PASS: v.undefined(),
  }),
  v.object({
    NOTIFY_EMAILS: v.optional(envEmails),
    SMTP_HOST: v.string(),
    SMTP_PORT: v.number(),
    SMTP_USER: v.string(),
    SMTP_PASS: v.string(),
  }),
]);

export type SmtpEnv = v.InferOutput<typeof smtpEnvSchema>;

export function parseSmtpEnv(input: unknown) {
  return v.parse(smtpEnvSchema, input);
}

const rawSmtpEnv = createEnv({
  server: smtpEnvShape,
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

export const smtpEnv = parseSmtpEnv(rawSmtpEnv);
