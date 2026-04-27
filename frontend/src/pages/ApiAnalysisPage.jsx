import { useState, useEffect, useCallback } from 'react';
import {
  Typography,
  Box,
  TextField,
  Button,
  Stack,
  CircularProgress,
  FormControl,
  Divider,
  Chip,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { apiRequest } from '../lib/api';
import { PageShell } from '../components/PageShell';
import { SectionCard } from '../components/SectionCard';
import { formFieldSx } from '../styles/formFieldSx';

const POLL_MS = 3000;
const POLL_MAX = 100;

export function ApiAnalysisPage() {
  const theme = useTheme();
  const fieldSx = (extra = {}) => ({ ...formFieldSx(theme), ...extra });

  const [schema, setSchema] = useState('');
  const [payload, setPayload] = useState('');
  const [requirements, setRequirements] = useState('');
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const [jobIdInput, setJobIdInput] = useState('');
  const [activeJobId, setActiveJobId] = useState(null);
  const [job, setJob] = useState(null);
  const [pollLoading, setPollLoading] = useState(false);
  const [pollError, setPollError] = useState(null);

  const fetchJob = useCallback(async () => {
    const data = await apiRequest(`/tools/api-analysis?jobId=${encodeURIComponent(activeJobId)}`);
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

  const submitAnalysis = async () => {
    setSubmitLoading(true);
    setSubmitError(null);
    setSubmitMessage('');
    try {
      const result = await apiRequest('/tools/api-analysis', {
        method: 'POST',
        body: {
          schema,
          payload,
          requirements,
        },
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

  const completedIssues = Array.isArray(job?.data?.issues) ? job.data.issues.filter(Boolean) : [];
  const completedRecommendations = Array.isArray(job?.data?.recommendations)
    ? job.data.recommendations.filter(Boolean)
    : [];

  return (
    <PageShell
      title="API analysis"
      subtitle="Submit an OpenAPI description, a sample payload, and internal requirements. After submission the app polls for results using the returned job ID. You can also paste an existing job ID to load a prior run."
    >
      <Stack spacing={3}>
        <SectionCard
          title="Submit analysis"
          description="All three fields are sent to the analysis service. Use clear, valid JSON for the example payload when your API expects JSON."
        >
          <Stack spacing={2}>
            <FormControl fullWidth>
              <TextField
                label="OpenAPI schema"
                placeholder="Paste the OpenAPI document (YAML or JSON)."
                value={schema}
                onChange={(e) => setSchema(e.target.value)}
                multiline
                rows={10}
                sx={fieldSx()}
              />
            </FormControl>
            <FormControl fullWidth>
              <TextField
                label="Example payload"
                placeholder="Paste a sample JSON payload as text."
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                multiline
                rows={6}
                sx={fieldSx()}
              />
            </FormControl>
            <FormControl fullWidth>
              <TextField
                label="Internal requirements"
                placeholder="Describe internal rules or constraints for this API."
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                multiline
                rows={6}
                sx={fieldSx()}
              />
            </FormControl>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <Button variant="contained" color="primary" onClick={submitAnalysis} disabled={submitLoading} size="large">
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
                    Analysis is still running; this page refreshes automatically.
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
                <>
                  <Box
                    sx={{
                      p: 2,
                      mb: 2,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.success.main, 0.08),
                      border: `1px solid ${alpha(theme.palette.success.main, 0.25)}`,
                    }}
                  >
                    <Typography variant="overline" color="success.light" sx={{ fontWeight: 700 }}>
                      Risk level
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>
                      {job.data?.riskLevel ?? '—'}
                    </Typography>
                  </Box>

                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                    Issues
                  </Typography>
                  {completedIssues.length === 0 && (
                    <Typography color="text.secondary">No issues found.</Typography>
                  )}
                  {completedIssues.map((issue, index) => (
                    <Box
                      key={index}
                      sx={{
                        p: 2,
                        mb: 1.5,
                        borderRadius: 2,
                        border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
                        bgcolor: alpha(theme.palette.common.white, 0.02),
                      }}
                    >
                      <Typography variant="caption" color="primary.light" sx={{ fontWeight: 600 }}>
                        [{issue?.severity ?? '—'}] {issue?.field ?? '—'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {issue?.type ?? '—'}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1, lineHeight: 1.65 }}>
                        {issue?.message ?? '—'}
                      </Typography>
                    </Box>
                  ))}

                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 3, mb: 1 }}>
                    Recommendations
                  </Typography>
                  <Box component="ul" sx={{ pl: 2.25, m: 0 }}>
                    {completedRecommendations.map((rec, index) => (
                      <Typography component="li" key={index} variant="body2" sx={{ mb: 1, lineHeight: 1.65 }}>
                        {rec?.recommendation ?? String(rec)}
                      </Typography>
                    ))}
                  </Box>
                </>
              )}
            </Box>
          )}
        </SectionCard>
      </Stack>
    </PageShell>
  );
}
