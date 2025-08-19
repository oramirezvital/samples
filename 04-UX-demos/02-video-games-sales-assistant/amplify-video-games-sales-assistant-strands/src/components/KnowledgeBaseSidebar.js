import React, { useState } from 'react';
import { 
  Drawer, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  CircularProgress,
  IconButton,
  Divider
} from '@mui/material';
import { Send as SendIcon, Close as CloseIcon } from '@mui/icons-material';
import { BedrockAgentRuntimeClient, RetrieveAndGenerateCommand } from '@aws-sdk/client-bedrock-agent-runtime';
import { ACCESS_KEY_ID, SECRET_ACCESS_KEY, AWS_REGION } from '../env';
import ReactMarkdown from 'react-markdown';

const KnowledgeBaseSidebar = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleQuery = async () => {
    if (!query.trim()) return;
    
    const userMessage = { type: 'user', text: query, timestamp: new Date() };
    setConversation(prev => [...prev, userMessage]);
    
    setLoading(true);
    setQuery('');
    
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
            modelArn: 'arn:aws:bedrock:us-east-1:366978640738:inference-profile/us.anthropic.claude-3-7-sonnet-20250219-v1:0',
            generationConfiguration: {
              inferenceConfig: {
                textInferenceConfig: {
                  maxTokens: 4000,
                  temperature: 0.1,
                  topP: 0.9
                }
              },
              promptTemplate: {
                textPromptTemplate: "Please provide a comprehensive and detailed answer to the following question based on the search results from the knowledge base. Include relevant examples, explanations, and context where appropriate.\n\nQuestion: $query$\n\nSearch Results: $search_results$\n\nDetailed Answer:"
              }
            }
          } 
        }
      });

      const result = await client.send(command);
      const assistantMessage = { 
        type: 'assistant', 
        text: result.output?.text || 'No response received', 
        timestamp: new Date() 
      };
      setConversation(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Knowledge Base query error:', error);
      const errorMessage = { 
        type: 'error', 
        text: `Error: ${error.message}`, 
        timestamp: new Date() 
      };
      setConversation(prev => [...prev, errorMessage]);
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

  const clearConversation = () => {
    setConversation([]);
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: 450,
          p: 2,
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Claro Connect KB Chat</Typography>
        <Box>
          <Button size="small" onClick={clearConversation} sx={{ mr: 1, color: '#666' }}>
            Clear
          </Button>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Conversation Area */}
      <Box sx={{ 
        flexGrow: 1, 
        overflowY: 'auto', 
        mb: 2, 
        maxHeight: 'calc(100vh - 200px)',
        border: '1px solid #e0e0e0',
        borderRadius: 1,
        p: 1
      }}>
        {conversation.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
            Start a conversation with the knowledge base...
          </Typography>
        ) : (
          conversation.map((message, index) => (
            <Box key={index} sx={{ mb: 3, display: 'flex', justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start' }}>
              <Paper 
                elevation={3}
                sx={{ 
                  p: 3, 
                  maxWidth: '85%',
                  borderRadius: message.type === 'user' ? '20px 20px 5px 20px' : '20px 20px 20px 5px',
                  background: message.type === 'user' 
                    ? 'linear-gradient(135deg, #E30613 0%, #B8050F 100%)' 
                    : message.type === 'error' 
                    ? 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)' 
                    : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                  color: message.type === 'user' ? 'white' : 'inherit',
                  boxShadow: message.type === 'user' 
                    ? '0 8px 25px rgba(227, 6, 19, 0.3)' 
                    : '0 4px 15px rgba(0, 0, 0, 0.1)',
                  border: message.type === 'user' ? 'none' : '1px solid rgba(0, 0, 0, 0.05)',
                  position: 'relative',
                  '&::before': message.type === 'user' ? {
                    content: '""',
                    position: 'absolute',
                    bottom: 0,
                    right: -8,
                    width: 0,
                    height: 0,
                    borderLeft: '8px solid #B8050F',
                    borderTop: '8px solid transparent',
                    borderBottom: '8px solid transparent'
                  } : {
                    content: '""',
                    position: 'absolute',
                    bottom: 0,
                    left: -8,
                    width: 0,
                    height: 0,
                    borderRight: '8px solid #e9ecef',
                    borderTop: '8px solid transparent',
                    borderBottom: '8px solid transparent'
                  }
                }}
              >
                {message.type === 'assistant' ? (
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => (
                        <Typography variant="body1" sx={{ mb: 1, lineHeight: 1.6, fontSize: '0.95rem' }}>
                          {children}
                        </Typography>
                      ),
                      h1: ({ children }) => (
                        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                          {children}
                        </Typography>
                      ),
                      h2: ({ children }) => (
                        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                          {children}
                        </Typography>
                      ),
                      h3: ({ children }) => (
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                          {children}
                        </Typography>
                      ),
                      ul: ({ children }) => (
                        <Box component="ul" sx={{ pl: 2, mb: 1 }}>
                          {children}
                        </Box>
                      ),
                      ol: ({ children }) => (
                        <Box component="ol" sx={{ pl: 2, mb: 1 }}>
                          {children}
                        </Box>
                      ),
                      code: ({ children, inline }) => (
                        <Box
                          component={inline ? 'span' : 'pre'}
                          sx={{
                            bgcolor: 'rgba(0,0,0,0.1)',
                            p: inline ? 0.5 : 1,
                            borderRadius: 1,
                            fontFamily: 'monospace',
                            fontSize: '0.85rem',
                            display: inline ? 'inline' : 'block',
                            overflow: 'auto'
                          }}
                        >
                          {children}
                        </Box>
                      )
                    }}
                  >
                    {message.text}
                  </ReactMarkdown>
                ) : (
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.6,
                      fontSize: '0.95rem',
                      fontWeight: message.type === 'user' ? 500 : 400
                    }}
                  >
                    {message.text}
                  </Typography>
                )}
                <Typography 
                  variant="caption" 
                  sx={{ 
                    opacity: 0.8, 
                    display: 'block', 
                    mt: 1.5,
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: message.type === 'user' ? 'rgba(255,255,255,0.8)' : 'text.secondary'
                  }}
                >
                  {message.timestamp.toLocaleTimeString()}
                </Typography>
              </Paper>
            </Box>
          ))
        )}
        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
            <CircularProgress size={20} sx={{ mr: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Thinking...
            </Typography>
          </Box>
        )}
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Input Area */}
      <TextField
        fullWidth
        multiline
        rows={2}
        placeholder="Ask a question about the knowledge base..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyPress={handleKeyPress}
        sx={{ mb: 2 }}
        disabled={loading}
      />

      <Button
        fullWidth
        variant="contained"
        onClick={handleQuery}
        disabled={loading || !query.trim()}
        startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
        sx={{ bgcolor: '#E30613', '&:hover': { bgcolor: '#c5050f' } }}
      >
        {loading ? 'Sending...' : 'Send Message'}
      </Button>
    </Drawer>
  );
};

export default KnowledgeBaseSidebar;
