import { useState, useEffect } from 'react';
import { Typography, Box, TextField, Button, Stack, CircularProgress } from '@mui/material';

export const ResultPage = () => {
  const [jobIdInput, setJobIdInput] = useState('');
  const [jobId, setJobId] = useState(null);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Polling effect when jobId changes
  useEffect(() => {
    if (!jobId) return;
    setLoading(true);
    setError(null);

    let interval;
    let runCount = 0;
    const MAX_RUNS = 3;

    const fetchJob = async () => {
      runCount++;

      try {
        console.log('jobid: ', jobIdInput);
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/analysis?jobId=${jobIdInput}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();
        console.log('Data: ', data);
        setJob(data);

        if (data?.status === 'FAILED' || data?.status === 'COMPLETED' || runCount >= MAX_RUNS) {
          clearInterval(interval);
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        setError(err.message);
        clearInterval(interval);
        setLoading(false);
      }
    };

    fetchJob();
    interval = setInterval(fetchJob, 3000);

    return () => clearInterval(interval);
  }, [jobId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (jobIdInput.trim() === '') return;
    setJobId(jobIdInput.trim());
    setJob(null); // reset previous job
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4">Retrieve Analysis Result</Typography>
      <Typography variant="body1" sx={{ mt: 2 }}>
        Enter a Job ID to fetch the analysis result.
      </Typography>

      <Stack sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, mt: 4 }}>
        <TextField
          label="Job ID"
          placeholder="Enter your Job ID here"
          value={jobIdInput}
          onChange={(e) => setJobIdInput(e.target.value)}
          sx={{ width: '400px' }}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            variant="contained"
            sx={{ backgroundColor: 'primary', color: 'secondary' }}
            onClick={handleSubmit}
            disabled={loading}
          >
            Fetch Result
          </Button>
          {loading && <CircularProgress size={24} sx={{ color: 'secondary' }} />}
        </Box>

        {error && (
          <Typography variant="body1" sx={{ color: 'red', mt: 2 }}>
            {error}
          </Typography>
        )}

        {!loading && !job && !error && (
          <Typography variant="body1" sx={{ mt: 2 }}>
            Enter a Job ID to fetch results.
          </Typography>
        )}

        {job && (
          <Box sx={{ width: '600px', mt: 4 }}>
            {(job.status === "PENDING" || job.status === "IN_PROGRESS") && (
              <Typography variant="body1">Status: {job.status} — Analysis retrieval is still being processed.</Typography>
            )}

            {job.status === "FAILED" && (
              <Typography variant="body1">Status: {job.status} — There was an issue processing this job. Please attempt to submit again.</Typography>
            )}

            {job.status === 'COMPLETED' && (
              <>
                <Box sx={{ p: 2, mb: 3 }}>
                  <Typography variant="h6">Risk: {job.data?.riskLevel}</Typography>
                </Box>

                <Typography variant="h6">Issues</Typography>
                {job.data?.issues?.length === 0 && <Typography>No issues found.</Typography>}
                {job.data?.issues?.map((issue, index) => (
                  <Box key={index} sx={{ p: 1.5, mb: 1 }}>
                    <Typography variant="subtitle2">
                      [{issue.severity}] {issue.field}
                    </Typography>
                    <Typography variant="subtitle2">{issue.type}</Typography>
                    <Typography variant="body2">{issue.message}</Typography>
                  </Box>
                ))}

                <Typography variant="h6" sx={{ mt: 2 }}>Recommendations</Typography>
                <ul>
                  {job.data?.recommendations?.map((rec, index) => (
                    <li key={index}>{rec.recommendation}</li>
                  ))}
                </ul>
              </>
            )}
          </Box>
        )}
      </Stack>
    </Box>
  );
};