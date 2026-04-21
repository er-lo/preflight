import { useState, useMemo } from 'react';
import { TextField, Button, Stack, Alert, Divider } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { PageShell } from '../components/PageShell';
import { SectionCard } from '../components/SectionCard';
import { formFieldSx } from '../styles/formFieldSx';

function parseJsonField(label, raw, optional) {
  const t = raw.trim();
  if (!t) {
    if (optional) return { ok: true, value: null };
    return { ok: false, error: `${label} is required.` };
  }
  try {
    return { ok: true, value: JSON.parse(t) };
  } catch {
    return { ok: false, error: `${label} must be valid JSON.` };
  }
}

function looksLikeCurl(text) {
  const t = text.trim().toLowerCase();
  return t.startsWith('curl') || /\bcurl\b/.test(t);
}

export function OpenApiFromCurlPage() {
  const theme = useTheme();
  const fieldSx = (extra = {}) => ({ ...formFieldSx(theme), ...extra });

  const [curl, setCurl] = useState('');
  const [requestBodyJson, setRequestBodyJson] = useState('');
  const [responseBodyJson, setResponseBodyJson] = useState('');
  const [endpointSummary, setEndpointSummary] = useState('');

  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [lastPayload, setLastPayload] = useState(null);

  const previewJson = useMemo(() => {
    if (!lastPayload) return '';
    const maxCurl = 8000;
    const c = lastPayload.curl;
    const curl =
      c.length > maxCurl ? `${c.slice(0, maxCurl)}\n… [truncated for preview; full command sent to API]` : c;
    return JSON.stringify({ ...lastPayload, curl }, null, 2);
  }, [lastPayload]);

  const handlePrepare = () => {
    setError(null);
    setInfo(null);
    setLastPayload(null);

    if (!curl.trim()) {
      setError('Paste a cURL command.');
      return;
    }
    if (!looksLikeCurl(curl)) {
      setError('The command should look like a cURL invocation (usually starting with "curl").');
      return;
    }

    const req = parseJsonField('Expected request body', requestBodyJson, true);
    if (!req.ok) {
      setError(req.error);
      return;
    }
    const res = parseJsonField('Expected response body', responseBodyJson, true);
    if (!res.ok) {
      setError(res.error);
      return;
    }

    const payload = {
      curl: curl.trim(),
      expectedRequestBody: req.value,
      expectedResponseBody: res.value,
      endpointSummary: endpointSummary.trim() || null,
    };

    setLastPayload(payload);
    setInfo(
      'No backend route is wired yet. Below is the JSON body your server can accept once you add an endpoint (for example POST /tools/openapi-from-curl).',
    );
  };

  return (
    <PageShell
      title="OpenAPI from cURL"
      subtitle="Turn something you already run from the terminal into structured API documentation. Provide the cURL command, then optionally paste representative request and response JSON so the generator can infer paths, methods, and schemas."
    >
      <Stack spacing={3}>
        {error && <Alert severity="error">{error}</Alert>}
        {info && <Alert severity="info">{info}</Alert>}

        <SectionCard
          title="Input"
          description="Optional JSON fields are validated when non-empty. Leave them blank if the command line already carries everything."
        >
          <Stack spacing={2}>
            <TextField
              label="cURL command"
              placeholder={'curl -X POST "https://api.example.com/v1/items" -H "Content-Type: application/json" -d \'{"name":"a"}\''}
              value={curl}
              onChange={(e) => setCurl(e.target.value)}
              multiline
              rows={6}
              fullWidth
              required
              sx={fieldSx()}
            />
            <TextField
              label="Expected request body (JSON)"
              placeholder='{"key": "value"}'
              value={requestBodyJson}
              onChange={(e) => setRequestBodyJson(e.target.value)}
              multiline
              rows={6}
              fullWidth
              helperText="Optional if your cURL already includes -d or --data-raw with JSON."
              sx={fieldSx()}
            />
            <TextField
              label="Expected response body (JSON)"
              placeholder='{"id": "…", "status": "ok"}'
              value={responseBodyJson}
              onChange={(e) => setResponseBodyJson(e.target.value)}
              multiline
              rows={8}
              fullWidth
              helperText="A sample successful response helps infer response schema and status semantics."
              sx={fieldSx()}
            />
            <TextField
              label="Notes (optional)"
              placeholder="Auth scheme, idempotency, pagination, or anything else the generator should know."
              value={endpointSummary}
              onChange={(e) => setEndpointSummary(e.target.value)}
              multiline
              rows={3}
              fullWidth
              sx={fieldSx()}
            />
            <Button variant="contained" color="primary" onClick={handlePrepare} size="large" sx={{ alignSelf: 'flex-start' }}>
              Prepare request
            </Button>
          </Stack>
        </SectionCard>

        {lastPayload && (
          <>
            <Divider sx={{ borderColor: alpha(theme.palette.divider, 0.6) }} />
            <SectionCard
              title="Request body preview"
              description="Generated OpenAPI YAML or JSON will appear here after you connect a backend route and replace this preview."
            >
              <TextField
                value={previewJson}
                multiline
                rows={14}
                fullWidth
                InputProps={{ readOnly: true }}
                sx={fieldSx({
                  '& textarea': { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: '0.8125rem' },
                })}
              />
            </SectionCard>
          </>
        )}
      </Stack>
    </PageShell>
  );
}
