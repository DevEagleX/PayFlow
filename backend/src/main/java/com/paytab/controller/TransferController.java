package com.paytab.controller;

import com.paytab.dto.request.TransferRequest;
import com.paytab.dto.response.TransferResponse;
import com.paytab.service.TransferService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/transfer")
@RequiredArgsConstructor
public class TransferController {

    private final TransferService transferService;

    @PostMapping
    public TransferResponse transfer(Authentication authentication, @Valid @RequestBody TransferRequest request) {
        return transferService.transfer(authentication.getName(), request);
    }
}
