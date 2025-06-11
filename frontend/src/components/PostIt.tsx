import React, { useState } from 'react';
import { Paper, Typography, Box, IconButton, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import apiClient from '../api/axiosConfig';

interface PostItProps {
  data: {
    id: number;
    title: string;
    description: string;
    owner: string;
    color: string;
    position: number;
  };
  setBoard: React.Dispatch<React.SetStateAction<{
    id: number;
    title: string;
    columns: Array<{
      id: number;
      title: string;
      position: number;
      postIts: Array<{
        id: number;
        title: string;
        description: string;
        owner: string;
        color: string;
        position: number;
      }>;
    }>;
  }>>;
}

const PostIt: React.FC<PostItProps> = ({ data, setBoard }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(data.title);
  const [editDescription, setEditDescription] = useState(data.description);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: `postit-${data.id}`,
    data: {
      type: 'PostIt',
      postIt: data
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <>
      <Paper
        ref={setNodeRef}
        elevation={1}
        sx={{
          padding: 2,
          backgroundColor: data.color || '#fff59d',
          cursor: 'grab',
          '&:active': {
            cursor: 'grabbing',
          },
          opacity: isDragging ? 0.5 : 1,
          position: 'relative',
        }}
        style={style}
        {...attributes}
        {...listeners}
      >
        <Box onClick={() => setIsEditing(true)} sx={{ cursor: 'pointer' }}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
          {data.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {data.description}
          </Typography>
        </Box>
        <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Owner: {data.owner}
          </Typography>
        </Box>
      </Paper>

      <Dialog open={isEditing} onClose={() => setIsEditing(false)}>
        <DialogTitle>Edit Post-it</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            fullWidth
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={4}
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditing(false)}>Cancel</Button>
          <Button onClick={() => {
            console.log('Updating post-it:', {
              id: data.id,
              title: editTitle,
              description: editDescription,
              owner: data.owner,
              color: data.color,
              position: data.position
            });
            // Update the post-it
            apiClient.put(`/api/postit/${data.id}`, {
              title: editTitle,
              description: editDescription
            })
            .then(() => {
              // Update local state without fetching the entire board
              setBoard(prevBoard => ({
                ...prevBoard,
                columns: prevBoard.columns.map(column => ({
                  ...column,
                  postIts: column.postIts.map(postIt =>
                    postIt.id === data.id
                      ? { ...postIt, title: editTitle, description: editDescription }
                      : postIt
                  )
                }))
              }));
              setIsEditing(false);
            })
            .catch(error => {
              console.error('Error updating post-it:', error.response?.data || error);
              alert('Failed to update post-it. Please try again.');
            });
          }} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PostIt;
