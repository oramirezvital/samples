import React, { useState } from 'react';
import { 
  Drawer, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  CircularProgress,
  IconButton
} from '@mui/material';
import { Send as SendIcon, Close as CloseIcon } from '@mui/icons-material';
import { BedrockAgentRuntimeClient, RetrieveAndGenerateCommand } from '@aws-sdk/client-bedrock-agent-runtime';
import { ACCESS_KEY_ID, SECRET_ACCESS_KEY, AWS_REGION } from '../env';

const KnowledgeBaseSidebar = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleQuery = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const client = new BedrockAgentRuntimeClient({
        region: AWS_REGION,
        credentials: {
          accessKeyId: ACCESS_KEY_ID,
          secretAccessKey: SECRET_ACCESS_KEY
        }
      });

      const command = new RetrieveAndGenerateCommand({
        input: {
          text: query
        },
        retrieveAndGenerateConfiguration: {
          type: 'KNOWLEDGE_BASE',
          knowledgeBaseConfiguration: {
            knowledgeBaseId: 'GTIT7VEQDS',
            modelArn: 'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0'
          }
        }
      });

      const result = await client.send(command);
      setResponse(result.output?.text || 'No response received');
    } catch (error) {
      console.error('Knowledge Base query error:', error);
      setResponse(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleQuery();
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: 400,
          p: 2
        }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Knowledge Base</Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      <TextField
        fullWidth
        multiline
        rows={3}
        placeholder="Ask a question about the knowledge base..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyPress={handleKeyPress}
        sx={{ mb: 2 }}
      />

      <Button
        fullWidth
        variant="contained"
        onClick={handleQuery}
        disabled={loading || !query.trim()}
        startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
        sx={{ mb: 2, bgcolor: '#E30613', '&:hover': { bgcolor: '#c5050f' } }}
      >
        {loading ? 'Querying...' : 'Query Knowledge Base'}
      </Button>

      {response && (
        <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {response}
          </Typography>
        </Paper>
      )}
    </Drawer>
  );
};

export default KnowledgeBaseSidebar;
