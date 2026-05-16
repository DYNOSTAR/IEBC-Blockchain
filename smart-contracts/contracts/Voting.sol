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
    mapping(address => mapping(uint256 => bool)) public hasVotedForPosition;
    
    uint256 public nextCandidateId;
    uint256 public nextPositionId;
    address public admin;
    bool public electionActive;  // Changed from isElectionActive to electionActive
    
    event VoteCast(address indexed voter, uint256 indexed positionId, uint256 indexed candidateId);
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
    
    function vote(
        uint256 _positionId,
        uint256 _candidateId,
        string memory _verificationCode
    ) public electionIsActive {
        require(!hasVotedForPosition[msg.sender][_positionId], "Already voted");
        require(candidates[_candidateId].exists, "Invalid candidate");
        
        candidates[_candidateId].voteCount++;
        hasVotedForPosition[msg.sender][_positionId] = true;
        emit VoteCast(msg.sender, _positionId, _candidateId);
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