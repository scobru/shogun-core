import { GunDB } from "./gun";
import { sign, verify } from "./encryption";

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
  threshold: number; // Percentage of votes needed for approval (0-1)
  timeWindow: number; // Time window for voting in ms
  minVotes: number; // Minimum number of votes required
}

/**
 * Interfaces for typing data
 */
interface SignedData {
  proposer?: string;
  voter?: string;
  [key: string]: any;
}

/**
 * Interface for Gun acknowledgment
 */
interface GunAck {
  err?: string;
  [key: string]: any;
}

/**
 * Implements a distributed consensus system for Gun
 * Useful for decentralized applications that require
 * consensus among multiple participants
 */
export class GunConsensus {
  private gun: GunDB;
  private config: ConsensusConfig;

  /**
   * Initializes a new consensus system
   * @param gun - GunDB instance
   * @param config - Consensus configuration
   */
  constructor(gun: GunDB, config: Partial<ConsensusConfig> = {}) {
    this.gun = gun;

    // Default configuration
    this.config = {
      threshold: config.threshold ?? 0.51, // Simple majority
      timeWindow: config.timeWindow ?? 60000, // 1 minute
      minVotes: config.minVotes ?? 3,
    };
  }

  /**
   * Proposes an operation that requires consensus
   * @param topic - Topic of the proposal
   * @param data - Proposal data
   * @param metadata - Additional metadata
   * @returns Proposal ID
   */
  async proposeChange(
    topic: string,
    data: any,
    metadata: any = {},
  ): Promise<string> {
    if (!this.gun.isLoggedIn()) {
      throw new Error("You must be authenticated to propose changes");
    }

    const userPub = this.gun.getCurrentUser()?.pub;
    if (!userPub) {
      throw new Error("Public key not available");
    }

    // Create proposal
    const proposalId = this.generateId();
    const timestamp = Date.now();

    const proposal = {
      id: proposalId,
      topic,
      data,
      metadata,
      proposer: userPub,
      timestamp,
      expiresAt: timestamp + this.config.timeWindow,
      status: "pending",
    };

    // Sign proposal with user's key
    const pair = this.gun.getCurrentUser()?.user._.sea;
    if (!pair) {
      throw new Error("Key pair not available");
    }

    const signedProposal = await sign(proposal, pair);

    // Save proposal
    return new Promise((resolve, reject) => {
      this.gun
        .get("consensus")
        .get("proposals")
        .get(proposalId)
        .put(signedProposal, (ack: GunAck) => {
          if (ack.err) {
            reject(new Error(ack.err));
            return;
          }
          resolve(proposalId);
        });
    });
  }

  /**
   * Vote on an existing proposal
   * @param proposalId - Proposal ID
   * @param approve - True to approve, false to reject
   * @param comment - Optional comment
   * @returns Operation result
   */
  async vote(
    proposalId: string,
    approve: boolean,
    comment: string = "",
  ): Promise<boolean> {
    if (!this.gun.isLoggedIn()) {
      throw new Error("You must be authenticated to vote");
    }

    const userPub = this.gun.getCurrentUser()?.pub;
    if (!userPub) {
      throw new Error("Public key not available");
    }

    // Check if proposal exists
    const proposal = await this.getProposal(proposalId);
    if (!proposal) {
      throw new Error("Proposal not found");
    }

    // Check if proposal is still valid
    if (proposal.expiresAt < Date.now()) {
      throw new Error("Proposal expired");
    }

    // Check if user has already voted
    const existingVote = await this.getUserVote(proposalId, userPub);
    if (existingVote) {
      throw new Error("You have already voted on this proposal");
    }

    // Create vote
    const vote = {
      voter: userPub,
      approve,
      comment,
      timestamp: Date.now(),
    };

    // Sign vote
    const pair = this.gun.getCurrentUser()?.user._.sea;
    if (!pair) {
      throw new Error("Key pair not available");
    }

    const signedVote = await sign(vote, pair);

    // Save vote
    return new Promise((resolve, reject) => {
      this.gun
        .get("consensus")
        .get("proposals")
        .get(proposalId)
        .get("votes")
        .get(userPub)
        .put(signedVote, (ack: GunAck) => {
          if (ack.err) {
            reject(new Error(ack.err));
            return;
          }

          // Update proposal status
          this.updateProposalStatus(proposalId)
            .then(() => resolve(true))
            .catch(reject);
        });
    });
  }

