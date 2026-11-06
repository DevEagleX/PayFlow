package com.paytab.controller;

import com.paytab.dto.response.WalletBalanceResponse;
import com.paytab.repository.UserRepository;
import com.paytab.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/wallet")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;
    private final UserRepository userRepository;

    @GetMapping("/balance")
    public WalletBalanceResponse getBalance(Authentication authentication) {
        String email = authentication.getName();
        UUID userId = userRepository.findByEmail(email)
                .orElseThrow()
                .getId();
        return walletService.getBalance(userId);
    }
}
