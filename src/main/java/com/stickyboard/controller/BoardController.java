package com.stickyboard.controller;

import com.stickyboard.model.Board;
import com.stickyboard.model.Column;
import com.stickyboard.repository.BoardRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;

@RestController
@RequestMapping("/api/board")
@CrossOrigin(origins = "http://localhost:5173")
public class BoardController {

    private final BoardRepository boardRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public BoardController(BoardRepository boardRepository, SimpMessagingTemplate messagingTemplate) {
        this.boardRepository = boardRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @PostConstruct
    public void init() {
        if (boardRepository.count() == 0) {
            Board board = new Board();
            board.setTitle("My Project Board");

            Column todoColumn = new Column();
            todoColumn.setTitle("To Do");
            todoColumn.setPosition(0);
            todoColumn.setBoard(board);

            Column inProgressColumn = new Column();
            inProgressColumn.setTitle("In Progress");
            inProgressColumn.setPosition(1);
            inProgressColumn.setBoard(board);

            Column doneColumn = new Column();
            doneColumn.setTitle("Done");
            doneColumn.setPosition(2);
            doneColumn.setBoard(board);

            board.setColumns(Arrays.asList(todoColumn, inProgressColumn, doneColumn));
            boardRepository.save(board);
        }
    }

    @GetMapping("/first")
    public Board getFirstBoard() {
        return boardRepository.findAll().stream()
                .findFirst()
                .orElseThrow(() -> new RuntimeException("No boards found"));
    }

    @GetMapping("/{id}")
    public Board getBoard(@PathVariable Long id) {
        return boardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Board not found"));
    }

    @PostMapping
    public Board createBoard(@RequestBody Board board) {
        Board savedBoard = boardRepository.save(board);
        messagingTemplate.convertAndSend("/topic/board", savedBoard);
        return savedBoard;
    }

    @PutMapping("/{id}")
    public Board updateBoard(@PathVariable Long id, @RequestBody Board board) {
        board.setId(id);
        Board updatedBoard = boardRepository.save(board);
        messagingTemplate.convertAndSend("/topic/board", updatedBoard);
        return updatedBoard;
    }
}
