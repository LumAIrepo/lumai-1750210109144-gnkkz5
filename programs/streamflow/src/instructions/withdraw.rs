```rust
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::*;
use crate::errors::StreamError;

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(
        mut,
        seeds = [
            b"stream",
            stream.sender.as_ref(),
            stream.recipient.as_ref(),
            &stream.start_time.to_le_bytes(),
        ],
        bump = stream.bump,
        has_one = sender,
        has_one = recipient,
        has_one = mint,
        constraint = stream.is_active @ StreamError::StreamNotActive,
    )]
    pub stream: Account<'info, Stream>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = stream,
    )]
    pub stream_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = recipient,
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,

    /// CHECK: This is the mint of the token being streamed
    pub mint: AccountInfo<'info>,

    #[account(mut)]
    pub recipient: Signer<'info>,

    /// CHECK: This is the sender of the stream
    pub sender: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

impl<'info> Withdraw<'info> {
    pub fn transfer_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.stream_token_account.to_account_info(),
                to: self.recipient_token_account.to_account_info(),
                authority: self.stream.to_account_info(),
            },
        )
    }
}

pub fn handler(ctx: Context<Withdraw>, amount: Option<u64>) -> Result<()> {
    let stream = &mut ctx.accounts.stream;
    let clock = Clock::get()?;
    let current_time = clock.unix_timestamp;

    // Calculate withdrawable amount
    let withdrawable_amount = stream.calculate_withdrawable_amount(current_time)?;
    
    require!(withdrawable_amount > 0, StreamError::NoTokensToWithdraw);

    // Determine actual withdrawal amount
    let withdrawal_amount = match amount {
        Some(requested_amount) => {
            require!(
                requested_amount <= withdrawable_amount,
                StreamError::InsufficientWithdrawableBalance
            );
            requested_amount
        }
        None => withdrawable_amount,
    };

    // Update stream state
    stream.withdrawn_amount = stream.withdrawn_amount
        .checked_add(withdrawal_amount)
        .ok_or(StreamError::MathOverflow)?;

    stream.last_withdrawn_at = current_time;

    // Check if stream is fully withdrawn
    if stream.withdrawn_amount >= stream.deposited_amount {
        stream.is_active = false;
        stream.end_time = Some(current_time);
    }

    // Transfer tokens from stream account to recipient
    let seeds = &[
        b"stream",
        stream.sender.as_ref(),
        stream.recipient.as_ref(),
        &stream.start_time.to_le_bytes(),
        &[stream.bump],
    ];
    let signer_seeds = &[&seeds[..]];

    token::transfer(
        ctx.accounts.transfer_context().with_signer(signer_seeds),
        withdrawal_amount,
    )?;

    // Emit withdrawal event
    emit!(WithdrawEvent {
        stream: ctx.accounts.stream.key(),
        recipient: ctx.accounts.recipient.key(),
        amount: withdrawal_amount,
        timestamp: current_time,
        remaining_balance: stream.deposited_amount
            .checked_sub(stream.withdrawn_amount)
            .unwrap_or(0),
    });

    msg!(
        "Withdrawn {} tokens from stream. Remaining balance: {}",
        withdrawal_amount,
        stream.deposited_amount.checked_sub(stream.withdrawn_amount).unwrap_or(0)
    );

    Ok(())
}

#[event]
pub struct WithdrawEvent {
    pub stream: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
    pub remaining_balance: u64,
}

impl Stream {
    pub fn calculate_withdrawable_amount(&self, current_time: i64) -> Result<u64> {
        // If stream hasn't started yet
        if current_time < self.start_time {
            return Ok(0);
        }

        // If stream has ended or is cancelled
        if let Some(end_time) = self.end_time {
            if current_time >= end_time {
                return Ok(self.deposited_amount.checked_sub(self.withdrawn_amount).unwrap_or(0));
            }
        }

        // Calculate based on stream type
        let total_streamable = match self.stream_type {
            StreamType::Linear => {
                self.calculate_linear_amount(current_time)?
            }
            StreamType::Cliff => {
                self.calculate_cliff_amount(current_time)?
            }
            StreamType::Unlock => {
                self.calculate_unlock_amount(current_time)?
            }
        };

        // Subtract already withdrawn amount
        let withdrawable = total_streamable
            .checked_sub(self.withdrawn_amount)
            .unwrap_or(0);

        Ok(withdrawable)
    }

    fn calculate_linear_amount(&self, current_time: i64) -> Result<u64> {
        let duration = self.duration;
        let elapsed_time = current_time.checked_sub(self.start_time).unwrap_or(0);
        
        if elapsed_time <= 0 {
            return Ok(0);
        }

        if elapsed_time >= duration {
            return Ok(self.deposited_amount);
        }

        let streamed_amount = (self.deposited_amount as u128)
            .checked_mul(elapsed_time as u128)
            .ok_or(StreamError::MathOverflow)?
            .checked_div(duration as u128)
            .ok_or(StreamError::MathOverflow)? as u64;

        Ok(streamed_amount)
    }

    fn calculate_cliff_amount(&self, current_time: i64) -> Result<u64> {
        let cliff_time = self.start_time
            .checked_add(self.cliff_duration.unwrap_or(0))
            .ok_or(StreamError::MathOverflow)?;

        if current_time < cliff_time {
            return Ok(0);
        }

        // After cliff, calculate linear vesting
        let post_cliff_duration = self.duration
            .checked_sub(self.cliff_duration.unwrap_or(0))
            .ok_or(StreamError::MathOverflow)?;

        let elapsed_since_cliff = current_time.checked_sub(cliff_time).unwrap_or(0);

        if elapsed_since_cliff >= post_cliff_duration {
            return Ok(self.deposited_amount);
        }

        let cliff_amount = self.cliff_amount.unwrap_or(0);
        let remaining_amount = self.deposited_amount
            .checked_sub(cliff_amount)
            .ok_or(StreamError::MathOverflow)?;

        let vested_post_cliff = (remaining_amount as u128)
            .checked_mul(elapsed_since_cliff as u128)
            .ok_or(StreamError::MathOverflow)?
            .checked_div(post_cliff_duration as u128)
            .ok_or(StreamError::MathOverflow)? as u64;

        let total_vested = cliff_amount
            .checked_add(vested_post_cliff)
            .ok_or(StreamError::MathOverflow)?;

        Ok(total_vested)
    }

    fn calculate_unlock_amount(&self, current_time: i64) -> Result<u64> {
        if let Some(unlock_schedule) = &self.unlock_schedule {
            let mut total_unlocked = 0u64;

            for unlock in unlock_schedule {
                let unlock_time = self.start_time
                    .checked_add(unlock.time_offset)
                    .ok_or(StreamError::MathOverflow)?;

                if current_time >= unlock_time {
                    total_unlocked = total_unlocked
                        .checked_add(unlock.amount)
                        .ok_or(StreamError::MathOverflow)?;
                }
            }

            Ok(total_unlocked.min(self.deposited_amount))
        } else {
            // Fallback to linear if no unlock schedule
            self.calculate_linear_amount(current_time)
        }
    }
}
```