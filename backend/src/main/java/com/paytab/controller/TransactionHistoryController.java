package com.paytab.controller;

import com.paytab.dto.request.TransactionFilter;
import com.paytab.dto.response.PagedResponse;
import com.paytab.dto.response.TransactionHistoryItem;
import com.paytab.service.TransactionHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionHistoryController {

    private final TransactionHistoryService historyService;

    @GetMapping
    public PagedResponse<TransactionHistoryItem> getHistory(
            Authentication authentication,
            @ModelAttribute TransactionFilter filter) {
        return historyService.getHistory(authentication.getName(), filter);
    }

    @GetMapping("/{transactionId}")
    public TransactionHistoryItem getById(
            Authentication authentication,
            @PathVariable String transactionId) {
        return historyService.getById(authentication.getName(), transactionId);
    }
}
