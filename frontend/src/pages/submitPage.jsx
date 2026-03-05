import { useState } from 'react';
import { Typography, Box, FormControl, Button, Stack, CircularProgress, TextField } from '@mui/material';

export const SubmitPage = () => {
  const [schema, setSchema] = useState('');
  const [payload, setPayload] = useState([]);
  const [requirements, setRequirements] = useState(1);
  const [creationResult, setCreationResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const selectStyles = {
    color: 'secondary',
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: 'secondary',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: 'secondary',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: 'secondary',
    },
    '& .MuiSvgIcon-root': {
      color: 'secondary',
    },
  }

  const submitAnalysis = async () => {
    setIsLoading(true);
    try {
      const requestPayload = {
        schema: schema,
        payload: payload,
        requirements: requirements,
      };
      console.log('Sending payload:', JSON.stringify(requestPayload, null, 2));

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/analysis/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('result:', result);
      setCreationResult(result.message);
    } catch (error) {
      console.error('Error submitting analysis:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4">Analysis Submission</Typography>
      <Typography variant="body1" sx={{ mt: 2 }}>
        Enter the following fields to retrieve an analysis.
      </Typography>
      <Stack sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, mt: 4 }}>
        <FormControl>
          <TextField
            id="schema"
            label="OpenAPI Schema"
            placeholder='Enter the OpenAPI in this text field.'
            onChange={(e) => setSchema(e.target.value)}
            multiline
            rows={12}
            sx={{...selectStyles, width: '600px'}}
          />
        </FormControl>
        <FormControl>
          <TextField
            id="schema"
            label="Example Payload"
            placeholder='Enter the sample payload in this text field.'
            onChange={(e) => setPayload(e.target.value)}
            multiline
            rows={8}
            sx={{...selectStyles, width: '600px'}}
          />
        </FormControl>
        <FormControl>
          <TextField
            id="schema"
            label="Internal Requirements"
            placeholder='Enter the Internal Requirements in this text field.'
            onChange={(e) => setRequirements(e.target.value)}
            multiline
            rows={8}
            sx={{...selectStyles, width: '600px'}}
          />
        </FormControl>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button variant="contained" sx={{ backgroundColor: 'primary', color: 'secondary' }} onClick={submitAnalysis} disabled={isLoading}>
            Submit
          </Button>
          {isLoading ? <CircularProgress size={24} sx={{ color: 'secondary' }} /> : null}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 4 }}>
          <Typography variant="body1">{creationResult}</Typography>
        </Box>
      </Stack>
    </Box>
  )
}