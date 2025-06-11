import React, { useState } from 'react';
import apiClient from '../api/axiosConfig';
import { Paper, Typography, Button, Box, TextField, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import PostIt from './PostIt';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

interface PostItData {
  id: number;
  title: string;
  description: string;
  owner: string;
  color: string;
  position: number;
}

interface ColumnProps {
  data: {
    id: number;
    title: string;
    position: number;
    postIts: PostItData[];
  };
  setBoard: React.Dispatch<React.SetStateAction<{
    id: number;
    title: string;
    columns: Array<{
      id: number;
      title: string;
      position: number;
      postIts: PostItData[];
    }>;
  }>>;
}

interface NewPostItData {
  title: string;
  description: string;
  columnId: number;
  position: number;
}

const Column: React.FC<ColumnProps> = ({ data, setBoard }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPostItTitle, setNewPostItTitle] = useState('');
  const [newPostItDescription, setNewPostItDescription] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(data.title);

  const { setNodeRef, isOver } = useDroppable({
    id: `column-${data.id}`,
  });

  const handleUpdateTitle = () => {
    if (editedTitle.trim() === '') return;

    apiClient.put(`/api/column/${data.id}`, {
      title: editedTitle
    })
    .then(() => {
      setBoard(prevBoard => ({
        ...prevBoard,
        columns: (prevBoard.columns || []).map(column =>
          column.id === data.id
            ? { ...column, title: editedTitle }
            : column
        )
      }));
      setIsEditingTitle(false);
    })
    .catch(error => console.error('Error updating column title:', error));
  };

  const handleAddPostIt = () => {
    if (newPostItTitle.trim() === '') return;

    const newPostIt: NewPostItData = {
      title: newPostItTitle,
      description: newPostItDescription,
      columnId: data.id,
      position: data.postIts?.length || 0
    };

    console.log('Creating new post-it:', newPostIt);

    apiClient.post('/api/postit', newPostIt)
      .then(response => {
        console.log('API Response:', response.data);
        const createdPostIt = {
          ...response.data,
          id: response.data.id || Math.random(), // Fallback ID if API doesn't provide one
          owner: 'Me', // Default owner
          color: '#fff59d' // Default color
        };

        console.log('Updating board with new post-it:', createdPostIt);

        setBoard(prevBoard => {
          const newBoard = {
            ...prevBoard,
            columns: (prevBoard.columns || []).map(column => {
              if (column.id === data.id) {
                return {
                  ...column,
                  postIts: [...(column.postIts || []), { ...createdPostIt, position: (column.postIts || []).length }]
                };
              }
              return column;
            })
          };
          console.log('New board state:', newBoard);
          return newBoard;
        });
      })
      .catch(error => {
        console.error('Error creating post-it:', error);
        console.error('Error details:', error.response?.data || error.message);
      });

    setIsDialogOpen(false);
    setNewPostItTitle('');
    setNewPostItDescription('');
  };

  return (
    <Paper
      ref={setNodeRef}
      elevation={2}
      sx={{
        ...(isOver ? {
          backgroundColor: '#f0f0f0',
          border: '2px dashed #1976d2',
          transform: 'scale(1.02)',
          transition: 'all 0.2s ease'
        } : {
          border: '2px solid transparent'
        }),
        width: 300,
        minHeight: '100%',
        padding: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        backgroundColor: '#ffffff'
      }}
    >
      {isEditingTitle ? (
        <TextField
          value={editedTitle}
          onChange={(e) => setEditedTitle(e.target.value)}
          onBlur={handleUpdateTitle}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleUpdateTitle();
            }
          }}
          variant="standard"
          autoFocus
          fullWidth
          sx={{ mb: 1 }}
        />
      ) : (
        <Typography
          variant="h6"
          component="div"
          sx={{
            fontWeight: 600,
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)'
            }
          }}
          onClick={() => setIsEditingTitle(true)}
        >
          {data.title}
        </Typography>
      )}
      
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <SortableContext
          items={data.postIts?.map(postIt => `postit-${postIt.id}`) || []}
          strategy={verticalListSortingStrategy}
        >
          {data.postIts?.map((postIt) => (
            <PostIt key={postIt.id} data={postIt} setBoard={setBoard} />
          )) || []}
        </SortableContext>
      </Box>

      <Button
        variant="contained"
        onClick={() => setIsDialogOpen(true)}
        fullWidth
      >
        Add Post-it
      </Button>

      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <DialogTitle>Add New Post-it</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            fullWidth
            value={newPostItTitle}
            onChange={(e) => setNewPostItTitle(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={4}
            value={newPostItDescription}
            onChange={(e) => setNewPostItDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddPostIt} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default Column;
