package com.paytab.service;

import com.paytab.entity.Wallet;
import com.paytab.exception.InsufficientBalanceException;
import com.paytab.exception.WalletNotFoundException;
import com.paytab.repository.WalletRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WalletServiceTest {

    @Mock private WalletRepository walletRepository;

    @InjectMocks
    private WalletService walletService;

    private final UUID userId = UUID.randomUUID();

    @Test
    void debitSucceedsWhenBalanceIsSufficient() {
        // debit() returning 1 means the conditional UPDATE matched a row -
        // i.e. the balance was actually sufficient at the database level.
        when(walletRepository.debit(any(UUID.class), any(BigDecimal.class), any(Instant.class))).thenReturn(1);

        Wallet updated = Wallet.builder().balance(new BigDecimal("500.00")).currency("INR").build();
        when(walletRepository.findByUser_Id(userId)).thenReturn(Optional.of(updated));

        Wallet result = walletService.debit(userId, new BigDecimal("500.00"));

        assertThat(result.getBalance()).isEqualByComparingTo("500.00");
    }

    @Test
    void debitThrowsInsufficientBalanceWhenWalletExistsButBalanceTooLow() {
        // 0 rows updated: the conditional UPDATE's WHERE clause matched
        // nothing - either the balance was too low or the wallet is missing.
        when(walletRepository.debit(any(UUID.class), any(BigDecimal.class), any(Instant.class))).thenReturn(0);
        Wallet existingWallet = Wallet.builder().balance(new BigDecimal("10.00")).build();
        when(walletRepository.findByUser_Id(userId)).thenReturn(Optional.of(existingWallet));

        assertThatThrownBy(() -> walletService.debit(userId, new BigDecimal("500.00")))
                .isInstanceOf(InsufficientBalanceException.class);
    }

    @Test
    void debitThrowsWalletNotFoundWhenWalletDoesNotExistAtAll() {
        when(walletRepository.debit(any(UUID.class), any(BigDecimal.class), any(Instant.class))).thenReturn(0);
        when(walletRepository.findByUser_Id(userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> walletService.debit(userId, new BigDecimal("500.00")))
                .isInstanceOf(WalletNotFoundException.class);
    }

    @Test
    void creditThrowsWalletNotFoundWhenRecipientWalletMissing() {
        when(walletRepository.credit(any(UUID.class), any(BigDecimal.class), any(Instant.class))).thenReturn(0);

        assertThatThrownBy(() -> walletService.credit(userId, new BigDecimal("500.00")))
                .isInstanceOf(WalletNotFoundException.class);
    }

    @Test
    void creditSucceedsAndReturnsUpdatedWallet() {
        when(walletRepository.credit(any(UUID.class), any(BigDecimal.class), any(Instant.class))).thenReturn(1);
        Wallet updated = Wallet.builder().balance(new BigDecimal("2000.00")).currency("INR").build();
        when(walletRepository.findByUser_Id(userId)).thenReturn(Optional.of(updated));

        Wallet result = walletService.credit(userId, new BigDecimal("500.00"));

        assertThat(result.getBalance()).isEqualByComparingTo("2000.00");
    }
}
