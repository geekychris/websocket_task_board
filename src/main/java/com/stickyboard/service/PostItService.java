package com.stickyboard.service;

import com.stickyboard.dto.PostItRequest;
import com.stickyboard.model.Column;
import com.stickyboard.model.PostIt;
import com.stickyboard.repository.ColumnRepository;
import com.stickyboard.repository.PostItRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PostItService {

    @Autowired
    private PostItRepository postItRepository;

    @Autowired
    private ColumnRepository columnRepository;

    @Transactional
    public PostIt createPostIt(PostItRequest request) {
        Column column = columnRepository.findById(request.getColumnId())
                .orElseThrow(() -> new RuntimeException("Column not found"));

        PostIt postIt = new PostIt();
        postIt.setTitle(request.getTitle());
        postIt.setDescription(request.getDescription());
        postIt.setPosition(request.getPosition());
        postIt.setColumn(column);
        postIt.setOwner("Me"); // Default owner
        postIt.setColor("#fff59d"); // Default color

        return postItRepository.save(postIt);
    }

    @Transactional
    public PostIt movePostIt(Long postItId, Long columnId, Integer position) {
        PostIt postIt = postItRepository.findById(postItId)
                .orElseThrow(() -> new RuntimeException("PostIt not found"));

        Column newColumn = columnRepository.findById(columnId)
                .orElseThrow(() -> new RuntimeException("Column not found"));

        // Update position of other post-its in the column
        postItRepository.findByColumnIdAndPositionGreaterThanEqual(columnId, position)
                .forEach(p -> p.setPosition(p.getPosition() + 1));

        postIt.setColumn(newColumn);
        postIt.setPosition(position);
        return postItRepository.save(postIt);
    }

    @Transactional
    public PostIt updatePostIt(Long id, PostItRequest request) {
        PostIt postIt = postItRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post-it not found"));

        postIt.setTitle(request.getTitle());
        postIt.setDescription(request.getDescription());

        return postItRepository.save(postIt);
    }
}
