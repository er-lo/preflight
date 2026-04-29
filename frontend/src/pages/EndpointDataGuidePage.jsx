import { useState, useEffect, useCallback } from 'react';
import { TextField, Button, Stack, Alert, Divider, CircularProgress, Box, Typography, Chip } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { apiRequest } from '../lib/api';
import { PageShell } from '../components/PageShell';
import { SectionCard } from '../components/SectionCard';
import { formFieldSx } from '../styles/formFieldSx';

const POLL_MS = 3000;
const POLL_MAX = 5;

function parseOpenApi(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: 'Paste an OpenAPI document (JSON or YAML).' };
  if (trimmed.startsWith('{')) {
    try {
      JSON.parse(trimmed);
      return { ok: true, format: 'json' };
    } catch {
      return { ok: false, error: 'Invalid JSON.' };
    }
  }
  if (/^\s*openapi:\s/m.test(trimmed)) {
    return { ok: true, format: 'yaml' };
  }

  return { ok: false, error: 'Could not validate as JSON or YAML.' };
}

function normalizeEndpointGuideResult(result) {
  if (result == null) return { summary: '', steps: [] };

  let parsedObject = result;
  if (typeof parsedObject === 'string') {
    try {
      const trimmed = parsedObject.trim();
      parsedObject = JSON.parse(trimmed);
    } catch {
      return { summary: '', steps: [] };
    }
  }

  const inner = parsedObject.endpointGuide ?? parsedObject;
  const summary = typeof inner.summary === 'string' ? inner.summary : '';
  const steps = Array.isArray(inner.steps) ? inner.steps.filter(Boolean) : [];
  return { summary, steps };
}

export function EndpointDataGuidePage() {
  const theme = useTheme();
  const fieldSx = (extra = {}) => ({ ...formFieldSx(theme), ...extra });

  const [openApiSpec, setOpenApiSpec] = useState('');
  const [dataGoal, setDataGoal] = useState('');
  const [extraContext, setExtraContext] = useState('');

  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);

  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitError, setSubmitError] = useState(null);

  const [jobIdInput, setJobIdInput] = useState('');
  const [activeJobId, setActiveJobId] = useState(null);
  const [job, setJob] = useState(null);
  const [pollLoading, setPollLoading] = useState(false);
  const [pollError, setPollError] = useState(null);

  const buildPayload = () => {
    setError(null);
    setInfo(null);

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
      apiDoc: openApiSpec.trim(),
      dataGoal: dataGoal.trim(),
      extraContext: extraContext.trim() || null,
    };

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
      subtitle="Given a full OpenAPI description and a plain-language goal, this tool will suggest an ordered call plan: which operations to invoke and what each response contributes."
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
                  {(() => {
                    const { summary, steps } = normalizeEndpointGuideResult(job.data?.result);
                    return (
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                            Summary
                          </Typography>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }} color="text.secondary">
                            {summary?.trim() ? summary : '—'}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                            Steps
                          </Typography>
                          {steps.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">
                              —
                            </Typography>
                          ) : (
                            <Stack spacing={1}>
                              {steps.map((s, idx) => {
                                const order = s?.order ?? idx + 1;
                                const title = typeof s?.title === 'string' ? s.title : '';
                                const description = typeof s?.description === 'string' ? s.description : '';
                                const purpose = typeof s?.purpose === 'string' ? s.purpose : '';
                                const exampleRequest = typeof s?.exampleRequest === 'string' ? s.exampleRequest : '';
                                return (
                                  <Box key={idx} sx={{ pl: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                      {order}. {title}
                                    </Typography>
                                    {description?.trim() ? (
                                      <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                                        {description}
                                      </Typography>
                                    ) : null}
                                    {purpose?.trim() ? (
                                      <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                                        {purpose}
                                      </Typography>
                                    ) : null}
                                    {exampleRequest?.trim() ? (
                                      <>
                                      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                                      EXAMPLE REQUEST:
                                      </Typography>
                                      <Box
                                        component="pre"
                                        sx={{
                                          m: 0,
                                          mt: 0.5,
                                          borderRadius: 1,
                                          border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                                          bgcolor: alpha(theme.palette.common.white, 0.08),
                                          p: 1,
                                          fontFamily:
                                            'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                                          fontSize: 14,
                                          lineHeight: 1.45,
                                          color: 'text.secondary',
                                          whiteSpace: 'pre-wrap',
                                          wordBreak: 'break-word',
                                          maxHeight: 360,
                                          overflow: 'auto',
                                        }}
                                      >
                                        {exampleRequest}
                                      </Box>
                                      </>
                                    ) : null}
                                  </Box>
                                );
                              })}
                            </Stack>
                          )}
                        </Box>
                      </Stack>
                    );
                  })()}
                </Box>
              )}
            </Box>
          )}
        </SectionCard>
      </Stack>
    </PageShell>
  );
}
