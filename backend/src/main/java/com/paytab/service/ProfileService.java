package com.paytab.service;

import com.paytab.dto.request.UpdateProfileRequest;
import com.paytab.dto.response.ProfileResponse;
import com.paytab.entity.User;
import com.paytab.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserRepository userRepository;

    public ProfileResponse getProfile(String email) {
        User user = userRepository.findByEmail(email).orElseThrow();
        return toResponse(user);
    }

    public ProfileResponse updateProfile(String email, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email).orElseThrow();
        user.setFullName(request.getFullName());
        user.setUpdatedAt(Instant.now());
        User saved = userRepository.save(user);
        return toResponse(saved);
    }

    private ProfileResponse toResponse(User user) {
        return ProfileResponse.builder()
                .id(user.getId().toString())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .memberSince(user.getCreatedAt())
                .build();
    }
}
