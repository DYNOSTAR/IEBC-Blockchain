// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Voting {
    struct Candidate {
        uint256 id;
        string name;
        string party;
        string symbol;
        uint256 voteCount;
        uint256 positionId;
        uint256 locationId;
        bool exists;
    }
    
    struct Position {
        uint256 id;
        string name;
        string level;
        bool exists;
    }
    
    mapping(uint256 => Candidate) public candidates;
    mapping(uint256 => Position) public positions;
    // Keyed by sha256(nationalId) — allows server-signed txns for multiple voters
    mapping(bytes32 => mapping(uint256 => bool)) public hasVotedForPosition;

    uint256 public nextCandidateId;
    uint256 public nextPositionId;
    address public admin;
    bool public electionActive;

    event VoteCast(bytes32 indexed voterIdHash, uint256 indexed positionId, uint256 indexed candidateId);
    event CandidateAdded(uint256 candidateId, string name);
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }
    
    modifier electionIsActive() {
        require(electionActive, "Election not active");
        _;
    }
    
    constructor() {
        admin = msg.sender;
        nextCandidateId = 1;
        nextPositionId = 1;
        electionActive = false;
    }
    
    function addPosition(string memory _name, string memory _level) public onlyAdmin returns (uint256) {
        uint256 positionId = nextPositionId;
        positions[positionId] = Position(positionId, _name, _level, true);
        nextPositionId++;
        return positionId;
    }
    
    function addCandidate(
        string memory _name,
        string memory _party,
        string memory _symbol,
        uint256 _positionId,
        uint256 _locationId
    ) public onlyAdmin returns (uint256) {
        uint256 candidateId = nextCandidateId;
        candidates[candidateId] = Candidate(
            candidateId,
            _name,
            _party,
            _symbol,
            0,
            _positionId,
            _locationId,
            true
        );
        nextCandidateId++;
        emit CandidateAdded(candidateId, _name);
        return candidateId;
    }
    
    // Server calls this once per voter per position, signed with server's ETH private key.
    // _voterIdHash = sha256(nationalId) computed off-chain so no PII touches the chain.
    function vote(
        uint256 _positionId,
        uint256 _candidateId,
        bytes32 _voterIdHash
    ) public onlyAdmin electionIsActive {
        require(!hasVotedForPosition[_voterIdHash][_positionId], "Already voted for this position");
        require(candidates[_candidateId].exists, "Invalid candidate");

        candidates[_candidateId].voteCount++;
        hasVotedForPosition[_voterIdHash][_positionId] = true;
        emit VoteCast(_voterIdHash, _positionId, _candidateId);
    }

    function hasVoterVotedForPosition(bytes32 _voterIdHash, uint256 _positionId) public view returns (bool) {
        return hasVotedForPosition[_voterIdHash][_positionId];
    }
    
    function getCandidatesByPosition(uint256 _positionId) public view returns (uint256[] memory) {
        uint256[] memory temp = new uint256[](nextCandidateId);
        uint256 count = 0;
        
        for (uint256 i = 1; i < nextCandidateId; i++) {
            if (candidates[i].exists && candidates[i].positionId == _positionId) {
                temp[count] = i;
                count++;
            }
        }
        
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = temp[i];
        }
        return result;
    }
    
    function getCandidate(uint256 _candidateId) public view returns (
        string memory name,
        string memory party,
        string memory symbol,
        uint256 voteCount,
        uint256 positionId
    ) {
        Candidate memory c = candidates[_candidateId];
        return (c.name, c.party, c.symbol, c.voteCount, c.positionId);
    }
    
    function activateElection() public onlyAdmin {
        electionActive = true;
    }
    
    function deactivateElection() public onlyAdmin {
        electionActive = false;
    }
}