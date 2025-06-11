package com.stickyboard.controller;

import com.stickyboard.dto.PostItRequest;
import com.stickyboard.model.PostIt;
import com.stickyboard.service.PostItService;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/postit")
@CrossOrigin(origins = "http://localhost:5173")
public class PostItController {

    private final PostItService postItService;
    private final SimpMessagingTemplate messagingTemplate;

    public PostItController(PostItService postItService, SimpMessagingTemplate messagingTemplate) {
        this.postItService = postItService;
        this.messagingTemplate = messagingTemplate;
    }

    @PostMapping
    public PostIt createPostIt(@RequestBody PostItRequest request) {
            PostIt postIt = postItService.createPostIt(request);
        messagingTemplate.convertAndSend("/topic/board", postIt);
        return postIt;
    }

    @PostMapping("/{id}/move")
    public PostIt movePostIt(@PathVariable Long id, @RequestParam Long columnId, @RequestParam Integer position) {
        PostIt postIt = postItService.movePostIt(id, columnId, position);
        messagingTemplate.convertAndSend("/topic/board", postIt);
        return postIt;
    }

    @PutMapping("/{id}")
    public PostIt putPostIt(@PathVariable Long id, @RequestBody PostItRequest request) {
        PostIt postIt = postItService.updatePostIt(id, request);
        return postIt;
    }
}

