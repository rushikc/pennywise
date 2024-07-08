
import CircularProgress from '@mui/material/CircularProgress/CircularProgress';
import * as React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Loading() {
    

    return (
        <div className="d-flex-center pt-10">
            <CircularProgress style={{ marginTop: '1rem' }} />
        </div>
    );
}
