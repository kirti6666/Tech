import { encryptSecret, decryptSecret, isEncrypted } from "@/lib/crypto";
import type { AddonType } from "@/types/catalog";

/**
 * What each service needs from the customer, declared once.
 *
 * The form renders from these definitions, the API validates against them,
 * and the admin screen labels fields from them. One list means a field you
 * add to the form can't be silently dropped by the validator.
 *
 * `secret: true` marks a field encrypted at rest and masked everywhere
 * except the one admin view that needs it. Only three fields carry it, and
 * all three are on deployment — that concentration is the point: everything
 * else about a service request is ordinary business data.
 */

export type FieldType = "text" | "url" | "textarea" | "color" | "file" | "password";

export interface ServiceField {
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  help?: string;
  secret?: boolean;
  maxLength?: number;
}

export const SERVICE_FORMS: Record<AddonType, { intro: string; fields: ServiceField[] }> = {
  rebranding: {
    intro:
      "Send us your brand and we'll apply it throughout the product — logo, colours, app name and the domain it points at.",
    fields: [
      {
        name: "appName",
        label: "App name",
        type: "text",
        required: true,
        placeholder: "Northwind Clinic",
        maxLength: 80,
      },
      {
        name: "logoUrl",
        label: "Logo",
        type: "file",
        required: true,
        help: "PNG or SVG with a transparent background, at least 512px wide.",
      },
      {
        name: "primaryColor",
        label: "Primary colour",
        type: "color",
        required: true,
        help: "Used for buttons, links and highlights.",
      },
      {
        name: "secondaryColor",
        label: "Secondary colour",
        type: "color",
        required: false,
      },
      {
        name: "domain",
        label: "Domain",
        type: "text",
        required: false,
        placeholder: "app.northwindclinic.in",
        help: "If you already have one. You can send it later.",
      },
      {
        name: "notes",
        label: "Anything else",
        type: "textarea",
        required: false,
        maxLength: 2000,
      },
    ],
  },

  deployment: {
    intro:
      "We'll install the product on your server, point your domain at it and fit the SSL certificate.",
    fields: [
      {
        name: "domain",
        label: "Domain to deploy to",
        type: "text",
        required: true,
        placeholder: "app.northwindclinic.in",
      },
      {
        name: "hostingProvider",
        label: "Hosting provider",
        type: "text",
        required: true,
        placeholder: "Hostinger, DigitalOcean, AWS…",
      },
      {
        name: "panelUrl",
        label: "Control panel or server address",
        type: "url",
        required: true,
        placeholder: "https://panel.example.com",
      },
      {
        name: "username",
        label: "Username",
        type: "text",
        required: true,
        secret: true,
      },
      {
        name: "password",
        label: "Password or access key",
        type: "password",
        required: true,
        secret: true,
        help: "Create a temporary account for us and delete it once we're done. We delete our copy 7 days after handover.",
      },
      {
        name: "sshKey",
        label: "SSH key (if you'd rather)",
        type: "textarea",
        required: false,
        secret: true,
        maxLength: 4000,
      },
      {
        name: "notes",
        label: "Anything we should know",
        type: "textarea",
        required: false,
        maxLength: 2000,
      },
    ],
  },

  maintenance: {
    intro:
      "Tell us where the product is running and who to contact, and we'll take it from there.",
    fields: [
      {
        name: "domain",
        label: "Where it's running",
        type: "text",
        required: true,
        placeholder: "app.northwindclinic.in",
      },
      {
        name: "contactName",
        label: "Technical contact",
        type: "text",
        required: true,
      },
      {
        name: "contactEmail",
        label: "Contact email",
        type: "text",
        required: true,
      },
      {
        name: "repoUrl",
        label: "Repository, if you have one",
        type: "url",
        required: false,
      },
      {
        name: "notes",
        label: "Known issues or priorities",
        type: "textarea",
        required: false,
        maxLength: 2000,
      },
    ],
  },
};

export interface ValidationOutcome {
  valid: boolean;
  errors: Record<string, string>;
  payload: Record<string, unknown>;
}

/**
 * Validates a submitted payload against its service definition and encrypts
 * the secret fields on the way through.
 *
 * Unknown keys are dropped rather than stored. This is a Mixed-type field on
 * the document, so nothing else stops a caller writing arbitrary structures
 * into it.
 */
export function validateServicePayload(
  type: AddonType,
  input: Record<string, unknown>
): ValidationOutcome {
  const definition = SERVICE_FORMS[type];
  const errors: Record<string, string> = {};
  const payload: Record<string, unknown> = {};

  for (const field of definition.fields) {
    const raw = input[field.name];
    const value = typeof raw === "string" ? raw.trim() : "";

    if (!value) {
      if (field.required) errors[field.name] = `${field.label} is required`;
      continue;
    }

    if (field.maxLength && value.length > field.maxLength) {
      errors[field.name] = `${field.label} is too long (max ${field.maxLength})`;
      continue;
    }

    if (field.type === "url" && !/^https?:\/\/\S+$/i.test(value)) {
      errors[field.name] = "Enter a full URL starting with http:// or https://";
      continue;
    }

    if (field.type === "color" && !/^#[0-9a-fA-F]{6}$/.test(value)) {
      errors[field.name] = "Use a hex colour like #1B5FCC";
      continue;
    }

    payload[field.name] = field.secret ? encryptSecret(value) : value;
  }

  return { valid: Object.keys(errors).length === 0, errors, payload };
}

/**
 * Payload prepared for display. Secret values become a marker rather than
 * plaintext, so the queue list and the customer's own read-back can render
 * a stored request without a password ever leaving the database.
 */
export function maskPayload(
  type: AddonType,
  payload: Record<string, unknown>
): Record<string, unknown> {
  const secretFields = new Set(
    SERVICE_FORMS[type].fields.filter((f) => f.secret).map((f) => f.name)
  );

  const masked: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    masked[key] = secretFields.has(key) && value ? "••••••••" : value;
  }
  return masked;
}

/**
 * Decrypts secrets for the one screen that genuinely needs them: the
 * engineer about to do the deployment. Every call should be audit-logged by
 * the caller — reading someone's server password is an event worth
 * recording.
 */
export function revealPayload(
  payload: Record<string, unknown>
): Record<string, unknown> {
  const revealed: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (isEncrypted(value)) {
      try {
        revealed[key] = decryptSecret(value as string);
      } catch {
        revealed[key] = "(could not decrypt — key may have been rotated)";
      }
    } else {
      revealed[key] = value;
    }
  }
  return revealed;
}

export function hasSecrets(payload: Record<string, unknown>): boolean {
  return Object.values(payload).some(isEncrypted);
}
