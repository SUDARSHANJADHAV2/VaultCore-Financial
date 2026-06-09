package com.vaultcore.repository;

import com.vaultcore.model.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account, Long> {

    Optional<Account> findByAccountNumber(String accountNumber);

    // ✅ CRITICAL FIX: Account has @ManyToOne User user (not a userId field).
    // Spring Data JPA traverses the relationship with underscore notation: user_Id → user.id
    // Old: findByUserId(Long userId) → Spring cannot resolve 'userId' property → returns empty list!
    // Fixed: findByUser_Id(Long userId) → Spring generates: WHERE u.id = ? via JOIN
    List<Account> findByUser_Id(Long userId);

    // ✅ NEW: All accounts NOT belonging to a specific user → used for Transfer "To Account" dropdown
    @Query("SELECT a FROM Account a WHERE a.user.id != :userId")
    List<Account> findAllExceptUser(@Param("userId") Long userId);

    // Count accounts for a user → used to check if provisioning is needed
    long countByUser_Id(Long userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Account a WHERE a.accountNumber = :accountNumber")
    Optional<Account> findByAccountNumberWithLock(@Param("accountNumber") String accountNumber);
}
