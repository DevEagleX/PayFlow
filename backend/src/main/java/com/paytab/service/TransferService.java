package com.paytab.service;

import com.paytab.dto.request.TransferRequest;
import com.paytab.dto.response.TransferResponse;
import com.paytab.dto.response.UserPublicSummary;
import com.paytab.entity.Transaction;
import com.paytab.entity.User;
import com.paytab.entity.Wallet;
import com.paytab.exception.RecipientNotFoundException;
import com.paytab.exception.SelfTransferException;
import com.paytab.repository.TransactionRepository;
import com.paytab.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TransferService {

    private final UserRepository userRepository;
    private final WalletService walletService;
    private final TransactionRepository transactionRepository;

    public UserPublicSummary searchRecipient(String identifier) {
        User user = findByIdentifier(identifier)
                .orElseThrow(() -> new RecipientNotFoundException("No user found with that email or phone number"));

        return UserPublicSummary.builder()
                .id(user.getId().toString())
                .fullName(user.getFullName())
                .maskedIdentifier(mask(identifier))
                .build();
    }

    @Transactional
    public TransferResponse transfer(String senderEmail, TransferRequest request) {
        User sender = userRepository.findByEmail(senderEmail).orElseThrow();

        User recipient = findByIdentifier(request.getRecipientIdentifier())
                .orElseThrow(() -> new RecipientNotFoundException("No user found with that email or phone number"));

        if (recipient.getId().equals(sender.getId())) {
            throw new SelfTransferException("You cannot transfer money to yourself");
        }

        // Debit first: if the sender doesn't have enough, we throw here and
        // nothing else in this method has taken effect (transaction rollback).
        Wallet senderWallet = walletService.debit(sender.getId(), request.getAmount());
        walletService.credit(recipient.getId(), request.getAmount());

        // sender/receiver are stored as real FK associations now (not raw ID
        // strings) - a transaction can never reference a user that doesn't
        // exist, enforced by Postgres itself, not just by this code path.
        Transaction txn = Transaction.builder()
                .sender(sender)
                .receiver(recipient)
                .amount(request.getAmount())
                .currency(senderWallet.getCurrency())
                .note(request.getNote())
                .createdAt(Instant.now())
                .build();
        Transaction saved = transactionRepository.save(txn);

        return TransferResponse.builder()
                .transactionId(saved.getId().toString())
                .amount(saved.getAmount())
                .currency(saved.getCurrency())
                .recipientName(recipient.getFullName())
                .newBalance(senderWallet.getBalance())
                .timestamp(saved.getCreatedAt())
                .build();
    }

    private Optional<User> findByIdentifier(String identifier) {
        if (identifier.contains("@")) {
            return userRepository.findByEmail(identifier);
        }
        return userRepository.findByPhoneNumber(identifier);
    }

    private String mask(String identifier) {
        if (identifier.contains("@")) {
            int at = identifier.indexOf('@');
            String local = identifier.substring(0, at);
            String domain = identifier.substring(at);
            if (local.length() <= 2) {
                return local.charAt(0) + "***" + domain;
            }
            return local.charAt(0) + "***" + local.charAt(local.length() - 1) + domain;
        }
        if (identifier.length() >= 4) {
            return identifier.substring(0, 2) + "******" + identifier.substring(identifier.length() - 2);
        }
        return identifier;
    }
}
