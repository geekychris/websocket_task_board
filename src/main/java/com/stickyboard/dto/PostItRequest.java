package com.stickyboard.dto;

import lombok.Data;

@Data
public class PostItRequest {
    private String title;
    private String description;
    private Long columnId;
    private Integer position;
}

