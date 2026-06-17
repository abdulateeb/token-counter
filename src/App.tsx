import { useEffect, useRef, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Flex,
  Heading,
  SegmentedControl,
  Separator,
  Text,
  TextArea,
} from "@radix-ui/themes";
import TokenScene from "./components/TokenScene";
import TokenizedText from "./components/TokenizedText";
import {
  getEncoder,
  tokenize,
  type EncodingName,
  type TokenizeResult,
} from "./lib/tokenizer";

// A single modern byte-pair encoding used across current large language models.
// Hidden from the UI; users just get a token count.
const ENCODING: EncodingName = "o200k_base";

const EXAMPLE_TEXT =
  "Tokenization is how a language model reads text. Words, punctuation, and even spaces are split into tokens, the atomic units a model actually sees. The word \"tokenization\" might become several tokens, while a common word like \"the\" is usually just one.\n\nTry editing this text to watch the token count change in real time.";

const EMPTY: TokenizeResult = { ids: [], segments: [], tokenCount: 0, charCount: 0 };

export default function App() {
  const [text, setText] = useState("");
  const [view, setView] = useState<"text" | "ids">("text");
  const [result, setResult] = useState<TokenizeResult>(EMPTY);
  const [ready, setReady] = useState(false);
  const [copied, setCopied] = useState<"text" | "ids" | null>(null);

  // Recompute tokens whenever the text changes. getEncoder caches the encoder,
  // so only the first run pays the (lazy) rank-loading cost.
  const debounceRef = useRef<number>();
  useEffect(() => {
    let cancelled = false;
    window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      const enc = await getEncoder(ENCODING);
      if (cancelled) return;
      setReady(true);
      setResult(text.length ? tokenize(enc, text) : EMPTY);
    }, 120);
    return () => {
      cancelled = true;
      window.clearTimeout(debounceRef.current);
    };
  }, [text]);

  const copy = async (kind: "text" | "ids") => {
    const payload = kind === "text" ? text : `[${result.ids.join(", ")}]`;
    if (!payload) return;
    await navigator.clipboard.writeText(payload);
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 1400);
  };

  return (
    <Box>
      <header className="hero">
        <TokenScene />
        <div className="hero-overlay" />
        <Container size="3" px="5" position="relative">
          <Flex direction="column" align="center" gap="4" py="9">
            <Badge color="blue" variant="soft" radius="full" size="2">
              Real Time
            </Badge>
            <Heading size="9" align="center" weight="bold" className="hero-title">
              Token Counter
            </Heading>
            <Text size="4" align="center" color="gray" className="hero-sub">
              See how large language models break your text into tokens.
            </Text>
          </Flex>
        </Container>
      </header>

      <Container size="3" px="5" pb="9">
        <Card size="4" className="panel">
          <Flex direction="column" gap="4">
            <TextArea
              size="3"
              placeholder="Type or paste text here…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              spellCheck={false}
              className="input-area"
            />

            <Flex gap="3" align="center" wrap="wrap">
              <Button
                variant="soft"
                color="green"
                radius="large"
                size="2"
                onClick={() => setText(EXAMPLE_TEXT)}
              >
                Show example
              </Button>
              <Button
                variant="soft"
                color="tomato"
                radius="large"
                size="2"
                onClick={() => setText("")}
                disabled={!text}
              >
                Clear
              </Button>
              <Button
                variant="soft"
                color="gray"
                radius="large"
                size="2"
                onClick={() => copy("text")}
                disabled={!text}
              >
                {copied === "text" ? "Copied" : "Copy text"}
              </Button>
              <Button
                variant="soft"
                color="blue"
                radius="large"
                size="2"
                onClick={() => copy("ids")}
                disabled={!result.ids.length}
              >
                {copied === "ids" ? "Copied" : "Copy token IDs"}
              </Button>
            </Flex>

            <Separator size="4" />

            <Flex gap="6" align="center" wrap="wrap">
              <Stat label="Tokens" value={result.tokenCount} />
              <Stat label="Characters" value={result.charCount} />
              <Stat
                label="Words"
                value={text.trim() ? text.trim().split(/\s+/).length : 0}
              />
            </Flex>

            <Flex justify="between" align="center" wrap="wrap" gap="3">
              <Text size="2" weight="medium" color="gray">
                Tokenized output
              </Text>
              <SegmentedControl.Root
                value={view}
                onValueChange={(v) => setView(v as "text" | "ids")}
                size="1"
                radius="large"
              >
                <SegmentedControl.Item value="text">Text</SegmentedControl.Item>
                <SegmentedControl.Item value="ids">
                  Token IDs
                </SegmentedControl.Item>
              </SegmentedControl.Root>
            </Flex>

            {result.segments.length ? (
              <TokenizedText segments={result.segments} view={view} />
            ) : (
              <Box className="token-output empty">
                <Text color="gray" size="2">
                  {ready
                    ? "Tokens will appear here as you type."
                    : "Loading tokenizer…"}
                </Text>
              </Box>
            )}
          </Flex>
        </Card>

        <Explainer />
      </Container>

      <footer className="footer">
        <Text size="1" color="gray" align="center" as="p">
          © {new Date().getFullYear()} Abdul Ateeb · MIT licensed
        </Text>
      </footer>
    </Box>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Flex direction="column" gap="1">
      <Text size="7" weight="bold" className="stat-value">
        {value.toLocaleString()}
      </Text>
      <Text size="1" color="gray" className="stat-label">
        {label}
      </Text>
    </Flex>
  );
}

function Explainer() {
  const items = [
    {
      title: "What is a token?",
      body: "Language models don't read characters or words directly. Text is broken into tokens: chunks that are often a word, part of a word, or a single character. A token averages roughly four characters of English.",
    },
    {
      title: "Why it matters",
      body: "Context limits and usage are measured in tokens, not words. Counting tokens before you send a prompt lets you estimate cost and stay inside a model's context window.",
    },
    {
      title: "Words aren't tokens",
      body: "A short, common word is usually one token, but longer or rarer words split into several. Spaces, punctuation, and capitalization all affect how text is segmented.",
    },
  ];

  return (
    <Box mt="7">
      <Heading size="6" mb="4" align="center">
        How tokenization works
      </Heading>
      <Flex gap="4" wrap="wrap" justify="center">
        {items.map((it) => (
          <Card key={it.title} size="3" className="explainer-card">
            <Heading size="3" mb="2">
              {it.title}
            </Heading>
            <Text size="2" color="gray">
              {it.body}
            </Text>
          </Card>
        ))}
      </Flex>
    </Box>
  );
}
