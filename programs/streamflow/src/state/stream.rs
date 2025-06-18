```rust
use anchor_lang::prelude::*;
use anchor_spl::token::Mint;

#[account]
#[derive(Debug)]
pub struct Stream {
    /// The authority that can modify the stream
    pub sender: Pubkey,
    /// The recipient of the stream
    pub recipient: Pubkey,
    /// The mint of the token being streamed
    pub mint: Pubkey,
    /// The escrow token account holding the funds
    pub escrow_tokens: Pubkey,
    /// The amount of tokens deposited in the stream
    pub deposited_amount: u64,
    /// The amount of tokens withdrawn from the stream
    pub withdrawn_amount: u64,
    /// The start time of the stream (Unix timestamp)
    pub start_time: i64,
    /// The end time of the stream (Unix timestamp)
    pub end_time: i64,
    /// The cliff time (Unix timestamp) - tokens are locked until this time
    pub cliff_time: i64,
    /// Whether the stream can be cancelled by the sender
    pub cancelable_by_sender: bool,
    /// Whether the stream can be cancelled by the recipient
    pub cancelable_by_recipient: bool,
    /// Whether automatic withdrawal is enabled
    pub automatic_withdrawal: bool,
    /// The rate of tokens per second
    pub rate_amount: u64,
    /// The interval for rate calculation (in seconds)
    pub rate_interval_in_seconds: u64,
    /// Whether the stream has been cancelled
    pub cancelled: bool,
    /// The time when the stream was cancelled
    pub cancelled_at: i64,
    /// The authority that cancelled the stream
    pub cancelled_by: Pubkey,
    /// Whether the stream has been closed
    pub closed: bool,
    /// The time when the stream was closed
    pub closed_at: i64,
    /// The current pause state of the stream
    pub paused: bool,
    /// The time when the stream was paused
    pub paused_at: i64,
    /// Total time the stream has been paused
    pub total_paused_time: i64,
    /// The last time the stream was updated
    pub last_withdrawn_at: i64,
    /// The name/description of the stream
    pub name: [u8; 64],
    /// Additional metadata
    pub metadata: [u8; 128],
    /// The bump seed for the PDA
    pub bump: u8,
    /// Reserved space for future upgrades
    pub _reserved: [u8; 256],
}

impl Stream {
    pub const LEN: usize = 8 + // discriminator
        32 + // sender
        32 + // recipient
        32 + // mint
        32 + // escrow_tokens
        8 + // deposited_amount
        8 + // withdrawn_amount
        8 + // start_time
        8 + // end_time
        8 + // cliff_time
        1 + // cancelable_by_sender
        1 + // cancelable_by_recipient
        1 + // automatic_withdrawal
        8 + // rate_amount
        8 + // rate_interval_in_seconds
        1 + // cancelled
        8 + // cancelled_at
        32 + // cancelled_by
        1 + // closed
        8 + // closed_at
        1 + // paused
        8 + // paused_at
        8 + // total_paused_time
        8 + // last_withdrawn_at
        64 + // name
        128 + // metadata
        1 + // bump
        256; // _reserved

    /// Calculate the amount of tokens that can be withdrawn at the current time
    pub fn withdrawable_amount(&self, current_time: i64) -> Result<u64> {
        if self.cancelled || self.closed {
            return Ok(0);
        }

        if current_time < self.cliff_time {
            return Ok(0);
        }

        let effective_start_time = std::cmp::max(self.start_time, self.cliff_time);
        let effective_current_time = if self.paused {
            self.paused_at
        } else {
            std::cmp::min(current_time, self.end_time)
        };

        if effective_current_time <= effective_start_time {
            return Ok(0);
        }

        let elapsed_time = effective_current_time - effective_start_time - self.total_paused_time;
        
        if elapsed_time <= 0 {
            return Ok(0);
        }

        let total_intervals = elapsed_time as u64 / self.rate_interval_in_seconds;
        let streamed_amount = total_intervals * self.rate_amount;
        
        let available_amount = std::cmp::min(streamed_amount, self.deposited_amount);
        
        Ok(available_amount.saturating_sub(self.withdrawn_amount))
    }

    /// Calculate the total amount that has been streamed so far
    pub fn streamed_amount(&self, current_time: i64) -> Result<u64> {
        if current_time < self.cliff_time {
            return Ok(0);
        }

        let effective_start_time = std::cmp::max(self.start_time, self.cliff_time);
        let effective_current_time = if self.paused {
            self.paused_at
        } else {
            std::cmp::min(current_time, self.end_time)
        };

        if effective_current_time <= effective_start_time {
            return Ok(0);
        }

        let elapsed_time = effective_current_time - effective_start_time - self.total_paused_time;
        
        if elapsed_time <= 0 {
            return Ok(0);
        }

        let total_intervals = elapsed_time as u64 / self.rate_interval_in_seconds;
        let streamed_amount = total_intervals * self.rate_amount;
        
        Ok(std::cmp::min(streamed_amount, self.deposited_amount))
    }

    /// Check if the stream is active (not cancelled, closed, or paused)
    pub fn is_active(&self) -> bool {
        !self.cancelled && !self.closed && !self.paused
    }

    /// Check if the stream has completed
    pub fn is_completed(&self, current_time: i64) -> bool {
        current_time >= self.end_time && self.withdrawn_amount >= self.deposited_amount
    }

    /// Get the remaining balance in the stream
    pub fn remaining_balance(&self) -> u64 {
        self.deposited_amount.saturating_sub(self.withdrawn_amount)
    }

    /// Calculate the stream progress as a percentage (0-100)
    pub fn progress_percentage(&self, current_time: i64) -> Result<u8> {
        if self.deposited_amount == 0 {
            return Ok(0);
        }

        let streamed = self.streamed_amount(current_time)?;
        let percentage = (streamed * 100) / self.deposited_amount;
        
        Ok(std::cmp::min(percentage, 100) as u8)
    }

    /// Get the effective duration of the stream (excluding paused time)
    pub fn effective_duration(&self) -> i64 {
        let total_duration = self.end_time - self.start_time;
        total_duration - self.total_paused_time
    }

    /// Check if the stream can be cancelled by the given authority
    pub fn can_cancel(&self, authority: &Pubkey) -> bool {
        if self.cancelled || self.closed {
            return false;
        }

        (self.cancelable_by_sender && *authority == self.sender) ||
        (self.cancelable_by_recipient && *authority == self.recipient)
    }

    /// Validate stream parameters
    pub fn validate_params(
        start_time: i64,
        end_time: i64,
        cliff_time: i64,
        deposited_amount: u64,
        rate_amount: u64,
        rate_interval_in_seconds: u64,
    ) -> Result<()> {
        require!(start_time < end_time, StreamError::InvalidTimeRange);
        require!(cliff_time >= start_time, StreamError::InvalidCliffTime);
        require!(cliff_time <= end_time, StreamError::InvalidCliffTime);
        require!(deposited_amount > 0, StreamError::InvalidAmount);
        require!(rate_amount > 0, StreamError::InvalidRate);
        require!(rate_interval_in_seconds > 0, StreamError::InvalidRateInterval);

        // Ensure the rate doesn't exceed the total amount
        let total_duration = end_time - start_time;
        let total_intervals = total_duration as u64 / rate_interval_in_seconds;
        let total_streamable = total_intervals * rate_amount;
        
        require!(
            total_streamable >= deposited_amount,
            StreamError::RateTooLow
        );

        Ok(())
    }
}

#[error_code]
pub enum StreamError {
    #[msg("Invalid time range: start time must be before end time")]
    InvalidTimeRange,
    #[msg("Invalid cliff time: must be between start and end time")]
    InvalidCliffTime,
    #[msg("Invalid amount: must be greater than zero")]
    InvalidAmount,
    #[msg("Invalid rate: must be greater than zero")]
    InvalidRate,
    #[msg("Invalid rate interval: must be greater than zero")]
    InvalidRateInterval,
    #[msg("Rate too low: cannot stream the full amount in the given time")]
    RateTooLow,
    #[msg("Stream is not active")]
    StreamNotActive,
    #[msg("Stream is already cancelled")]
    StreamAlreadyCancelled,
    #[msg("Stream is already closed")]
    StreamAlreadyClosed,
    #[msg("Insufficient withdrawable amount")]
    InsufficientWithdrawableAmount,
    #[msg("Unauthorized: cannot perform this action")]
    Unauthorized,
    #[msg("Stream is paused")]
    StreamPaused,
    #[msg("Stream is not paused")]
    StreamNotPaused,
    #[msg("Cannot cancel stream: not cancelable by this authority")]
    NotCancelable,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub struct StreamData {
    pub sender: Pubkey,
    pub recipient: Pubkey,
    pub mint: Pubkey,
    pub deposited_amount: u64,
    pub withdrawn_amount: u64,
    pub start_time: i64,
    pub end_time: i64,
    pub cliff_time: i64,
    pub cancelable_by_sender: bool,
    pub cancelable_by_recipient: bool,
    pub automatic_withdrawal: bool,
    pub rate_amount: u64,
    pub rate_interval_in_seconds: u64,
    pub name: String,
    pub paused: bool,
    pub cancelled: bool,
}

impl From<&Stream> for StreamData {
    fn from(stream: &Stream) -> Self {
        let name = String::from_utf8_lossy(&stream.name)
            .trim_end_matches('\0')
            .to_string();

        Self {
            sender: stream.sender,
            recipient: stream.recipient,
            mint: stream.mint,
            deposited_amount: stream.deposited_amount,
            withdrawn_amount: stream.withdrawn_amount,
            start_time: stream.start_time,
            end_time: stream.end_time,
            cliff_time: stream.cliff_time,
            cancelable_by_sender: stream.cancelable_by_sender,
            cancelable_by_recipient: stream.cancelable_by_recipient,
            automatic_withdrawal: stream.automatic_withdrawal,
            rate_amount: stream.rate_amount,
            rate_interval_in_seconds: stream.rate_interval_in_seconds,
            name,
            paused: stream.paused,
            cancelled: stream.cancelled,
        }
    }
}
```