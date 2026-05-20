/**
 * addCandidates.js — DEPRECATED
 *
 * This script has been superseded by setupElection.js which:
 *   - Reads all candidates from the database
 *   - Adds them to the blockchain
 *   - Writes blockchain_candidate_id back to the database
 *   - Activates the election
 *
 * Run instead:
 *   node smart-contracts/scripts/setupElection.js
 */
console.error('This script is deprecated. Run: node smart-contracts/scripts/setupElection.js');
process.exit(1);
