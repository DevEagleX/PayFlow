package com.paytab.controller;

import com.paytab.dto.response.UserPublicSummary;
import com.paytab.service.TransferService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserSearchController {

    private final TransferService transferService;

    @GetMapping("/search")
    public UserPublicSummary search(@RequestParam String identifier) {
        return transferService.searchRecipient(identifier);
    }
}
