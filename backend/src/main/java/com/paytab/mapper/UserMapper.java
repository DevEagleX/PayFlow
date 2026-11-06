package com.paytab.mapper;

import com.paytab.dto.response.UserSummary;
import com.paytab.entity.User;

public class UserMapper {

    private UserMapper() {}

    public static UserSummary toSummary(User user) {
        return UserSummary.builder()
                .id(user.getId().toString())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .build();
    }
}
