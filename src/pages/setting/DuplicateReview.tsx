/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import React, {useCallback, useEffect, useState} from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  IconButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import {useNavigate} from 'react-router-dom';
import {ExpenseAPI} from '../../api/ExpenseAPI';
import {DuplicateCandidatePair} from '../../Types';
import {formatVendorName, sortByKey} from '../../utility/utility';
import {setExpenseList} from '../../store/expenseActions';
import {createTimedAlert} from '../../store/alertActions';
import './setting-views/settingViews.scss';

const formatExpenseDate = (dateMs: number): string =>
  new Date(dateMs).toLocaleString('en-IN', {timeZone: 'Asia/Kolkata'});

const ExpenseCard: React.FC<{label: string; expense: DuplicateCandidatePair['keep']}> = ({
  label,
  expense,
}) => (
  <Paper elevation={0} className="reload-section-paper" sx={{flex: 1, p: 2}}>
    <Typography variant="overline" color="text.secondary">{label}</Typography>
    <Typography variant="h6" sx={{wordBreak: 'break-word'}}>
      {formatVendorName(expense.vendor)[0] || expense.vendor}
    </Typography>
    <Typography variant="body2" color="text.secondary">
      ₹{expense.cost.toLocaleString('en-IN')} · {expense.type}
    </Typography>
    <Typography variant="caption" display="block" sx={{mt: 1}}>
      {formatExpenseDate(expense.date)}
    </Typography>
    {expense.tag && (
      <Chip label={expense.tag} size="small" sx={{mt: 1}}/>
    )}
  </Paper>
);

/**
 * Review ambiguous duplicate pairs flagged by the nightly dedupe job.
 */
const DuplicateReview: React.FC = () => {
  const navigate = useNavigate();
  const [pairs, setPairs] = useState<DuplicateCandidatePair[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const loadPairs = useCallback(async () => {
    setLoading(true);
    try {
      await ExpenseAPI.getExpenseList();
      const candidates = await ExpenseAPI.getDuplicateCandidates();
      setPairs(candidates);
    } catch (error) {
      console.error('Failed to load duplicate candidates:', error);
      createTimedAlert({type: 'error', message: 'Failed to load duplicate review list'});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPairs();
  }, [loadPairs]);

  const refreshExpenseList = async () => {
    const expenses = await ExpenseAPI.getExpenseList();
    setExpenseList(sortByKey(expenses, 'date'));
  };

  const handleResolve = async (
    pair: DuplicateCandidatePair,
    action: 'confirmed' | 'rejected',
  ) => {
    setResolvingId(pair.drop.id);
    try {
      await ExpenseAPI.resolveDuplicate(pair.keep, pair.drop, action);
      await refreshExpenseList();
      setPairs((prev) => prev.filter((p) => p.drop.id !== pair.drop.id));
      createTimedAlert({
        type: 'success',
        message: action === 'confirmed' ? 'Duplicate confirmed and hidden' : 'Duplicate rejected',
      });
    } catch (error) {
      console.error('Failed to resolve duplicate:', error);
      createTimedAlert({type: 'error', message: 'Failed to update duplicate status'});
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <Container className="config-container" maxWidth="sm">
      <Box className="config-header">
        <IconButton
          onClick={() => navigate('/profile')}
          className="back-button"
          aria-label="Back to settings"
        >
          <ArrowBackIcon/>
        </IconButton>
        <Typography variant="h5" fontWeight="bold">
          Duplicate Review
        </Typography>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{mb: 2}}>
        These pairs need your decision. Confirm to hide the duplicate, or reject to keep both.
      </Typography>

      {loading && (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress size={32}/>
        </Box>
      )}

      {!loading && pairs.length === 0 && (
        <Alert severity="success">No pending duplicates to review.</Alert>
      )}

      {!loading && pairs.map((pair) => (
        <Paper key={pair.drop.id} elevation={1} sx={{p: 2, mb: 2}}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{mb: 2}}>
            <Chip label={pair.rule} size="small" variant="outlined"/>
            <Typography variant="body2" color="text.secondary">
              ₹{pair.drop.cost.toLocaleString('en-IN')}
            </Typography>
          </Stack>

          <Stack direction={{xs: 'column', sm: 'row'}} spacing={2} sx={{mb: 2}}>
            <ExpenseCard label="Keep" expense={pair.keep}/>
            <ExpenseCard label="Possible duplicate" expense={pair.drop}/>
          </Stack>

          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<CheckCircleOutlineIcon/>}
              disabled={resolvingId === pair.drop.id}
              onClick={() => void handleResolve(pair, 'confirmed')}
            >
              Confirm duplicate
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<HighlightOffIcon/>}
              disabled={resolvingId === pair.drop.id}
              onClick={() => void handleResolve(pair, 'rejected')}
            >
              Not a duplicate
            </Button>
          </Stack>
        </Paper>
      ))}
    </Container>
  );
};

export default DuplicateReview;
