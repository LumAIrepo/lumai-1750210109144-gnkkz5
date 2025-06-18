```rust
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use std::mem::size_of;

declare_id!("11111111111111111111111111111112");

#[program]
pub mod streamflow {
    use super::*;

    pub fn create_stream(
        ctx: Context<CreateStream>,
        recipient: Pubkey,
        deposit_amount: u64,
        start_time: i64,
        end_time: i64,
        cliff_time: Option<i64>,
        cancelable_by_sender: bool,
        cancelable_by_recipient: bool,
        transferable_by_sender: bool,
        transferable_by_recipient: bool,
        automatic_withdrawal: bool,
        withdrawal_frequency: u64,
    ) -> Result<()> {
        require!(start_time < end_time, StreamError::InvalidTimeRange);
        require!(deposit_amount > 0, StreamError::InvalidAmount);
        
        if let Some(cliff) = cliff_time {
            require!(cliff >= start_time && cliff <= end_time, StreamError::InvalidCliffTime);
        }

        let stream = &mut ctx.accounts.stream;
        let clock = Clock::get()?;

        stream.sender = ctx.accounts.sender.key();
        stream.recipient = recipient;
        stream.mint = ctx.accounts.mint.key();
        stream.escrow_token_account = ctx.accounts.escrow_token_account.key();
        stream.deposit_amount = deposit_amount;
        stream.withdrawn_amount = 0;
        stream.start_time = start_time;
        stream.end_time = end_time;
        stream.cliff_time = cliff_time;
        stream.cancelable_by_sender = cancelable_by_sender;
        stream.cancelable_by_recipient = cancelable_by_recipient;
        stream.transferable_by_sender = transferable_by_sender;
        stream.transferable_by_recipient = transferable_by_recipient;
        stream.automatic_withdrawal = automatic_withdrawal;
        stream.withdrawal_frequency = withdrawal_frequency;
        stream.last_withdrawal_time = start_time;
        stream.canceled_at = None;
        stream.created_at = clock.unix_timestamp;
        stream.bump = *ctx.bumps.get("stream").unwrap();

        // Transfer tokens to escrow
        let cpi_accounts = Transfer {
            from: ctx.accounts.sender_token_account.to_account_info(),
            to: ctx.accounts.escrow_token_account.to_account_info(),
            authority: ctx.accounts.sender.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, deposit_amount)?;

        emit!(StreamCreated {
            stream: stream.key(),
            sender: stream.sender,
            recipient: stream.recipient,
            deposit_amount,
            start_time,
            end_time,
        });

        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        let stream = &mut ctx.accounts.stream;
        let clock = Clock::get()?;
        let current_time = clock.unix_timestamp;

        require!(!stream.is_canceled(), StreamError::StreamCanceled);
        require!(
            ctx.accounts.recipient.key() == stream.recipient,
            StreamError::UnauthorizedWithdrawal
        );

        let withdrawable_amount = stream.withdrawable_amount(current_time)?;
        require!(amount <= withdrawable_amount, StreamError::InsufficientFunds);

        stream.withdrawn_amount += amount;
        stream.last_withdrawal_time = current_time;

        // Transfer tokens from escrow to recipient
        let seeds = &[
            b"stream",
            stream.sender.as_ref(),
            stream.recipient.as_ref(),
            stream.mint.as_ref(),
            &[stream.bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow_token_account.to_account_info(),
            to: ctx.accounts.recipient_token_account.to_account_info(),
            authority: ctx.accounts.stream.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, amount)?;

        emit!(Withdrawal {
            stream: stream.key(),
            recipient: stream.recipient,
            amount,
            withdrawn_amount: stream.withdrawn_amount,
        });

        Ok(())
    }

    pub fn cancel_stream(ctx: Context<CancelStream>) -> Result<()> {
        let stream = &mut ctx.accounts.stream;
        let clock = Clock::get()?;
        let current_time = clock.unix_timestamp;

        require!(!stream.is_canceled(), StreamError::StreamAlreadyCanceled);

        let authority = ctx.accounts.authority.key();
        let can_cancel = (authority == stream.sender && stream.cancelable_by_sender) ||
                        (authority == stream.recipient && stream.cancelable_by_recipient);
        
        require!(can_cancel, StreamError::UnauthorizedCancellation);

        let withdrawable_amount = stream.withdrawable_amount(current_time)?;
        let remaining_amount = stream.deposit_amount - stream.withdrawn_amount;

        stream.canceled_at = Some(current_time);

        let seeds = &[
            b"stream",
            stream.sender.as_ref(),
            stream.recipient.as_ref(),
            stream.mint.as_ref(),
            &[stream.bump],
        ];
        let signer = &[&seeds[..]];

        // Transfer withdrawable amount to recipient if any
        if withdrawable_amount > 0 {
            let cpi_accounts = Transfer {
                from: ctx.accounts.escrow_token_account.to_account_info(),
                to: ctx.accounts.recipient_token_account.to_account_info(),
                authority: ctx.accounts.stream.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
            token::transfer(cpi_ctx, withdrawable_amount)?;

            stream.withdrawn_amount += withdrawable_amount;
        }

        // Return remaining amount to sender
        let return_amount = remaining_amount - withdrawable_amount;
        if return_amount > 0 {
            let cpi_accounts = Transfer {
                from: ctx.accounts.escrow_token_account.to_account_info(),
                to: ctx.accounts.sender_token_account.to_account_info(),
                authority: ctx.accounts.stream.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
            token::transfer(cpi_ctx, return_amount)?;
        }

        emit!(StreamCanceled {
            stream: stream.key(),
            sender: stream.sender,
            recipient: stream.recipient,
            canceled_at: current_time,
            withdrawn_amount: stream.withdrawn_amount,
            returned_amount: return_amount,
        });

        Ok(())
    }

    pub fn transfer_stream(ctx: Context<TransferStream>, new_recipient: Pubkey) -> Result<()> {
        let stream = &mut ctx.accounts.stream;
        
        require!(!stream.is_canceled(), StreamError::StreamCanceled);
        
        let authority = ctx.accounts.authority.key();
        let can_transfer = (authority == stream.sender && stream.transferable_by_sender) ||
                          (authority == stream.recipient && stream.transferable_by_recipient);
        
        require!(can_transfer, StreamError::UnauthorizedTransfer);

        let old_recipient = stream.recipient;
        stream.recipient = new_recipient;

        emit!(StreamTransferred {
            stream: stream.key(),
            old_recipient,
            new_recipient,
            transferred_by: authority,
        });

        Ok(())
    }

    pub fn update_stream(
        ctx: Context<UpdateStream>,
        cancelable_by_sender: Option<bool>,
        cancelable_by_recipient: Option<bool>,
        automatic_withdrawal: Option<bool>,
        withdrawal_frequency: Option<u64>,
    ) -> Result<()> {
        let stream = &mut ctx.accounts.stream;
        
        require!(!stream.is_canceled(), StreamError::StreamCanceled);
        require!(
            ctx.accounts.sender.key() == stream.sender,
            StreamError::UnauthorizedUpdate
        );

        if let Some(cancelable_sender) = cancelable_by_sender {
            stream.cancelable_by_sender = cancelable_sender;
        }
        if let Some(cancelable_recipient) = cancelable_by_recipient {
            stream.cancelable_by_recipient = cancelable_recipient;
        }
        if let Some(auto_withdrawal) = automatic_withdrawal {
            stream.automatic_withdrawal = auto_withdrawal;
        }
        if let Some(frequency) = withdrawal_frequency {
            stream.withdrawal_frequency = frequency;
        }

        emit!(StreamUpdated {
            stream: stream.key(),
            sender: stream.sender,
        });

        Ok(())
    }

    pub fn create_treasury(
        ctx: Context<CreateTreasury>,
        name: String,
        description: String,
        auto_close: bool,
    ) -> Result<()> {
        require!(name.len() <= 50, StreamError::NameTooLong);
        require!(description.len() <= 200, StreamError::DescriptionTooLong);

        let treasury = &mut ctx.accounts.treasury;
        let clock = Clock::get()?;

        treasury.authority = ctx.accounts.authority.key();
        treasury.name = name;
        treasury.description = description;
        treasury.auto_close = auto_close;
        treasury.total_streams = 0;
        treasury.active_streams = 0;
        treasury.total_deposited = 0;
        treasury.total_withdrawn = 0;
        treasury.created_at = clock.unix_timestamp;
        treasury.bump = *ctx.bumps.get("treasury").unwrap();

        emit!(TreasuryCreated {
            treasury: treasury.key(),
            authority: treasury.authority,
            name: treasury.name.clone(),
        });

        Ok(())
    }

    pub fn add_stream_to_treasury(ctx: Context<AddStreamToTreasury>) -> Result<()> {
        let treasury = &mut ctx.accounts.treasury;
        let stream = &ctx.accounts.stream;

        require!(
            ctx.accounts.authority.key() == treasury.authority,
            StreamError::UnauthorizedTreasuryAccess
        );
        require!(
            stream.sender == treasury.authority,
            StreamError::StreamNotOwnedByTreasury
        );

        treasury.total_streams += 1;
        if !stream.is_canceled() {
            treasury.active_streams += 1;
        }
        treasury.total_deposited += stream.deposit_amount;
        treasury.total_withdrawn += stream.withdrawn_amount;

        emit!(StreamAddedToTreasury {
            treasury: treasury.key(),
            stream: stream.key(),
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateStream<'info> {
    #[account(
        init,
        payer = sender,
        space = 8 + size_of::<Stream>(),
        seeds = [b"stream", sender.key().as_ref(), recipient.as_ref(), mint.key().as_ref()],
        bump
    )]
    pub stream: Account<'info, Stream>,
    
    #[account(mut)]
    pub sender: Signer<'info>,
    
    /// CHECK: Recipient address validation handled in instruction
    pub recipient: UncheckedAccount<'info>,
    
    pub mint: Account<'info, anchor_spl::token::Mint>,
    
    #[account(
        mut,
        constraint = sender_token_account.mint == mint.key(),
        constraint = sender_token_account.owner == sender.key()
    )]
    pub sender_token_account: Account<'info, TokenAccount>,
    
    #[account(
        init,
        payer = sender,
        token::mint = mint,
        token::authority = stream,
        seeds = [b"escrow", stream.key().as_ref()],
        bump
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub stream: Account<'info, Stream>,
    
    pub recipient: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"escrow", stream.key().as_ref()],
        bump
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = recipient_token_account.mint == stream.mint,
        constraint = recipient_token_account.owner == recipient.key()
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CancelStream<'info> {
    #[account(mut)]
    pub stream: Account<'info, Stream>,
    
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"escrow", stream.key().as_ref()],
        bump
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = sender_token_account.mint == stream.mint
    )]
    pub sender_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = recipient_token_account.mint == stream.mint
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct TransferStream<'info> {
    #[account(mut)]
    pub stream: Account<'info, Stream>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateStream<'info> {
    #[account(mut)]
    pub stream: Account<'info, Stream>,
    
    pub sender: Signer<'info>,
}

#[derive(Accounts)]
pub struct CreateTreasury<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + size_of::<Treasury>(),
        seeds = [b"treasury", authority.key().as_ref()],
        bump
    )]
    pub treasury: Account<'info, Treasury>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]