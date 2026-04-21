import { useState, useMemo } from 'react';
import { TextField, Button, Stack, Alert, Divider, List, ListItem, ListItemText } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { PageShell } from '../components/PageShell';
import { SectionCard } from '../components/SectionCard';
import { formFieldSx } from '../styles/formFieldSx';

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

  const previewJson = useMemo(() => {
    if (!lastPayload) return '';
    const maxSpecChars = 4000;
    const spec = lastPayload.openApiSpec;
    const truncated =
      spec.length > maxSpecChars ? `${spec.slice(0, maxSpecChars)}\n… [truncated for preview; full spec sent to API]` : spec;
    return JSON.stringify({ ...lastPayload, openApiSpec: truncated }, null, 2);
  }, [lastPayload]);

  const handlePrepare = () => {
    setError(null);
    setInfo(null);
    setLastPayload(null);

    const spec = parseOpenApi(openApiSpec);
    if (!spec.ok) {
      setError(spec.error);
      return;
    }
    if (!dataGoal.trim()) {
      setError('Describe what data you need or what you are trying to accomplish.');
      return;
    }

    const payload = {
      openApiFormat: spec.format,
      openApiSpec: openApiSpec.trim(),
      dataGoal: dataGoal.trim(),
      extraContext: extraContext.trim() || null,
    };

    setLastPayload(payload);
    setInfo(
      'No backend route is wired yet. Below is the JSON body your server can accept once you add an endpoint (for example POST /tools/openapi-endpoint-guide).',
    );
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
            <Button variant="contained" color="primary" onClick={handlePrepare} size="large" sx={{ alignSelf: 'flex-start' }}>
              Prepare request
            </Button>
          </Stack>
        </SectionCard>

        {lastPayload && (
          <>
            <Divider sx={{ borderColor: alpha(theme.palette.divider, 0.6) }} />
            <SectionCard
              title="Example of planned output"
              description="After backend integration, this section will show a concrete call sequence for your spec and goal. For now, here is the shape of guidance you can expect."
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

            <SectionCard title="Request body preview">
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
