```rust
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::*;
use crate::errors::StreamFlowError;

#[derive(Accounts)]
#[instruction(
    recipient: Pubkey,
    deposit_amount: u64,
    start_time: i64,
    end_time: i64,
    cliff_time: i64,
    cliff_amount: u64,
    cancelable_by_sender: bool,
    cancelable_by_recipient: bool,
    transferable_by_sender: bool,
    transferable_by_recipient: bool,
    stream_name: String,
)]
pub struct CreateStream<'info> {
    #[account(
        init,
        payer = sender,
        space = Stream::LEN,
        seeds = [
            b"stream",
            sender.key().as_ref(),
            recipient.as_ref(),
            stream_name.as_bytes(),
        ],
        bump
    )]
    pub stream: Account<'info, Stream>,

    #[account(
        init,
        payer = sender,
        token::mint = mint,
        token::authority = stream,
        seeds = [
            b"escrow",
            stream.key().as_ref(),
        ],
        bump
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = sender_token_account.mint == mint.key(),
        constraint = sender_token_account.owner == sender.key(),
        constraint = sender_token_account.amount >= deposit_amount @ StreamFlowError::InsufficientFunds
    )]
    pub sender_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub sender: Signer<'info>,

    /// CHECK: This is the recipient's public key, validated in instruction logic
    pub recipient: UncheckedAccount<'info>,

    pub mint: Account<'info, anchor_spl::token::Mint>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn create_stream(
    ctx: Context<CreateStream>,
    recipient: Pubkey,
    deposit_amount: u64,
    start_time: i64,
    end_time: i64,
    cliff_time: i64,
    cliff_amount: u64,
    cancelable_by_sender: bool,
    cancelable_by_recipient: bool,
    transferable_by_sender: bool,
    transferable_by_recipient: bool,
    stream_name: String,
) -> Result<()> {
    let clock = Clock::get()?;
    let current_time = clock.unix_timestamp;

    // Validation checks
    require!(
        deposit_amount > 0,
        StreamFlowError::InvalidDepositAmount
    );

    require!(
        start_time >= current_time,
        StreamFlowError::InvalidStartTime
    );

    require!(
        end_time > start_time,
        StreamFlowError::InvalidEndTime
    );

    require!(
        cliff_time >= start_time && cliff_time <= end_time,
        StreamFlowError::InvalidCliffTime
    );

    require!(
        cliff_amount <= deposit_amount,
        StreamFlowError::InvalidCliffAmount
    );

    require!(
        stream_name.len() <= 64,
        StreamFlowError::StreamNameTooLong
    );

    require!(
        recipient != ctx.accounts.sender.key(),
        StreamFlowError::SenderCannotBeRecipient
    );

    // Calculate stream rate (tokens per second)
    let duration = end_time - start_time;
    let stream_rate = if duration > 0 {
        deposit_amount.checked_div(duration as u64).unwrap_or(0)
    } else {
        0
    };

    // Initialize stream account
    let stream = &mut ctx.accounts.stream;
    stream.sender = ctx.accounts.sender.key();
    stream.recipient = recipient;
    stream.mint = ctx.accounts.mint.key();
    stream.escrow_token_account = ctx.accounts.escrow_token_account.key();
    stream.deposit_amount = deposit_amount;
    stream.withdrawn_amount = 0;
    stream.start_time = start_time;
    stream.end_time = end_time;
    stream.cliff_time = cliff_time;
    stream.cliff_amount = cliff_amount;
    stream.rate = stream_rate;
    stream.cancelable_by_sender = cancelable_by_sender;
    stream.cancelable_by_recipient = cancelable_by_recipient;
    stream.transferable_by_sender = transferable_by_sender;
    stream.transferable_by_recipient = transferable_by_recipient;
    stream.stream_name = stream_name.clone();
    stream.created_at = current_time;
    stream.canceled_at = None;
    stream.canceled_by = None;
    stream.paused = false;
    stream.paused_at = None;
    stream.bump = ctx.bumps.stream;
    stream.escrow_bump = ctx.bumps.escrow_token_account;

    // Transfer tokens from sender to escrow
    let transfer_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.sender_token_account.to_account_info(),
            to: ctx.accounts.escrow_token_account.to_account_info(),
            authority: ctx.accounts.sender.to_account_info(),
        },
    );

    token::transfer(transfer_ctx, deposit_amount)?;

    // Emit event
    emit!(StreamCreated {
        stream: stream.key(),
        sender: ctx.accounts.sender.key(),
        recipient,
        mint: ctx.accounts.mint.key(),
        deposit_amount,
        start_time,
        end_time,
        cliff_time,
        cliff_amount,
        rate: stream_rate,
        stream_name,
        created_at: current_time,
    });

    msg!(
        "Stream created: {} tokens from {} to {} over {} seconds",
        deposit_amount,
        ctx.accounts.sender.key(),
        recipient,
        duration
    );

    Ok(())
}

#[event]
pub struct StreamCreated {
    pub stream: Pubkey,
    pub sender: Pubkey,
    pub recipient: Pubkey,
    pub mint: Pubkey,
    pub deposit_amount: u64,
    pub start_time: i64,
    pub end_time: i64,
    pub cliff_time: i64,
    pub cliff_amount: u64,
    pub rate: u64,
    pub stream_name: String,
    pub created_at: i64,
}
```