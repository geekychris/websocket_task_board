import React, { useEffect, useState } from 'react';
import { 
  DndContext,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  pointerWithin,
  getFirstCollision
} from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent, DragOverEvent, UniqueIdentifier } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Box, Button, Container, Paper, Typography } from '@mui/material';
import Column from './Column';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import apiClient from '../api/axiosConfig';

interface BoardData {
  id: number;
  title: string;
  columns: ColumnData[];
}

interface ColumnData {
  id: number;
  title: string;
  position: number;
  postIts: PostItData[];
}

interface PostItData {
  id: number;
  title: string;
  description: string;
  owner: string;
  color: string;
  position: number;
}

const initialBoard: BoardData = {
  id: 1,
  title: 'My Board',
  columns: [
    {
      id: 1,
      title: 'To Do',
      position: 0,
      postIts: [
        {
          id: 1,
          title: 'Sample Task',
          description: 'This is a sample task',
          owner: 'Me',
          color: '#fff59d',
          position: 0
        }
      ]
    },
    {
      id: 2,
      title: 'In Progress',
      position: 1,
      postIts: []
    },
    {
      id: 3,
      title: 'Done',
      position: 2,
      postIts: []
    }
  ]
};

const Board: React.FC = () => {
  const [board, setBoard] = useState<BoardData>({ ...initialBoard, columns: initialBoard.columns || [] });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activePostIt, setActivePostIt] = useState<PostItData | null>(null);
  const [currentContainer, setCurrentContainer] = useState<UniqueIdentifier | null>(null);
  const [stompClient, setStompClient] = useState<Client | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  useEffect(() => {
    // Initialize WebSocket connection
    const client = new Client({
      // Remove brokerURL as we're using SockJS
      webSocketFactory: () => new SockJS('http://localhost:8080/ws', null, {
        transports: ['websocket', 'xhr-streaming', 'xhr-polling'],
        headers: {
          'Origin': 'http://localhost:5173',
          'Access-Control-Allow-Origin': 'http://localhost:5173'
        }
      }),
      onConnect: (): void => {
        console.log('Connected to WebSocket');
        client.subscribe('/topic/board', (message) => {
          try {
            const update = JSON.parse(message.body);
            console.log('Received WebSocket update:', update);
            setBoard(prevBoard => {
              // If we receive a complete board update, use it
              if (update.columns) {
                return update;
              }

              // Handle post-it move update
              if (update.type === 'POST_IT_MOVE') {
                const newBoard = { ...prevBoard };
                // Remove post-it from all columns (in case it moved)
                newBoard.columns = prevBoard.columns.map(column => ({
                  ...column,
                  postIts: column.postIts.filter(p => p.id !== update.postIt.id)
                }));
                
                // Add post-it to its new column
                const targetColumn = newBoard.columns.find(c => c.id === update.columnId);
                if (targetColumn) {
                  targetColumn.postIts = [
                    ...targetColumn.postIts.slice(0, update.position),
                    update.postIt,
                    ...targetColumn.postIts.slice(update.position)
                  ];
                }
                return newBoard;
              }

              // Handle other updates (new post-it)
              const newBoard = { ...prevBoard };
              newBoard.columns = prevBoard.columns.map(column => {
                if (update.columnId === column.id) {
                  return {
                    ...column,
                    postIts: [...column.postIts, update]
                  };
                }
                return column;
              });
              return newBoard;
            });
          } catch (error) {
            console.error('Error processing WebSocket message:', error);
          }
        });
      },
    });

    client.activate();
    setStompClient(client);

    // Load initial board data
    apiClient.get('/api/board/first')
      .then(response => setBoard(response.data))
      .catch(error => {
        console.error('Error loading board:', error);
        // Keep using initial board if backend is not available
      });

    return () => {
      if (client.active) {
        client.deactivate();
      }
    };
  }, []);

  const handleDragStart = (event: DragStartEvent): void => {
    console.log('Drag start:', event);
    const { active } = event;
    const activeId = active.id as string;
    
    if (activeId.startsWith('postit-')) {
      const postItId = parseInt(activeId.split('-')[1]);
      const postIt = board.columns
        .flatMap(col => col.postIts)
        .find(p => p.id === postItId);
      
      if (postIt) {
        setActiveId(activeId);
        setActivePostIt(postIt);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent): void => {
    console.log('Drag end:', event);
    setActiveId(null);
    setActivePostIt(null);
    const { active, over } = event;
    
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    // Log the active and over IDs for debugging
    console.log('Active ID:', activeId, 'Over ID:', overId);

    // If both IDs are post-its and in the same column, handle reordering
    if (activeId.startsWith('postit-') && overId.startsWith('postit-')) {
      const activePostItId = parseInt(activeId.split('-')[1]);
      const overPostItId = parseInt(overId.split('-')[1]);

      // Find the source and target column and post-it indices
      let sourceColumn: ColumnData | undefined;
      let targetColumn: ColumnData | undefined;
      let activePostIt: PostItData | undefined;
      let oldIndex = -1;
      let newIndex = -1;

      for (const column of board.columns) {
        const activeIndex = column.postIts.findIndex(p => p.id === activePostItId);
        const overIndex = column.postIts.findIndex(p => p.id === overPostItId);

        if (activeIndex !== -1) {
          sourceColumn = column;
          oldIndex = activeIndex;
          activePostIt = column.postIts[activeIndex];
        }
        if (overIndex !== -1) {
          targetColumn = column;
          newIndex = overIndex;
        }
      }

      if (!sourceColumn || !targetColumn || !activePostIt || oldIndex === -1 || newIndex === -1) {
        return;
      }

      // Same column reordering
      if (sourceColumn.id === targetColumn.id) {
        const updatedPostIts = [...sourceColumn.postIts];
        updatedPostIts.splice(oldIndex, 1);
        updatedPostIts.splice(newIndex, 0, activePostIt);

        // Update positions
        const reorderedPostIts = updatedPostIts.map((postIt, index) => ({
          ...postIt,
          position: index
        }));

        // Update API first
        apiClient.post(
          `/api/postit/${activePostItId}/move?columnId=${sourceColumn.id}&position=${newIndex}`
        ).then(response => {
          console.log('Move successful:', response.data);
          // Update local state after successful API call
          setBoard(prevBoard => ({
            ...prevBoard,
            columns: prevBoard.columns.map(col =>
              col.id === sourceColumn.id
                ? { ...col, postIts: reorderedPostIts }
                : col
            )
          }));
        }).catch(error => {
          console.error('Error updating position:', error.response?.data || error);
        });
      }

      return;
    }

    if (activeId === overId) return;

    // Handle moving post-it to a column (either directly or over another post-it)
    if (activeId.startsWith('postit-')) {
      const postItId = parseInt(activeId.split('-')[1]);
      let targetColumnId: number;
      let targetPosition: number;

      // Determine target column and position
      if (overId.startsWith('column-')) {
        // Dropped directly on a column
        targetColumnId = parseInt(overId.split('-')[1]);
        targetPosition = board.columns.find(c => c.id === targetColumnId)?.postIts.length || 0;
      } else if (overId.startsWith('postit-')) {
        // Dropped on another post-it
        const overPostIt = board.columns
          .flatMap(col => col.postIts.map(p => ({ ...p, columnId: col.id })))
          .find(p => `postit-${p.id}` === overId);
        
        if (!overPostIt) return;
        
        targetColumnId = overPostIt.columnId;
        const column = board.columns.find(c => c.id === targetColumnId);
        if (!column) return;
        
        targetPosition = column.postIts.findIndex(p => p.id === parseInt(overId.split('-')[1]));
        if (targetPosition === -1) return;
      } else {
        return;
      }

      // Find the source column and post-it
      let sourceColumn: ColumnData | undefined;
      let postIt: PostItData | undefined;

      for (const column of board.columns) {
        const foundPostIt = column.postIts.find(p => p.id === postItId);
        if (foundPostIt) {
          sourceColumn = column;
          postIt = foundPostIt;
          break;
        }
      }

      if (!postIt || !sourceColumn) return;

      // If moving within the same column, adjust position if needed
      if (sourceColumn.id === targetColumnId && targetPosition > sourceColumn.postIts.findIndex(p => p.id === postItId)) {
        targetPosition--;
      }

      console.log(`Moving post-it ${postItId} to column ${targetColumnId} at position ${targetPosition}`);

      // Update through API first
      apiClient.post(
        `/api/postit/${postItId}/move?columnId=${targetColumnId}&position=${targetPosition}`
      ).then(() => {
        // Update local state only after successful API call
        setBoard(prev => {
          const newColumns = prev.columns.map(column => {
            if (column.id === sourceColumn!.id) {
              return {
                ...column,
                postIts: column.postIts.filter(p => p.id !== postItId)
              };
            }
            if (column.id === targetColumnId) {
              const newPostIts = [...column.postIts];
              newPostIts.splice(targetPosition, 0, postIt!);
              return {
                ...column,
                postIts: newPostIts
              };
            }
            return column;
          });

          return { ...prev, columns: newColumns };
        });
      }).catch(error => {
        console.error('Failed to move post-it:', error);
      });
    }
  };

  const addColumn = (): void => {
    const newColumn: ColumnData = {
      id: board.columns.length + 1,
      title: `New Column ${board.columns.length + 1}`,
      position: board.columns.length,
      postIts: []
    };

    setBoard(prev => ({
      ...prev,
      columns: [...prev.columns, newColumn]
    }));
  };

  return (
    <Container maxWidth={false}>
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={(event: DragOverEvent) => {
          const { active, over } = event;
          console.log('Drag over event:', { active, over });

          if (!over) return;

          const activeId = active.id.toString();
          const overId = over.id.toString();

          // If the item is being dragged over a different container
          if (activeId.startsWith('postit-') && 
              (overId.startsWith('column-') || overId.startsWith('postit-'))) {
            const targetColumnId = overId.startsWith('column-')
              ? overId
              : `column-${board.columns.find(col => 
                  col.postIts.some(p => `postit-${p.id}` === overId)
                )?.id}`;

            if (targetColumnId && targetColumnId !== currentContainer) {
              setCurrentContainer(targetColumnId);
              console.log('Switching to container:', targetColumnId);
            }
          }
        }}
      >
        <Box
          sx={{
            display: 'flex',
            overflowX: 'auto',
            minHeight: '100vh',
            padding: 2,
            gap: 2,
            backgroundColor: '#f5f5f5'
          }}
        >
          {board.columns?.map((column) => (
            <Column
              key={column.id}
              data={column}
              setBoard={setBoard}
            />
          )) || null}
          <Button
            variant="outlined"
            onClick={addColumn}
            sx={{ minWidth: 200, height: 'fit-content' }}
          >
            Add Column
          </Button>
        </Box>
        <DragOverlay>
          {activePostIt ? (
            <Paper
              elevation={4}
              sx={{
                padding: 2,
                backgroundColor: activePostIt.color || '#fff59d',
                width: '300px',
                cursor: 'grabbing',
              }}
            >
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                {activePostIt.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {activePostIt.description}
              </Typography>
              <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Owner: {activePostIt.owner}
                </Typography>
              </Box>
            </Paper>
          ) : null}
        </DragOverlay>
      </DndContext>
    </Container>
  );
};

export default Board;
