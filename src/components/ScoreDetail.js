import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Container, Typography, Box, Paper, Grid, 
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, CircularProgress,
  TextField, Button, Card, CardContent
} from '@mui/material';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import config from '../config';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

function ScoreDetail() {
  const { fileId } = useParams();
  const [scores, setScores] = useState([]);
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState(null);
  
  useEffect(() => {
  const fetchScores = async () => {
    try {
      setLoading(true);
      
      // First, get all items for this file_id
      const response = await axios.get(`\${config.apiUrl}/scores?file_id=\${fileId}`);
      
      // Parse the response if it's a string
      let data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
      
      if (Array.isArray(data)) {
        // Find the metadata item
        const metadataItem = data.find(item => item.question_id === 'metadata');
        if (metadataItem) {
          setMetadata(metadataItem);
        }
        
        // Filter out metadata to get just the scores
        const scoreItems = data.filter(item => item.question_id !== 'metadata');
        setScores(scoreItems);
        
        if (scoreItems.length > 0) {
          prepareChartData(scoreItems);
        }
      } else {
        console.error('Unexpected data format:', data);
        setError('Received unexpected data format from the server');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching scores:', err);
      setError('Failed to load scores. Please try again later.');
      setLoading(false);
    }
  };

  if (fileId) {
    fetchScores();
  }
}, [fileId]);

  const prepareChartData = (scores) => {
    // Calculate total scores and max possible
    const totalScore = scores.reduce((sum, score) => sum + score.adjusted_score, 0);
    const maxPossible = scores.reduce((sum, score) => sum + score.max_points, 0);
    const remaining = maxPossible - totalScore;
    
    setChartData({
      labels: ['Score', 'Remaining'],
      datasets: [
        {
          data: [totalScore, remaining],
          backgroundColor: [
            'rgba(54, 162, 235, 0.5)',
            'rgba(255, 99, 132, 0.5)',
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(255, 99, 132, 1)',
          ],
          borderWidth: 1,
        },
      ],
    });
  };

  const handleScoreChange = async (questionId, newScore) => {
    try {
      // Validate the score
      const score = parseInt(newScore, 10);
      const questionData = scores.find(s => s.question_id === questionId);
      
      if (isNaN(score) || score < 0 || score > questionData.max_points) {
        alert(`Score must be between 0 and \${questionData.max_points}`);
        return;
      }
      
      // Update the score in the backend
      await axios.post(`\${config.apiUrl}/update-score`, {
        file_id: fileId,
        question_id: questionId,
        adjusted_score: score
      });
      
      // Update local state
      const updatedScores = scores.map(s => 
        s.question_id === questionId ? { ...s, adjusted_score: score } : s
      );
      
      setScores(updatedScores);
      prepareChartData(updatedScores);
      
    } catch (err) {
      console.error('Error updating score:', err);
      alert('Failed to update score. Please try again.');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>Loading scores...</Typography>
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

  // Calculate totals
  const totalScore = scores.reduce((sum, score) => sum + score.adjusted_score, 0);
  const maxPossible = scores.reduce((sum, score) => sum + score.max_points, 0);
  const scorePercentage = maxPossible > 0 ? Math.round((totalScore / maxPossible) * 100) : 0;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Button 
          component={Link} 
          to="/" 
          startIcon={<ArrowBackIcon />}
          variant="outlined"
        >
          Back to Dashboard
        </Button>
      </Box>
      
      <Typography variant="h4" component="h1" gutterBottom>
        Score Details
      </Typography>
      
      {metadata && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {metadata.file_name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Processed on: {new Date(metadata.timestamp).toLocaleString()}
          </Typography>
        </Paper>
      )}
      
      <Grid container spacing={3}>
        {/* Score Summary */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Score Summary
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {chartData && (
                <Box sx={{ height: 200, width: 200, mb: 2 }}>
                  <Doughnut 
                    data={chartData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: true,
                    }} 
                  />
                </Box>
              )}
              
              <Typography variant="h3" component="div" sx={{ mt: 2 }}>
                {scorePercentage}%
              </Typography>
              
              <Typography variant="body1" color="text.secondary">
                {totalScore} / {maxPossible} points
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        {/* Scores Table */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Question Scores
            </Typography>
            
            <TableContainer>
              <Table size="medium">
                <TableHead>
                  <TableRow>
                    <TableCell>Question</TableCell>
                    <TableCell>Original Score</TableCell>
                    <TableCell>Adjusted Score</TableCell>
                    <TableCell>Max Points</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {scores.map((score) => (
                    <TableRow key={score.question_id}>
                      <TableCell>{score.question_text}</TableCell>
                      <TableCell>{score.original_score}</TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          variant="outlined"
                          size="small"
                          value={score.adjusted_score}
                          inputProps={{ 
                            min: 0, 
                            max: score.max_points,
                            style: { textAlign: 'center' }
                          }}
                          onChange={(e) => handleScoreChange(score.question_id, e.target.value)}
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                      <TableCell>{score.max_points}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
        
        {/* Justifications */}
        <Grid item xs={12}>
          <Typography component="h2" variant="h6" color="primary" gutterBottom sx={{ mt: 2 }}>
            Justifications
          </Typography>
          
          {scores.map((score) => (
            <Card key={score.question_id} sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {score.question_text}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Score: {score.adjusted_score} / {score.max_points}
                </Typography>
                <Typography variant="body1">
                  {score.justification}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Grid>
      </Grid>
    </Container>
  );
}

export default ScoreDetail;
