package com.paytab.service;

import com.paytab.dto.response.WalletBalanceResponse;
import com.paytab.entity.User;
import com.paytab.entity.Wallet;
import com.paytab.exception.InsufficientBalanceException;
import com.paytab.exception.WalletNotFoundException;
import com.paytab.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WalletService {

    private static final String DEFAULT_CURRENCY = "INR";

    private final WalletRepository walletRepository;

    public Wallet createWallet(User user) {
        Instant now = Instant.now();
        Wallet wallet = Wallet.builder()
                .user(user)
                .balance(BigDecimal.ZERO)
                .currency(DEFAULT_CURRENCY)
                .createdAt(now)
                .updatedAt(now)
                .build();
        return walletRepository.save(wallet);
    }

    public WalletBalanceResponse getBalance(UUID userId) {
        Wallet wallet = walletRepository.findByUser_Id(userId)
                .orElseThrow(() -> new WalletNotFoundException("Wallet not found for this user"));

        return WalletBalanceResponse.builder()
                .balance(wallet.getBalance())
                .currency(wallet.getCurrency())
                .build();
    }

    /**
     * Atomically debits a wallet ONLY IF its balance is sufficient - see
     * WalletRepository.debit() for how the atomicity is achieved (a single
     * conditional UPDATE statement, the Postgres equivalent of Mongo's
     * findAndModify). This method just interprets the result: 0 rows
     * updated means either the wallet doesn't exist or the balance was too
     * low, disambiguated with a follow-up lookup for a clearer error.
     */
    public Wallet debit(UUID userId, BigDecimal amount) {
        int rowsUpdated = walletRepository.debit(userId, amount, Instant.now());

        if (rowsUpdated == 0) {
            if (walletRepository.findByUser_Id(userId).isEmpty()) {
                throw new WalletNotFoundException("Wallet not found for this user");
            }
            throw new InsufficientBalanceException("Insufficient balance for this transfer");
        }

        return walletRepository.findByUser_Id(userId).orElseThrow();
    }

    /**
     * Atomically credits a wallet. Reading the wallet back after the update
     * is safe here even under concurrency: the debit/credit already
     * committed as part of this same database transaction, so this SELECT
     * simply observes the write this transaction itself just made.
     */
    public Wallet credit(UUID userId, BigDecimal amount) {
        int rowsUpdated = walletRepository.credit(userId, amount, Instant.now());

        if (rowsUpdated == 0) {
            throw new WalletNotFoundException("Recipient wallet not found");
        }

        return walletRepository.findByUser_Id(userId).orElseThrow();
    }
}
