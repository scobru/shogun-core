import { GunDB } from "./gun";
/**
 * Result of a vote
 */
interface VoteResult {
    approved: boolean;
    approvalCount: number;
    rejectionCount: number;
    totalVotes: number;
}
/**
 * Consensus configuration
 */
interface ConsensusConfig {
    threshold: number;
    timeWindow: number;
    minVotes: number;
}
/**
 * Implements a distributed consensus system for Gun
 * Useful for decentralized applications that require
 * consensus among multiple participants
 */
export declare class GunConsensus {
    private gun;
    private config;
    /**
     * Initializes a new consensus system
     * @param gun - GunDB instance
     * @param config - Consensus configuration
     */
    constructor(gun: GunDB, config?: Partial<ConsensusConfig>);
    /**
     * Proposes an operation that requires consensus
     * @param topic - Topic of the proposal
     * @param data - Proposal data
     * @param metadata - Additional metadata
     * @returns Proposal ID
     */
    proposeChange(topic: string, data: any, metadata?: any): Promise<string>;
    /**
     * Vote on an existing proposal
     * @param proposalId - Proposal ID
     * @param approve - True to approve, false to reject
     * @param comment - Optional comment
     * @returns Operation result
     */
    vote(proposalId: string, approve: boolean, comment?: string): Promise<boolean>;
    /**
     * Gets a proposal by ID
     * @param proposalId - Proposal ID
     * @returns The proposal or null
     */
    getProposal(proposalId: string): Promise<any>;
    /**
     * Gets a user's vote on a proposal
     * @param proposalId - Proposal ID
     * @param userPub - User's public key
     * @returns The vote or null
     */
    private getUserVote;
    /**
     * Updates a proposal's status based on votes
     * @param proposalId - Proposal ID
     */
    private updateProposalStatus;
    /**
     * Counts votes for a proposal
     * @param proposalId - Proposal ID
     * @returns Vote count result
     */
    countVotes(proposalId: string): Promise<VoteResult>;
    /**
     * Finalizes a proposal by updating its status
     * @param proposalId - Proposal ID
     * @param status - New status
     */
    private finalizeProposal;
    /**
     * Generates a unique ID
     * @returns Unique ID
     */
    private generateId;
}
export {};
