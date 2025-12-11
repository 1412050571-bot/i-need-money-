package com.example.todo.dto;

import com.example.todo.domain.User;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MeResponse {
    private Long id;
    private String email;
    private String displayName;
    private String avatarUrl;
    private String role;

    public static MeResponse from(User user) {
        MeResponse r = new MeResponse();
        r.setId(user.getId());
        r.setEmail(user.getEmail());
        r.setDisplayName(user.getDisplayName());
        r.setAvatarUrl(user.getAvatarUrl());
        r.setRole(user.getRole());
        return r;
    }
}
