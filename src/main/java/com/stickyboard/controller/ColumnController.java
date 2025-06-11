package com.stickyboard.controller;

import com.stickyboard.dto.ColumnRequest;
import com.stickyboard.model.Column;
import com.stickyboard.service.ColumnService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/column")
@CrossOrigin(origins = "http://localhost:5173")
public class ColumnController {

    @Autowired
    private ColumnService columnService;

    @PutMapping("/{id}")
    public ResponseEntity<Column> updateColumn(
            @PathVariable Long id,
            @RequestBody ColumnRequest request) {
        Column column = columnService.updateColumn(id, request);
        return ResponseEntity.ok(column);
    }
}

