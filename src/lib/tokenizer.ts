import { Tiktoken, type TiktokenBPE } from "js-tiktoken/lite";

/**
 * The byte-pair encoding used for tokenization. A single modern encoding is
 * used for every count; ranks are loaded lazily (dynamic import) so the
 * initial bundle stays small.
 */
export type EncodingName = "o200k_base";

const rankLoaders: Record<EncodingName, () => Promise<{ default: TiktokenBPE }>> = {
  o200k_base: () => import("js-tiktoken/ranks/o200k_base"),
};

const encoderCache = new Map<EncodingName, Tiktoken>();

/** Load (and cache) the Tiktoken encoder for a given encoding. */
export async function getEncoder(encoding: EncodingName): Promise<Tiktoken> {
  const cached = encoderCache.get(encoding);
  if (cached) return cached;

  const { default: ranks } = await rankLoaders[encoding]();
  const enc = new Tiktoken(ranks);
  encoderCache.set(encoding, enc);
  return enc;
}

export interface TokenSegment {
  /** The decoded text for this token, with whitespace preserved. */
  text: string;
  /** The integer token id. */
  id: number;
}

export interface TokenizeResult {
  ids: number[];
  segments: TokenSegment[];
  tokenCount: number;
  charCount: number;
}

/**
 * Encode text and produce both the raw token ids and the decoded per-token
 * segments used to render the highlighted view. Each segment is decoded
 * independently; bytes that don't form a complete UTF-8 sequence on their own
 * are rendered via the replacement character, matching tiktoken's behaviour.
 */
export function tokenize(enc: Tiktoken, text: string): TokenizeResult {
  if (text.length === 0) {
    return { ids: [], segments: [], tokenCount: 0, charCount: 0 };
  }

  const ids = enc.encode(text);
  const segments: TokenSegment[] = ids.map((id) => ({
    id,
    // Decode each token on its own; bytes that don't form a complete UTF-8
    // sequence degrade to the replacement character, matching tiktoken.
    text: enc.decode([id]),
  }));

  return {
    ids,
    segments,
    tokenCount: ids.length,
    // Use the spread to count Unicode code points, not UTF-16 units.
    charCount: [...text].length,
  };
}
