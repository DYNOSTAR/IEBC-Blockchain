import Web3 from 'web3';
import contractData from './contractABI.json';

// ── Contract address must match contractABI.json ──────────────
// contractABI.json address: 0x40F9E0fb106C65E841F94631cD888384ae58451c
const CONTRACT_ADDRESS = contractData.address;

class BlockchainService {
    constructor() {
        this.web3 = null;
        this.contract = null;
        this.account = null;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return true;

        if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
            try {
                await window.ethereum.request({ method: 'eth_requestAccounts' });

                this.web3 = new Web3(window.ethereum);
                this.contract = new this.web3.eth.Contract(contractData.abi, CONTRACT_ADDRESS);

                const accounts = await this.web3.eth.getAccounts();
                this.account = accounts[0];
                this.initialized = true;

                console.log('✅ Blockchain Service Initialized');
                console.log('Account:', this.account);
                console.log('Contract:', CONTRACT_ADDRESS);

                window.ethereum.on('accountsChanged', (accounts) => {
                    this.account = accounts[0];
                    console.log('Account changed:', this.account);
                });

                return true;
            } catch (error) {
                console.error('Failed to initialize Web3:', error);
                return false;
            }
        } else {
            // Fallback to Ganache direct connection (for testing without MetaMask)
            try {
                this.web3 = new Web3('http://127.0.0.1:7545');
                this.contract = new this.web3.eth.Contract(contractData.abi, CONTRACT_ADDRESS);
                const accounts = await this.web3.eth.getAccounts();
                this.account = accounts[0];
                this.initialized = true;
                console.log('✅ Connected to Ganache directly');
                return true;
            } catch (error) {
                console.error('MetaMask not found and Ganache connection failed:', error);
                return false;
            }
        }
    }

    // ── Check if election is active ───────────────────────────
    // Solidity: bool public electionActive
    async isElectionActive() {
        if (!this.initialized) await this.init();
        try {
            const active = await this.contract.methods.electionActive().call();
            return active;
        } catch (error) {
            console.error('Failed to get election status:', error);
            return false;
        }
    }

    // ── Get candidates for a position ─────────────────────────
    // Solidity: getCandidatesByPosition(uint256 _positionId)
    // NOTE: your contract does NOT have getCandidatesByPositionAndLocation
    // Location filtering is done client-side based on position level
    async getCandidatesByPosition(positionId) {
        if (!this.initialized) await this.init();
        try {
            const candidateIds = await this.contract.methods
                .getCandidatesByPosition(parseInt(positionId))
                .call();

            const candidates = [];
            for (let i = 0; i < candidateIds.length; i++) {
                const id = parseInt(candidateIds[i]);
                if (id === 0) continue;

                const c = await this.contract.methods.getCandidate(id).call();
                candidates.push({
                    id,
                    name: c.name,
                    party: c.party,
                    symbol: c.symbol,
                    voteCount: parseInt(c.voteCount),
                    positionId: parseInt(c.positionId)
                });
            }
            return candidates;
        } catch (error) {
            console.error('Failed to get candidates:', error);
            return [];
        }
    }

    // ── Cast a vote ───────────────────────────────────────────
    // Solidity: vote(uint256 _positionId, uint256 _candidateId, string _verificationCode)
    async castVote(positionId, candidateId, verificationCode) {
        if (!this.initialized) await this.init();
        try {
            const tx = await this.contract.methods
                .vote(
                    parseInt(positionId),
                    parseInt(candidateId),
                    verificationCode
                )
                .send({ from: this.account, gas: 300000 });

            return {
                success: true,
                transactionHash: tx.transactionHash,
                blockNumber: tx.blockNumber,
                verificationCode
            };
        } catch (error) {
            console.error('Vote failed:', error);
            return { success: false, error: error.message };
        }
    }

    // ── Check if voter has voted for a position ───────────────
    // Solidity: hasVotedForPosition(address, uint256)
    async hasVotedForPosition(positionId) {
        if (!this.initialized) await this.init();
        try {
            return await this.contract.methods
                .hasVotedForPosition(this.account, parseInt(positionId))
                .call();
        } catch (error) {
            console.error('Failed to check vote status:', error);
            return false;
        }
    }

    // ── Get candidate details ─────────────────────────────────
    // Solidity: getCandidate(uint256 _candidateId)
    // Returns: name, party, symbol, voteCount, positionId
    async getCandidate(candidateId) {
        if (!this.initialized) await this.init();
        try {
            const c = await this.contract.methods
                .getCandidate(parseInt(candidateId))
                .call();
            return {
                id: parseInt(candidateId),
                name: c.name,
                party: c.party,
                symbol: c.symbol,
                voteCount: parseInt(c.voteCount),
                positionId: parseInt(c.positionId)
            };
        } catch (error) {
            console.error('Failed to get candidate:', error);
            return null;
        }
    }

    // ── Get vote count for a candidate ────────────────────────
    async getVoteCount(candidateId) {
        if (!this.initialized) await this.init();
        try {
            const c = await this.contract.methods
                .getCandidate(parseInt(candidateId))
                .call();
            return parseInt(c.voteCount);
        } catch (error) {
            console.error('Failed to get vote count:', error);
            return 0;
        }
    }

    // ── Admin: activate election ──────────────────────────────
    // Solidity: activateElection() onlyAdmin
    async activateElection() {
        if (!this.initialized) await this.init();
        try {
            const tx = await this.contract.methods
                .activateElection()
                .send({ from: this.account, gas: 200000 });
            return { success: true, transactionHash: tx.transactionHash };
        } catch (error) {
            console.error('Failed to activate election:', error);
            return { success: false, error: error.message };
        }
    }

    // ── Admin: deactivate election ────────────────────────────
    // Solidity: deactivateElection() onlyAdmin
    async deactivateElection() {
        if (!this.initialized) await this.init();
        try {
            const tx = await this.contract.methods
                .deactivateElection()
                .send({ from: this.account, gas: 200000 });
            return { success: true, transactionHash: tx.transactionHash };
        } catch (error) {
            console.error('Failed to deactivate election:', error);
            return { success: false, error: error.message };
        }
    }

    // ── Admin: add candidate ──────────────────────────────────
    // Solidity: addCandidate(string name, string party, string symbol, uint256 positionId, uint256 locationId)
    async addCandidate(name, party, symbol, positionId, locationId = 0) {
        if (!this.initialized) await this.init();
        try {
            const tx = await this.contract.methods
                .addCandidate(name, party, symbol, parseInt(positionId), parseInt(locationId))
                .send({ from: this.account, gas: 300000 });
            return {
                success: true,
                candidateId: parseInt(tx.events.CandidateAdded.returnValues.candidateId)
            };
        } catch (error) {
            console.error('Failed to add candidate:', error);
            return { success: false, error: error.message };
        }
    }

    // ── Admin: add position ───────────────────────────────────
    // Solidity: addPosition(string name, string level) onlyAdmin
    async addPosition(name, level) {
        if (!this.initialized) await this.init();
        try {
            const tx = await this.contract.methods
                .addPosition(name, level)
                .send({ from: this.account, gas: 200000 });
            return { success: true, transactionHash: tx.transactionHash };
        } catch (error) {
            console.error('Failed to add position:', error);
            return { success: false, error: error.message };
        }
    }

    // ── Get next IDs (useful for admin UI) ───────────────────
    async getNextCandidateId() {
        if (!this.initialized) await this.init();
        try {
            return parseInt(await this.contract.methods.nextCandidateId().call());
        } catch { return 1; }
    }

    async getNextPositionId() {
        if (!this.initialized) await this.init();
        try {
            return parseInt(await this.contract.methods.nextPositionId().call());
        } catch { return 1; }
    }

    getAccount() {
        return this.account;
    }

    isConnected() {
        return this.initialized && !!this.account;
    }
}

export default new BlockchainService();