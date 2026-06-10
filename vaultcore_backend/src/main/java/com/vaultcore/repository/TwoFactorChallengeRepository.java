package com.vaultcore.repository;

import com.vaultcore.model.TwoFactorChallenge;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface TwoFactorChallengeRepository extends JpaRepository<TwoFactorChallenge, Long> {
    Optional<TwoFactorChallenge> findByChallengeId(String challengeId);
    Optional<TwoFactorChallenge> findByChallengeIdAndOtpCode(String challengeId, String otpCode);
}
