```rust
use anchor_lang::prelude::*;

#[error_code]
pub enum StreamFlowError {
    #[msg("Invalid stream configuration")]
    InvalidStreamConfig,
    
    #[msg("Stream not found")]
    StreamNotFound,
    
    #[msg("Unauthorized access to stream")]
    UnauthorizedAccess,
    
    #[msg("Stream is already initialized")]
    StreamAlreadyInitialized,
    
    #[msg("Stream is not active")]
    StreamNotActive,
    
    #[msg("Stream has already been cancelled")]
    StreamAlreadyCancelled,
    
    #[msg("Stream has already been completed")]
    StreamAlreadyCompleted,
    
    #[msg("Insufficient funds for stream creation")]
    InsufficientFunds,
    
    #[msg("Invalid recipient address")]
    InvalidRecipient,
    
    #[msg("Invalid stream duration")]
    InvalidDuration,
    
    #[msg("Invalid stream amount")]
    InvalidAmount,
    
    #[msg("Stream start time must be in the future")]
    InvalidStartTime,
    
    #[msg("Stream end time must be after start time")]
    InvalidEndTime,
    
    #[msg("Cannot withdraw before cliff period")]
    CliffPeriodNotReached,
    
    #[msg("No funds available for withdrawal")]
    NoFundsAvailable,
    
    #[msg("Withdrawal amount exceeds available balance")]
    InsufficientWithdrawableAmount,
    
    #[msg("Stream cannot be cancelled after completion")]
    CannotCancelCompletedStream,
    
    #[msg("Only stream creator can cancel")]
    OnlyCreatorCanCancel,
    
    #[msg("Only stream recipient can withdraw")]
    OnlyRecipientCanWithdraw,
    
    #[msg("Stream is paused")]
    StreamPaused,
    
    #[msg("Stream is not paused")]
    StreamNotPaused,
    
    #[msg("Cannot pause completed stream")]
    CannotPauseCompletedStream,
    
    #[msg("Cannot resume cancelled stream")]
    CannotResumeCancelledStream,
    
    #[msg("Invalid token mint")]
    InvalidTokenMint,
    
    #[msg("Token account not found")]
    TokenAccountNotFound,
    
    #[msg("Invalid token account owner")]
    InvalidTokenAccountOwner,
    
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
    
    #[msg("Arithmetic underflow")]
    ArithmeticUnderflow,
    
    #[msg("Division by zero")]
    DivisionByZero,
    
    #[msg("Invalid vesting schedule")]
    InvalidVestingSchedule,
    
    #[msg("Vesting cliff cannot be greater than duration")]
    InvalidCliffPeriod,
    
    #[msg("Stream rate calculation failed")]
    StreamRateCalculationFailed,
    
    #[msg("Invalid stream type")]
    InvalidStreamType,
    
    #[msg("Stream modification not allowed")]
    StreamModificationNotAllowed,
    
    #[msg("Invalid fee configuration")]
    InvalidFeeConfiguration,
    
    #[msg("Fee calculation failed")]
    FeeCalculationFailed,
    
    #[msg("Treasury account not found")]
    TreasuryAccountNotFound,
    
    #[msg("Invalid treasury configuration")]
    InvalidTreasuryConfiguration,
    
    #[msg("Multisig threshold not met")]
    MultisigThresholdNotMet,
    
    #[msg("Invalid multisig configuration")]
    InvalidMultisigConfiguration,
    
    #[msg("Proposal not found")]
    ProposalNotFound,
    
    #[msg("Proposal already executed")]
    ProposalAlreadyExecuted,
    
    #[msg("Proposal voting period expired")]
    ProposalVotingExpired,
    
    #[msg("Insufficient voting power")]
    InsufficientVotingPower,
    
    #[msg("Already voted on proposal")]
    AlreadyVoted,
    
    #[msg("Invalid proposal type")]
    InvalidProposalType,
    
    #[msg("Proposal execution failed")]
    ProposalExecutionFailed,
    
    #[msg("Stream template not found")]
    StreamTemplateNotFound,
    
    #[msg("Invalid template configuration")]
    InvalidTemplateConfiguration,
    
    #[msg("Template already exists")]
    TemplateAlreadyExists,
    
    #[msg("Cannot delete template with active streams")]
    CannotDeleteActiveTemplate,
    
    #[msg("Batch operation failed")]
    BatchOperationFailed,
    
    #[msg("Invalid batch size")]
    InvalidBatchSize,
    
    #[msg("Batch limit exceeded")]
    BatchLimitExceeded,
    
    #[msg("Stream metadata too large")]
    StreamMetadataTooLarge,
    
    #[msg("Invalid metadata format")]
    InvalidMetadataFormat,
    
    #[msg("Escrow account not found")]
    EscrowAccountNotFound,
    
    #[msg("Invalid escrow configuration")]
    InvalidEscrowConfiguration,
    
    #[msg("Escrow release conditions not met")]
    EscrowReleaseConditionsNotMet,
    
    #[msg("Oracle price feed not found")]
    OraclePriceFeedNotFound,
    
    #[msg("Invalid oracle configuration")]
    InvalidOracleConfiguration,
    
    #[msg("Oracle price too stale")]
    OraclePriceTooStale,
    
    #[msg("Price deviation too high")]
    PriceDeviationTooHigh,
    
    #[msg("Slippage tolerance exceeded")]
    SlippageToleranceExceeded,
    
    #[msg("Invalid swap configuration")]
    InvalidSwapConfiguration,
    
    #[msg("Swap execution failed")]
    SwapExecutionFailed,
    
    #[msg("Liquidity pool not found")]
    LiquidityPoolNotFound,
    
    #[msg("Insufficient liquidity")]
    InsufficientLiquidity,
    
    #[msg("Invalid AMM configuration")]
    InvalidAmmConfiguration,
    
    #[msg("Stream schedule conflict")]
    StreamScheduleConflict,
    
    #[msg("Invalid recurring stream configuration")]
    InvalidRecurringStreamConfiguration,
    
    #[msg("Recurring stream limit exceeded")]
    RecurringStreamLimitExceeded,
    
    #[msg("Stream dependency not met")]
    StreamDependencyNotMet,
    
    #[msg("Invalid stream dependency")]
    InvalidStreamDependency,
    
    #[msg("Circular dependency detected")]
    CircularDependencyDetected,
    
    #[msg("Stream group not found")]
    StreamGroupNotFound,
    
    #[msg("Invalid stream group configuration")]
    InvalidStreamGroupConfiguration,
    
    #[msg("Stream group limit exceeded")]
    StreamGroupLimitExceeded,
    
    #[msg("Cannot remove stream from active group")]
    CannotRemoveStreamFromActiveGroup,
    
    #[msg("Notification configuration invalid")]
    InvalidNotificationConfiguration,
    
    #[msg("Webhook endpoint unreachable")]
    WebhookEndpointUnreachable,
    
    #[msg("Invalid webhook signature")]
    InvalidWebhookSignature,
    
    #[msg("Rate limit exceeded")]
    RateLimitExceeded,
    
    #[msg("API key not found")]
    ApiKeyNotFound,
    
    #[msg("Invalid API key")]
    InvalidApiKey,
    
    #[msg("API key expired")]
    ApiKeyExpired,
    
    #[msg("Insufficient API permissions")]
    InsufficientApiPermissions,
    
    #[msg("Account verification required")]
    AccountVerificationRequired,
    
    #[msg("KYC verification failed")]
    KycVerificationFailed,
    
    #[msg("Compliance check failed")]
    ComplianceCheckFailed,
    
    #[msg("Jurisdiction not supported")]
    JurisdictionNotSupported,
    
    #[msg("Transaction limit exceeded")]
    TransactionLimitExceeded,
    
    #[msg("Daily limit exceeded")]
    DailyLimitExceeded,
    
    #[msg("Monthly limit exceeded")]
    MonthlyLimitExceeded,
    
    #[msg("Account suspended")]
    AccountSuspended,
    
    #[msg("Account frozen")]
    AccountFrozen,
    
    #[msg("Emergency pause activated")]
    EmergencyPauseActivated,
    
    #[msg("System maintenance mode")]
    SystemMaintenanceMode,
    
    #[msg("Feature not available")]
    FeatureNotAvailable,
    
    #[msg("Version mismatch")]
    VersionMismatch,
    
    #[msg("Upgrade required")]
    UpgradeRequired,
    
    #[msg("Invalid program state")]
    InvalidProgramState,
    
    #[msg("Program not initialized")]
    ProgramNotInitialized,
    
    #[msg("Program already initialized")]
    ProgramAlreadyInitialized,
    
    #[msg("Invalid admin authority")]
    InvalidAdminAuthority,
    
    #[msg("Admin authority required")]
    AdminAuthorityRequired,
    
    #[msg("Invalid upgrade authority")]
    InvalidUpgradeAuthority,
    
    #[msg("Upgrade authority required")]
    UpgradeAuthorityRequired,
    
    #[msg("Invalid program data")]
    InvalidProgramData,
    
    #[msg("Program data corruption detected")]
    ProgramDataCorruption,
    
    #[msg("Invalid account data")]
    InvalidAccountData,
    
    #[msg("Account data size mismatch")]
    AccountDataSizeMismatch,
    
    #[msg("Account discriminator mismatch")]
    AccountDiscriminatorMismatch,
    
    #[msg("Invalid account owner")]
    InvalidAccountOwner,
    
    #[msg("Account not rent exempt")]
    AccountNotRentExempt,
    
    #[msg("Insufficient account balance")]
    InsufficientAccountBalance,
    
    #[msg("Account creation failed")]
    AccountCreationFailed,
    
    #[msg("Account initialization failed")]
    AccountInitializationFailed,
    
    #[msg("Account close failed")]
    AccountCloseFailed,
    
    #[msg("Invalid instruction data")]
    InvalidInstructionData,
    
    #[msg("Instruction execution failed")]
    InstructionExecutionFailed,
    
    #[msg("Cross-program invocation failed")]
    CrossProgramInvocationFailed,
    
    #[msg("Invalid program ID")]
    InvalidProgramId,
    
    #[msg("Program execution failed")]
    ProgramExecutionFailed,
    
    #[msg("Transaction simulation failed")]
    TransactionSimulationFailed,
    
    #[msg("Transaction confirmation timeout")]
    TransactionConfirmationTimeout,
    
    #[msg("Network congestion")]
    NetworkCongestion,
    
    #[msg("RPC endpoint unavailable")]
    RpcEndpointUnavailable,
    
    #[msg("Invalid network configuration")]
    InvalidNetworkConfiguration,
    
    #[msg("Cluster not supported")]
    ClusterNotSupported,
    
    #[msg("Invalid slot")]
    InvalidSlot,
    
    #[msg("Slot not confirmed")]
    SlotNotConfirmed,
    
    #[msg("Block not found")]
    BlockNotFound,
    
    #[msg("Transaction not found")]
    TransactionNotFound,
    
    #[msg("Invalid transaction signature")]
    InvalidTransactionSignature,
    
    #[msg("Transaction already processed")]
    TransactionAlreadyProcessed,
    
    #[msg("Transaction expired")]
    TransactionExpired,
    
    #[msg("Invalid nonce")]
    InvalidNonce,
    
    #[msg("Nonce already used")]
    NonceAlreadyUsed,
    
    #[msg("Invalid signature")]
    InvalidSignature,
    
    #[msg("Signature verification failed")]
    SignatureVerificationFailed,
    
    #[msg("Missing required signature")]
    MissingRequiredSignature,
    
    #[msg("Too many signatures")]
    TooManySignatures,
    
    #[msg("Invalid public key")]
    InvalidPublicKey,
    
    #[msg("Invalid private key")]
    InvalidPrivateKey,
    
    #[msg("Key derivation failed")]
    KeyDerivationFailed,
    
    #[msg("Encryption failed")]
    EncryptionFailed,
    
    #[msg("Decryption failed")]
    DecryptionFailed,
    
    #[msg("Hash verification failed")]
    HashVerificationFailed,
    
    #[msg("Merkle proof verification failed")]
    MerkleProofVerificationFailed,
    
    #[msg("Invalid merkle root")]
    InvalidMerkleRoot,
    
    #[msg("Invalid proof")]
    InvalidProof,
    
    #[msg("Proof generation failed")]
    ProofGenerationFailed,
    
    #[msg("Zero knowledge proof failed")]
    ZeroKnowledgeProofFailed,
    
    #[msg("Privacy feature not available")]
    PrivacyFeatureNotAvailable,
    
    #[msg("Confidential transaction failed")]
    ConfidentialTransactionFailed,
    
    #[msg("Invalid commitment")]
    InvalidCommitment,
    
    #[msg("Commitment verification failed")]
    CommitmentVerificationFailed,
    
    #[msg("Range proof failed")]
    RangeProofFailed,
    
    #[msg("Bulletproof verification failed")]
    BulletproofVerificationFailed,
    
    #[msg("Invalid zero knowledge circuit")]
    InvalidZeroKnowledgeCircuit,
    
    #[msg("Circuit compilation failed")]
    CircuitCompilationFailed,
    
    #[msg("Witness generation failed")]
    WitnessGenerationFailed,
    
    #[msg("Trusted setup required")]
    TrustedSetupRequired,
    
    #[msg("Invalid trusted setup")]
    InvalidTrustedSetup,
    
    #[msg("Ceremony participation required")]
    CeremonyParticipationRequired,
    
    #[msg("Invalid ceremony contribution")]
    InvalidCeremonyContribution,
    
    #[msg("Ceremony verification failed")]
    CeremonyVerificationFailed,
    
    #[msg("Powers of tau not available")]
    PowersOfTauNotAvailable,
    
    #[msg("Invalid powers of tau")]
    InvalidPowersOfTau,
    
    #[msg("SRS not available")]
    SrsNotAvailable,
    
    #[msg("Invalid SRS")]
    InvalidSrs,
    
    #[msg("Polynomial commitment failed")]
    PolynomialCommitmentFailed,
    
    #[msg("KZG proof failed")]
    KzgProofFailed,
    
    #[msg("Invalid elliptic curve point")]
    InvalidEllipticCurvePoint,
    
    #[msg("Point not on curve")]
    PointNotOnCurve,
    
    #[msg("Invalid scalar")]
    InvalidScalar,
    
    #[msg("Scalar multiplication failed")]
    ScalarMultiplicationFailed,
    
    #[msg("Pairing computation failed")]
    PairingComputationFailed,
    
    #[msg("Invalid pairing")]
    InvalidPairing,
    
    #[msg("Bilinear map failed")]
    BilinearMapFailed,