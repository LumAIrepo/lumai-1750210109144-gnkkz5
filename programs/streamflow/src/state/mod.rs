```rust
//! State module for StreamFlow program
//! 
//! This module contains all the account state definitions and related functionality
//! for the StreamFlow token streaming and vesting platform.

pub mod stream;
pub mod treasury;
pub mod vesting;

pub use stream::*;
pub use treasury::*;
pub use vesting::*;

use anchor_lang::prelude::*;

/// Common state validation trait
pub trait StateValidation {
    /// Validates the state of the account
    fn validate(&self) -> Result<()>;
}

/// Common state initialization trait
pub trait StateInitialization {
    /// Initializes the state with default values
    fn initialize(&mut self) -> Result<()>;
}

/// Stream status enumeration
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq)]
pub enum StreamStatus {
    /// Stream is scheduled but not yet started
    Scheduled,
    /// Stream is currently active and streaming
    Streaming,
    /// Stream has been paused by sender or recipient
    Paused,
    /// Stream has been cancelled
    Cancelled,
    /// Stream has completed successfully
    Completed,
}

impl Default for StreamStatus {
    fn default() -> Self {
        StreamStatus::Scheduled
    }
}

/// Vesting type enumeration
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq)]
pub enum VestingType {
    /// Linear vesting over time
    Linear,
    /// Cliff vesting with unlock at specific time
    Cliff,
    /// Custom vesting schedule with multiple unlock points
    Custom,
}

impl Default for VestingType {
    fn default() -> Self {
        VestingType::Linear
    }
}

/// Treasury operation type
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq)]
pub enum TreasuryOperation {
    /// Deposit tokens into treasury
    Deposit,
    /// Withdraw tokens from treasury
    Withdraw,
    /// Transfer tokens between accounts
    Transfer,
    /// Create new stream from treasury
    CreateStream,
    /// Cancel existing stream
    CancelStream,
}

/// Payment frequency for recurring streams
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq)]
pub enum PaymentFrequency {
    /// Pay every second (real-time streaming)
    PerSecond,
    /// Pay every minute
    PerMinute,
    /// Pay every hour
    PerHour,
    /// Pay daily
    Daily,
    /// Pay weekly
    Weekly,
    /// Pay monthly
    Monthly,
}

impl Default for PaymentFrequency {
    fn default() -> Self {
        PaymentFrequency::PerSecond
    }
}

impl PaymentFrequency {
    /// Get the duration in seconds for this payment frequency
    pub fn to_seconds(&self) -> u64 {
        match self {
            PaymentFrequency::PerSecond => 1,
            PaymentFrequency::PerMinute => 60,
            PaymentFrequency::PerHour => 3600,
            PaymentFrequency::Daily => 86400,
            PaymentFrequency::Weekly => 604800,
            PaymentFrequency::Monthly => 2592000, // 30 days
        }
    }
}

/// Stream direction enumeration
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq)]
pub enum StreamDirection {
    /// Outgoing stream (sender perspective)
    Outgoing,
    /// Incoming stream (recipient perspective)
    Incoming,
}

/// Access control levels for treasury management
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq)]
pub enum AccessLevel {
    /// Full administrative access
    Admin,
    /// Can create and manage streams
    Manager,
    /// Can only view treasury information
    Viewer,
}

impl Default for AccessLevel {
    fn default() -> Self {
        AccessLevel::Viewer
    }
}

/// Common constants used across state modules
pub mod constants {
    /// Maximum number of recipients per stream
    pub const MAX_RECIPIENTS: usize = 100;
    
    /// Maximum number of vesting schedules per account
    pub const MAX_VESTING_SCHEDULES: usize = 50;
    
    /// Maximum number of treasury managers
    pub const MAX_TREASURY_MANAGERS: usize = 10;
    
    /// Minimum stream duration in seconds (1 minute)
    pub const MIN_STREAM_DURATION: u64 = 60;
    
    /// Maximum stream duration in seconds (10 years)
    pub const MAX_STREAM_DURATION: u64 = 315_360_000;
    
    /// Default cliff period in seconds (30 days)
    pub const DEFAULT_CLIFF_PERIOD: u64 = 2_592_000;
    
    /// Maximum number of custom vesting points
    pub const MAX_VESTING_POINTS: usize = 365;
    
    /// Precision for rate calculations (6 decimal places)
    pub const RATE_PRECISION: u64 = 1_000_000;
    
    /// Fee basis points (0.1% = 10 basis points)
    pub const DEFAULT_FEE_BASIS_POINTS: u16 = 10;
    
    /// Maximum fee basis points (10% = 1000 basis points)
    pub const MAX_FEE_BASIS_POINTS: u16 = 1000;
}

/// Utility functions for state management
pub mod utils {
    use super::*;
    
    /// Calculate the current timestamp
    pub fn current_timestamp() -> Result<u64> {
        Clock::get()
            .map(|clock| clock.unix_timestamp as u64)
            .map_err(|_| error!(ErrorCode::ClockError))
    }
    
    /// Validate timestamp is in the future
    pub fn validate_future_timestamp(timestamp: u64) -> Result<()> {
        let current = current_timestamp()?;
        require!(timestamp > current, ErrorCode::InvalidTimestamp);
        Ok(())
    }
    
    /// Validate timestamp is in the past
    pub fn validate_past_timestamp(timestamp: u64) -> Result<()> {
        let current = current_timestamp()?;
        require!(timestamp <= current, ErrorCode::InvalidTimestamp);
        Ok(())
    }
    
    /// Calculate percentage with precision
    pub fn calculate_percentage(amount: u64, percentage: u16) -> Result<u64> {
        require!(percentage <= 10000, ErrorCode::InvalidPercentage);
        Ok((amount as u128 * percentage as u128 / 10000) as u64)
    }
    
    /// Validate amount is greater than zero
    pub fn validate_amount(amount: u64) -> Result<()> {
        require!(amount > 0, ErrorCode::InvalidAmount);
        Ok(())
    }
    
    /// Validate duration is within acceptable range
    pub fn validate_duration(duration: u64) -> Result<()> {
        require!(
            duration >= constants::MIN_STREAM_DURATION && 
            duration <= constants::MAX_STREAM_DURATION,
            ErrorCode::InvalidDuration
        );
        Ok(())
    }
}

/// Custom error codes for state validation
#[error_code]
pub enum ErrorCode {
    #[msg("Clock error occurred")]
    ClockError,
    
    #[msg("Invalid timestamp provided")]
    InvalidTimestamp,
    
    #[msg("Invalid percentage value")]
    InvalidPercentage,
    
    #[msg("Invalid amount provided")]
    InvalidAmount,
    
    #[msg("Invalid duration provided")]
    InvalidDuration,
    
    #[msg("Stream is not active")]
    StreamNotActive,
    
    #[msg("Stream is already completed")]
    StreamCompleted,
    
    #[msg("Stream is paused")]
    StreamPaused,
    
    #[msg("Insufficient balance")]
    InsufficientBalance,
    
    #[msg("Unauthorized access")]
    Unauthorized,
    
    #[msg("Treasury is locked")]
    TreasuryLocked,
    
    #[msg("Vesting schedule not found")]
    VestingScheduleNotFound,
    
    #[msg("Invalid vesting configuration")]
    InvalidVestingConfig,
    
    #[msg("Maximum recipients exceeded")]
    MaxRecipientsExceeded,
    
    #[msg("Maximum vesting schedules exceeded")]
    MaxVestingSchedulesExceeded,
    
    #[msg("Invalid access level")]
    InvalidAccessLevel,
    
    #[msg("Stream cannot be modified")]
    StreamNotModifiable,
    
    #[msg("Treasury operation not allowed")]
    TreasuryOperationNotAllowed,
}
```