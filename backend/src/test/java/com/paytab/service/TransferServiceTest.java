package com.paytab.service;

import com.paytab.dto.request.TransferRequest;
import com.paytab.dto.response.TransferResponse;
import com.paytab.entity.Transaction;
import com.paytab.entity.User;
import com.paytab.entity.Wallet;
import com.paytab.exception.InsufficientBalanceException;
import com.paytab.exception.RecipientNotFoundException;
import com.paytab.exception.SelfTransferException;
import com.paytab.repository.TransactionRepository;
import com.paytab.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TransferServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private WalletService walletService;
    @Mock private TransactionRepository transactionRepository;

    @InjectMocks
    private TransferService transferService;

    private final User sender = User.builder().id(UUID.randomUUID()).fullName("Aditi Sharma").email("aditi@example.com").build();
    private final User recipient = User.builder().id(UUID.randomUUID()).fullName("Rohan Mehta").email("rohan@example.com").build();

    @Test
    void rejectsSelfTransferWithoutTouchingWallets() {
        TransferRequest request = new TransferRequest();
        request.setRecipientIdentifier("aditi@example.com");
        request.setAmount(new BigDecimal("100.00"));

        when(userRepository.findByEmail("aditi@example.com")).thenReturn(Optional.of(sender));

        assertThatThrownBy(() -> transferService.transfer("aditi@example.com", request))
                .isInstanceOf(SelfTransferException.class);

        verify(walletService, never()).debit(any(), any());
        verify(walletService, never()).credit(any(), any());
        verify(transactionRepository, never()).save(any());
    }

    @Test
    void rejectsTransferWhenRecipientDoesNotExist() {
        TransferRequest request = new TransferRequest();
        request.setRecipientIdentifier("nobody@example.com");
        request.setAmount(new BigDecimal("100.00"));

        when(userRepository.findByEmail("aditi@example.com")).thenReturn(Optional.of(sender));
        when(userRepository.findByEmail("nobody@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> transferService.transfer("aditi@example.com", request))
                .isInstanceOf(RecipientNotFoundException.class);

        verify(walletService, never()).debit(any(), any());
    }

    @Test
    void insufficientBalanceStopsBeforeCreditingRecipient() {
        TransferRequest request = new TransferRequest();
        request.setRecipientIdentifier("rohan@example.com");
        request.setAmount(new BigDecimal("5000.00"));

        when(userRepository.findByEmail("aditi@example.com")).thenReturn(Optional.of(sender));
        when(userRepository.findByEmail("rohan@example.com")).thenReturn(Optional.of(recipient));
        when(walletService.debit(sender.getId(), new BigDecimal("5000.00")))
                .thenThrow(new InsufficientBalanceException("Insufficient balance for this transfer"));

        assertThatThrownBy(() -> transferService.transfer("aditi@example.com", request))
                .isInstanceOf(InsufficientBalanceException.class);

        // This is the assertion that matters most: if the atomic debit
        // fails, credit must NEVER be attempted and no transaction record
        // must be written - our unit-test proxy for the rollback guarantee
        // the real @Transactional + JpaTransactionManager setup provides.
        verify(walletService, never()).credit(any(), any());
        verify(transactionRepository, never()).save(any());
    }

    @Test
    void successfulTransferDebitsThenCreditsThenRecordsTransaction() {
        TransferRequest request = new TransferRequest();
        request.setRecipientIdentifier("rohan@example.com");
        request.setAmount(new BigDecimal("500.00"));
        request.setNote("Lunch split");

        when(userRepository.findByEmail("aditi@example.com")).thenReturn(Optional.of(sender));
        when(userRepository.findByEmail("rohan@example.com")).thenReturn(Optional.of(recipient));

        Wallet senderWalletAfterDebit = Wallet.builder()
                .balance(new BigDecimal("1500.00")).currency("INR").build();
        when(walletService.debit(sender.getId(), new BigDecimal("500.00"))).thenReturn(senderWalletAfterDebit);

        UUID txnId = UUID.randomUUID();
        Transaction savedTxn = Transaction.builder()
                .id(txnId).sender(sender).receiver(recipient)
                .amount(new BigDecimal("500.00")).currency("INR").note("Lunch split").build();
        when(transactionRepository.save(any(Transaction.class))).thenReturn(savedTxn);

        TransferResponse response = transferService.transfer("aditi@example.com", request);

        var inOrder = inOrder(walletService, transactionRepository);
        inOrder.verify(walletService).debit(sender.getId(), new BigDecimal("500.00"));
        inOrder.verify(walletService).credit(recipient.getId(), new BigDecimal("500.00"));
        inOrder.verify(transactionRepository).save(any(Transaction.class));

        assertThat(response.getTransactionId()).isEqualTo(txnId.toString());
        assertThat(response.getNewBalance()).isEqualByComparingTo("1500.00");
        assertThat(response.getRecipientName()).isEqualTo("Rohan Mehta");
    }
}
