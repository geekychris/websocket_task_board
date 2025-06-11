package com.stickyboard.repository;

import com.stickyboard.model.PostIt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PostItRepository extends JpaRepository<PostIt, Long> {
    List<PostIt> findByColumnIdAndPositionGreaterThanEqual(Long columnId, Integer position);
}

