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
      console.log('Fetching from:', `\${config.apiUrl}/scores`);
      
      const response = await axios.get(`\${config.apiUrl}/scores`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      console.log('Response data type:', typeof response.data);
      
      // Check if response.data is already an object
      if (typeof response.data === 'object' && !Array.isArray(response.data)) {
        console.log('Response is an object:', response.data);
        if (response.data.Items) {
          setFiles(response.data.Items);
          if (response.data.Items.length > 0) {
            prepareChartData(response.data.Items);
          }
        } else {
          console.log('No Items property in response');
          setFiles([]);
        }
      }
      // Check if response.data is an array
      else if (Array.isArray(response.data)) {
        console.log('Response is an array with', response.data.length, 'items');
        setFiles(response.data);
        if (response.data.length > 0) {
          prepareChartData(response.data);
        }
      }
      // Check if response.data is a string that needs parsing
      else if (typeof response.data === 'string') {
        console.log('Response is a string, attempting to parse');
        try {
          const parsedData = JSON.parse(response.data);
          console.log('Parsed data:', parsedData);
          
          if (Array.isArray(parsedData)) {
            setFiles(parsedData);
            if (parsedData.length > 0) {
              prepareChartData(parsedData);
            }
          } else if (parsedData.Items) {
            setFiles(parsedData.Items);
            if (parsedData.Items.length > 0) {
              prepareChartData(parsedData.Items);
            }
          } else {
            console.log('Unexpected parsed data format');
            setFiles([]);
          }
        } catch (parseError) {
          console.error('Error parsing response as JSON:', parseError);
          console.error('First 100 characters of response:', response.data.substring(0, 100));
          setError('Error parsing API response: ' + parseError.message);
        }
      } else {
        console.log('Unexpected response format');
        setFiles([]);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching files:', err);
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response data:', err.response.data);
        console.error('Error response status:', err.response.status);
        console.error('Error response headers:', err.response.headers);
        
        // If the response contains HTML, log the first part to help diagnose
        if (typeof err.response.data === 'string' && err.response.data.includes('<!doctype')) {
          console.error('HTML response detected. First 200 chars:', err.response.data.substring(0, 200));
          setError('Received HTML instead of JSON. The API might be returning an error page.');
        } else {
          setError('API error: ' + err.response.status + ' - ' + (err.response.data.message || 'Unknown error'));
        }
      } else if (err.request) {
        // The request was made but no response was received
        console.error('No response received:', err.request);
        setError('No response from API server');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Request setup error:', err.message);
        setError('Error setting up request: ' + err.message);
      }
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
