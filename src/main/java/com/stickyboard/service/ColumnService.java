package com.stickyboard.service;

import com.stickyboard.dto.ColumnRequest;
import com.stickyboard.model.Column;
import com.stickyboard.repository.ColumnRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ColumnService {

    @Autowired
    private ColumnRepository columnRepository;

    @Transactional
    public Column updateColumn(Long id, ColumnRequest request) {
        Column column = columnRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Column not found"));

        column.setTitle(request.getTitle());
        return columnRepository.save(column);
    }
}

