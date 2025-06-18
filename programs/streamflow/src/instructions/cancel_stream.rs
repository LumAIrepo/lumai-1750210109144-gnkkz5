```rust
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::errors::StreamError;
use crate::state::{Stream, StreamStatus};

#[derive(Accounts)]
pub struct CancelStream<'info> {
    #[account(
        mut,
        seeds = [
            b"stream",
            stream.sender.as_ref(),
            stream.recipient.as_ref(),
            &stream.start_time.to_le_bytes(),
        ],
        bump = stream.bump,
        constraint = stream.status == StreamStatus::Active @ StreamError::StreamNotActive,
        constraint = stream.sender == sender.key() @ StreamError::Unauthorized,
    )]
    pub stream: Account<'info, Stream>,

    #[account(mut)]
    pub sender: Signer<'info>,

    /// CHECK: This is the recipient account, validated in stream state
    #[account(
        constraint = recipient.key() == stream.recipient @ StreamError::InvalidRecipient
    )]
    pub recipient: AccountInfo<'info>,

    #[account(
        mut,
        constraint = sender_token_account.mint == stream.mint @ StreamError::InvalidMint,
        constraint = sender_token_account.owner == sender.key() @ StreamError::InvalidTokenAccount,
    )]
    pub sender_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = recipient_token_account.mint == stream.mint @ StreamError::InvalidMint,
        constraint = recipient_token_account.owner == recipient.key() @ StreamError::InvalidTokenAccount,
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [
            b"escrow",
            stream.key().as_ref(),
        ],
        bump = stream.escrow_bump,
        constraint = escrow_token_account.mint == stream.mint @ StreamError::InvalidMint,
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

impl<'info> CancelStream<'info> {
    pub fn transfer_to_recipient_ctx(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.escrow_token_account.to_account_info(),
            to: self.recipient_token_account.to_account_info(),
            authority: self.stream.to_account_info(),
        };
        CpiContext::new(self.token_program.to_account_info(), cpi_accounts)
    }

    pub fn transfer_to_sender_ctx(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.escrow_token_account.to_account_info(),
            to: self.sender_token_account.to_account_info(),
            authority: self.stream.to_account_info(),
        };
        CpiContext::new(self.token_program.to_account_info(), cpi_accounts)
    }
}

pub fn cancel_stream(ctx: Context<CancelStream>) -> Result<()> {
    let stream = &mut ctx.accounts.stream;
    let current_time = Clock::get()?.unix_timestamp;

    // Ensure stream is active
    require!(
        stream.status == StreamStatus::Active,
        StreamError::StreamNotActive
    );

    // Calculate how much should be streamed to recipient
    let streamed_amount = if current_time >= stream.end_time {
        // Stream has completed, recipient gets full amount
        stream.amount
    } else if current_time <= stream.start_time {
        // Stream hasn't started, recipient gets nothing
        0
    } else {
        // Calculate proportional amount based on time elapsed
        let elapsed_time = current_time - stream.start_time;
        let total_duration = stream.end_time - stream.start_time;
        
        // Use u128 to prevent overflow during multiplication
        let streamed = (stream.amount as u128)
            .checked_mul(elapsed_time as u128)
            .ok_or(StreamError::MathOverflow)?
            .checked_div(total_duration as u128)
            .ok_or(StreamError::MathOverflow)?;
        
        streamed as u64
    };

    let remaining_amount = stream.amount
        .checked_sub(streamed_amount)
        .ok_or(StreamError::MathOverflow)?;

    // Transfer streamed amount to recipient if any
    if streamed_amount > 0 {
        let stream_key = stream.key();
        let seeds = &[
            b"stream",
            stream.sender.as_ref(),
            stream.recipient.as_ref(),
            &stream.start_time.to_le_bytes(),
            &[stream.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        token::transfer(
            ctx.accounts
                .transfer_to_recipient_ctx()
                .with_signer(signer_seeds),
            streamed_amount,
        )?;

        msg!("Transferred {} tokens to recipient", streamed_amount);
    }

    // Transfer remaining amount back to sender if any
    if remaining_amount > 0 {
        let stream_key = stream.key();
        let seeds = &[
            b"stream",
            stream.sender.as_ref(),
            stream.recipient.as_ref(),
            &stream.start_time.to_le_bytes(),
            &[stream.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        token::transfer(
            ctx.accounts
                .transfer_to_sender_ctx()
                .with_signer(signer_seeds),
            remaining_amount,
        )?;

        msg!("Returned {} tokens to sender", remaining_amount);
    }

    // Update stream status
    stream.status = StreamStatus::Cancelled;
    stream.cancelled_at = Some(current_time);
    stream.withdrawn_amount = streamed_amount;

    emit!(StreamCancelledEvent {
        stream: stream.key(),
        sender: stream.sender,
        recipient: stream.recipient,
        mint: stream.mint,
        streamed_amount,
        returned_amount: remaining_amount,
        cancelled_at: current_time,
    });

    msg!(
        "Stream cancelled - Streamed: {}, Returned: {}",
        streamed_amount,
        remaining_amount
    );

    Ok(())
}

#[event]
pub struct StreamCancelledEvent {
    pub stream: Pubkey,
    pub sender: Pubkey,
    pub recipient: Pubkey,
    pub mint: Pubkey,
    pub streamed_amount: u64,
    pub returned_amount: u64,
    pub cancelled_at: i64,
}
```