import { GoogleGenAI } from "@google/genai";
import type { ZodType } from "zod";

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
export const LLM_MOCK = process.env.LLM_MOCK === "true";

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return client;
}

export type StructuredResult<T> = {
  data: T;
  model: string;
  mock: boolean;
};

/**
 * Request structured JSON output from Gemini, validated against a Zod schema.
 * Retries once with the validation error appended to the prompt.
 * When LLM_MOCK=true, calls the provided mock factory instead of the API.
 */
export async function generateStructured<T>(
  schema: ZodType<T>,
  prompt: string,
  mockFactory?: () => T
): Promise<StructuredResult<T>> {
  if (LLM_MOCK) {
    if (!mockFactory) throw new Error("LLM_MOCK=true requires a mockFactory");
    const data = schema.parse(mockFactory());
    return { data, model: "mock", mock: true };
  }

  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    const fullPrompt =
      attempt === 0 ? prompt : `${prompt}\n\nYour previous response failed validation:\n${String(lastError)}\nReturn only valid JSON matching the required schema.`;

    const res = await getClient().models.generateContent({
      model: GEMINI_MODEL,
      contents: fullPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schemaToSchema(resolveSchema(schema)),
        temperature: 0.2,
      },
    });

    const text = res.text;
    if (!text) {
      lastError = new Error("Empty response from Gemini");
      continue;
    }

    try {
      let parsed: unknown = JSON.parse(text);
      if (typeof parsed === "string") parsed = JSON.parse(parsed);
      const data = schema.parse(parsed);
      return { data, model: GEMINI_MODEL, mock: false };
    } catch (err) {
      lastError = err;
    }
  }
  throw new Error(`Gemini returned invalid structured output: ${String(lastError)}`);
}

// --- Zod schema introspection (minimal, supports our prompt schemas) ---

type ZodAny = ZodType & {
  _def?: {
    typeName?: string;
    shape?: () => Record<string, ZodAny>;
    innerType?: ZodAny;
  };
};

function resolveSchema(schema: ZodAny): ZodAny {
  const def = schema._def;
  if (def?.typeName === "ZodEffects") return resolveSchema(def.innerType as ZodAny);
  return schema;
}

function schemaToSchema(schema: ZodAny): Record<string, unknown> {
  const def = schema._def;
  switch (def?.typeName) {
    case "ZodString":
      return { type: "STRING" };
    case "ZodNumber":
      return { type: "NUMBER" };
    case "ZodBoolean":
      return { type: "BOOLEAN" };
    case "ZodArray":
      return { type: "ARRAY", items: schemaToSchema(def.innerType as ZodAny) };
    case "ZodObject": {
      const shape = def.shape?.() ?? {};
      const properties: Record<string, unknown> = {};
      const required: string[] = [];
      for (const [key, val] of Object.entries(shape)) {
        properties[key] = schemaToSchema(val);
        const v = val as unknown as { _def?: { typeName?: string; isOptional?: boolean } };
        if (v._def?.typeName !== "ZodOptional") required.push(key);
      }
      return { type: "OBJECT", properties, required };
    }
    case "ZodOptional":
      return schemaToSchema(def.innerType as ZodAny);
    case "ZodEnum": {
      const values = (schema as unknown as { _def: { values?: string[] } })._def.values;
      return { type: "STRING", enum: values ?? [] };
    }
    default:
      return { type: "STRING" };
  }
}
