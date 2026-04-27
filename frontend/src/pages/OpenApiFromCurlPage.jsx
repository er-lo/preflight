import { useState, useMemo, useEffect, useCallback } from 'react';
import { TextField, Button, Stack, Alert, Divider, CircularProgress, Box, Typography, Chip } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { apiRequest } from '../lib/api';
import { PageShell } from '../components/PageShell';
import { SectionCard } from '../components/SectionCard';
import { formFieldSx } from '../styles/formFieldSx';

const POLL_MS = 3000;
const POLL_MAX = 100;

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

  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitError, setSubmitError] = useState(null);

  const [jobIdInput, setJobIdInput] = useState('');
  const [activeJobId, setActiveJobId] = useState(null);
  const [job, setJob] = useState(null);
  const [pollLoading, setPollLoading] = useState(false);
  const [pollError, setPollError] = useState(null);

  const previewJson = useMemo(() => {
    if (!lastPayload) return '';
    const maxCurl = 8000;
    const c = lastPayload.curl;
    const curl =
      c.length > maxCurl ? `${c.slice(0, maxCurl)}\n… [truncated for preview; full command sent to API]` : c;
    return JSON.stringify({ ...lastPayload, curl }, null, 2);
  }, [lastPayload]);

  const buildPayload = () => {
    setError(null);
    setInfo(null);
    setLastPayload(null);

    if (!curl.trim()) {
      setError('Paste a cURL command.');
      return null;
    }
    if (!looksLikeCurl(curl)) {
      setError('The command should look like a cURL invocation (usually starting with "curl").');
      return null;
    }

    const req = parseJsonField('Expected request body', requestBodyJson, true);
    if (!req.ok) {
      setError(req.error);
      return null;
    }
    const res = parseJsonField('Expected response body', responseBodyJson, true);
    if (!res.ok) {
      setError(res.error);
      return null;
    }

    const payload = {
      curl: curl.trim(),
      expectedRequestBody: req.value,
      expectedResponseBody: res.value,
      endpointSummary: endpointSummary.trim() || null,
    };

    setLastPayload(payload);
    return payload;
  };

  const fetchJob = useCallback(async () => {
    const data = await apiRequest(`/tools/openapi-from-curl?jobId=${encodeURIComponent(activeJobId)}`);
    return data;
  }, [activeJobId]);

  useEffect(() => {
    if (!activeJobId) return;

    let cancelled = false;
    let runs = 0;
    let intervalId;

    const tick = async () => {
      runs += 1;
      setPollLoading(true);
      setPollError(null);
      try {
        const data = await fetchJob();
        if (cancelled) return;
        setJob(data);
        const terminal =
          data?.status === 'FAILED' ||
          data?.status === 'COMPLETED' ||
          runs >= POLL_MAX;
        if (terminal) {
          clearInterval(intervalId);
          setPollLoading(false);
        }
      } catch (err) {
        if (cancelled) return;
        setPollError(err.message);
        clearInterval(intervalId);
        setPollLoading(false);
      }
    };

    tick();
    intervalId = setInterval(tick, POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [activeJobId, fetchJob]);

  const submitJob = async () => {
    setSubmitLoading(true);
    setSubmitError(null);
    setSubmitMessage('');
    setInfo(null);

    const payload = buildPayload();
    if (!payload) {
      setSubmitLoading(false);
      return;
    }

    try {
      const result = await apiRequest('/tools/openapi-from-curl', {
        method: 'POST',
        body: payload,
      });
      const jobId = result?.data?.jobId;
      setSubmitMessage(result?.message ?? 'Submitted.');
      if (jobId) {
        setJobIdInput(String(jobId));
        setJob(null);
        setActiveJobId(String(jobId));
      }
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleLoadJob = (e) => {
    e?.preventDefault?.();
    const trimmed = jobIdInput.trim();
    if (!trimmed) return;
    setJob(null);
    setActiveJobId(trimmed);
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={submitJob}
                size="large"
                disabled={submitLoading}
                sx={{ alignSelf: 'flex-start' }}
              >
                Submit
              </Button>
              {submitLoading ? <CircularProgress size={26} thickness={5} /> : null}
            </Box>
            {submitError && (
              <Typography variant="body2" color="error">
                {submitError}
              </Typography>
            )}
            {submitMessage && !submitError && (
              <Typography variant="body2" color="text.secondary">
                {submitMessage}
              </Typography>
            )}
          </Stack>
        </SectionCard>

        <Divider sx={{ borderColor: alpha(theme.palette.divider, 0.6) }} />

        <SectionCard title="Results" description="Poll by job ID, or load a job you submitted earlier from another session.">
          <Stack
            component="form"
            onSubmit={handleLoadJob}
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems={{ sm: 'flex-start' }}
          >
            <TextField
              label="Job ID"
              placeholder="Job ID from submission or history"
              value={jobIdInput}
              onChange={(e) => setJobIdInput(e.target.value)}
              fullWidth
              sx={fieldSx({ maxWidth: { sm: 440 } })}
            />
            <Button type="submit" variant="outlined" color="primary" disabled={pollLoading || !jobIdInput.trim()} size="large">
              Load / refresh
            </Button>
            {pollLoading && <CircularProgress size={26} thickness={5} sx={{ alignSelf: 'center' }} />}
          </Stack>

          {pollError && (
            <Typography variant="body2" color="error" sx={{ mt: 2 }}>
              {pollError}
            </Typography>
          )}

          {job && (
            <Box sx={{ mt: 3, textAlign: 'left' }}>
              {(job.status === 'PENDING' || job.status === 'IN_PROGRESS') && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Chip size="small" label={job.status} color="primary" variant="outlined" />
                  <Typography variant="body2" color="text.secondary">
                    Generation is still running; this page refreshes automatically.
                  </Typography>
                </Box>
              )}

              {job.status === 'FAILED' && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Chip size="small" label="Failed" color="error" variant="outlined" />
                  <Typography variant="body1" color="error">
                    {job.message ?? 'There was an issue processing this job.'}
                  </Typography>
                </Box>
              )}

              {job.status === 'COMPLETED' && (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
                    bgcolor: alpha(theme.palette.common.white, 0.02),
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                    OpenAPI ({job.data?.openApiFormat ?? '—'})
                  </Typography>
                  <TextField
                    value={job.data?.openApiSpec ?? ''}
                    multiline
                    minRows={10}
                    fullWidth
                    InputProps={{ readOnly: true }}
                    sx={fieldSx({
                      '& textarea': {
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                        fontSize: '0.8125rem',
                      },
                    })}
                  />
                  {job.data?.notes ? (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                      {job.data.notes}
                    </Typography>
                  ) : null}
                </Box>
              )}
            </Box>
          )}
        </SectionCard>

        {lastPayload && (
          <>
            <SectionCard
              title="Request body preview"
              description="This is the JSON body sent to POST /tools/openapi-from-curl."
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
