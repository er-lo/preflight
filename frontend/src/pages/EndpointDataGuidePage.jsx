import { useState, useMemo, useEffect, useCallback } from 'react';
import { TextField, Button, Stack, Alert, Divider, List, ListItem, ListItemText, CircularProgress, Box, Typography, Chip } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { apiRequest } from '../lib/api';
import { PageShell } from '../components/PageShell';
import { SectionCard } from '../components/SectionCard';
import { formFieldSx } from '../styles/formFieldSx';

const POLL_MS = 3000;
const POLL_MAX = 100;

function parseOpenApi(raw) {
  const t = raw.trim();
  if (!t) return { ok: false, error: 'Paste an OpenAPI document (JSON or YAML).' };
  if (t.startsWith('{')) {
    try {
      JSON.parse(t);
      return { ok: true, format: 'json' };
    } catch {
      return { ok: false, error: 'OpenAPI JSON is not valid JSON.' };
    }
  }
  if (/^\s*openapi:\s/m.test(t)) {
    return { ok: true, format: 'yaml' };
  }
  try {
    JSON.parse(t);
    return { ok: true, format: 'json' };
  } catch {
    /* fall through */
  }
  return {
    ok: false,
    error:
      'Could not validate as JSON or detect YAML (look for a line starting with openapi:). Fix the document or add a leading { for JSON.',
  };
}

export function EndpointDataGuidePage() {
  const theme = useTheme();
  const fieldSx = (extra = {}) => ({ ...formFieldSx(theme), ...extra });

  const [openApiSpec, setOpenApiSpec] = useState('');
  const [dataGoal, setDataGoal] = useState('');
  const [extraContext, setExtraContext] = useState('');

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
    const maxSpecChars = 4000;
    const spec = lastPayload.openApiSpec;
    const truncated =
      spec.length > maxSpecChars ? `${spec.slice(0, maxSpecChars)}\n… [truncated for preview; full spec sent to API]` : spec;
    return JSON.stringify({ ...lastPayload, openApiSpec: truncated }, null, 2);
  }, [lastPayload]);

  const buildPayload = () => {
    setError(null);
    setInfo(null);
    setLastPayload(null);

    const spec = parseOpenApi(openApiSpec);
    if (!spec.ok) {
      setError(spec.error);
      return null;
    }
    if (!dataGoal.trim()) {
      setError('Describe what data you need or what you are trying to accomplish.');
      return null;
    }

    const payload = {
      openApiFormat: spec.format,
      openApiSpec: openApiSpec.trim(),
      dataGoal: dataGoal.trim(),
      extraContext: extraContext.trim() || null,
    };

    setLastPayload(payload);
    return payload;
  };

  const fetchJob = useCallback(async () => {
    const data = await apiRequest(`/tools/openapi-endpoint-guide?jobId=${encodeURIComponent(activeJobId)}`);
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
      const result = await apiRequest('/tools/openapi-endpoint-guide', {
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
      title="Endpoint data guide"
      subtitle="Given a full OpenAPI description and a plain-language goal, this tool will suggest an ordered call plan: which operations to invoke, what each response contributes, and common pitfalls (pagination, auth, dependent IDs)."
    >
      <Stack spacing={3}>
        {error && <Alert severity="error">{error}</Alert>}
        {info && <Alert severity="info">{info}</Alert>}

        <SectionCard title="Input" description="We accept JSON or YAML OpenAPI. Your goal should read like a product question, not a path name.">
          <Stack spacing={2}>
            <TextField
              label="OpenAPI document"
              placeholder='Paste JSON (starts with "{") or YAML (starts with "openapi:").'
              value={openApiSpec}
              onChange={(e) => setOpenApiSpec(e.target.value)}
              multiline
              rows={14}
              fullWidth
              required
              sx={fieldSx()}
            />
            <TextField
              label="What data do you need?"
              placeholder='Example: "I need all active customers created last week with their latest invoice totals."'
              value={dataGoal}
              onChange={(e) => setDataGoal(e.target.value)}
              multiline
              rows={4}
              fullWidth
              required
              sx={fieldSx()}
            />
            <TextField
              label="Additional context (optional)"
              placeholder="OAuth2 client credentials, staging vs production base URL, rate limits, or IDs you already have."
              value={extraContext}
              onChange={(e) => setExtraContext(e.target.value)}
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
                    Guide generation is still running; this page refreshes automatically.
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
                    Guide (JSON)
                  </Typography>
                  <TextField
                    value={job.data?.guide ? JSON.stringify(job.data.guide, null, 2) : ''}
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
                </Box>
              )}
            </Box>
          )}
        </SectionCard>

        {lastPayload && (
          <>
            <SectionCard
              title="Example of planned output"
              description="After you connect a worker that performs inference, this section can show a concrete call sequence. For now, here is the shape of guidance you can expect."
            >
              <List
                dense
                sx={{
                  borderRadius: 2,
                  py: 0,
                  bgcolor: alpha(theme.palette.common.white, 0.03),
                  border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                }}
              >
                <ListItem sx={{ alignItems: 'flex-start' }}>
                  <ListItemText
                    primaryTypographyProps={{ variant: 'subtitle2', fontWeight: 600 }}
                    secondaryTypographyProps={{ variant: 'body2', sx: { mt: 0.5, lineHeight: 1.65 } }}
                    primary="1. Entry operations"
                    secondary="Identify list or search endpoints that can narrow the problem domain."
                  />
                </ListItem>
                <ListItem sx={{ alignItems: 'flex-start' }}>
                  <ListItemText
                    primaryTypographyProps={{ variant: 'subtitle2', fontWeight: 600 }}
                    secondaryTypographyProps={{ variant: 'body2', sx: { mt: 0.5, lineHeight: 1.65 } }}
                    primary="2. Dependency chain"
                    secondary="Resolve foreign keys and follow-up calls (e.g. list → detail → sub-resource)."
                  />
                </ListItem>
                <ListItem sx={{ alignItems: 'flex-start' }}>
                  <ListItemText
                    primaryTypographyProps={{ variant: 'subtitle2', fontWeight: 600 }}
                    secondaryTypographyProps={{ variant: 'body2', sx: { mt: 0.5, lineHeight: 1.65 } }}
                    primary="3. Gotchas"
                    secondary="Pagination style, required headers, scopes, and idempotent retries called out per step."
                  />
                </ListItem>
              </List>
            </SectionCard>

            <SectionCard
              title="Request body preview"
              description="This is the JSON body sent to POST /tools/openapi-endpoint-guide."
            >
              <TextField
                value={previewJson}
                multiline
                rows={12}
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