  /**
   * Gets a proposal by ID
   * @param proposalId - Proposal ID
   * @returns The proposal or null
   */
  async getProposal(proposalId: string): Promise<any> {
    return new Promise((resolve) => {
      this.gun
        .get("consensus")
        .get("proposals")
        .get(proposalId)
        .once((data: any) => {
          if (!data) {
            resolve(null);
            return;
          }

          try {
            // Verify proposal signature
            // We need to parse the data first if it's an object
            const signedData =
              typeof data === "string" ? JSON.parse(data) : data;
            const pubKey = signedData.proposer;

            if (!pubKey) {
              console.warn("Proposal without public key:", proposalId);
              resolve(null);
              return;
            }

            verify(data, pubKey)
              .then((verified) => {
                if (verified) {
                  resolve(verified);
                } else {
                  console.warn("Proposal with invalid signature:", proposalId);
                  resolve(null);
                }
              })
              .catch((err) => {
                console.error("Error verifying proposal:", err);
                resolve(null);
              });
          } catch (err) {
            console.error("Error processing proposal:", err);
            resolve(null);
          }
        });
    });
  }

  /**
   * Gets a user's vote on a proposal
   * @param proposalId - Proposal ID
   * @param userPub - User's public key
   * @returns The vote or null
   */
  private async getUserVote(proposalId: string, userPub: string): Promise<any> {
    return new Promise((resolve) => {
      this.gun
        .get("consensus")
        .get("proposals")
        .get(proposalId)
        .get("votes")
        .get(userPub)
        .once((data: any) => {
          resolve(data || null);
        });
    });
  }

  /**
   * Updates a proposal's status based on votes
   * @param proposalId - Proposal ID
   */
  private async updateProposalStatus(proposalId: string): Promise<void> {
    const result = await this.countVotes(proposalId);

    if (result.totalVotes >= this.config.minVotes) {
      const approval = result.approvalCount / result.totalVotes;

      // If approval threshold is reached
      if (approval >= this.config.threshold) {
        await this.finalizeProposal(proposalId, "approved");
      }
      // If mathematically impossible to reach threshold
      else if (approval + (1 - result.totalVotes) < this.config.threshold) {
        await this.finalizeProposal(proposalId, "rejected");
      }
    }
  }

  /**
   * Counts votes for a proposal
   * @param proposalId - Proposal ID
   * @returns Vote count result
   */
  async countVotes(proposalId: string): Promise<VoteResult> {
    return new Promise((resolve) => {
      let approvalCount = 0;
      let rejectionCount = 0;
      let totalVotes = 0;

      this.gun
        .get("consensus")
        .get("proposals")
        .get(proposalId)
        .get("votes")
        .map()
        .once(async (vote: any, key: string) => {
          if (!vote || key === "_") return;

          try {
            // Verify vote signature
            // We need to parse the data first if it's an object
            const signedData =
              typeof vote === "string" ? JSON.parse(vote) : vote;
            const voterPub = signedData.voter;

            if (!voterPub) {
              console.warn("Vote without public key");
              return;
            }

            const verified = await verify(vote, voterPub);
            if (verified) {
              totalVotes++;
              if (verified.approve) {
                approvalCount++;
              } else {
                rejectionCount++;
              }
            }
          } catch (error) {
            console.error("Error verifying vote:", error);
          }
        });

      // Gun has no way to know when .map() is finished
      setTimeout(() => {
        resolve({
          approved: approvalCount >= this.config.threshold * totalVotes,
          approvalCount,
          rejectionCount,
          totalVotes,
        });
      }, 100);
    });
  }

  /**
   * Finalizes a proposal by updating its status
   * @param proposalId - Proposal ID
   * @param status - New status
   */
  private async finalizeProposal(
    proposalId: string,
    status: "approved" | "rejected",
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.gun
        .get("consensus")
        .get("proposals")
        .get(proposalId)
        .get("status")
        .put(status, (ack: GunAck) => {
          if (ack.err) {
            reject(new Error(ack.err));
            return;
          }
          resolve();
        });
    });
  }

  /**
   * Generates a unique ID
   * @returns Unique ID
   */
  private generateId(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }
}
