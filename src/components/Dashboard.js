import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Container, Typography, Box, Paper, Grid, 
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, CircularProgress
} from '@mui/material';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import config from '../config';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function Dashboard() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`\${config.apiUrl}/scores`);
        console.log('API Response:', response.data);
        
        // Parse the response if it's a string
        const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        setFiles(data);
        
        // Prepare chart data
        if (data && data.length > 0) {
          prepareChartData(data);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching files:', err);
        setError('Failed to load files. Please try again later.');
        setLoading(false);
      }
    };

    fetchFiles();
  }, []);

  const prepareChartData = (files) => {
    // This is a simple example - you might want to customize based on your data
    const labels = files.slice(0, 5).map(file => file.file_name.substring(0, 15) + '...');
    
    setChartData({
      labels,
      datasets: [
        {
          label: 'Files Processed',
          data: files.slice(0, 5).map(() => 1), // Just counting files
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
        }
      ],
    });
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>Loading files...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3, textAlign: 'center', color: 'error.main' }}>
          <Typography variant="h6">{error}</Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        CFM Scoring Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        {/* Summary Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Recent Files
            </Typography>
            {chartData && (
              <Box sx={{ height: 300 }}>
                <Bar 
                  data={chartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                  }} 
                />
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* Files Table */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Processed Files
            </Typography>
            <TableContainer>
              <Table size="medium">
                <TableHead>
                  <TableRow>
                    <TableCell>File Name</TableCell>
                    <TableCell>Date Processed</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {files.length > 0 ? (
                    files.map((file) => (
                      <TableRow key={file.file_id}>
                        <TableCell>{file.file_name}</TableCell>
                        <TableCell>
                          {new Date(file.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Link to={`/detail/\${file.file_id}`}>
                            View Scores
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        No files have been processed yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default Dashboard;
