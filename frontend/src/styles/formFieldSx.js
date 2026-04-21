import { alpha } from '@mui/material/styles';

/** Shared TextField / input outline styling for tool pages */
export function formFieldSx(theme) {
  return {
    '& .MuiOutlinedInput-root': {
      borderRadius: 1,
      bgcolor: alpha(theme.palette.common.white, 0.03),
      transition: theme.transitions.create(['border-color', 'box-shadow', 'background-color'], {
        duration: 180,
      }),
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: alpha(theme.palette.divider, 1),
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: alpha(theme.palette.primary.main, 0.45),
    },
    '& .MuiOutlinedInput-root.Mui-focused': {
      bgcolor: alpha(theme.palette.primary.main, 0.06),
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: theme.palette.primary.main,
        borderWidth: 1,
      },
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: theme.palette.primary.light,
    },
  };
}
